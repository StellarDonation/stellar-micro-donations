const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  stellarPublicKey: {
    type: String,
    required: true,
    unique: true
  },
  stellarSecretKey: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['creator', 'donor', 'both'],
    default: 'donor'
  },
  profile: {
    displayName: String,
    bio: String,
    avatar: String,
    socialLinks: {
      twitter: String,
      youtube: String,
      twitch: String,
      website: String
    }
  },
  donationSettings: {
    preferredCurrency: {
      type: String,
      default: 'XLM'
    },
    autoConvert: {
      type: Boolean,
      default: true
    },
    minimumDonation: {
      type: Number,
      default: 0.1
    }
  },
  statistics: {
    totalReceived: {
      type: Number,
      default: 0
    },
    totalDonated: {
      type: Number,
      default: 0
    },
    donationCount: {
      type: Number,
      default: 0
    },
    donorCount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
