begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

select has_table('public', 'orders', 'orders table exists');
select has_table('public', 'order_items', 'order item snapshots table exists');
select has_table('public', 'order_addresses', 'delivery snapshot table exists');
select has_table('private', 'order_receipt_capabilities', 'private receipt capability table exists');
select has_function('public', 'create_order', array['jsonb','jsonb','jsonb','text','uuid'], 'public checkout contract exists');
select has_function('public', 'read_guest_receipt', array['text','text'], 'guest receipt contract exists');
select is(
  (select count(*)::integer from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
   where pg_namespace.nspname = 'public' and pg_class.relname = any(array['orders','order_items','order_addresses']) and pg_class.relrowsecurity),
  3,
  'RLS protects every exposed order table'
);
select ok((select relrowsecurity from pg_class where oid = 'private.order_receipt_capabilities'::regclass), 'private receipt table also has RLS defense');
select ok(not has_table_privilege('anon', 'public.orders', 'INSERT'), 'anon cannot insert orders directly');
select ok(has_function_privilege('anon', 'public.create_order(jsonb,jsonb,jsonb,text,uuid)', 'EXECUTE'), 'anon can execute narrow checkout function');

create temporary table checkout_results (label text primary key, result jsonb);
grant select, insert, update on checkout_results to anon, authenticated;
create temporary table checkout_stock as
select stock_on_hand as before_checkout from public.inventory
where id = '40000000-0000-4000-8000-000000001001';

set local role anon;
select lives_ok(
  $$insert into checkout_results values (
    'first',
    public.create_order(
      '[{"inventoryId":"40000000-0000-4000-8000-000000001001","quantity":1}]',
      '{"email":"guest@example.test","phone":"+70000000000"}',
      '{"recipientName":"Гость Тест","city":"Москва","addressLine":"Тестовая улица, 1","postalCode":"101000"}',
      'demo_success',
      '70000000-0000-4000-8000-000000000001'
    )
  )$$,
  'guest atomic checkout succeeds'
);
select throws_matching($$select * from public.orders$$, 'permission denied', 'anon cannot read raw order table');
reset role;

select is((select count(*) from public.orders where idempotency_key = '70000000-0000-4000-8000-000000000001'), 1::bigint, 'checkout creates one order');
select is((select count(*) from public.order_items), 1::bigint, 'checkout creates one immutable line snapshot');
select is((select count(*) from public.order_addresses), 1::bigint, 'checkout creates one delivery snapshot');
select is(
  (select subtotal_minor from public.orders where idempotency_key = '70000000-0000-4000-8000-000000000001'),
  (select product_variants.price_minor from public.inventory join public.product_variants on product_variants.id = inventory.variant_id where inventory.id = '40000000-0000-4000-8000-000000001001'),
  'server derives authoritative catalog price'
);
select is(
  (select stock_on_hand from public.inventory where id = '40000000-0000-4000-8000-000000001001'),
  (select before_checkout - 1 from checkout_stock),
  'successful checkout atomically decrements stock'
);
select is(length((select result ->> 'receiptToken' from checkout_results where label = 'first')), 64, 'guest receives high-entropy opaque token');
select isnt(
  (select encode(token_hash, 'hex') from private.order_receipt_capabilities),
  (select result ->> 'receiptToken' from checkout_results where label = 'first'),
  'server stores only the receipt token hash'
);
select ok(
  public.read_guest_receipt(
    (select result ->> 'orderNumber' from checkout_results where label = 'first'),
    (select result ->> 'receiptToken' from checkout_results where label = 'first')
  ) is not null,
  'correct guest capability returns minimized receipt'
);
select ok(
  public.read_guest_receipt((select result ->> 'orderNumber' from checkout_results where label = 'first'), 'wrong-token') is null,
  'wrong guest capability fails closed'
);

