const { google } = require('googleapis');
const EmailAccount = require('../models/EmailAccount');

/**
 * Get Google Calendar client for a user's connected account
 */
async function getCalendarClient(userId) {
  const account = await EmailAccount.findOne({
    userId,
    provider: 'gmail',
    isActive: true
  });

  if (!account) {
    throw new Error('No active Gmail account found. Please connect a Google account first.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      account.refreshToken = tokens.refresh_token;
    }
    account.accessToken = tokens.access_token;
    await account.save();
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event for a job
 */
async function createJobEvent(userId, job) {
  try {
    const calendar = await getCalendarClient(userId);

    const event = {
      summary: `${job.title} - ${job.client?.name || 'Customer'}`,
      description: `Job #${job.jobNumber}\n\nClient: ${job.client?.name}\nEmail: ${job.client?.email}\nPhone: ${job.client?.phone || 'N/A'}\n\n${job.description || 'No description'}`,
      location: job.client?.address ?
        `${job.client.address.street}, ${job.client.address.city}, ${job.client.address.state} ${job.client.address.zipCode}` :
        '',
      start: {
        dateTime: job.scheduledDate ? new Date(job.scheduledDate).toISOString() : new Date().toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: job.scheduledDate ?
          new Date(new Date(job.scheduledDate).getTime() + (job.costs?.laborHours || 2) * 60 * 60 * 1000).toISOString() :
          new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      colorId: getColorIdByStatus(job.status),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update a calendar event
 */
async function updateJobEvent(userId, eventId, job) {
  try {
    const calendar = await getCalendarClient(userId);

    const event = {
      summary: `${job.title} - ${job.client?.name || 'Customer'}`,
      description: `Job #${job.jobNumber}\n\nClient: ${job.client?.name}\nEmail: ${job.client?.email}\nPhone: ${job.client?.phone || 'N/A'}\n\n${job.description || 'No description'}`,
      location: job.client?.address ?
        `${job.client.address.street}, ${job.client.address.city}, ${job.client.address.state} ${job.client.address.zipCode}` :
        '',
      start: {
        dateTime: job.scheduledDate ? new Date(job.scheduledDate).toISOString() : new Date().toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: job.scheduledDate ?
          new Date(new Date(job.scheduledDate).getTime() + (job.costs?.laborHours || 2) * 60 * 60 * 1000).toISOString() :
          new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/New_York',
      },
      colorId: getColorIdByStatus(job.status),
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a calendar event
 */
async function deleteJobEvent(userId, eventId) {
  try {
    const calendar = await getCalendarClient(userId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get calendar color based on job status
 */
function getColorIdByStatus(status) {
  const colorMap = {
    'quote': '8',        // Gray
    'approved': '9',     // Blue
    'scheduled': '5',    // Yellow
    'in-progress': '6',  // Orange
    'completed': '10',   // Green
    'invoiced': '11',    // Red
    'paid': '10',        // Green
    'cancelled': '8'     // Gray
  };
  return colorMap[status] || '9';
}

module.exports = {
  createJobEvent,
  updateJobEvent,
  deleteJobEvent,
  getCalendarClient
};
