/**
 * Technical Analysis Service
 * Implements candlestick pattern recognition and Fibonacci calculations
 */

import { OHLCVData, CandlestickPattern, FibonacciLevel } from '../models/stock.model';
import { STRATEGY_CONFIG } from '../config/api-config';

export class TechnicalAnalysisService {
  // Candlestick pattern thresholds
  private readonly HAMMER_BODY_RATIO = 0.3;
  private readonly HAMMER_SHADOW_RATIO = 2.0;
  private readonly HAMMER_UPPER_SHADOW_RATIO = 0.5;
  private readonly STAR_BODY_RATIO = 0.5;
  private readonly PATTERN_HIGH_CONFIDENCE = 0.8;

  /**
   * Calculate average volume over specified period
   */
  calculateAverageVolume(data: OHLCVData[], period: number = 20): number {
    if (data.length < period) {
      return data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    }
    
    const recentData = data.slice(0, period);
    return recentData.reduce((sum, d) => sum + d.volume, 0) / period;
  }

  /**
   * Detect candlestick patterns
   */
  detectCandlestickPatterns(data: OHLCVData[]): CandlestickPattern[] {
    if (data.length < 3) return [];

    const patterns: CandlestickPattern[] = [];
    const current = data[0];
    const previous = data[1];
    const beforePrevious = data[2];

    // Bullish Hammer
    if (this.isBullishHammer(current)) {
      patterns.push({
        name: 'Bullish Hammer',
        type: 'bullish',
        confidence: 0.75,
      });
    }

    // Bullish Engulfing
    if (this.isBullishEngulfing(current, previous)) {
      patterns.push({
        name: 'Bullish Engulfing',
        type: 'bullish',
        confidence: 0.8,
      });
    }

    // Morning Star
    if (this.isMorningStar(current, previous, beforePrevious)) {
      patterns.push({
        name: 'Morning Star',
        type: 'bullish',
        confidence: 0.85,
      });
    }

    // Shooting Star
    if (this.isShootingStar(current)) {
      patterns.push({
        name: 'Shooting Star',
        type: 'bearish',
        confidence: 0.75,
      });
    }

    // Bearish Engulfing
    if (this.isBearishEngulfing(current, previous)) {
      patterns.push({
        name: 'Bearish Engulfing',
        type: 'bearish',
        confidence: 0.8,
      });
    }

    // Evening Star
    if (this.isEveningStar(current, previous, beforePrevious)) {
      patterns.push({
        name: 'Evening Star',
        type: 'bearish',
        confidence: 0.85,
      });
    }

    return patterns;
  }

  /**
   * Bullish Hammer Pattern:
   * - Small body at upper end
   * - Long lower shadow (at least 2x body)
   * - Little or no upper shadow
   */
  private isBullishHammer(candle: OHLCVData): boolean {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const totalRange = candle.high - candle.low;

    return (
      lowerShadow >= body * this.HAMMER_SHADOW_RATIO &&
      upperShadow <= body * this.HAMMER_UPPER_SHADOW_RATIO &&
      body / totalRange < this.HAMMER_BODY_RATIO
    );
  }

  /**
   * Shooting Star Pattern:
   * - Small body at lower end
   * - Long upper shadow (at least 2x body)
   * - Little or no lower shadow
   */
  private isShootingStar(candle: OHLCVData): boolean {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const totalRange = candle.high - candle.low;

    return (
      upperShadow >= body * this.HAMMER_SHADOW_RATIO &&
      lowerShadow <= body * this.HAMMER_UPPER_SHADOW_RATIO &&
      body / totalRange < this.HAMMER_BODY_RATIO
    );
  }

  /**
   * Bullish Engulfing Pattern:
   * - Previous candle is bearish (red)
   * - Current candle is bullish (green) and completely engulfs previous body
   */
  private isBullishEngulfing(current: OHLCVData, previous: OHLCVData): boolean {
    const currentBullish = current.close > current.open;
    const previousBearish = previous.close < previous.open;

    return (
      currentBullish &&
      previousBearish &&
      current.open < previous.close &&
      current.close > previous.open
    );
  }

  /**
   * Bearish Engulfing Pattern:
   * - Previous candle is bullish (green)
   * - Current candle is bearish (red) and completely engulfs previous body
   */
  private isBearishEngulfing(current: OHLCVData, previous: OHLCVData): boolean {
    const currentBearish = current.close < current.open;
    const previousBullish = previous.close > previous.open;

    return (
      currentBearish &&
      previousBullish &&
      current.open > previous.close &&
      current.close < previous.open
    );
  }

