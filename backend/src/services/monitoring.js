const crypto = require('crypto');
const UsageDaily = require('../models/UsageDaily');
const ErrorEvent = require('../models/ErrorEvent');

// Usage + error monitoring. Everything here is best-effort: a failure to
// record usage or send an alert is logged and swallowed, never allowed to
// affect the request that triggered it.

const TZ = 'America/Vancouver';
const ALERT_TO = process.env.MONITORING_ALERT_EMAIL || 'contact@coldsolutions.ca';
// The same kind of error alerts again at most this often while it keeps happening.
const REALERT_MS = 6 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Features: what Marc sees in the app, and which paid services each relies on.
// `internal` features (monitoring itself, profile loads) are hidden from the
// "what does Marc use" view.
// ---------------------------------------------------------------------------
const FEATURES = [
  // `addon` = the optional add-on (config/plan.js) a feature belongs to; none = Essentials.
  { name: 'Home dashboard', page: 'home', services: ['railway'] },
  { name: 'Emails', page: 'emails', services: ['railway', 'google', 'microsoft'] },
  { name: 'AI analysis', services: ['anthropic', 'openai'] },
  { name: 'Jobs', addon: 'jobs', page: 'jobs', services: ['railway'] },
  { name: 'Clients', addon: 'jobs', page: 'clients', services: ['railway'] },
  { name: 'Calendar', addon: 'jobs', page: 'calendar', services: ['railway', 'google'] },
  { name: 'Projects & photos', addon: 'projects', page: 'projects', services: ['railway', 'cloudinary', 'upstash'] },
  { name: 'Diagrams', addon: 'diagrams', page: 'diagrams', services: ['railway'] },
  { name: 'Analytics', addon: 'quickbooks', page: 'analytics', services: ['railway', 'quickbooks'] },
  { name: 'Marketing', addon: 'marketing', page: 'marketing', services: ['railway', 'resend'] },
  { name: 'QuickBooks & integrations', addon: 'quickbooks', page: 'integrations', services: ['railway', 'quickbooks'] },
  { name: 'Document upload (AI parsing)', addon: 'documents', services: ['openai', 'cloudinary'] },
  { name: 'Team & settings', page: 'settings', services: ['railway', 'resend'] },
  { name: 'Sign-in', services: ['railway'] },
  { name: 'Profile & session', internal: true, services: ['railway'] },
  { name: 'Monitoring', page: 'activity-log', internal: true, services: ['railway'] },
  { name: 'Other', internal: true, services: ['railway'] },
];

// What each service costs us, from the receipts in "MES Electrical - Expenses
// We Pay 2026" (Oct 19, 2026). Update here when a bill changes.
const SERVICES = {
  railway: { name: 'Railway (backend hosting)', monthly: 'US$20/mo', note: 'Pro plan since Jul 2026. Fixed, shared by every feature.' },
  anthropic: { name: 'Anthropic API (AI email analysis)', monthly: '~$11/mo', note: 'Pay-as-you-go, ~2 top-ups of $5.60 a month. Scales with emails analysed.' },
  openai: { name: 'OpenAI (job detection, document parsing)', monthly: 'no receipts found', note: 'gpt-4o-mini. Check the OpenAI billing page.' },
  google: { name: 'Google Cloud APIs (Gmail, Calendar)', monthly: '$0 since Mar 2026', note: 'Was up to CA$12.93/mo.' },
  microsoft: { name: 'Microsoft Graph (Outlook)', monthly: 'free', note: '' },
  upstash: { name: 'Upstash (field photo upload queue)', monthly: '$0 since Feb 2026', note: 'Was ~US$10.50/mo.' },
  cloudinary: { name: 'Cloudinary (photo storage)', monthly: 'free tier', note: 'No receipts found.' },
  resend: { name: 'Resend (invite / outreach emails)', monthly: 'free tier', note: 'No receipts found.' },
  quickbooks: { name: 'QuickBooks API', monthly: 'free', note: '' },
};

const PAGE_TO_FEATURE = Object.fromEntries(FEATURES.filter(f => f.page).map(f => [f.page, f.name]));

/** Which feature an API request belongs to, from its base URL and route pattern. */
function featureFor(baseUrl, routePath = '') {
  const p = routePath || '';
  switch (baseUrl) {
    case '/api/dashboard': return 'Home dashboard';
    case '/api/emails':
    case '/api/email-sync': return 'Emails';
    case '/api/jobs': return 'Jobs';
    case '/api/clients': return 'Clients';
    case '/api/calendar-events': return 'Calendar';
    case '/api/projects':
    case '/api/photos': return 'Projects & photos';
    case '/api/diagrams': return 'Diagrams';
    case '/api/invitations':
    case '/api/addons': return 'Team & settings';
    case '/api/activity-logs':
    case '/api/monitoring': return 'Monitoring';
    case '/api/automation':
      if (/calendar/.test(p)) return 'Calendar';
      if (/review|referral/.test(p)) return 'Marketing';
      return 'AI analysis';
    case '/api/integrations':
      if (/upload|confirm/.test(p)) return 'Document upload (AI parsing)';
      if (/analytics/.test(p)) return 'Analytics';
      return 'QuickBooks & integrations';
    case '/api/oauth':
      return /quickbooks/.test(p) ? 'QuickBooks & integrations' : 'Emails';
    case '/api/auth':
      if (/login/.test(p) || p === '' || p === '/') return 'Sign-in';
      if (/register/.test(p)) return 'Team & settings';
      return 'Profile & session';
    default: return 'Other';
  }
}

