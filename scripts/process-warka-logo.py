"""Remove white/light background from WARKA logo → transparent PNG + mark."""
from pathlib import Path
from PIL import Image

SRC = Path(
    r"C:\Users\ALGADEER_PC\.cursor\projects\d-Website\assets"
    r"\c__Users_ALGADEER_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images"
    r"_IMG-20260426-WA0198-8ae85a96-1a8b-43c0-9c96-d457a8ca852a.png"
)
ROOT = Path(__file__).resolve().parent.parent
OUT_PATHS = [
    ROOT / "public" / "assets" / "brand" / "warka-logo.png",
    ROOT / "pdf-generator" / "assets" / "warka-logo.png",
]
MARK_PATH = ROOT / "public" / "assets" / "brand" / "warka-mark.png"

# Pixels lighter than this (0–255) become transparent; keeps black logo + text.
LUMINANCE_THRESHOLD = 210


def luminance(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def remove_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if luminance(r, g, b) >= LUMINANCE_THRESHOLD:
                pixels[x, y] = (r, g, b, 0)
            else:
                # Solid black for logo strokes (cleaner on any background)
                pixels[x, y] = (0, 0, 0, 255)

    bbox = img.getbbox()
    if bbox:
        pad = 8
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(w, bbox[2] + pad)
        bottom = min(h, bbox[3] + pad)
        img = img.crop((left, top, right, bottom))

    return img


def extract_mark(logo: Image.Image) -> Image.Image:
    """Crop the circular emblem (upper portion before WARKA wordmark)."""
    mark_h = int(logo.height * 0.62)
    mark = logo.crop((0, 0, logo.width, mark_h))
    bbox = mark.getbbox()
    if bbox:
        pad = 4
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(mark.width, bbox[2] + pad)
        bottom = min(mark.height, bbox[3] + pad)
        mark = mark.crop((left, top, right, bottom))
    return mark


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source not found: {SRC}")

    logo = remove_background(Image.open(SRC))

    for out in OUT_PATHS:
        out.parent.mkdir(parents=True, exist_ok=True)
        logo.save(out, "PNG", optimize=True)
        print(f"Saved: {out} ({logo.size[0]}x{logo.size[1]})")

    mark = extract_mark(logo)
    MARK_PATH.parent.mkdir(parents=True, exist_ok=True)
    mark.save(MARK_PATH, "PNG", optimize=True)
    print(f"Saved mark: {MARK_PATH} ({mark.size[0]}x{mark.size[1]})")


if __name__ == "__main__":
    main()
