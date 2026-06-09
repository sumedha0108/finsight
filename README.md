# 📈 FinSight

AI-powered portfolio dashboard for tracking stocks and crypto, detecting unusual price movements, and explaining them with news sentiment analysis.

---

## Screenshots

<!-- Add your 3 screenshots below -->
![Dashboard](screenshots/dashboard.png)
![Anomaly Detection](screenshots/anomalies.png)
![Sentiment Analysis](screenshots/sentiment.png)

---

## Features

- **Live price tracking** — Indian stocks (NSE), US stocks, and crypto, refreshed every minute via a background scheduler
- **Anomaly detection** — Z-score based detection flags unusual surges or drops
- **AI explanations** — Gemini 2.5 Flash explains each anomaly using recent news (falls back to Ollama if unavailable)
- **Sentiment analysis** — Classifies recent headlines as bullish, bearish, or neutral per asset; displayed inline on each price card
- **Add / remove symbols** — Track any stock or crypto from the dashboard
- **Dark UI** — Market open/closed indicator, summary stats, skeleton loading states

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python, FastAPI, APScheduler |
| Database | PostgreSQL (psycopg2) |
| Price data | yfinance, CoinGecko |
| News | GNews API |
| AI | Google Gemini 2.5 Flash, Ollama (fallback) |
| Frontend | React, TypeScript, Axios |

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### 1. Clone the repo

```bash
git clone https://github.com/sumedha0108/finsight.git
cd finsight
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost/finsight"
GNEWS_API_KEY=your_gnews_key
GEMINI_API_KEY=your_gemini_key
```

Create the database and run the schema:

```bash
createdb -U postgres finsight
psql -U postgres finsight -f schema.sql
```

Start the server:

```bash
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/prices` | Latest price for all tracked assets |
| GET | `/prices/{symbol}` | Price history for a symbol |
| GET | `/prices/refresh` | Manually trigger a price fetch |
| GET | `/anomalies` | Recent anomalies (last 24h) |
| GET | `/anomalies/detect` | Run anomaly detection |
| DELETE | `/anomalies/clear` | Clear anomalies older than 12h |
| GET | `/explain/{symbol}` | AI explanation for a symbol's anomaly |
| GET | `/sentiment/{symbol}` | Sentiment for a symbol |
| GET | `/sentiment/bulk` | Sentiment for all tracked assets |
| POST | `/symbols/add` | Add a symbol to track |
| DELETE | `/symbols/{symbol}` | Remove a symbol |