function dayKey(d = new Date()) {
  // en-CA formats as YYYY-MM-DD
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

function scopeOf(user) {
  if (!user) return 'system';
  return user.isDeveloper ? 'developer' : 'client';
}

/** Count one use of a feature. */
function recordUsage({ feature, label, scope = 'system', isError = false, when = new Date() }) {
  return UsageDaily.updateOne(
    { day: dayKey(when), feature, label: String(label).slice(0, 120), scope },
    { $inc: { count: 1, errorCount: isError ? 1 : 0 } },
    { upsert: true }
  ).catch(err => console.error('[monitoring] usage write failed:', err.message));
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
const clean = (s, n) => String(s || '')
  .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [hidden]')
  .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
  .slice(0, n);

// Strip IDs and numbers so "Cast to ObjectId failed for 65a1..." groups as one kind.
const normalise = s => s.replace(/"[^"]*"/g, '"…"').replace(/[0-9a-f]{24}/gi, ':id').replace(/\d+/g, 'N');

function stackTopOf(stack) {
  return clean(String(stack || '').split('\n').slice(0, 6).join('\n'), 1200);
}

/**
 * Record an error occurrence. Groups by kind, then emails an alert for a new
 * kind (or one that came back after being resolved), at most every 6 hours
 * per kind while it keeps happening.
 */
async function recordError({ source, message, stack, where, statusCode = null, user = null, browser = '' }) {
  try {
    const msg = clean(message || 'Unknown error', 500);
    const fingerprint = crypto.createHash('sha1').update(`${source}|${where}|${normalise(msg)}`).digest('hex');
    const now = new Date();
    const ev = await ErrorEvent.findOneAndUpdate(
      { fingerprint },
      {
        $setOnInsert: { fingerprint, source, firstSeenAt: now },
        $set: {
          message: msg,
          stackTop: stackTopOf(stack),
          where: clean(where, 200),
          statusCode,
          lastUserRole: user ? user.role : null,
          lastWasDeveloper: !!user?.isDeveloper,
          lastBrowser: clean(browser, 200),
          lastSeenAt: now,
        },
        $inc: { count: 1 },
      },
      { upsert: true, new: true }
    );

    const reopened = !!ev.resolvedAt;
    if (reopened) {
      ev.resolvedAt = null;
    }
    const due = !ev.lastAlertedAt || reopened || now - ev.lastAlertedAt >= REALERT_MS;
    if (due) {
      ev.lastAlertedAt = now;
      ev.alertsSent += 1;
      await ev.save();
      sendErrorAlert(ev, { isNew: ev.count === 1, reopened }).catch(err =>
        console.error('[monitoring] alert email failed:', err.message)
      );
    } else if (reopened) {
      await ev.save();
    }
    return ev;
  } catch (err) {
    console.error('[monitoring] error write failed:', err.message);
    return null;
  }
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function sendErrorAlert(ev, { isNew, reopened }) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const who = ev.lastWasDeveloper ? 'a developer' : ev.lastUserRole ? `Marc's team (${ev.lastUserRole})` : 'a signed-out visitor';
  const kind = isNew ? 'New error' : reopened ? 'Error is back' : 'Error still happening';
  const app = (process.env.FRONTEND_URL || '').split(',')[0];
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px;">
      <h2 style="margin:0 0 8px">${kind} in the MES CRM</h2>
      <p style="margin:0 0 16px;color:#555">${ev.source === 'browser' ? 'On the user\'s screen' : 'On the server'} · ${esc(ev.where)} · seen ${ev.count} time${ev.count === 1 ? '' : 's'}</p>
      <p style="padding:12px;background:#fff4f4;border-left:3px solid #c0392b;margin:0 0 16px"><strong>${esc(ev.message)}</strong></p>
      <p style="margin:0 0 4px;color:#555">Last hit by ${esc(who)}${ev.statusCode ? ` · HTTP ${ev.statusCode}` : ''}${ev.lastBrowser ? ` · ${esc(ev.lastBrowser)}` : ''}</p>
      ${ev.stackTop ? `<pre style="font-size:12px;background:#f6f6f6;padding:10px;overflow:auto">${esc(ev.stackTop)}</pre>` : ''}
      <p style="color:#555">Full details and history: ${app ? `<a href="${esc(app)}">open the CRM</a> → Usage &amp; Health → Errors` : 'Usage & Health → Errors in the CRM'}.
      You'll get at most one email every 6 hours for this error while it keeps happening.</p>
    </div>`;
  await resend.emails.send({
    from: process.env.MONITORING_ALERT_FROM || process.env.EMAIL_FROM || 'MES CRM Monitor <noreply@aicoldsolutions.com>',
    to: ALERT_TO,
    subject: `[MES CRM] ${kind}: ${ev.message.slice(0, 80)}`,
    html,
  });
}

module.exports = {
  FEATURES,
  SERVICES,
  PAGE_TO_FEATURE,
  featureFor,
  dayKey,
  scopeOf,
  recordUsage,
  recordError,
  stackTopOf,
};
