/**
 * Discord Webhook Integration
 * Sends trading signals to Discord channels via webhook
 */

import axios from 'axios';
import { TradingSignal } from '../models/stock.model';

export class DiscordNotifier {
  private webhookUrl: string | undefined;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * Check if Discord notifications are enabled
   */
  isEnabled(): boolean {
    return !!this.webhookUrl && this.webhookUrl.trim() !== '';
  }

  /**
   * Send trading signal to Discord
   */
  async sendSignal(signal: TradingSignal): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const embed = this.createEmbed(signal);
      
      await axios.post(this.webhookUrl!, {
        username: 'Pullback Scanner',
        embeds: [embed],
      });
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error);
    }
  }

  /**
   * Send multiple signals in one message
   */
  async sendMultipleSignals(signals: TradingSignal[]): Promise<void> {
    if (!this.isEnabled() || signals.length === 0) {
      return;
    }

    try {
      const embeds = signals.slice(0, 10).map(signal => this.createEmbed(signal));
      
      await axios.post(this.webhookUrl!, {
        username: 'Pullback Scanner',
        content: `📊 **Pullback Scanner Report** - ${signals.length} signal(s) detected`,
        embeds: embeds,
      });
    } catch (error) {
      console.error('❌ Failed to send Discord notifications:', error);
    }
  }

  /**
   * Create Discord embed for a trading signal
   */
  private createEmbed(signal: TradingSignal): any {
    const color = this.getColorForAction(signal.action);
    const emoji = this.getEmojiForAction(signal.action);

    const fields = [
      {
        name: '📅 Date',
        value: signal.date,
        inline: true,
      },
      {
        name: '💰 Price',
        value: `${signal.price.toFixed(2)} SEK`,
        inline: true,
      },
      {
        name: '📊 Trend',
        value: signal.trend,
        inline: true,
      },
      {
        name: '📈 RSI',
        value: signal.indicators.rsi.toFixed(1),
        inline: true,
      },
      {
        name: '💪 ADX',
        value: signal.indicators.adx.toFixed(1),
        inline: true,
      },
      {
        name: '📊 Volume Ratio',
        value: `${signal.indicators.volumeRatio.toFixed(1)}x`,
        inline: true,
      },
    ];

    // Add patterns if detected
    if (signal.patterns.length > 0) {
      fields.push({
        name: '🎨 Patterns',
        value: signal.patterns.map(p => p.name).join(', '),
        inline: false,
      });
    }

    // Add Fibonacci level if near one
    if (signal.fibonacciLevel) {
      const fib = signal.fibonacciLevel;
      fields.push({
        name: '📐 Fibonacci',
        value: `${fib.level.toFixed(1)}% level at ${fib.price.toFixed(2)} SEK (${fib.distance.toFixed(1)}% away)`,
        inline: false,
      });
    }

    // Add confidence
    fields.push({
      name: '⭐ Confidence',
      value: signal.confidence,
      inline: true,
    });

    // Add reasons
    const reasonsText = signal.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n');

    return {
      title: `${emoji} ${signal.action} SIGNAL: ${signal.name} (${signal.symbol})`,
      color: color,
      fields: fields,
      description: `**Reasons:**\n${reasonsText}`,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Pullback Scanner by Alpha Vantage',
      },
    };
  }

  /**
   * Get color code for signal action
   */
  private getColorForAction(action: string): number {
    switch (action) {
      case 'BUY':
        return 0x00ff00; // Green
      case 'SELL':
        return 0xff0000; // Red
      case 'WATCH':
        return 0xffff00; // Yellow
      default:
        return 0x808080; // Gray
    }
  }

  /**
   * Get emoji for signal action
   */
  private getEmojiForAction(action: string): string {
    switch (action) {
      case 'BUY':
        return '🟢';
      case 'SELL':
        return '🔴';
      case 'WATCH':
        return '🟡';
      default:
        return '⚪';
    }
  }
}
