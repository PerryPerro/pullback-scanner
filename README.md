# 🇸🇪 Swedish Stock Pullback Trading Scanner

An automated TypeScript-based trading scanner that identifies pullback opportunities in Swedish stocks listed on NASDAQ Stockholm (OMX). Uses the Alpha Vantage API to fetch real-time data and applies professional technical analysis strategies.

## 🌟 Features

- **Automated Stock Scanning**: Monitors 8 major Swedish stocks on NASDAQ Stockholm
- **Pullback Strategy**: Implements proven pullback trading methodology from Moomoo
- **Technical Indicators**:
  - RSI (Relative Strength Index) - Identifies oversold/overbought conditions
  - ADX (Average Directional Index) - Measures trend strength
  - SMA (Simple Moving Averages) - 20 and 50 period
- **Candlestick Pattern Recognition**:
  - Bullish: Hammer, Bullish Engulfing, Morning Star
  - Bearish: Shooting Star, Bearish Engulfing, Evening Star
- **Fibonacci Retracement Levels**: Calculates key support/resistance levels
- **Volume Analysis**: Confirms signals with volume spikes
- **Confidence Scoring**: HIGH/MEDIUM/LOW ratings for each signal
- **Discord Integration**: Optional webhook notifications with rich embeds
- **Smart Rate Limiting**: Respects Alpha Vantage API limits
- **Error Handling**: Retry logic with exponential backoff

## 📊 Monitored Stocks

| Symbol | Company |
|--------|---------|
| VOLV.STO | Volvo B |
| ERIC-B.STO | Ericsson B |
| HM-B.STO | H&M B |
| SAND.STO | Sandvik |
| ABB.STO | ABB |
| ATCO-A.STO | Atlas Copco A |
| SEB-A.STO | SEB Bank A |
| SWED-A.STO | Swedbank A |

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Alpha Vantage API key (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/PerryPerro/pullback-scanner.git
cd pullback-scanner
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
DISCORD_WEBHOOK_URL=your_webhook_url_here  # Optional
```

4. **Build the project**
```bash
npm run build
```

5. **Run the scanner**
```bash
npm start
# or for development:
npm run dev
```

## 🔑 Getting API Keys

### Alpha Vantage API Key (Required)

1. Visit https://www.alphavantage.co/support/#api-key
2. Fill in your name and email
3. Click "GET FREE API KEY"
4. Copy the API key to your `.env` file

**Free Tier Limits:**
- 25 API requests per day
- 5 API requests per minute

### Discord Webhook (Optional)

1. Open Discord and go to Server Settings
2. Navigate to Integrations → Webhooks
3. Click "New Webhook"
4. Set a name (e.g., "Pullback Scanner")
5. Select a channel
6. Copy the webhook URL to your `.env` file

## 📖 How It Works

### Pullback Trading Strategy

Based on the [Moomoo pullback trading methodology](https://www.moomoo.com/my/learn/detail-pullback-trading-strategies-117054-240224136):

#### 1. **Detect Strong Trends**
- ADX > 25 (indicates strong trend)
- **Uptrend**: Price > SMA20 > SMA50
- **Downtrend**: Price < SMA20 < SMA50

#### 2. **Identify Pullbacks**
- **In Uptrend** (buying opportunity): RSI < 35
- **In Downtrend** (selling opportunity): RSI > 65
- Volume confirmation: Current volume > 1.5x average

#### 3. **Confirm with Patterns**
- Bullish patterns in uptrends
- Bearish patterns in downtrends
- Fibonacci retracement levels

#### 4. **Score Confidence**
- **HIGH**: Strong ADX (>30) + High volume (>2x) + Pattern + Fibonacci level
- **MEDIUM**: 2-3 confirmations
- **LOW**: 1-2 confirmations

#### 5. **Generate Signals**
- **BUY**: Uptrend + Bullish pattern + High confidence
- **SELL**: Downtrend + Bearish pattern + High confidence
- **WATCH**: Medium/Low confidence or mixed signals

## 🧪 Testing API Endpoints in Postman

### Alpha Vantage API Examples

You can test these endpoints directly in Postman or your browser (replace `YOUR_API_KEY`):

#### 1. Get Daily OHLCV for Volvo
```
GET https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=VOLV.STO&apikey=YOUR_API_KEY
```

#### 2. Get RSI Indicator
```
GET https://www.alphavantage.co/query?function=RSI&symbol=VOLV.STO&interval=daily&time_period=14&series_type=close&apikey=YOUR_API_KEY
```

#### 3. Get ADX (Trend Strength)
```
GET https://www.alphavantage.co/query?function=ADX&symbol=VOLV.STO&interval=daily&time_period=14&apikey=YOUR_API_KEY
```

#### 4. Get SMA (Simple Moving Average)
```
GET https://www.alphavantage.co/query?function=SMA&symbol=VOLV.STO&interval=daily&time_period=20&series_type=close&apikey=YOUR_API_KEY
```

#### 5. Test All Stocks
You can replace `VOLV.STO` with any of these symbols:
- `ERIC-B.STO`, `HM-B.STO`, `SAND.STO`, `ABB.STO`, `ATCO-A.STO`, `SEB-A.STO`, `SWED-A.STO`

## 📋 Example Output

```
═══════════════════════════════════════════════════════════════════════
🎯 BUY SIGNAL: Volvo B (VOLV.STO)
───────────────────────────────────────────────────────────────────────
📅 Date:            2025-12-14
💰 Price:           245.50 SEK
📊 Trend:           UPTREND
📈 RSI:             34.2
💪 ADX:             28.5
📊 Volume Ratio:    1.8x
🎨 Patterns:        Bullish Hammer
📐 Fibonacci:       Near 61.8% retracement
⭐⭐⭐ Confidence:  HIGH

📝 Reasons:
   1. Strong uptrend (ADX: 28.5)
   2. Oversold RSI (34.2) in uptrend - potential bounce
   3. Elevated volume (1.8x average)
   4. Bullish Hammer pattern detected
   5. Near 61.8% Fibonacci retracement (243.20)
═══════════════════════════════════════════════════════════════════════
```

## ⚙️ Configuration

### Strategy Settings

Edit `src/config/api-config.ts` to customize the strategy:

```typescript
export const STRATEGY_CONFIG = {
  ADX_THRESHOLD: 25,           // Minimum ADX for strong trend
  RSI_OVERSOLD: 35,            // RSI threshold for buy signals
  RSI_OVERBOUGHT: 65,          // RSI threshold for sell signals
  VOLUME_MULTIPLIER: 1.5,      // Minimum volume increase
  SMA_FAST: 20,                // Fast moving average period
  SMA_SLOW: 50,                // Slow moving average period
  FIBONACCI_LEVELS: [0.236, 0.382, 0.5, 0.618, 0.786],
  HIGH_CONFIDENCE_VOLUME: 2.0, // Volume for high confidence
  STRONG_ADX: 30,              // ADX for high confidence
  FIBONACCI_PROXIMITY: 2.0,    // % proximity to Fib level
};
```

### Adding More Stocks

Edit `src/config/api-config.ts`:

```typescript
export const SWEDISH_STOCKS: StockSymbol[] = [
  { symbol: 'VOLV.STO', name: 'Volvo B' },
  { symbol: 'YOUR-STOCK.STO', name: 'Your Company' },
  // Add more...
];
```

## 🤖 Automation

### Linux/Mac (Cron)

Run scanner daily at 9:00 AM:

```bash
crontab -e
```

Add this line:
```
0 9 * * 1-5 cd /path/to/pullback-scanner && npm start >> /var/log/scanner.log 2>&1
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 9:00 AM)
4. Action: Start a program
5. Program: `C:\Program Files\nodejs\node.exe`
6. Arguments: `dist/index.js`
7. Start in: `C:\path\to\pullback-scanner`

