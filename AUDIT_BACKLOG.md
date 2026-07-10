# Electrical CRM + MES MCP — Audit Backlog

> Generated 2026-07-09. Items marked ✅ are completed. Items below are queued for future sprints.

---

## 🔴 CRITICAL — Security (Do Before Going Live)

### 1. Rotate all exposed credentials
The `backend/.env` file was committed to GitHub and contains live credentials.
**Every one of these must be regenerated immediately:**
- MongoDB Atlas password (`meselectrical:meselectrical-1@...`)
- `JWT_SECRET` (currently hardcoded hash)
- `ENCRYPTION_KEY`
- Google OAuth Client ID + Secret
- Microsoft OAuth Client ID + Secret
- Resend API key (`re_WuunbZUg_...`)

**Steps:**
1. Rotate each credential in its respective console (MongoDB Atlas, Google Cloud, Microsoft Azure, Resend dashboard)
2. Update `backend/.env` with new values
3. Remove `.env` from git history: `npx git-filter-repo --path backend/.env --invert-paths`
4. Verify `backend/.env` is in `.gitignore` (it is listed, but was still committed — confirm it's not force-tracked)

---

## 🟠 HIGH — Completed This Session ✅

- ✅ Add `auth` middleware to unprotected routes (GET/POST jobs, GET clients, POST clients, GET emails)
- ✅ Add `authorize('admin', 'manager')` role check to PATCH/DELETE jobs and clients
- ✅ Fix `assignedUsers` populate (model already correct — was a false positive)
- ✅ Add auth headers to Home.jsx, Analytics.jsx, Jobs.jsx, Clients.jsx
- ✅ Reset JobForm after submit
- ✅ Delete Jobs-new.jsx duplicate
- ✅ Consistent error toast handling across components
- ✅ Confirmation modal on photo/comment delete (already existed)
- ✅ Mobile responsiveness improvements (sidebar overlay, filter stacking, modal full-screen)
- ✅ Remove unused ExpenseEntryModal import from Jobs.jsx

---

## 🟡 MEDIUM — CRM Feature Gaps (Next Sprints)

### Invoicing & Quoting (HIGHEST PRIORITY for business)
- No invoice PDF generation — owner cannot send formal invoices to customers
- No quote PDF / email-to-client flow — quotes exist in system but customer never receives a document
- No quote expiry tracking (21-day auto-cancel exists in MCP but not surfaced in UI)
- No quote-to-job conversion button
- No payment reminder automation visible in UI

### Time Tracking
- Job has `laborHours` field but it's manual entry after the fact
- No punch in/out for technicians in the field
- No per-job time log with entries

### Employee Management
- User roles exist but no employee profile page
- No certifications / license tracking per employee
- No availability calendar per employee
- No expense submission (mileage, materials bought in field)

### Customer Communication
- No SMS to customers (MCP has Twilio but MCP .env is unconfigured)
- No automated job status updates to customer (started, on way, completed)
- No customer portal to check job status

### Scheduling Depth
- Calendar exists but no resource blocking (equipment, crew)
- Technicians have no simple "my schedule today" view
- No route optimization for multi-job days

### Reporting
- Dashboard has basic KPIs
- No profitability by job type or customer
- No monthly/quarterly revenue trend charts
- No export to PDF or Excel for accountant
- No technician performance metrics

---

## 🟡 MEDIUM — Backend Issues

### Missing .env variable documentation
- `process.env.MCP_WEBHOOK_URL` referenced in jobRoutes.js but not in .env.example
- `process.env.COMPANY_NAME` used in invitations but not documented
- Create/update `.env.example` with all variables

### Dead code in server.js
- `emailSyncService` is commented out but the OAuth callback routes still reference it
- If `/auth/gmail/callback` or `/auth/microsoft/callback` are called, will throw ReferenceError
- Either remove the dead callback routes or implement the fallback properly

### Analytics empty state
- Analytics page shows blank charts when no data exists
- Add "No data yet — create your first job to see analytics" empty state

---

## 🟡 MEDIUM — UI/UX Improvements

### Role-specific dashboards
- All roles see the same dashboard
- Technician should see: today's jobs, time tracking, expense submission
- Manager should see: KPIs, team assignments, quotes pending approval
- Admin sees everything

### Mobile — modals
- Modals on mobile could be improved further (full-screen takeover on very small screens)

### Calendar
- Month view only — no week or day view for detailed daily scheduling
- Technicians cannot see their own schedule without admin access

### Confirmation modals
- Photo delete ✅ already has confirmation
- Comment delete ✅ already has confirmation
- Consider adding confirmation when disconnecting email/calendar OAuth accounts

---

## 🟢 NICE TO HAVE — Future Features

- Recurring job templates (for maintenance contracts)
- Customer portal (client can check job status online without calling)
- Parts / inventory management (track stock, reorder points)
- Technician expense submissions (receipts, mileage)
- Equipment tracking (which vehicle/tool is on which job)
- Multi-location support (if business expands)
- Mobile app / PWA for field technicians

---

## MES MCP — Separate Backlog

### Blocking (MCP does nothing without these)
- Fill `CRM_ADMIN_EMAIL` + `CRM_ADMIN_PASSWORD` in `.env`
- Fill `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `OWNER_PHONE_NUMBER`
- Fill `SMTP_PASS` (Gmail app password)
- Fill `GOOGLE_REVIEW_LINK` (Google Business review URL)

### Integration Issues
- Google Calendar sync is skipped in MCP — jobs booked via MCP won't appear in calendar automatically
- No retry on failed automation webhooks — if Twilio is down, owner SMS is lost forever
- Delayed tasks (e.g. 2-hr review request SMS) held in memory — lost on server restart
- Quote auto-cancel at 21 days doesn't notify the customer

### Missing MCP Tools
- Technician management (`create_technician`, `list_technicians`, `get_availability`)
- Material/expense cost updates mid-job
- Automation log viewer (see what fired and what failed)
- Project/photo management tools (currently read-only)
- Payment installment / partial payment support
- Webhook retry / manual trigger tool

### Code Quality
- Add input validation to tool handlers before sending to CRM API
- Add startup check: verify CRM is reachable before serving tools
- Create `.env.example` with all required variables documented
- Add webhook signature verification (currently only checks shared secret header)
