begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

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

set local role anon;
select is((select count(*) from public.product_details), 32::bigint, 'anon can read published PDP rows');
select is((select count(*) from public.product_details where slug = 'draft-internal-sample'), 0::bigint, 'anon cannot infer draft PDP data');
reset role;

select * from finish();
rollback;
