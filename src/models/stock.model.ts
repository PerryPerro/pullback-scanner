/**
 * TypeScript interfaces for stock data and trading signals
 */

export interface StockSymbol {
  symbol: string;
  name: string;
}

export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  adx: number;
  sma20: number;
  sma50: number;
  volumeRatio: number;
}

export interface CandlestickPattern {
  name: string;
  type: 'bullish' | 'bearish';
  confidence: number;
}

export interface FibonacciLevel {
  level: number;
  price: number;
  distance: number; // Distance from current price
}

export type TrendDirection = 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
export type SignalAction = 'BUY' | 'SELL' | 'WATCH';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TradingSignal {
  symbol: string;
  name: string;
  date: string;
  price: number;
  action: SignalAction;
  trend: TrendDirection;
  indicators: TechnicalIndicators;
  patterns: CandlestickPattern[];
  fibonacciLevel?: FibonacciLevel;
  confidence: ConfidenceLevel;
  reasons: string[];
}

export interface AlphaVantageResponse {
  'Meta Data'?: any;
  'Time Series (Daily)'?: { [key: string]: any };
  'Technical Analysis: RSI'?: { [key: string]: any };
  'Technical Analysis: ADX'?: { [key: string]: any };
  'Technical Analysis: SMA'?: { [key: string]: any };
  Note?: string;
  Information?: string;
  'Error Message'?: string;
}

export interface TimeSeriesEntry {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
  '5. volume': string;
}

export interface RSIEntry {
  'RSI': string;
}

export interface ADXEntry {
  'ADX': string;
}

export interface SMAEntry {
  'SMA': string;
}
