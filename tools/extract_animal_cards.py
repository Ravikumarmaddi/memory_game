"""Extract one centered card per distinct animal type from supplied sheets."""

from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps, ImageStat


PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / "assets" / "cards" / "animals"
SOURCE_ROOT = Path(r"C:\Users\1039986\Desktop\DRAWINGS PICS\animals")


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def center_foreground(image: Image.Image) -> Image.Image:
    if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
        rgba = image.convert("RGBA")
        mask = rgba.getchannel("A").point(lambda value: 255 if value > 12 else 0)
        background_layer = Image.new("RGBA", rgba.size, "#ffffff")
        background_layer.alpha_composite(rgba)
        image = background_layer.convert("RGB")
    else:
        image = image.convert("RGB")
        corners = Image.new("RGB", (4, 1))
        corners.putdata([
            image.getpixel((0, 0)), image.getpixel((image.width - 1, 0)),
            image.getpixel((0, image.height - 1)), image.getpixel((image.width - 1, image.height - 1)),
        ])
        background = tuple(round(value) for value in ImageStat.Stat(corners).median)
        difference = ImageChops.difference(image, Image.new("RGB", image.size, background))
        mask = ImageChops.lighter(
            ImageChops.lighter(difference.getchannel("R"), difference.getchannel("G")),
            difference.getchannel("B"),
        ).point(lambda value: 255 if value > 20 else 0)

    bounds = mask.getbbox()
    if bounds:
        padding_x = max(8, round((bounds[2] - bounds[0]) * 0.055))
        padding_y = max(8, round((bounds[3] - bounds[1]) * 0.055))
        image = image.crop((
            max(0, bounds[0] - padding_x), max(0, bounds[1] - padding_y),
            min(image.width, bounds[2] + padding_x), min(image.height, bounds[3] + padding_y),
        ))
    return image


def regular_grid(source: str, names: list[str], columns: int, rows: int) -> list[tuple[str, str, tuple[int, int, int, int]]]:
    image = Image.open(SOURCE_ROOT / source)
    cell_width = image.width / columns
    cell_height = image.height / rows
    return [
        (source, name, (
            round((index % columns) * cell_width + 8),
            round((index // columns) * cell_height + 8),
            round(((index % columns) + 1) * cell_width - 8),
            round(((index // columns) + 1) * cell_height - 8),
        ))
        for index, name in enumerate(names)
    ]


ANIMALS = [
    ("c589313e10e26ff598f1558492a616a6.jpg", "Dog", (15, 10, 295, 325)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Cat", (320, 15, 570, 325)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Elephant", (575, 15, 875, 330)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Lion", (875, 10, 1190, 340)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Giraffe", (15, 330, 305, 655)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Monkey", (315, 330, 605, 630)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Rabbit", (600, 325, 850, 655)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Panda", (845, 340, 1135, 655)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Penguin", (15, 670, 285, 910)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Dolphin", (275, 635, 585, 910)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Turtle", (575, 650, 830, 900)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Goldfish", (860, 650, 1170, 910)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Crocodile", (5, 900, 320, 1190)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Owl", (335, 915, 550, 1190)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Sheep", (600, 910, 850, 1190)),
    ("c589313e10e26ff598f1558492a616a6.jpg", "Horse", (870, 905, 1190, 1190)),
]

ANIMALS += [
    ("download (1).png", "Eagle", (245, 0, 445, 300)),
    ("download (1).png", "Chicken", (435, 0, 625, 310)),
    ("download (1).png", "Songbird", (850, 0, 1110, 310)),
    ("download (1).png", "Seal", (300, 315, 615, 560)),
    ("download (1).png", "Cow", (680, 300, 925, 580)),
    ("download (1).png", "Duck", (10, 570, 225, 810)),
    ("download (1).png", "Whale", (405, 580, 740, 825)),
    ("download (1).png", "Starfish", (245, 795, 555, 1125)),
    ("download (1).png", "Fox", (575, 810, 850, 1140)),
    ("download (1).png", "Pig", (10, 1130, 180, 1385)),
    ("download (1).png", "Crab", (205, 1130, 475, 1390)),
    ("download (1).png", "Shark", (500, 1130, 825, 1395)),
    ("download (1).png", "Hippopotamus", (845, 985, 1190, 1390)),
    ("download (1).png", "Bee", (0, 1380, 270, 1705)),
    ("download (1).png", "Leopard", (270, 1400, 490, 1690)),
    ("download (1).png", "Clownfish", (475, 1375, 805, 1680)),
    ("download (1).png", "Gorilla", (785, 1340, 1170, 1745)),
    ("download (1).png", "Jellyfish", (350, 1720, 550, 2048)),
    ("download (1).png", "Parrot", (555, 1670, 875, 2048)),
    ("download (1).png", "Dragonfly", (900, 1760, 1200, 2048)),
    ("download (3).png", "Tiger", (400, 10, 735, 385)),
    ("download (3).png", "Bear", (470, 410, 735, 785)),
    ("download (3).png", "Snake", (850, 800, 1170, 1145)),
    ("download (3).png", "Zebra", (365, 1175, 700, 1575)),
    ("download (3).png", "Rhinoceros", (810, 1185, 1140, 1540)),
    ("download (3).png", "Wolf", (735, 1580, 1170, 1995)),
]


def main() -> None:
    opened: dict[str, Image.Image] = {}
    entries = []
    for card_number, (source_name, animal_name, box) in enumerate(ANIMALS, start=1):
        source = opened.setdefault(source_name, Image.open(SOURCE_ROOT / source_name))
        crop = center_foreground(source.crop(box))
        crop = ImageEnhance.Contrast(crop).enhance(1.03)
        crop = crop.filter(ImageFilter.UnsharpMask(radius=1.1, percent=110, threshold=3))
        fitted = ImageOps.contain(crop, (448, 448), Image.Resampling.LANCZOS)
        card = Image.new("RGB", (512, 512), "#ffffff")
        card.paste(fitted, ((512 - fitted.width) // 2, (512 - fitted.height) // 2))
        filename = f"{card_number:02d}-{slugify(animal_name)}-photo.jpg"
        card.save(OUTPUT / filename, "JPEG", quality=93, optimize=True, progressive=True)
        entries.append({"id": card_number, "name": animal_name, "file": filename})

    if len(entries) != 42 or len({entry["name"] for entry in entries}) != 42:
        raise RuntimeError("Animal set must contain exactly 42 unique animal types")

    (OUTPUT / "manifest.json").write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")
    runtime = (
        'window.MEMORY_GAME_CARD_MANIFESTS = window.MEMORY_GAME_CARD_MANIFESTS || {}; '
        'window.MEMORY_GAME_CARD_MANIFESTS["animals"] = '
        + json.dumps(entries) + ";\n"
    )
    (OUTPUT / "manifest.runtime.js").write_text(runtime, encoding="utf-8")
    print(f"Extracted {len(entries)} unique animal types to {OUTPUT}")


if __name__ == "__main__":
    main()
