const express = require('express');
const router = express.Router();
const donationService = require('../services/donationService');
const { authenticateToken } = require('../middleware/auth');

// Process a new donation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const donationData = {
      ...req.body,
      donorId: req.user.id
    };

    const donation = await donationService.processDonation(donationData);
    
    // Emit real-time notification to creator's room
    const io = req.app.get('io');
    io.to(`creator-${donation.creatorId._id}`).emit('new-donation', donation);

    res.status(201).json({
      success: true,
      message: 'Donation processed successfully',
      donation
    });
  } catch (error) {
    console.error('Donation processing error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get donation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const history = await donationService.getDonationHistory(
      req.user.id,
      type,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get donation statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const statistics = await donationService.getDonationStatistics(req.user.id, period);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get donation statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get top donors for a creator
router.get('/top-donors/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { limit = 10 } = req.query;
    
    const topDonors = await donationService.getTopDonors(
      creatorId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: topDonors
    });
  } catch (error) {
    console.error('Get top donors error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify donation transaction
router.get('/verify/:transactionHash', async (req, res) => {
  try {
    const { transactionHash } = req.params;
    const verification = await donationService.verifyDonation(transactionHash);

    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    console.error('Verify donation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get public donation stream (for creators)
router.get('/stream/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Start streaming donations
    const cursor = await donationService.getDonationStream(
      creatorId,
      (donation) => {
        res.write(`data: ${JSON.stringify(donation)}\n\n`);
      }
    );

    // Clean up on client disconnect
    req.on('close', () => {
      if (cursor) {
        cursor.close();
      }
    });
  } catch (error) {
    console.error('Donation stream error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
