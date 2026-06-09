import requests
import os
from dotenv import load_dotenv

load_dotenv()

GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")

def get_query(symbol: str):
    # clean up symbol to make a good search query
    clean = symbol.replace(".NS", "").replace(".BO", "").replace("-USD", "")
    
    # common mappings for well known tickers
    known = {
        "TSLA": "Tesla stock",
        "AAPL": "Apple stock",
        "GOOGL": "Google Alphabet stock",
        "MSFT": "Microsoft stock",
        "BTC": "Bitcoin cryptocurrency",
        "ETH": "Ethereum cryptocurrency",
        "RELIANCE": "Reliance Industries India",
        "TCS": "Tata Consultancy Services",
        "INFY": "Infosys India stock",
        "HDFCBANK": "HDFC Bank India",
        "TATAMOTORS": "Tata Motors India",
    }
    
    return known.get(clean, f"{clean} stock")

def fetch_news(symbol: str):
    query = get_query(symbol)

    url = "https://gnews.io/api/v4/search"
    params = {
        "q": query,
        "lang": "en",
        "max": 5,
        "apikey": GNEWS_API_KEY
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        print(f"GNews error {response.status_code} for {symbol}")
        return []

    data = response.json()
    articles = data.get("articles", [])

    return [
        {
            "title": article["title"],
            "description": article["description"],
            "url": article["url"]
        }
        for article in articles
    ]