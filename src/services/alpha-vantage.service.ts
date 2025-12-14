/**
 * Alpha Vantage API Integration Service
 * Handles all API calls to fetch stock data and technical indicators
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api-config';
import { AlphaVantageResponse, OHLCVData } from '../models/stock.model';

export class AlphaVantageService {
  private apiKey: string;
  private lastRequestTime: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Enforce rate limiting between API requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < API_CONFIG.RATE_LIMIT_DELAY_MS) {
      const waitTime = API_CONFIG.RATE_LIMIT_DELAY_MS - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${(waitTime / 1000).toFixed(1)}s...`);
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep utility for rate limiting and retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest(params: Record<string, string>, retries: number = 0): Promise<any> {
    try {
      await this.enforceRateLimit();
      
      const response = await axios.get(API_CONFIG.BASE_URL, {
        params: { ...params, apikey: this.apiKey },
        timeout: 30000,
      });

      // Check for API errors
      if (response.data['Error Message']) {
        throw new Error(`API Error: ${response.data['Error Message']}`);
      }

      if (response.data['Note']) {
        throw new Error(`API Rate Limit: ${response.data['Note']}`);
      }

      if (response.data['Information']) {
        throw new Error(`API Info: ${response.data['Information']}`);
      }

      return response.data;
    } catch (error) {
      if (retries < API_CONFIG.MAX_RETRIES) {
        console.log(`⚠️  Request failed, retrying (${retries + 1}/${API_CONFIG.MAX_RETRIES})...`);
        await this.sleep(API_CONFIG.RETRY_DELAY_MS * (retries + 1));
        return this.makeRequest(params, retries + 1);
      }
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(`API Request Failed: ${axiosError.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Fetch daily OHLCV data
   */
  async getDailyData(symbol: string): Promise<OHLCVData[]> {
    const data = await this.makeRequest({
      function: 'TIME_SERIES_DAILY',
      symbol: symbol,
      outputsize: 'compact', // Last 100 data points
    });

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error(`No time series data found for ${symbol}`);
    }

    const ohlcvData: OHLCVData[] = [];
    for (const [date, values] of Object.entries(timeSeries)) {
      const entry: any = values;
      ohlcvData.push({
        date,
        open: parseFloat(entry['1. open']),
        high: parseFloat(entry['2. high']),
        low: parseFloat(entry['3. low']),
        close: parseFloat(entry['4. close']),
        volume: parseInt(entry['5. volume']),
      });
    }

    // Sort by date descending (most recent first)
    return ohlcvData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Fetch RSI indicator
   */
  async getRSI(symbol: string, timePeriod: number = 14): Promise<Map<string, number>> {
    const data = await this.makeRequest({
      function: 'RSI',
      symbol: symbol,
      interval: 'daily',
      time_period: timePeriod.toString(),
      series_type: 'close',
    });

    const technicalAnalysis = data['Technical Analysis: RSI'];
    if (!technicalAnalysis) {
      throw new Error(`No RSI data found for ${symbol}`);
    }

    const rsiMap = new Map<string, number>();
    for (const [date, values] of Object.entries(technicalAnalysis)) {
      const entry: any = values;
      rsiMap.set(date, parseFloat(entry['RSI']));
    }

    return rsiMap;
  }

  /**
   * Fetch ADX indicator (trend strength)
   */
  async getADX(symbol: string, timePeriod: number = 14): Promise<Map<string, number>> {
    const data = await this.makeRequest({
      function: 'ADX',
      symbol: symbol,
      interval: 'daily',
      time_period: timePeriod.toString(),
    });

    const technicalAnalysis = data['Technical Analysis: ADX'];
    if (!technicalAnalysis) {
      throw new Error(`No ADX data found for ${symbol}`);
    }

    const adxMap = new Map<string, number>();
    for (const [date, values] of Object.entries(technicalAnalysis)) {
      const entry: any = values;
      adxMap.set(date, parseFloat(entry['ADX']));
    }

    return adxMap;
  }

  /**
   * Fetch SMA indicator
   */
  async getSMA(symbol: string, timePeriod: number): Promise<Map<string, number>> {
    const data = await this.makeRequest({
      function: 'SMA',
      symbol: symbol,
      interval: 'daily',
      time_period: timePeriod.toString(),
      series_type: 'close',
    });

    const technicalAnalysis = data['Technical Analysis: SMA'];
    if (!technicalAnalysis) {
      throw new Error(`No SMA data found for ${symbol}`);
    }

    const smaMap = new Map<string, number>();
    for (const [date, values] of Object.entries(technicalAnalysis)) {
      const entry: any = values;
      smaMap.set(date, parseFloat(entry['SMA']));
    }

    return smaMap;
  }

  /**
   * Fetch all indicators for a stock in one go
   */
  async getAllIndicators(symbol: string): Promise<{
    ohlcv: OHLCVData[];
    rsi: Map<string, number>;
    adx: Map<string, number>;
    sma20: Map<string, number>;
    sma50: Map<string, number>;
  }> {
    console.log(`📊 Fetching data for ${symbol}...`);
    
    const ohlcv = await this.getDailyData(symbol);
    const rsi = await this.getRSI(symbol, 14);
    const adx = await this.getADX(symbol, 14);
    const sma20 = await this.getSMA(symbol, 20);
    const sma50 = await this.getSMA(symbol, 50);

    return { ohlcv, rsi, adx, sma20, sma50 };
  }
}
