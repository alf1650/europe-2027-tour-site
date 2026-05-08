#!/usr/bin/env python3
"""Download license-aware Wikimedia Commons images for local gallery use.

Fetches images from specific Wikimedia Commons categories for high-quality
travel photography of Brussels, Slovenia, and London.
"""

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

BASE_API = "https://commons.wikimedia.org/w/api.php"
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "photos"
MANIFEST_PATH = ROOT / "data" / "local_gallery.json"

# (city_label, wikimedia_category, max_images)
CATEGORIES = [
    ("Brussels", "Photographs of Brussels", 10),
    ("Brussels", "Grand Place, Brussels", 8),
    ("Brussels", "Manneken Pis", 4),
    ("Slovenia", "Photographs of Slovenia", 6),
    ("Slovenia", "Lake Bled", 10),
    ("Slovenia", "Ljubljana", 8),
    ("London", "Photographs of London", 8),
    ("London", "Tower Bridge", 8),
    ("London", "Big Ben", 6),
]

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "EuropeTourSiteBot/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sanitize_filename(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", name)


def artist_text(meta: dict) -> str:
    raw = meta.get("Artist", {}).get("value", "Unknown creator")
    return re.sub(r"<[^>]+>", "", str(raw)).strip() or "Unknown creator"


def download_file(url: str, out_path: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "EuropeTourSiteBot/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        out_path.write_bytes(resp.read())


def fetch_category_images(category: str, limit: int) -> list[dict]:
    """Fetch image file info from a Wikimedia Commons category."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "categorymembers",
        "gcmtitle": f"Category:{category}",
        "gcmtype": "file",
        "gcmlimit": str(min(limit * 3, 50)),  # fetch more than needed to filter
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime",
        "iiurlwidth": "1200",
    }
    url = f"{BASE_API}?{urllib.parse.urlencode(params)}"
    try:
        data = fetch_json(url)
    except Exception as e:
        print(f"  API error for '{category}': {e}")
        return []
    pages = data.get("query", {}).get("pages", {})
    return list(pages.values())


def run() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    seen_sources: set[str] = set()
    manifest: list[dict] = []

    for city, category, max_count in CATEGORIES:
        print(f"Fetching category: {category} (target: {max_count})")
        pages = fetch_category_images(category, max_count)
        collected = 0

        for page in pages:
            if collected >= max_count:
                break
            info_list = page.get("imageinfo", [])
            if not info_list:
                continue
            info = info_list[0]

            # Only keep image types
            mime = info.get("mime", "")
            if not mime.startswith("image/"):
                continue

            src_url = info.get("descriptionurl", "")
            img_url = info.get("thumburl") or info.get("url", "")
            if not src_url or not img_url or src_url in seen_sources:
                continue

            # Check extension is allowed
            ext = Path(urllib.parse.urlparse(img_url).path).suffix.lower()
            if ext not in ALLOWED_EXT:
                ext = ".jpg"

            meta = info.get("extmetadata", {})
            license_name = meta.get("LicenseShortName", {}).get("value", "See source")
            artist = artist_text(meta)
            title = str(page.get("title", "File:Untitled")).replace("File:", "").strip()

            safe_name = sanitize_filename(f"{city.lower()}_{title}")
            local_name = (safe_name[:130] + ext) if len(safe_name) > 130 else safe_name + ext
            out_path = OUT_DIR / local_name

            if not out_path.exists():
                try:
                    download_file(img_url, out_path)
                    print(f"  ✓ {local_name}")
                except Exception as e:
                    print(f"  ✗ Failed {title}: {e}")
                    continue

            seen_sources.add(src_url)
            manifest.append({
                "city": city,
                "title": title,
                "imagePath": f"assets/photos/{local_name}",
                "sourceUrl": src_url,
                "license": license_name,
                "artist": artist,
                "attribution": f"Photo by {artist} — {license_name}",
            })
            collected += 1

        print(f"  → {collected} images collected for {city}/{category}")

    MANIFEST_PATH.write_text(json.dumps({"images": manifest}, indent=2), encoding="utf-8")
    print(f"\nTotal: {len(manifest)} images downloaded")
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    run()
