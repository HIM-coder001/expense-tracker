# Expense Tracker

Full-stack personal finance tracker. Log income and expenses, view a summary dashboard with charts, and export records to Excel.

**Stack:** Node.js / Express 5 · MongoDB (Mongoose) · React 19 · Tailwind CSS v4 · Vite

---

## Project structure

```
expense-tracker/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers (auth, income, expense, dashboard, category)
│   ├── middleware/      # protect, validate, upload, errorHandler
│   ├── models/          # User, Income, Expense, Category, RefreshToken
│   ├── routes/          # /api/v1/* route files
│   ├── scripts/         # seedCategories.js
│   ├── validation/      # Zod schemas (authSchemas, incomeSchemas, expenseSchemas, categorySchemas)
│   ├── private_uploads/ # Profile images (not publicly accessible)
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # DashboardLayout, AuthLayout, TransactionForm, TransactionList, Modal, SummaryCard
        ├── context/     # AuthContext
        ├── hooks/       # useIncome, useExpense
        ├── pages/       # Auth/Login, Auth/SignUp, Dashboard/Home, Dashboard/Income, Dashboard/Expense
        └── utils/       # apiPaths, axiosInstance, helper, data
```

---

## Setup

### Prerequisites
- Node.js 20+
- A MongoDB Atlas cluster (or local replica set)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, REFRESH_TOKEN_SECRET (see .env.example for instructions)
npm install
npm run seed      # seeds default categories into the DB (safe to run multiple times)
npm run dev       # starts nodemon on port 5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # starts Vite on port 5173
```

Open `http://localhost:5173` in your browser.

---

## Environment variables

All variables are documented in `backend/.env.example`. The required ones are:

| Variable | Description |
|---|---|
| `MONGO_URI` | Full Atlas connection string |
| `JWT_SECRET` | 64-byte hex secret for access tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (default `15m`) |
| `REFRESH_TOKEN_SECRET` | 64-byte hex secret for refresh tokens |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime (default `7d`) |
| `CLIENT_URL` | Frontend origin for CORS (default `http://localhost:5173`) |
| `UPLOAD_DIR` | Private upload directory (default `private_uploads`) |
| `MAX_FILE_SIZE_MB` | Max upload size in MB (default `5`) |
| `NODE_ENV` | `development` or `production` |

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## API overview

All endpoints are prefixed `/api/v1`. Every response uses the shape:
```json
{ "status": "success" | "error", "data": {}, "message": "", "code": "" }
```

### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Login, returns access token + sets refresh cookie |
| POST | `/refresh` | cookie | Rotate refresh token, return new access token |
| POST | `/logout` | cookie | Revoke refresh token |
| GET | `/getUser` | ✅ | Get current user profile |
| POST | `/upload-image` | ✅ | Upload profile picture |
| GET | `/profile-image` | ✅ | Serve profile picture (authenticated) |

### Income — `/api/v1/income`
| Method | Path | Description |
|---|---|---|
| GET | `/get` | List income (cursor pagination, `?limit=&cursor=&categoryId=`) |
| POST | `/add` | Add income record |
| DELETE | `/:id` | Delete income record (ownership checked) |
| GET | `/downloadexcel` | Export all income as `.xlsx` |

### Expense — `/api/v1/expense`
| Method | Path | Description |
|---|---|---|
| GET | `/get` | List expenses (cursor pagination) |
| POST | `/add` | Add expense record |
| DELETE | `/:id` | Delete expense (ownership checked) |
| GET | `/downloadexcel` | Export all expenses as `.xlsx` |

### Dashboard — `/api/v1/dashboard`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Summary totals + last-60-day category breakdown + recent transactions |

### Categories — `/api/v1/categories`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List system defaults + user's own categories |
| POST | `/` | Create a custom category |
| DELETE | `/:id` | Delete a user-owned category |

### Health — `/api/v1/health`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Returns uptime and DB connection state |

---

## Money representation

- Amounts are stored in the database as **integer minor units** (cents). `$10.50` → `1050`.
- The API accepts and returns amounts in **major units** (`10.50`). Conversion happens in the service layer.
- `currencyCode` (ISO 4217, e.g. `USD`) is stored on every income and expense record. No conversion logic is implemented; that is a planned next step.

---

## Pagination

List endpoints use **cursor-based pagination**:

```
GET /api/v1/income/get?limit=20
→ { income: [...], pagination: { hasNextPage: true, nextCursor: "6b07..." } }

GET /api/v1/income/get?limit=20&cursor=6b07...
→ next page
```

Maximum page size is 100.

---

## Sharding plan (future)

At the current scale (<1,000 users, <500k documents) sharding is not needed. When either `income` or `expense` grows past ~5M documents or query latency degrades:

- Enable a MongoDB Atlas sharded cluster (requires M30+)
- Shard key: `{ userId: "hashed" }` on both `income` and `expense` collections
- This provides even distribution (high userId cardinality) and keeps all of a user's data on a single shard for the common `{ userId }` query pattern
- All existing indexes already include `userId` as the leading key — no index changes required

---

## Running tests

No test suite is implemented yet — see **Recommended next steps** below.

---

## Security checklist

See `SECURITY.md` in this directory.

---

## Recommended next steps

1. **Tests** — unit tests for services (Vitest + mongodb-memory-server), integration tests for every endpoint including auth failures and NoSQL injection attempts
2. **Budget model** — the `Expense` model has a `budgetId` stub comment; wire it up once the product decision is made
3. **Recurring rules** — same pattern; `recurringRuleId` stub is in `Expense`
4. **Multi-currency conversion** — add an exchange-rate service; the `currencyCode` field is already on every record
5. **Redis caching** — cache the dashboard aggregation with a 5-minute TTL, invalidated on any income/expense write for that user
6. **BullMQ background jobs** — move Excel export generation off the request thread for large datasets
7. **Structured logging** — replace `console.error` with pino or winston, add request IDs (use `crypto.randomUUID()` per request)
8. **Docker Compose** — `app` + `mongo` replica set (required for multi-document transactions) + `redis`
9. **OpenAPI/Swagger** — generate from Zod schemas using `zod-to-openapi`
10. **migrate-mongo** — add versioned migrations before any schema changes touch production data
11. **CI pipeline** — lint → audit → test on every push (GitHub Actions)
12. **Atlas IP allowlist** — restrict to your server's static IP only
