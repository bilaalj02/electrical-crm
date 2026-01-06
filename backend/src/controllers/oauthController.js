const { google } = require('googleapis');
const EmailAccount = require('../models/EmailAccount');
const CryptoJS = require('crypto-js');
const axios = require('axios');

// Encryption helper functions
const encrypt = (text) => {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  return CryptoJS.AES.encrypt(text, encryptionKey).toString();
};

const decrypt = (encryptedText) => {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
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

// Generate Gmail OAuth URL
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
      state: req.user._id.toString() // Pass user ID in state
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

// Handle Gmail OAuth callback
const handleGmailCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state;

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
      `&state=${userId}` +
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
    const userId = state;

    if (error) {
      console.error('Microsoft OAuth error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
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
    console.error('Error handling Microsoft OAuth callback:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
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
      console.error('Error refreshing Microsoft token:', error);
      throw new Error('Failed to refresh Microsoft access token');
    }
  }

  return accessToken;
};

module.exports = {
  getGmailAuthUrl,
  handleGmailCallback,
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  getEmailAccounts,
  disconnectEmailAccount,
  getAuthenticatedClient,
  getAuthenticatedMicrosoftClient,
  encrypt,
  decrypt
};
