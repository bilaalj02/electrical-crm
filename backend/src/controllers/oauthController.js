const { google } = require('googleapis');
const EmailAccount = require('../models/EmailAccount');
const CryptoJS = require('crypto-js');

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

module.exports = {
  getGmailAuthUrl,
  handleGmailCallback,
  getEmailAccounts,
  disconnectEmailAccount,
  getAuthenticatedClient,
  encrypt,
  decrypt
};
