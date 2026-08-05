const express = require('express');
const router = express.Router();
const {
  syncEmails,
  getEmails,
  getEmail,
  markEmailRead,
  linkEmail,
  sendEmail,
  getFolders,
  moveEmail,
  fetchAttachment
} = require('../controllers/emailController');
const { auth } = require('../middleware/auth');

router.post('/sync/:accountId', auth, syncEmails);
router.get('/', auth, getEmails);
router.post('/send', auth, sendEmail);                         // before /:emailId
router.get('/folders/:accountId', auth, getFolders);          // before /:emailId
router.post('/move/:emailId', auth, moveEmail);               // before /:emailId
router.post('/:emailId/attachment', auth, fetchAttachment);   // POST — attachmentId in body
router.get('/:emailId', auth, getEmail);
router.patch('/:emailId/read', auth, markEmailRead);
router.patch('/:emailId/link', auth, linkEmail);

module.exports = router;
