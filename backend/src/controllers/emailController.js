const { google } = require('googleapis');
const axios = require('axios');
const Email = require('../models/Email');
const EmailAccount = require('../models/EmailAccount');
const Client = require('../models/Client');
const { getAuthenticatedClient, getAuthenticatedMicrosoftClient, _fetchMicrosoftFolderTree } = require('./oauthController');
const cloudinary = require('../config/cloudinary');
const { isJobRequest } = require('../services/aiJobExtractor');

async function notifyMCPNewEmail(emailId) {
  const mcpUrl = process.env.MCP_WEBHOOK_URL;
  const secret = process.env.MCP_WEBHOOK_SECRET;
  if (!mcpUrl) return;
  try {
    await fetch(`${mcpUrl}/webhook/new-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret || '' },
      body: JSON.stringify({ emailId: emailId.toString() }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (err) {
    console.warn('[MCP] new-email webhook failed (non-fatal):', err.message);
  }
}

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

// Sync emails from Gmail or Microsoft
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

    // Route to appropriate sync function based on provider
    if (emailAccount.provider === 'gmail') {
      return await syncGmailEmails(req, res, emailAccount, maxResults);
    } else if (emailAccount.provider === 'microsoft') {
      return await syncMicrosoftEmails(req, res, emailAccount, maxResults);
    } else {
      return res.status(400).json({ error: 'Unsupported email provider' });
    }
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
};

// Sync Gmail emails
const syncGmailEmails = async (req, res, emailAccount, maxResults) => {
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
        const cidHeader = (payload.headers || []).find(h => h.name.toLowerCase() === 'content-id');
        const contentId = cidHeader ? cidHeader.value.replace(/^<|>$/g, '') : null;
        attachments.push({
          filename: payload.filename,
          mimeType: payload.mimeType,
          size: payload.body.size,
          attachmentId: payload.body.attachmentId,
          ...(contentId && { contentId })
        });
      }
      if (payload.parts) {
        payload.parts.forEach(part => getAttachments(part));
      }
    };
    getAttachments(fullMessage.data.payload);

    // Create email record
    const newEmail = await Email.create({
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

    // Notify MCP for AI classification (non-blocking, inbox only)
    if (!fullMessage.data.labelIds?.includes('SENT')) {
      notifyMCPNewEmail(newEmail._id);
    }

    syncedCount++;
  }

  // Update last synced time. Do NOT persist nextPageToken as syncToken —
  // nextPageToken paginates backwards through history; using it on the next
  // sync would walk older mail instead of picking up newly arrived emails.
  emailAccount.lastSyncedAt = new Date();
  await emailAccount.save();

  res.json({
    message: `Successfully synced ${syncedCount} emails`,
    syncedCount,
    totalMessages: messages.length
  });
};

// Microsoft Graph only inlines attachment content (contentBytes) for
// attachments under ~3MB. Larger attachments are skipped rather than
// handled via a separate byte-range download flow — flagged, not built.
const fetchAndStoreMicrosoftAttachments = async (accessToken, messageId) => {
  const response = await axios.get(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const result = [];
  for (const att of response.data.value || []) {
    if (att['@odata.type'] !== '#microsoft.graph.fileAttachment') continue;

    if (!att.contentBytes) {
      console.warn(`[emailController] Skipping attachment "${att.name}" on message ${messageId} — no inline content (likely over the ~3MB inline limit)`);
      result.push({ filename: att.name, mimeType: att.contentType, size: att.size, attachmentId: att.id, ...(att.contentId && { contentId: att.contentId.replace(/^<|>$/g, '') }) });
      continue;
    }

    try {
      const dataUri = `data:${att.contentType};base64,${att.contentBytes}`;
      const isImg = att.contentType?.startsWith('image/');
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'mes-electrical/email-attachments',
        resource_type: isImg ? 'image' : 'raw',
        public_id: `${messageId}-${att.id}`
      });
      result.push({
        filename: att.name,
        mimeType: att.contentType,
        size: att.size,
        attachmentId: att.id,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        ...(att.contentId && { contentId: att.contentId.replace(/^<|>$/g, '') })
      });
    } catch (error) {
      // Cloudinary's SDK throws a plain string (not an Error) for config
      // problems like missing credentials — e.g. `throw "Must supply
      // api_key"` — so error.message was silently logging `undefined`
      // for exactly the class of failure most worth seeing clearly.
      console.error(`[emailController] Failed to store attachment "${att.name}" on message ${messageId}:`, error?.message || error);
      result.push({ filename: att.name, mimeType: att.contentType, size: att.size, attachmentId: att.id, ...(att.contentId && { contentId: att.contentId.replace(/^<|>$/g, '') }) });
    }
  }

  return result;
};

