# Gmail OAuth — Setup Steps (Elvis)

**Project:** MES Project
**Google Cloud Project ID:** `mes-project-498502`
**Google Cloud Project Number:** `288037190625`

You do these once. After this is finished, Marc can connect his Gmail himself via the CRM.

---

## Step 1 — Enable the Gmail API

1. Go to https://console.cloud.google.com
2. Select project **MES Project** (top-left dropdown). Confirm project ID = `mes-project-498502`.
3. Left sidebar → **APIs & Services** → **Library**
4. Search **Gmail API** → click → **Enable**

---

## Step 2 — Configure OAuth Consent Screen

1. **APIs & Services** → **OAuth consent screen**
2. User type: **External**, click Create
3. Fill out:
   - App name: **MES Electrical CRM**
   - User support email: your email or Marc's
   - App logo: optional (use the MES logo if you want)
   - App domain (optional initially):
     - Application home page: `https://meselectrical-crm.vercel.app`
     - Privacy policy URL: required for verification later — for now, put `https://meselectrical-crm.vercel.app/privacy`
     - Terms of service URL: `https://meselectrical-crm.vercel.app/terms`
   - Authorized domains: `vercel.app` and `railway.app` (or your custom domain when you have one)
   - Developer contact email: your email
4. Click **Save and Continue**
5. **Scopes** page → click **Add or Remove Scopes**. Add these four:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
6. Click **Update**, then **Save and Continue**
7. **Test users** page → click **Add Users** → add Marc's Gmail address (the one he'll connect to the CRM). Add yours too for testing.
8. **Save and Continue** through the summary.

---

## Step 3 — Create OAuth Client ID

1. **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: **MES CRM Web Client**
4. **Authorized JavaScript origins** — add these:
   ```
   https://meselectrical-crm.vercel.app
   http://localhost:5174
   ```
5. **Authorized redirect URIs** — add these:
   ```
   https://electrical-crm-production.up.railway.app/api/oauth/gmail/callback
   http://localhost:5001/api/oauth/gmail/callback
   ```
6. Click **Create**.
7. A modal pops up with **Client ID** and **Client Secret**. Copy both. Save them somewhere safe — you cannot view the secret again later (only download a JSON).

---

## Step 4 — Generate Encryption Key

In Terminal:
```bash
openssl rand -base64 32
```

Copy the output. This is the `ENCRYPTION_KEY` used to encrypt OAuth tokens in MongoDB.

---

## Step 5 — Set Environment Variables on Railway

Open Railway → MES backend service → **Variables** tab. Add or update:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | (from Step 3) |
| `GOOGLE_CLIENT_SECRET` | (from Step 3) |
| `GOOGLE_REDIRECT_URI` | `https://electrical-crm-production.up.railway.app/api/oauth/gmail/callback` |
| `ENCRYPTION_KEY` | (from Step 4) |
| `FRONTEND_URL` | `https://meselectrical-crm.vercel.app` |

Railway will auto-redeploy after you save these.

---

## Step 6 — Smoke Test (you, then Marc)

1. Go to `https://meselectrical-crm.vercel.app`
2. Log in as admin (your account or `developer@gmail.com` / `dev123` if you still have the demo).
3. Click **Emails** in sidebar
4. Click **+ Connect Account**
5. In the modal, click **Gmail**
6. Google will redirect to its consent flow. You will see **"Google hasn't verified this app"** — this is expected because the app isn't through Google's restricted-scope verification yet. As long as your Gmail (or Marc's) is in the **Test Users** list (Step 2.7), you can dismiss the warning by clicking **Advanced** → **Go to MES Electrical CRM (unsafe)**.
7. Approve the permissions → you should land back in the CRM with your Gmail account connected and emails syncing within ~60 seconds.

If that works for your test account, send Marc the user-facing guide: `GMAIL_CONNECT_GUIDE_MARC.md` (separate doc).

---

## Later — App Verification

Once Marc is using it daily, submit the app for Google verification so the "unverified" warning goes away for any future user. The verification flow:
- **APIs & Services** → **OAuth consent screen** → **Publish App** → **Prepare for Verification**
- You'll need: a hosted privacy policy page, a hosted terms of service page, a short demo video showing the OAuth flow and what your app does with the data, and a domain verification token in DNS.
- Google's review timeline for restricted Gmail scopes: 2-6 weeks.

This isn't blocking — Marc can use the CRM with the "unverified" warning indefinitely as long as he's in the Test Users list.

---

## Troubleshooting

**Marc clicks Connect → nothing happens / redirect fails:**
- Verify `GOOGLE_REDIRECT_URI` env var matches EXACTLY one of the redirect URIs registered in Step 3
- Verify Railway redeployed after env var change (check Deployments tab)

**Marc sees "Access blocked: This app's request is invalid":**
- The redirect URI in Step 3 doesn't include the one the backend is using. Re-check both.

**Marc gets "Error 403: access_denied":**
- Marc is not in the Test Users list — add his email under OAuth consent screen → Test Users

**Marc's emails don't sync after connecting:**
- Check Railway logs for the EmailSync service. Confirm `AUTO_SYNC=true` and `SYNC_INTERVAL_MINUTES=15` (or shorter for testing).
- Manually trigger a sync via API or wait one cycle.
