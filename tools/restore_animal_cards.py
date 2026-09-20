"""Restore the original animal set, retaining full-body dog and cat replacements."""

from __future__ import annotations

import json
import re
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
ANIMALS = PROJECT / "assets" / "cards" / "animals"


def main() -> None:
    entries = []
    for svg in sorted(ANIMALS.glob("[0-9][0-9]-*.svg")):
        card_id = int(svg.name[:2])
        source = svg.read_text(encoding="utf-8")
        match = re.search(r'aria-label="([^"]+)"', source)
        if not match:
            raise RuntimeError(f"Missing accessible animal name in {svg.name}")
        entries.append({"id": card_id, "name": match.group(1), "file": svg.name})

    if len(entries) != 64:
        raise RuntimeError(f"Expected 64 original animals, found {len(entries)}")

    # The supplied full-body illustrations replace only the face-style dog and cat.
    entries[4] = {"id": 5, "name": "Dog", "file": "01-dog-photo.jpg"}
    entries[5] = {"id": 6, "name": "Cat", "file": "02-cat-photo.jpg"}

    names = [entry["name"] for entry in entries]
    if len(set(names)) != len(names):
        raise RuntimeError("Every animal type must occur exactly once")

    (ANIMALS / "manifest.json").write_text(
        json.dumps(entries, indent=2) + "\n", encoding="utf-8"
    )
    runtime = (
        'window.MEMORY_GAME_CARD_MANIFESTS = window.MEMORY_GAME_CARD_MANIFESTS || {}; '
        'window.MEMORY_GAME_CARD_MANIFESTS["animals"] = '
        + json.dumps(entries)
        + ";\n"
    )
    (ANIMALS / "manifest.runtime.js").write_text(runtime, encoding="utf-8")
    print("Restored 64 unique animals; replaced only dog and cat with full-body art")


if __name__ == "__main__":
    main()
