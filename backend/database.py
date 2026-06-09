from supabase import create_client
import os

def get_db():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

def get_all_symbols():
    db = get_db()
    result = db.table("assets")\
        .select("*")\
        .execute()
    return result.data

def save_price(symbol: str, price: float, change_pct: float, currency: str, asset_type: str, exchange: str):
    db = get_db()
    db.table("price_history").insert({
        "symbol": symbol,
        "price": price,
        "change_pct": change_pct,
        "currency": currency,
        "type": asset_type,
        "exchange": exchange
    }).execute()

def get_recent_prices(symbol: str, limit: int = 50):
    db = get_db()
    result = db.table("price_history")\
        .select("*")\
        .eq("symbol", symbol)\
        .order("fetched_at", desc=True)\
        .limit(limit)\
        .execute()
    return result.data

def save_anomaly(symbol: str, severity: str, change_pct: float, z_score: float, direction: str):
    db = get_db()
    from datetime import datetime, timezone, timedelta
    since_6h = (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat()
    since_1h = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()

    existing = db.table("anomalies")\
        .select("id, detected_at")\
        .eq("symbol", symbol)\
        .gte("detected_at", since_6h)\
        .execute()

    if existing.data:
        last_detected = existing.data[0]["detected_at"]
        if last_detected >= since_1h:
            print(f"⏭️ {symbol} checked less than 1 hour ago, skipping...")
            return
        db.table("anomalies")\
            .update({
                "severity": severity,
                "change_pct": change_pct,
                "z_score": z_score,
                "direction": direction,
                "explanation": None,
                "detected_at": datetime.now(timezone.utc).isoformat()
            })\
            .eq("id", existing.data[0]["id"])\
            .execute()
        print(f"🔄 Updated anomaly for {symbol}")
    else:
        db.table("anomalies").insert({
            "symbol": symbol,
            "severity": severity,
            "change_pct": change_pct,
            "z_score": z_score,
            "direction": direction
        }).execute()
        print(f"🚨 New anomaly saved for {symbol}")
from datetime import datetime, timezone, timedelta

def get_recent_anomalies(limit: int = 20):
    db = get_db()
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = db.table("anomalies")\
        .select("*")\
        .gte("detected_at", since)\
        .order("detected_at", desc=True)\
        .limit(limit)\
        .execute()
    return result.data

# database.py

def get_latest_anomaly(symbol: str):
    db = get_db()
    result = db.table("anomalies")\
        .select("*")\
        .eq("symbol", symbol)\
        .order("detected_at", desc=True)\
        .limit(1)\
        .execute()

    return result.data[0] if result.data else None

def save_explanation(anomaly_id: str, explanation):
    db = get_db()
    db.table("anomalies")\
        .update({"explanation": explanation})\
        .eq("id", anomaly_id)\
        .execute()
    

def get_latest_sentiment(symbol: str):
    db = get_db()
    result = db.table("sentiment")\
        .select("*")\
        .eq("symbol", symbol)\
        .order("analyzed_at", desc=True)\
        .limit(1)\
        .execute()
    return result.data[0] if result.data else None