const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  goal: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'XLM'
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['charity', 'content-creator', 'emergency', 'education', 'health', 'arts', 'technology', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String
  },
  video: {
    type: String
  },
  updates: [{
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  rewards: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    minimumDonation: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: null
    },
    claimed: {
      type: Number,
      default: 0
    }
  }],
  settings: {
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    showDonorNames: {
      type: Boolean,
      default: true
    },
    enableComments: {
      type: Boolean,
      default: true
    }
  },
  statistics: {
    donorCount: {
      type: Number,
      default: 0
    },
    averageDonation: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
campaignSchema.index({ creatorId: 1, createdAt: -1 });
campaignSchema.index({ isActive: 1, endDate: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ isFeatured: 1 });

// Virtual for progress percentage
campaignSchema.virtual('progressPercentage').get(function() {
  if (this.goal <= 0) return 0;
  return Math.min((this.currentAmount / this.goal) * 100, 100);
});

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
});

// Update timestamp on save
campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
