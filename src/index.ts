/**
 * Swedish Stock Pullback Trading Scanner
 * Main entry point
 */

import * as dotenv from 'dotenv';
import { AlphaVantageService } from './services/alpha-vantage.service';
import { PullbackStrategy } from './strategies/pullback-strategy';
import { DiscordNotifier } from './notifications/discord-notifier';
import { SWEDISH_STOCKS } from './config/api-config';
import { TradingSignal } from './models/stock.model';

// Load environment variables
dotenv.config();

/**
 * Main scanner function
 */
async function runScanner(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🇸🇪 Swedish Stock Pullback Trading Scanner');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log();

  // Validate API key
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('❌ ERROR: ALPHA_VANTAGE_API_KEY not set in .env file');
    console.error('Please get a free API key from: https://www.alphavantage.co/support/#api-key');
    process.exit(1);
  }

  // Initialize services
  const alphaVantage = new AlphaVantageService(apiKey);
  const strategy = new PullbackStrategy();
  const discord = new DiscordNotifier(process.env.DISCORD_WEBHOOK_URL);

  if (discord.isEnabled()) {
    console.log('✅ Discord notifications enabled');
  } else {
    console.log('ℹ️  Discord notifications disabled (no webhook URL)');
  }
  console.log();

  const signals: TradingSignal[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Scan each stock
  for (let i = 0; i < SWEDISH_STOCKS.length; i++) {
    const stock = SWEDISH_STOCKS[i];
    console.log(`[${i + 1}/${SWEDISH_STOCKS.length}] Analyzing ${stock.name} (${stock.symbol})...`);

    try {
      // Fetch all indicators
      const data = await alphaVantage.getAllIndicators(stock.symbol);

      // Analyze for pullback opportunities
      const signal = strategy.analyze(
        stock,
        data.ohlcv,
        data.rsi,
        data.adx,
        data.sma20,
        data.sma50
      );

      if (signal) {
        signals.push(signal);
        console.log(`   ✅ Signal detected: ${signal.action} (${signal.confidence})`);
      } else {
        console.log('   ℹ️  No pullback opportunity detected');
      }

      successCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;
    }

    console.log();
  }

  // Display results
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📊 SCAN SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`Stocks analyzed:     ${successCount}/${SWEDISH_STOCKS.length}`);
  console.log(`Errors encountered:  ${errorCount}`);
  console.log(`Signals found:       ${signals.length}`);
  console.log();

  if (signals.length === 0) {
    console.log('No trading opportunities found at this time.');
    console.log('═══════════════════════════════════════════════════════════════════════');
    return;
  }

  // Sort signals by confidence and action
  const sortedSignals = strategy.sortSignals(signals);

  // Display each signal
  for (const signal of sortedSignals) {
    printSignal(signal);
  }

  // Send to Discord if enabled
  if (discord.isEnabled()) {
    console.log('📤 Sending signals to Discord...');
    try {
      await discord.sendMultipleSignals(sortedSignals);
      console.log('✅ Discord notifications sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Discord notifications');
    }
    console.log('═══════════════════════════════════════════════════════════════════════');
  }
}

/**
 * Print a trading signal to console with formatting
 */
function printSignal(signal: TradingSignal): void {
  const emoji = getActionEmoji(signal.action);
  const confidenceStars = '⭐'.repeat(signal.confidence === 'HIGH' ? 3 : signal.confidence === 'MEDIUM' ? 2 : 1);

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`${emoji} ${signal.action} SIGNAL: ${signal.name} (${signal.symbol})`);
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log(`📅 Date:            ${signal.date}`);
  console.log(`💰 Price:           ${signal.price.toFixed(2)} SEK`);
  console.log(`📊 Trend:           ${signal.trend}`);
  console.log(`📈 RSI:             ${signal.indicators.rsi.toFixed(1)}`);
  console.log(`💪 ADX:             ${signal.indicators.adx.toFixed(1)}`);
  console.log(`📊 Volume Ratio:    ${signal.indicators.volumeRatio.toFixed(1)}x`);

  if (signal.patterns.length > 0) {
    console.log(`🎨 Patterns:        ${signal.patterns.map(p => p.name).join(', ')}`);
  }

  if (signal.fibonacciLevel) {
    const fib = signal.fibonacciLevel;
    console.log(`📐 Fibonacci:       Near ${fib.level.toFixed(1)}% retracement (${fib.price.toFixed(2)} SEK)`);
  }

  console.log(`${confidenceStars} Confidence:       ${signal.confidence}`);
  console.log();
  console.log('📝 Reasons:');
  signal.reasons.forEach((reason, i) => {
    console.log(`   ${i + 1}. ${reason}`);
  });
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log();
}

/**
 * Get emoji for action type
 */
function getActionEmoji(action: string): string {
  switch (action) {
    case 'BUY':
      return '🎯';
    case 'SELL':
      return '⚠️';
    case 'WATCH':
      return '👀';
    default:
      return '📊';
  }
}

/**
 * Handle errors and exit gracefully
 */
process.on('unhandledRejection', (error: Error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the scanner
runScanner()
  .then(() => {
    console.log('✅ Scanner completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Scanner failed:', error.message);
    process.exit(1);
  });
