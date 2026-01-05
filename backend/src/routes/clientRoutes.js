const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Job = require('../models/Job');

/**
 * GET /api/clients
 * Get all clients
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      clientType,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (clientType) filter.clientType = clientType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query
    const clients = await Client.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('jobs');

    const count = await Client.countDocuments(filter);

    res.json({
      clients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clients/stats
 * Get client statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const total = await Client.countDocuments();
    const active = await Client.countDocuments({ status: 'active' });
    const prospects = await Client.countDocuments({ status: 'prospect' });

    const byType = await Client.aggregate([
      { $group: { _id: '$clientType', count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      active,
      prospects,
      byType
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clients/:id
 * Get a single client by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('jobs');

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clients
 * Create a new client
 */
router.post('/', async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/clients/:id
 * Update a client
 */
router.patch('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('jobs');

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check if client has any jobs
    const jobCount = await Job.countDocuments({ client: req.params.id });

    if (jobCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete client with existing jobs. Delete or reassign jobs first.'
      });
    }

    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clients/:id/jobs
 * Get all jobs for a specific client
 */
router.get('/:id/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({ client: req.params.id })
      .populate('client')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching client jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
