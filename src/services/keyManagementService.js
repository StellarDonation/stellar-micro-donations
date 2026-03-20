const StellarSdk = require('stellar-sdk');
const encryptionService = require('./encryptionService');

class KeyManagementService {
  constructor() {
    this.network = process.env.STELLAR_NETWORK === 'mainnet'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET;
  }

  generateSecureKeyPair() {
    try {
      const keypair = StellarSdk.Keypair.random();
      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      };
    } catch (error) {
      throw new Error(`Failed to generate key pair: ${error.message}`);
    }
  }

  validateKeyPair(publicKey, secretKey) {
    try {
      const derivedKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      return derivedKeypair.publicKey() === publicKey;
    } catch (error) {
      return false;
    }
  }

  encryptSecretKey(secretKey) {
    return encryptionService.encrypt(secretKey);
  }

  decryptSecretKey(encryptedData) {
    return encryptionService.decrypt(encryptedData);
  }

  hashSecretKey(secretKey) {
    return encryptionService.hashSecretKey(secretKey);
  }

  verifySecretKey(secretKey, hash) {
    return encryptionService.verifySecretKey(secretKey, hash);
  }

  createSecureAccount() {
    const keypair = this.generateSecureKeyPair();
    const encryptedSecretKey = this.encryptSecretKey(keypair.secretKey);
    const secretKeyHash = this.hashSecretKey(keypair.secretKey);

    return {
      publicKey: keypair.publicKey,
      encryptedSecretKey,
      secretKeyHash,
      network: process.env.STELLAR_NETWORK || 'testnet'
    };
  }

  migrateLegacySecretKey(plainTextSecretKey) {
    try {
      const encryptedSecretKey = this.encryptSecretKey(plainTextSecretKey);
      const secretKeyHash = this.hashSecretKey(plainTextSecretKey);
      
      return {
        encryptedSecretKey,
        secretKeyHash
      };
    } catch (error) {
      throw new Error(`Failed to migrate secret key: ${error.message}`);
    }
  }

  isValidPublicKey(publicKey) {
    try {
      StellarSdk.StrKey.decodeEd25519PublicKey(publicKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  isValidSecretKey(secretKey) {
    try {
      StellarSdk.Keypair.fromSecret(secretKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new KeyManagementService();
