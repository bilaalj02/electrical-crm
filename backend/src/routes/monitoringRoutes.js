const express = require('express');
const router = express.Router();
const { auth, requireDeveloper } = require('../middleware/auth');
const UsageDaily = require('../models/UsageDaily');
const ErrorEvent = require('../models/ErrorEvent');
const Job = require('../models/Job');
const Client = require('../models/Client');
const Email = require('../models/Email');
const Photo = require('../models/Photo');
const CalendarEvent = require('../models/CalendarEvent');
const { FEATURES, SERVICES, PAGE_TO_FEATURE, dayKey, recordUsage, recordError, scopeOf } = require('../services/monitoring');
const Addon = require('../models/Addon');
const { monthlyCents } = require('../config/plan');

const DAY_MS = 24 * 60 * 60 * 1000;

// Small per-user limiter for the two endpoints the browser calls on its own,
// so a crash loop on someone's screen can't flood the database.
const hits = new Map();
function allow(key, limit, windowMs) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.start > windowMs) {
    hits.set(key, { start: now, n: 1 });
    return true;
  }
  h.n += 1;
  return h.n <= limit;
}

// ---------------------------------------------------------------------------
// Anyone signed in: the app reports page opens and crashes on its own.
// ---------------------------------------------------------------------------

// The app tells us which page was opened (pages that load no data of their
// own would otherwise look unused).
router.post('/page', auth, async (req, res) => {
  const page = String(req.body?.page || '');
  const feature = PAGE_TO_FEATURE[page];
  if (!feature) return res.status(400).json({ error: 'Unknown page' });
  if (allow(`page:${req.user._id}`, 120, 60_000)) {
    recordUsage({ feature, label: 'Opened page', scope: scopeOf(req.user) });
  }
  res.status(204).end();
});

// Something crashed on the user's screen.
router.post('/client-error', auth, async (req, res) => {
  if (!allow(`err:${req.user._id}`, 20, 10 * 60_000)) return res.status(204).end();
  const b = req.body || {};
  const page = String(b.page || '').slice(0, 40);
  const kind = b.kind === 'render' ? 'page crashed' : b.kind === 'promise' ? 'unhandled promise' : 'script error';
  await recordError({
    source: 'browser',
    message: String(b.message || 'Unknown browser error'),
    stack: b.stack,
    where: `page: ${page || 'unknown'} (${kind})`,
    user: req.user,
    browser: req.get('user-agent'),
  });
  res.status(204).end();
});

