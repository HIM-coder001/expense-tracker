# Deployment Guide

## Quick Start (Docker Compose)

### 1. Generate secrets

Run these once and save the output:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — one value for JWT_SECRET, one for REFRESH_TOKEN_SECRET
```

### 2. Create a root `.env` file

```env
# MongoDB (use Atlas in production — free tier is fine to start)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/expense-tracker

# Auth secrets (use the generated values from step 1)
JWT_SECRET=your_64_byte_hex_secret
REFRESH_TOKEN_SECRET=your_other_64_byte_hex_secret

# Frontend URL (your domain in production)
CLIENT_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Email (SendGrid example)
EMAIL_FROM=ExpenseTracker <no-reply@yourdomain.com>
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### 3. Deploy

```bash
docker compose up -d --build
```

---

## Platform-Specific Guides

### Railway (simplest — no Docker needed)

1. Push code to GitHub
2. Create a new project on [railway.app](https://railway.app)
3. Add a MongoDB service, copy the connection string
4. Deploy the `backend/` folder — set env vars in Railway dashboard
5. Deploy the `frontend/` folder — set `VITE_API_URL` to your backend Railway URL
6. Railway handles HTTPS automatically

### Render

Backend:
- New Web Service → connect GitHub repo → Root Directory: `backend`
- Build command: `npm ci`
- Start command: `node server.js`
- Add all env vars in the Environment tab

Frontend:
- New Static Site → Root Directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Add `VITE_API_URL` env var

### VPS / DigitalOcean Droplet

1. Install Docker and Docker Compose on the server
2. Clone the repo: `git clone your-repo`
3. Create the `.env` file
4. Run: `docker compose up -d --build`
5. Point your domain to the server IP
6. Add Nginx + Let's Encrypt for HTTPS (Certbot):
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

---

## Pre-deployment Checklist

- [ ] Strong `JWT_SECRET` and `REFRESH_TOKEN_SECRET` (64 bytes hex)
- [ ] `NODE_ENV=production` set
- [ ] MongoDB Atlas cluster (not local) with backups enabled
- [ ] Real SMTP credentials (SendGrid/Resend/Mailgun)
- [ ] `CLIENT_URL` set to your actual frontend domain
- [ ] HTTPS configured (cookies won't work without it in production)
- [ ] `.env` NOT committed to git (check `.gitignore`)
- [ ] Seed categories: `node scripts/seedCategories.js`

---

## Seed Categories (first deploy)

After deploying the backend, run once:

```bash
# If using Docker
docker exec -it expense-tracker-backend node scripts/seedCategories.js

# If running directly
cd backend && node scripts/seedCategories.js
```
