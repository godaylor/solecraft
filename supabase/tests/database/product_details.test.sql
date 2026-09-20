begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select has_view('public', 'product_details', 'product details projection exists');
select ok(
  exists (
    select 1 from pg_class
    cross join lateral unnest(coalesce(pg_class.reloptions, array[]::text[])) as options(option)
    where pg_class.oid = 'public.product_details'::regclass
      and options.option = 'security_invoker=true'
  ),
  'product details view uses security_invoker'
);
select is((select count(*) from public.product_details), 32::bigint, 'only published products have PDP rows');
select is(
  (select jsonb_array_length(variants) from public.product_details where slug = 'sever-signal-01'),
  2,
  'PDP contains both colorways'
);
select is(
  (select jsonb_array_length(variants -> 0 -> 'inventory') from public.product_details where slug = 'sever-signal-01'),
  12,
  'each colorway carries exact size inventory identities'
);
select ok(
  (select bool_and(item ? 'inventoryId' and item ? 'sku' and item ? 'stock')
   from public.product_details,
   lateral jsonb_array_elements(variants) variant,
   lateral jsonb_array_elements(variant -> 'inventory') item),
  'inventory projection carries stable identity, SKU and stock'
);
select is(
  (
    select count(*)
    from (
      select variants.product_id
      from public.product_variants as variants
      join public.product_media as media on media.variant_id = variants.id
      group by variants.product_id
      having count(distinct substring(media.storage_path from 'solecraft-([0-9]{2})')) <> 1
    ) as mismatched_products
  ),
  0::bigint,
  'every colorway of a product keeps the same shoe silhouette asset family'
);
select is(
  (
    select count(*)
    from public.product_media as media
    join public.product_variants as variants on variants.id = media.variant_id
    join public.products as products on products.id = variants.product_id
    where media.storage_path <> '/media/products/solecraft-' ||
      lpad((mod((products.merch_rank / 10)::integer - 1, 10) + 1)::text, 2, '0') ||
      case
        when variants.is_default
          or mod((products.merch_rank / 10)::integer - 1, 10) + 1 > 6
          then ''
        else '-' || variants.color_slug
      end ||
      '.webp'
  ),
  0::bigint,
  'every variant resolves to its reviewed base or same-model alternate asset'
);

set local role anon;
select is((select count(*) from public.product_details), 32::bigint, 'anon can read published PDP rows');
select is((select count(*) from public.product_details where slug = 'draft-internal-sample'), 0::bigint, 'anon cannot infer draft PDP data');
reset role;

select * from finish();
rollback;
