begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'wishlist_items', 'wishlist table exists');
select has_table('public', 'carts', 'authenticated carts table exists');
select has_table('public', 'cart_items', 'authenticated cart items table exists');
select is(
  (select count(*)::integer from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
   where pg_namespace.nspname = 'public' and pg_class.relname = any(array['profiles','wishlist_items','carts','cart_items']) and pg_class.relrowsecurity),
  4,
  'RLS is enabled on every exposed M6 owner table'
);
select ok(not has_table_privilege('anon', 'public.wishlist_items', 'SELECT'), 'anon has no wishlist grant');
select ok(has_table_privilege('authenticated', 'public.wishlist_items', 'INSERT'), 'authenticated has explicit wishlist insert grant');
select ok(not has_function_privilege('anon', 'public.merge_guest_commerce(jsonb,uuid[])', 'EXECUTE'), 'anon cannot execute merge');
select ok(has_function_privilege('authenticated', 'public.merge_guest_commerce(jsonb,uuid[])', 'EXECUTE'), 'authenticated can execute narrow merge');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values
  ('90000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.test', crypt('Owner-pass-1', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('90000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other@example.test', crypt('Other-pass-1', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}');

select is((select count(*) from public.profiles where id::text like '90000000-%'), 2::bigint, 'auth trigger creates both profiles');

select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

insert into public.wishlist_items (user_id, product_id)
values ('90000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001');
select is((select count(*) from public.wishlist_items), 1::bigint, 'owner inserts and reads own wishlist');

insert into public.carts (id, user_id)
values ('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001');
insert into public.cart_items (cart_id, inventory_id, quantity)
values ('91000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000001001', 1);
select is((select count(*) from public.cart_items), 1::bigint, 'owner inserts and reads own exact cart item');

select lives_ok(
  $$select public.merge_guest_commerce(
    '[{"inventoryId":"40000000-0000-4000-8000-000000001001","quantity":2}]'::jsonb,
    array['10000000-0000-4000-8000-000000000002']::uuid[]
  )$$,
  'owner merge succeeds'
);
select is((select quantity from public.cart_items where inventory_id = '40000000-0000-4000-8000-000000001001'), 2, 'merge chooses deterministic maximum quantity');
select is((select count(*) from public.wishlist_items), 2::bigint, 'merge unions wishlist IDs');
select lives_ok(
  $$select public.merge_guest_commerce(
    '[{"inventoryId":"40000000-0000-4000-8000-000000001001","quantity":2}]'::jsonb,
    array['10000000-0000-4000-8000-000000000002']::uuid[]
  )$$,
  'merge retry succeeds'
);
select is((select quantity from public.cart_items where inventory_id = '40000000-0000-4000-8000-000000001001'), 2, 'merge retry is idempotent');
select is((select count(*) from public.wishlist_items), 2::bigint, 'wishlist merge retry is idempotent');

reset role;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.wishlist_items), 0::bigint, 'other user cannot read owner wishlist');
select is((select count(*) from public.carts), 0::bigint, 'other user cannot read owner cart');
select is((select count(*) from public.cart_items), 0::bigint, 'other user cannot read owner cart items');
select throws_matching(
  $$insert into public.wishlist_items (user_id, product_id)
    values ('90000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003')$$,
  'new row violates row-level security policy',
  'other user cannot spoof wishlist owner'
);
select throws_matching(
  $$insert into public.cart_items (cart_id, inventory_id, quantity)
    values ('91000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000001002', 1)$$,
  'new row violates row-level security policy',
  'other user cannot write owner cart'
);
select is_empty(
  $$update public.carts set user_id = '90000000-0000-4000-8000-000000000002'
    where id = '91000000-0000-4000-8000-000000000001' returning 1$$,
  'other user cannot reassign hidden cart ownership'
);

reset role;
select * from finish();
rollback;
