# Electrical CRM - Backend

Email centralization and job management system for electrical companies.

## Features

- **Multi-Email Integration**: Centralize emails from Gmail (2 accounts), Microsoft, and GoDaddy
- **Automatic Sync**: Background email synchronization every 5 minutes
- **Email Classification**: Filter work-related vs non-work emails
- **Job Linking**: Link emails to specific jobs
- **REST API**: Complete API for email management

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/electrical-crm

# Gmail Accounts
GMAIL1_CLIENT_ID=your-client-id
GMAIL1_CLIENT_SECRET=your-client-secret
GMAIL1_REFRESH_TOKEN=your-refresh-token
GMAIL1_EMAIL=email1@gmail.com

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

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Emails

- `GET /api/emails` - Get all emails (with filtering)
  - Query params: `page`, `limit`, `accountType`, `isWorkRelated`, `isRead`, `search`

- `GET /api/emails/:id` - Get single email

- `PATCH /api/emails/:id` - Update email
  - Body: `{ isRead, isStarred, isWorkRelated, linkedJob }`

- `POST /api/emails/sync` - Sync all email accounts

- `POST /api/emails/sync/:accountType` - Sync specific account
  - Account types: `gmail1`, `gmail2`, `microsoft`, `godaddy`

- `GET /api/emails/stats/summary` - Get email statistics

### OAuth Setup

To get Gmail/Microsoft OAuth credentials:

1. **Gmail**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:5000/auth/gmail/callback`
   - Use the authorization URL to get tokens

2. **Microsoft**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register an application
   - Add Mail.Read and Mail.ReadWrite permissions
   - Add redirect URI: `http://localhost:5000/auth/microsoft/callback`
   - Get client ID and secret

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── models/
│   │   └── Email.js          # Email schema
│   ├── routes/
│   │   └── emailRoutes.js    # Email API routes
│   ├── services/
│   │   ├── gmailService.js       # Gmail integration
│   │   ├── microsoftService.js   # Microsoft integration
│   │   ├── godaddyService.js     # GoDaddy IMAP integration
│   │   └── emailSyncService.js   # Unified sync service
│   └── server.js             # Express server
├── .env
├── package.json
└── README.md
```

## Development

Run in development mode with auto-reload:
```bash
npm install -g nodemon
npm run dev
```

## Testing Email Sync

Once the server is running, trigger a manual sync:

```bash
curl -X POST http://localhost:5000/api/emails/sync
```

Check the results:
```bash
curl http://localhost:5000/api/emails/stats/summary
```

## Next Steps

- [ ] Set up OAuth for Gmail and Microsoft accounts
- [ ] Configure GoDaddy email credentials
- [ ] Build frontend UI
- [ ] Add email classification (AI or rules-based)
- [ ] Implement job management system
- [ ] Add authentication
