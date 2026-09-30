# LaunchOps AI — Complete Deployment Guide

This guide walks you through deploying **LaunchOps AI** into production across three interconnected cloud platforms:
1. **Supabase** (Managed PostgreSQL Database)
2. **Render** (Node.js & Express API Backend)
3. **Vercel** (React & Vite Static Frontend with SPA Rewrites)

---

## Architecture Topology

```
┌─────────────────────────┐          ┌──────────────────────────┐          ┌───────────────────────────┐
│     Vercel Frontend     │  HTTPS   │      Render Backend      │   pg     │    Supabase PostgreSQL    │
│  (React 19 + Tailwind)  │ ───────> │  (Express + JWT + Zod)   │ ───────> │    (Session Pooler:5432)  │
│  launchops.vercel.app   │          │ launchops-api.onrender   │          │  db.project.supabase.co   │
└─────────────────────────┘          └────────────┬─────────────┘          └───────────────────────────┘
                                                  │
                                                  │ REST (Strict Schema)
                                                  ▼
                                     ┌──────────────────────────┐
                                     │    Google Gemini API     │
                                     │     (gemini-1.5-flash)   │
                                     └──────────────────────────┘
```

---

## 1. Database Setup: Supabase PostgreSQL

1. Log in to [Supabase](https://supabase.com) and click **New project**.
2. Set a **Project Name** (e.g. `launchops-db`) and generate a strong database password.
3. Once provisioned, navigate to **Project Settings** → **Database**.
4. In the **Connection string** section:
   - For persistent cloud backends (like Render), select **Session Pooler** (`port 5432` or `port 6543`).
   - Copy the URI in the format:
     ```text
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
5. Navigate to the **SQL Editor** tab in the Supabase Dashboard:
   - Copy the full content of `backend/migrations/001_initial_schema.sql` and run it to create tables, indexes, and constraints.
   - Alternatively, you can run migrations locally with:
     ```bash
     cd backend
     DATABASE_URL="your-supabase-connection-string" npm run migrate
     DATABASE_URL="your-supabase-connection-string" npm run seed
     ```

---

## 2. Backend Deployment: Render (Web Service)

1. Log in to [Render](https://render.com) and click **New** → **Web Service**.
2. Connect your GitHub repository: `launchops-ai`.
3. Configure the service parameters:
   - **Name:** `launchops-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (or Starter)
4. Add the following **Environment Variables** in the Render settings:

| Variable Name | Example Value / Purpose |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | Strong random 32+ character secret string |
| `GEMINI_API_KEY` | Your Google Gemini API Key from Google AI Studio |
| `GEMINI_MODEL` | `gemini-1.5-flash` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (or `*` during initial testing) |
| `PORT` | `5000` (Render will bind automatically via `0.0.0.0`) |

5. Click **Create Web Service**. Once deployed, Render will provide a public URL like:
   `https://launchops-backend.onrender.com`.
6. Test your live deployment health check:
   ```bash
   curl https://launchops-backend.onrender.com/health
   ```

---

## 3. Frontend Deployment: Vercel (Vite App)

1. Log in to [Vercel](https://vercel.com) and click **Add New** → **Project**.
2. Import the `launchops-ai` repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click edit and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the **Environment Variable**:

| Variable Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://launchops-backend.onrender.com/api` |

> **Security Note:** Never expose `GEMINI_API_KEY` or `DATABASE_URL` on the frontend. The `VITE_` prefix exposes variables to the browser bundle. Gemini is called strictly from Express.

5. Click **Deploy**. Vercel will build the frontend bundle.
6. Verify SPA Routing: The included `frontend/vercel.json` guarantees that refreshing any React Router URL (e.g. `https://your-app.vercel.app/projects/proj-acme-01`) succeeds without 404 errors.

---

## 4. Post-Deployment Verification Checklist

- [ ] **Cross-Workspace Protection:** Requests attempting to query projects from another organization return `403 Forbidden`.
- [ ] **AI Plan Extraction:** Uploading kickoff notes and clicking **Generate Plan** returns validated structured tasks with paragraph citations.
- [ ] **Manager Approval:** Only accounts with the `Manager` or `Administrator` role can approve proposals. Repeated approval attempts return `400 Bad Request`.
- [ ] **Workflow Automation:** Marking a prerequisite task (e.g. Security Review) as `Completed` instantly unblocks dependent tasks (e.g. IT Okta SSO) and creates in-app notifications.
- [ ] **AI Blocker Inquiries:** Asking *"What is preventing Acme from launching?"* yields grounded answers with task and document citations.
