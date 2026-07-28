# Pariprashna — Deployment Guide (Re-deployment)

This guide covers redeploying Pariprashna on **new Render and Vercel accounts** while reusing the existing MongoDB Atlas database and API keys from the previous project.

> ℹ️ Since you are reusing the same `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, and `GEMINI_API_KEY`, you do **not** need to create a new database or generate new keys. Just copy them from your previous project's environment variables.

---

## Prerequisites

- The project pushed to a **GitHub repository** (accessible from the new Google account)
- Your existing environment variables from the previous deployment:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `GROQ_API_KEY`
  - `GEMINI_API_KEY` (optional)
  - `GOOGLE_CLIENT_ID` (optional)
  - `GOOGLE_CLIENT_SECRET` (optional)

---

## Step 1: Push Code to GitHub

If not already pushed, create a new repository from your new account:

```bash
cd "Intern Deployment /Pariprashna"
git init
git add .
git commit -m "Pariprashna v1.0 - fresh deployment"
git branch -M main
git remote add origin https://github.com/<NEW_USERNAME>/Pariprashna.git
git push -u origin main
```

> If the repo already exists on GitHub, skip this step.

---

## Step 2: Deploy Backend on Render

### 2.1 Create Web Service

1. Go to [Render](https://render.com) → Sign in with your **new Google account**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the **Pariprashna** repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `pariprashna-api` |
| **Region** | Singapore (or closest to your users) |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |
| **Instance Type** | `Free` |

### 2.2 Add Environment Variables

Go to **"Environment"** tab and add these (copy values from your previous project):

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Same for all deployments |
| `PORT` | `5000` | Same for all deployments |
| `MONGODB_URI` | *(copy from previous project)* | Same database, same data |
| `JWT_SECRET` | *(copy from previous project)* | Same secret so existing tokens remain valid |
| `CLIENT_URL` | `https://<your-app>.vercel.app` | ⚠️ Update after Step 3 |
| `SITE_URL` | `https://pariprashna-api.onrender.com` | Will match your Render URL |
| `GROQ_API_KEY` | *(copy from previous project)* | Same Groq account |
| `GEMINI_API_KEY` | *(copy from previous project)* | Same Gemini key |
| `GOOGLE_CLIENT_ID` | *(copy from previous project, if using)* | Same Google OAuth app |
| `GOOGLE_CLIENT_SECRET` | *(copy from previous project, if using)* | Same Google OAuth app |

### 2.3 Deploy

1. Click **"Create Web Service"**
2. Wait for the build to finish (2–5 minutes)
3. Note your backend URL (e.g., `https://pariprashna-api.onrender.com`)

### 2.4 Verify

Open in browser:
```
https://<YOUR_RENDER_URL>/api/health
```

You should see:
```json
{ "status": "ok", "timestamp": "..." }
```

Since you're using the same `MONGODB_URI`, all your **existing users, questions, answers, and data** will be available immediately.

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Import Project

1. Go to [Vercel](https://vercel.com) → Sign in with your **new Google account**
2. Click **"Add New..."** → **"Project"**
3. Connect your GitHub account and import the **Pariprashna** repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Create React App` |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |

### 3.2 Add Environment Variable

Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://<YOUR_RENDER_URL>/api` |

> Example: `https://pariprashna-api.onrender.com/api`

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait for the build to finish (1–3 minutes)
3. Note your frontend URL (e.g., `https://pariprashna.vercel.app`)

---

## Step 4: Update Cross-References

### 4.1 Update CLIENT_URL on Render

Now that you have the Vercel URL:

1. Go to Render Dashboard → Your service → **"Environment"**
2. Update `CLIENT_URL` to your actual Vercel URL:
   ```
   https://pariprashna.vercel.app
   ```
3. Update `SITE_URL` to your actual Render URL:
   ```
   https://pariprashna-api.onrender.com
   ```
4. Click **"Save Changes"** → Render will auto-redeploy

### 4.2 Update Google OAuth Redirect (if using Google Login)

If you're using Google OAuth with the same Google Cloud project:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Edit your OAuth Client ID
3. Add your **new** Render URL as an authorized redirect URI:
   ```
   https://<YOUR_RENDER_URL>/api/auth/google/callback
   ```
4. Add your **new** Vercel URL as an authorized JavaScript origin:
   ```
   https://pariprashna.vercel.app
   ```
5. (Optional) Remove the old Render/Vercel URLs if the previous deployment is being decommissioned

---

## Step 5: Verify Everything Works

| Test | URL | Expected |
|------|-----|----------|
| Health Check | `https://<RENDER_URL>/api/health` | `{"status":"ok"}` |
| Homepage | `https://<VERCEL_URL>/` | Pariprashna loads with existing data |
| Login | `https://<VERCEL_URL>/login` | Login with existing credentials works |
| Questions | `https://<VERCEL_URL>/questions` | All existing questions visible |
| AI Chat | `https://<VERCEL_URL>/chat` (after login) | AI responds |
| Admin Panel | `https://<VERCEL_URL>/admin` (admin account) | Dashboard loads with stats |

---

## Step 6: Update Documentation Links

After deployment is live, update the URLs in `README.md`:

```markdown
| **Frontend** | https://<YOUR_VERCEL_URL> |
| **Backend API** | https://<YOUR_RENDER_URL> |
| **GitHub Repository** | https://github.com/<YOUR_USERNAME>/Pariprashna |
```

---

## Environment Variables — Quick Copy Checklist

Use this checklist to make sure you've copied everything:

### Render (Backend) — 10 variables

```
☐ NODE_ENV=production
☐ PORT=5000
☐ MONGODB_URI=<copied from previous>
☐ JWT_SECRET=<copied from previous>
☐ CLIENT_URL=<your new Vercel URL>
☐ SITE_URL=<your new Render URL>
☐ GROQ_API_KEY=<copied from previous>
☐ GEMINI_API_KEY=<copied from previous>
☐ GOOGLE_CLIENT_ID=<copied from previous, optional>
☐ GOOGLE_CLIENT_SECRET=<copied from previous, optional>
```

### Vercel (Frontend) — 1 variable

```
☐ REACT_APP_API_URL=<your new Render URL>/api
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend returns 500 on first load | Render free tier cold start — wait 30–50 seconds |
| CORS errors in browser console | `CLIENT_URL` on Render doesn't match your Vercel URL exactly (check for trailing slash) |
| Login works but Google login fails | Update OAuth redirect URIs in Google Cloud Console (Step 4.2) |
| Data is empty / no questions | Check `MONGODB_URI` — make sure it's the same as the previous project |
| AI not responding | Verify `GROQ_API_KEY` is set correctly on Render |
| "Token is not valid" errors | If you changed `JWT_SECRET`, existing logged-in users need to re-login |

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| MongoDB Atlas M0 | 512 MB storage |
| Render Free | 512 MB RAM, sleeps after 15 min inactivity |
| Vercel Hobby | 100 GB bandwidth/month |
| Groq Free | 14,400 requests/day |

> ⚠️ Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30–50 seconds to respond.

---

*Guide for Pariprashna re-deployment — July 2026*
