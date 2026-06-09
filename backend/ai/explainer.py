from database import get_latest_anomaly, save_explanation
from news import fetch_news
from ai.prompt_builder import build_prompt
from ai.llm import generate_explanation

def explain_symbol(symbol: str):
    anomaly = get_latest_anomaly(symbol)

    if not anomaly:
        return None

    # don't re-explain if already explained
# don't use cached explanation if it's a failure message
    if anomaly.get("explanation") and "unavailable" not in anomaly["explanation"].lower():
        return {
            "symbol": symbol,
            "anomaly": anomaly,
            "explanation": anomaly["explanation"],
            "cached": True
        }

    news = fetch_news(symbol)
    prompt = build_prompt(symbol, anomaly, news)
    explanation = generate_explanation(prompt)

    # save explanation back to the anomaly record
    save_explanation(anomaly["id"], explanation)

    return {
        "symbol": symbol,
        "anomaly": anomaly,
        "news": news,
        "explanation": explanation,
        "cached": False
    }