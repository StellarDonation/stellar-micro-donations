const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.0000001
  },
  currency: {
    type: String,
    required: true,
    default: 'XLM'
  },
  originalAmount: {
    type: Number,
    required: true
  },
  originalCurrency: {
    type: String,
    required: true
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  message: {
    type: String,
    maxlength: 500,
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  stellarMemo: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'refunded'],
    default: 'pending'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: null
  },
  nextRecurringDate: {
    type: Date
  },
  processingFee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  metadata: {
    ip: String,
    userAgent: String,
    referrer: String,
    campaignId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  }
});

// Index for efficient queries
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ creatorId: 1, createdAt: -1 });
donationSchema.index({ transactionHash: 1 });
donationSchema.index({ status: 1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toFixed(7)} ${this.currency}`;
});

// Update timestamp on save
donationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema);
