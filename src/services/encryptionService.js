const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || this.generateKey();
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  generateKey() {
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('ENCRYPTION_KEY not set in environment variables. Using generated key.');
      console.warn('Please set ENCRYPTION_KEY in your environment for production.');
    }
    return crypto.randomBytes(this.keyLength);
  }

  getEncryptionKey() {
    if (process.env.ENCRYPTION_KEY) {
      return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }
    return this.secretKey;
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const key = this.getEncryptionKey();
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encryptedData) {
    try {
      const { encrypted, iv, tag } = encryptedData;
      const key = this.getEncryptionKey();
      const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));

      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  hashSecretKey(secretKey) {
    return crypto.createHash('sha256').update(secretKey).digest('hex');
  }

  verifySecretKey(secretKey, hashedKey) {
    const hash = this.hashSecretKey(secretKey);
    return hash === hashedKey;
  }
}

module.exports = new EncryptionService();
