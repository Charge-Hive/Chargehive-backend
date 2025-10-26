import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  private flowPriceCache = {
    price: null as number | null,
    lastUpdated: null as number | null,
    cacheDuration: 60000, // 1 minute cache
  };

  /**
   * Fetches the current Flow token price in USD
   * Uses CoinGecko API with 1-minute caching
   */
  async getFlowPriceInUSD(): Promise<number> {
    // Check cache first
    if (this.isCacheValid()) {
      this.logger.debug(`Using cached Flow price: $${this.flowPriceCache.price}`);
      return this.flowPriceCache.price;
    }

    // Fetch from CoinGecko API
    try {
      this.logger.log('Fetching Flow price from CoinGecko API...');
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=flow&vs_currencies=usd',
        {
          timeout: 5000, // 5 second timeout
        }
      );

      const price = response.data.flow?.usd;

      if (!price || typeof price !== 'number') {
        throw new Error('Invalid price data received from API');
      }

      // Update cache
      this.flowPriceCache.price = price;
      this.flowPriceCache.lastUpdated = Date.now();

      this.logger.log(`Flow price updated: $${price}`);
      return price;

    } catch (error) {
      this.logger.error('Failed to fetch Flow price from CoinGecko', error.message);

      // Fallback to cached price if API fails
      if (this.flowPriceCache.price) {
        this.logger.warn('Using stale cached Flow price due to API error');
        return this.flowPriceCache.price;
      }

      throw new Error('Unable to fetch Flow token price. Please try again later.');
    }
  }

  /**
   * Calculates the amount of Flow tokens needed for a given USD amount
   */
  calculateFlowAmount(amountUSD: number, flowPriceUSD: number): number {
    if (flowPriceUSD <= 0) {
      throw new Error('Flow price must be greater than 0');
    }

    const flowAmount = amountUSD / flowPriceUSD;

    // Round to 8 decimal places (standard for crypto)
    return Math.round(flowAmount * 100000000) / 100000000;
  }

  /**
   * Checks if the cached price is still valid
   */
  private isCacheValid(): boolean {
    if (!this.flowPriceCache.price || !this.flowPriceCache.lastUpdated) {
      return false;
    }

    const cacheAge = Date.now() - this.flowPriceCache.lastUpdated;
    return cacheAge < this.flowPriceCache.cacheDuration;
  }

  /**
   * Forces a price refresh (used for testing or manual refresh)
   */
  async refreshPrice(): Promise<number> {
    this.flowPriceCache.price = null;
    this.flowPriceCache.lastUpdated = null;
    return this.getFlowPriceInUSD();
  }
}
