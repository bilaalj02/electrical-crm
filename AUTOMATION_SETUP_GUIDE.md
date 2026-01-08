# Email-to-Job Automation & Google Calendar Integration Setup Guide

## 🎉 Features Implemented

### 1. **AI-Powered Email Classification**
- Automatically classifies emails as work-related or personal using GPT-4o-mini
- Analyzes email content and subject lines with confidence scores
- Bulk classification available for processing large volumes of emails

### 2. **Email-to-Job Automation**
- Extract job details from emails using AI
- Auto-creates jobs with extracted customer information
- Links emails to jobs for easy reference
- Automatically finds or creates client records

### 3. **Google Calendar Integration**
- Sync jobs to Google Calendar automatically
- Color-coded calendar events based on job status
- Auto-updates events when job details change
- Bulk sync multiple jobs at once

---

## 📋 Prerequisites

### 1. OpenAI API Key
You need an OpenAI API key for AI features.

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Google Calendar API (Already configured for Gmail OAuth)
The Google Calendar API is automatically available when you connect a Gmail account since they share the same OAuth scopes.

**No additional setup needed** - the existing Google OAuth configuration already includes calendar access!

---

## ⚙️ Backend Configuration

### Add to `.env` file:

```env
# OpenAI for AI features
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google OAuth (you should already have these)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/oauth/gmail/callback
```

### Verify Google OAuth Scopes

Make sure your Google Cloud Console project has these scopes enabled:
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/calendar` ← Calendar access
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

---

## 🚀 Backend API Endpoints

### Email Classification

#### Auto-Classify Unclassified Emails
```
POST /api/automation/auto-classify-emails
Authorization: Bearer <token>
Body: { "limit": 50 }
```
Classifies up to 50 unclassified emails using AI.

#### Analyze Single Email
```
POST /api/automation/analyze-email/:emailId
Authorization: Bearer <token>
```
Analyzes if an email is a job request and auto-classifies it if confidence > 70%.

### Email-to-Job Conversion

#### Extract Job Details
```
POST /api/automation/extract-job/:emailId
Authorization: Bearer <token>
```
Returns extracted job information from email.

#### Create Job from Email
```
POST /api/automation/create-job-from-email
Authorization: Bearer <token>
Body: {
  "emailId": "email-mongodb-id",
  "jobData": { ...extracted job data... },
  "createCalendarEvent": true  // optional
}
```
Creates a job, finds/creates client, links email, and optionally syncs to calendar.

### Google Calendar Sync

#### Sync Job to Calendar
```
POST /api/automation/sync-to-calendar/:jobId
Authorization: Bearer <token>
```
Syncs a single job to Google Calendar.

#### Remove from Calendar
```
DELETE /api/automation/remove-from-calendar/:jobId
Authorization: Bearer <token>
```
Removes a job's calendar event.

#### Bulk Sync
```
POST /api/automation/bulk-sync-calendar
Authorization: Bearer <token>
Body: {
  "jobIds": ["job-id-1", "job-id-2", ...]
}
```
Syncs multiple jobs to calendar at once.

---

## 🎨 Frontend Implementation

### Email Detail View - Convert to Job Button

Add this button to the email detail section in `Emails.jsx`:

```jsx
{selectedEmail && selectedEmail.isWorkRelated && (
  <button
    className="btn btn-primary"
    onClick={async () => {
      // Extract job details
      const response = await axios.post(
        `${API_URL}/automation/extract-job/${selectedEmail._id}`
      );

      if (response.data.success) {
        // Show extracted data and allow editing before creating job
        setExtractedJobData(response.data.jobData);
        setShowCreateJobModal(true);
      }
    }}
  >
    Convert to Job
  </button>
)}
```

### Auto-Classification Button

Add to Emails page header:

```jsx
<button
  className="btn-secondary"
  onClick={async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/automation/auto-classify-emails`,
        { limit: 50 }
      );
      alert(`Classified ${response.data.results.classified} emails!`);
      fetchEmails(); // Refresh list
    } catch (error) {
      alert('Error classifying emails');
    } finally {
      setLoading(false);
    }
  }}
>
  AI Auto-Classify
</button>
```

### Calendar Sync Button in Job Detail

Add to `JobDetail.jsx`:

```jsx
{job.scheduledDate && (
  <button
    className="btn-secondary"
    onClick={async () => {
      try {
        const response = await axios.post(
          `${API_URL}/automation/sync-to-calendar/${job._id}`
        );
        alert('Synced to Google Calendar!');
        window.open(response.data.eventLink, '_blank');
      } catch (error) {
        alert('Error syncing to calendar. Make sure you have a Google account connected.');
      }
    }}
  >
    {job.calendarEventId ? '🔄 Update Calendar' : '📅 Add to Calendar'}
  </button>
)}
```

---

## 🔄 Workflow Examples

### Example 1: Email comes in about electrical work

1. Email arrives and syncs to CRM
2. User clicks "AI Auto-Classify" button
3. AI analyzes and marks it as work-related
4. User clicks email, sees it's work-related
5. Clicks "Convert to Job" button
6. AI extracts customer info, job description, priority
7. User reviews and clicks "Create Job"
8. Job created, client created/linked, calendar event added
9. Customer receives confirmation email

### Example 2: Scheduling a job to calendar

1. User creates or edits a job
2. Sets scheduled date
3. Clicks "Add to Calendar" button
4. Event appears in Google Calendar with:
   - Job title and customer name
   - Customer contact info and address
   - Duration based on estimated hours
   - Color based on job status
   - Reminders (1 day + 1 hour before)

---

## 📊 Calendar Event Colors

Jobs are color-coded in Google Calendar:
- Gray: Quote, Cancelled
- Blue: Approved
- Yellow: Scheduled
- Orange: In Progress
- Green: Completed, Paid
- Red: Invoiced

---

## 🧪 Testing

### Test Email Classification
1. Sync some emails
2. Open Emails page
3. Click "AI Auto-Classify"
4. Check that work-related emails are properly classified

### Test Email-to-Job
1. Find a work-related email about electrical service
2. Click "Analyze" or "Convert to Job"
3. Verify extracted data is accurate
4. Create job and verify it appears in Jobs page

### Test Calendar Sync
1. Make sure you have a Gmail account connected
2. Create a job with a scheduled date
3. Click "Add to Calendar"
4. Check your Google Calendar to see the event

---

## 🐛 Troubleshooting

### "No active Gmail account found"
- Make sure you've connected a Google account via OAuth
- The calendar feature requires a Gmail connection

### "Failed to extract job details"
- Check that `OPENAI_API_KEY` is set in `.env`
- Verify the API key is valid
- Check backend logs for error details

### "Calendar event not appearing"
- Refresh your Google Calendar
- Check that the job has a scheduled date
- Verify the Google account has calendar access

### AI classification seems inaccurate
- The AI uses GPT-4o-mini with 70% confidence threshold
- You can manually reclassify emails if needed
- More training data improves accuracy over time

---

## 💡 Next Steps

Now that automation is set up, consider:
1. Adding UI buttons to frontend (examples above)
2. Testing with real customer emails
3. Training team on "Convert to Job" workflow
4. Setting up automated follow-ups (next feature!)

---

## 📝 Notes

- Calendar sync requires an active Gmail OAuth connection
- AI features require OpenAI API key (costs ~$0.002 per email analyzed)
- Job extraction works best with clear, well-written emails
- Calendar events auto-update when job status/date changes (if you re-sync)

Enjoy your new automation features! 🎉
