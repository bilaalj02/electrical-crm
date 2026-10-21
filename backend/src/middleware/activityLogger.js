const ActivityLog = require('../models/ActivityLog');
const { getActionLabel } = require('../utils/activityLabels');
const { featureFor, recordUsage, recordError, scopeOf } = require('../services/monitoring');

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
  // Remember the error text a route sends back with a 5xx, e.g.
  // res.status(500).json({ error: err.message }), so the error monitor can
  // report what actually broke. Only the error/message fields, never the rest.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 500 && body && typeof body === 'object') {
      res.locals.errorMessage = [body.error, body.message].filter(Boolean).join(': ');
    }
    return originalJson(body);
  };

  res.on('finish', () => {
    // Skip static assets and anything outside /api — nothing useful to a
    // "what did someone do" log lives there.
    if (!req.originalUrl.startsWith('/api')) return;

    // Usage counts and error capture (see services/monitoring.js). The
    // app's own page-open / crash reports are counted by their routes.
    // Requests answered before reaching their router (e.g. Play mode's 402) have no
    // baseUrl/route yet, so work them out from the URL itself.
    const fromUrl = req.originalUrl.split('?')[0].match(/^(\/api\/[^/]+)(.*)$/) || [];
    const usageBase = req.baseUrl || fromUrl[1] || '';
    const usageRoute = req.route ? req.route.path : (req.baseUrl ? req.path : (fromUrl[2] || '/').replace(/\/[0-9a-f]{24}(?=\/|$)/gi, '/:id'));
    const beacon = usageBase === '/api/monitoring' && (usageRoute === '/page' || usageRoute === '/client-error');
    if (beacon) return;
    const feature = featureFor(usageBase, usageRoute === '/' ? '' : usageRoute);
    const failed = res.statusCode >= 500;
    const who = req.user || res.locals.monitorUser;
    const isLogin = feature === 'Sign-in' && req.method === 'POST';
    // Usage = page opens (reported by the app), actions (create/edit/delete/
    // send...) and opening one specific record. Plain list/stat loads are
    // skipped: the dashboard and background checks load those constantly,
    // which would make every feature look used. Failures are always counted.
    const opensRecord = /:/.test(usageRoute);
    const countsAsUse = req.method !== 'GET' || opensRecord;
    if (countsAsUse || failed) recordUsage({
      feature,
      label: isLogin
        ? (res.statusCode < 400 ? 'Signed in' : 'Failed sign-in')
        : `${res.statusCode === 402 ? 'Tried in Play mode: ' : ''}${getActionLabel(req.method, usageBase, usageRoute === '/' ? '' : usageRoute)}`,
      scope: scopeOf(who),
      isError: failed,
    });
    if (failed) {
      const err = res.locals.error;
      recordError({
        source: 'server',
        message: res.locals.errorMessage || err?.message || `HTTP ${res.statusCode}`,
        stack: err?.stack,
        where: `${req.method} ${usageBase}${usageRoute === '/' ? '' : usageRoute}`,
        statusCode: res.statusCode,
        user: req.user,
        browser: req.get('user-agent'),
      });
    }

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
