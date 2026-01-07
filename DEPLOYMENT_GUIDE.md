# Full Deployment Guide - Backend + Frontend

## Overview
1. ✅ Database: Already on MongoDB Atlas (cloud)
2. 🔄 Backend: Deploy to **Render** (API server)
3. 🔄 Frontend: Deploy to **Vercel** (web hosting)

---

## STEP 1: Deploy Backend to Render (15 minutes)

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (easier)
3. Authorize Render to access your repositories

### 1.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `electrical-crm`
3. Configure the service:

**Basic Settings:**
- **Name**: `electrical-crm-backend` (or your choice)
- **Region**: Choose closest to you (e.g., Oregon, Ohio)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`

**Instance Type:**
- Select **"Free"** ($0/month)
- Note: Free tier spins down after 15 min of inactivity (first request takes ~30 sec)

### 1.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these **EXACT** variables:

```
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://meselectrical:fdJI2UcbMDwQXZDC@cluster1mes.ijhlfur.mongodb.net/electrical-crm?retryWrites=true&w=majority&appName=Cluster1MES
JWT_SECRET=1c44e3eec2922212e4d3de48e8e6b33c8d93aee06fc604445ad9171a3657b87e
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=b0425739636f3f24ee2ff494f61d3b64a28832d2237eb2aafc7236dd1fe5500c
GOOGLE_CLIENT_ID=1013633694578-q8tkun1vn87u1q2pmis1o6rt5gm55j0v.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**IMPORTANT:**
- `FRONTEND_URL` will be added after frontend deployment
- `GOOGLE_REDIRECT_URI` will be updated with Render URL

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. You'll get a URL like: `https://electrical-crm-backend.onrender.com`

### 1.5 Test Backend Deployment
Once deployed, test it:
```bash
curl https://your-backend-url.onrender.com/api/auth/me
```

Should return: `{"error":"No authentication token provided"}`

✅ If you see this, backend is working!

---

## STEP 2: Update Backend Environment Variables

After frontend deploys, update these in Render:

1. Go to your Render dashboard
2. Click your web service
3. Go to **"Environment"** tab
4. Update/Add:
   - `FRONTEND_URL`: `https://your-app.vercel.app`
   - `GOOGLE_REDIRECT_URI`: `https://your-backend-url.onrender.com/api/oauth/gmail/callback`
5. Click **"Save Changes"** (auto-redeploys)

---

## STEP 3: Deploy Frontend to Vercel (10 minutes)

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access repositories

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Find `electrical-crm` repository
3. Click **"Import"**

### 3.3 Configure Build Settings
**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### 3.4 Add Environment Variable
Click **"Environment Variables"**

Add ONE variable:
```
Name: VITE_API_URL
Value: https://your-backend-url.onrender.com/api
```

**IMPORTANT:** Replace with your actual Render URL!

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll get a URL like: `https://electrical-crm.vercel.app`

### 3.6 Test Frontend
1. Visit your Vercel URL
2. Login: `developer@gmail.com` / `dev123`
3. Check if data loads (emails, jobs, etc.)

---

## STEP 4: Update Frontend API URL (if needed)

If you need to change the API URL later:

### Local Development (.env.local)
Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:5001/api
```

### Production (Vercel)
1. Go to Vercel dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_API_URL`
5. Redeploy (Deployments tab → click "..." → "Redeploy")

---

## STEP 5: Final Configuration Update

Update the hardcoded API URL in frontend code:

**File:** `frontend/src/App.jsx` and all component files

Find: `const API_URL = 'http://localhost:5001/api';`

Replace with:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
```

This way:
- **Production**: Uses Vercel environment variable
- **Development**: Falls back to localhost

Do this for all files with API_URL:
- App.jsx
- Login.jsx
- Jobs.jsx
- Clients.jsx
- Emails.jsx
- Analytics.jsx
- MarketingOutreach.jsx
- EmailJobSummarizer.jsx
- ExpenseEntryModal.jsx
- JobForm.jsx

---

## TROUBLESHOOTING

### Backend won't deploy
- Check build logs in Render dashboard
- Ensure `backend/` directory has package.json
- Verify start command: `node src/server.js`

### Frontend can't connect to backend
- Check VITE_API_URL in Vercel environment variables
- Ensure backend URL ends with `/api` (not `/`)
- Check browser console for CORS errors

### CORS errors
Update backend `server.js` with Vercel URL:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-app.vercel.app'],
  credentials: true
}));
```

### Database connection fails
- Verify MongoDB Atlas Network Access (allow 0.0.0.0/0)
- Check MONGODB_URI in Render environment variables
- Password should NOT have special characters

### Backend is slow (free tier)
- First request after 15 min takes 30 seconds (cold start)
- Subsequent requests are fast
- Upgrade to paid tier for always-on

---

## POST-DEPLOYMENT CHECKLIST

- [ ] Backend deployed to Render
- [ ] Backend URL tested and working
- [ ] Frontend deployed to Vercel
- [ ] Frontend can connect to backend
- [ ] Login works
- [ ] Data loads (emails, jobs, clients)
- [ ] Sample data visible
- [ ] Updated FRONTEND_URL in Render
- [ ] Share Vercel URL with client

---

## SHARING WITH CLIENT

**URL:** https://your-app.vercel.app
**Login:** developer@gmail.com / dev123

The client can access from:
- ✅ Any browser
- ✅ Any device (desktop, mobile, tablet)
- ✅ Anywhere in the world
- ✅ Data persists in cloud (MongoDB Atlas)

---

## COST BREAKDOWN

- **MongoDB Atlas**: FREE (512MB)
- **Render Backend**: FREE (with cold starts)
- **Vercel Frontend**: FREE (100GB bandwidth/month)

**Total: $0/month** 🎉

---

## UPGRADING FOR PRODUCTION

When ready for real clients:

1. **Render**: Upgrade to $7/month (no cold starts)
2. **MongoDB Atlas**: Upgrade to $9/month (2GB storage, better performance)
3. **Vercel**: Free tier is fine (upgrade at $20/month if needed)

**Total Production Cost: ~$16-36/month**
