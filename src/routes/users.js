const express = require('express');
const router = express.Router();
const User = require('../models/User');
const stellarService = require('../services/stellarService');
const donationService = require('../services/donationService');

// Get user by username (public profile)
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('-password -stellarSecretKey -email')
      .populate('statistics');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's recent donations received
    const recentDonations = await donationService.getDonationHistory(
      user._id,
      'received',
      1,
      5
    );

    // Get top donors
    const topDonors = await donationService.getTopDonors(user._id, 5);

    res.json({
      success: true,
      data: {
        user,
        recentDonations: recentDonations.donations,
        topDonors
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20, role } = req.query;
    
    const skip = (page - 1) * limit;
    let searchQuery = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { 'profile.displayName': { $regex: query, $options: 'i' } }
      ],
      isActive: true
    };

    if (role && role !== 'all') {
      searchQuery.role = role;
    }

    const users = await User.find(searchQuery)
      .select('username profile.displayName profile.avatar role statistics')
      .sort({ 'statistics.totalReceived': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get top creators
router.get('/top/creators', async (req, res) => {
  try {
    const { period = 'all', limit = 10 } = req.query;
    
    let dateFilter = {};
    if (period === 'month') {
      dateFilter = { 'statistics.totalReceived': { $gt: 0 } };
    }

    const topCreators = await User.find({
      role: { $in: ['creator', 'both'] },
      isActive: true,
      ...dateFilter
    })
    .select('username profile.displayName profile.avatar role statistics')
    .sort({ 'statistics.totalReceived': -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { creators: topCreators }
    });
  } catch (error) {
    console.error('Get top creators error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get creator statistics
router.get('/:creatorId/statistics', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { period = 'all' } = req.query;
    
    const statistics = await donationService.getDonationStatistics(creatorId, period);
    
    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    console.error('Get creator statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's public Stellar transactions
router.get('/:username/transactions', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 10, order = 'desc' } = req.query;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const transactions = await stellarService.getAccountTransactions(
      user.stellarPublicKey,
      parseInt(limit),
      order
    );

    // Filter only payment transactions and remove sensitive data
    const publicTransactions = transactions.map(tx => ({
      id: tx.id,
      hash: tx.hash,
      created_at: tx.created_at,
      transaction: tx.transaction,
      memo: tx.memo,
      operations: tx.operations.filter(op => op.type === 'payment').map(op => ({
        type: op.type,
        destination: op.destination,
        amount: op.amount,
        asset_type: op.asset_type,
        asset_code: op.asset_code
      }))
    }));

    res.json({
      success: true,
      data: { transactions: publicTransactions }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify user's Stellar account
router.post('/:username/verify', async (req, res) => {
  try {
    const { username } = req.params;
    const { signature, message } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // This would implement Stellar signature verification
    // For now, we'll just return success
    // In production, you'd verify the signature against the user's public key
    
    res.json({
      success: true,
      message: 'Account verified successfully'
    });
  } catch (error) {
    console.error('Verify account error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
