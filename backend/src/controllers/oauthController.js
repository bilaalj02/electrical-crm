const { google } = require('googleapis');
const EmailAccount = require('../models/EmailAccount');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const { signState, verifyState } = require('../utils/oauthState');

// Encryption helper functions — every OAuth access/refresh token (Gmail,
// Microsoft, QuickBooks) is encrypted with this key before being stored.
// No fallback: a silent default here would mean that if ENCRYPTION_KEY were
// ever missing from an environment's config (e.g. an unset var on a fresh
// deploy), every token would be encrypted with the same publicly-known
// string in this open-source-visible file instead of failing loudly —
// fail fast instead so a missing key is caught at startup, not discovered
// as a live vulnerability later.
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required and must not be empty.');
}

const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString();
};

const decrypt = (encryptedText) => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Create OAuth2 client
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/oauth/google/callback'
  );
};

// Generate Gmail OAuth URL (email only)
const getGmailAuthUrl = (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: signState(req.user._id.toString())
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

// Generate Google OAuth URL (Gmail + Calendar combined)
// Reuses the existing GOOGLE_REDIRECT_URI (/gmail/callback) so no new
// redirect URI needs to be registered in Google Cloud Console.
const getGoogleAuthUrl = (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: signState(req.user._id.toString())
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

// handleGoogleCallback delegates to handleGmailCallback — same token exchange
// logic, same redirect URI, no new Google Cloud Console entry required.
const handleGoogleCallback = (req, res) => handleGmailCallback(req, res);

// Handle Gmail OAuth callback
const handleGmailCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = verifyState(state);

    if (!userId) {
      console.error('Gmail/Google OAuth callback rejected: invalid or expired state (possible CSRF attempt)');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}?error=no_code`);
    }

    const oauth2Client = getOAuth2Client();

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailAddress = profile.data.emailAddress;

    // Check if account already exists
    let emailAccount = await EmailAccount.findOne({ userId, email: emailAddress });

    if (emailAccount) {
      // Update existing account
      emailAccount.accessToken = encrypt(tokens.access_token);
      emailAccount.refreshToken = encrypt(tokens.refresh_token);
      emailAccount.tokenExpiry = new Date(tokens.expiry_date);
      emailAccount.isActive = true;
      await emailAccount.save();
    } else {
      // Create new account
      emailAccount = await EmailAccount.create({
        userId,
        email: emailAddress,
        provider: 'gmail',
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiry: new Date(tokens.expiry_date),
        isActive: true
      });
    }

    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}?oauth=success&email=${encodeURIComponent(emailAddress)}`);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}?error=oauth_failed`);
  }
};

// Get all connected email accounts
const getEmailAccounts = async (req, res) => {
  try {
    const emailAccounts = await EmailAccount.find({
      userId: req.user._id,
      isActive: true
    }).select('-accessToken -refreshToken');

    res.json({ emailAccounts });
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ error: 'Failed to fetch email accounts' });
  }
};

// Disconnect email account
const disconnectEmailAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    const emailAccount = await EmailAccount.findOne({
      _id: accountId,
      userId: req.user._id
    });

    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    emailAccount.isActive = false;
    await emailAccount.save();

    res.json({ message: 'Email account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting email account:', error);
    res.status(500).json({ error: 'Failed to disconnect email account' });
  }
};

// Get fresh OAuth2 client with valid token
const getAuthenticatedClient = async (emailAccount) => {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: decrypt(emailAccount.accessToken),
    refresh_token: decrypt(emailAccount.refreshToken),
    expiry_date: emailAccount.tokenExpiry
  });

  // Refresh token if expired
  if (new Date() >= emailAccount.tokenExpiry) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored tokens
    emailAccount.accessToken = encrypt(credentials.access_token);
    if (credentials.refresh_token) {
      emailAccount.refreshToken = encrypt(credentials.refresh_token);
    }
    emailAccount.tokenExpiry = new Date(credentials.expiry_date);
    await emailAccount.save();

    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
};

// ============================================
// MICROSOFT OAUTH FUNCTIONS
// ============================================

// Generate Microsoft OAuth URL
const getMicrosoftAuthUrl = (req, res) => {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    const userId = req.user._id.toString();

    const scopes = [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/User.Read',
      'offline_access'
    ];

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&state=${signState(userId)}` +
      `&prompt=consent`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Microsoft auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

