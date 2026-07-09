// Small retry helper for transient network/API failures against outside
// services (currently: the QuickBooks Data API). Deliberately does NOT
// retry permanent auth failures (401/403, invalid_grant) — those can never
// succeed without new tokens, so the caller should fail fast and prompt
// reconnection instead of wasting time retrying a dead request.

function isTransientError(err) {
  // Explicit "this is permanent, don't retry" signal used across the
  // QuickBooks integration for auth failures that need a user reconnect.
  if (err?.code === 'QBO_RECONNECT_REQUIRED') return false;

  const status = err?.response?.status || err?.statusCode;
  if (status === 401 || status === 403) return false;
  if (typeof status === 'number' && status >= 500) return true;
  if (status === 408 || status === 429) return true;

  const code = err?.code;
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNREFUSED') return true;

  // A QBO Fault object with no HTTP status attached (came back as a 200
  // with a Fault body) is a data/validation error, not a network blip —
  // retrying it would just fail the same way again.
  if (err?.Fault) return false;

  // Unknown shape (e.g. a bare network error with no status/code) — worth
  // one retry rather than failing immediately.
  if (!status && !code) return true;

  return false;
}

async function withRetry(fn, { retries = 2, baseDelayMs = 300 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isTransientError(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError;
}

module.exports = { withRetry, isTransientError };
