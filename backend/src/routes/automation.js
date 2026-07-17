const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { extractJobDetailsFromEmail, isJobRequest } = require('../services/aiJobExtractor');
const { createJobEvent, updateJobEvent, deleteJobEvent } = require('../services/googleCalendarService');
const Email = require('../models/Email');
const Job = require('../models/Job');
const Client = require('../models/Client');
const CalendarEvent = require('../models/CalendarEvent');

/**
 * Auto-classify emails as work-related or not using AI
 * POST /api/automation/auto-classify-emails
 */
router.post('/auto-classify-emails', auth, async (req, res) => {
  try {
    const { limit = 50 } = req.body;

    // Find unclass ified emails
    const unclassifiedEmails = await Email.find({
      isWorkRelated: null
    }).limit(limit);

    const results = {
      classified: 0,
      workRelated: 0,
      personal: 0,
      errors: []
    };

    for (const email of unclassifiedEmails) {
      try {
        const analysis = await isJobRequest(
          email.subject || '',
          email.body?.text || ''
        );

        if (analysis.confidence > 0.7) {
          email.isWorkRelated = analysis.isJobRequest;
          await email.save();
          results.classified++;
          if (analysis.isJobRequest) {
            results.workRelated++;
          } else {
            results.personal++;
          }
        }
      } catch (error) {
        results.errors.push({ emailId: email._id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Classified ${results.classified} emails`,
      results
    });
  } catch (error) {
    console.error('Error auto-classifying emails:', error);
    res.status(500).json({ message: 'Error auto-classifying emails', error: error.message });
  }
});

/**
 * Analyze email to see if it's a job request
 * POST /api/automation/analyze-email/:emailId
 */
router.post('/analyze-email/:emailId', auth, async (req, res) => {
  try {
    const email = await Email.findById(req.params.emailId);

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const analysis = await isJobRequest(
      email.subject || '',
      email.body?.text || ''
    );

    // Auto-classify if confidence is high
    if (analysis.confidence > 0.7) {
      email.isWorkRelated = analysis.isJobRequest;
      await email.save();
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing email:', error);
    res.status(500).json({ message: 'Error analyzing email', error: error.message });
  }
});

/**
 * Extract job details from an email
 * POST /api/automation/extract-job/:emailId
 */
router.post('/extract-job/:emailId', auth, async (req, res) => {
  try {
    const email = await Email.findById(req.params.emailId);

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const extraction = await extractJobDetailsFromEmail(
      email.body?.text || email.subject || '',
      email.from?.email || '',
      email.from?.name || ''
    );

    if (!extraction.success) {
      return res.status(500).json({ message: 'Failed to extract job details', error: extraction.error });
    }

    res.json({
      success: true,
      jobData: extraction.data,
      emailId: email._id
    });
  } catch (error) {
    console.error('Error extracting job from email:', error);
    res.status(500).json({ message: 'Error extracting job details', error: error.message });
  }
});

/**
 * Create a job from email with extracted data
 * POST /api/automation/create-job-from-email
 */
router.post('/create-job-from-email', auth, async (req, res) => {
  try {
    const { emailId, jobData, createCalendarEvent } = req.body;

    // Find or create client
    let client = await Client.findOne({ email: jobData.customerEmail });

    if (!client) {
      client = new Client({
        name: jobData.customerName,
        email: jobData.customerEmail,
        phone: jobData.customerPhone,
        address: jobData.address,
        source: 'email'
      });
      await client.save();
    }

    // Generate job number
    const jobNumber = await Job.generateJobNumber();

    // Create job
    const job = new Job({
      jobNumber,
      title: jobData.title,
      description: jobData.description,
      client: client._id,
      priority: jobData.priority || 'medium',
      status: 'quote',
      scheduledDate: jobData.preferredDate,
      costs: {
        laborHours: jobData.estimatedHours || 2,
        laborRate: 85
      },
      relatedEmails: [emailId],
      internalNotes: jobData.notes
    });

    await job.save();

    // Link email to job
    if (emailId) {
      await Email.findByIdAndUpdate(emailId, {
        jobId: job._id
      });
    }

    // Create calendar event if requested
    if (createCalendarEvent && job.scheduledDate) {
      const populatedJob = await Job.findById(job._id).populate('client');
      const calendarResult = await createJobEvent(req.user._id, populatedJob);

      if (calendarResult.success) {
        job.calendarEventId = calendarResult.eventId;
        job.calendarEventLink = calendarResult.eventLink;
        await job.save();
      }
    }

    const populatedJob = await Job.findById(job._id).populate('client');

    res.json({
      success: true,
      message: 'Job created successfully from email',
      job: populatedJob
    });
  } catch (error) {
    console.error('Error creating job from email:', error);
    res.status(500).json({ message: 'Error creating job from email', error: error.message });
  }
});

/**
 * Sync job to calendar
 * POST /api/automation/sync-to-calendar/:jobId
 *
 * Always creates/updates a local CalendarEvent so the job appears on the
 * in-app Calendar page. Also attempts Google Calendar sync if the user has
 * a connected Gmail account — Google failure is non-fatal.
 */
router.post('/sync-to-calendar/:jobId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate('client');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.scheduledDate) {
      return res.status(400).json({ message: 'Job must have a scheduled date to sync to calendar' });
    }

    const scheduledDate = new Date(job.scheduledDate);
    const endDate = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000); // default 2hr block
    const title = `${job.title}${job.client?.name ? ' — ' + job.client.name : ''}`;
    const location = job.client?.address
      ? [job.client.address.street, job.client.address.city, job.client.address.state].filter(Boolean).join(', ')
      : '';
    const description = `Job #${job.jobNumber}\nClient: ${job.client?.name || 'N/A'}\nPhone: ${job.client?.phone || 'N/A'}\n\n${job.description || ''}`.trim();

    // --- Local calendar (always) ---
    let localEvent = await CalendarEvent.findOne({ jobId: job._id });
    if (localEvent) {
      localEvent.title = title;
      localEvent.description = description;
      localEvent.location = location;
      localEvent.startDate = scheduledDate;
      localEvent.endDate = endDate;
      await localEvent.save();
    } else {
      localEvent = await CalendarEvent.create({
        userId: req.user._id,
        jobId: job._id,
        title,
        description,
        location,
        startDate: scheduledDate,
        endDate,
        color: '#3b82f6',
      });
    }

    // --- Google Calendar (best-effort) ---
    let googleEventLink = null;
    let googleSynced = false;
    try {
      let result;
      if (job.calendarEventId) {
        result = await updateJobEvent(req.user._id, job.calendarEventId, job);
      } else {
        result = await createJobEvent(req.user._id, job);
      }
      if (result.success) {
        job.calendarEventId = result.eventId;
        job.calendarEventLink = result.eventLink;
        googleEventLink = result.eventLink;
        googleSynced = true;
        if (localEvent) {
          localEvent.googleEventId = result.eventId;
          localEvent.googleEventLink = result.eventLink;
          await localEvent.save();
        }
      }
    } catch (googleErr) {
      console.warn('Google Calendar sync skipped (no account connected or token expired):', googleErr.message);
    }

    await job.save();

    res.json({
      success: true,
      message: googleSynced
        ? 'Job synced to Google Calendar and in-app calendar'
        : 'Job added to in-app calendar (connect Google Calendar in Integrations to also sync there)',
      eventLink: googleEventLink,
      googleSynced,
    });
  } catch (error) {
    console.error('Error syncing to calendar:', error);
    res.status(500).json({ message: 'Error syncing to calendar', error: error.message });
  }
});

/**
 * Remove job from calendar
 * DELETE /api/automation/remove-from-calendar/:jobId
 */
router.delete('/remove-from-calendar/:jobId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Remove from local calendar (always)
    await CalendarEvent.deleteOne({ jobId: job._id });

    // Remove from Google Calendar (best-effort)
    if (job.calendarEventId) {
      try {
        await deleteJobEvent(req.user._id, job.calendarEventId);
      } catch (googleErr) {
        console.warn('Google Calendar removal skipped:', googleErr.message);
      }
      job.calendarEventId = undefined;
      job.calendarEventLink = undefined;
      await job.save();
    }

    res.json({
      success: true,
      message: 'Job removed from calendar'
    });
  } catch (error) {
    console.error('Error removing from calendar:', error);
    res.status(500).json({ message: 'Error removing from calendar', error: error.message });
  }
});

/**
 * Bulk sync jobs to calendar
 * POST /api/automation/bulk-sync-calendar
 */
router.post('/bulk-sync-calendar', auth, async (req, res) => {
  try {
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of job IDs' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const jobId of jobIds) {
      try {
        const job = await Job.findById(jobId).populate('client');

        if (!job || !job.scheduledDate) {
          results.failed.push({ jobId, reason: 'Job not found or no scheduled date' });
          continue;
        }

        let result;
        if (job.calendarEventId) {
          result = await updateJobEvent(req.user._id, job.calendarEventId, job);
        } else {
          result = await createJobEvent(req.user._id, job);
        }

        if (result.success) {
          job.calendarEventId = result.eventId;
          job.calendarEventLink = result.eventLink;
          await job.save();
          results.success.push({ jobId, eventLink: result.eventLink });
        } else {
          results.failed.push({ jobId, reason: result.error });
        }
      } catch (error) {
        results.failed.push({ jobId, reason: error.message });
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error bulk syncing to calendar:', error);
    res.status(500).json({ message: 'Error bulk syncing to calendar', error: error.message });
  }
});

module.exports = router;
