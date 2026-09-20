"""Remove decorative dots, backdrop shapes, and shadows from animal SVG cards."""

from __future__ import annotations

import html
import re
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
ANIMALS = PROJECT / "assets" / "cards" / "animals"


def main() -> None:
    cleaned = 0
    glyphs: set[str] = set()
    for path in sorted(ANIMALS.glob("[0-9][0-9]-*.svg")):
        source = path.read_text(encoding="utf-8")
        label_match = re.search(r'aria-label="([^"]+)"', source)
        glyph_match = re.search(r'<text[^>]*>(.*?)</text>', source, re.DOTALL)
        if not label_match or not glyph_match:
            raise RuntimeError(f"Could not read animal metadata from {path.name}")

        label = html.unescape(label_match.group(1))
        glyph = glyph_match.group(1).strip()
        if glyph in glyphs:
            raise RuntimeError(f"Duplicate rendered animal symbol: {glyph}")
        glyphs.add(glyph)

        clean_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" role="img" aria-label="{html.escape(label, quote=True)}">
  <rect width="240" height="240" fill="#ffffff"/>
  <text x="120" y="178" text-anchor="middle" font-size="176" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">{glyph}</text>
</svg>
'''
        path.write_text(clean_svg, encoding="utf-8")
        cleaned += 1

    if cleaned != 64:
        raise RuntimeError(f"Expected to clean 64 animal SVGs, cleaned {cleaned}")
    print(f"Cleaned {cleaned} unique animal SVGs")


if __name__ == "__main__":
    main()
