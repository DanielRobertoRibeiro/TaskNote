import unicodedata


def normalize_tag_name(name: str) -> str:
    """Create the canonical, case-insensitive representation used for tag matching."""
    return unicodedata.normalize("NFKC", " ".join(name.split())).casefold()
