const Donation = require('../models/Donation');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const stellarService = require('./stellarService');
const anchorService = require('./anchorService');

class DonationService {
  // Process a new donation
  async processDonation(donationData) {
    try {
      const {
        donorId,
        creatorId,
        amount,
        currency = 'XLM',
        message,
        isAnonymous = false,
        campaignId = null
      } = donationData;

      // Validate users
      const donor = await User.findById(donorId);
      const creator = await User.findById(creatorId);

      if (!donor || !creator) {
        throw new Error('Invalid donor or creator');
      }

      // Get donor's current balance
      const balances = await stellarService.getAccountBalance(donor.stellarPublicKey);
      const currencyBalance = balances.find(b => b.asset_code === currency);

      if (!currencyBalance || parseFloat(currencyBalance.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // Handle currency conversion if needed
      let finalAmount = amount;
      let originalAmount = amount;
      let originalCurrency = currency;
      let exchangeRate = 1;
      let processingFee = 0;

      if (currency !== 'XLM' && creator.donationSettings?.preferredCurrency === 'XLM') {
        const conversion = await anchorService.convertCurrency(amount, currency, 'XLM');
        finalAmount = conversion.convertedAmount;
        exchangeRate = conversion.exchangeRate;
        processingFee = anchorService.calculateConversionFee(amount, currency).total;
      }

      // Calculate net amount after fees
      const netAmount = finalAmount - processingFee;

      // Generate unique memo for tracking
      const memo = stellarService.generateDonationMemo(donorId, creatorId, Date.now());

      // Process the Stellar transaction
      const transactionResult = await stellarService.sendPayment(
        donor.stellarSecretKey,
        creator.stellarPublicKey,
        finalAmount,
        'XLM',
        memo
      );

      // Create donation record
      const donation = new Donation({
        donorId,
        creatorId,
        amount: finalAmount,
        currency: 'XLM', // Always store as XLM after conversion
        originalAmount,
        originalCurrency,
        exchangeRate,
        message,
        isAnonymous,
        transactionHash: transactionResult.hash,
        stellarMemo: memo,
        status: 'confirmed',
        processingFee,
        netAmount,
        metadata: {
          campaignId
        }
      });

      await donation.save();

      // Update statistics
      await this.updateStatistics(donorId, creatorId, finalAmount);

      // Update campaign if applicable
      if (campaignId) {
        await this.updateCampaignProgress(campaignId, finalAmount);
      }

      // Return donation with user details
      const populatedDonation = await Donation.findById(donation._id)
        .populate('donorId', 'username profile.displayName profile.avatar')
        .populate('creatorId', 'username profile.displayName profile.avatar');

      return populatedDonation;
    } catch (error) {
      throw new Error(`Failed to process donation: ${error.message}`);
    }
  }

  // Get donation history for a user
  async getDonationHistory(userId, type = 'all', page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      let query = {};

      if (type === 'sent') {
        query.donorId = userId;
      } else if (type === 'received') {
        query.creatorId = userId;
      } else if (type === 'all') {
        query.$or = [{ donorId: userId }, { creatorId: userId }];
      }

      const donations = await Donation.find(query)
        .populate('donorId', 'username profile.displayName profile.avatar')
        .populate('creatorId', 'username profile.displayName profile.avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Donation.countDocuments(query);

      return {
        donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get donation history: ${error.message}`);
    }
  }

  // Get real-time donation stream
  async getDonationStream(creatorId, callback) {
    try {
      const creator = await User.findById(creatorId);
      if (!creator) {
        throw new Error('Creator not found');
      }

      // Stream payments for the creator's Stellar account
      const cursor = stellarService.streamPayments(
        creator.stellarPublicKey,
        async (payment) => {
          try {
            // Check if this is a donation payment
            if (payment.type === 'payment' && payment.asset_type === 'native') {
              const memo = payment.memo ? payment.memo.split('-') : [];

              if (memo.length >= 4 && memo[0] === 'DON') {
                // This is a donation payment
                const donation = await Donation.findOne({
                  transactionHash: payment.transaction_hash
                }).populate('donorId', 'username profile.displayName profile.avatar');

                if (donation) {
                  callback(donation);
                }
              }
            }
          } catch (error) {
            console.error('Error processing payment stream:', error);
          }
        }
      );

      return cursor;
    } catch (error) {
      throw new Error(`Failed to start donation stream: ${error.message}`);
    }
  }

  // Get donation statistics
  async getDonationStatistics(userId, period = 'all') {
    try {
      let dateFilter = {};

      if (period === 'day') {
        dateFilter = { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
      } else if (period === 'week') {
        dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
      } else if (period === 'month') {
        dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
      }

      const receivedStats = await Donation.aggregate([
        { $match: { creatorId: userId, status: 'confirmed', ...dateFilter } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            averageAmount: { $avg: '$amount' },
            uniqueDonors: { $addToSet: '$donorId' }
          }
        },
        {
          $project: {
            totalAmount: 1,
            count: 1,
            averageAmount: 1,
            uniqueDonorCount: { $size: '$uniqueDonors' }
          }
        }
      ]);

      const sentStats = await Donation.aggregate([
        { $match: { donorId: userId, status: 'confirmed', ...dateFilter } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]);

      return {
        received: receivedStats[0] || { totalAmount: 0, count: 0, averageAmount: 0, uniqueDonorCount: 0 },
        sent: sentStats[0] || { totalAmount: 0, count: 0, averageAmount: 0 }
      };
    } catch (error) {
      throw new Error(`Failed to get donation statistics: ${error.message}`);
    }
  }

  // Update user statistics after donation
  async updateStatistics(donorId, creatorId, amount) {
    try {
      // Update donor statistics
      await User.findByIdAndUpdate(donorId, {
        $inc: {
          'statistics.totalDonated': amount,
          'statistics.donationCount': 1
        }
      });

      // Update creator statistics
      const creator = await User.findById(creatorId);
      const donorCount = await Donation.distinct('donorId', {
        creatorId,
        status: 'confirmed'
      });

      await User.findByIdAndUpdate(creatorId, {
        $inc: {
          'statistics.totalReceived': amount
        },
        'statistics.donorCount': donorCount.length
      });
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  // Update campaign progress
  async updateCampaignProgress(campaignId, amount) {
    try {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { currentAmount: amount }
      });
    } catch (error) {
      console.error('Failed to update campaign progress:', error);
    }
  }

  // Get top donors for a creator
  async getTopDonors(creatorId, limit = 10) {
    try {
      const topDonors = await Donation.aggregate([
        { $match: { creatorId, status: 'confirmed' } },
        {
          $group: {
            _id: '$donorId',
            totalAmount: { $sum: '$amount' },
            donationCount: { $sum: 1 },
            lastDonation: { $max: '$createdAt' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'donor'
          }
        },
        { $unwind: '$donor' },
        {
          $project: {
            donorId: '$_id',
            totalAmount: 1,
            donationCount: 1,
            lastDonation: 1,
            'donor.username': 1,
            'donor.profile.displayName': 1,
            'donor.profile.avatar': 1
          }
        }
      ]);

      return topDonors;
    } catch (error) {
      throw new Error(`Failed to get top donors: ${error.message}`);
    }
  }

  // Verify donation transaction
  async verifyDonation(transactionHash) {
    try {
      const transaction = await stellarService.getTransaction(transactionHash);
      const donation = await Donation.findOne({ transactionHash });

      if (!donation) {
        return { verified: false, reason: 'Donation not found' };
      }

      // Verify transaction details match donation record
      const payment = transaction.operations.find(op => op.type === 'payment');

      if (!payment) {
        return { verified: false, reason: 'No payment operation found' };
      }

      const creator = await User.findById(donation.creatorId);

      if (payment.destination !== creator.stellarPublicKey) {
        return { verified: false, reason: 'Destination mismatch' };
      }

      if (parseFloat(payment.amount) !== donation.amount) {
        return { verified: false, reason: 'Amount mismatch' };
      }

      return { verified: true, donation };
    } catch (error) {
      throw new Error(`Failed to verify donation: ${error.message}`);
    }
  }
}

module.exports = new DonationService();
