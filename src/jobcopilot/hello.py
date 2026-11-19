"""Shared primitive: simple text greeting utilities.

This module lives at the primitive/utility layer. It contains no business
logic and no feature-specific imports, so it can be imported from anywhere
inside the package without creating upward/cross-feature dependencies.
"""


def greet(name: str) -> str:
    """Return a casual greeting for the given name.

    Args:
        name: The name to include in the greeting. May be empty.

    Returns:
        A string of the form "hello {name}".

    This function intentionally does not strip or validate `name`; callers
    are responsible for normalising input when that is required.
    """
    return f"hello {name}"
