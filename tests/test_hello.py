"""Tests for the shared greeting primitive in `jobcopilot.hello`."""

from jobcopilot.hello import greet


def test_greet_normal_name() -> None:
    """`greet` interpolates a non-empty name into the greeting."""
    assert greet("Alice") == "hello Alice"


def test_greet_empty_name() -> None:
    """`greet` still returns a valid greeting when given an empty string."""
    assert greet("") == "hello "
