const express = require('express');
const router = express.Router();
const {
  getGmailAuthUrl,
  handleGmailCallback,
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  getEmailAccounts,
  disconnectEmailAccount
} = require('../controllers/oauthController');
const { auth } = require('../middleware/auth');

// Gmail OAuth routes
router.get('/gmail/auth-url', auth, getGmailAuthUrl);
router.get('/gmail/callback', handleGmailCallback);

// Microsoft OAuth routes
router.get('/microsoft/auth-url', auth, getMicrosoftAuthUrl);
router.get('/microsoft/callback', handleMicrosoftCallback);

// Email account management
router.get('/accounts', auth, getEmailAccounts);
router.delete('/accounts/:accountId', auth, disconnectEmailAccount);

module.exports = router;
