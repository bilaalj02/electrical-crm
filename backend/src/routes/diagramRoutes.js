const express = require('express');
const router = express.Router();
const Diagram = require('../models/Diagram');
const CustomSymbol = require('../models/CustomSymbol');
const { auth: protect } = require('../middleware/auth');

// ── Diagrams ──────────────────────────────────────────────────────────────

// GET /api/diagrams — list all diagrams for this user
router.get('/', protect, async (req, res) => {
  try {
    const diagrams = await Diagram.find({ createdBy: req.user._id })
      .select('name thumbnail linkedJob linkedProject tags createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(diagrams);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch diagrams', error: err.message });
  }
});

// POST /api/diagrams — create new diagram
router.post('/', protect, async (req, res) => {
  try {
    const { name, canvas, thumbnail, linkedJob, linkedProject, tags } = req.body;
    const diagram = new Diagram({
      name: name || 'Untitled Diagram',
      canvas: canvas || {},
      thumbnail: thumbnail || '',
      linkedJob: linkedJob || null,
      linkedProject: linkedProject || null,
      tags: tags || [],
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
    });
    const saved = await diagram.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create diagram', error: err.message });
  }
});

// GET /api/diagrams/:id — get single diagram
router.get('/:id', protect, async (req, res) => {
  try {
    const diagram = await Diagram.findById(req.params.id);
    if (!diagram) return res.status(404).json({ message: 'Diagram not found' });
    res.json(diagram);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch diagram', error: err.message });
  }
});

// PUT /api/diagrams/:id — update diagram
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, canvas, thumbnail, linkedJob, linkedProject, tags } = req.body;
    const diagram = await Diagram.findByIdAndUpdate(
      req.params.id,
      {
        ...(name      !== undefined && { name }),
        ...(canvas    !== undefined && { canvas }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(linkedJob !== undefined && { linkedJob }),
        ...(linkedProject !== undefined && { linkedProject }),
        ...(tags      !== undefined && { tags }),
        lastEditedBy: req.user._id,
      },
      { new: true }
    );
    if (!diagram) return res.status(404).json({ message: 'Diagram not found' });
    res.json(diagram);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update diagram', error: err.message });
  }
});

// DELETE /api/diagrams/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const diagram = await Diagram.findByIdAndDelete(req.params.id);
    if (!diagram) return res.status(404).json({ message: 'Diagram not found' });
    res.json({ message: 'Diagram deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete diagram', error: err.message });
  }
});

// ── Custom Symbols ─────────────────────────────────────────────────────────

// GET /api/diagrams/custom-symbols
router.get('/custom-symbols', protect, async (req, res) => {
  try {
    const symbols = await CustomSymbol.find().sort({ createdAt: -1 });
    res.json(symbols);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch custom symbols', error: err.message });
  }
});

// POST /api/diagrams/custom-symbols
router.post('/custom-symbols', protect, async (req, res) => {
  try {
    const sym = new CustomSymbol({
      ...req.body,
      createdBy: req.user._id,
    });
    const saved = await sym.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save custom symbol', error: err.message });
  }
});

// DELETE /api/diagrams/custom-symbols/:id
router.delete('/custom-symbols/:id', protect, async (req, res) => {
  try {
    await CustomSymbol.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Custom symbol deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete custom symbol', error: err.message });
  }
});

module.exports = router;
