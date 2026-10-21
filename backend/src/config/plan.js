// MES CRM plan: always-on Essentials plus optional add-ons Marc can switch on (Real mode) or try
// for free (Play mode: look around, nothing saves). Prices are CAD per month, before GST.
// Change prices here; TERMS_VERSION goes up whenever the wording or prices change.

const TERMS_VERSION = '2026-10-21';

const ESSENTIALS = {
  name: 'Essentials',
  priceCents: 4900,
  includes: ['Email sync and inbox', 'AI email sorting', 'Hosting, security and backups', 'Updates and support'],
};

const ADDONS = [
  {
    key: 'jobs',
    name: 'Jobs, Clients & Calendar',
    priceCents: 1200,
    pages: ['jobs', 'clients', 'calendar'],
    blurb: 'Track jobs from quote to paid, keep client records, and schedule work on the calendar.',
    playLimits: 'You can look around and open the forms, but nothing you add or change is saved.',
  },
  {
    key: 'projects',
    name: 'Projects & Field Photos',
    priceCents: 1000,
    pages: ['projects'],
    blurb: 'Photo galleries for each project, before/after shots and uploads from the field.',
    playLimits: 'You can browse, but you can\'t create projects or upload photos.',
  },
  {
    key: 'diagrams',
    name: 'Diagrams',
    priceCents: 800,
    pages: ['diagrams'],
    blurb: 'Draw electrical diagrams with 400+ symbols, save them and export to PDF.',
    playLimits: 'You can sketch with a small starter set of symbols, but you can\'t save, open saved diagrams, export or make custom symbols.',
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks & Analytics',
    priceCents: 800,
    pages: ['analytics'], // the Integrations page also holds the email connections (Essentials)
    blurb: 'Connect QuickBooks and see revenue and job reports.',
    playLimits: 'You can view the pages, but you can\'t connect QuickBooks or run a sync.',
  },
  {
    key: 'marketing',
    name: 'Marketing Outreach',
    priceCents: 500,
    pages: ['marketing'],
    blurb: 'Send review and referral requests to past clients.',
    playLimits: 'You can preview the outreach, but nothing is sent.',
  },
  {
    key: 'documents',
    name: 'Document AI',
    priceCents: 500,
    pages: [],
    blurb: 'Upload a quote or invoice and let the AI fill in the details for you.',
    playLimits: 'Uploads are turned off.',
  },
];

// Never pay more than the old all-in price.
const CAP_CENTS = 8800;

const addonByKey = (key) => ADDONS.find((a) => a.key === key) || null;

function termsText(addon) {
  const price = `$${(addon.priceCents / 100).toFixed(2)}`;
  return [
    `Turning on ${addon.name} adds ${price} per month (plus GST) to your MES CRM plan, starting with your next monthly invoice.`,
    'You can turn it off at any time from the same page or from Settings. Charges stop from the invoice after you turn it off.',
    `Your total for Essentials plus add-ons is never more than $${(CAP_CENTS / 100).toFixed(2)} per month (plus GST).`,
    'If you just want to try it first, stay in Play mode: it\'s free, but very limited and nothing you do is saved.',
  ];
}

/** Monthly total for a set of enabled add-on keys, capped. */
function monthlyCents(enabledKeys) {
  const addons = enabledKeys.map(addonByKey).filter(Boolean).reduce((n, a) => n + a.priceCents, 0);
  return Math.min(ESSENTIALS.priceCents + addons, CAP_CENTS);
}

module.exports = { TERMS_VERSION, ESSENTIALS, ADDONS, CAP_CENTS, addonByKey, termsText, monthlyCents };