// Handle Microsoft OAuth callback
const handleMicrosoftCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('Microsoft OAuth error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
    }

    const userId = verifyState(state);
    if (!userId) {
      console.error('Microsoft OAuth callback rejected: invalid or expired state (possible CSRF attempt)');
      return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user email from Microsoft Graph
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const emailAddress = userResponse.data.mail || userResponse.data.userPrincipalName;

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (expires_in * 1000));

    // Check if account already exists
    let emailAccount = await EmailAccount.findOne({ userId, email: emailAddress });

    if (emailAccount) {
      // Update existing account
      emailAccount.accessToken = encrypt(access_token);
      emailAccount.refreshToken = encrypt(refresh_token);
      emailAccount.tokenExpiry = tokenExpiry;
      emailAccount.isActive = true;
      await emailAccount.save();
    } else {
      // Create new account
      emailAccount = await EmailAccount.create({
        userId,
        email: emailAddress,
        provider: 'microsoft',
        accessToken: encrypt(access_token),
        refreshToken: encrypt(refresh_token),
        tokenExpiry: tokenExpiry,
        isActive: true
      });
    }

    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}?oauth=success&email=${encodeURIComponent(emailAddress)}`);
  } catch (error) {
    // Same reasoning as getAuthenticatedMicrosoftClient's catch above —
    // this call's error.config.data also contains MICROSOFT_CLIENT_SECRET
    // in plaintext (the authorization-code exchange request), so never
    // log the raw error object, only Microsoft's own response.
    console.error('Error handling Microsoft OAuth callback:', error.response?.data?.error_description || error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
};

// Get authenticated Microsoft Graph client
const getAuthenticatedMicrosoftClient = async (emailAccount) => {
  let accessToken = decrypt(emailAccount.accessToken);

  // Refresh token if expired
  if (new Date() >= emailAccount.tokenExpiry) {
    try {
      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          refresh_token: decrypt(emailAccount.refreshToken),
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Update stored tokens
      emailAccount.accessToken = encrypt(access_token);
      if (refresh_token) {
        emailAccount.refreshToken = encrypt(refresh_token);
      }
      emailAccount.tokenExpiry = new Date(Date.now() + (expires_in * 1000));
      await emailAccount.save();

      accessToken = access_token;
    } catch (error) {
      // Never log the raw error object here — axios attaches the full
      // outgoing request (error.config.data), which for this call
      // contains MICROSOFT_CLIENT_SECRET and the account's refresh_token
      // in plaintext. Only log Microsoft's own response body/description,
      // never our own request.
      console.error('Error refreshing Microsoft token:', error.response?.data?.error_description || error.response?.data || error.message);
      throw new Error('Failed to refresh Microsoft access token');
    }
  }

  return accessToken;
};

// Recursively walks the full mail folder tree. GET /me/mailFolders only
// returns TOP-LEVEL folders (Inbox, Sent Items, and any custom folder
// sitting directly at the mailbox root) — a subfolder nested inside one
// of those (e.g. a custom "Invoices" folder with a "2026" folder inside
// it) is invisible unless its parent's /childFolders is fetched
// separately. Still covered entirely by the existing Mail.Read permission
// — this is a real gap in what the code asks for, not an Azure permission
// gap. depth is capped defensively; real mailboxes rarely nest past 3-4
// levels, this just bounds the worst case.
const _fetchMicrosoftFolderTree = async (accessToken, parentId = null, parentPath = '', depth = 0, maxDepth = 6) => {
  const url = parentId
    ? `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders?$top=100`
    : 'https://graph.microsoft.com/v1.0/me/mailFolders?$top=100';

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  let folders = [];
  for (const f of response.data.value || []) {
    const path = parentPath ? `${parentPath}/${f.displayName}` : f.displayName;
    folders.push({ id: f.id, name: f.displayName, path, depth, type: 'user' });

    if (f.childFolderCount > 0 && depth < maxDepth) {
      const children = await _fetchMicrosoftFolderTree(accessToken, f.id, path, depth + 1, maxDepth);
      folders = folders.concat(children);
    }
  }
  return folders;
};

// List folders available to sync from — Outlook/Microsoft only. Gmail
// scoping is out of scope for this pass, so this deliberately doesn't
// branch on provider === 'gmail' at all.
const getEmailAccountFolders = async (req, res) => {
  try {
    const { accountId } = req.params;

    const emailAccount = await EmailAccount.findOne({
      _id: accountId,
      userId: req.user._id,
      isActive: true
    });

    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    if (emailAccount.provider !== 'microsoft') {
      return res.status(400).json({ error: 'Folder scoping is only available for Outlook accounts right now' });
    }

    const accessToken = await getAuthenticatedMicrosoftClient(emailAccount);
    const folders = await _fetchMicrosoftFolderTree(accessToken);

    res.json({ folders });
  } catch (error) {
    console.error('Error fetching email account folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

// Save which folders should sync for this account. Clearing syncToken
// forces a clean re-list on the next sync rather than reusing a pagination
// token captured under a different scope.
const KNOWN_SYNC_FEATURES = ['job_client_detection'];

const updateEmailAccountScope = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { mode, selectedIds, enabledFeatures } = req.body;

    if (!['all', 'selected'].includes(mode)) {
      return res.status(400).json({ error: "mode must be 'all' or 'selected'" });
    }
    if (mode === 'selected' && !Array.isArray(selectedIds)) {
      return res.status(400).json({ error: 'selectedIds must be an array when mode is selected' });
    }
    if (enabledFeatures !== undefined) {
      if (!Array.isArray(enabledFeatures) || enabledFeatures.some((f) => !KNOWN_SYNC_FEATURES.includes(f))) {
        return res.status(400).json({ error: `enabledFeatures must be an array containing only: ${KNOWN_SYNC_FEATURES.join(', ')}` });
      }
    }

    const emailAccount = await EmailAccount.findOne({
      _id: accountId,
      userId: req.user._id,
      isActive: true
    });

    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    emailAccount.syncScope = {
      mode,
      selectedIds: mode === 'selected' ? selectedIds : [],
      enabledFeatures: enabledFeatures !== undefined ? enabledFeatures : (emailAccount.syncScope?.enabledFeatures || [])
    };
    emailAccount.syncToken = undefined;
    await emailAccount.save();

    res.json({ syncScope: emailAccount.syncScope });
  } catch (error) {
    console.error('Error updating email account scope:', error);
    res.status(500).json({ error: 'Failed to save sync scope' });
  }
};

module.exports = {
  getGmailAuthUrl,
  handleGmailCallback,
  getGoogleAuthUrl,
  handleGoogleCallback,
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  getEmailAccounts,
  disconnectEmailAccount,
  getEmailAccountFolders,
  updateEmailAccountScope,
  getAuthenticatedClient,
  getAuthenticatedMicrosoftClient,
  _fetchMicrosoftFolderTree,
  encrypt,
  decrypt
};
