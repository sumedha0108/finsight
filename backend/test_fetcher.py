from fetcher import fetch_stock_price, fetch_crypto_price

print("--- Indian Stocks (INR) ---")
print(fetch_stock_price("RELIANCE.NS"))
print(fetch_stock_price("TCS.NS"))

print("--- US Stocks (USD) ---")
print(fetch_stock_price("AAPL"))
print(fetch_stock_price("TSLA"))

print("--- Crypto (USD) ---")
print(fetch_crypto_price("bitcoin", "BTC"))
print(fetch_crypto_price("ethereum", "ETH"))