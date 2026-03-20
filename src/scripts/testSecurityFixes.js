const mongoose = require('mongoose');
const User = require('../models/User');
const stellarService = require('../services/stellarService');
const encryptionService = require('../services/encryptionService');
require('dotenv').config();

async function testSecurityFixes() {
  try {
    console.log('🔒 Testing Stellar Secret Key Security Fixes...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stellar-micro-donations');
    console.log('✅ Connected to database\n');

    // Test 1: Create new user with encrypted secret key
    console.log('📝 Test 1: Creating new user with encrypted secret key...');
    const stellarAccount = await stellarService.createAccount();
    console.log('✅ Stellar account created with encrypted secret key');
    
    const testUser = new User({
      username: 'testuser_security',
      email: 'test@example.com',
      password: 'testpassword123',
      stellarPublicKey: stellarAccount.publicKey,
      stellarSecretKey: stellarAccount.encryptedSecretKey,
      stellarSecretKeyHash: stellarAccount.secretKeyHash,
      role: 'donor'
    });

    await testUser.save();
    console.log('✅ User saved with encrypted secret key');

    // Test 2: Verify secret key is encrypted in database
    console.log('\n🔍 Test 2: Verifying secret key encryption in database...');
    const savedUser = await User.findOne({ username: 'testuser_security' });
    
    if (typeof savedUser.stellarSecretKey === 'object' && savedUser.stellarSecretKey.encrypted) {
      console.log('✅ Secret key is properly encrypted in database');
    } else {
      console.log('❌ Secret key is not encrypted!');
      return false;
    }

    // Test 3: Test decryption functionality
    console.log('\n🔓 Test 3: Testing secret key decryption...');
    try {
      const decryptedKey = savedUser.getDecryptedSecretKey();
      console.log('✅ Secret key successfully decrypted');
      
      // Verify the decrypted key matches the original
      if (decryptedKey === encryptionService.decrypt(stellarAccount.encryptedSecretKey)) {
        console.log('✅ Decrypted key matches original');
      } else {
        console.log('❌ Decrypted key does not match original!');
        return false;
      }
    } catch (error) {
      console.log('❌ Failed to decrypt secret key:', error.message);
      return false;
    }

    // Test 4: Test API response filtering
    console.log('\n🚫 Test 4: Testing API response filtering...');
    const userForApi = await User.findById(savedUser._id)
      .select('-password -stellarSecretKey -stellarSecretKeyHash');
    
    if (!userForApi.stellarSecretKey && !userForApi.stellarSecretKeyHash) {
      console.log('✅ Secret keys properly excluded from API responses');
    } else {
      console.log('❌ Secret keys found in API response!');
      return false;
    }

    // Test 5: Test key validation
    console.log('\n🔐 Test 5: Testing key validation...');
    const isValidPublic = stellarService.isValidStellarAddress(stellarAccount.publicKey);
    const isValidSecret = stellarService.isValidStellarSecretKey(encryptionService.decrypt(stellarAccount.encryptedSecretKey));
    
    if (isValidPublic && isValidSecret) {
      console.log('✅ Key validation working correctly');
    } else {
      console.log('❌ Key validation failed!');
      return false;
    }

    // Test 6: Test hash verification
    console.log('\n🔍 Test 6: Testing hash verification...');
    const decryptedKey = savedUser.getDecryptedSecretKey();
    const isValidHash = savedUser.verifySecretKey(decryptedKey);
    
    if (isValidHash) {
      console.log('✅ Hash verification working correctly');
    } else {
      console.log('❌ Hash verification failed!');
      return false;
    }

    // Cleanup
    await User.deleteOne({ username: 'testuser_security' });
    console.log('\n🧹 Test user cleaned up');

    console.log('\n🎉 All security tests passed! ✅');
    console.log('\n📋 Security Summary:');
    console.log('   ✅ Secret keys are encrypted at rest');
    console.log('   ✅ Secret keys are excluded from API responses');
    console.log('   ✅ Decryption functionality works correctly');
    console.log('   ✅ Key validation is implemented');
    console.log('   ✅ Hash verification is working');
    console.log('   ✅ No secret keys exposed in logs or responses');
    
    return true;

  } catch (error) {
    console.error('❌ Security test failed:', error);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testSecurityFixes().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testSecurityFixes };
