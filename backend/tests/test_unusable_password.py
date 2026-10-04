"""Accounts holding a non-bcrypt hash must fail login cleanly, never raise."""

import pytest

from app.core.security import UNUSABLE_PASSWORD_HASH, hash_password, verify_password


@pytest.mark.parametrize("stored", [UNUSABLE_PASSWORD_HASH, "$synthetic$abc123", ""])
def test_unusable_hash_rejects_any_password(stored):
    assert verify_password("anything", stored) is False
    assert verify_password("", stored) is False


def test_real_bcrypt_hash_still_verifies():
    h = hash_password("s3cret-pass")
    assert verify_password("s3cret-pass", h) is True
    assert verify_password("wrong", h) is False
