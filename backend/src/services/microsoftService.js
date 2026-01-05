const { ConfidentialClientApplication } = require('@azure/msal-node');
const axios = require('axios');
const Email = require('../models/Email');

class MicrosoftService {
  constructor() {
    this.accountType = 'microsoft';
    this.email = process.env.MICROSOFT_EMAIL;

    // MSAL configuration
    this.msalConfig = {
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET
      }
    };

    this.cca = new ConfidentialClientApplication(this.msalConfig);
    this.graphEndpoint = 'https://graph.microsoft.com/v1.0';
    this.accessToken = null;
  }

  /**
   * Get access token using client credentials
   */
  async getAccessToken() {
    try {
      const tokenResponse = await this.cca.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default']
      });
      this.accessToken = tokenResponse.accessToken;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Microsoft access token:', error);
      throw error;
    }
  }

  /**
   * Sync emails from Microsoft/Outlook
   */
  async syncEmails(maxResults = 50) {
    try {
      console.log('Syncing emails for Microsoft account...');

      // Ensure we have an access token
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      // Fetch messages from Microsoft Graph API
      const response = await axios.get(
        `${this.graphEndpoint}/me/messages`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            $top: maxResults,
            $orderby: 'receivedDateTime desc',
            $select: 'id,subject,from,toRecipients,ccRecipients,body,receivedDateTime,isRead,flag,hasAttachments,attachments,internetMessageId'
          }
        }
      );

      const messages = response.data.value || [];
      const syncedEmails = [];

      for (const message of messages) {
        // Check if email already exists
        const existing = await Email.findOne({
          messageId: message.internetMessageId || message.id
        });

        if (existing) {
          console.log(`Email ${message.id} already exists, skipping...`);
          continue;
        }

        // Parse and save email
        const emailData = this.parseMicrosoftMessage(message);
        const savedEmail = await Email.create(emailData);
        syncedEmails.push(savedEmail);
      }

      console.log(`Synced ${syncedEmails.length} new emails for Microsoft account`);
      return syncedEmails;

    } catch (error) {
      console.error('Error syncing Microsoft emails:', error.message);

      // If token expired, try refreshing
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.syncEmails(maxResults);
      }

      throw error;
    }
  }

  /**
   * Parse Microsoft message into our Email schema format
   */
  parseMicrosoftMessage(message) {
    // Parse email address
    const parseEmailAddress = (emailObj) => {
      if (!emailObj || !emailObj.emailAddress) return null;
      return {
        name: emailObj.emailAddress.name || '',
        email: emailObj.emailAddress.address
      };
    };

    const parseEmailList = (list) => {
      if (!list || !Array.isArray(list)) return [];
      return list.map(item => parseEmailAddress(item)).filter(e => e);
    };

    // Get attachments (if any)
    const attachments = [];
    if (message.hasAttachments && message.attachments) {
      message.attachments.forEach(att => {
        attachments.push({
          filename: att.name,
          contentType: att.contentType,
          size: att.size
        });
      });
    }

    return {
      messageId: message.internetMessageId || message.id,
      threadId: message.conversationId,
      accountEmail: this.email,
      accountType: this.accountType,
      from: parseEmailAddress(message.from),
      to: parseEmailList(message.toRecipients),
      cc: parseEmailList(message.ccRecipients),
      subject: message.subject || '',
      body: {
        text: message.body.contentType === 'text' ? message.body.content : '',
        html: message.body.contentType === 'html' ? message.body.content : ''
      },
      attachments: attachments,
      date: new Date(message.receivedDateTime),
      isRead: message.isRead,
      isStarred: message.flag?.flagStatus === 'flagged',
      labels: []
    };
  }

  /**
   * Get OAuth URL for user authorization
   */
  getAuthUrl() {
    const authCodeUrlParameters = {
      scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.ReadWrite'],
      redirectUri: 'http://localhost:5000/auth/microsoft/callback'
    };

    return this.cca.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    const tokenRequest = {
      code: code,
      scopes: ['https://graph.microsoft.com/Mail.Read'],
      redirectUri: 'http://localhost:5000/auth/microsoft/callback'
    };

    const response = await this.cca.acquireTokenByCode(tokenRequest);
    return response;
  }
}

module.exports = MicrosoftService;
