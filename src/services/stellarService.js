const StellarSdk = require('stellar-sdk');
const axios = require('axios');

class StellarService {
  constructor() {
    this.network = process.env.STELLAR_NETWORK === 'mainnet'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET;

    this.horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    this.server = new StellarSdk.Server(this.horizonUrl);
    this.passphrase = process.env.STELLAR_PASSPHRASE || StellarSdk.Networks.TESTNET;
  }

  // Create a new Stellar account
  async createAccount() {
    try {
      const keypair = StellarSdk.Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();

      // For testnet, fund the account using friendbot
      if (process.env.STELLAR_NETWORK === 'testnet') {
        await this.fundTestnetAccount(publicKey);
      }

      return {
        publicKey,
        secretKey,
        network: process.env.STELLAR_NETWORK || 'testnet'
      };
    } catch (error) {
      throw new Error(`Failed to create Stellar account: ${error.message}`);
    }
  }

  // Fund testnet account using friendbot
  async fundTestnetAccount(publicKey) {
    try {
      const response = await axios.get(`https://friendbot.stellar.org?addr=${publicKey}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fund testnet account: ${error.message}`);
    }
  }

  // Get account balance
  async getAccountBalance(publicKey) {
    try {
      const account = await this.server.loadAccount(publicKey);
      const balances = account.balances.map(balance => ({
        asset_type: balance.asset_type,
        asset_code: balance.asset_code || 'XLM',
        asset_issuer: balance.asset_issuer,
        balance: parseFloat(balance.balance),
        limit: balance.limit ? parseFloat(balance.limit) : null
      }));

      return balances;
    } catch (error) {
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  // Send payment
  async sendPayment(fromSecretKey, toPublicKey, amount, asset = 'XLM', memo = null) {
    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
      const sourcePublicKey = sourceKeypair.publicKey();

      const account = await this.server.loadAccount(sourcePublicKey);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.passphrase
      });

      // Add payment operation
      let paymentAsset;
      if (asset === 'XLM') {
        paymentAsset = StellarSdk.Asset.native();
      } else {
        // For custom assets, validate format and specify asset code and issuer
        if (!asset.includes(':')) {
          throw new Error('Custom assets must be in format "CODE:ISSUER"');
        }
        const [assetCode, assetIssuer] = asset.split(':');
        if (!assetCode || !assetIssuer) {
          throw new Error('Invalid asset format. Use "CODE:ISSUER"');
        }
        paymentAsset = new StellarSdk.Asset(assetCode, assetIssuer);
      }

      transaction.addOperation(StellarSdk.Operation.payment({
        destination: toPublicKey,
        asset: paymentAsset,
        amount: amount.toString()
      }));

      // Add memo if provided
      if (memo) {
        transaction.addMemo(StellarSdk.Memo.text(memo));
      }

      const builtTransaction = transaction.setTimeout(30).build();
      builtTransaction.sign(sourceKeypair);

      const result = await this.server.submitTransaction(builtTransaction);
      return {
        success: true,
        hash: result.hash,
        ledger: result.ledger,
        memo: memo
      };
    } catch (error) {
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  // Create trust line for custom asset
  async createTrustLine(secretKey, assetCode, assetIssuer, limit = null) {
    try {
      const keypair = StellarSdk.Keypair.fromSecret(secretKey);
      const publicKey = keypair.publicKey();

      const account = await this.server.loadAccount(publicKey);
      const asset = new StellarSdk.Asset(assetCode, assetIssuer);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.passphrase
      })
        .addOperation(StellarSdk.Operation.changeTrust({
          asset: asset,
          limit: limit
        }))
        .setTimeout(30)
        .build();

      transaction.sign(keypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        success: true,
        hash: result.hash
      };
    } catch (error) {
      throw new Error(`Failed to create trust line: ${error.message}`);
    }
  }

  // Get transaction details
  async getTransaction(transactionHash) {
    try {
      const transaction = await this.server.transactions()
        .transaction(transactionHash)
        .call();

      return transaction;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  // Get account transactions
  async getAccountTransactions(publicKey, limit = 10, order = 'desc') {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .limit(limit)
        .order(order)
        .call();

      return transactions.records;
    } catch (error) {
      throw new Error(`Failed to get account transactions: ${error.message}`);
    }
  }

  // Stream payments for an account
  streamPayments(publicKey, onPayment) {
    try {
      const cursor = this.server
        .payments()
        .forAccount(publicKey)
        .cursor('now')
        .stream({
          onmessage: onPayment,
          onerror: (error) => {
            console.error('Payment stream error:', error);
          }
        });

      return cursor;
    } catch (error) {
      throw new Error(`Failed to stream payments: ${error.message}`);
    }
  }

  // Get asset information
  async getAssetInfo(assetCode, assetIssuer) {
    try {
      const asset = new StellarSdk.Asset(assetCode, assetIssuer);
      // This would typically query an anchor or other service for asset details
      return {
        code: assetCode,
        issuer: assetIssuer,
        // Additional asset metadata would go here
      };
    } catch (error) {
      throw new Error(`Failed to get asset info: ${error.message}`);
    }
  }

  // Validate Stellar address
  isValidStellarAddress(address) {
    try {
      StellarSdk.StrKey.decodeEd25519PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Generate unique memo for donations
  generateDonationMemo(donorId, creatorId, timestamp) {
    const donorSuffix = donorId.toString().slice(-8);
    const creatorSuffix = creatorId.toString().slice(-8);
    const timeSuffix = timestamp.toString().slice(-6);
    return `DON-${donorSuffix}-${creatorSuffix}-${timeSuffix}`;
  }

  // Parse donation memo
  parseDonationMemo(memo) {
    const parts = memo.split('-');
    if (parts.length !== 4 || parts[0] !== 'DON') {
      return null;
    }

    return {
      donorIdSuffix: parts[1],
      creatorIdSuffix: parts[2],
      timestamp: parts[3]
    };
  }
}

module.exports = new StellarService();
