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

At that revision, models 7–10 kept a shared source frame across two colors; this
was an incomplete color preview and is superseded by the update below. The repeatable conversion
script uses the installed Chrome canvas encoder and does not alter the generated pixels
other than contain-sizing and WebP compression.

## Colorway completion — 2026-09-23

Added `solecraft-07-black`, `solecraft-08-mint`, `solecraft-09-white`, and
`solecraft-10-black`, each in 1200×900 and 600×450 WebP, under
`public/media/products/`. Built-in ImageGen edited the corresponding original
fictional model. No external photography or new paid service was introduced.

Prompt set: precise-object-edit; recolor only (07 navy upper → black, 08 white
upper → mint, 09 blue upper → white, 10 burgundy mesh → black); preserve silhouette,
panels, seams, sole, camera and framing. A second background-only pass replaces
the generated checkerboard with solid Cold Paper `#F3F6FA`. Final images are opaque;
they must not be described as alpha-transparent. Final responsive files were
visually inspected. Source PNGs remain in the local ImageGen output directory.

`resolveProductImageAsset` selects these reviewed derivatives using the exact
variant color, shared by catalog/PDP/cart adapters. This is a presentation mapping
for existing media paths; it does not alter inventory IDs, SKU, prices, stock,
product ownership, database media records, or historical order snapshots.

The demo still has 32 named products built from 10 reusable fictional silhouettes.
This update fixes color preview identity, not a claim of 32 independently sourced
physical shoe designs. See the current UX audit for remaining editorial limitations.

## Replaced legacy media

The original training storefront's low-resolution raster assets had unverified public
merchandising rights. They were removed from the current public tree on 2026-09-11 and
are no longer used or deployed. Their historical origin and prior limitation remain
documented in Git history; this replacement does not rewrite the inherited commits.
