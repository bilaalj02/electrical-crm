const express = require('express');
const router = express.Router();
const {
  getGmailAuthUrl,
  handleGmailCallback,
  getGoogleAuthUrl,
  handleGoogleCallback,
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  getEmailAccounts,
  disconnectEmailAccount,
  getEmailAccountFolders,
  updateEmailAccountScope
} = require('../controllers/oauthController');
const {
  getQuickBooksAuthUrl,
  handleQuickBooksCallback
} = require('../controllers/quickbooksController');
const { auth } = require('../middleware/auth');

// Google OAuth routes (Gmail + Calendar combined — used by Calendar page)
router.get('/google/auth-url', auth, getGoogleAuthUrl);
router.get('/google/callback', handleGoogleCallback);

// Gmail-only OAuth routes (used by Emails page)
router.get('/gmail/auth-url', auth, getGmailAuthUrl);
router.get('/gmail/callback', handleGmailCallback);

// Microsoft OAuth routes
router.get('/microsoft/auth-url', auth, getMicrosoftAuthUrl);
router.get('/microsoft/callback', handleMicrosoftCallback);

// QuickBooks OAuth routes
router.get('/quickbooks/auth-url', auth, getQuickBooksAuthUrl);
router.get('/quickbooks/callback', handleQuickBooksCallback);

// Email account management
router.get('/accounts', auth, getEmailAccounts);
router.delete('/accounts/:accountId', auth, disconnectEmailAccount);
router.get('/accounts/:accountId/folders', auth, getEmailAccountFolders);
router.patch('/accounts/:accountId/scope', auth, updateEmailAccountScope);

module.exports = router;
