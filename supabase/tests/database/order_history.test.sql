begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select is(
  (select count(*)::integer from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
   where pg_namespace.nspname = 'public' and pg_class.relname = any(array['orders','order_items','order_addresses']) and pg_class.relrowsecurity),
  3,
  'RLS protects all exposed order history tables'
);
select ok(has_table_privilege('authenticated', 'public.orders', 'SELECT'), 'authenticated receives explicit owner-read grant');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values
  ('98000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'history-owner@example.test', crypt('Owner-pass-8', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('98000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'history-other@example.test', crypt('Other-pass-8', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}');

create temporary table m8_results (owner_label text primary key, result jsonb);
grant select, insert on m8_results to authenticated;

select set_config('request.jwt.claims', '{"sub":"98000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into m8_results values ('owner', public.create_order(
    '[{"inventoryId":"40000000-0000-4000-8000-000000001004","quantity":1}]',
    '{"email":"history-owner@example.test"}',
    '{"recipientName":"Владелец Истории","city":"Москва","addressLine":"Историческая улица, 8"}',
    'demo_success', '78000000-0000-4000-8000-000000000001'
  ))$$,
  'owner creates an order for history'
);
select is((select count(*) from public.orders), 1::bigint, 'owner list contains only their order');
select is((select count(*) from public.order_items), 1::bigint, 'owner reads immutable item snapshot');
select is((select count(*) from public.order_addresses), 1::bigint, 'owner reads delivery snapshot');
reset role;

select set_config('request.jwt.claims', '{"sub":"98000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into m8_results values ('other', public.create_order(
    '[{"inventoryId":"40000000-0000-4000-8000-000000001005","quantity":1}]',
    '{"email":"history-other@example.test"}',
    '{"recipientName":"Другой Владелец","city":"Казань","addressLine":"Другая улица, 2"}',
    'demo_success', '78000000-0000-4000-8000-000000000002'
  ))$$,
  'other user creates a separate order'
);
select is((select count(*) from public.orders), 1::bigint, 'other list contains only their own order');
select is(
  (select count(*) from public.orders where order_number = (select result ->> 'orderNumber' from m8_results where owner_label = 'owner')),
  0::bigint,
  'other direct owner order lookup reveals no row'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"98000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is(
  (select count(*) from public.orders where order_number = (select result ->> 'orderNumber' from m8_results where owner_label = 'other')),
  0::bigint,
  'owner direct foreign order lookup reveals no row'
);
reset role;

set local role anon;
select throws_matching($$select * from public.orders$$, 'permission denied', 'anonymous history access is denied');
reset role;

create temporary table owner_snapshot as
select order_items.product_name_snapshot, order_items.unit_price_minor
from public.order_items
join public.orders on orders.id = order_items.order_id
where orders.idempotency_key = '78000000-0000-4000-8000-000000000001';

update public.product_variants
set price_minor = price_minor + 12300
where id = (select variant_id from public.inventory where id = '40000000-0000-4000-8000-000000001004');
update public.products
set model = 'LIVE CATALOG CHANGED'
where id = (
  select product_variants.product_id from public.inventory
  join public.product_variants on product_variants.id = inventory.variant_id
  where inventory.id = '40000000-0000-4000-8000-000000001004'
);

select is(
  (select unit_price_minor from public.order_items join public.orders on orders.id = order_items.order_id where orders.idempotency_key = '78000000-0000-4000-8000-000000000001'),
  (select unit_price_minor from owner_snapshot),
  'order price snapshot stays unchanged after live price update'
);
select is(
  (select product_name_snapshot from public.order_items join public.orders on orders.id = order_items.order_id where orders.idempotency_key = '78000000-0000-4000-8000-000000000001'),
  (select product_name_snapshot from owner_snapshot),
  'order name snapshot stays unchanged after live product update'
);

delete from public.products where model = 'LIVE CATALOG CHANGED';
select ok(
  (select product_id is null and inventory_id is null from public.order_items join public.orders on orders.id = order_items.order_id where orders.idempotency_key = '78000000-0000-4000-8000-000000000001'),
  'deleted catalog references detach without deleting the historical line'
);
select is(
  (select product_name_snapshot from public.order_items join public.orders on orders.id = order_items.order_id where orders.idempotency_key = '78000000-0000-4000-8000-000000000001'),
  (select product_name_snapshot from owner_snapshot),
  'immutable order snapshot remains readable after catalog deletion'
);

select * from finish();
rollback;
