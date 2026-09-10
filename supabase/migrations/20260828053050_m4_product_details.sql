create view public.product_details
with (security_invoker = true)
as
select
  products.id,
  products.slug,
  products.model,
  products.title,
  products.description,
  products.fit_width,
  products.cushioning,
  products.support_level,
  products.fit_note,
  products.fit_provenance,
  products.fit_source_note,
  products.fit_reviewed_at,
  brands.id as brand_id,
  brands.slug as brand_slug,
  brands.name as brand_name,
  categories.id as category_id,
  categories.slug as category_slug,
  categories.name as category_name,
  coalesce(use_cases.items, '[]'::jsonb) as use_cases,
  coalesce(variant_details.items, '[]'::jsonb) as variants,
  coalesce(size_guide.items, '[]'::jsonb) as size_guide
from public.products
join public.brands on brands.id = products.brand_id
join public.categories on categories.id = products.category_id
left join lateral (
  select jsonb_agg(
    jsonb_build_object('slug', tags.slug, 'label', tags.label)
    order by tags.label, tags.id
  ) as items
  from public.product_tags
  join public.tags on tags.id = product_tags.tag_id
  where product_tags.product_id = products.id and tags.type = 'use_case'
) as use_cases on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', variants.id,
      'slug', variants.slug,
      'colorSlug', variants.color_slug,
      'colorName', variants.color_name,
      'colorCode', variants.color_code,
      'priceMinor', variants.price_minor,
      'compareAtMinor', variants.compare_at_minor,
      'currency', variants.currency,
      'isDefault', variants.is_default,
      'media', coalesce(media.items, '[]'::jsonb),
      'inventory', coalesce(variant_inventory.items, '[]'::jsonb)
    )
    order by variants.is_default desc, variants.color_name, variants.id
  ) as items
  from public.product_variants as variants
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', product_media.id,
        'kind', product_media.kind,
        'src', product_media.storage_path,
        'alt', product_media.alt,
        'width', product_media.width,
        'height', product_media.height,
        'position', product_media.position
      )
      order by product_media.position, product_media.id
    ) as items
    from public.product_media
    where product_media.variant_id = variants.id
  ) as media on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'inventoryId', inventory.id,
        'sku', inventory.sku,
        'stock', inventory.stock_on_hand,
        'sizeId', sizes.id,
        'sizeLabel', sizes.display_label,
        'sizeValue', sizes.value,
        'sortOrder', sizes.sort_order
      )
      order by sizes.sort_order, inventory.id
    ) as items
    from public.inventory
    join public.sizes on sizes.id = inventory.size_id
    where inventory.variant_id = variants.id
  ) as variant_inventory on true
  where variants.product_id = products.id
) as variant_details on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'sizeId', sizes.id,
      'sizeLabel', sizes.display_label,
      'sizeValue', sizes.value,
      'sortOrder', sizes.sort_order,
      'footLengthMinMm', guide.foot_length_min_mm,
      'footLengthMaxMm', guide.foot_length_max_mm,
      'provenance', guide.provenance,
      'sourceNote', guide.source_note,
      'reviewedAt', guide.reviewed_at
    )
    order by sizes.sort_order, sizes.id
  ) as items
  from public.brand_size_guide_entries as guide
  join public.sizes on sizes.id = guide.size_id
  where guide.brand_id = products.brand_id
) as size_guide on true
where products.status = 'published';

revoke all on table public.product_details from anon, authenticated;
grant select on table public.product_details to anon, authenticated;

comment on view public.product_details is
  'Published PDP projection with colorway media, exact sellable inventory, and sourced fit guidance.';