// Sync Microsoft emails
const syncMicrosoftEmails = async (req, res, emailAccount, maxResults) => {
  const accessToken = await getAuthenticatedMicrosoftClient(emailAccount);

  const select = 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,body,isRead,hasAttachments,conversationId,parentFolderId';
  const scope = emailAccount.syncScope;

  // Folder identity — built once per sync call (not per message) so every
  // synced email can record which real mailbox folder it came from. This
  // also feeds the sidebar folder browser and fixes a pre-existing bug
  // where Outlook mail was hardcoded to labels:[] and therefore always
  // misclassified as "inbox" regardless of its real folder.
  const folderTree = await _fetchMicrosoftFolderTree(accessToken);
  const folderPathById = new Map(folderTree.map((f) => [f.id, f.path]));

  const detectJobsAndClients = (scope?.enabledFeatures || []).includes('job_client_detection');

  let messages = [];
  if (scope?.mode === 'selected' && scope.selectedIds.length) {
    // Not attempting cross-folder pagination merging — maxResults is a
    // per-folder cap, kept simple deliberately.
    for (const folderId of scope.selectedIds) {
      const folderResponse = await axios.get(
        `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages?$top=${maxResults}&$select=${select}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      messages = messages.concat(folderResponse.data.value || []);
    }
  } else {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$select=${select}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    messages = response.data.value || [];
  }

  let syncedCount = 0;

  for (const message of messages) {
    // Check if email already exists
    const existingEmail = await Email.findOne({ messageId: message.id });
    if (existingEmail) continue;

    // Parse recipients
    const parseRecipients = (recipients) => {
      if (!recipients) return [];
      return recipients.map(r => ({
        name: r.emailAddress.name || '',
        email: r.emailAddress.address
      }));
    };

    const attachments = message.hasAttachments
      ? await fetchAndStoreMicrosoftAttachments(accessToken, message.id)
      : [];

    const senderEmail = message.from?.emailAddress?.address || '';

    // Create email record
    const newMsEmail = await Email.create({
      userId: req.user._id,
      emailAccountId: emailAccount._id,
      messageId: message.id,
      threadId: message.conversationId,
      from: {
        name: message.from?.emailAddress?.name || '',
        email: senderEmail
      },
      to: parseRecipients(message.toRecipients),
      cc: parseRecipients(message.ccRecipients),
      subject: message.subject || '(No Subject)',
      body: {
        text: message.body?.contentType === 'text' ? message.body.content : '',
        html: message.body?.contentType === 'html' ? message.body.content : ''
      },
      snippet: message.bodyPreview || '',
      date: new Date(message.receivedDateTime),
      labels: [],
      folderId: message.parentFolderId || null,
      folderName: folderPathById.get(message.parentFolderId) || null,
      isRead: message.isRead,
      isStarred: false,
      hasAttachments: message.hasAttachments,
      attachments
    });

    // Opt-in only ("only if the user requests so") — classifies work-
    // relatedness and matches an EXISTING client by sender email. Does not
    // create a new Client or Job; that stays a human-reviewed action via
    // the existing "Convert to Job" button, which now correctly detects
    // "already linked" via jobId (see the automation.js/Emails.jsx fix
    // alongside this change).
    if (detectJobsAndClients) {
      try {
        const analysis = await isJobRequest(newMsEmail.subject || '', newMsEmail.body?.text || '');
        if (analysis.confidence > 0.7) {
          newMsEmail.isWorkRelated = analysis.isJobRequest;
          if (analysis.isJobRequest && senderEmail) {
            const matchedClient = await Client.findOne({ email: senderEmail });
            if (matchedClient) {
              newMsEmail.clientId = matchedClient._id;
            }
          }
          await newMsEmail.save();
        }
      } catch (error) {
        console.error(`[emailController] job/client detection failed for message ${message.id}:`, error.message);
      }
    }

    // Notify MCP for AI classification (non-blocking, inbox only)
    if (!message.isDraft) {
      notifyMCPNewEmail(newMsEmail._id);
    }

    syncedCount++;
  }

  // Update last synced time
  emailAccount.lastSyncedAt = new Date();
  await emailAccount.save();

  res.json({
    message: `Successfully synced ${syncedCount} emails`,
    syncedCount,
    totalMessages: messages.length
  });
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
      jobId,
      folderId,
      folder
    } = req.query;

    const query = { userId: req.user._id };

    if (accountId) query.emailAccountId = accountId;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (hasAttachments !== undefined) query.hasAttachments = hasAttachments === 'true';
    if (clientId) query.clientId = clientId;
    if (jobId) query.jobId = jobId;

    // folderId can be a Microsoft mailFolder ID or a Gmail label ID (e.g. "INBOX").
    // Gmail emails store folder info in labels[], Microsoft in folderId.
    // Match either so clicking a folder works for both providers.
    if (folderId) {
      query.$or = [{ folderId }, { labels: folderId }];
    } else if (folder === 'inbox') {
      query.$or = [{ folderId: { $in: ['inbox', 'INBOX'] } }, { labels: 'INBOX' }];
    } else if (folder === 'sent') {
      query.$or = [{ folderId: { $in: ['sentitems', 'SENT'] } }, { labels: 'SENT' }];
    }

    if (search) {
      const searchOr = [
        { subject: { $regex: search, $options: 'i' } },
        { 'from.email': { $regex: search, $options: 'i' } },
        { 'from.name': { $regex: search, $options: 'i' } },
        { snippet: { $regex: search, $options: 'i' } }
      ];
      // Merge with existing $or if folderId already set it
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
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

// Get folders for an account
const getFolders = async (req, res) => {
  try {
    const { accountId } = req.params;
    const emailAccount = await EmailAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!emailAccount) return res.status(404).json({ error: 'Account not found' });

    if (emailAccount.provider === 'microsoft') {
      const accessToken = await getAuthenticatedMicrosoftClient(emailAccount);
      const flatFolders = await _fetchMicrosoftFolderTree(accessToken);
      const FOLDER_ICONS = {
        'Inbox': '📥', 'Sent Items': '📤', 'Drafts': '📝',
        'Junk Email': '🚫', 'Deleted Items': '🗑️', 'Archive': '📦',
        'Outbox': '📬'
      };
      const folders = flatFolders.map(f => ({
        id: f.id,
        name: f.name,
        icon: FOLDER_ICONS[f.name] || '📁',
        unreadCount: 0,
        totalCount: 0
      }));
      return res.json({ folders });
    }

    if (emailAccount.provider === 'gmail') {
      const oauth2Client = await getAuthenticatedClient(emailAccount);
      const gmail = require('googleapis').google.gmail({ version: 'v1', auth: oauth2Client });
      const { data } = await gmail.users.labels.list({ userId: 'me' });
      const GMAIL_ICONS = {
        'INBOX': '📥', 'SENT': '📤', 'DRAFT': '📝',
        'SPAM': '🚫', 'TRASH': '🗑️', 'STARRED': '⭐', 'IMPORTANT': '🔔'
      };
      const folders = (data.labels || [])
        .filter(l => l.type !== 'system' || ['INBOX','SENT','DRAFT','SPAM','TRASH','STARRED'].includes(l.id))
        .map(l => ({
          id: l.id,
          name: l.name,
          icon: GMAIL_ICONS[l.id] || '📁',
          unreadCount: l.messagesUnread || 0,
          totalCount: l.messagesTotal || 0
        }));
      return res.json({ folders });
    }

    res.json({ folders: [] });
  } catch (error) {
    console.error('Error fetching folders:', error.message);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

// Serve a Gmail attachment (fetched on-demand, uploaded to Cloudinary, URL returned)
// Fetch an attachment on demand (Gmail or Microsoft) — attachmentId in body to avoid URL encoding issues
const fetchAttachment = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { attachmentId } = req.body;

    if (!attachmentId) return res.status(400).json({ error: 'attachmentId required' });

    // NOTE: no userId scoping here, deliberately. The email list the UI shows
    // (GET /api/emails, routes/emailRoutes.js) is a shared team inbox with NO
    // per-user filter, so any authenticated user can open any synced email.
    // Scoping this lookup to req.user._id made attachments 404 ("Email not
    // found") for every email synced by a different team member, even though
    // the email itself rendered fine. Auth is still required by the route.
    const email = await Email.findOne({ _id: emailId });
    if (!email) return res.status(404).json({ error: 'Email not found' });

    const att = email.attachments.find(a => a.attachmentId === attachmentId);
    if (!att) return res.status(404).json({ error: 'Attachment not found on this email' });

    // Already uploaded to Cloudinary — return cached URL (include contentId so
    // frontend can resolve cid: inline images for emails synced before the schema fix)
    if (att.url) return res.json({ url: att.url, filename: att.filename, mimeType: att.mimeType, contentId: att.contentId || null });

    // Use the account that synced this email (its owner's OAuth tokens), not
    // an account owned by the requesting user — same shared-inbox reasoning.
    const emailAccount = email.emailAccountId
      ? await EmailAccount.findOne({ _id: email.emailAccountId })
      : null;
    if (!emailAccount) return res.status(404).json({ error: 'No connected email account found for this email' });

    let base64Data, mimeType;

    if (emailAccount.provider === 'gmail') {
      const oauth2Client = await getAuthenticatedClient(emailAccount);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const { data } = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: email.messageId,
        id: attachmentId
      });
      if (!data.data) return res.status(404).json({ error: 'Attachment data not available from Gmail' });
      // Gmail uses URL-safe base64 — convert to standard
      base64Data = data.data.replace(/-/g, '+').replace(/_/g, '/');
      mimeType = att.mimeType || 'application/octet-stream';

    } else if (emailAccount.provider === 'microsoft') {
      const accessToken = await getAuthenticatedMicrosoftClient(emailAccount);
      // encodeURIComponent: Graph IDs are base64-ish and can contain chars
      // ('=', '+', '/') that break the URL path if interpolated raw
      const { data } = await axios.get(
        `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(email.messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!data.contentBytes) return res.status(404).json({ error: 'Attachment content not available from Microsoft (may exceed 3MB inline limit)' });
      base64Data = data.contentBytes;
      mimeType = data.contentType || att.mimeType || 'application/octet-stream';
      // Backfill contentId if Graph returns it and it wasn't stored at sync time
      if (data.contentId && !att.contentId) {
        att._resolvedContentId = data.contentId.replace(/^<|>$/g, '');
      }
    } else {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    // Upload to Cloudinary and cache
    // Use 'raw' for PDFs/documents — Cloudinary's 'auto' maps non-image files
    // to raw internally but generates /image/upload/ URLs which return 401 when
    // accessed directly. Explicit 'raw' produces the correct /raw/upload/ URL.
    const isImageMime = mimeType.startsWith('image/');
    const cloudinaryResourceType = isImageMime ? 'image' : 'raw';
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    const safePublicId = `${email._id}-${Buffer.from(attachmentId).toString('hex').slice(0, 40)}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'mes-electrical/email-attachments',
      resource_type: cloudinaryResourceType,
      public_id: safePublicId
    });

    const resolvedContentId = att.contentId || att._resolvedContentId || null;
    const dbSet = {
      'attachments.$.url': uploadResult.secure_url,
      'attachments.$.publicId': uploadResult.public_id,
      'attachments.$.mimeType': mimeType
    };
    if (resolvedContentId) dbSet['attachments.$.contentId'] = resolvedContentId;

    // Targeted update instead of email.save(): a full-document save re-runs
    // schema validation, which throws on legacy emails (synced by the old
    // pre-OAuth services) that are missing now-required fields like userId —
    // turning a successful attachment fetch into a 500 after the upload.
    await Email.updateOne(
      { _id: email._id, 'attachments.attachmentId': attachmentId },
      { $set: dbSet }
    );

    res.json({ url: uploadResult.secure_url, filename: att.filename, mimeType, contentId: resolvedContentId });
  } catch (error) {
    console.error('Error fetching attachment:', error.message);
    res.status(500).json({ error: 'Failed to fetch attachment', detail: error.message });
  }
};

// Move email to a folder
const moveEmail = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { folderId, folderName } = req.body;

    // Unscoped by userId for the same shared-inbox reason as fetchAttachment
    // above: the email list has no per-user filter, so moves must work on
    // emails synced by other team members too.
    const email = await Email.findOne({ _id: emailId });
    if (!email) return res.status(404).json({ error: 'Email not found' });

    const emailAccount = email.emailAccountId
      ? await EmailAccount.findOne({ _id: email.emailAccountId })
      : null;
    if (!emailAccount) return res.status(404).json({ error: 'No connected email account found for this email' });

    if (emailAccount.provider === 'microsoft') {
      const accessToken = await getAuthenticatedMicrosoftClient(emailAccount);
      // Graph returns the moved message with a NEW id — capture it so future
      // attachment fetches and moves don't 404 on the old (now invalid) id.
      const moveResponse = await axios.post(
        `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(email.messageId)}/move`,
        { destinationId: folderId },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      if (moveResponse.data?.id && moveResponse.data.id !== email.messageId) {
        await Email.updateOne({ _id: email._id }, { $set: { messageId: moveResponse.data.id } });
      }
    } else if (emailAccount.provider === 'gmail') {
      const oauth2Client = await getAuthenticatedClient(emailAccount);
      const gmail = require('googleapis').google.gmail({ version: 'v1', auth: oauth2Client });
      const currentLabels = email.labels || [];
      const removeLabelIds = currentLabels.filter(l => ['INBOX','SENT','DRAFT','SPAM','TRASH'].includes(l));
      await gmail.users.messages.modify({
        userId: 'me',
        id: email.messageId,
        requestBody: { addLabelIds: [folderId], removeLabelIds }
      });
    }

    // Schema fields are folderId/folderName — the old `email.folder = ...`
    // wrote to a non-schema path and was silently discarded by Mongoose.
    // updateOne (not save) so legacy docs missing required fields don't
    // fail validation.
    const folderUpdate = {};
    if (folderId) folderUpdate.folderId = folderId;
    if (folderName) folderUpdate.folderName = folderName;
    if (Object.keys(folderUpdate).length) {
      await Email.updateOne({ _id: email._id }, { $set: folderUpdate });
    }

    res.json({ message: 'Email moved successfully' });
  } catch (error) {
    console.error('Error moving email:', error.message);
    res.status(500).json({ error: 'Failed to move email' });
  }
};

module.exports = {
  syncEmails,
  getEmails,
  getEmail,
  markEmailRead,
  linkEmail,
  sendEmail,
  getFolders,
  moveEmail,
  fetchAttachment
};
