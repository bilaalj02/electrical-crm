const ActivityLog = require('../models/ActivityLog');
const { getActionLabel } = require('../utils/activityLabels');

// Mounted once, early, application-wide — NOT per-route — so logging never
// has to be remembered/added by hand in every controller. It only writes
// to the log on res.on('finish'), which fires AFTER the full request
// lifecycle (including each route's own `auth` middleware resolving
// req.user) has completed. That's what makes this safe to mount before
// the auth middleware runs on any individual route: by the time the
// finish callback actually executes, req.user is already populated if the
// request was authenticated.
//
// Logging is always best-effort: a failed log write is swallowed and
// never allowed to affect the real response, mirroring the existing
// integration error logger's "logging must never cause a second failure"
// rule.
function activityLogger(req, res, next) {
  res.on('finish', () => {
    // Skip static assets and anything outside /api — nothing useful to a
    // "what did someone do" log lives there.
    if (!req.originalUrl.startsWith('/api')) return;

    // Login attempts are logged explicitly in authRoutes.js instead (both
    // the failure and success paths need detail — attemptedEmail,
    // failureReason — that doesn't fit this generic shape), so skip here
    // to avoid a duplicate, less-detailed entry for the same request.
    if (req.baseUrl === '/api/auth' && (req.path === '/login' || req.path === '/')) return;

    const method = req.method;
    const baseUrl = req.baseUrl || '';
    const routePath = req.route ? req.route.path : req.path;
    const actionLabel = getActionLabel(method, baseUrl, routePath);

    ActivityLog.create({
      category: 'action',
      userId: req.user ? req.user._id : null,
      userRole: req.user ? req.user.role : null,
      isDeveloperAction: req.user ? !!req.user.isDeveloper : false,
      actionLabel,
      method,
      route: `${baseUrl}${routePath === '/' ? '' : routePath}`,
      statusCode: res.statusCode,
      ip: req.ip
    }).catch(err => {
      console.error('Failed to write activity log:', err.message);
    });
  });

  next();
}

module.exports = activityLogger;
