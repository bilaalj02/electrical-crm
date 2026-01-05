const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Email = require('../models/Email');

class GodaddyService {
  constructor() {
    this.accountType = 'godaddy';
    this.email = process.env.GODADDY_EMAIL;

    // IMAP configuration for GoDaddy
    this.imapConfig = {
      user: process.env.GODADDY_EMAIL,
      password: process.env.GODADDY_PASSWORD,
      host: process.env.GODADDY_IMAP_HOST || 'imap.secureserver.net',
      port: parseInt(process.env.GODADDY_IMAP_PORT) || 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      }
    };
  }

  /**
   * Sync emails from GoDaddy using IMAP
   */
  async syncEmails(maxResults = 50) {
    return new Promise((resolve, reject) => {
      console.log('Syncing emails for GoDaddy account...');

      const imap = new Imap(this.imapConfig);
      const syncedEmails = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Error opening inbox:', err);
            imap.end();
            return reject(err);
          }

          // Fetch the most recent emails
          const fetchOptions = {
            bodies: '',
            markSeen: false
          };

          // Get total messages and calculate range
          const total = box.messages.total;
          const start = Math.max(1, total - maxResults + 1);
          const range = `${start}:${total}`;

          if (total === 0) {
            console.log('No emails in inbox');
            imap.end();
            return resolve([]);
          }

          const fetch = imap.seq.fetch(range, fetchOptions);

          fetch.on('message', (msg, seqno) => {
            let buffer = '';

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', async () => {
              try {
                // Parse email using mailparser
                const parsed = await simpleParser(buffer);
                const emailData = this.parseImapMessage(parsed);

                // Check if email already exists
                const existing = await Email.findOne({
                  messageId: emailData.messageId
                });

                if (!existing) {
                  const savedEmail = await Email.create(emailData);
                  syncedEmails.push(savedEmail);
                  console.log(`Saved email: ${emailData.subject}`);
                } else {
                  console.log(`Email already exists: ${emailData.subject}`);
                }
              } catch (error) {
                console.error('Error parsing email:', error);
              }
            });
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`Synced ${syncedEmails.length} new emails for GoDaddy account`);
            imap.end();
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(err);
      });

      imap.once('end', () => {
        console.log('Connection ended');
        resolve(syncedEmails);
      });

      imap.connect();
    });
  }

  /**
   * Parse IMAP message into our Email schema format
   */
  parseImapMessage(parsed) {
    // Parse email addresses
    const parseAddress = (addressObj) => {
      if (!addressObj || !addressObj.value || addressObj.value.length === 0) {
        return null;
      }
      const addr = addressObj.value[0];
      return {
        name: addr.name || '',
        email: addr.address
      };
    };

    const parseAddressList = (addressObj) => {
      if (!addressObj || !addressObj.value) return [];
      return addressObj.value.map(addr => ({
        name: addr.name || '',
        email: addr.address
      }));
    };

    // Parse attachments
    const attachments = [];
    if (parsed.attachments && parsed.attachments.length > 0) {
      parsed.attachments.forEach(att => {
        attachments.push({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size
        });
      });
    }

    return {
      messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
      threadId: parsed.inReplyTo || parsed.messageId,
      accountEmail: this.email,
      accountType: this.accountType,
      from: parseAddress(parsed.from),
      to: parseAddressList(parsed.to),
      cc: parseAddressList(parsed.cc),
      subject: parsed.subject || '',
      body: {
        text: parsed.text || '',
        html: parsed.html || ''
      },
      attachments: attachments,
      date: parsed.date || new Date(),
      isRead: false,
      isStarred: false,
      labels: []
    };
  }
}

module.exports = GodaddyService;
