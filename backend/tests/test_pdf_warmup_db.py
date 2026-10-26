"""Startup warm-up of the PDF renderer must not gate /health. Needs PostgreSQL (lifespan runs migrations)."""

from __future__ import annotations

import threading
import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db.base import engine


def _db_available() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _db_available(), reason="PostgreSQL not available")


def test_health_responds_while_warmup_still_running():
    from app.main import app
    from app.services import prescription as svc

    release = threading.Event()
    started = threading.Event()

    def slow_warmup():
        started.set()
        release.wait(timeout=10)

    with patch.object(svc, "warm_pdf_renderer", slow_warmup):
        try:
            t0 = time.perf_counter()
            with TestClient(app) as client:
                assert started.wait(timeout=5)
                r = client.get("/health")
                elapsed = time.perf_counter() - t0
            assert r.status_code == 200 and r.json()["status"] == "ok"
            assert elapsed < 5, "health must not wait for the warm-up thread"
        finally:
            release.set()