  /**
   * Morning Star Pattern (bullish):
   * - First candle: bearish
   * - Second candle: small body (star)
   * - Third candle: bullish, closes above midpoint of first candle
   */
  private isMorningStar(current: OHLCVData, middle: OHLCVData, first: OHLCVData): boolean {
    const firstBearish = first.close < first.open;
    const currentBullish = current.close > current.open;
    const middleSmall = Math.abs(middle.close - middle.open) < Math.abs(first.close - first.open) * this.STAR_BODY_RATIO;
    // Gap down: middle's high is below first candle's close/open
    const gapDown = middle.high < Math.min(first.open, first.close);
    // Gap up: current's low is above middle's close/open
    const gapUp = current.low > Math.max(middle.open, middle.close);
    const currentClosesHigh = current.close > (first.open + first.close) / 2;

    // Relaxed gap requirement - either gap down or gap up, or just small middle and closes high
    return firstBearish && currentBullish && middleSmall && currentClosesHigh;
  }

  /**
   * Evening Star Pattern (bearish):
   * - First candle: bullish
   * - Second candle: small body (star)
   * - Third candle: bearish, closes below midpoint of first candle
   */
  private isEveningStar(current: OHLCVData, middle: OHLCVData, first: OHLCVData): boolean {
    const firstBullish = first.close > first.open;
    const currentBearish = current.close < current.open;
    const middleSmall = Math.abs(middle.close - middle.open) < Math.abs(first.close - first.open) * this.STAR_BODY_RATIO;
    // Gap up: middle's low is above first candle's close/open
    const gapUp = middle.low > Math.max(first.open, first.close);
    // Gap down: current's high is below middle's close/open
    const gapDown = current.high < Math.min(middle.open, middle.close);
    const currentClosesLow = current.close < (first.open + first.close) / 2;

    // Relaxed gap requirement - either gap up or gap down, or just small middle and closes low
    return firstBullish && currentBearish && middleSmall && currentClosesLow;
  }

  /**
   * Calculate Fibonacci retracement levels
   * Finds recent swing high and low, then calculates retracement levels
   */
  calculateFibonacciLevels(data: OHLCVData[], lookback: number = 50): FibonacciLevel[] {
    if (data.length < lookback) {
      lookback = data.length;
    }

    const recentData = data.slice(0, lookback);
    
    // Find swing high and low
    const swingHigh = Math.max(...recentData.map(d => d.high));
    const swingLow = Math.min(...recentData.map(d => d.low));
    const range = swingHigh - swingLow;

    const currentPrice = data[0].close;
    const fibLevels: FibonacciLevel[] = [];

    for (const level of STRATEGY_CONFIG.FIBONACCI_LEVELS) {
      const price = swingHigh - (range * level);
      const distance = Math.abs(((currentPrice - price) / price) * 100);
      
      fibLevels.push({
        level: level * 100, // Convert to percentage
        price: price,
        distance: distance,
      });
    }

    return fibLevels;
  }

  /**
   * Find the closest Fibonacci level to current price
   */
  findClosestFibonacciLevel(fibLevels: FibonacciLevel[]): FibonacciLevel | undefined {
    if (fibLevels.length === 0) return undefined;
    
    return fibLevels.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
  }

  /**
   * Check if price is near a Fibonacci level (within proximity threshold)
   */
  isNearFibonacciLevel(fibLevel: FibonacciLevel): boolean {
    return fibLevel.distance <= STRATEGY_CONFIG.FIBONACCI_PROXIMITY;
  }

  /**
   * Identify support and resistance zones
   * Finds price levels where multiple touches occurred
   */
  findSupportResistance(data: OHLCVData[], lookback: number = 50): {
    support: number[];
    resistance: number[];
  } {
    if (data.length < lookback) {
      lookback = data.length;
    }

    const recentData = data.slice(0, lookback);
    const tolerance = 0.02; // 2% tolerance for level grouping
    
    // Find local lows (support) and highs (resistance)
    const lows: number[] = [];
    const highs: number[] = [];

    for (let i = 1; i < recentData.length - 1; i++) {
      const current = recentData[i];
      const prev = recentData[i - 1];
      const next = recentData[i + 1];

      // Local low
      if (current.low < prev.low && current.low < next.low) {
        lows.push(current.low);
      }

      // Local high
      if (current.high > prev.high && current.high > next.high) {
        highs.push(current.high);
      }
    }

    // Group similar levels
    const support = this.groupPriceLevels(lows, tolerance);
    const resistance = this.groupPriceLevels(highs, tolerance);

    return { support, resistance };
  }

  /**
   * Group similar price levels together
   */
  private groupPriceLevels(levels: number[], tolerance: number): number[] {
    if (levels.length === 0) return [];

    const sorted = [...levels].sort((a, b) => a - b);
    const grouped: number[] = [];
    let currentGroup = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const groupAvg = currentGroup.reduce((sum, val) => sum + val, 0) / currentGroup.length;

      if (Math.abs((current - groupAvg) / groupAvg) <= tolerance) {
        currentGroup.push(current);
      } else {
        grouped.push(groupAvg);
        currentGroup = [current];
      }
    }

    if (currentGroup.length > 0) {
      grouped.push(currentGroup.reduce((sum, val) => sum + val, 0) / currentGroup.length);
    }

    return grouped;
  }
}
