# Catalog media sources

## Editorial city photograph — 2026-10-17

`public/media/editorial/city-route.webp` (1600×1067) and
`city-route-800.webp` (800×533) were created for the M10 redesign with the built-in
OpenAI ImageGen tool. Text-only generation; no external reference photograph.
The photograph contains no person, footwear, brand mark or readable signage and
is used only as city atmosphere. It never represents a catalog model/colorway.
The original PNG remains in the local ImageGen output; responsive derivatives
are saved in the project and encoded as WebP with the installed Chrome canvas.

Final prompt:

> Use case: photorealistic-natural. Asset type: wide editorial photograph for
> Solecraft, a modern city sneaker store. Create an art-directed architectural
> photograph of a quiet European urban pedestrian passage, long cool pale
> concrete stairs and blue painted handrails, graphic white road crossing
> markings on dark asphalt in foreground, a single small vivid orange street
> element. Morning sun casts crisp diagonal shadows. Materiality: real granular
> asphalt, brushed concrete, subtle imperfections. Composition: cinematic very
> wide horizontal frame 3:2, low street-level viewpoint looking through the
> passage, strong leading lines and depth, open uncluttered space on left, stairs
> on right. Sophisticated restrained contemporary streetwear campaign
> photography, film grain very subtle, cool light blue and charcoal palette with
> small orange accent. No people, no footwear, no cars, no text, no lettering, no
> logo, no watermark. This is a city atmosphere photograph, not a product
> photograph, not an illustration, not a rendered website.

All existing product/colorway files are retained. The visual review uses a common
Cold Paper media surface and avoids multiply blending, preserving displayed shoe
colors and opaque backgrounds. The catalog still deliberately shares ten
fictional silhouettes across 32 named products; this remains disclosed on PDP.

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

## Background cleanup — 2026-09-28

Visual V3 inspection found baked checkerboards in `solecraft-01-black`,
`solecraft-02-black`, `solecraft-04-white` and `solecraft-06-navy`. Built-in
ImageGen edited each existing fictional source, with instructions to replace
only the checkerboard background and preserve shoe color, silhouette, panels,
laces, sole and camera. Reviewed outputs use opaque Cold Paper `#F3F6FA`, not
alpha transparency. The existing canvas conversion script exported 1200×900
and 600×450 WebP. No external photography or additional service was introduced.
The other September 18 variants, 03-blue and 05-burgundy, retain transparency.

## Replaced legacy media

The original training storefront's low-resolution raster assets had unverified public
merchandising rights. They were removed from the current public tree on 2026-09-11 and
are no longer used or deployed. Their historical origin and prior limitation remain
documented in Git history; this replacement does not rewrite the inherited commits.
