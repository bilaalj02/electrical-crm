# Electrical Company CRM

Complete work management system for electrical companies with unified email inbox, job tracking, and analytics.

## Features Implemented ✅

### Email Centralization
- **Multi-Account Support**: Gmail (x2), Microsoft/Outlook, GoDaddy
- **Unified Inbox**: See all emails in one place
- **Smart Filtering**: Filter by account, work/non-work, read/unread
- **Email Classification**: Manually classify emails as work-related or personal
- **Search**: Full-text search across all emails
- **Automatic Sync**: Background synchronization every 5 minutes
- **Real-time Stats**: View total emails, unread count, work emails

### User Interface
- Clean, modern interface
- Responsive design (works on desktop and mobile)
- Email list with preview
- Detailed email view
- Filter and search capabilities
- Account type badges

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Database**: MongoDB
- **Email APIs**:
  - Gmail: OAuth 2.0 via Google APIs
  - Microsoft: OAuth 2.0 via Microsoft Graph API
  - GoDaddy: IMAP protocol

## Project Structure

```
electrical-crm/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── Email.js            # Email database schema
│   │   ├── services/
│   │   │   ├── gmailService.js     # Gmail integration
│   │   │   ├── microsoftService.js # Microsoft integration
│   │   │   ├── godaddyService.js   # GoDaddy IMAP
│   │   │   └── emailSyncService.js # Unified sync coordinator
│   │   ├── routes/
│   │   │   └── emailRoutes.js      # Email API endpoints
│   │   ├── config/
│   │   │   └── database.js         # MongoDB connection
│   │   └── server.js               # Express server
│   ├── .env                        # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main React component
│   │   └── App.css                 # Styles
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Email account credentials (Gmail, Microsoft, GoDaddy)

### Installation

1. **Clone or navigate to the project**:
```bash
cd /Users/elvis/electrical-crm
```

2. **Setup Backend**:
```bash
cd backend
npm install
```

3. **Setup Frontend**:
```bash
cd ../frontend
npm install
```

4. **Configure Environment Variables**:
Edit `backend/.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/electrical-crm

# Gmail Account 1
GMAIL1_CLIENT_ID=your-client-id
GMAIL1_CLIENT_SECRET=your-client-secret
GMAIL1_REFRESH_TOKEN=your-refresh-token
GMAIL1_EMAIL=email1@gmail.com

# Gmail Account 2
GMAIL2_CLIENT_ID=your-client-id
GMAIL2_CLIENT_SECRET=your-client-secret
GMAIL2_REFRESH_TOKEN=your-refresh-token
GMAIL2_EMAIL=email2@gmail.com

# Microsoft
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_EMAIL=your-email@outlook.com

# GoDaddy
GODADDY_EMAIL=your-email@yourdomain.com
GODADDY_PASSWORD=your-password
```

5. **Start MongoDB** (if running locally):
```bash
mongod
```

6. **Start Backend** (in a new terminal):
```bash
cd backend
npm start
```

7. **Start Frontend** (in a new terminal):
```bash
cd frontend
npm run dev
```

8. **Open the app**:
Navigate to `http://localhost:5173`

## Usage

### Syncing Emails

1. Click the "Sync Emails" button in the top right
2. The system will fetch emails from all 4 configured accounts
3. Emails appear in the unified inbox

### Filtering Emails

Use the filter dropdowns to:
- Filter by email account (Gmail 1, Gmail 2, Microsoft, GoDaddy)
- Filter by classification (Work, Non-Work, All)
- Filter by read status (Unread Only, Read Only, All)
- Search emails by text

### Classifying Emails

- Click "Work" or "Non-Work" buttons on any unclassified email
- Classification helps prioritize work-related communications
- Reclassify emails at any time from the detail view

### Viewing Email Details

- Click any email in the list to view full details
- See complete email headers, body, and attachments
- Mark as read/unread
- Change classification

## API Endpoints

The backend provides a REST API:

- `GET /api/emails` - List emails with filters
- `GET /api/emails/:id` - Get single email
- `PATCH /api/emails/:id` - Update email (read status, classification, job link)
- `POST /api/emails/sync` - Sync all accounts
- `POST /api/emails/sync/:accountType` - Sync specific account
- `GET /api/emails/stats/summary` - Get email statistics

## OAuth Setup Guide

### Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:5000/auth/gmail/callback`
6. Use the client ID and secret in your `.env` file
7. Visit the auth URL to get refresh token

### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register an application
3. Add Mail.Read and Mail.ReadWrite permissions
4. Add redirect URI: `http://localhost:5000/auth/microsoft/callback`
5. Create a client secret
6. Use credentials in your `.env` file

### GoDaddy IMAP

GoDaddy uses standard IMAP - just provide your email and password in `.env`.

## Next Steps

The foundation is complete! Here are the remaining features to implement:

- [ ] Job management system (create, edit, track jobs)
- [ ] Job costing module (labor, materials, overhead)
- [ ] Client management
- [ ] Materials tracking
- [ ] Invoice generation
- [ ] Job prioritization by payment amount
- [ ] Email-to-job linking
- [ ] Analytics dashboard
- [ ] Authentication system
- [ ] Notifications
- [ ] Production deployment

## Development

- Backend runs on port 5000
- Frontend runs on port 5173
- Auto-sync runs every 5 minutes (configurable in `.env`)
- All API requests from frontend go to `http://localhost:5000/api`

## Troubleshooting

**Backend won't start**:
- Ensure MongoDB is running
- Check `.env` file exists and has correct values
- Run `npm install` in backend directory

**Frontend won't connect**:
- Ensure backend is running on port 5000
- Check browser console for errors
- Verify CORS is enabled in backend

**Email sync fails**:
- Check email credentials in `.env`
- Verify OAuth tokens are valid (may need to refresh)
- Check console logs for specific error messages

## License

Proprietary - For internal use only
