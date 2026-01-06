const { google } = require('googleapis');
const Email = require('../models/Email');
const EmailAccount = require('../models/EmailAccount');
const { getAuthenticatedClient } = require('./oauthController');

// Parse email address string
const parseEmailAddress = (addressString) => {
  if (!addressString) return null;

  const match = addressString.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: '', email: addressString.trim() };
};

// Parse email headers
const parseHeaders = (headers) => {
  const result = {};
  headers.forEach(header => {
    result[header.name.toLowerCase()] = header.value;
  });
  return result;
};

// Sync emails from Gmail
const syncEmails = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { maxResults = 50 } = req.query;

    const emailAccount = await EmailAccount.findOne({
      _id: accountId,
      userId: req.user._id,
      isActive: true
    });

    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    const oauth2Client = await getAuthenticatedClient(emailAccount);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get list of messages
    const listParams = {
      userId: 'me',
      maxResults: parseInt(maxResults)
    };

    // Use sync token for incremental sync if available
    if (emailAccount.syncToken) {
      listParams.pageToken = emailAccount.syncToken;
    }

    const response = await gmail.users.messages.list(listParams);
    const messages = response.data.messages || [];

    let syncedCount = 0;

    for (const message of messages) {
      // Check if email already exists
      const existingEmail = await Email.findOne({ messageId: message.id });
      if (existingEmail) continue;

      // Fetch full message details
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const headers = parseHeaders(fullMessage.data.payload.headers);

      // Parse email body
      let bodyText = '';
      let bodyHtml = '';

      const getBody = (payload) => {
        if (payload.body.data) {
          const data = Buffer.from(payload.body.data, 'base64').toString('utf-8');
          if (payload.mimeType === 'text/plain') {
            bodyText = data;
          } else if (payload.mimeType === 'text/html') {
            bodyHtml = data;
          }
        }

        if (payload.parts) {
          payload.parts.forEach(part => getBody(part));
        }
      };

      getBody(fullMessage.data.payload);

      // Parse attachments
      const attachments = [];
      const getAttachments = (payload) => {
        if (payload.filename && payload.body.attachmentId) {
          attachments.push({
            filename: payload.filename,
            mimeType: payload.mimeType,
            size: payload.body.size,
            attachmentId: payload.body.attachmentId
          });
        }
        if (payload.parts) {
          payload.parts.forEach(part => getAttachments(part));
        }
      };
      getAttachments(fullMessage.data.payload);

      // Create email record
      await Email.create({
        userId: req.user._id,
        emailAccountId: emailAccount._id,
        messageId: message.id,
        threadId: fullMessage.data.threadId,
        from: parseEmailAddress(headers.from),
        to: headers.to ? headers.to.split(',').map(parseEmailAddress) : [],
        cc: headers.cc ? headers.cc.split(',').map(parseEmailAddress) : [],
        subject: headers.subject || '(No Subject)',
        body: {
          text: bodyText,
          html: bodyHtml
        },
        snippet: fullMessage.data.snippet,
        date: new Date(parseInt(fullMessage.data.internalDate)),
        labels: fullMessage.data.labelIds || [],
        isRead: !fullMessage.data.labelIds?.includes('UNREAD'),
        isStarred: fullMessage.data.labelIds?.includes('STARRED'),
        hasAttachments: attachments.length > 0,
        attachments
      });

      syncedCount++;
    }

    // Update last synced time
    emailAccount.lastSyncedAt = new Date();
    if (response.data.nextPageToken) {
      emailAccount.syncToken = response.data.nextPageToken;
    }
    await emailAccount.save();

    res.json({
      message: `Successfully synced ${syncedCount} emails`,
      syncedCount,
      totalMessages: messages.length
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
};

// Get emails
const getEmails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      accountId,
      isRead,
      hasAttachments,
      clientId,
      jobId
    } = req.query;

    const query = { userId: req.user._id };

    if (accountId) query.emailAccountId = accountId;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (hasAttachments !== undefined) query.hasAttachments = hasAttachments === 'true';
    if (clientId) query.clientId = clientId;
    if (jobId) query.jobId = jobId;

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { 'from.email': { $regex: search, $options: 'i' } },
        { 'from.name': { $regex: search, $options: 'i' } },
        { snippet: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const emails = await Email.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('emailAccountId', 'email provider')
      .populate('clientId', 'name email')
      .populate('jobId', 'jobNumber title');

    const total = await Email.countDocuments(query);

    res.json({
      emails,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

// Get single email
const getEmail = async (req, res) => {
  try {
    const { emailId } = req.params;

    const email = await Email.findOne({
      _id: emailId,
      userId: req.user._id
    })
      .populate('emailAccountId', 'email provider')
      .populate('clientId', 'name email phone')
      .populate('jobId', 'jobNumber title status');

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ email });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
};

// Mark email as read/unread
const markEmailRead = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { isRead } = req.body;

    const email = await Email.findOne({
      _id: emailId,
      userId: req.user._id
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    email.isRead = isRead;
    await email.save();

    res.json({ message: 'Email updated successfully', email });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
};

// Link email to client/job
const linkEmail = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { clientId, jobId } = req.body;

    const email = await Email.findOne({
      _id: emailId,
      userId: req.user._id
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (clientId) email.clientId = clientId;
    if (jobId) email.jobId = jobId;

    await email.save();

    res.json({ message: 'Email linked successfully', email });
  } catch (error) {
    console.error('Error linking email:', error);
    res.status(500).json({ error: 'Failed to link email' });
  }
};

// Send email
const sendEmail = async (req, res) => {
  try {
    const { accountId, to, cc, subject, body, replyToMessageId } = req.body;

    const emailAccount = await EmailAccount.findOne({
      _id: accountId,
      userId: req.user._id,
      isActive: true
    });

    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    const oauth2Client = await getAuthenticatedClient(emailAccount);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const messageParts = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : '',
      `Subject: ${subject}`,
      '',
      body
    ].filter(Boolean);

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendParams = {
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    };

    // If replying, add threadId
    if (replyToMessageId) {
      const originalEmail = await Email.findOne({ messageId: replyToMessageId });
      if (originalEmail && originalEmail.threadId) {
        sendParams.requestBody.threadId = originalEmail.threadId;
      }
    }

    const response = await gmail.users.messages.send(sendParams);

    res.json({
      message: 'Email sent successfully',
      messageId: response.data.id
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

module.exports = {
  syncEmails,
  getEmails,
  getEmail,
  markEmailRead,
  linkEmail,
  sendEmail
};
