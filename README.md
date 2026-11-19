# Amber Studios — website

A complete rebuild of [amberstudios.hu](https://www.amberstudios.hu/en) using the
Stayscape Framer template as the visual and motion reference. Static HTML/CSS/JS,
no framework, no build step required to deploy.

## Structure

```
index.html … 21 static pages (home, studios, 6 studio pages, services, FAQ, legal …)
assets/css/style.css   design system (tokens, components, motion primitives)
assets/js/main.js      motion & interactions (word reveals, counters, marquees, menu, FAQ, parallax, Lenis smooth scroll)
assets/img/            WebP images from the original site (600 / 1000 / 1600 px)
assets/logo/           new logo: mark.svg, mark-line.svg, logo.svg, favicon.svg
build/content.js       all site content (taken from amberstudios.hu)
build/build.js         page generator → writes the HTML files
```

## Editing

1. Change text, links or prices in `build/content.js` (or a template in `build/build.js`).
2. Regenerate the pages:

```bash
node build/build.js
```

Images are already in `assets/img`. To re-import them from a folder of
`<id>-<width>.webp` files, run `node build/build.js --img-src <folder>`.

## Preview locally

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765>.

## Third-party integrations kept from the original site

- Booking engine: SimpleBooking portal 257 (plus hotel 10980 Gardenview / 10981 Terrace)
- Google reviews widget: Elfsight (home page)
- Chat / 24-7 online reception: respond.io widget (all pages)
- Airport transfer: Welcome Pickups
- Smooth scrolling: [Lenis](https://lenis.darkroom.engineering/) 1.3.11 from jsDelivr (same library the Stayscape reference uses); the site falls back to native scrolling if it does not load
- Map: Google Maps embed of Veres Pálné utca 26; the "Open in Maps" button links to the Amber Studios My Maps view with both properties
