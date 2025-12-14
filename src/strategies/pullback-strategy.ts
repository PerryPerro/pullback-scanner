/**
 * Pullback Trading Strategy Implementation
 * Based on Moomoo pullback trading methodology
 */

import {
  OHLCVData,
  TradingSignal,
  TrendDirection,
  SignalAction,
  ConfidenceLevel,
  TechnicalIndicators,
  CandlestickPattern,
  FibonacciLevel,
  StockSymbol,
} from '../models/stock.model';
import { STRATEGY_CONFIG } from '../config/api-config';
import { TechnicalAnalysisService } from '../services/technical-analysis.service';

export class PullbackStrategy {
  private technicalAnalysis: TechnicalAnalysisService;

  constructor() {
    this.technicalAnalysis = new TechnicalAnalysisService();
  }

  /**
   * Analyze stock and generate trading signal
   */
  analyze(
    stock: StockSymbol,
    ohlcv: OHLCVData[],
    rsi: Map<string, number>,
    adx: Map<string, number>,
    sma20: Map<string, number>,
    sma50: Map<string, number>
  ): TradingSignal | null {
    if (ohlcv.length === 0) return null;

    const latestData = ohlcv[0];
    const date = latestData.date;
    const price = latestData.close;

    // Get technical indicators
    const rsiValue = rsi.get(date);
    const adxValue = adx.get(date);
    const sma20Value = sma20.get(date);
    const sma50Value = sma50.get(date);

    // Require all indicators to be available
    if (!rsiValue || !adxValue || !sma20Value || !sma50Value) {
      return null;
    }

    // Calculate volume ratio
    const avgVolume = this.technicalAnalysis.calculateAverageVolume(ohlcv, 20);
    const volumeRatio = latestData.volume / avgVolume;

    const indicators: TechnicalIndicators = {
      rsi: rsiValue,
      adx: adxValue,
      sma20: sma20Value,
      sma50: sma50Value,
      volumeRatio: volumeRatio,
    };

    // Determine trend direction
    const trend = this.determineTrend(price, sma20Value, sma50Value);

    // Check if trend is strong enough
    if (adxValue < STRATEGY_CONFIG.ADX_THRESHOLD) {
      // Weak trend, not suitable for pullback strategy
      return null;
    }

    // Detect pullback conditions
    const isPullback = this.detectPullback(trend, rsiValue, volumeRatio);
    if (!isPullback) {
      return null;
    }

    // Detect candlestick patterns
    const patterns = this.technicalAnalysis.detectCandlestickPatterns(ohlcv);

    // Calculate Fibonacci levels
    const fibLevels = this.technicalAnalysis.calculateFibonacciLevels(ohlcv);
    const closestFib = this.technicalAnalysis.findClosestFibonacciLevel(fibLevels);
    const nearFib = closestFib && this.technicalAnalysis.isNearFibonacciLevel(closestFib);

    // Determine signal action
    const action = this.determineAction(trend, patterns);

    // Calculate confidence level
    const confidence = this.calculateConfidence(
      adxValue,
      volumeRatio,
      patterns,
      nearFib || false
    );

    // Build reasons list
    const reasons = this.buildReasons(
      trend,
      rsiValue,
      adxValue,
      volumeRatio,
      patterns,
      closestFib,
      nearFib || false
    );

    const signal: TradingSignal = {
      symbol: stock.symbol,
      name: stock.name,
      date,
      price,
      action,
      trend,
      indicators,
      patterns,
      fibonacciLevel: closestFib,
      confidence,
      reasons,
    };

    return signal;
  }

  /**
   * Determine trend direction based on price and moving averages
   */
  private determineTrend(price: number, sma20: number, sma50: number): TrendDirection {
    // Uptrend: Price > SMA20 > SMA50
    if (price > sma20 && sma20 > sma50) {
      return 'UPTREND';
    }
    
    // Downtrend: Price < SMA20 < SMA50
    if (price < sma20 && sma20 < sma50) {
      return 'DOWNTREND';
    }
    
    return 'SIDEWAYS';
  }

  /**
   * Detect if current conditions represent a pullback
   */
  private detectPullback(trend: TrendDirection, rsi: number, volumeRatio: number): boolean {
    // In uptrend, look for oversold RSI (buying opportunity)
    if (trend === 'UPTREND' && rsi < STRATEGY_CONFIG.RSI_OVERSOLD) {
      return volumeRatio >= STRATEGY_CONFIG.VOLUME_MULTIPLIER;
    }

    // In downtrend, look for overbought RSI (selling opportunity)
    if (trend === 'DOWNTREND' && rsi > STRATEGY_CONFIG.RSI_OVERBOUGHT) {
      return volumeRatio >= STRATEGY_CONFIG.VOLUME_MULTIPLIER;
    }

    return false;
  }

