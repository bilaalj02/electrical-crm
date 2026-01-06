# Microsoft OAuth 2.0 Setup Guide for Outlook Integration

## Step 1: Register Application in Azure Portal

1. **Go to Azure Portal**: https://portal.azure.com

2. **Navigate to App Registrations**:
   - Search for "Azure Active Directory" in the search bar
   - Click "App registrations" in the left sidebar
   - Click "+ New registration"

3. **Fill in Application Details**:
   - **Name**: `MES Electrical CRM` (or your preferred name)
   - **Supported account types**: Select "Accounts in any organizational directory and personal Microsoft accounts (Any Azure AD directory - Multitenant and personal Microsoft accounts)"
   - **Redirect URI**:
     - Platform: Web
     - URI: `http://localhost:5000/api/oauth/microsoft/callback`
   - Click "Register"

4. **Save Your Application Credentials**:
   After registration, you'll see the Overview page. **SAVE THESE VALUES**:
   - **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Step 2: Create Client Secret

1. **Go to "Certificates & secrets"** (left sidebar)

2. **Click "+ New client secret"**:
   - Description: `CRM OAuth Secret`
   - Expires: `24 months` (recommended)
   - Click "Add"

3. **IMMEDIATELY COPY THE SECRET VALUE**:
   - The value will look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **IMPORTANT**: This is shown ONLY ONCE. Copy it now!
   - Save it securely

## Step 3: Configure API Permissions

1. **Go to "API permissions"** (left sidebar)

2. **Click "+ Add a permission"**

3. **Select "Microsoft Graph"**

4. **Select "Delegated permissions"**

5. **Add these permissions**:
   - `Mail.Read` - Read user mail
   - `Mail.ReadWrite` - Read and write access to user mail
   - `Mail.Send` - Send mail as a user
   - `offline_access` - Maintain access to data you have given it access to
   - `User.Read` - Sign in and read user profile

6. **Click "Add permissions"**

7. **Grant Admin Consent** (if you have admin rights):
   - Click "Grant admin consent for [Your Organization]"
   - Click "Yes" to confirm
   - All permissions should now show "Granted for [Your Organization]"

## Step 4: Add Credentials to .env File

Open your `.env` file in `electrical-crm/backend/` and add:

```env
# Microsoft OAuth (Outlook/Exchange Integration)
MICROSOFT_CLIENT_ID=your-application-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-value-here
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:5000/api/oauth/microsoft/callback
```

**Note**:
- Replace `your-application-client-id-here` with your Application (client) ID
- Replace `your-client-secret-value-here` with your Client Secret value
- Use `common` for tenant ID to support both personal and work accounts
- Or use your specific tenant ID if you only want work accounts

## Step 5: Install Required Package

The Microsoft Graph SDK should be installed:

```bash
cd backend
npm install @microsoft/microsoft-graph-client
```

## Step 6: Test the Integration

1. Start your backend server
2. Go to the Emails page in your CRM
3. Click "Connect Account"
4. Select "Microsoft / Outlook"
5. You'll be redirected to Microsoft login
6. Sign in and grant permissions
7. You'll be redirected back to your CRM

## Scopes Explained

- **Mail.Read**: Allows the app to read emails
- **Mail.ReadWrite**: Allows the app to read, update, create, and delete emails
- **Mail.Send**: Allows the app to send emails as the user
- **offline_access**: Allows the app to refresh tokens without user interaction
- **User.Read**: Allows the app to read basic user profile info (name, email)

## Production Setup

When deploying to production:

1. Update redirect URI in Azure:
   - Add: `https://yourdomain.com/api/oauth/microsoft/callback`

2. Update .env file:
   - `MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/oauth/microsoft/callback`
   - `FRONTEND_URL=https://yourdomain.com`

## Troubleshooting

### Error: "AADSTS50011: The redirect URI specified in the request does not match"
- Make sure the redirect URI in your Azure app matches exactly what's in your .env file
- Include the full URL: `http://localhost:5000/api/oauth/microsoft/callback`

### Error: "AADSTS65001: The user or administrator has not consented"
- Make sure you granted admin consent for the API permissions
- Or the user needs to consent during first login

### Error: "Invalid client secret"
- The client secret might have expired
- Create a new client secret in Azure Portal
- Update your .env file with the new secret

## Security Best Practices

1. **Never commit .env file** to git
2. **Rotate secrets regularly** (every 6-12 months)
3. **Use different credentials** for development and production
4. **Enable audit logging** in Azure to track OAuth access
5. **Review permissions** regularly - only request what you need
