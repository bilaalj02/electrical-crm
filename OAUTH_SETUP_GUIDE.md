# Gmail OAuth 2.0 Integration Setup Guide

## Overview

Your Electrical CRM now supports Gmail integration via OAuth 2.0! This allows users to:
- ✅ Connect Gmail accounts securely (no password storage)
- ✅ Sync emails automatically
- ✅ Send emails from within the CRM
- ✅ Link emails to clients and jobs

## Security Features

- **OAuth 2.0**: Users authenticate directly with Google, not through your app
- **Token Encryption**: Access tokens are encrypted before storage
- **No Password Storage**: User passwords are never stored or visible
- **Revocable Access**: Users can revoke access anytime from their Google account

---

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Enter project name: `Electrical CRM` (or your preferred name)
4. Click "Create"

### 2. Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click "Gmail API" and click **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for testing) or **Internal** (if you have Google Workspace)
3. Fill in the required fields:
   - **App name**: Electrical CRM
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. On "Scopes" page, click **Add or Remove Scopes**
6. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
7. Click **Update** → **Save and Continue**
8. Add test users (while in testing mode):
   - Add the email addresses that will use the CRM
   - Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select Application type: **Web application**
4. Name: `Electrical CRM OAuth Client`
5. Add Authorized redirect URIs:
   - For local development: `http://localhost:5000/api/oauth/gmail/callback`
   - For production: `https://your-domain.com/api/oauth/gmail/callback`
6. Click **Create**
7. **IMPORTANT**: Copy and save:
   - **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-xxxxx`)

### 5. Configure Environment Variables

1. Create `.env` file in `backend/` folder (copy from `.env.example`)
2. Add your Google OAuth credentials:

```bash
# Google OAuth (Gmail Integration)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/oauth/gmail/callback

# Encryption Key (generate a random 32+ character string)
ENCRYPTION_KEY=your-random-32-character-encryption-key-here

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend URL
FRONTEND_URL=http://localhost:5174

# MongoDB
MONGODB_URI=mongodb://localhost:27017/electrical-crm
```

### 6. Generate Secure Keys

For `ENCRYPTION_KEY` and `JWT_SECRET`, generate random strings:

**Option 1: Using Node.js**
```javascript
// Run in Node.js console
require('crypto').randomBytes(32).toString('hex')
```

**Option 2: Using Online Generator**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" or similar

---

## Deployment to Vercel

### Environment Variables for Production

In your Vercel project settings, add these environment variables:

1. **Google OAuth Credentials**:
   ```
   GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-prod-client-secret
   GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/oauth/gmail/callback
   ```

2. **Security Keys**:
   ```
   ENCRYPTION_KEY=your-production-encryption-key
   JWT_SECRET=your-production-jwt-secret
   ```

3. **Database**:
   ```
   MONGODB_URI=your-mongodb-atlas-connection-string
   ```

4. **Frontend URL**:
   ```
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

### Update OAuth Redirect URIs

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add production redirect URI:
   ```
   https://your-backend-domain.vercel.app/api/oauth/gmail/callback
   ```

---

## Testing the Integration

### Local Testing

1. Start MongoDB:
   ```bash
   mongod --dbpath ~/Downloads/mongodb-data
   ```

2. Start backend:
   ```bash
   cd electrical-crm/backend
   npm start
   ```

3. Start frontend:
   ```bash
   cd electrical-crm/frontend
   npm run dev
   ```

4. Test the OAuth flow:
   - Open CRM: http://localhost:5174
   - Login to your CRM account
   - Navigate to Emails page
   - Click "Connect Account" → "Gmail"
   - You'll be redirected to Google login
   - Grant permissions
   - You'll be redirected back to CRM
   - Account should appear as connected!

### Syncing Emails

Once connected:
1. Click the sync icon next to the connected account
2. Or click "Sync Emails" button to sync all accounts
3. Emails will appear in the Unified Inbox

---

## How It Works

### OAuth Flow

```
User clicks "Connect Gmail"
  ↓
Frontend requests auth URL from backend
  ↓
Backend generates Google OAuth URL
  ↓
User redirected to Google login page
  ↓
User logs in and grants permissions
  ↓
Google redirects back with authorization code
  ↓
Backend exchanges code for access tokens
  ↓
Backend encrypts and stores tokens in database
  ↓
User redirected back to CRM with success message
  ↓
Frontend shows connected account
```

### Email Syncing

```
User clicks "Sync"
  ↓
Backend retrieves encrypted tokens
  ↓
Backend decrypts tokens and creates authenticated Gmail client
  ↓
Backend fetches emails via Gmail API
  ↓
Backend parses email data and stores in MongoDB
  ↓
Frontend displays synced emails
```

---

## Security Best Practices

1. **Never commit `.env` file to git**
   - Already in `.gitignore`
   - Use `.env.example` for reference

2. **Use strong encryption keys**
   - Minimum 32 characters
   - Random and unique for each environment

3. **Rotate credentials regularly**
   - Change `JWT_SECRET` periodically
   - Update `ENCRYPTION_KEY` with data re-encryption

4. **Limit OAuth scopes**
   - Only request necessary permissions
   - Current scopes: read, send, modify

5. **Monitor access**
   - Check Google Cloud Console for unusual activity
   - Review connected apps in user's Google account

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- **Cause**: Redirect URI in request doesn't match Google Cloud Console
- **Fix**: Ensure `GOOGLE_REDIRECT_URI` in `.env` exactly matches the URI in Google Cloud Console

### "Access blocked: This app's request is invalid"
- **Cause**: OAuth consent screen not configured
- **Fix**: Complete OAuth consent screen setup in Google Cloud Console

### "Email account not found"
- **Cause**: User not authenticated or token expired
- **Fix**: Re-connect the Gmail account

### "Failed to sync emails"
- **Cause**: Token expired or API quota exceeded
- **Fix**:
  - Token will auto-refresh on next request
  - Check Gmail API quota in Google Cloud Console

---

## API Endpoints

### OAuth Endpoints

- `GET /api/oauth/gmail/auth-url` - Get Gmail OAuth URL
- `GET /api/oauth/gmail/callback` - Handle OAuth callback
- `GET /api/oauth/accounts` - Get connected accounts
- `DELETE /api/oauth/accounts/:accountId` - Disconnect account

### Email Endpoints

- `POST /api/email-sync/sync/:accountId` - Sync emails for account
- `GET /api/email-sync` - Get synced emails
- `GET /api/email-sync/:emailId` - Get single email
- `PATCH /api/email-sync/:emailId/read` - Mark as read/unread
- `PATCH /api/email-sync/:emailId/link` - Link to client/job
- `POST /api/email-sync/send` - Send email

---

## What's Next?

Future enhancements:
- ✅ Gmail OAuth integration (DONE!)
- ⏳ Microsoft/Outlook OAuth integration
- ⏳ IMAP support for other providers
- ⏳ Email templates
- ⏳ Automated email responses
- ⏳ Email tracking and analytics
- ⏳ Attachment handling
- ⏳ Email signatures

---

## Support

For issues or questions:
1. Check this guide
2. Review `.env.example` for configuration
3. Check console logs for errors
4. Verify Google Cloud Console settings

---

**Congratulations! Your CRM now has secure Gmail integration! 🎉**
