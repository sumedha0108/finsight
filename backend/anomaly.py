from database import get_recent_prices, save_anomaly
import statistics

def detect_anomaly(symbol: str):
    records = get_recent_prices(symbol, 20)

    if not records or len(records) < 3:
        print(f"Not enough data for {symbol}")
        return None

    # latest record is the one we're testing
    latest_record = records[0]
    latest_price = latest_record["price"]
    change_pct = latest_record["change_pct"]

    # calculate mean and stdev from HISTORICAL prices only (exclude latest)
    historical_prices = [record["price"] for record in records[1:]]

    mean = statistics.mean(historical_prices)
    standard_deviation = statistics.stdev(historical_prices)

    if standard_deviation == 0:
        return None

    z_score = (latest_price - mean) / standard_deviation

    if abs(z_score) >= 3:
        severity = "severe"
    elif abs(z_score) >= 2:
        severity = "moderate"
    elif abs(z_score) >= 1.5:
        severity = "mild"
    else:
        return None

    direction = "up" if z_score > 0 else "down"

    anomaly = {
        "symbol": symbol,
        "severity": severity,
        "change_pct": change_pct,
        "z_score": round(z_score, 2),
        "latest_price": latest_price,
        "direction": direction
    }

    save_anomaly(symbol, severity, change_pct, z_score, direction)
    return anomaly