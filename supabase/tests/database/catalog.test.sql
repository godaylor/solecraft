begin;

create extension if not exists pgtap with schema extensions;

select plan(34);

select has_table('public', 'brands', 'brands table exists');
select has_table('public', 'products', 'products table exists');
select has_table('public', 'product_variants', 'product variants table exists');
select has_table('public', 'inventory', 'inventory table exists');
select has_view('public', 'catalog_products', 'catalog projection exists');
select has_index('public', 'tags', 'tags_type_idx', 'tag type index exists');
select has_index(
  'public',
  'product_tags',
  'product_tags_tag_product_idx',
  'reverse product-tag index exists'
);
select has_index(
  'public',
  'inventory',
  'inventory_size_stock_idx',
  'inventory size/stock index exists'
);

select ok(
  exists (
    select 1
    from pg_class
    cross join lateral unnest(coalesce(pg_class.reloptions, array[]::text[])) as options(option)
    where pg_class.oid = 'public.catalog_products'::regclass
      and options.option = 'security_invoker=true'
  ),
  'catalog view uses security_invoker'
);

select is(
  (
    select count(*)::integer
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = any (
        array[
          'brands',
          'categories',
          'products',
          'tags',
          'product_tags',
          'product_variants',
          'product_media',
          'sizes',
          'brand_size_guide_entries',
          'inventory'
        ]
      )
      and pg_class.relrowsecurity
  ),
  10,
  'RLS is enabled on every exposed catalog table'
);

select is(
  (select count(*) from public.products where status = 'published'),
  32::bigint,
  'seed contains 32 published products'
);
select is(
  (select count(*) from public.catalog_products),
  32::bigint,
  'catalog projection contains 32 published products'
);
select is(
  (select count(*) from public.products where status = 'draft'),
  1::bigint,
  'seed keeps one draft for deny-path tests'
);

select throws_matching(
  $$insert into public.product_variants (
    id,
    product_id,
    slug,
    color_slug,
    color_name,
    color_code,
    price_minor,
    compare_at_minor,
    currency
  ) values (
    '29000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'invalid-price-variant',
    'invalid-price',
    'Некорректная цена',
    '#000000',
    100000,
    90000,
    'RUB'
  )$$,
  'violates check constraint',
  'variant rejects compare-at price below current price'
);

select throws_matching(
  $$insert into public.inventory (
    id,
    variant_id,
    size_id,
    sku,
    stock_on_hand
  ) values (
    '49000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000010',
    '03000000-0000-4000-8000-000000000001',
    'PARA-INVALID-STOCK',
    -1
  )$$,
  'violates check constraint',
  'inventory rejects negative stock'
);

select throws_matching(
  $$update public.brand_size_guide_entries
    set foot_length_min_mm = 999,
        foot_length_max_mm = 100
    where brand_id = '01000000-0000-4000-8000-000000000001'
      and size_id = '03000000-0000-4000-8000-000000000001'$$,
  'violates check constraint',
  'size guide rejects inverted millimeter range'
);

select ok(
  has_table_privilege('anon', 'public.products', 'SELECT'),
  'anon has explicit catalog SELECT grant'
);
select ok(
  not has_table_privilege('anon', 'public.products', 'INSERT'),
  'anon has no product INSERT grant'
);

insert into public.product_variants (
  id,
  product_id,
  slug,
  color_slug,
  color_name,
  color_code,
  price_minor,
  currency,
  is_default
)
values (
  '29000000-0000-4000-8000-000000000099',
  '10000000-0000-4000-8000-000000000099',
  'draft-internal-sample-black',
  'black',
  'Чёрный',
  '#171C26',
  100000,
  'RUB',
  true
);

set local role anon;

select is(
  (select count(*) from public.products),
  32::bigint,
  'anon reads published products'
);
select is(
  (select count(*) from public.products where slug = 'draft-internal-sample'),
  0::bigint,
  'anon cannot read draft products'
);
select is(
  (select count(*) from public.catalog_products),
  32::bigint,
  'anon reads the public catalog view'
);
select is(
  (
    select count(*)
    from public.product_variants
    where slug = 'draft-internal-sample-black'
  ),
  0::bigint,
  'anon cannot infer draft variants'
);
select throws_matching(
  $$insert into public.products (
    id,
    slug,
    brand_id,
    category_id,
    model,
    title,
    description
  ) values (
    '19000000-0000-4000-8000-000000000001',
    'anon-write-attempt',
    '01000000-0000-4000-8000-000000000001',
    '02000000-0000-4000-8000-000000000001',
    'Denied',
    'Denied',
    'Denied'
  )$$,
  'permission denied',
  'anon product write fails closed'
);

reset role;
set local role authenticated;

select is(
  (select count(*) from public.catalog_products),
  32::bigint,
  'authenticated public catalog read matches anon'
);

reset role;

select is(
  (select count(*) from public.product_tags),
  64::bigint,
  'each published product has two typed use-case tags'
);
select is(
  (
    select count(*)
    from public.brand_size_guide_entries
    where provenance = 'unknown'
      and foot_length_min_mm is null
      and foot_length_max_mm is null
  ),
  12::bigint,
  'unknown brand guide entries do not invent millimeter conversion'
);
select is(
  (select count(*) from public.inventory),
  768::bigint,
  'seed creates two variants by twelve sizes for every product'
);
select is(
  (
    select count(*)
    from public.inventory
    where stock_on_hand < 0
  ),
  0::bigint,
  'seed stock is non-negative'
);
select is(
  (
    select count(*)
    from (
      select sku
      from public.inventory
      group by sku
      having count(*) > 1
    ) as duplicate_skus
  ),
  0::bigint,
  'seed SKUs are unique'
);
select is(
  (
    select count(*)
    from (
      select variants.product_id
      from public.product_variants as variants
      join public.products as products on products.id = variants.product_id
      where variants.is_default
        and products.status = 'published'
      group by variants.product_id
      having count(*) = 1
    ) as defaults
  ),
  32::bigint,
  'every published product has one default variant'
);
select is(
  (
    select count(*)
    from public.catalog_products
    where cardinality(use_case_slugs) <> 2
  ),
  0::bigint,
  'catalog projection preserves typed use-case tags'
);
select is(
  (
    select count(*)
    from public.catalog_products
    where image_width <> 266 or image_height <> 224
  ),
  0::bigint,
  'catalog media dimensions are explicit'
);
select is(
  (
    select count(*)
    from public.catalog_products
    where fit_provenance = 'unknown'
  ),
  2::bigint,
  'seed includes explicit not-assessed fit provenance'
);
select is(
  (
    select count(*)
    from public.catalog_products
    where price_minor < 0 or total_stock < 0
  ),
  0::bigint,
  'catalog projection exposes only valid price and stock'
);

select * from finish();

rollback;
