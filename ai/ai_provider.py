"""
ai_provider.py — Unified AI provider module for EduGenie.

Supports Mistral and Gemini backends, controlled by AI_PROVIDER in .env.
Switch providers by changing AI_PROVIDER to 'mistral' or 'gemini'.
"""

import os
from dotenv import load_dotenv

load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "mistral").lower()


def generate_content(prompt: str) -> str:
    """
    Generate text content using the configured AI provider.

    Args:
        prompt: The text prompt to send to the AI model.

    Returns:
        Generated text as a string, or None if generation fails.
    """
    if AI_PROVIDER == "mistral":
        return _generate_mistral(prompt)
    elif AI_PROVIDER == "gemini":
        return _generate_gemini(prompt)
    else:
        print(f"[ERROR] Unknown AI_PROVIDER: {AI_PROVIDER}. Use 'mistral' or 'gemini'.")
        return None


def _generate_mistral(prompt: str) -> str:
    """Generate content using Mistral AI."""
    try:
        from mistralai.client import Mistral

        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            print("[ERROR] MISTRAL_API_KEY not set in .env")
            return None

        client = Mistral(api_key=api_key)
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"[ERROR] Mistral generation failed: {e}")
        return None


def _generate_gemini(prompt: str) -> str:
    """Generate content using Google Gemini AI."""
    try:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("[ERROR] GEMINI_API_KEY not set in .env")
            return None

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        print(f"[ERROR] Gemini generation failed: {e}")
        return None


if __name__ == "__main__":
    # Quick self-test
    result = generate_content("Say hello in one sentence.")
    if result:
        print(f"[{AI_PROVIDER.upper()}] Response: {result}")
    else:
        print(f"[{AI_PROVIDER.upper()}] Generation failed. Check your API key.")
