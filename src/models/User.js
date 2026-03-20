const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const encryptionService = require('../services/encryptionService');

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
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  stellarSecretKeyHash: {
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
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Encrypt secret key before saving
userSchema.pre('save', function (next) {
  if (!this.isModified('stellarSecretKey')) return next();

  try {
    // Only encrypt if it's not already encrypted (plain string)
    if (typeof this.stellarSecretKey === 'string') {
      const encryptedData = encryptionService.encrypt(this.stellarSecretKey);
      this.stellarSecretKey = encryptedData;
      this.stellarSecretKeyHash = encryptionService.hashSecretKey(this.stellarSecretKey);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get decrypted secret key method
userSchema.methods.getDecryptedSecretKey = function () {
  try {
    if (typeof this.stellarSecretKey === 'string') {
      // Legacy plain text (for migration)
      return this.stellarSecretKey;
    }
    return encryptionService.decrypt(this.stellarSecretKey);
  } catch (error) {
    throw new Error(`Failed to decrypt secret key: ${error.message}`);
  }
};

// Verify secret key method
userSchema.methods.verifySecretKey = function (candidateSecretKey) {
  const candidateHash = encryptionService.hashSecretKey(candidateSecretKey);
  return candidateHash === this.stellarSecretKeyHash;
};

// Update timestamp on save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
