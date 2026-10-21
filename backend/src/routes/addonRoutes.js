const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Addon = require('../models/Addon');
const { TERMS_VERSION, ESSENTIALS, ADDONS, CAP_CENTS, addonByKey, termsText, monthlyCents } = require('../config/plan');
const { clearAddonCache } = require('../middleware/addonGate');

router.use(auth);

async function planView(viewer) {
  const rows = await Addon.find({}).lean();
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
  const addons = ADDONS.map((a) => {
    const r = byKey[a.key];
    return {
      key: a.key,
      name: a.name,
      priceCents: a.priceCents,
      pages: a.pages,
      blurb: a.blurb,
      playLimits: a.playLimits,
      terms: termsText(a),
      enabled: !!r?.enabled,
      enabledAt: r?.enabledAt || null,
      // Who switched what, and when (shown in Settings and to developers).
      history: (r?.history || []).slice(-10).map((h) => ({ action: h.action, at: h.at, by: h.userName, priceCents: h.priceCents })),
    };
  });
  const enabled = addons.filter((a) => a.enabled).map((a) => a.key);
  return {
    termsVersion: TERMS_VERSION,
    essentials: ESSENTIALS,
    capCents: CAP_CENTS,
    addons,
    monthlyCents: monthlyCents(enabled),
    canManage: viewer.role === 'admin' || !!viewer.isDeveloper,
    bypass: !!viewer.isDeveloper, // developers are never limited by Play mode
  };
}

// The plan: Essentials, each add-on (on = Real mode, off = Play mode) and the monthly total.
router.get('/', async (req, res) => {
  try {
    res.json(await planView(req.user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Switch an add-on to Real mode. Requires agreeing to its terms; the acceptance is recorded.
router.post('/:key/enable', async (req, res) => {
  try {
    const addon = addonByKey(req.params.key);
    if (!addon) return res.status(404).json({ error: 'Unknown add-on' });
    if (req.user.role !== 'admin' && !req.user.isDeveloper) return res.status(403).json({ error: 'Only an admin can change the plan.' });
    if (req.body?.acceptTerms !== true || req.body?.termsVersion !== TERMS_VERSION) {
      return res.status(400).json({ error: 'Please agree to the terms to turn this on.' });
    }
    const now = new Date();
    await Addon.updateOne(
      { key: addon.key },
      {
        $set: { enabled: true, enabledAt: now, priceCents: addon.priceCents },
        $push: {
          history: {
            action: 'enabled', at: now, userId: req.user._id, userName: req.user.name, userEmail: req.user.email,
            priceCents: addon.priceCents, termsVersion: TERMS_VERSION, termsText: termsText(addon), ip: req.ip,
          },
        },
      },
      { upsert: true }
    );
    clearAddonCache();
    res.json(await planView(req.user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Back to Play mode. Charges stop from the next invoice.
router.post('/:key/disable', async (req, res) => {
  try {
    const addon = addonByKey(req.params.key);
    if (!addon) return res.status(404).json({ error: 'Unknown add-on' });
    if (req.user.role !== 'admin' && !req.user.isDeveloper) return res.status(403).json({ error: 'Only an admin can change the plan.' });
    const now = new Date();
    await Addon.updateOne(
      { key: addon.key },
      {
        $set: { enabled: false },
        $push: { history: { action: 'disabled', at: now, userId: req.user._id, userName: req.user.name, userEmail: req.user.email, priceCents: addon.priceCents, termsVersion: TERMS_VERSION, ip: req.ip } },
      },
      { upsert: true }
    );
    clearAddonCache();
    res.json(await planView(req.user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
