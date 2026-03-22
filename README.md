# FinanceAI - Comprehensive Financial Management App

A production-ready financial management mobile app with AI-powered analysis, Kondratiev Wave economic positioning, and comprehensive expense tracking.

## Tech Stack

**Frontend**: React Native (Expo) + TypeScript + Zustand
**Backend**: Node.js + Express + TypeScript + lowdb

## Features

- **Dashboard**: Net worth, income vs expenses, budget tracking, economic indicators
- **Expense Tracking**: Receipt scanning with OCR, category breakdown, filtering
- **Income Management**: Multiple sources, profession benchmarks, recurring tracking
- **Investment Portfolio**: Holdings, performance, asset allocation, rebalancing alerts
- **AI Weekly Analysis**: Comprehensive financial intelligence reports (Claude API)
- **Economic Analysis**: Kondratiev Wave positioning, business cycle, yield curve
- **Data Export**: CSV and Excel export with AI report

## Setup

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

## API Keys (Optional)

- **Anthropic API**: AI-powered financial analysis and OCR fallback
- **FRED API**: US economic indicators (free)
- **Alpha Vantage**: Real-time stock prices (free tier)
- **Google Vision API**: Enhanced receipt OCR

## Economic Theory Implementation

### Kondratiev Waves

The app positions users within the historical 50-60 year economic supercycle:
- **Wave 5 (1982-2035)**: Information & Digital Age
- **Current Position (2026)**: Late Autumn / Early Winter phase
- **Implication**: Capital preservation, reduce speculative assets, accumulate quality at discounts

### Investment Positioning for Winter Phase
- Cash & short-term T-bills
- Gold and precious metals
- Government bonds
- Defensive dividend stocks
- Avoid: speculative tech, junk bonds, leveraged positions

## Color Scheme

```
Background:   #0A0E1A (deep navy)
Card:         #141929
Accent:       #00D4FF (cyan)
Success:      #00E676 (green)
Warning:      #FFB300 (amber)
Danger:       #FF5252 (red)
```

## Architecture

```
frontend/
├── src/
│   ├── navigation/     - App navigation (tabs + stack)
│   ├── screens/        - All app screens
│   ├── components/     - Reusable components + charts
│   ├── hooks/          - Data hooks
│   ├── services/       - API, receipt, export services
│   ├── store/          - Zustand state management
│   └── types/          - TypeScript types

backend/
├── src/
│   ├── routes/         - Express routes
│   ├── services/       - AI, OCR, economic, export logic
│   ├── models/         - lowdb data models
│   └── middleware/     - Auth, error handling
```

## Weekly AI Report Format

Every Monday at 8am, the system generates a comprehensive report including:
1. Executive Summary (3-sentence overview)
2. Spending Analysis (total, trends, anomalies, insights)
3. Income Analysis (vs benchmarks, sources)
4. Investment Performance (returns, allocation, rebalancing)
5. Economic Context (Kondratiev phase, business cycle, opportunities)
6. Action Items (prioritized, with impact assessment)
7. Risk Alerts (High/Medium/Low with recommendations)
8. Financial Health Score (overall + subcategory scores)