  /**
   * Determine trading action based on trend and patterns
   */
  private determineAction(trend: TrendDirection, patterns: CandlestickPattern[]): SignalAction {
    const hasBullishPattern = patterns.some(p => p.type === 'bullish');
    const hasBearishPattern = patterns.some(p => p.type === 'bearish');

    // BUY: Uptrend with bullish pattern
    if (trend === 'UPTREND' && hasBullishPattern) {
      return 'BUY';
    }

    // SELL: Downtrend with bearish pattern
    if (trend === 'DOWNTREND' && hasBearishPattern) {
      return 'SELL';
    }

    // WATCH: Pullback detected but no confirming pattern
    return 'WATCH';
  }

  /**
   * Calculate confidence level based on multiple factors
   */
  private calculateConfidence(
    adx: number,
    volumeRatio: number,
    patterns: CandlestickPattern[],
    nearFib: boolean
  ): ConfidenceLevel {
    let score = 0;

    // Strong ADX (30+)
    if (adx >= STRATEGY_CONFIG.STRONG_ADX) {
      score += 2;
    } else if (adx >= STRATEGY_CONFIG.ADX_THRESHOLD) {
      score += 1;
    }

    // High volume (2x+)
    if (volumeRatio >= STRATEGY_CONFIG.HIGH_CONFIDENCE_VOLUME) {
      score += 2;
    } else if (volumeRatio >= STRATEGY_CONFIG.VOLUME_MULTIPLIER) {
      score += 1;
    }

    // Candlestick pattern detected
    if (patterns.length > 0) {
      const maxConfidence = Math.max(...patterns.map(p => p.confidence));
      score += maxConfidence >= 0.8 ? 2 : 1;
    }

    // Near Fibonacci level
    if (nearFib) {
      score += 1;
    }

    // Determine confidence level
    if (score >= 6) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Build list of reasons for the signal
   */
  private buildReasons(
    trend: TrendDirection,
    rsi: number,
    adx: number,
    volumeRatio: number,
    patterns: CandlestickPattern[],
    fibLevel: FibonacciLevel | undefined,
    nearFib: boolean
  ): string[] {
    const reasons: string[] = [];

    // Trend
    reasons.push(`Strong ${trend.toLowerCase()} (ADX: ${adx.toFixed(1)})`);

    // RSI pullback
    if (trend === 'UPTREND') {
      reasons.push(`Oversold RSI (${rsi.toFixed(1)}) in uptrend - potential bounce`);
    } else if (trend === 'DOWNTREND') {
      reasons.push(`Overbought RSI (${rsi.toFixed(1)}) in downtrend - potential drop`);
    }

    // Volume
    if (volumeRatio >= STRATEGY_CONFIG.HIGH_CONFIDENCE_VOLUME) {
      reasons.push(`Very high volume (${volumeRatio.toFixed(1)}x average)`);
    } else if (volumeRatio >= STRATEGY_CONFIG.VOLUME_MULTIPLIER) {
      reasons.push(`Elevated volume (${volumeRatio.toFixed(1)}x average)`);
    }

    // Patterns
    patterns.forEach(pattern => {
      reasons.push(`${pattern.name} pattern detected`);
    });

    // Fibonacci
    if (nearFib && fibLevel) {
      reasons.push(`Near ${fibLevel.level.toFixed(1)}% Fibonacci retracement (${fibLevel.price.toFixed(2)})`);
    } else if (fibLevel) {
      reasons.push(`Closest Fib level: ${fibLevel.level.toFixed(1)}% (${fibLevel.distance.toFixed(1)}% away)`);
    }

    return reasons;
  }

  /**
   * Filter signals by confidence level
   */
  filterByConfidence(signals: TradingSignal[], minConfidence: ConfidenceLevel): TradingSignal[] {
    const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const minLevel = confidenceOrder[minConfidence];

    return signals.filter(signal => confidenceOrder[signal.confidence] >= minLevel);
  }

  /**
   * Sort signals by confidence and action priority
   */
  sortSignals(signals: TradingSignal[]): TradingSignal[] {
    const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const actionOrder = { BUY: 3, SELL: 2, WATCH: 1 };

    return signals.sort((a, b) => {
      const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (confDiff !== 0) return confDiff;
      
      return actionOrder[b.action] - actionOrder[a.action];
    });
  }
}
