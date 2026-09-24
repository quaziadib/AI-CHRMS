from langchain_core.language_models import BaseChatModel

from app.core.config import settings


def get_llm(*, max_tokens: int = 1024) -> BaseChatModel:
    provider = settings.LLM_PROVIDER.lower()

    if provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError("LLM provider not configured: ANTHROPIC_API_KEY missing")
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=settings.LLM_MODEL or "claude-sonnet-4-6",
            api_key=settings.ANTHROPIC_API_KEY,
            max_tokens=max_tokens,
        )

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("LLM provider not configured: OPENAI_API_KEY missing")
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.LLM_MODEL or "gpt-4o",
            api_key=settings.OPENAI_API_KEY,
            max_tokens=max_tokens,
        )

    if provider == "google":
        if not settings.GOOGLE_API_KEY:
            raise RuntimeError("LLM provider not configured: GOOGLE_API_KEY missing")
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL or "gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            max_output_tokens=max_tokens,
        )

    if provider == "groq":
        if not settings.GROQ_API_KEY:
            raise RuntimeError("LLM provider not configured: GROQ_API_KEY missing")
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.LLM_MODEL or "llama-3.3-70b-versatile",
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            max_tokens=max_tokens,
        )

    raise RuntimeError(
        f"Unknown LLM_PROVIDER: '{settings.LLM_PROVIDER}'. "
        "Use 'anthropic', 'openai', 'google', or 'groq'."
    )
