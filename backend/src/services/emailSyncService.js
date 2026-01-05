const GmailService = require('./gmailService');
const MicrosoftService = require('./microsoftService');
const GodaddyService = require('./godaddyService');

class EmailSyncService {
  constructor() {
    // Initialize all email service providers
    this.services = {
      gmail1: new GmailService(1),
      gmail2: new GmailService(2),
      microsoft: new MicrosoftService(),
      godaddy: new GodaddyService()
    };

    this.syncInterval = parseInt(process.env.EMAIL_SYNC_INTERVAL) || 300000; // 5 minutes default
    this.batchSize = parseInt(process.env.EMAIL_BATCH_SIZE) || 50;
    this.isSyncing = false;
  }

  /**
   * Sync all email accounts
   */
  async syncAllAccounts() {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    console.log('Starting email sync for all accounts...');

    const results = {
      gmail1: { success: false, count: 0, error: null },
      gmail2: { success: false, count: 0, error: null },
      microsoft: { success: false, count: 0, error: null },
      godaddy: { success: false, count: 0, error: null }
    };

    // Sync each account
    for (const [accountType, service] of Object.entries(this.services)) {
      try {
        console.log(`\nSyncing ${accountType}...`);
        const emails = await service.syncEmails(this.batchSize);
        results[accountType] = {
          success: true,
          count: emails.length,
          error: null
        };
      } catch (error) {
        console.error(`Error syncing ${accountType}:`, error.message);
        results[accountType] = {
          success: false,
          count: 0,
          error: error.message
        };
      }
    }

    this.isSyncing = false;
    console.log('\nEmail sync completed');
    console.log('Results:', JSON.stringify(results, null, 2));

    return results;
  }

  /**
   * Sync a specific account
   */
  async syncAccount(accountType, maxResults = null) {
    if (!this.services[accountType]) {
      throw new Error(`Invalid account type: ${accountType}`);
    }

    console.log(`Syncing ${accountType}...`);
    const service = this.services[accountType];
    const emails = await service.syncEmails(maxResults || this.batchSize);

    return {
      accountType,
      count: emails.length,
      emails
    };
  }

  /**
   * Start automatic sync interval
   */
  startAutoSync() {
    console.log(`Starting auto-sync every ${this.syncInterval / 1000} seconds`);

    // Initial sync
    this.syncAllAccounts();

    // Set up interval
    this.syncIntervalId = setInterval(() => {
      this.syncAllAccounts();
    }, this.syncInterval);

    return this.syncIntervalId;
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Get OAuth URL for a specific account
   */
  getAuthUrl(accountType) {
    if (!this.services[accountType]) {
      throw new Error(`Invalid account type: ${accountType}`);
    }

    return this.services[accountType].getAuthUrl();
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(accountType, code) {
    if (!this.services[accountType]) {
      throw new Error(`Invalid account type: ${accountType}`);
    }

    return await this.services[accountType].getTokensFromCode(code);
  }
}

module.exports = new EmailSyncService();
