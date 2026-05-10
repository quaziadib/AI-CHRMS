from langchain_core.language_models import BaseChatModel

from app.core.config import settings


def get_llm() -> BaseChatModel:
    provider = settings.LLM_PROVIDER.lower()

    if provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError("LLM provider not configured: ANTHROPIC_API_KEY missing")
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=settings.LLM_MODEL or "claude-sonnet-4-6",
            api_key=settings.ANTHROPIC_API_KEY,
            max_tokens=1024,
        )

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("LLM provider not configured: OPENAI_API_KEY missing")
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.LLM_MODEL or "gpt-4o",
            api_key=settings.OPENAI_API_KEY,
        )

    if provider == "google":
        if not settings.GOOGLE_API_KEY:
            raise RuntimeError("LLM provider not configured: GOOGLE_API_KEY missing")
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL or "gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
        )

    raise RuntimeError(f"Unknown LLM_PROVIDER: '{settings.LLM_PROVIDER}'. Use 'anthropic', 'openai', or 'google'.")
