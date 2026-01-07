# Railway Environment Variables - Microsoft OAuth Update

## 🔑 Add These Variables to Railway

Go to Railway Dashboard → Your Service → **Variables** tab → Click **"+ New Variable"** and add:

### Microsoft OAuth Credentials

Add the Microsoft client secret and secret ID that you received from Azure Portal:

```
MICROSOFT_CLIENT_SECRET=<your-microsoft-client-secret>
```

```
MICROSOFT_SECRET_ID=<your-microsoft-secret-id>
```

**Note:** Get these values from Azure Portal → App Registrations → Your App → Certificates & secrets

### Additional Required Variables (if not already added)

```
GOOGLE_REDIRECT_URI=https://electrical-crm-production.up.railway.app/api/oauth/gmail/callback
```

```
MICROSOFT_REDIRECT_URI=https://electrical-crm-production.up.railway.app/api/oauth/microsoft/callback
```

```
FRONTEND_URL=https://your-frontend-url.vercel.app
```
(Update this once you deploy the frontend)

---

## ✅ What Should Already Be in Railway

These should already exist (verify they're there):

```
NODE_ENV=production
PORT=8080
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret-from-crypto-random-bytes>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<your-encryption-key-from-crypto-random-bytes>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
MICROSOFT_CLIENT_ID=<your-microsoft-client-id>
MICROSOFT_TENANT_ID=<your-microsoft-tenant-id>
```

**IMPORTANT:** These are already configured in Railway. Do NOT change them unless rotating secrets for security.

---

## 🔄 After Adding Variables

Railway will automatically **redeploy** your service. Wait 2-3 minutes and check the logs to confirm it's running successfully.

---

## 📋 Microsoft Azure Portal - Redirect URI Setup

Don't forget to add the production redirect URI in Azure Portal:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your app (f41e0e9e-5e09-40b5-8893-b7fbbd22697f)
4. Go to **Authentication**
5. Click **"Add a platform"** → **Web**
6. Add redirect URI:
   ```
   https://electrical-crm-production.up.railway.app/api/oauth/microsoft/callback
   ```
7. Make sure **"Access tokens"** and **"ID tokens"** are checked
8. Click **Save**

---

## 🔧 Google OAuth Console - Redirect URI Setup

Also update Google OAuth Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (1013633694578...)
5. Under **Authorized redirect URIs**, add:
   ```
   https://electrical-crm-production.up.railway.app/api/oauth/gmail/callback
   ```
6. Click **Save**

---

## ✅ Verification

After all updates, test:

1. Visit: `https://electrical-crm-production.up.railway.app/`
2. You should see the API info page
3. Try connecting a Gmail account from your frontend
4. Try connecting a Microsoft account from your frontend

Both should work without errors!
