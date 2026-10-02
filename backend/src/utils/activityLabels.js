// Turns a matched Express route (baseUrl + route pattern, e.g.
// "/api/jobs" + "/:id") plus an HTTP method into a human-readable label
// for the activity log admin view — "Updated a Job" instead of
// "PATCH /api/jobs/:id". Deliberately keyed on the route PATTERN, not the
// resolved URL, so no record IDs end up embedded in the label text.
//
// Anything not explicitly listed below still gets logged — it just falls
// back to a plainer "{METHOD} {path}" label rather than being silently
// dropped. Extend this table as new routes get added; it's additive, so
// a missing entry never breaks logging.

const ENTRIES = [
  // Jobs
  { method: 'GET',    base: '/api/jobs',      path: '',     label: 'Viewed Jobs list' },
  { method: 'GET',    base: '/api/jobs',      path: '/:id', label: 'Viewed a Job' },
  { method: 'POST',   base: '/api/jobs',      path: '',     label: 'Created a Job' },
  { method: 'PATCH',  base: '/api/jobs',      path: '/:id', label: 'Updated a Job' },
  { method: 'PUT',    base: '/api/jobs',      path: '/:id', label: 'Updated a Job' },
  { method: 'DELETE', base: '/api/jobs',      path: '/:id', label: 'Deleted a Job' },

  // Clients
  { method: 'GET',    base: '/api/clients',   path: '',     label: 'Viewed Clients list' },
  { method: 'GET',    base: '/api/clients',   path: '/:id', label: 'Viewed a Client' },
  { method: 'POST',   base: '/api/clients',   path: '',     label: 'Created a Client' },
  { method: 'PATCH',  base: '/api/clients',   path: '/:id', label: 'Updated a Client' },
  { method: 'PUT',    base: '/api/clients',   path: '/:id', label: 'Updated a Client' },
  { method: 'DELETE', base: '/api/clients',   path: '/:id', label: 'Deleted a Client' },

  // Projects / Photos
  { method: 'GET',    base: '/api/projects',  path: '',     label: 'Viewed Projects list' },
  { method: 'GET',    base: '/api/projects',  path: '/:id', label: 'Viewed a Project' },
  { method: 'POST',   base: '/api/projects',  path: '',     label: 'Created a Project' },
  { method: 'PATCH',  base: '/api/projects',  path: '/:id', label: 'Updated a Project' },
  { method: 'DELETE', base: '/api/projects',  path: '/:id', label: 'Deleted a Project' },
  { method: 'POST',   base: '/api/photos',    path: '',     label: 'Uploaded a photo' },
  { method: 'DELETE', base: '/api/photos',    path: '/:id', label: 'Deleted a photo' },

  // Diagrams
  { method: 'GET',    base: '/api/diagrams',  path: '',     label: 'Viewed Diagrams list' },
  { method: 'GET',    base: '/api/diagrams',  path: '/:id', label: 'Opened a Diagram' },
  { method: 'POST',   base: '/api/diagrams',  path: '',     label: 'Created a Diagram' },
  { method: 'PATCH',  base: '/api/diagrams',  path: '/:id', label: 'Edited a Diagram' },
  { method: 'DELETE', base: '/api/diagrams',  path: '/:id', label: 'Deleted a Diagram' },

  // Emails — the fact that the page/feature was used, never the content.
  { method: 'GET',    base: '/api/emails',    path: '',     label: 'Viewed Emails' },
  { method: 'GET',    base: '/api/emails',    path: '/:id', label: 'Opened an email' },
  { method: 'DELETE', base: '/api/emails',    path: '/:id', label: 'Deleted an email' },
  { method: 'POST',   base: '/api/email-sync', path: '/:provider/sync', label: 'Synced email' },

  // Calendar
  { method: 'GET',    base: '/api/calendar-events', path: '', label: 'Viewed Calendar' },
  { method: 'POST',   base: '/api/calendar-events', path: '', label: 'Created a calendar event' },

  // Dashboard / Analytics
  { method: 'GET',    base: '/api/dashboard', path: '',     label: 'Viewed Dashboard' },

  // Marketing
  { method: 'POST',   base: '/api/automation', path: '/review-request',   label: 'Sent review requests' },
  { method: 'POST',   base: '/api/automation', path: '/referral-request', label: 'Sent referral requests' },

  // Integrations
  { method: 'GET',    base: '/api/integrations', path: '',          label: 'Viewed Integrations' },
  { method: 'GET',    base: '/api/integrations', path: '/:provider', label: 'Opened an integration' },
  { method: 'POST',   base: '/api/integrations', path: '/:provider/sync', label: 'Ran an integration sync' },
  { method: 'GET',    base: '/api/oauth',        path: '/quickbooks/auth-url', label: 'Started QuickBooks connection' },

  // Invitations / team
  { method: 'POST',   base: '/api/invitations', path: '',     label: 'Sent a team invitation' },
  { method: 'POST',   base: '/api/auth',        path: '/register', label: 'Created a team member account' },

  // Auth (non-login — login success/failure is captured separately)
  { method: 'GET',    base: '/api/auth',        path: '/me',   label: 'Loaded profile' },
  { method: 'POST',   base: '/api/auth',        path: '/logout', label: 'Logged out' },
];

function getActionLabel(method, baseUrl, routePath) {
  const normalizedPath = routePath === '/' ? '' : (routePath || '');
  const hit = ENTRIES.find(
    e => e.method === method && e.base === baseUrl && e.path === normalizedPath
  );
  if (hit) return hit.label;
  return `${method} ${baseUrl}${normalizedPath}`;
}

module.exports = { getActionLabel };
