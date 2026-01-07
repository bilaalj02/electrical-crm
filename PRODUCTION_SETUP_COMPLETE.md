# Production Setup - Complete Guide

## ✅ What's Been Done

### 1. Backend Deployed to Railway
- **URL:** https://electrical-crm-production.up.railway.app/
- **Status:** ✅ Running successfully
- **Database:** ✅ Connected to MongoDB Atlas

### 2. Frontend Environment Variables Configured
- Created `.env` file with production API URL
- Updated all components to use environment variables
- Can switch between local/production by changing `.env`

---

## 🔧 Next Steps

### Step 1: Update Backend Environment Variables in Railway

Go to Railway Dashboard → Your Service → Variables tab and **ADD** these two new variables:

```
GOOGLE_REDIRECT_URI=https://electrical-crm-production.up.railway.app/api/oauth/gmail/callback
FRONTEND_URL=https://your-frontend-url.vercel.app
```

(Replace `your-frontend-url.vercel.app` with actual frontend URL once deployed)

After adding, Railway will automatically redeploy.

---

### Step 2: Update Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://electrical-crm-production.up.railway.app/api/oauth/gmail/callback
   ```
6. Click **Save**

---

### Step 3: Update Microsoft OAuth (if using)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your app
4. Go to **Authentication**
5. Add redirect URI:
   ```
   https://electrical-crm-production.up.railway.app/api/oauth/microsoft/callback
   ```
6. Click **Save**

---

### Step 4: Deploy Frontend

#### Option A: Vercel (Recommended - Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://electrical-crm-production.up.railway.app/api
   ```
6. Click **Deploy**

#### Option B: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub and select repository
4. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://electrical-crm-production.up.railway.app/api
   ```
6. Click **Deploy**

---

## 🔄 Switching Between Local and Production

### For Local Development:

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Also change backend `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/electrical-crm
```

### For Production:

Edit `frontend/.env`:
```
VITE_API_URL=https://electrical-crm-production.up.railway.app/api
```

---

## 📝 Summary

✅ Backend is live on Railway
✅ MongoDB Atlas is connected
✅ Frontend is configured with environment variables

🔲 Need to update OAuth redirect URIs
🔲 Need to deploy frontend
🔲 Need to update Railway environment variables

Once you complete these steps, your CRM will be fully live!

---

## 🆘 Troubleshooting

### If OAuth doesn't work:
- Double-check redirect URIs in Google/Microsoft console
- Make sure they match EXACTLY (including https://)
- Wait 5 minutes after changing OAuth settings

### If frontend can't connect to backend:
- Check `.env` file has correct `VITE_API_URL`
- Make sure Railway backend is running (check logs)
- Test backend directly: `https://electrical-crm-production.up.railway.app/api`

### If database connection fails:
- Check MongoDB Atlas Network Access has `0.0.0.0/0`
- Verify MONGODB_URI in Railway environment variables
- Check Railway logs for connection errors
