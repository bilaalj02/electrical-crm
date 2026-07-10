const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');
const Integration = require('../models/Integration');
const { encrypt, decrypt } = require('./oauthController');
const { logIntegrationError } = require('../utils/errorLog');
const { signState, verifyState } = require('../utils/oauthState');

// Intuit's documented refresh-token lifetime — used only as a fallback if a
// token response is ever missing x_refresh_token_expires_in (Intuit always
// sends it in practice, but this keeps a missing field from being treated as
// "already expired").
const DEFAULT_REFRESH_TOKEN_LIFETIME_SECONDS = 100 * 24 * 60 * 60;

const getOAuthClient = () => {
  return new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI
  });
};

// Marks an integration as needing the user to reconnect (distinct from a
// deliberate disconnect) and returns a typed error that routes/frontend can
// detect via `.code === 'QBO_RECONNECT_REQUIRED'` to show a clear
// "reconnect" prompt instead of a generic failure message.
async function markNeedsReconnect(integration, reason) {
  integration.isActive = false;
  integration.needsReconnect = true;
  integration.syncStats = integration.syncStats || {};
  integration.syncStats.lastError = reason;
  await integration.save();

  const error = new Error(reason);
  error.code = 'QBO_RECONNECT_REQUIRED';
  return error;
}

// Recognizes the OAuth-error shape intuit-oauth's refresh() throws
// (see createError() in the SDK) for a dead refresh token — this is what
// Intuit sends back as `invalid_grant` when a refresh token has expired or
// been revoked. Transient failures (network blips, 5xx) are already retried
// internally by the SDK before it ever throws, so anything that reaches
// here is a real, permanent auth failure.
//
// The SDK also throws a plain local Error — no `.error`/`.response` at all —
// from its own pre-flight `isRefreshTokenValid()` check, before any network
// call happens, once a refresh token is past its ~100-day validity window.
// That needs the same substring match; without it, an expired token bubbles
// up as a raw 500 instead of prompting reconnect.
function isPermanentAuthError(error) {
  const code = String(error?.error || error?.message || '').toLowerCase();
  if (code.includes('invalid_grant') || code.includes('invalid_token')) return true;
  if (code.includes('refresh token is invalid') || code.includes('refresh token is missing')) return true;
  const status = error?.authResponse?.response?.status || error?.response?.status;
  return status === 400 || status === 401;
}

// GET /api/oauth/quickbooks/auth-url
const getQuickBooksAuthUrl = (req, res) => {
  try {
    if (!process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_CLIENT_SECRET) {
      return res.status(400).json({
        error: 'QuickBooks is not configured yet. Add QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET to the backend .env file.'
      });
    }

    const oauthClient = getOAuthClient();
    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: signState(req.user._id.toString())
    });

    res.json({ authUrl: authUri });
  } catch (error) {
    console.error('Error generating QuickBooks auth URL:', error);
    res.status(500).json({ error: 'Failed to generate QuickBooks authentication URL' });
  }
};

// GET /api/oauth/quickbooks/callback
const handleQuickBooksCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  // Declared outside the try block (not `const` inside it) so the catch
  // block below — a separate block scope — can still see it for logging.
  let userId;
  try {
    userId = verifyState(req.query.state);

    if (!userId) {
      // Missing, expired, or tampered state — reject rather than trust it.
      // This is the actual CSRF defense: a forged callback (e.g. an
      // attacker starting their own OAuth flow and tricking a victim into
      // completing it under the attacker's session) won't carry a state
      // this server signed, so it gets rejected here instead of silently
      // linking the wrong QuickBooks company to an account.
      console.error('QuickBooks OAuth callback rejected: invalid or expired state (possible CSRF attempt)');
      return res.redirect(`${frontendUrl}?error=invalid_state&integration=quickbooks`);
    }

    if (!req.query.code) {
      return res.redirect(`${frontendUrl}?error=no_code&integration=quickbooks`);
    }

    const oauthClient = getOAuthClient();
    const authResponse = await oauthClient.createToken(req.url);
    const token = authResponse.getToken();

    const tokenExpiry = new Date(Date.now() + token.expires_in * 1000);
    const refreshTokenExpiry = new Date(Date.now() + (token.x_refresh_token_expires_in || DEFAULT_REFRESH_TOKEN_LIFETIME_SECONDS) * 1000);

    let integration = await Integration.findOne({ userId, provider: 'quickbooks' });

    if (integration) {
      integration.accessToken = encrypt(token.access_token);
      integration.refreshToken = encrypt(token.refresh_token);
      integration.tokenExpiry = tokenExpiry;
      integration.refreshTokenExpiry = refreshTokenExpiry;
      integration.realmId = token.realmId;
      integration.isActive = true;
      integration.needsReconnect = false; // clear a stale flag from a prior dead-token state — this is a fresh, valid connect
      await integration.save();
    } else {
      integration = await Integration.create({
        userId,
        provider: 'quickbooks',
        accessToken: encrypt(token.access_token),
        refreshToken: encrypt(token.refresh_token),
        tokenExpiry,
        refreshTokenExpiry,
        realmId: token.realmId,
        isActive: true,
        enabledDataTypes: []
      });
    }

    res.redirect(`${frontendUrl}?oauth=success&integration=quickbooks`);
  } catch (error) {
    await logIntegrationError({ userId, provider: 'quickbooks', action: 'oauth_callback', error });
    res.redirect(`${frontendUrl}?error=oauth_failed&integration=quickbooks`);
  }
};

