const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/projects');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// @route   GET /api/projects
// @desc    Get all projects with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { jobId, status, startDate, endDate, search } = req.query;
    const filter = {};

    if (jobId) filter.job = jobId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.projectDate = {};
      if (startDate) filter.projectDate.$gte = new Date(startDate);
      if (endDate) filter.projectDate.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(filter)
      .populate('job', 'jobNumber title client')
      .populate({
        path: 'job',
        populate: {
          path: 'client',
          select: 'name email'
        }
      })
      .populate('createdBy', 'name email')
      .populate('photos.uploadedBy', 'name email')
      .populate('notes.author', 'name email')
      .sort({ projectDate: -1 });

    res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('job')
      .populate({
        path: 'job',
        populate: {
          path: 'client',
          select: 'name email phone'
        }
      })
      .populate('createdBy', 'name email')
      .populate('photos.uploadedBy', 'name email')
      .populate('notes.author', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, jobId, projectDate } = req.body;

    if (!title || !jobId) {
      return res.status(400).json({ error: 'Title and job ID are required' });
    }

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const project = await Project.create({
      title,
      description,
      job: jobId,
      projectDate: projectDate || new Date(),
      createdBy: req.user._id
    });

    const populatedProject = await Project.findById(project._id)
      .populate('job', 'jobNumber title')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// @route   PATCH /api/projects/:id
// @desc    Update project
// @access  Private
router.patch('/:id', protect, async (req, res) => {
  try {
    const { title, description, projectDate, status } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (projectDate) updates.projectDate = projectDate;
    if (status) updates.status = status;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )
      .populate('job', 'jobNumber title')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// @route   POST /api/projects/:id/photos
// @desc    Upload photos to project
// @access  Private
router.post('/:id/photos', protect, upload.array('photos', 10), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { caption, tags, isBeforePhoto, isAfterPhoto } = req.body;

    // Add photos to project
    const newPhotos = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/projects/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      caption: caption || '',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      isBeforePhoto: isBeforePhoto === 'true' || isBeforePhoto === true,
      isAfterPhoto: isAfterPhoto === 'true' || isAfterPhoto === true,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    }));

    project.photos.push(...newPhotos);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('photos.uploadedBy', 'name email');

    res.status(201).json({
      message: `${newPhotos.length} photo(s) uploaded successfully`,
      photos: newPhotos,
      project: updatedProject
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// @route   DELETE /api/projects/:id/photos/:photoId
// @desc    Delete a photo from project
// @access  Private
router.delete('/:id/photos/:photoId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const photo = project.photos.id(req.params.photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads/projects', photo.filename);
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    // Remove photo from project
    project.photos.pull(req.params.photoId);
    await project.save();

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// @route   PATCH /api/projects/:id/photos/:photoId
// @desc    Update photo metadata (caption, tags, etc.)
// @access  Private
router.patch('/:id/photos/:photoId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const photo = project.photos.id(req.params.photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const { caption, tags, isBeforePhoto, isAfterPhoto } = req.body;

    if (caption !== undefined) photo.caption = caption;
    if (tags !== undefined) photo.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (isBeforePhoto !== undefined) photo.isBeforePhoto = isBeforePhoto;
    if (isAfterPhoto !== undefined) photo.isAfterPhoto = isAfterPhoto;

    await project.save();

    res.json({
      message: 'Photo updated successfully',
      photo
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// @route   POST /api/projects/:id/notes
// @desc    Add note to project
// @access  Private
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { content, attachedPhotos } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const newNote = {
      content,
      author: req.user._id,
      attachedPhotos: attachedPhotos || [],
      createdAt: new Date()
    };

    project.notes.push(newNote);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('notes.author', 'name email');

    res.status(201).json({
      message: 'Note added successfully',
      note: updatedProject.notes[updatedProject.notes.length - 1]
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// @route   PATCH /api/projects/:id/notes/:noteId
// @desc    Update a note
// @access  Private
router.patch('/:id/notes/:noteId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const note = project.notes.id(req.params.noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only author can update their note (or admin)
    if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this note' });
    }

    const { content, attachedPhotos } = req.body;

    if (content !== undefined) note.content = content;
    if (attachedPhotos !== undefined) note.attachedPhotos = attachedPhotos;
    note.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// @route   DELETE /api/projects/:id/notes/:noteId
// @desc    Delete a note
// @access  Private
router.delete('/:id/notes/:noteId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const note = project.notes.id(req.params.noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only author can delete their note (or admin)
    if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    project.notes.pull(req.params.noteId);
    await project.save();

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Only admin can delete projects
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete projects' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete all photos from filesystem
    for (const photo of project.photos) {
      const filePath = path.join(__dirname, '../../uploads/projects', photo.filename);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }

    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