## 📂 Project Structure

```
pullback-scanner/
├── src/
│   ├── config/
│   │   └── api-config.ts          # API config & Swedish stocks
│   ├── services/
│   │   ├── alpha-vantage.service.ts   # Alpha Vantage API
│   │   └── technical-analysis.service.ts  # Technical indicators
│   ├── models/
│   │   └── stock.model.ts         # TypeScript interfaces
│   ├── strategies/
│   │   └── pullback-strategy.ts   # Pullback detection
│   ├── notifications/
│   │   └── discord-notifier.ts    # Discord webhooks
│   └── index.ts                   # Main entry point
├── dist/                          # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env                           # Your API keys (not committed)
├── .env.example                   # Template for .env
├── .gitignore
└── README.md
```

## 🛠️ Development

### Build TypeScript
```bash
npm run build
```

### Run in Development Mode
```bash
npm run dev
```

### Run Production Build
```bash
npm start
```

## 🐛 Troubleshooting

### "API Rate Limit Exceeded"
- **Cause**: Free tier allows 25 requests/day, 5 requests/minute
- **Solution**: Wait 24 hours or upgrade to premium plan
- The scanner implements 12-second delays between requests

### "No time series data found"
- **Cause**: Invalid stock symbol or API key
- **Solution**: Verify symbol format (must end with `.STO`) and check API key

### "ENOTFOUND" or Network Errors
- **Cause**: Internet connection or API service issues
- **Solution**: Check internet connection, try again later

### No Signals Detected
- **Cause**: Market conditions don't meet pullback criteria
- **Solution**: This is normal! Not every scan will find opportunities

### TypeScript Compilation Errors
- **Cause**: Missing dependencies
- **Solution**: Run `npm install` again

## 📈 Future Enhancements

- [ ] Web dashboard for viewing signals
- [ ] Database storage for historical signals
- [ ] Email notifications
- [ ] Support for Twelve Data API
- [ ] Historical backtesting
- [ ] CSV/JSON export
- [ ] More Nordic exchanges (Oslo, Copenhagen, Helsinki)
- [ ] Real-time WebSocket streaming
- [ ] Machine learning signal optimization

## 📜 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## ⚠️ Disclaimer

This software is for educational purposes only. It is not financial advice. Always do your own research and consult with a licensed financial advisor before making investment decisions. Trading stocks involves risk, and you can lose money.

## 📚 Resources

- [Pullback Trading Strategy Guide](https://www.moomoo.com/my/learn/detail-pullback-trading-strategies-117054-240224136)
- [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)
- [NASDAQ Stockholm](https://www.nasdaqomxnordic.com/)
- [Technical Analysis Basics](https://www.investopedia.com/terms/t/technicalanalysis.asp)

## 💬 Support

For questions or issues:
- Open an issue on GitHub
- Check the Troubleshooting section above
- Review Alpha Vantage API documentation

---

**Made with ❤️ for Swedish stock traders**
