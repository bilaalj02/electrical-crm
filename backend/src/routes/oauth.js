const express = require('express');
const router = express.Router();
const {
  getGmailAuthUrl,
  handleGmailCallback,
  getEmailAccounts,
  disconnectEmailAccount
} = require('../controllers/oauthController');
const { auth } = require('../middleware/auth');

// Gmail OAuth routes
router.get('/gmail/auth-url', auth, getGmailAuthUrl);
router.get('/gmail/callback', handleGmailCallback);

// Email account management
router.get('/accounts', auth, getEmailAccounts);
router.delete('/accounts/:accountId', auth, disconnectEmailAccount);

module.exports = router;
