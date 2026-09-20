# Catalog media sources

## Current production media

The ten catalog/PDP sneaker assets in `public/media/products/` were generated for
Solecraft with OpenAI ImageGen on 2026-09-11. They depict original fictional footwear:
no retailer photography, remote image URL, brand logo, product mark, or recognizable
named model was used as an input or requested in the prompts.

- Source PNGs: generated directly from text prompts; no reference images.
- Published derivatives: transparent WebP at 1200×900 and 600×450.
- Intended use: Solecraft catalog cards, cart thumbnails, PDP gallery, screenshots, and
  portfolio documentation.
- Shared prompt constraints: one complete fictional shoe, consistent right-facing studio
  angle, transparent background, no text/logo/watermark/person, and Solecraft's Cold
  Paper / Asphalt / Transit Blue / Sole Orange / Gauge Mint palette.
- Product-specific prompts cover all-day cushioning, office minimalism, wide fit,
  wet-weather support, everyday stability, light training, firm city movement, soft
  office wear, airy long walks, and protected urban weather use.

The responsive derivatives were produced lossily from the generated PNGs with Sharp;
this is a format/size transformation only. The database seed stores the 1200×900 source
dimensions and the frontend exposes a 600w/1200w `srcset`.

## Colorway consistency update — 2026-09-18

Six alternate colorway assets were generated with OpenAI ImageGen by editing the
corresponding fictional source shoe. Each edit explicitly preserves the same silhouette,
camera angle, panel geometry, sole, crop, lighting and transparent background while only
changing material colors. They are published as responsive 1200×900 and 600×450 WebP:

- `solecraft-01-black`, `solecraft-02-black`;
- `solecraft-03-blue`, `solecraft-04-white`;
- `solecraft-05-burgundy`, `solecraft-06-navy`.

Models 7–10 keep their single multi-tone source frame for both described palette facets;
the database never substitutes a different shoe silhouette. The repeatable conversion
script uses the installed Chrome canvas encoder and does not alter the generated pixels
other than contain-sizing and WebP compression.

## Replaced legacy media

The original training storefront's low-resolution raster assets had unverified public
merchandising rights. They were removed from the current public tree on 2026-09-11 and
are no longer used or deployed. Their historical origin and prior limitation remain
documented in Git history; this replacement does not rewrite the inherited commits.
