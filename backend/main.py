from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from fetcher import fetch_stock_price, fetch_crypto_price
from database import (
    get_latest_sentiment, save_price, get_recent_prices, save_anomaly,
    get_recent_anomalies, get_all_symbols, save_explanation,
    add_asset, delete_asset, cleanup_anomalies
)
from anomaly import detect_anomaly
from ai.explainer import explain_symbol
from pydantic import BaseModel
from ai.sentiment import get_sentiment
import time

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def scheduled_refresh():
    print("⏰ Scheduled refresh running...")
    symbols = get_all_symbols()
    for symbol in symbols:
        if symbol["type"] == "crypto":
            data = fetch_crypto_price(symbol["coin_id"], symbol["symbol"])
        else:
            data = fetch_stock_price(symbol["symbol"])
        if data:
            save_price(data["symbol"], data["price"], data["change_pct"], data["currency"], data["type"], data["exchange"])
    print("✅ Refresh done")

scheduler = BackgroundScheduler()
scheduler.add_job(scheduled_refresh, "interval", minutes=1)
scheduler.start()

class SymbolRequest(BaseModel):
    symbol: str
    type: str

@app.get("/")
def health():
    return {"status": "FinSight backend running"}

@app.get("/prices/refresh")
def refresh_prices():
    symbols = get_all_symbols()
    results = []
    for symbol in symbols:
        if symbol["type"] == "crypto":
            data = fetch_crypto_price(symbol["coin_id"], symbol["symbol"])
        else:
            data = fetch_stock_price(symbol["symbol"])
        if data:
            save_price(data["symbol"], data["price"], data["change_pct"], data["currency"], data["type"], data["exchange"])
            results.append(data)
    return {"refreshed": len(results), "prices": results}

@app.get("/prices/{symbol}")
def get_prices(symbol: str, limit: int = 50):
    data = get_recent_prices(symbol.upper(), limit)
    return {"symbol": symbol.upper(), "history": data}

@app.get("/prices")
def get_all_latest():
    symbols = get_all_symbols()
    results = []
    for s in symbols:
        data = get_recent_prices(s["symbol"], limit=1)
        if data:
            results.append(data[0])
    return {"prices": results}

@app.get("/anomalies/detect")
def run_anomaly_detection():
    symbols = get_all_symbols()
    detected = []
    for s in symbols:
        result = detect_anomaly(s["symbol"])
        if result:
            detected.append(result)
    return {"anomalies_found": len(detected), "anomalies": detected}

@app.get("/anomalies")
def get_anomalies(limit: int = 20):
    db_result = get_recent_anomalies(limit)
    return {"anomalies": db_result}

@app.get("/explain/{symbol}")
def explain(symbol: str):
    result = explain_symbol(symbol.upper())
    return result or {"message": "No anomaly found"}

@app.post("/symbols/add")
def add_symbol(req: SymbolRequest):
    symbol = req.symbol.upper()

    if req.type == "stock":
        data = fetch_stock_price(symbol)
        if not data:
            raise HTTPException(status_code=400, detail="Symbol not found on yfinance")
        save_price(data["symbol"], data["price"], data["change_pct"], data["currency"], data["type"], data["exchange"])

    try:
        add_asset(symbol, req.type)
    except Exception:
        raise HTTPException(status_code=400, detail="Symbol already being tracked")

    return {"message": f"{symbol} added successfully"}


@app.delete("/symbols/{symbol}")
def delete_symbol(symbol: str):
    delete_asset(symbol.upper())
    return {"message": f"{symbol.upper()} removed successfully"}


def cleanup_old_anomalies():
    from datetime import datetime, timezone, timedelta
    cleanup_anomalies(datetime.now(timezone.utc) - timedelta(days=7))
    print("🧹 Old anomalies cleaned up")

scheduler.add_job(cleanup_old_anomalies, "interval", hours=24)

@app.delete("/anomalies/clear")
def clear_old_anomalies():
    from datetime import datetime, timezone, timedelta
    cleanup_anomalies(datetime.now(timezone.utc) - timedelta(hours=12))
    return {"message": "Anomalies older than 12 hours cleared"}

@app.get("/sentiment/bulk")
def analyze_all_sentiment():
    symbols = get_all_symbols()
    results = []
    for s in symbols:
        # check cache first — skip if analyzed in last 6 hours
        cached = get_latest_sentiment(s["symbol"])
        if cached:
            from datetime import datetime, timezone, timedelta
            analyzed_at = datetime.fromisoformat(cached["analyzed_at"])
            if datetime.now(timezone.utc) - analyzed_at < timedelta(hours=6):
                print(f"⏭️ {s['symbol']} sentiment cached, skipping...")
                results.append(cached)
                continue

        result = get_sentiment(s["symbol"])
        if result:
            results.append({"symbol": s["symbol"], **result})
        
        time.sleep(1)  # 1 second delay between calls to avoid rate limits

    return {"analyzed": len(results), "results": results}


@app.get("/sentiment/{symbol}")
def analyze_sentiment(symbol: str):
    # return cached if analyzed in last 6 hours
    cached = get_latest_sentiment(symbol.upper())
    if cached:
        from datetime import datetime, timezone, timedelta
        analyzed_at = datetime.fromisoformat(cached["analyzed_at"])
        if datetime.now(timezone.utc) - analyzed_at < timedelta(hours=6):
            return cached
    
    # otherwise fetch fresh
    result = get_sentiment(symbol.upper())
    return result or {"message": "Could not analyze sentiment"}