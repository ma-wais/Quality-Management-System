# QMS Pro - Complete Setup & Deployment Guide

# Table of Contents

1. [System Overview](#1-system-overview)
2. [Connecting Your Own PostgreSQL Database](#2-connecting-your-own-postgresql-database)
3. [Two-Environment Hosting Setup](#3-two-environment-hosting-setup)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Build & Run Commands](#5-build--run-commands)
6. [Database Schema Migration](#6-database-schema-migration)
7. [Default Users & First Login](#7-default-users--first-login)
8. [Security Checklist](#8-security-checklist)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. System Overview

| Item              | Detail                                         |
|-------------------|-------------------------------------------------|
| Language          | TypeScript (frontend and backend)               |
| Frontend          | React + Vite + Tailwind CSS + Shadcn UI         |
| Backend           | Express.js (Node.js)                            |
| Database          | PostgreSQL (any provider)                       |
| ORM               | Drizzle ORM                                     |
| Authentication    | Session-based (express-session + PostgreSQL)     |
| Approximate Size  | 30+ pages, 34+ tables, 50+ API endpoints        |

---

## 2. Connecting Your Own PostgreSQL Database

The application connects to PostgreSQL using a single environment variable called `DATABASE_URL`. You just need to point this to your own database.

### Step 1: Get Your Database Connection String

Your PostgreSQL provider will give you a connection string. It looks like this:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?sslmode=require
```

**Examples by provider:**

| Provider          | Example Connection String                                                        |
|-------------------|----------------------------------------------------------------------------------|
| Neon              | `postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/mydb?sslmode=require` |
| Supabase          | `postgresql://postgres.abcdef:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres`     |
| AWS RDS           | `postgresql://admin:pass@mydb.abc123.us-east-1.rds.amazonaws.com:5432/qmsdb?sslmode=require` |
| DigitalOcean      | `postgresql://doadmin:pass@db-postgresql-nyc1-12345-do-user.ondigitalocean.com:25060/qmsdb?sslmode=require` |
| Railway           | `postgresql://postgres:pass@containers-us-west-123.railway.app:5432/railway`     |
| Self-hosted       | `postgresql://qmsuser:pass@your-server-ip:5432/qmsdb`                            |

### Step 2: Set the Environment Variable

Replace the `DATABASE_URL` with your own connection string.

**On Linux/Mac (terminal):**
```bash
export DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?sslmode=require"
```

**On Windows (PowerShell):**
```powershell
$env:DATABASE_URL = "postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?sslmode=require"
```

**In a `.env` file** (create this file in the project root):
```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?sslmode=require
SESSION_SECRET=your-random-secret-string-at-least-32-characters
```

> **Important:** The `.env` file should NEVER be committed to version control. Add it to `.gitignore`.

### Step 3: Create the Database Tables

Once your `DATABASE_URL` is set, run:

```bash
npm run db:push
```

This will automatically create all 34+ tables in your database. No manual SQL needed.

### Step 4: Verify the Connection

Start the application:

```bash
npm run dev
```

If you see `serving on port 5000` without errors, the database is connected. The app will automatically create two default user accounts on first startup.

### Files That Use the Database Connection

Only these files reference the database. No changes are needed in them - they all read from `DATABASE_URL`:

| File                | Purpose                                    |
|---------------------|--------------------------------------------|
| `server/db.ts`      | Creates the PostgreSQL connection pool     |
| `server/index.ts`   | Uses the pool for session storage          |
| `drizzle.config.ts` | Used by `npm run db:push` for migrations   |

---

## 3. Two-Environment Hosting Setup

This section covers setting up two separate environments: **Staging** (for testing) and **Production** (for real users).

### Architecture Overview

```
                    +------------------+
                    |   Your Code      |
                    |   (Git Repo)     |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v---------+         +--------v---------+
     |    STAGING        |         |   PRODUCTION      |
     |                   |         |                   |
     | Server: Node.js   |         | Server: Node.js   |
     | Port: 5000        |         | Port: 5000        |
     | DB: staging_qms   |         | DB: production_qms|
     |                   |         |                   |
     | URL:              |         | URL:              |
     | staging.your.com  |         | qms.your.com      |
     +-------------------+         +-------------------+
```

### Option A: Hosting on a VPS (DigitalOcean, AWS EC2, Hetzner, etc.)

#### A1. Server Requirements

| Resource     | Staging          | Production (up to 100 users) |
|-------------|------------------|------------------------------|
| CPU          | 1 vCPU           | 2 vCPUs                      |
| RAM          | 1 GB             | 4 GB                         |
| Storage      | 10 GB SSD        | 20 GB SSD                    |
| OS           | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS             |

#### A2. Install Prerequisites on Each Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x

# Install PostgreSQL (if hosting DB on same server)
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager to keep the app running)
sudo npm install -g pm2
```

#### A3. Set Up PostgreSQL Databases

```bash
# Switch to postgres user
sudo -u postgres psql

# Create databases and users
CREATE USER qms_staging WITH PASSWORD 'your-staging-password-here';
CREATE DATABASE qms_staging OWNER qms_staging;

CREATE USER qms_production WITH PASSWORD 'your-production-password-here';
CREATE DATABASE qms_production OWNER qms_production;

# Exit
\q
```

#### A4. Deploy the Application Code

```bash
# Create app directory
sudo mkdir -p /var/www/qms-staging
sudo mkdir -p /var/www/qms-production

# Clone your code (replace with your actual repo)
cd /var/www/qms-staging
git clone YOUR_REPO_URL .

cd /var/www/qms-production
git clone YOUR_REPO_URL .

# Install dependencies in each
cd /var/www/qms-staging && npm install
cd /var/www/qms-production && npm install
```

#### A5. Create Environment Files

**Staging** (`/var/www/qms-staging/.env`):
```env
DATABASE_URL=postgresql://qms_staging:your-staging-password-here@localhost:5432/qms_staging
SESSION_SECRET=staging-random-secret-change-this-to-something-long-and-random
NODE_ENV=production
PORT=5001
```

**Production** (`/var/www/qms-production/.env`):
```env
DATABASE_URL=postgresql://qms_production:your-production-password-here@localhost:5432/qms_production
SESSION_SECRET=production-random-secret-change-this-to-something-different
NODE_ENV=production
PORT=5002
```

#### A6. Build and Initialize Each Environment

Run these commands for **both** staging and production directories:

```bash
# Go to the app directory
cd /var/www/qms-staging   # or /var/www/qms-production

# Push the database schema (creates all tables)
npx drizzle-kit push

# Build the frontend for production
npm run build

# Test that it starts
npm run start
# You should see "serving on port 5001" (or 5002)
# Press Ctrl+C to stop
```

#### A7. Set Up PM2 Process Manager

PM2 keeps the app running and restarts it if it crashes.

**Staging:**
```bash
cd /var/www/qms-staging
pm2 start npm --name "qms-staging" -- run start
```

**Production:**
```bash
cd /var/www/qms-production
pm2 start npm --name "qms-production" -- run start
```

**Save and enable auto-start on reboot:**
```bash
pm2 save
pm2 startup
# Follow the command it outputs
```

**Useful PM2 commands:**
```bash
pm2 list                    # See all running apps
pm2 logs qms-production     # View production logs
pm2 restart qms-production  # Restart production
pm2 stop qms-staging        # Stop staging
```

#### A8. Configure Nginx Reverse Proxy

This maps your domains to the correct app.

**Staging** (`/etc/nginx/sites-available/qms-staging`):
```nginx
server {
    listen 80;
    server_name staging.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Production** (`/etc/nginx/sites-available/qms-production`):
```nginx
server {
    listen 80;
    server_name qms.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the sites:**
```bash
sudo ln -s /etc/nginx/sites-available/qms-staging /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/qms-production /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

#### A9. Add SSL Certificates (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates (run for each domain)
sudo certbot --nginx -d staging.yourdomain.com
sudo certbot --nginx -d qms.yourdomain.com

# Auto-renewal is set up automatically
# Test it with:
sudo certbot renew --dry-run
```

After SSL is enabled, update the session cookie in `server/index.ts` for production. In the cookie configuration, change `secure: false` to `secure: true` so cookies are only sent over HTTPS.

#### A10. DNS Configuration

In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.), add these DNS records:

| Type | Name     | Value              | TTL  |
|------|----------|--------------------|------|
| A    | staging  | YOUR_SERVER_IP     | 3600 |
| A    | qms      | YOUR_SERVER_IP     | 3600 |

---

### Option B: Hosting on a Platform (Railway, Render, Fly.io)

These platforms handle servers for you. You just push code.

#### Railway (Recommended for Simplicity)

1. **Go to** [railway.app](https://railway.app) and create an account
2. **Create 2 projects**: `qms-staging` and `qms-production`
3. **In each project:**
   - Click "New Service" > "GitHub Repo" > select your repo
   - Click "New Service" > "Database" > "PostgreSQL"
   - Railway auto-sets `DATABASE_URL` for you
4. **Add environment variables** in each project's settings:
   ```
   SESSION_SECRET=your-unique-random-secret
   NODE_ENV=production
   ```
5. **Set the build and start commands** in service settings:
   ```
   Build: npm install && npx drizzle-kit push && npm run build
   Start: npm run start
   ```
6. **Set up custom domains** in each project's settings:
   - Staging: `staging.yourdomain.com`
   - Production: `qms.yourdomain.com`
7. Railway provides free SSL automatically.

#### Render

1. **Go to** [render.com](https://render.com) and create an account
2. **Create 2 PostgreSQL databases**: `qms-staging-db` and `qms-production-db`
3. **Create 2 Web Services** linked to your repo
4. **For each service, set:**
   - Build command: `npm install && npx drizzle-kit push && npm run build`
   - Start command: `npm run start`
   - Environment variables:
     ```
     DATABASE_URL=<from your Render database>
     SESSION_SECRET=your-unique-random-secret
     NODE_ENV=production
     ```

---

### Deployment Workflow (How to Push Updates)

Once both environments are set up, follow this workflow:

```
Developer makes changes
        |
        v
Push to Git (staging branch)
        |
        v
Deploy to STAGING
        |
        v
Test on staging.yourdomain.com
        |
        v
If everything works, merge to main branch
        |
        v
Deploy to PRODUCTION
        |
        v
Live on qms.yourdomain.com
```

**For VPS (manual deploy):**
```bash
# Deploy to staging
cd /var/www/qms-staging
git pull origin staging
npm install
npx drizzle-kit push
npm run build
pm2 restart qms-staging

# Deploy to production (after staging is verified)
cd /var/www/qms-production
git pull origin main
npm install
npx drizzle-kit push
npm run build
pm2 restart qms-production
```

**For Railway/Render:** Deploys happen automatically when you push to the connected branch.

---

## 4. Environment Variables Reference

| Variable       | Required | Description                                    | Example                                    |
|---------------|----------|------------------------------------------------|--------------------------------------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string                   | `postgresql://user:pass@host:5432/dbname`  |
| `SESSION_SECRET` | Yes    | Secret key for encrypting session cookies      | Any random string, 32+ characters          |
| `NODE_ENV`     | Yes      | Set to `production` for deployed environments  | `production`                               |
| `PORT`         | No       | Server port (defaults to 5000)                 | `5000`                                     |

**How to generate a good SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 5. Build & Run Commands

| Command           | Purpose                                          |
|-------------------|--------------------------------------------------|
| `npm install`     | Install all dependencies                         |
| `npm run dev`     | Start in development mode (with hot reload)      |
| `npm run build`   | Build frontend for production                    |
| `npm run start`   | Start in production mode (after building)        |
| `npm run db:push` | Create/update all database tables                |

**Full first-time setup sequence:**
```bash
npm install
export DATABASE_URL="your-connection-string"
export SESSION_SECRET="your-secret"
npm run db:push
npm run build
npm run start
```

---

## 6. Database Schema Migration

When you update the code and there are database changes:

```bash
# This compares your schema file with the actual database
# and applies any new tables or columns automatically
npx drizzle-kit push
```

This is safe to run repeatedly. It will only make changes if the schema has been updated.

**To see what changes would be made without applying them:**
```bash
npx drizzle-kit push --dry-run
```

---

## 7. Default Users & First Login

The application automatically creates two default accounts on first startup:

| Role             | Email           | Password    |
|-----------------|-----------------|-------------|
| System Admin     | saloua@edsa.ae  | Admin@2024  |
| Quality Manager  | qm@edsa.ae     | Qm@2024     |

**Important:** After your first login, go to the User Management page and:
1. Change the default passwords
2. Create accounts for your actual team members
3. Assign appropriate roles (Admin, Quality Manager, Auditor, Upper Management, Normal User)

---

## 8. Security Checklist

Before going live with production, verify:

- [ ] `SESSION_SECRET` is a long, random, unique string (different for staging and production)
- [ ] `DATABASE_URL` passwords are strong and unique per environment
- [ ] SSL/HTTPS is enabled (certificates installed)
- [ ] Default user passwords have been changed
- [ ] `.env` file is in `.gitignore` (never committed to Git)
- [ ] Database backups are scheduled (daily recommended)
- [ ] Session cookie `secure` flag is set to `true` in `server/index.ts` for production
- [ ] Firewall is configured (only ports 80 and 443 open to public)
- [ ] PostgreSQL is not exposed to the internet (only accessible from the app server)

---

## 9. Troubleshooting

### "DATABASE_URL must be set" error
The environment variable is not loaded. Make sure:
- Your `.env` file exists in the project root
- Or the variable is exported in your shell session
- Or it is set in your hosting platform's environment settings

### "Connection refused" to database
- Check the database host/port are correct
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check if SSL is required: add `?sslmode=require` to the connection string
- Verify firewall allows the connection

### Tables not created
Run `npx drizzle-kit push` again. If it fails, check:
- Database user has CREATE TABLE permissions
- Connection string is correct

### "Not authenticated" after login
- Clear browser cookies and try again
- Check that `SESSION_SECRET` is set
- Ensure the `user_sessions` table exists in the database

### Application won't start on production
- Verify you ran `npm run build` first
- Check `NODE_ENV=production` is set
- Review logs: `pm2 logs qms-production` (VPS) or check platform logs

### Blank page after deployment
- The frontend build may have failed. Run `npm run build` again and check for errors
- Ensure static files are being served (check `server/static.ts` exists)
