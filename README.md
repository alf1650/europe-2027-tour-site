# Europe 2027 Gathering Tour Reference Site

A lightweight static site for your June 2027 gathering trip plan:
- timeline by confirmed flight dates
- destination chapters (Brussels, Slovenia, London)
- curated free photo/resource links
- live Wikimedia free-photo gallery by city
- shortlist builder with CSV export for attribution workflow
- day-by-day media focus suggestions
- official planning references

## Run locally

```bash
cd /Users/alfredlim/Personal/europe-2027-tour-site
python3 -m http.server 8090
open http://localhost:8090
```

## Download And Serve Local Photos

Use the built-in script to download license-aware images from Wikimedia Commons into `assets/photos/` and generate `data/local_gallery.json`.

```bash
cd /Users/alfredlim/Personal/europe-2027-tour-site
python3 scripts/download_wikimedia_gallery.py
```

Then in the site, switch gallery source from `Live Wikimedia` to `Local Downloaded`.

Important: this workflow is for allowed sources with attribution metadata. Do not force-download copyrighted images from arbitrary sites.

## Files

- `index.html`: main page
- `styles.css`: visual style and layout
- `script.js`: renders timeline/resources from JSON data
- `data/itinerary.json`: date and chapter source of truth
- `data/resources.json`: free photo sources + official reference links
- `REFERENCE_PLAN.md`: detailed planning notes and day-by-day outline
- `image_inventory_template.csv`: attribution and license tracking sheet

## How to curate images safely

1. Open links listed under Free Photo Resources.
2. Use Live Free Photo Picks and click "Add to shortlist" on favorites.
3. In Shortlist Builder, use "Copy attribution" for per-image credits when drafting content.
4. Export shortlist CSV and merge rows into `image_inventory_template.csv`.
5. Keep attribution text and license note for every selected image.
6. For Wikimedia, verify the license on each individual file page.

## Modes

- Public mode: `index.html?mode=public`
- Private mode: `index.html?mode=private`

Note: mode is a presentation flag, not real authentication.

## Suggested first curation target

- Brussels: 20-25 photos
- Slovenia: 28-35 photos
- London: 20-25 photos
- Transit and airport mood: 12-15 photos

Total: about 80-110 photos
