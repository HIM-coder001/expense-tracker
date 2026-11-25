# Security checklist

## ✅ Done

### Credentials & secrets
- [x] `.env` is in `.gitignore` — never committed
- [x] `.env.example` documents every variable without real values
- [x] Atlas password and JWT secret rotated before any code was written
- [x] No secrets hardcoded anywhere in source

### Authentication
- [x] Passwords hashed with bcrypt (cost factor 12)
- [x] Short-lived access tokens (15 min, JWT HS256)
- [x] Rotating refresh tokens stored as SHA-256 hashes in DB (never plaintext)
- [x] Refresh tokens in `httpOnly; Secure; SameSite` cookies — not accessible to JS
- [x] Refresh token reuse detection: presenting a rotated token revokes the entire family
- [x] Logout revokes the refresh token in the DB
- [x] TTL index auto-expires old refresh token documents

### Authorization
- [x] Every protected route requires a valid JWT (`protect` middleware)
- [x] Every DB query scoped by `userId` — no fetch-by-id-alone (prevents IDOR)
- [x] Users cannot delete system categories (`userId: null` guard in controller)
- [x] Profile image endpoint is authenticated; image served only to the owner
- [x] `protect` middleware does not hit the DB on every request (JWT is trusted after verification)

### Input validation & injection
- [x] Zod schema validation on every endpoint — unknown fields stripped, types coerced
- [x] NoSQL injection prevented: keys starting with `$` or containing `.` stripped from `req.body` and `req.params`
- [x] `req.query` injection blocked by Zod (operator objects fail type check — `expected string, received object`)
- [x] No `$where` or server-side JS used anywhere
- [x] Mass assignment protected — only whitelisted fields passed to `Model.create()`
- [x] `profileImageUrl` not accepted from `req.body` on register — only set via authenticated upload route

### Transport & headers
- [x] `helmet` sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy` and others
- [x] CORS restricted to `CLIENT_URL` only, not `*`
- [x] `credentials: true` with explicit origin (not wildcard) for cookie support
- [x] JSON body size capped at 50 KB

### Rate limiting
- [x] Auth endpoints (`/login`, `/register`): 20 requests per 15 minutes per IP
- [x] All other API endpoints: 300 requests per 15 minutes per IP
- [x] Standard rate-limit headers returned (`RateLimit-*`)

### File uploads
- [x] Upload directory (`private_uploads/`) is outside any static-serve path
- [x] Files served only through an authenticated, ownership-checked route (`GET /api/v1/auth/profile-image`)
- [x] Random UUID filename — prevents original filename path traversal and enumeration
- [x] MIME type allowlist enforced in Multer (`image/jpeg`, `image/png`, `image/webp`)
- [x] File size capped at `MAX_FILE_SIZE_MB` (default 5 MB) in Multer
- [x] Upload endpoint requires authentication (`protect` middleware)
- [x] Old profile image deleted from disk when a new one is uploaded

### Error handling & logging
- [x] Global error handler — raw stack traces never sent to clients in production
- [x] `error.message` not exposed in 500 responses in production
- [x] Consistent error shape (`{ status, code, message, details }`)
- [x] No sensitive data logged (passwords, tokens never appear in `console.*`)

### Data model
- [x] Money stored as integer minor units (cents) — no floating-point currency arithmetic
- [x] `currencyCode` on every income and expense record
- [x] Compound indexes on `{ userId, date }` and `{ userId, categoryId, date }` for real query patterns
- [x] TTL index on `RefreshToken.expiresAt`

### Dependencies
- [x] `xlsx` (vulnerable, abandoned) replaced with `exceljs`
- [x] `npm audit fix` run — remaining moderate findings are in `nodemon` (dev-only) and are non-exploitable in this context

---

## ⚠️ Known gaps (recommended next steps)

| Gap | Risk | Mitigation |
|---|---|---|
| No CSRF token | Medium — mitigated by `SameSite=strict` in production, but not dev | Add `csurf` or double-submit cookie when moving to production |
| No request ID in logs | Low — harder to correlate errors | Add `crypto.randomUUID()` per request, attach to all log lines |
| Disk storage for uploads | Medium at scale | Move to S3/Cloudinary with signed URLs for multi-instance deployments |
| No automated tests | High — regressions can't be caught | Add Vitest unit + integration tests (see README) |
| Atlas IP allowlist | High if not set | Restrict to server IP only in Atlas → Network Access |
| No account lockout | Medium | Track failed login attempts per email, lock after N failures |

---

## OWASP coverage

| OWASP API Top 10 | Status |
|---|---|
| API1 — Broken Object Level Authorization | ✅ All queries scoped by `userId` |
| API2 — Broken Authentication | ✅ Short-lived tokens, refresh rotation, bcrypt |
| API3 — Broken Object Property Level Authorization | ✅ Mass assignment protected, response projections used |
| API4 — Unrestricted Resource Consumption | ✅ Body size limit, file size limit, rate limiting |
| API5 — Broken Function Level Authorization | ✅ `protect` on all data routes; system categories protected |
| API6 — Unrestricted Access to Sensitive Business Flows | ✅ Rate limiting on auth; validation on all inputs |
| API7 — Server Side Request Forgery | ✅ No user-supplied URLs fetched server-side |
| API8 — Security Misconfiguration | ✅ Helmet, CORS allowlist, no default routes exposed |
| API9 — Improper Inventory Management | ✅ All routes versioned under `/api/v1` |
| API10 — Unsafe Consumption of APIs | ✅ No third-party API calls yet |
