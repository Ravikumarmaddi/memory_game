"""Extract clean flower-only card art from the three supplied reference sheets."""

from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps, ImageStat


PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / "assets" / "cards" / "flowers"
SOURCE_ROOT = Path(r"C:\Users\1039986\Desktop\DRAWINGS PICS\flowers")

SHEETS = [
    {
        "file": "61c03115b0e1bf1c179a8a5075299608.jpg",
        "names": [
            "Rose", "Sunflower", "Lily", "Peony", "Lavender",
            "Tulip", "Daisy", "Daffodil", "Orchid", "Hydrangea",
            "Carnation", "Iris", "Gerbera", "Calla Lily", "Dahlia",
            "Hyacinth", "Cherry Blossom", "Marigold", "Lotus", "Gardenia",
            "Baby's Breath", "Anemone", "Sweet Pea", "Bird of Paradise", "Clematis",
        ],
        "columns": 5,
        "rows": 5,
        "grid": (0, 132, 1125, 1522),
        "inset": (10, 15, 10, 120),
    },
    {
        "file": "ad354126048a6fa24f8944b2f877aa1a.jpg",
        "names": [
            "Rose", "Sunflower", "Lily", "Tulip",
            "Lotus", "Hibiscus", "Daisy", "Daffodil",
            "Lavender", "Peony", "Carnation", "Cherry Blossom",
            "Marigold", "Hydrangea", "Gerbera", "Jasmine",
            "Iris", "Gardenia", "Plumeria", "Pansy",
        ],
        "columns": 4,
        "rows": 5,
        "grid": (13, 213, 723, 1214),
        "inset": (58, 48, 10, 62),
    },
    {
        "file": "d63675048a0ec9fbd0e3d87f0f99a1c7.jpg",
        "names": [
            "Rose", "Tulip", "Daisy", "Sunflower", "Lily",
            "Daffodil", "Marigold", "Gerbera", "Carnation", "Chrysanthemum",
            "Orchid", "Hibiscus", "Lotus", "Water Lily", "Magnolia",
            "Peony", "Poppy", "Iris", "Lavender",
        ],
        "columns": 5,
        "rows": 9,
        "grid": (13, 103, 722, 1156),
        "inset": (7, 1, 7, 55),
    },
]


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def center_foreground(image: Image.Image) -> Image.Image:
    image = image.crop((4, 4, image.width - 4, image.height - 4))
    corners = Image.new("RGB", (4, 1))
    corner_pixels = [
        image.getpixel((0, 0)), image.getpixel((image.width - 1, 0)),
        image.getpixel((0, image.height - 1)), image.getpixel((image.width - 1, image.height - 1)),
    ]
    corners.putdata(corner_pixels)
    background = tuple(round(value) for value in ImageStat.Stat(corners).median)
    difference = ImageChops.difference(image, Image.new("RGB", image.size, background))
    mask = ImageChops.lighter(
        ImageChops.lighter(difference.getchannel("R"), difference.getchannel("G")),
        difference.getchannel("B"),
    )
    mask = mask.point(lambda value: 255 if value > 18 else 0)
    bounds = mask.getbbox()
    if bounds:
        padding_x = max(5, round((bounds[2] - bounds[0]) * 0.05))
        padding_y = max(5, round((bounds[3] - bounds[1]) * 0.05))
        bounds = (
            max(0, bounds[0] - padding_x), max(0, bounds[1] - padding_y),
            min(image.width, bounds[2] + padding_x), min(image.height, bounds[3] + padding_y),
        )
        image = image.crop(bounds)
    return image


def extract_cell(image: Image.Image, sheet: dict, index: int) -> Image.Image:
    left, top, right, bottom = sheet["grid"]
    cell_width = (right - left) / sheet["columns"]
    cell_height = (bottom - top) / sheet["rows"]
    column = index % sheet["columns"]
    row = index // sheet["columns"]
    inset_left, inset_top, inset_right, inset_bottom = sheet["inset"]
    box = (
        round(left + column * cell_width + inset_left),
        round(top + row * cell_height + inset_top),
        round(left + (column + 1) * cell_width - inset_right),
        round(top + (row + 1) * cell_height - inset_bottom),
    )
    crop = image.crop(box).convert("RGB")
    crop = center_foreground(crop)
    crop = ImageEnhance.Contrast(crop).enhance(1.04)
    crop = crop.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=3))

    fitted = ImageOps.contain(crop, (456, 456), Image.Resampling.LANCZOS)
    card = Image.new("RGB", (512, 512), "#fffdf8")
    card.paste(fitted, ((512 - fitted.width) // 2, (512 - fitted.height) // 2))
    return card


def main() -> None:
    entries = []
    card_number = 1
    for sheet in SHEETS:
        source = Image.open(SOURCE_ROOT / sheet["file"])
        for source_index, name in enumerate(sheet["names"]):
            card = extract_cell(source, sheet, source_index)
            filename = f"{card_number:02d}-{slugify(name)}-photo.jpg"
            card.save(OUTPUT / filename, "JPEG", quality=92, optimize=True, progressive=True)
            entries.append({"id": card_number, "name": name, "file": filename})
            card_number += 1

    if len(entries) != 64:
        raise RuntimeError(f"Expected 64 cards, extracted {len(entries)}")

    (OUTPUT / "manifest.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    runtime = (
        'window.MEMORY_GAME_CARD_MANIFESTS = window.MEMORY_GAME_CARD_MANIFESTS || {}; '
        'window.MEMORY_GAME_CARD_MANIFESTS["flowers"] = '
        + json.dumps(entries, ensure_ascii=False)
        + ";\n"
    )
    (OUTPUT / "manifest.runtime.js").write_text(runtime, encoding="utf-8")
    print(f"Extracted {len(entries)} flower cards to {OUTPUT}")


if __name__ == "__main__":
    main()
