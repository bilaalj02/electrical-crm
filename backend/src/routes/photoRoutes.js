const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const Project = require('../models/Project');
const upload = require('../config/upload');
const { auth } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

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
      // Clean up Cloudinary uploads that were already processed
      await Promise.all(req.files.map(file =>
        cloudinary.uploader.destroy(file.filename).catch(() => {})
      ));
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
          filename: file.filename,      // Cloudinary public_id
          originalName: file.originalname,
          path: file.path,              // Cloudinary secure URL
          mimetype: file.mimetype,
          size: file.size || 0,
          url: file.path,               // full Cloudinary URL — no server prefix needed
          label: labelsArray[index] || file.originalname,
          notes: notesArray[index] || '',
          category: categoriesArray[index] || 'other',
          uploadedBy: req.user._id,
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
      .populate('job', 'jobNumber title')
      .populate('comments.author', 'name email');

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

    // Delete from Cloudinary
    if (photo.filename) {
      try {
        await cloudinary.uploader.destroy(photo.filename);
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
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

    // Delete from Cloudinary
    await Promise.all(photos.map(async (photo) => {
      if (photo.filename) {
        try {
          await cloudinary.uploader.destroy(photo.filename);
        } catch (err) {
          console.error('Error deleting from Cloudinary:', err);
        }
      }
    }));

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
 * POST /api/photos/:photoId/comments
 * Add a comment to a photo
 */
router.post('/:photoId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const photo = await Photo.findById(req.params.photoId);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    photo.comments.push({ content: content.trim(), author: req.user._id });
    await photo.save();

    const updated = await Photo.findById(req.params.photoId)
      .populate('comments.author', 'name email');

    res.status(201).json({ comment: updated.comments[updated.comments.length - 1] });
  } catch (error) {
    console.error('Error adding photo comment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/photos/:photoId/comments/:commentId
 * Delete a comment from a photo
 */
router.delete('/:photoId/comments/:commentId', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    const comment = photo.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    photo.comments.pull(req.params.commentId);
    await photo.save();

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting photo comment:', error);
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
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSize = await Photo.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
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

/**
 * GET /api/photos/stale
 * Lists photos that still have local /uploads paths (Railway ephemeral — file is gone).
 * Admin only.
 */
router.get('/stale', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const stale = await Photo.find({ url: { $not: /^https?:\/\// } })
    .populate('project', 'name')
    .select('_id originalName url project uploadedAt');
  res.json({ count: stale.length, photos: stale });
});

/**
 * DELETE /api/photos/stale
 * Deletes all photo DB records with local /uploads paths (files no longer exist on Railway).
 * Admin only. Users must re-upload these photos.
 */
router.delete('/stale', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const result = await Photo.deleteMany({ url: { $not: /^https?:\/\// } });
  res.json({ message: `Removed ${result.deletedCount} stale photo record(s). Please re-upload those photos.`, deletedCount: result.deletedCount });
});

module.exports = router;
