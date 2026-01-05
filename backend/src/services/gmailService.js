const { google } = require('googleapis');
const Email = require('../models/Email');

class GmailService {
  constructor(accountNumber) {
    this.accountNumber = accountNumber;
    this.accountType = `gmail${accountNumber}`;

    // OAuth2 credentials from .env
    this.clientId = process.env[`GMAIL${accountNumber}_CLIENT_ID`];
    this.clientSecret = process.env[`GMAIL${accountNumber}_CLIENT_SECRET`];
    this.refreshToken = process.env[`GMAIL${accountNumber}_REFRESH_TOKEN`];
    this.email = process.env[`GMAIL${accountNumber}_EMAIL`];

    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      'http://localhost:5000/auth/gmail/callback'
    );

    this.oauth2Client.setCredentials({
      refresh_token: this.refreshToken
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Sync emails from Gmail
   */
  async syncEmails(maxResults = 50) {
    try {
      console.log(`Syncing emails for Gmail account ${this.accountNumber}...`);

      // Get messages list
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: 'in:inbox' // Can be customized
      });

      const messages = response.data.messages || [];
      const syncedEmails = [];

      for (const message of messages) {
        // Check if email already exists
        const existing = await Email.findOne({ messageId: message.id });
        if (existing) {
          console.log(`Email ${message.id} already exists, skipping...`);
          continue;
        }

        // Get full message details
        const fullMessage = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        // Parse and save email
        const emailData = this.parseGmailMessage(fullMessage.data);
        const savedEmail = await Email.create(emailData);
        syncedEmails.push(savedEmail);
      }

      console.log(`Synced ${syncedEmails.length} new emails for Gmail ${this.accountNumber}`);
      return syncedEmails;

    } catch (error) {
      console.error(`Error syncing Gmail ${this.accountNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse Gmail message into our Email schema format
   */
  parseGmailMessage(message) {
    const headers = message.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    // Parse email addresses
    const parseEmailAddress = (str) => {
      if (!str) return null;
      const match = str.match(/(.*?)\s*<(.+?)>/) || [null, str, str];
      return {
        name: match[1] ? match[1].trim().replace(/"/g, '') : '',
        email: match[2] ? match[2].trim() : str.trim()
      };
    };

    const parseEmailList = (str) => {
      if (!str) return [];
      return str.split(',').map(email => parseEmailAddress(email.trim())).filter(e => e);
    };

    // Get email body
    let body = { text: '', html: '' };
    const getBody = (payload) => {
      if (payload.body.data) {
        const text = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        if (payload.mimeType === 'text/html') {
          body.html = text;
        } else {
          body.text = text;
        }
      }

      if (payload.parts) {
        payload.parts.forEach(part => {
          if (part.mimeType === 'text/plain' && part.body.data) {
            body.text = Buffer.from(part.body.data, 'base64').toString('utf-8');
          } else if (part.mimeType === 'text/html' && part.body.data) {
            body.html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          } else if (part.parts) {
            getBody(part);
          }
        });
      }
    };

    getBody(message.payload);

    // Get attachments
    const attachments = [];
    const getAttachments = (payload) => {
      if (payload.filename && payload.body.attachmentId) {
        attachments.push({
          filename: payload.filename,
          contentType: payload.mimeType,
          size: payload.body.size,
          attachmentId: payload.body.attachmentId
        });
      }
      if (payload.parts) {
        payload.parts.forEach(part => getAttachments(part));
      }
    };
    getAttachments(message.payload);

    return {
      messageId: message.id,
      threadId: message.threadId,
      accountEmail: this.email,
      accountType: this.accountType,
      from: parseEmailAddress(getHeader('From')),
      to: parseEmailList(getHeader('To')),
      cc: parseEmailList(getHeader('Cc')),
      subject: getHeader('Subject'),
      body: body,
      attachments: attachments,
      date: new Date(parseInt(message.internalDate)),
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED'),
      labels: message.labelIds || []
    };
  }

  /**
   * Get OAuth URL for authorization
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }
}

module.exports = GmailService;
