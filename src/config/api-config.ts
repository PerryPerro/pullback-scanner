/**
 * API Configuration and Strategy Settings
 */

import { StockSymbol } from '../models/stock.model';

// Swedish stocks to monitor on NASDAQ Stockholm (OMX)
export const SWEDISH_STOCKS: StockSymbol[] = [
  { symbol: 'VOLV.STO', name: 'Volvo B' },
  { symbol: 'ERIC-B.STO', name: 'Ericsson B' },
  { symbol: 'HM-B.STO', name: 'H&M B' },
  { symbol: 'SAND.STO', name: 'Sandvik' },
  { symbol: 'ABB.STO', name: 'ABB' },
  { symbol: 'ATCO-A.STO', name: 'Atlas Copco A' },
  { symbol: 'SEB-A.STO', name: 'SEB Bank A' },
  { symbol: 'SWED-A.STO', name: 'Swedbank A' },
];

// Pullback trading strategy configuration
export const STRATEGY_CONFIG = {
  // Trend strength threshold (ADX > 25 indicates strong trend)
  ADX_THRESHOLD: 25,
  
  // RSI thresholds for pullback detection
  RSI_OVERSOLD: 35,      // Buying opportunity in uptrend
  RSI_OVERBOUGHT: 65,    // Selling opportunity in downtrend
  
  // Volume confirmation multiplier
  VOLUME_MULTIPLIER: 1.5,
  
  // Moving average periods
  SMA_FAST: 20,
  SMA_SLOW: 50,
  
  // Fibonacci retracement levels
  FIBONACCI_LEVELS: [0.236, 0.382, 0.5, 0.618, 0.786],
  
  // High confidence volume multiplier
  HIGH_CONFIDENCE_VOLUME: 2.0,
  
  // Strong ADX threshold for high confidence
  STRONG_ADX: 30,
  
  // Fibonacci proximity threshold (%)
  FIBONACCI_PROXIMITY: 2.0,
};

// Alpha Vantage API configuration
export const API_CONFIG = {
  BASE_URL: 'https://www.alphavantage.co/query',
  
  // Rate limiting (free tier: 25 requests/day, 5 requests/minute)
  RATE_LIMIT_DELAY_MS: 12000, // 12 seconds between requests
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
};
