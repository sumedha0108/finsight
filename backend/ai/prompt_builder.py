def build_prompt(symbol, anomaly, news):
    headlines = "\n".join([f"- {n['title']}" for n in news]) if news else "No recent news found."

    return f"""You are a financial analyst explaining stock movements to a regular person with no finance background.

Stock: {symbol}
Price change today: {anomaly['change_pct']}%
Severity: {anomaly['severity']}

Recent news headlines:
{headlines}

Your task:
- Write exactly 2-3 sentences explaining why this stock moved
- Use the news headlines above as your primary source — reference them directly
- If no news is available, say the move may be due to broader market conditions
- Use simple language, no jargon, no technical terms
- Do NOT mention z-scores, standard deviations, or statistical terms
- Do NOT offer to investigate further or ask follow up questions
- Do NOT say "based on my analysis" or similar filler phrases
- Be direct and confident — tell the user what happened and why

Example of good output:
"Apple dropped 3.2% today after analysts warned that iPhone sales in China are slowing down due to increased competition from local brands. This is part of a broader tech selloff happening across US markets today."

Example of bad output:
"The anomaly detected is likely due to minor market fluctuations. A more detailed analysis would be required to determine the exact cause."

Now explain the movement for {symbol}:"""