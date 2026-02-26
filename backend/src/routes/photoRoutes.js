const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const Project = require('../models/Project');
const upload = require('../config/upload');
const { auth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/photos/upload/:projectId
 * Upload multiple photos to a project
 */
router.post('/upload/:projectId', auth, upload.array('photos', 10), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { labels, notes, categories, jobId } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse arrays from request body
    const labelsArray = labels ? JSON.parse(labels) : [];
    const notesArray = notes ? JSON.parse(notes) : [];
    const categoriesArray = categories ? JSON.parse(categories) : [];

    // Create photo documents
    const photos = await Promise.all(
      req.files.map(async (file, index) => {
        const photo = new Photo({
          project: projectId,
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/projects/${file.filename}`,
          label: labelsArray[index] || file.originalname,
          notes: notesArray[index] || '',
          category: categoriesArray[index] || 'other',
          uploadedBy: req.user.userId,
          job: jobId || null,
          order: index
        });

        return await photo.save();
      })
    );

    res.json({
      success: true,
      message: `Successfully uploaded ${photos.length} photo(s)`,
      photos
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/photos/project/:projectId
 * Get all photos for a project
 */
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { category, sortBy = 'uploadedAt', sortOrder = 'desc' } = req.query;

    const filter = { project: projectId };
    if (category) filter.category = category;

    const photos = await Photo.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .populate('uploadedBy', 'name email')
      .populate('job', 'jobNumber title');

    res.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/photos/:photoId
 * Get a single photo by ID
 */
router.get('/:photoId', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId)
      .populate('uploadedBy', 'name email')
      .populate('project', 'name')
      .populate('job', 'jobNumber title');

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({ photo });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/photos/:photoId
 * Update photo metadata (label, notes, category, tags)
 */
router.patch('/:photoId', auth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { label, notes, category, tags, order } = req.body;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Update fields
    if (label !== undefined) photo.label = label;
    if (notes !== undefined) photo.notes = notes;
    if (category !== undefined) photo.category = category;
    if (tags !== undefined) photo.tags = tags;
    if (order !== undefined) photo.order = order;

    await photo.save();

    const updatedPhoto = await Photo.findById(photoId)
      .populate('uploadedBy', 'name email')
      .populate('job', 'jobNumber title');

    res.json({
      success: true,
      message: 'Photo updated successfully',
      photo: updatedPhoto
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/photos/:photoId
 * Delete a photo
 */
router.delete('/:photoId', auth, async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(photo.path)) {
        fs.unlinkSync(photo.path);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Delete from database
    await Photo.findByIdAndDelete(photoId);

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/photos/project/:projectId/bulk
 * Delete multiple photos
 */
router.delete('/project/:projectId/bulk', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'photoIds array is required' });
    }

    const photos = await Photo.find({
      _id: { $in: photoIds },
      project: projectId
    });

    // Delete files from filesystem
    photos.forEach(photo => {
      try {
        if (fs.existsSync(photo.path)) {
          fs.unlinkSync(photo.path);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    });

    // Delete from database
    const result = await Photo.deleteMany({
      _id: { $in: photoIds },
      project: projectId
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} photo(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting photos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/photos/stats/:projectId
 * Get photo statistics for a project
 */
router.get('/stats/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const totalPhotos = await Photo.countDocuments({ project: projectId });

    const byCategory = await Photo.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSize = await Photo.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$size' }
        }
      }
    ]);

    res.json({
      totalPhotos,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalSizeMB: totalSize[0] ? (totalSize[0].totalBytes / (1024 * 1024)).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching photo stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
