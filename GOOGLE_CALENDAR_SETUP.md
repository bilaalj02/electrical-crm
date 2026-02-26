# Google Calendar Sync Setup Guide

This guide will help you set up Google Calendar integration for your Electrical CRM.

## Prerequisites

✅ Google account (Gmail)
✅ Google Cloud Platform project (same one used for Gmail OAuth)
✅ Existing Gmail OAuth credentials from your `.env` file

## Overview

The calendar sync functionality uses the **same Google OAuth credentials** that you're already using for Gmail integration. No additional setup is required on Google Cloud Platform!

## What's Already Configured

The following is already set up in your CRM:

1. ✅ **Backend Routes** (`/api/automation/sync-to-calendar/:jobId`)
2. ✅ **Google Calendar Service** (uses existing Gmail OAuth tokens)
3. ✅ **Job Model** (includes `calendarEventId` field)
4. ✅ **Frontend UI** (Calendar page with sync buttons)

## How It Works

1. **User connects Gmail account** via the Emails page
2. **OAuth tokens are stored** and used for both Gmail and Calendar access
3. **Calendar API scope** is already included in your Gmail OAuth flow
4. **Jobs with scheduled dates** can be synced to Google Calendar
5. **Calendar events** are automatically created, updated, or deleted

## Google Calendar API Scopes

Make sure your Google OAuth consent screen includes:

```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/calendar        ← For creating events
https://www.googleapis.com/auth/calendar.events  ← For managing events
```

### Adding Calendar Scopes (if not already added)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Click **Edit App**
5. In the **Scopes** section, click **Add or Remove Scopes**
6. Search for and add:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
7. Click **Update** and **Save and Continue**

### Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Library**
3. Search for **"Google Calendar API"**
4. Click on it and click **Enable**

## Using the Calendar Sync

### Sync a Single Job

1. Go to the **Calendar** page in your CRM
2. Click on any scheduled job
3. Click the **"Sync Now"** button
4. The job will be added to your Google Calendar

### Bulk Sync All Jobs

1. Go to the **Calendar** page
2. Click the **"Sync All to Calendar"** button
3. All scheduled jobs will be synced to Google Calendar

### Features

- **Color-coded events** based on job status:
  - Gray: Quote
  - Blue: Approved
  - Yellow: Scheduled
  - Orange: In Progress
  - Green: Completed/Paid
  - Red: Invoiced

- **Event Details** include:
  - Job title and client name
  - Job number
  - Client contact information
  - Job location (if different from client address)
  - Job description
  - Duration based on estimated labor hours

- **Automatic Reminders**:
  - Email reminder 24 hours before
  - Popup reminder 1 hour before

## API Endpoints

### Sync Single Job
```
POST /api/automation/sync-to-calendar/:jobId
Headers: Authorization: Bearer <token>
```

### Bulk Sync Jobs
```
POST /api/automation/bulk-sync-calendar
Headers: Authorization: Bearer <token>
Body: { "jobIds": ["jobId1", "jobId2", ...] }
```

### Remove from Calendar
```
DELETE /api/automation/remove-from-calendar/:jobId
Headers: Authorization: Bearer <token>
```

## Troubleshooting

### "No active Gmail account found"

**Solution**: Connect a Gmail account first:
1. Go to **Emails** page
2. Click **"Connect Account"**
3. Select Gmail
4. Complete OAuth flow

### "Failed to sync to calendar"

**Solution**: Check the following:
1. Google Calendar API is enabled in Google Cloud Console
2. Calendar scopes are added to your OAuth consent screen
3. Your Gmail OAuth tokens haven't expired (re-authenticate if needed)
4. Job has a scheduled date set

### "Invalid credentials" or "Token expired"

**Solution**: Reconnect your Gmail account:
1. Go to **Emails** page
2. Disconnect your Gmail account
3. Connect it again to refresh OAuth tokens

## Environment Variables

No additional environment variables needed! The calendar sync uses the same credentials as Gmail:

```env
# Already in your .env file
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/oauth/google/callback
```

## Testing the Integration

1. **Create a test job**:
   - Go to **Jobs** page
   - Create a new job with a scheduled date

2. **Sync to calendar**:
   - Go to **Calendar** page
   - Find the job on the calendar
   - Click on it and click **"Sync Now"**

3. **Check Google Calendar**:
   - Open [Google Calendar](https://calendar.google.com)
   - Verify the event was created with correct details

4. **Update the job**:
   - Change the scheduled date or description
   - Click **"Sync Now"** again
   - Verify the event is updated in Google Calendar

5. **Delete from calendar**:
   - Use the delete endpoint or cancel the job
   - Verify the event is removed from Google Calendar

## Support

If you encounter issues:
1. Check the backend console for error logs
2. Verify Google Calendar API is enabled
3. Ensure OAuth scopes include calendar access
4. Try disconnecting and reconnecting your Gmail account

---

**Note**: The calendar sync is currently working with the Gmail OAuth tokens. Make sure users have connected a Gmail account before trying to sync jobs to calendar.