// Marc's "This month" card on his Home page: what the CRM did for him,
// counted from his real data.
router.get('/my-month', auth, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const range = { $gte: start, $lte: now };
    const [jobsCreated, jobsCompleted, clientsAdded, emailsSynced, emailsLinked, photos, events, aiRows] = await Promise.all([
      Job.countDocuments({ createdAt: range }),
      Job.countDocuments({ status: { $in: ['completed', 'invoiced', 'paid'] }, updatedAt: range }),
      Client.countDocuments({ createdAt: range }),
      Email.countDocuments({ createdAt: range }),
      Email.countDocuments({ createdAt: range, $or: [{ jobId: { $ne: null } }, { clientId: { $ne: null } }] }),
      Photo.countDocuments({ createdAt: range }),
      CalendarEvent.countDocuments({ createdAt: range }),
      UsageDaily.aggregate([
        { $match: { feature: 'AI analysis', day: { $gte: dayKey(start) } } },
        { $group: { _id: null, n: { $sum: '$count' } } },
      ]),
    ]);
    const aiChecks = aiRows[0]?.n || 0;
    // Deliberately conservative minutes saved per item, shown to Marc with
    // the basis so the estimate is never a mystery number.
    const minutes = emailsLinked * 2 + photos * 1 + jobsCreated * 3 + events * 2;
    res.json({
      month: start.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' }),
      jobsCreated,
      jobsCompleted,
      clientsAdded,
      emailsSynced,
      emailsLinked,
      aiChecks,
      photos,
      events,
      minutesSaved: minutes,
      basis: '2 min per email filed to a job or client, 3 min per job set up, 2 min per calendar event, 1 min per photo filed.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Developers only from here down.
// ---------------------------------------------------------------------------
router.use(auth, requireDeveloper);

// What gets used, by whom, and what it costs.
// ?days=30 compares the last N days against the N days before.
router.get('/usage', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const now = new Date();
    const from = dayKey(new Date(now - (days - 1) * DAY_MS));
    const prevFrom = dayKey(new Date(now - (2 * days - 1) * DAY_MS));

    const [current, previous, lastUsed, daily, labels, openErrors, addonRows] = await Promise.all([
      UsageDaily.aggregate([
        { $match: { day: { $gte: from } } },
        { $group: { _id: { feature: '$feature', scope: '$scope' }, count: { $sum: '$count' }, errors: { $sum: '$errorCount' } } },
      ]),
      UsageDaily.aggregate([
        { $match: { day: { $gte: prevFrom, $lt: from }, scope: 'client' } },
        { $group: { _id: '$feature', count: { $sum: '$count' } } },
      ]),
      UsageDaily.aggregate([
        { $match: { scope: 'client' } },
        { $group: { _id: '$feature', day: { $max: '$day' } } },
      ]),
      UsageDaily.aggregate([
        { $match: { day: { $gte: from }, scope: 'client' } },
        { $group: { _id: { day: '$day', feature: '$feature' }, count: { $sum: '$count' } } },
      ]),
      UsageDaily.aggregate([
        { $match: { day: { $gte: from }, scope: 'client' } },
        { $group: { _id: { feature: '$feature', label: '$label' }, count: { $sum: '$count' } } },
        { $sort: { count: -1 } },
      ]),
      ErrorEvent.countDocuments({ resolvedAt: null }),
      Addon.find({ enabled: true }).select('key').lean(),
    ]);
    const enabledAddons = new Set(addonRows.map((r) => r.key));

    const by = (rows, f) => Object.fromEntries(rows.map(r => [f(r), r]));
    const cur = by(current, r => `${r._id.feature}|${r._id.scope}`);
    const prev = by(previous, r => r._id);
    const last = by(lastUsed, r => r._id);

    const features = FEATURES.filter(f => !f.internal).map(f => {
      const client = cur[`${f.name}|client`]?.count || 0;
      const system = cur[`${f.name}|system`]?.count || 0;
      return {
        name: f.name,
        services: f.services,
        addon: f.addon || null,
        realMode: f.addon ? enabledAddons.has(f.addon) : null,
        clientUses: client,
        previousClientUses: prev[f.name]?.count || 0,
        developerUses: cur[`${f.name}|developer`]?.count || 0,
        automaticRuns: system,
        errors: ['client', 'developer', 'system'].reduce((n, s) => n + (cur[`${f.name}|${s}`]?.errors || 0), 0),
        lastUsedByClient: last[f.name]?.day || null,
        topActions: labels.filter(l => l._id.feature === f.name).slice(0, 5).map(l => ({ label: l._id.label, count: l.count })),
      };
    }).sort((a, b) => b.clientUses + b.automaticRuns - (a.clientUses + a.automaticRuns));

    // Daily totals per feature for the chart (client activity only).
    const series = {};
    for (const r of daily) {
      (series[r._id.feature] ||= {})[r._id.day] = r.count;
    }

    res.json({
      days,
      from,
      features,
      unused: features.filter(f => f.clientUses === 0 && f.automaticRuns === 0).map(f => f.name),
      series,
      services: SERVICES,
      openErrors,
      plan: { enabledAddons: [...enabledAddons], monthlyCents: monthlyCents([...enabledAddons]) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Errors, newest first. ?status=open|resolved|all
router.get('/errors', async (req, res) => {
  try {
    const status = req.query.status || 'open';
    const q = status === 'open' ? { resolvedAt: null } : status === 'resolved' ? { resolvedAt: { $ne: null } } : {};
    const errors = await ErrorEvent.find(q).sort({ lastSeenAt: -1 }).limit(200).lean();
    res.json({ errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/errors/:id', async (req, res) => {
  try {
    const resolved = !!req.body?.resolved;
    const ev = await ErrorEvent.findByIdAndUpdate(
      req.params.id,
      { resolvedAt: resolved ? new Date() : null },
      { new: true }
    ).lean();
    if (!ev) return res.status(404).json({ error: 'Not found' });
    res.json({ event: ev });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
