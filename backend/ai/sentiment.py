from news import fetch_news
from ai.llm import generate_with_gemini, generate_with_ollama
from database import save_sentiment
import json

def build_sentiment_prompt(symbol: str, news: list):
    headlines = "\n".join([f"- {n['title']}" for n in news]) if news else "No recent news found."

    return f"""You are a financial analyst. Analyze the sentiment of these news headlines for {symbol}.

Headlines:
{headlines}

Instructions:
- Classify each headline as positive, negative, or neutral
- Return ONLY a JSON object, no other text, no markdown, no backticks
- JSON format must be exactly:
{{
  "overall": "bullish" or "bearish" or "neutral",
  "positive_count": number,
  "negative_count": number,
  "neutral_count": number,
  "reasoning": "one sentence explaining the overall sentiment",
  "headlines": [
    {{"title": "headline text", "sentiment": "positive/negative/neutral"}},
    ...
  ]
}}

Rules:
- overall is "bullish" if positive > negative, "bearish" if negative > positive, "neutral" if equal
- reasoning must be one sentence, no jargon, plain English
- Do NOT predict price movement
- Do NOT add any text outside the JSON"""

def generate_sentiment(prompt: str):
    result = generate_with_gemini(prompt)
    if result:
        print("✅ Used Gemini for sentiment")
        return result

    print("⚠️ Falling back to Ollama for sentiment...")
    result = generate_with_ollama(prompt)
    if result:
        print("✅ Used Ollama for sentiment")
        return result

    return None

def get_sentiment(symbol: str):
    news = fetch_news(symbol)

    if not news:
        return None

    prompt = build_sentiment_prompt(symbol, news)
    raw = generate_sentiment(prompt)

    if not raw:
        return None

    try:
        # strip markdown backticks if model adds them anyway
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
    except Exception as e:
        print(f"Failed to parse sentiment JSON for {symbol}: {e}")
        print(f"Raw response: {raw}")
        return None

    save_sentiment(symbol, data)
    return data