from app.core.config import settings

_SYSTEM_PROMPT = """You are a health information assistant for the AI-CHRMS platform.
Your role is to answer general health-related questions clearly and accurately.

STRICT RULES:
- Never provide specific diagnoses or prescribe treatment.
- Always recommend consulting a qualified healthcare professional for personal medical advice.
- Do not interpret individual lab results or vital signs from user input.
- Keep answers factual, concise, and evidence-based.
- If unsure, say so clearly rather than guessing.

End every response with:
⚠️ Disclaimer: This information is for educational purposes only and does not constitute medical advice.
"""

_DISCLAIMER = (
    "This information is for educational purposes only and does not constitute "
    "medical advice. Please consult a qualified healthcare professional."
)


def chat(query: str) -> dict:
    """Send a query to the AI chatbot and return the response.

    Returns a dict with 'response' and 'disclaimer' keys.
    Raises RuntimeError if OpenAI is not configured.
    """
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    # Import here so the service starts without openai installed if key is absent
    from openai import OpenAI  # noqa: PLC0415

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    completion = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        max_tokens=800,
        temperature=0.3,
    )

    return {
        "response": completion.choices[0].message.content,
        "disclaimer": _DISCLAIMER,
        "model": settings.OPENAI_MODEL,
    }
