const mongoose = require('mongoose');
const User = require('../models/User');
const keyManagementService = require('../services/keyManagementService');
require('dotenv').config();

async function migrateSecretKeys() {
  try {
    console.log('Starting secret key migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stellar-micro-donations');
    console.log('Connected to database');

    // Find all users with plain text secret keys
    const usersWithPlainTextKeys = await User.find({
      $or: [
        { stellarSecretKey: { $type: 'string' } },
        { stellarSecretKeyHash: { $exists: false } }
      ]
    });

    console.log(`Found ${usersWithPlainTextKeys.length} users with plain text secret keys`);

    for (const user of usersWithPlainTextKeys) {
      try {
        console.log(`Migrating user: ${user.username}`);
        
        // Check if secret key is already encrypted
        if (typeof user.stellarSecretKey === 'string') {
          // Migrate plain text secret key
          const { encryptedSecretKey, secretKeyHash } = keyManagementService.migrateLegacySecretKey(user.stellarSecretKey);
          
          user.stellarSecretKey = encryptedSecretKey;
          user.stellarSecretKeyHash = secretKeyHash;
          
          await user.save();
          console.log(`Successfully migrated user: ${user.username}`);
        } else if (!user.stellarSecretKeyHash) {
          // Secret key is encrypted but hash is missing
          const decryptedKey = user.getDecryptedSecretKey();
          user.stellarSecretKeyHash = keyManagementService.hashSecretKey(decryptedKey);
          
          await user.save();
          console.log(`Added hash for user: ${user.username}`);
        }
      } catch (error) {
        console.error(`Failed to migrate user ${user.username}:`, error.message);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateSecretKeys();
}

module.exports = { migrateSecretKeys };