// Returns a ready-to-use node-quickbooks client for the given integration doc,
// refreshing the access token first if it has expired.
const getQBOClient = async (integration) => {
  let accessToken = decrypt(integration.accessToken);
  let refreshToken = decrypt(integration.refreshToken);

  if (new Date() >= integration.tokenExpiry) {
    const oauthClient = getOAuthClient();

    // setToken() needs expires_in / x_refresh_token_expires_in to seed the
    // SDK's own Token object correctly — without them it defaults both to 0,
    // and its internal isRefreshTokenValid() check (createdAt + 0 > now)
    // then fails immediately on every refresh, regardless of whether the
    // stored refresh token is actually still good. integration.refreshTokenExpiry
    // may be unset on records created before this field existed — treat that
    // as "unknown, assume Intuit's default lifetime" rather than "expired".
    const secondsUntil = (date, fallbackSeconds) =>
      date ? Math.max(1, Math.round((new Date(date).getTime() - Date.now()) / 1000)) : fallbackSeconds;

    oauthClient.setToken({
      access_token: accessToken,
      refresh_token: refreshToken,
      realmId: integration.realmId,
      expires_in: secondsUntil(integration.tokenExpiry, 1),
      x_refresh_token_expires_in: secondsUntil(integration.refreshTokenExpiry, DEFAULT_REFRESH_TOKEN_LIFETIME_SECONDS)
    });

    let authResponse;
    try {
      // intuit-oauth already retries transient failures (5xx/408/429/
      // network errors) internally with backoff before this can throw —
      // see loadResponse()/shouldRetry() in the SDK. Anything that reaches
      // this catch is a real, permanent failure (expired/revoked refresh
      // token → invalid_grant).
      authResponse = await oauthClient.refresh();
    } catch (refreshError) {
      await logIntegrationError({ userId: integration.userId, provider: 'quickbooks', action: 'token_refresh', error: refreshError });
      if (isPermanentAuthError(refreshError)) {
        throw await markNeedsReconnect(
          integration,
          'QuickBooks connection expired or was revoked — reconnect required.'
        );
      }
      throw refreshError;
    }

    const token = authResponse.getToken();

    accessToken = token.access_token;
    refreshToken = token.refresh_token;

    integration.accessToken = encrypt(token.access_token);
    integration.refreshToken = encrypt(token.refresh_token);
    integration.tokenExpiry = new Date(Date.now() + token.expires_in * 1000);
    // Intuit rotates the refresh token on every use and resets its ~100-day
    // window — persist the new expiry so the next refresh seeds setToken()
    // with an accurate value instead of falling back to the default.
    integration.refreshTokenExpiry = new Date(Date.now() + (token.x_refresh_token_expires_in || DEFAULT_REFRESH_TOKEN_LIFETIME_SECONDS) * 1000);
    await integration.save();
  }

  const useSandbox = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') === 'sandbox';

  return new QuickBooks(
    process.env.QUICKBOOKS_CLIENT_ID,
    process.env.QUICKBOOKS_CLIENT_SECRET,
    accessToken,
    false, // no token secret for OAuth 2.0
    integration.realmId,
    useSandbox,
    false, // debugging
    null, // minorversion — latest
    '2.0',
    refreshToken
  );
};

// DELETE /api/integrations/quickbooks
const disconnectQuickBooks = async (req, res) => {
  try {
    const integration = await Integration.findOne({
      userId: req.user._id,
      provider: 'quickbooks'
    });

    if (!integration) {
      return res.status(404).json({ error: 'QuickBooks is not connected' });
    }

    integration.isActive = false;
    integration.needsReconnect = false; // deliberate disconnect, not a token failure
    await integration.save();

    res.json({ message: 'QuickBooks disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting QuickBooks:', error);
    res.status(500).json({ error: 'Failed to disconnect QuickBooks' });
  }
};

module.exports = {
  getQuickBooksAuthUrl,
  handleQuickBooksCallback,
  getQBOClient,
  disconnectQuickBooks,
  markNeedsReconnect,
  isPermanentAuthError
};
