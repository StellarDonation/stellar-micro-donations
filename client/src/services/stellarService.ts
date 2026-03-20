import StellarSdk from 'stellar-sdk';

class StellarService {
  private server: StellarSdk.Server;
  private network: string;

  constructor() {
    this.network = process.env.REACT_APP_STELLAR_NETWORK || 'testnet';
    const horizonUrl = this.network === 'mainnet' 
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org';
    
    this.server = new StellarSdk.Server(horizonUrl);
  }

  // Create a new Stellar account
  createAccount(): { publicKey: string; secretKey: string } {
    const keypair = StellarSdk.Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret()
    };
  }

  // Get account balance
  async getAccountBalance(publicKey: string): Promise<any[]> {
    try {
      const account = await this.server.loadAccount(publicKey);
      return account.balances.map(balance => ({
        asset_type: balance.asset_type,
        asset_code: balance.asset_code || 'XLM',
        asset_issuer: balance.asset_issuer,
        balance: parseFloat(balance.balance),
        limit: balance.limit ? parseFloat(balance.limit) : null
      }));
    } catch (error) {
      throw new Error(`Failed to get account balance: ${error}`);
    }
  }

  // Send payment
  async sendPayment(
    fromSecretKey: string,
    toPublicKey: string,
    amount: string,
    memo?: string
  ): Promise<{ hash: string; success: boolean }> {
    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
      const sourcePublicKey = sourceKeypair.publicKey();
      
      const account = await this.server.loadAccount(sourcePublicKey);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.network === 'mainnet' 
          ? StellarSdk.Networks.PUBLIC 
          : StellarSdk.Networks.TESTNET
      });

      transaction.addOperation(StellarSdk.Operation.payment({
        destination: toPublicKey,
        asset: StellarSdk.Asset.native(),
        amount: amount
      }));

      if (memo) {
        transaction.addMemo(StellarSdk.Memo.text(memo));
      }

      const builtTransaction = transaction.setTimeout(30).build();
      builtTransaction.sign(sourceKeypair);

      const result = await this.server.submitTransaction(builtTransaction);
      return {
        success: true,
        hash: result.hash
      };
    } catch (error) {
      throw new Error(`Payment failed: ${error}`);
    }
  }

  // Get transaction details
  async getTransaction(transactionHash: string): Promise<any> {
    try {
      const transaction = await this.server
        .transactions()
        .transaction(transactionHash)
        .call();
      
      return transaction;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error}`);
    }
  }

  // Get account transactions
  async getAccountTransactions(
    publicKey: string,
    limit: number = 10,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<any[]> {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .limit(limit)
        .order(order)
        .call();
      
      return transactions.records;
    } catch (error) {
      throw new Error(`Failed to get account transactions: ${error}`);
    }
  }

  // Validate Stellar address
  isValidStellarAddress(address: string): boolean {
    try {
      StellarSdk.StrKey.decodeEd25519PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Fund testnet account using friendbot
  async fundTestnetAccount(publicKey: string): Promise<any> {
    if (this.network !== 'testnet') {
      throw new Error('Friendbot is only available on testnet');
    }

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Failed to fund testnet account: ${error}`);
    }
  }

  // Stream payments for an account
  streamPayments(publicKey: string, onPayment: (payment: any) => void): () => void {
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
    
    return () => cursor();
  }

  // Generate unique memo for donations
  generateDonationMemo(donorId: string, creatorId: string, timestamp: number): string {
    return `DON-${donorId.slice(-6)}-${creatorId.slice(-6)}-${timestamp}`;
  }

  // Parse donation memo
  parseDonationMemo(memo: string): { donorIdSuffix: string; creatorIdSuffix: string; timestamp: string } | null {
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

export default new StellarService();
