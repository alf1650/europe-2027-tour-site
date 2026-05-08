#!/usr/bin/env python3
"""Download high-quality travel photos from Unsplash for the Europe 2027 tour site."""

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ACCESS_KEY = "4ZkBNNou1tIFyLOHmJfPrdg3m-6vnNiu6DjRDAhjUHI"
BASE_API = "https://api.unsplash.com"
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "photos"
MANIFEST_PATH = ROOT / "data" / "local_gallery.json"

# (city_label, search_query, count)
SEARCHES = [
    ("Brussels", "Brussels Belgium", 8),
    ("Brussels", "Grand Place Brussels", 5),
    ("Brussels", "Brussels architecture", 4),
    ("Slovenia", "Lake Bled Slovenia", 10),
    ("Slovenia", "Ljubljana Slovenia", 6),
    ("Slovenia", "Slovenia landscape mountains", 6),
    ("London", "London skyline", 8),
    ("London", "Tower Bridge London", 6),
    ("London", "London city street", 5),
]


def fetch_json(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sanitize_filename(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", name)


def download_file(url: str, out_path: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "EuropeTourSiteBot/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        out_path.write_bytes(resp.read())


def run() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    headers = {
        "Authorization": f"Client-ID {ACCESS_KEY}",
        "Accept-Version": "v1",
    }

    seen_ids: set[str] = set()
    manifest: list[dict] = []

    for city, query, count in SEARCHES:
        encoded = urllib.parse.quote(query)
        url = f"{BASE_API}/search/photos?query={encoded}&per_page={count}&orientation=landscape&content_filter=high"
        print(f"Searching: '{query}' (want {count})")
        try:
            data = fetch_json(url, headers)
        except Exception as e:
            print(f"  API error: {e}")
            continue

        results = data.get("results", [])
        collected = 0
        for photo in results:
            pid = photo.get("id", "")
            if pid in seen_ids:
                continue
            seen_ids.add(pid)

            img_url = photo.get("urls", {}).get("regular", "")  # ~1080px wide
            if not img_url:
                continue

            user = photo.get("user", {})
            artist = user.get("name", "Unknown")
            artist_link = user.get("links", {}).get("html", "https://unsplash.com")
            alt = photo.get("alt_description") or photo.get("description") or query
            filename = sanitize_filename(f"{city.lower()}_{pid}.jpg")
            out_path = OUT_DIR / filename

            if not out_path.exists():
                try:
                    download_file(img_url, out_path)
                    # Unsplash requires a download trigger for stats
                    dl_url = photo.get("links", {}).get("download_location", "")
                    if dl_url:
                        try:
                            fetch_json(dl_url + f"?client_id={ACCESS_KEY}", {})
                        except Exception:
                            pass
                    print(f"  ✓ {filename} — {alt[:60]}")
                except Exception as e:
                    print(f"  ✗ {pid}: {e}")
                    continue

            manifest.append({
                "city": city,
                "title": alt,
                "imagePath": f"assets/photos/{filename}",
                "sourceUrl": photo.get("links", {}).get("html", ""),
                "license": "Unsplash License",
                "artist": artist,
                "artistUrl": artist_link,
                "attribution": f"Photo by {artist} on Unsplash",
                "width": photo.get("width", 0),
                "height": photo.get("height", 0),
            })
            collected += 1
            time.sleep(0.1)  # gentle rate limiting

        print(f"  → {collected} photos for {city}/{query}")

    MANIFEST_PATH.write_text(json.dumps({"images": manifest}, indent=2), encoding="utf-8")
    print(f"\nTotal: {len(manifest)} photos downloaded")
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    run()
