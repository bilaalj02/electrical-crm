# Employee Management & Projects System - Implementation Complete

This document outlines the new employee management system with role-based access control and the new Projects page for photo uploads.

## 🎉 What's New

### 1. **Employee Invitation System**
- Admin can send email invitations to employees
- Unique invitation tokens (expire in 7 days)
- Email invitations with signup links
- Invitation management dashboard

### 2. **Role-Based Access Control**
- **Admin**: Full access to all features
- **Employee**: Limited access (Home, Calendar, Jobs, Projects only)

### 3. **Projects Page**
- Upload photos organized by jobs
- Add notes to projects
- Tag photos (before/after)
- Filter and search projects
- Gallery view with metadata

## 📋 Access Matrix

| Page | Admin | Employee |
|------|-------|----------|
| Home | ✓ | ✓ |
| Emails | ✓ | ✗ |
| Jobs | ✓ | ✓ |
| Clients | ✓ | ✗ |
| Calendar | ✓ | ✓ |
| **Projects** | ✓ | ✓ |
| Analytics | ✓ | ✗ |
| Marketing | ✓ | ✗ |
| Settings | ✓ | ✗ |

## 🚀 Getting Started

### Backend Setup

1. **Install new dependencies:**
```bash
cd backend
npm install multer
```

2. **Update .env file** (add company name):
```env
# Company Name (for email invitations)
COMPANY_NAME=MES Electrical Services
```

**Note:** Invitations automatically use your existing Gmail API setup (GMAIL1). No SMTP needed!

3. **Start backend:**
```bash
npm start
```

### Frontend Setup

1. **Install new dependencies:**
```bash
cd frontend
npm install react-router-dom
```

2. **Start frontend:**
```bash
npm run dev
```

## 🔑 Admin Setup

### First Time Setup

If you don't have an admin account yet:

```bash
# Use the setup-admin endpoint
POST http://localhost:5000/api/auth/setup-admin

Body:
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securepassword"
}
```

This creates the first admin user. After that, new users must be invited by an admin.

## 👥 Inviting Employees

### Step 1: Login as Admin
Navigate to Settings > Employees

### Step 2: Send Invitation
1. Click "Invite Employee"
2. Enter employee email
3. Select role (Employee, Manager, Technician, Admin)
4. Click "Send Invitation"

### Step 3: Employee Signup
Employee receives an email with:
- Unique signup link (expires in 7 days)
- Company information
- Role assignment

Employee clicks link and completes signup form.

## 📂 Projects Page Features

### Creating Projects
1. Click "New Project"
2. Select associated job
3. Add title and description
4. Set project date

### Uploading Photos
1. Open a project
2. Click "Upload Photos"
3. Select multiple photos
4. Add caption and tags
5. Mark as before/after photos
6. Upload

### Adding Notes
1. Open a project
2. Scroll to Notes section
3. Type note content
4. Click "Add Note"

### Organization
- Filter by job
- Filter by status (active, completed, archived)
- Search by title/description
- Sort by date or name
- Grid or list view

## 🗄️ Database Models

### User Model Updates
```javascript
role: {
  type: String,
  enum: ['admin', 'employee', 'manager', 'technician', 'viewer'],
  default: 'employee'
}
```

### New Invitation Model
- Email
- Token (unique, expires in 7 days)
- Role
- Status (pending, accepted, expired)
- Invited by

### New Project Model
- Title, description
- Linked to Job
- Photos array (with metadata)
- Notes array
- Project date
- Status (active, completed, archived)

## 🔌 API Endpoints

### Invitations
```
POST   /api/invitations              # Send invitation (admin only)
GET    /api/invitations              # List invitations (admin only)
GET    /api/invitations/verify/:token # Verify token (public)
DELETE /api/invitations/:id          # Revoke invitation (admin only)
```

### Authentication
```
POST   /api/auth/signup              # Employee signup with token
POST   /api/auth/setup-admin         # Create first admin (if no users exist)
GET    /api/auth/users               # List all users (admin only)
PATCH  /api/auth/users/:id           # Update user (admin only)
DELETE /api/auth/users/:id           # Delete user (admin only)
```

### Projects
```
GET    /api/projects                 # List projects
GET    /api/projects/:id             # Get project details
POST   /api/projects                 # Create project
PATCH  /api/projects/:id             # Update project
DELETE /api/projects/:id             # Delete project (admin only)

POST   /api/projects/:id/photos      # Upload photos
DELETE /api/projects/:id/photos/:photoId  # Delete photo
PATCH  /api/projects/:id/photos/:photoId  # Update photo metadata

POST   /api/projects/:id/notes       # Add note
PATCH  /api/projects/:id/notes/:noteId    # Update note
DELETE /api/projects/:id/notes/:noteId    # Delete note
```

## 📧 Email Configuration

### Using Gmail API (Recommended)
Employee invitations automatically use your existing Gmail OAuth setup:
- Uses GMAIL1 account from your .env configuration
- Requires `gmail.send` scope (already added to gmailService.js)
- No additional SMTP configuration needed
- More reliable than SMTP

### Re-authenticating Gmail (if needed)
If emails fail to send, you may need to re-grant permissions:
1. Your Gmail OAuth may need the 'send' scope
2. Re-authenticate by visiting the OAuth URL
3. Grant all requested permissions including "Send email on your behalf"

## 🔒 Security Features

- JWT authentication
- Role-based access control
- Password hashing (bcrypt)
- Invitation token expiration
- Admin-only actions protected
- File upload validation (images only, 10MB max)

## 📱 Future Enhancements (Photo Editing)

The groundwork is laid for in-app photo editing:
- Add text overlays
- Draw annotations
- Add icons/stamps
- Crop and rotate
- Filters and adjustments

This will be implemented in a future phase.

## 🐛 Troubleshooting

### Email Not Sending
1. Check Gmail OAuth is configured (GMAIL1 in .env)
2. Verify Gmail API has 'send' scope enabled
3. Re-authenticate if needed (grant permissions again)
4. Check backend console for detailed error messages
5. Ensure GMAIL1_REFRESH_TOKEN is valid

### Photos Not Uploading
1. Check uploads directory exists: `backend/uploads/projects/`
2. Verify file permissions
3. Check file size (max 10MB)
4. Ensure file is an image format

### Employee Can't Access Page
1. Verify user role in database
2. Check that employee is logged in
3. Clear browser cache and localStorage
4. Re-login to refresh permissions

## 📝 Testing Checklist

- [ ] Admin can create account
- [ ] Admin can send employee invitation
- [ ] Employee receives invitation email
- [ ] Employee can signup with token
- [ ] Employee sees only allowed pages (Home, Calendar, Jobs, Projects)
- [ ] Admin sees all pages
- [ ] Projects can be created
- [ ] Photos can be uploaded
- [ ] Notes can be added
- [ ] Photos organized by job and date
- [ ] Settings page shows employees and invitations

## 🎯 Next Steps

1. Install dependencies (backend: multer, frontend: react-router-dom)
2. Configure SMTP settings in backend/.env
3. Create uploads directory
4. Test invitation flow
5. Upload sample photos to test Projects page

---

**Built with:** Node.js, Express, MongoDB, React, Multer, Nodemailer
**Developed:** February 2026