create temporary table stock_after_first as
select stock_on_hand from public.inventory where id = '40000000-0000-4000-8000-000000001001';
set local role anon;
select lives_ok(
  $$insert into checkout_results values (
    'replay',
    public.create_order(
      '[{"inventoryId":"40000000-0000-4000-8000-000000001001","quantity":1}]',
      '{"email":"guest@example.test"}',
      '{"recipientName":"Гость Тест","city":"Москва","addressLine":"Тестовая улица, 1"}',
      'demo_success',
      '70000000-0000-4000-8000-000000000001'
    )
  )$$,
  'idempotent replay succeeds without a duplicate order'
);
reset role;
select is((select count(*) from public.orders where idempotency_key = '70000000-0000-4000-8000-000000000001'), 1::bigint, 'idempotency keeps one order');
select is(
  (select stock_on_hand from public.inventory where id = '40000000-0000-4000-8000-000000001001'),
  (select stock_on_hand from stock_after_first),
  'idempotent replay does not decrement stock twice'
);
select isnt((select result ->> 'receiptToken' from checkout_results where label = 'first'), (select result ->> 'receiptToken' from checkout_results where label = 'replay'), 'guest replay rotates receipt capability');
select ok(public.read_guest_receipt((select result ->> 'orderNumber' from checkout_results where label = 'first'), (select result ->> 'receiptToken' from checkout_results where label = 'first')) is null, 'rotated old capability fails closed');
select ok(public.read_guest_receipt((select result ->> 'orderNumber' from checkout_results where label = 'replay'), (select result ->> 'receiptToken' from checkout_results where label = 'replay')) is not null, 'rotated capability reads the same receipt');

select throws_matching(
  $$select public.create_order('[{"inventoryId":"40000000-0000-4000-8000-000000001002","quantity":1}]','{"email":"guest@example.test"}','{"recipientName":"Гость Тест","city":"Москва","addressLine":"Тестовая улица, 1"}','demo_decline','70000000-0000-4000-8000-000000000002')$$,
  'demo_payment_declined', 'demo decline creates no order'
);
select throws_matching(
  $$select public.create_order('[{"inventoryId":"40000000-0000-4000-8000-000000001002","quantity":1}]','{"email":"guest@example.test"}','{"recipientName":"Гость Тест","city":"Москва","addressLine":"Тестовая улица, 1"}','demo_timeout','70000000-0000-4000-8000-000000000003')$$,
  'demo_payment_timeout', 'demo timeout creates no order'
);
select throws_matching(
  $$select public.create_order('[{"inventoryId":"40000000-0000-4000-8000-000000001001","quantity":10}]','{"email":"guest@example.test"}','{"recipientName":"Гость Тест","city":"Москва","addressLine":"Тестовая улица, 1"}','demo_success','70000000-0000-4000-8000-000000000004')$$,
  'stock_conflict:', 'stock conflict aborts atomically with affected inventory identity'
);
select is((select count(*) from public.orders), 1::bigint, 'failed payment/conflict paths create no partial orders');
select ok(not has_table_privilege('authenticated', 'public.order_items', 'UPDATE'), 'order snapshots are immutable to clients');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '90000000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'checkout-owner@example.test', crypt('Owner-pass-9', gen_salt('bf')),
  now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'
);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000009","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$select public.create_order(
    '[{"inventoryId":"40000000-0000-4000-8000-000000001002","quantity":1}]',
    '{"email":"checkout-owner@example.test"}',
    '{"recipientName":"Владелец Тест","city":"Москва","addressLine":"Вторая улица, 2"}',
    'demo_success', '70000000-0000-4000-8000-000000000009'
  )$$,
  'authenticated checkout succeeds through the same contract'
);
select is((select count(*) from public.orders), 1::bigint, 'authenticated owner reads only their own order');
select is((select count(*) from public.order_items), 1::bigint, 'authenticated owner reads their item snapshot');
reset role;

select * from finish();
rollback;
