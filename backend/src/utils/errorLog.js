const IntegrationErrorLog = require('../models/IntegrationErrorLog');

// Pulls whatever useful detail exists on an error from either the
// intuit-oauth SDK (OAuthError: .intuitTid, .error_description, .fault) or a
// raw node-quickbooks callback error (a Fault object, or an axios error with
// .response.headers). Never throws — logging a failure must never cause a
// second failure.
function extractErrorInfo(error) {
  // A raw node-quickbooks Fault object isn't an Error instance, so
  // .message is empty — its actual message lives at Fault.Error[0].Message.
  const message = error?.message || error?.error || error?.Fault?.Error?.[0]?.Message
    || (typeof error === 'string' ? error : 'Unknown error');
  const detail = error?.error_description || error?.fault?.errors?.[0]?.detail
    || error?.Fault?.Error?.[0]?.Detail || null;
  const faultCode = error?.fault?.errors?.[0]?.code || error?.Fault?.Error?.[0]?.code
    || error?.code || null;
  const intuitTid = error?.intuitTid || error?.intuit_tid
    || error?.response?.headers?.intuit_tid || error?.response?.headers?.['intuit-tid']
    || null;
  return { message, detail, faultCode, intuitTid };
}

async function logIntegrationError({ userId, provider, action, error }) {
  console.error(`[${provider}] ${action} error:`, error);
  try {
    const { message, detail, faultCode, intuitTid } = extractErrorInfo(error);
    await IntegrationErrorLog.create({ userId, provider, action, message, detail, faultCode, intuitTid });
  } catch (logError) {
    // Logging must be best-effort — never let a broken log write mask the
    // original error or crash the request.
    console.error('Failed to persist integration error log:', logError.message);
  }
}

module.exports = { logIntegrationError, extractErrorInfo };
