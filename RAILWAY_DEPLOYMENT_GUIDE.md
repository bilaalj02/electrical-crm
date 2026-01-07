# Railway + Vercel Deployment Guide

## Why Railway?
- ✅ **Easier setup** than Render (no cold starts on free tier initially)
- ✅ **$5 free credits/month** (enough for small demos)
- ✅ **Faster deployments** (1-2 minutes)
- ✅ **Better free tier** performance
- ✅ **Automatic HTTPS** and environment management

---

## DEPLOYMENT ORDER

### STEP 1: Deploy Backend to Railway (10 minutes)
### STEP 2: Deploy Frontend to Vercel (5 minutes)

---

## STEP 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to https://railway.app
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your repositories
4. You'll get **$5 free credits/month** (no credit card required initially)

### 1.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select `electrical-crm` repository
4. Railway will detect it's a monorepo

### 1.3 Configure Service
1. Railway will ask which service to deploy
2. Click **"Add variables"** first (before deploying)

### 1.4 Add Environment Variables
Click **"Variables"** tab and add these:

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

### 1.5 Configure Build Settings
1. Click **"Settings"** tab
2. Scroll to **"Build & Deploy"**
3. Set these values:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Watch Paths**: `backend/**`

### 1.6 Generate Domain
1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://electrical-crm-backend-production.up.railway.app`
5. **COPY THIS URL** - you'll need it for Vercel!

### 1.7 Deploy
1. Click **"Deploy"** or go to **"Deployments"** tab
2. Wait 1-2 minutes for build to complete
3. Check logs to ensure "MongoDB Connected" appears

### 1.8 Test Backend
Open a new tab and test:
```
https://your-railway-url.up.railway.app/api/auth/me
```

Should return: `{"error":"No authentication token provided"}`

✅ **If you see this, backend is working!**

---

## STEP 2: Update Environment Variables (After Frontend Deploys)

After frontend is deployed, go back to Railway:

1. Go to **"Variables"** tab
2. Add new variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Update:
   ```
   GOOGLE_REDIRECT_URI=https://your-railway-url.up.railway.app/api/oauth/gmail/callback
   ```
4. Changes auto-deploy

---

## STEP 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Find `electrical-crm` repository
3. Click **"Import"**

### 3.3 Configure Project Settings
**Framework Preset:** Vite
**Root Directory:** `frontend`

Click **"Edit"** next to Root Directory and set: `frontend`

**Build Settings:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

### 3.4 Add Environment Variable
Click **"Environment Variables"** section

Add ONE variable:
```
Name: VITE_API_URL
Value: https://your-railway-url.up.railway.app/api
```

**⚠️ IMPORTANT:**
- Replace with your actual Railway URL
- Must end with `/api`
- Include `https://`

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Vercel will show build progress
4. Once done, you'll get a URL like: `https://electrical-crm.vercel.app`

### 3.6 Test Full App
1. Visit your Vercel URL
2. Login: `developer@gmail.com` / `dev123`
3. Check:
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Sample emails appear (click bell icon)
   - ✅ Jobs page shows data
   - ✅ Clients page loads

---

## STEP 4: Update Backend with Frontend URL

Go back to Railway:
1. Click your backend service
2. Go to **"Variables"** tab
3. Add: `FRONTEND_URL` = `https://your-vercel-url.vercel.app`
4. Service will auto-redeploy

---

## Railway Cost & Credits

### Free Tier Details:
- **$5 free credits/month**
- Usage-based pricing:
  - ~$0.01/hour when active
  - Backend sleeps after 1 hour of inactivity (free)
  - Wakes up automatically on first request (~5 seconds)
- **Credit card required** after trial period for continued service

### Cost Estimate:
- **Light usage** (demo): $3-5/month
- **Medium usage** (small business): $10-15/month
- **Heavy usage**: $20-30/month

### To Monitor Credits:
1. Click your profile (top right)
2. Go to **"Account"** → **"Usage"**
3. See remaining credits and usage

---

## TROUBLESHOOTING

### Backend Build Fails
**Check:**
- Root directory is set to `backend`
- Start command: `node src/server.js`
- All environment variables added
- View build logs in Railway dashboard

### Frontend Can't Connect
**Check:**
- `VITE_API_URL` in Vercel environment variables
- URL ends with `/api`
- Railway backend is running (green dot)
- Browser console for errors

### MongoDB Connection Error
**Check:**
- MONGODB_URI is correct in Railway variables
- MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)
- Connection string includes database name `/electrical-crm`

### CORS Errors
**Update backend** `src/server.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app'  // Add your Vercel URL
  ],
  credentials: true
}));
```
Push to GitHub, Railway will auto-redeploy.

### Railway Service Sleeping
- Free tier sleeps after 1 hour of inactivity
- First request wakes it (~5 seconds)
- Keep-alive services available (uses more credits)

---

## POST-DEPLOYMENT CHECKLIST

- [ ] Backend deployed to Railway
- [ ] Railway domain generated
- [ ] Backend tested (returns auth error)
- [ ] Frontend deployed to Vercel
- [ ] Vercel environment variable set
- [ ] Frontend tested (login works)
- [ ] Can view emails, jobs, clients
- [ ] Updated FRONTEND_URL in Railway
- [ ] Tested full app functionality

---

## SHARING WITH CLIENT

**Production URL:** https://your-app.vercel.app
**Login Credentials:**
- Email: `developer@gmail.com`
- Password: `dev123`

**Features to Show Client:**
1. ✅ Dashboard overview
2. ✅ Email Job Summarizer (bell icon)
3. ✅ Jobs management with cost tracking
4. ✅ Client database
5. ✅ Analytics and reporting
6. ✅ Marketing automation (review/referral requests)

---

## COST SUMMARY

| Service | Free Tier | Cost |
|---------|-----------|------|
| MongoDB Atlas | 512MB | $0 |
| Railway Backend | $5 credits/month | $0-5/month |
| Vercel Frontend | 100GB bandwidth | $0 |
| **TOTAL** | | **$0-5/month** |

---

## UPGRADING FOR PRODUCTION

When ready for real clients:

1. **Railway**: Add payment method ($10-20/month typical)
2. **MongoDB Atlas**: Upgrade to $9/month (2GB, better performance)
3. **Vercel**: Free tier sufficient (upgrade at $20/month if needed)

**Total Production Cost: ~$19-49/month**

---

## AUTOMATIC DEPLOYMENTS

Both services auto-deploy on push:

1. **Push to GitHub** (main branch)
2. **Railway** detects change → builds backend (1-2 min)
3. **Vercel** detects change → builds frontend (2-3 min)
4. **Done!** Changes live in ~5 minutes

No manual deployment needed after initial setup! 🎉
