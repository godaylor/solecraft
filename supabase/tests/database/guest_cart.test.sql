begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select has_view('public', 'cart_inventory_items', 'cart reconciliation view exists');
select ok(
  exists (
    select 1 from pg_class
    cross join lateral unnest(coalesce(pg_class.reloptions, array[]::text[])) options(option)
    where pg_class.oid = 'public.cart_inventory_items'::regclass
      and options.option = 'security_invoker=true'
  ),
  'cart reconciliation view uses security_invoker'
);
select is((select count(*) from public.cart_inventory_items), 768::bigint, 'every published SKU is reconcilable');
select is((select count(*) from public.cart_inventory_items where inventory_id is null or sku is null), 0::bigint, 'cart projection always has stable identity and SKU');

set local role anon;
select ok(has_table_privilege('anon', 'public.cart_inventory_items', 'SELECT'), 'anon has explicit reconciliation read grant');
select is((select count(*) from public.cart_inventory_items where product_slug = 'draft-internal-sample'), 0::bigint, 'anon cannot reconcile draft inventory');
reset role;

select * from finish();
rollback;
