const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');
const Integration = require('../models/Integration');
const { encrypt, decrypt } = require('./oauthController');

const getOAuthClient = () => {
  return new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI
  });
};

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
      state: req.user._id.toString()
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
  try {
    const { state } = req.query;
    const userId = state;

    if (!req.query.code) {
      return res.redirect(`${frontendUrl}?error=no_code&integration=quickbooks`);
    }

    const oauthClient = getOAuthClient();
    const authResponse = await oauthClient.createToken(req.url);
    const token = authResponse.getToken();

    const tokenExpiry = new Date(Date.now() + token.expires_in * 1000);

    let integration = await Integration.findOne({ userId, provider: 'quickbooks' });

    if (integration) {
      integration.accessToken = encrypt(token.access_token);
      integration.refreshToken = encrypt(token.refresh_token);
      integration.tokenExpiry = tokenExpiry;
      integration.realmId = token.realmId;
      integration.isActive = true;
      await integration.save();
    } else {
      integration = await Integration.create({
        userId,
        provider: 'quickbooks',
        accessToken: encrypt(token.access_token),
        refreshToken: encrypt(token.refresh_token),
        tokenExpiry,
        realmId: token.realmId,
        isActive: true,
        enabledDataTypes: []
      });
    }

    res.redirect(`${frontendUrl}?oauth=success&integration=quickbooks`);
  } catch (error) {
    console.error('Error handling QuickBooks OAuth callback:', error.originalMessage || error.message || error);
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
    oauthClient.setToken({
      access_token: accessToken,
      refresh_token: refreshToken,
      realmId: integration.realmId
    });

    const authResponse = await oauthClient.refresh();
    const token = authResponse.getToken();

    accessToken = token.access_token;
    refreshToken = token.refresh_token;

    integration.accessToken = encrypt(token.access_token);
    integration.refreshToken = encrypt(token.refresh_token);
    integration.tokenExpiry = new Date(Date.now() + token.expires_in * 1000);
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
  disconnectQuickBooks
};
