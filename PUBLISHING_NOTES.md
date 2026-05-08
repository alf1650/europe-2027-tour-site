# Publishing Notes

## Modes

The site supports query-string mode flags:

- Public mode: `index.html?mode=public`
- Private mode: `index.html?mode=private`

This is a presentation mode toggle (labeling and intent), not authentication.

## Recommended Hosting

- GitHub Pages for quick static hosting
- Cloudflare Pages for custom domain and edge caching

## Pre-publish Checklist

1. Verify all itinerary dates and flight details.
2. Confirm every selected image has a valid reuse license.
3. Record attribution in `image_inventory_template.csv`.
4. Click through all resource links for destination pages.
5. Test on mobile and desktop.

## If You Need Real Access Control

For true private access, add one of these:

1. Cloudflare Access with email OTP.
2. Password gate in front of static files.
3. Repository-based private preview (non-public link + authentication).
