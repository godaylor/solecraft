-- Keep product identity, variant IDs, inventory IDs and order/cart references stable.
-- Only the merchandising color metadata and media path change.

update public.product_variants as variants
set
  slug = 'media-fix-' || right(replace(variants.id::text, '-', ''), 12),
  color_slug = 'media-fix-' || right(replace(variants.id::text, '-', ''), 12)
from public.products as products
where products.id = variants.product_id
  and products.status = 'published';

with colorways (
  asset_no,
  default_slug,
  default_name,
  default_code,
  alternate_slug,
  alternate_name,
  alternate_code
) as (
  values
    (1, 'white', 'Белый', '#F3F6FA', 'black', 'Чёрный', '#171C26'),
    (2, 'white', 'Белый', '#F3F6FA', 'black', 'Чёрный', '#171C26'),
    (3, 'graphite', 'Графит', '#515966', 'blue', 'Синий', '#315CF5'),
    (4, 'graphite', 'Графит', '#515966', 'white', 'Белый', '#F3F6FA'),
    (5, 'graphite', 'Графит', '#515966', 'burgundy', 'Бордовый', '#763B4B'),
    (6, 'mint', 'Мятный', '#8CCBB4', 'navy', 'Тёмно-синий', '#22345F'),
    (7, 'navy', 'Тёмно-синий', '#22345F', 'black', 'Чёрный', '#171C26'),
    (8, 'white', 'Белый', '#F3F6FA', 'mint', 'Мятный', '#8CCBB4'),
    (9, 'blue', 'Синий', '#315CF5', 'white', 'Белый', '#F3F6FA'),
    (10, 'burgundy', 'Бордовый', '#763B4B', 'black', 'Чёрный', '#171C26')
),
resolved as (
  select
    variants.id,
    products.slug as product_slug,
    case when variants.is_default then colorways.default_slug else colorways.alternate_slug end as color_slug,
    case when variants.is_default then colorways.default_name else colorways.alternate_name end as color_name,
    case when variants.is_default then colorways.default_code else colorways.alternate_code end as color_code
  from public.product_variants as variants
  join public.products as products on products.id = variants.product_id
  join colorways
    on colorways.asset_no = mod((products.merch_rank / 10)::integer - 1, 10) + 1
  where products.status = 'published'
)
update public.product_variants as variants
set
  slug = resolved.product_slug || '-' || resolved.color_slug,
  color_slug = resolved.color_slug,
  color_name = resolved.color_name,
  color_code = resolved.color_code
from resolved
where resolved.id = variants.id;

update public.product_media as media
set
  storage_path = '/media/products/solecraft-' ||
    lpad((mod((products.merch_rank / 10)::integer - 1, 10) + 1)::text, 2, '0') ||
    case
      when variants.is_default
        or mod((products.merch_rank / 10)::integer - 1, 10) + 1 > 6
        then ''
      else '-' || variants.color_slug
    end ||
    '.webp',
  alt = products.title || ', цвет «' || variants.color_name || '», вид сбоку',
  width = 1200,
  height = 900
from public.product_variants as variants
join public.products as products on products.id = variants.product_id
where media.variant_id = variants.id
  and products.status = 'published';
