const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { extractJobDetailsFromEmail, isJobRequest } = require('../services/aiJobExtractor');
const { createJobEvent, updateJobEvent, deleteJobEvent } = require('../services/googleCalendarService');
const Email = require('../models/Email');
const Job = require('../models/Job');
const Client = require('../models/Client');

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
        linkedJob: job._id
      });
    }

    // Create calendar event if requested
    if (createCalendarEvent && job.scheduledDate) {
      const populatedJob = await Job.findById(job._id).populate('client');
      const calendarResult = await createJobEvent(req.user.userId, populatedJob);

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
 * Sync job to Google Calendar
 * POST /api/automation/sync-to-calendar/:jobId
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

    let result;

    // Update existing event or create new one
    if (job.calendarEventId) {
      result = await updateJobEvent(req.user.userId, job.calendarEventId, job);
    } else {
      result = await createJobEvent(req.user.userId, job);
    }

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to sync to calendar', error: result.error });
    }

    // Save calendar event details
    job.calendarEventId = result.eventId;
    job.calendarEventLink = result.eventLink;
    await job.save();

    res.json({
      success: true,
      message: 'Job synced to Google Calendar',
      eventLink: result.eventLink
    });
  } catch (error) {
    console.error('Error syncing to calendar:', error);
    res.status(500).json({ message: 'Error syncing to calendar', error: error.message });
  }
});

/**
 * Remove job from Google Calendar
 * DELETE /api/automation/remove-from-calendar/:jobId
 */
router.delete('/remove-from-calendar/:jobId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.calendarEventId) {
      return res.status(400).json({ message: 'Job is not linked to a calendar event' });
    }

    const result = await deleteJobEvent(req.user.userId, job.calendarEventId);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to remove from calendar', error: result.error });
    }

    // Clear calendar event details
    job.calendarEventId = undefined;
    job.calendarEventLink = undefined;
    await job.save();

    res.json({
      success: true,
      message: 'Job removed from Google Calendar'
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
          result = await updateJobEvent(req.user.userId, job.calendarEventId, job);
        } else {
          result = await createJobEvent(req.user.userId, job);
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
