# Installation Checklist - Employee Management & Projects

## ✅ Quick Setup Guide

Follow these steps in order to get the new features working:

### 1. Backend Setup

```bash
cd backend
```

#### Install Dependencies
```bash
npm install multer
```

#### Update .env File
Add this line to your `backend/.env` file:

```env
# Company Name (for email invitations)
COMPANY_NAME=MES Electrical Services
```

**Note:** Employee invitations automatically use your existing Gmail API setup (GMAIL1 account from OAuth configuration). No additional SMTP configuration needed!

#### Create Uploads Directory
```bash
mkdir -p uploads/projects
```

#### Start Backend
```bash
npm start
```

✅ Backend should be running on http://localhost:5000

---

### 2. Frontend Setup

```bash
cd frontend
```

#### Install Dependencies
```bash
npm install react-router-dom
```

#### Start Frontend
```bash
npm run dev
```

✅ Frontend should be running on http://localhost:5173

---

### 3. Create Admin Account

If you don't have an admin account yet, create one:

**Option 1: Use existing createAdmin.js script**
```bash
cd backend
node createAdmin.js
```

**Option 2: Use API endpoint**
```bash
curl -X POST http://localhost:5000/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "securepassword123"
  }'
```

✅ Admin account created!

---

### 4. Test the System

#### A. Test Login
1. Open http://localhost:5173
2. Login with admin credentials
3. Verify you can see all pages (Home, Emails, Jobs, Clients, Calendar, Projects, Analytics, Marketing)

#### B. Test Employee Invitation
1. Click on user menu (bottom left)
2. Click "Settings"
3. Click "Invite Employee"
4. Enter email: `employee@example.com`
5. Click "Send Invitation"
6. Check terminal for invitation link (or check email)

#### C. Test Employee Signup
1. Copy the signup link from the invitation email
2. Open in a new browser/incognito window
3. Complete signup form
4. Login as employee
5. Verify you can ONLY see: Home, Calendar, Jobs, Projects

#### D. Test Projects Page
1. Login as admin or employee
2. Click "Projects" in sidebar
3. Click "New Project"
4. Select a job, add title
5. Create project
6. Click "Upload Photos"
7. Select images from your computer
8. Upload and verify they appear

✅ All systems working!

---

## 🔧 Troubleshooting

### Issue: Email not sending
**Solution:**
- Verify Gmail OAuth is configured (GMAIL1 account in .env)
- Check that Gmail API has 'send' scope enabled
- Re-authenticate if needed: Visit the OAuth URL and grant permissions
- Check backend terminal for detailed error messages

### Issue: Photos not uploading
**Solution:**
- Check `backend/uploads/projects/` directory exists
- Verify write permissions on uploads folder
- Check file size (max 10MB)
- Ensure files are images (jpg, png, gif, etc.)

### Issue: Employee can't access pages
**Solution:**
- Verify user role is "employee" in database
- Clear browser cache
- Logout and login again
- Check browser console for errors

### Issue: "Cannot find module 'multer'"
**Solution:**
```bash
cd backend
npm install multer
```

### Issue: "Cannot find module 'react-router-dom'"
**Solution:**
```bash
cd frontend
npm install react-router-dom
```

---

## 📚 Documentation

- **Full Setup Guide**: See `EMPLOYEE_MANAGEMENT_SETUP.md`
- **API Documentation**: See `EMPLOYEE_MANAGEMENT_SETUP.md` (API Endpoints section)
- **User Roles**: See `EMPLOYEE_MANAGEMENT_SETUP.md` (Access Matrix)

---

## 🎯 Quick Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Admin account created
- [ ] Can login as admin
- [ ] Can see all pages as admin
- [ ] Can send employee invitation
- [ ] Can signup as employee
- [ ] Employee sees limited pages only
- [ ] Can create project
- [ ] Can upload photos
- [ ] Can add notes to project
- [ ] Photos display correctly

---

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review `EMPLOYEE_MANAGEMENT_SETUP.md`
3. Check browser console for errors
4. Check backend terminal for errors

---

**Ready to start?** Begin with Step 1: Backend Setup!
