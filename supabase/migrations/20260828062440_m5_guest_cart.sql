create view public.cart_inventory_items
with (security_invoker = true)
as
select
  inventory.id as inventory_id,
  inventory.sku,
  inventory.stock_on_hand,
  inventory.updated_at as inventory_updated_at,
  sizes.id as size_id,
  sizes.display_label as size_label,
  variants.id as variant_id,
  variants.slug as variant_slug,
  variants.color_slug,
  variants.color_name,
  variants.price_minor,
  variants.compare_at_minor,
  variants.currency,
  products.id as product_id,
  products.slug as product_slug,
  products.model,
  products.title,
  brands.name as brand_name,
  media.storage_path as image_path,
  media.alt as image_alt,
  media.width as image_width,
  media.height as image_height
from public.inventory
join public.sizes on sizes.id = inventory.size_id
join public.product_variants as variants on variants.id = inventory.variant_id
join public.products on products.id = variants.product_id
join public.brands on brands.id = products.brand_id
left join lateral (
  select product_media.storage_path, product_media.alt, product_media.width, product_media.height
  from public.product_media
  where product_media.variant_id = variants.id
  order by product_media.position, product_media.id
  limit 1
) as media on true
where products.status = 'published';

revoke all on table public.cart_inventory_items from anon, authenticated;
grant select on table public.cart_inventory_items to anon, authenticated;

comment on view public.cart_inventory_items is
  'Authoritative reconciliation projection for exact cart inventory identities.';
