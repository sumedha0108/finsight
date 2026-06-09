import os
import time
import requests
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_with_gemini(prompt: str):
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            return response.text
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini attempt {attempt+1} failed: {error_msg}")
            if "429" in error_msg:
                wait = 5 * (attempt + 1)
                print(f"Rate limited. Waiting {wait}s...")
                time.sleep(wait)
            elif "503" in error_msg:
                print(f"Gemini unavailable. Waiting 5s...")
                time.sleep(5)
            else:
                time.sleep(2 ** attempt)
    return None

def generate_with_ollama(prompt: str):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        return response.json()["response"]
    except Exception as e:
        print(f"Ollama failed: {e}")
        return None

def generate_explanation(prompt: str):
    # try Gemini first
    result = generate_with_gemini(prompt)
    if result:
        print("✅ Used Gemini")
        return result

    # fall back to Ollama
    print("⚠️ Gemini unavailable, falling back to Ollama...")
    result = generate_with_ollama(prompt)
    if result:
        print("✅ Used Ollama")
        return result

    return "Explanation unavailable — all AI providers are currently down. Try again later."