"""Regenerate WARKA mark assets from the full stacked logo (correct crop + padding)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "assets" / "brand"
LOGO_LIGHT = BRAND / "warka-logo-v3.png"
LOGO_DARK = BRAND / "warka-logo-on-dark-v3.png"

# Olive #5c6247 for light backgrounds; cream for dark
OLIVE = (92, 98, 71, 255)
CREAM = (245, 240, 230, 255)


def recolor_black(img: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 32:
                pixels[x, y] = color
    return img


def extract_emblem(logo: Image.Image) -> Image.Image:
    """Crop circular emblem from stacked logo with even padding (extra top safety)."""
    logo = logo.convert("RGBA")
    w, h = logo.size
    pixels = logo.load()

    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > 64:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    # Stop before WARKA wordmark (text sits in lower ~25% of logo)
    emblem_bottom = int(h * 0.68)
    for y in range(int(h * 0.55), int(h * 0.75)):
        row = sum(1 for x in range(w) if pixels[x, y][3] > 64)
        if row < 80:
            emblem_bottom = min(emblem_bottom, y)
            break

    max_y = min(max_y, emblem_bottom)

    pad_x = int((max_x - min_x) * 0.06)
    pad_top = int((max_y - min_y) * 0.10)
    pad_bottom = int((max_y - min_y) * 0.06)

    left = max(0, min_x - pad_x)
    top = max(0, min_y - pad_top)
    right = min(w, max_x + pad_x)
    bottom = min(h, max_y + pad_bottom)

    emblem = logo.crop((left, top, right, bottom))

    # Fit into square canvas so object-contain never clips asymmetrically
    ew, eh = emblem.size
    side = max(ew, eh)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    offset = ((side - ew) // 2, (side - eh) // 2)
    canvas.paste(emblem, offset, emblem)
    return canvas


def save_mark(logo_path: Path, out_path: Path, recolor: tuple[int, int, int, int] | None) -> None:
    logo = Image.open(logo_path)
    mark = extract_emblem(logo)
    if recolor:
        mark = recolor_black(mark, recolor)
    mark.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path.name}: {mark.size}, bbox={mark.getbbox()}")


def main() -> None:
    if not LOGO_LIGHT.exists():
        raise SystemExit(f"Missing {LOGO_LIGHT}")

    save_mark(LOGO_LIGHT, BRAND / "warka-mark-v4.png", OLIVE)
    save_mark(LOGO_LIGHT, BRAND / "warka-mark.png", OLIVE)

    if LOGO_DARK.exists():
        save_mark(LOGO_DARK, BRAND / "warka-mark-on-dark-v4.png", CREAM)
        save_mark(LOGO_DARK, BRAND / "warka-mark-on-dark.png", CREAM)
    else:
        save_mark(LOGO_LIGHT, BRAND / "warka-mark-on-dark-v4.png", CREAM)

    # Also refresh full logo top padding so stacked header use won't clip
    for name in ("warka-logo-v3.png", "warka-logo-on-dark-v3.png"):
        path = BRAND / name
        if not path.exists():
            continue
        img = Image.open(path).convert("RGBA")
        bbox = img.getbbox()
        if not bbox:
            continue
        pad = 12
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(img.width, bbox[2] + pad)
        bottom = min(img.height, bbox[3] + pad)
        cropped = img.crop((left, top, right, bottom))
        cw, ch = cropped.size
        canvas = Image.new("RGBA", (cw, ch + 8), (0, 0, 0, 0))
        canvas.paste(cropped, (0, 8), cropped)
        canvas.save(path, "PNG", optimize=True)
        print(f"Refreshed {name}: {canvas.size}")


if __name__ == "__main__":
    main()
