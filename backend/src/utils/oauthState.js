const crypto = require('crypto');

// Shared CSRF-safe OAuth `state` parameter for every provider (Google/Gmail,
// Microsoft, QuickBooks). The state param round-trips through the
// provider's servers, so it must be unforgeable: signed with a server-only
// secret and time-boxed, not just the raw userId (which an attacker could
// guess and use to forge a callback that links their own third-party
// account to a different victim's CRM account).
const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes — long enough for a real login, short enough to block replay

function signState(userId) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${userId}.${nonce}.${timestamp}`;
  const signature = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

// Returns the verified userId, or null if the state is missing, malformed,
// expired, or the signature doesn't match (forged/tampered — a CSRF attempt
// on the OAuth callback).
function verifyState(state) {
  if (!state || typeof state !== 'string') return null;
  const parts = state.split('.');
  if (parts.length !== 4) return null;
  const [userId, nonce, timestamp, signature] = parts;

  const payload = `${userId}.${nonce}.${timestamp}`;
  const expectedSignature = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY).update(payload).digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  if (Date.now() - Number(timestamp) > STATE_TTL_MS) return null;

  return userId;
}

module.exports = { signState, verifyState };
