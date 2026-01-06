const express = require('express');
const router = express.Router();
const {
  syncEmails,
  getEmails,
  getEmail,
  markEmailRead,
  linkEmail,
  sendEmail
} = require('../controllers/emailController');
const { auth } = require('../middleware/auth');

// Email routes
router.post('/sync/:accountId', auth, syncEmails);
router.get('/', auth, getEmails);
router.get('/:emailId', auth, getEmail);
router.patch('/:emailId/read', auth, markEmailRead);
router.patch('/:emailId/link', auth, linkEmail);
router.post('/send', auth, sendEmail);

module.exports = router;
