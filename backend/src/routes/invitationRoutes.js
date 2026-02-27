const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const GmailService = require('../services/gmailService');

// Initialize Gmail service (using Gmail account 1)
const gmailService = new GmailService(1);

// Admin check middleware
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// @route   POST /api/invitations
// @desc    Send employee invitation (admin only)
// @access  Private/Admin
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'An invitation has already been sent to this email' });
    }

    // Generate unique token
    const token = Invitation.generateToken();

    // Create invitation
    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      token,
      role: role || 'employee',
      invitedBy: req.user._id
    });

    // Generate signup link
    const signupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?token=${token}`;

    // Send email via Gmail API
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4af37;">You've been invited!</h2>
          <p>Hi there,</p>
          <p>You've been invited to join <strong>${process.env.COMPANY_NAME || 'our team'}</strong> as ${role === 'employee' ? 'an employee' : 'a team member'}.</p>
          <p>Click the button below to create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signupLink}" style="background-color: #d4af37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Create Account
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${signupLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This invitation will expire in 7 days.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `;

      await gmailService.sendEmail({
        to: email,
        subject: 'You\'re invited to join the team!',
        html: emailHtml
      });

      res.status(201).json({
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (emailError) {
      console.error('Error sending email via Gmail API:', emailError);
      // Still return success since invitation was created
      res.status(201).json({
        message: 'Invitation created but email failed to send. Please provide the signup link manually.',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          signupLink
        }
      });
    }
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// @route   GET /api/invitations
// @desc    Get all invitations (admin only)
// @access  Private/Admin
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// @route   GET /api/invitations/verify/:token
// @desc    Verify invitation token
// @access  Public
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (!invitation.isValid()) {
      return res.status(400).json({ error: 'This invitation has expired or has already been used' });
    }

    res.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ error: 'Failed to verify invitation' });
  }
});

// @route   DELETE /api/invitations/:id
// @desc    Delete/revoke an invitation (admin only)
// @access  Private/Admin
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await invitation.deleteOne();

    res.json({ message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({ error: 'Failed to revoke invitation' });
  }
});

module.exports = router;
