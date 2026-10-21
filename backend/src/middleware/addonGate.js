const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Addon = require('../models/Addon');
const { addonByKey } = require('../config/plan');

// Play mode, enforced on the server. Requests that would SAVE something in an add-on that
// isn't switched on are refused with 402 PLAY_MODE; reading and looking around stays free.
// Developer accounts (Cold Solutions) are never gated.

/** Which add-on (if any) a request needs to be switched on. */
function addonFor(method, path) {
  const write = method !== 'GET';
  const p = path.split('?')[0];
  const under = (base) => p === base || p.startsWith(`${base}/`);

  if (under('/api/jobs') || under('/api/clients') || under('/api/calendar-events')) return write ? 'jobs' : null;
  if (under('/api/projects') || under('/api/photos')) return write ? 'projects' : null;
  if (under('/api/diagrams')) {
    // Opening a saved diagram counts too (Play mode is sketch-only).
    if (!write) return /^\/api\/diagrams\/(?!custom-symbols)[^/]+$/.test(p) ? 'diagrams' : null;
    return 'diagrams';
  }
  if (under('/api/automation')) {
    if (/review-request|referral-request/.test(p)) return 'marketing';
    if (/create-job-from-email|extract-job|calendar/.test(p)) return 'jobs';
    return null; // AI email sorting is part of Essentials
  }
  if (under('/api/integrations')) {
    if (/\/(upload|confirm)$/.test(p)) return 'documents';
    // Only QuickBooks is an add-on; Gmail / Outlook connections are Essentials.
    if (!write || !under('/api/integrations/quickbooks')) return null;
    return 'quickbooks';
  }
  if (under('/api/oauth/quickbooks')) return /callback/.test(p) ? null : 'quickbooks';
  return null;
}

// Tiny cache so every save doesn't hit the database twice.
let cache = { at: 0, enabled: new Set() };
async function enabledKeys() {
  if (Date.now() - cache.at < 10_000) return cache.enabled;
  const rows = await Addon.find({ enabled: true }).select('key').lean();
  cache = { at: Date.now(), enabled: new Set(rows.map((r) => r.key)) };
  return cache.enabled;
}
function clearAddonCache() {
  cache = { at: 0, enabled: new Set() };
}

async function requestUser(req) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(userId).select('role isDeveloper').lean();
  } catch {
    return null;
  }
}

async function addonGate(req, res, next) {
  try {
    const key = addonFor(req.method, req.originalUrl);
    if (!key) return next();
    if ((await enabledKeys()).has(key)) return next();
    const user = await requestUser(req);
    if (user?.isDeveloper) return next();
    res.locals.monitorUser = user; // so usage counts the attempt as Marc's
    const addon = addonByKey(key);
    return res.status(402).json({
      code: 'PLAY_MODE',
      addon: key,
      error: `${addon.name} is in Play mode, so this wasn't saved. Switch it to Real mode to keep your work.`,
    });
  } catch (err) {
    // Never let the gate itself break the app.
    console.error('[addonGate]', err.message);
    return next();
  }
}

module.exports = { addonGate, addonFor, clearAddonCache };
