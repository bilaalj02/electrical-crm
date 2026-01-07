const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Client = require('../models/Client');

/**
 * GET /api/jobs
 * Get all jobs with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      client,
      search,
      sortBy = 'scheduledDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (client) filter.client = client;
    if (search) {
      filter.$or = [
        { jobNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query
    const jobs = await Job.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('client')
      .populate('relatedEmails');

    const count = await Job.countDocuments(filter);

    res.json({
      jobs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/stats
 * Get job statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const total = await Job.countDocuments();
    const byStatus = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalRevenue = await Job.aggregate([
      { $match: { status: { $in: ['invoiced', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$costs.finalTotal' } } }
    ]);

    const pendingRevenue = await Job.aggregate([
      { $match: { status: { $in: ['quote', 'approved', 'scheduled', 'in-progress', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$costs.finalTotal' } } }
    ]);

    const unpaidInvoices = await Job.countDocuments({
      status: 'invoiced',
      'payment.paidInFull': false
    });

    res.json({
      total,
      byStatus,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingRevenue: pendingRevenue[0]?.total || 0,
      unpaidInvoices
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/recommendations
 * Get expense recommendations based on completed jobs
 */
router.get('/recommendations', async (req, res) => {
  try {
    // Aggregate all completed jobs to calculate averages
    const recommendations = await Job.aggregate([
      {
        $match: {
          status: 'completed',
          'actualExpenses.finalTotal': { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgLaborHours: { $avg: '$actualExpenses.laborHours' },
          avgLaborRate: { $avg: '$actualExpenses.laborRate' },
          avgMaterialsTotal: { $avg: '$actualExpenses.materialsTotal' },
          avgEquipmentTotal: { $avg: '$actualExpenses.equipmentTotal' },
          avgPermitsCost: { $avg: '$actualExpenses.permitsCost' },
          avgSubcontractorsCost: { $avg: '$actualExpenses.subcontractorsCost' },
          avgOtherCosts: { $avg: '$actualExpenses.otherCosts' },
          avgTaxRate: { $avg: '$actualExpenses.taxRate' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (!recommendations.length || recommendations[0].count === 0) {
      // No completed jobs with actual expenses yet - return defaults
      return res.json({
        hasData: false,
        recommendations: {
          laborHours: 8,
          laborRate: 85,
          materialsTotal: 500,
          equipmentTotal: 100,
          permitsCost: 0,
          subcontractorsCost: 0,
          otherCosts: 50,
          taxRate: 0.0825
        },
        basedOnJobs: 0
      });
    }

    const data = recommendations[0];
    res.json({
      hasData: true,
      recommendations: {
        laborHours: Math.round(data.avgLaborHours * 10) / 10,
        laborRate: Math.round(data.avgLaborRate * 100) / 100,
        materialsTotal: Math.round(data.avgMaterialsTotal * 100) / 100,
        equipmentTotal: Math.round(data.avgEquipmentTotal * 100) / 100,
        permitsCost: Math.round(data.avgPermitsCost * 100) / 100,
        subcontractorsCost: Math.round(data.avgSubcontractorsCost * 100) / 100,
        otherCosts: Math.round(data.avgOtherCosts * 100) / 100,
        taxRate: Math.round(data.avgTaxRate * 10000) / 10000
      },
      basedOnJobs: data.count
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/:id
 * Get a single job by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client')
      .populate('relatedEmails');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs
 * Create a new job
 */
router.post('/', async (req, res) => {
  try {
    // Generate job number
    const jobNumber = await Job.generateJobNumber();

    const jobData = {
      ...req.body,
      jobNumber
    };

    const job = await Job.create(jobData);

    // Update client's jobs array
    await Client.findByIdAndUpdate(job.client, {
      $push: { jobs: job._id }
    });

    const populatedJob = await Job.findById(job._id).populate('client');

    res.status(201).json(populatedJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/jobs/:id
 * Update a job
 */
router.patch('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job fields (allows actualExpenses to be included)
    Object.assign(job, req.body);

    // Save to trigger pre-save middleware for calculations
    await job.save();

    // Populate and return
    const updatedJob = await Job.findById(job._id)
      .populate('client')
      .populate('relatedEmails');

    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Remove job from client's jobs array
    await Client.findByIdAndUpdate(job.client, {
      $pull: { jobs: job._id }
    });

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:id/notes
 * Add a note to a job
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const { text, author } = req.body;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notes: {
            text,
            author,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('client');

    res.json(job);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/jobs/:id/status
 * Update job status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };

    // Set appropriate dates based on status
    const now = new Date();
    switch (status) {
      case 'approved':
        updateData.approvalDate = now;
        break;
      case 'in-progress':
        updateData.startDate = now;
        break;
      case 'completed':
        updateData.completionDate = now;
        break;
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('client');

    res.json(job);
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
