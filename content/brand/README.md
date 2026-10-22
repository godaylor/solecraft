# Solecraft sculpted sole emblem

Created 2026-10-23 for the existing Solecraft city sneaker store with the built-in
OpenAI ImageGen tool. No reference image or third-party brand mark was supplied.

- Source: `solecraft-emblem-source.png`, 1254×1254 PNG with genuine alpha.
- Published: `public/brand/solecraft-emblem-{96,192,384}.webp`.
- Header, footer, favicon, app icons and social preview use the same emblem.
- Responsive derivatives and social preview are reproducible with
  `node scripts/build-brand-assets.mjs` (installed local Chrome, no paid API).
- Resizing, canvas compositing and format conversion preserve the artwork; the
  generator is not called during app build or normal use.

The solid S is formed from a molded sneaker sole, replacing the previous thin
route-arrow brand mark. Transit Blue, icy white, Sole Orange and a small mint
insert connect the graphic to the existing product palette. The accompanying
wordmark remains actual text for clarity and accessibility.

## Final generation prompt

Create a single original premium brand emblem for SOLECRAFT, a city sneaker store. Deliver ONLY ONE standalone graphic emblem on a genuinely transparent alpha background, no text, no wordmark, no layout or mockup. Visual concept: an iconic compact sculptural letter S crafted out of two interlocking thick curved sneaker midsole forms, like an expertly molded piece of footwear design. Bold solid chunky silhouette, immediately recognizable at small sizes, NOT a thin line, NOT an arrow, NOT a slider, NOT a generic swoosh. Slight three-quarter isometric view with subtle realistic rubber material, rounded beveled edges and only a few oversized outsole tread notches. Main material vibrant Transit Blue #315CF5, cool blue highlights, pale icy white upper-facing surfaces, a small tasteful Sole Orange #FF7A45 rubber insert at one lower cut, with an extremely restrained mint accent if needed. Fresh, confident, urban and beautifully crafted. A memorable proprietary footwear symbol, akin to an expensive 3D app emblem but not inside an app square. Avoid excessive microtexture or busy detail. Balanced broadly square composition with the emblem occupying about 86 percent of the canvas, centered. No pedestal, no floor plane, no cast shadow outside the object, no background haze, no sparkles, no orbital rings, no floating decorative pieces, no existing brand symbols. Crisp high-resolution edges, polished professional art direction, strong readability on both near-white and dark navy web headers. Transparent background is mandatory.
