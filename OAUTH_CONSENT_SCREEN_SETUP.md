# OAuth Consent Screen Setup - Step-by-Step Guide

## What is the OAuth Consent Screen?

The OAuth consent screen is what users see when they connect their Gmail account to your CRM. It shows:
- Your app name
- What permissions you're requesting
- Who can use the app

Let's set it up together!

---

## Step 1: Go to Google Cloud Console

1. Open your browser and go to: **https://console.cloud.google.com**
2. Sign in with your Google account

---

## Step 2: Select or Create Your Project

### If you already created a project:
1. Click the project dropdown at the top (it says "Select a project")
2. Select your "Electrical CRM" project

### If you need to create a new project:
1. Click "Select a project" → "NEW PROJECT"
2. Project name: `Electrical CRM`
3. Click "CREATE"
4. Wait for the project to be created (takes a few seconds)
5. Click "SELECT PROJECT" when it appears

---

## Step 3: Navigate to OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"**
2. Click **"OAuth consent screen"**

You should now see the OAuth consent screen configuration page.

---

## Step 4: Choose User Type

You'll see two options:

### Option 1: **Internal** (Recommended if you have Google Workspace)
- ✅ Only for your organization
- ✅ No verification needed
- ✅ Faster setup
- ❌ Only works if you have Google Workspace

### Option 2: **External** (Most common - choose this if unsure)
- ✅ Works for any Gmail account
- ⚠️ Limited to 100 test users while in "Testing" mode
- ⚠️ Requires verification for production (but not needed for testing)

**For most users: Select "External"**

Click "CREATE"

---

## Step 5: Fill in App Information

Now you'll see a form with multiple sections. Here's what to fill in:

### **App Information Section**

#### 1. App name **(Required)**
```
Electrical CRM
```
*This is what users will see when connecting their Gmail*

#### 2. User support email **(Required)**
```
your-email@gmail.com
```
*Use your own email address - users will contact you for support*

#### 3. App logo (Optional)
- Skip this for now
- You can add a logo later

#### 4. Application home page (Optional)
```
http://localhost:5174
```
*For local development, or use your production URL if you have one*

#### 5. Application privacy policy link (Optional)
- Skip for development/testing
- Required for production

#### 6. Application terms of service link (Optional)
- Skip for development/testing
- Required for production

### **App Domain Section** (Optional for testing)

Skip this section for now. It's only needed for production.

### **Authorized Domains** (Optional for testing)

Skip this section for now.

### **Developer Contact Information** **(Required)**

#### Developer contact information
```
your-email@gmail.com
```
*Google will use this to contact you about your project*

---

## Step 6: Click "SAVE AND CONTINUE"

At the bottom of the page, click the blue **"SAVE AND CONTINUE"** button.

---

## Step 7: Add Scopes (Permissions)

You're now on the "Scopes" page. This is where you tell Google what permissions your app needs.

### Click "ADD OR REMOVE SCOPES"

A side panel will open with a search box and a list of scopes.

### Add these 4 scopes:

#### Scope 1: View your email messages and settings
1. In the search box, type: `gmail.readonly`
2. Find and check: **"https://www.googleapis.com/auth/gmail.readonly"**
   - Description: "Read all resources and their metadata—no write operations."

#### Scope 2: Send email on your behalf
1. In the search box, type: `gmail.send`
2. Find and check: **"https://www.googleapis.com/auth/gmail.send"**
   - Description: "Send messages only. No read or modify privileges on mailbox."

#### Scope 3: Read, compose, send, and permanently delete your email
1. In the search box, type: `gmail.modify`
2. Find and check: **"https://www.googleapis.com/auth/gmail.modify"**
   - Description: "All read/write operations except immediate, permanent deletion of threads and messages, bypassing Trash."

#### Scope 4: See your primary Google Account email address
1. In the search box, type: `userinfo.email`
2. Find and check: **"https://www.googleapis.com/auth/userinfo.email"**
   - Description: "See your primary Google Account email address"

### After selecting all 4 scopes:
1. Click **"UPDATE"** at the bottom of the side panel
2. Verify all 4 scopes appear in the list
3. Click **"SAVE AND CONTINUE"** at the bottom of the page

---

## Step 8: Add Test Users (IMPORTANT for External apps)

If you selected "External" user type, you MUST add test users.

### Why?
While your app is in "Testing" mode, only users you specifically add here can use it.

### How to add test users:

1. Click **"+ ADD USERS"** button
2. Enter email addresses (one per line):
   ```
   your-email@gmail.com
   client-email@gmail.com
   another-test-user@gmail.com
   ```
3. You can add up to 100 test users
4. Click **"ADD"**

**IMPORTANT**: Anyone who will test the CRM must be added here!

### Click "SAVE AND CONTINUE"

---

## Step 9: Review Summary

You'll see a summary of your configuration:

- App name: Electrical CRM
- User type: External (or Internal)
- Scopes: 4 selected
- Test users: X users added

### Verify everything looks correct

If something is wrong:
- Click "BACK TO DASHBOARD" and edit the section
- Otherwise, click "BACK TO DASHBOARD"

---

## Step 10: Verify Your Setup

Back on the OAuth consent screen dashboard, you should see:

### Publishing status: **Testing**
- This is perfect for development!
- No verification needed
- Only test users can access

### User type: **External** (or Internal)

### Scopes: 4 scopes

You're done with the OAuth consent screen! ✅

---

## What's Next?

Now you need to create OAuth credentials:

### Go to Credentials Page

1. In the left sidebar, click **"Credentials"**
2. Continue to the next section to create your OAuth Client ID

---

## Common Issues & Solutions

### Issue: "App is blocked"
**Solution**: Make sure:
- You added the user as a test user
- The app is in "Testing" mode
- The user is using the exact email you added

### Issue: "Unverified app" warning
**Solution**: This is normal for testing!
- Click "Advanced"
- Click "Go to Electrical CRM (unsafe)"
- This warning goes away after Google verification (only needed for production)

### Issue: Can't find scopes
**Solution**:
- Make sure Gmail API is enabled first (see main guide)
- Try searching with partial names (e.g., "gmail" or "userinfo")

### Issue: "Invalid redirect URI"
**Solution**:
- This error happens later when creating credentials
- Make sure redirect URI exactly matches your .env file

---

## Quick Checklist

Before moving to credentials creation, verify:

- ✅ OAuth consent screen configured
- ✅ App name: "Electrical CRM"
- ✅ User support email added
- ✅ Developer contact email added
- ✅ 4 scopes added (gmail.readonly, gmail.send, gmail.modify, userinfo.email)
- ✅ Test users added (if External)
- ✅ Publishing status: Testing

---

## Screenshots Reference

Here's what each page should look like:

### OAuth Consent Screen - App Information
```
┌─────────────────────────────────────────┐
│ App Information                         │
├─────────────────────────────────────────┤
│ App name *                              │
│ [Electrical CRM                    ]    │
│                                         │
│ User support email *                    │
│ [your-email@gmail.com              ]    │
│                                         │
│ App logo                                │
│ [Upload]                                │
│                                         │
│ App domain                              │
│ Application home page                   │
│ [http://localhost:5174             ]    │
│                                         │
│ Developer contact information *         │
│ [your-email@gmail.com              ]    │
└─────────────────────────────────────────┘
         [SAVE AND CONTINUE]
```

### Scopes Page - Selected Scopes
```
┌─────────────────────────────────────────────────────────┐
│ Your sensitive scopes                                   │
├─────────────────────────────────────────────────────────┤
│ ✓ .../auth/gmail.readonly                              │
│ ✓ .../auth/gmail.send                                  │
│ ✓ .../auth/gmail.modify                                │
│ ✓ .../auth/userinfo.email                              │
└─────────────────────────────────────────────────────────┘
         [ADD OR REMOVE SCOPES] [SAVE AND CONTINUE]
```

### Test Users Page
```
┌─────────────────────────────────────────┐
│ Test users                              │
├─────────────────────────────────────────┤
│ [+ ADD USERS]                           │
│                                         │
│ your-email@gmail.com              [X]   │
│ client@gmail.com                  [X]   │
│                                         │
│ You can add up to 100 test users       │
└─────────────────────────────────────────┘
         [SAVE AND CONTINUE]
```

---

## Need More Help?

If you get stuck:

1. **Can't find a specific setting?**
   - Take a screenshot and describe what you see
   - I'll guide you through it

2. **Error messages?**
   - Copy the exact error message
   - Let me know what step you were on

3. **Not sure what to enter?**
   - Ask! I can provide specific values for your situation

---

**Next Step**: After completing this, move on to creating OAuth credentials!

See: `OAUTH_SETUP_GUIDE.md` - Section 4: "Create OAuth 2.0 Credentials"
