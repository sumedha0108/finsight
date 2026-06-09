import yfinance as yf
import requests

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"

def fetch_stock_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.fast_info
        current_price = data.last_price
        prev_close = data.previous_close
        change_pct = ((current_price - prev_close) / prev_close) * 100

        currency = "INR" if symbol.endswith(".NS") or symbol.endswith(".BO") else "USD"
        exchange = "NSE" if symbol.endswith(".NS") else "BSE" if symbol.endswith(".BO") else "US"

        return {
            "symbol": symbol,
            "price": round(current_price, 2),
            "change_pct": round(change_pct, 2),
            "currency": currency,
            "type": "stock",
            "exchange": exchange
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None

def fetch_crypto_price(coin_id: str, symbol: str):
    try:
        response = requests.get(COINGECKO_URL, params={
            "ids": coin_id,
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        })
        data = response.json()
        price = data[coin_id]["usd"]
        change_pct = data[coin_id]["usd_24h_change"]

        return {
            "symbol": symbol,
            "price": round(price, 2),
            "change_pct": round(change_pct, 2),
            "currency": "USD",
            "type": "crypto",
            "exchange": "CRYPTO"
        }
    except Exception as e:
        print(f"Error fetching {coin_id}: {e}")
        return None