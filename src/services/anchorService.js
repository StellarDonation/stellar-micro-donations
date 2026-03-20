const axios = require('axios');

class AnchorService {
  constructor() {
    this.anchorDomain = process.env.ANCHOR_DOMAIN || 'anchor.stellar.org';
    this.anchorApiKey = process.env.ANCHOR_API_KEY;
    this.baseURL = `https://${this.anchorDomain}`;
  }

  // Get supported currencies from anchor
  async getSupportedCurrencies() {
    try {
      const response = await axios.get(`${this.baseURL}/currencies`, {
        headers: this.getHeaders()
      });
      
      return response.data.map(currency => ({
        code: currency.code,
        issuer: currency.issuer,
        name: currency.name,
        country: currency.country,
        isStellarAsset: currency.is_stellar_asset,
        minimumAmount: currency.minimum_amount,
        maximumAmount: currency.maximum_amount
      }));
    } catch (error) {
      throw new Error(`Failed to fetch supported currencies: ${error.message}`);
    }
  }

  // Get exchange rates
  async getExchangeRates(fromCurrency, toCurrency) {
    try {
      const response = await axios.get(`${this.baseURL}/rates`, {
        params: {
          from: fromCurrency,
          to: toCurrency
        },
        headers: this.getHeaders()
      });
      
      return {
        from: fromCurrency,
        to: toCurrency,
        rate: response.data.rate,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      throw new Error(`Failed to get exchange rates: ${error.message}`);
    }
  }

  // Convert currency
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      const rates = await this.getExchangeRates(fromCurrency, toCurrency);
      const convertedAmount = amount * rates.rate;
      
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: convertedAmount,
        targetCurrency: toCurrency,
        exchangeRate: rates.rate,
        timestamp: rates.timestamp
      };
    } catch (error) {
      throw new Error(`Failed to convert currency: ${error.message}`);
    }
  }

  // Get deposit info for a currency
  async getDepositInfo(currencyCode, account) {
    try {
      const response = await axios.post(`${this.baseURL}/deposit`, {
        account: account,
        asset_code: currencyCode
      }, {
        headers: this.getHeaders()
      });
      
      return {
        how: response.data.how,
        eta: response.data.eta,
        fee_fixed: response.data.fee_fixed,
        fee_percent: response.data.fee_percent,
        min_amount: response.data.min_amount,
        max_amount: response.data.max_amount,
        instructions: response.data.instructions
      };
    } catch (error) {
      throw new Error(`Failed to get deposit info: ${error.message}`);
    }
  }

  // Get withdrawal info for a currency
  async getWithdrawalInfo(currencyCode, account) {
    try {
      const response = await axios.post(`${this.baseURL}/withdraw`, {
        account: account,
        asset_code: currencyCode
      }, {
        headers: this.getHeaders()
      });
      
      return {
        how: response.data.how,
        eta: response.data.eta,
        fee_fixed: response.data.fee_fixed,
        fee_percent: response.data.fee_percent,
        min_amount: response.data.min_amount,
        max_amount: response.data.max_amount,
        instructions: response.data.instructions
      };
    } catch (error) {
      throw new Error(`Failed to get withdrawal info: ${error.message}`);
    }
  }

  // Get transaction status
  async getTransactionStatus(transactionId) {
    try {
      const response = await axios.get(`${this.baseURL}/transaction/${transactionId}`, {
        headers: this.getHeaders()
      });
      
      return {
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        amount_in: response.data.amount_in,
        amount_out: response.data.amount_out,
        fee: response.data.fee,
        from: response.data.from,
        to: response.data.to,
        memo: response.data.memo,
        created_at: response.data.created_at,
        completed_at: response.data.completed_at
      };
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  // Get anchor info
  async getAnchorInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/info`, {
        headers: this.getHeaders()
      });
      
      return {
        name: response.data.name,
        website: response.data.website,
        stellarAddress: response.data.stellar_address,
        stellarMemo: response.data.stellar_memo,
        languages: response.data.languages,
        currencies: response.data.currencies
      };
    } catch (error) {
      throw new Error(`Failed to get anchor info: ${error.message}`);
    }
  }

  // Calculate conversion fees
  calculateConversionFee(amount, currency) {
    // Typical fee structure (adjust based on actual anchor fees)
    const feeStructure = {
      'XLM': { fixed: 0, percent: 0.005 }, // 0.5%
      'USD': { fixed: 0.50, percent: 0.01 }, // 1% + $0.50
      'EUR': { fixed: 0.45, percent: 0.01 }, // 1% + €0.45
      'BTC': { fixed: 0.0001, percent: 0.005 }, // 0.5% + 0.0001 BTC
      'ETH': { fixed: 0.005, percent: 0.005 } // 0.5% + 0.005 ETH
    };

    const fees = feeStructure[currency] || feeStructure['XLM'];
    const fixedFee = fees.fixed;
    const percentFee = amount * fees.percent;
    
    return {
      fixed: fixedFee,
      percent: percentFee,
      total: fixedFee + percentFee
    };
  }

  // Get optimal conversion path
  async getOptimalConversionPath(fromCurrency, toCurrency, amount) {
    try {
      // For direct conversion
      const directConversion = await this.convertCurrency(amount, fromCurrency, toCurrency);
      
      // Check if there's a better path through XLM (Stellar's native asset)
      let xlmConversion = null;
      if (fromCurrency !== 'XLM' && toCurrency !== 'XLM') {
        const toXlm = await this.convertCurrency(amount, fromCurrency, 'XLM');
        const xlmToTarget = await this.convertCurrency(toXlm.convertedAmount, 'XLM', toCurrency);
        
        xlmConversion = {
          totalAmount: xlmToTarget.convertedAmount,
          path: [fromCurrency, 'XLM', toCurrency],
          intermediateAmount: toXlm.convertedAmount,
          totalRate: xlmToTarget.exchangeRate * toXlm.exchangeRate
        };
      }

      // Compare paths and return the best one
      if (xlmConversion && xlmConversion.totalAmount > directConversion.convertedAmount) {
        return {
          ...xlmConversion,
          recommended: 'xlm_path',
          directAmount: directConversion.convertedAmount
        };
      } else {
        return {
          totalAmount: directConversion.convertedAmount,
          path: [fromCurrency, toCurrency],
          recommended: 'direct',
          exchangeRate: directConversion.exchangeRate
        };
      }
    } catch (error) {
      throw new Error(`Failed to get optimal conversion path: ${error.message}`);
    }
  }

  // Helper method to get headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.anchorApiKey) {
      headers['Authorization'] = `Bearer ${this.anchorApiKey}`;
    }
    
    return headers;
  }
}

module.exports = new AnchorService();
