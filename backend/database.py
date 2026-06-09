import os
import json
import psycopg2
import psycopg2.extras
from psycopg2 import pool
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta

_pool = None

def _get_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=os.getenv("DATABASE_URL")
        )
    return _pool

@contextmanager
def get_conn():
    conn = _get_pool().getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _get_pool().putconn(conn)


def get_all_symbols():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM assets")
            return [dict(r) for r in cur.fetchall()]


def save_price(symbol: str, price: float, change_pct: float, currency: str, asset_type: str, exchange: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO price_history (symbol, price, change_pct, currency, type, exchange)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (symbol, price, change_pct, currency, asset_type, exchange)
            )


def get_recent_prices(symbol: str, limit: int = 50):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM price_history
                   WHERE symbol = %s
                   ORDER BY fetched_at DESC
                   LIMIT %s""",
                (symbol, limit)
            )
            return [dict(r) for r in cur.fetchall()]


def save_anomaly(symbol: str, severity: str, change_pct: float, z_score: float, direction: str):
    since_6h = datetime.now(timezone.utc) - timedelta(hours=6)
    since_1h = datetime.now(timezone.utc) - timedelta(hours=1)

    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT id, detected_at FROM anomalies
                   WHERE symbol = %s AND detected_at >= %s
                   ORDER BY detected_at DESC LIMIT 1""",
                (symbol, since_6h)
            )
            existing = cur.fetchone()

            if existing:
                if existing["detected_at"].replace(tzinfo=timezone.utc) >= since_1h:
                    print(f"⏭️ {symbol} checked less than 1 hour ago, skipping...")
                    return
                cur.execute(
                    """UPDATE anomalies
                       SET severity = %s, change_pct = %s, z_score = %s,
                           direction = %s, explanation = NULL, detected_at = NOW()
                       WHERE id = %s""",
                    (severity, change_pct, z_score, direction, existing["id"])
                )
                print(f"🔄 Updated anomaly for {symbol}")
            else:
                cur.execute(
                    """INSERT INTO anomalies (symbol, severity, change_pct, z_score, direction)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (symbol, severity, change_pct, z_score, direction)
                )
                print(f"🚨 New anomaly saved for {symbol}")


def get_recent_anomalies(limit: int = 20):
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM anomalies
                   WHERE detected_at >= %s
                   ORDER BY detected_at DESC
                   LIMIT %s""",
                (since, limit)
            )
            return [dict(r) for r in cur.fetchall()]


def get_latest_anomaly(symbol: str):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM anomalies
                   WHERE symbol = %s
                   ORDER BY detected_at DESC
                   LIMIT 1""",
                (symbol,)
            )
            row = cur.fetchone()
            return dict(row) if row else None


def save_explanation(anomaly_id: str, explanation):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE anomalies SET explanation = %s WHERE id = %s",
                (explanation, anomaly_id)
            )


def get_latest_sentiment(symbol: str):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM sentiment
                   WHERE symbol = %s
                   ORDER BY analyzed_at DESC
                   LIMIT 1""",
                (symbol,)
            )
            row = cur.fetchone()
            return dict(row) if row else None


def save_sentiment(symbol: str, data: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM sentiment WHERE symbol = %s", (symbol,))
            cur.execute(
                """INSERT INTO sentiment
                   (symbol, overall, positive_count, negative_count, neutral_count,
                    reasoning, headlines, analyzed_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())""",
                (
                    symbol,
                    data["overall"],
                    data["positive_count"],
                    data["negative_count"],
                    data["neutral_count"],
                    data["reasoning"],
                    json.dumps(data["headlines"]),
                )
            )


def add_asset(symbol: str, asset_type: str, coin_id: str = None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO assets (symbol, type, coin_id) VALUES (%s, %s, %s)",
                (symbol, asset_type, coin_id)
            )


def delete_asset(symbol: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM assets WHERE symbol = %s", (symbol,))


def cleanup_anomalies(cutoff: datetime):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM anomalies WHERE detected_at < %s", (cutoff,))
