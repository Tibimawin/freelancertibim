import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface CryptoChargeRequest {
  amount: number;
  currency: string;
}

export interface CryptoChargeResponse {
  chargeId: string;
  hosted_url: string;
  amount: number;
  currency: string;
}

export class CryptoService {
  static async createCharge(request: CryptoChargeRequest): Promise<CryptoChargeResponse> {
    const createCryptoCharge = httpsCallable(functions, 'createCryptoCharge');
    
    try {
      const result = await createCryptoCharge(request);
      return result.data as CryptoChargeResponse;
    } catch (error: any) {
      console.error('Erro ao criar charge cripto:', error);
      throw new Error(error.message || 'Erro ao criar pagamento cripto');
    }
  }

  static getExchangeRates(): { [key: string]: number } {
    return {
      'USDC': 5.20,
      'USDT': 5.20,
      'ETH': 13000.00,
      'BTC': 350000.00,
      'USD': 5.20
    };
  }

  static convertToReais(amount: number, currency: string): number {
    const rates = this.getExchangeRates();
    return amount * (rates[currency] || rates['USD']);
  }

  static getSupportedCurrencies() {
    return [
      { value: 'USDC', label: 'USD Coin (USDC)', symbol: '$' },
      { value: 'USDT', label: 'Tether (USDT)', symbol: '$' },
      { value: 'ETH', label: 'Ethereum (ETH)', symbol: 'Ξ' },
      { value: 'BTC', label: 'Bitcoin (BTC)', symbol: '₿' },
    ];
  }
}