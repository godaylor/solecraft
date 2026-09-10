create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on update cascade on delete cascade,
  display_name text check (display_name is null or length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wishlist_items (
  user_id uuid not null references auth.users (id) on update cascade on delete cascade,
  product_id uuid not null references public.products (id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  cart_id uuid not null references public.carts (id) on update cascade on delete cascade,
  inventory_id uuid not null references public.inventory (id) on update cascade on delete restrict,
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cart_id, inventory_id)
);

create index wishlist_items_product_user_idx on public.wishlist_items (product_id, user_id);
create index cart_items_inventory_cart_idx on public.cart_items (inventory_id, cart_id);

alter table public.profiles enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

create policy "Owners read their profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Owners update their profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Owners read their wishlist" on public.wishlist_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners add published wishlist products" on public.wishlist_items
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.products
      where products.id = wishlist_items.product_id and products.status = 'published'
    )
  );
create policy "Owners delete their wishlist" on public.wishlist_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Owners read their cart" on public.carts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners create their cart" on public.carts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update their cart" on public.carts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owners delete their cart" on public.carts
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Owners read their cart items" on public.cart_items
  for select to authenticated using (
    exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid()))
  );
create policy "Owners add their cart items" on public.cart_items
  for insert to authenticated with check (
    exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid()))
    and exists (
      select 1 from public.inventory
      join public.product_variants on product_variants.id = inventory.variant_id
      join public.products on products.id = product_variants.product_id
      where inventory.id = cart_items.inventory_id and products.status = 'published'
    )
  );
create policy "Owners update their cart items" on public.cart_items
  for update to authenticated
  using (
    exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid()))
  );
create policy "Owners delete their cart items" on public.cart_items
  for delete to authenticated using (
    exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid()))
  );

revoke all on table public.profiles, public.wishlist_items, public.carts, public.cart_items from anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, delete on table public.wishlist_items to authenticated;
grant select, insert, update, delete on table public.carts, public.cart_items to authenticated;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function public.merge_guest_commerce(
  p_cart jsonb default '[]'::jsonb,
  p_wishlist uuid[] default array[]::uuid[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_cart_id uuid;
  merged_cart_count integer := 0;
  merged_wishlist_count integer := 0;
  unavailable jsonb := '[]'::jsonb;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.carts (user_id)
  values (current_user_id)
  on conflict (user_id) do update set updated_at = public.carts.updated_at
  returning id into current_cart_id;

  with requested as (
    select
      (item ->> 'inventoryId')::uuid as inventory_id,
      least(10, greatest(1, (item ->> 'quantity')::integer)) as quantity
    from jsonb_array_elements(
      case when jsonb_typeof(p_cart) = 'array' then p_cart else '[]'::jsonb end
    ) as source(item)
    where item ? 'inventoryId' and item ? 'quantity'
  ), normalized as (
    select inventory_id, least(10, sum(quantity))::integer as quantity
    from requested group by inventory_id
  )
  insert into public.cart_items (cart_id, inventory_id, quantity)
  select current_cart_id, normalized.inventory_id,
    least(normalized.quantity, inventory.stock_on_hand)
  from normalized
  join public.inventory on inventory.id = normalized.inventory_id
  join public.product_variants on product_variants.id = inventory.variant_id
  join public.products on products.id = product_variants.product_id
  where inventory.stock_on_hand > 0 and products.status = 'published'
  on conflict (cart_id, inventory_id) do update
  set quantity = least(
        10,
        (select stock_on_hand from public.inventory where id = excluded.inventory_id),
        greatest(public.cart_items.quantity, excluded.quantity)
      ),
      updated_at = now();
  get diagnostics merged_cart_count = row_count;

  insert into public.wishlist_items (user_id, product_id)
  select current_user_id, products.id
  from unnest(coalesce(p_wishlist, array[]::uuid[])) as requested(product_id)
  join public.products on products.id = requested.product_id
  where products.status = 'published'
  on conflict (user_id, product_id) do nothing;
  get diagnostics merged_wishlist_count = row_count;

  select coalesce(jsonb_agg(distinct item ->> 'inventoryId'), '[]'::jsonb)
  into unavailable
  from jsonb_array_elements(
    case when jsonb_typeof(p_cart) = 'array' then p_cart else '[]'::jsonb end
  ) as source(item)
  where not exists (
    select 1 from public.inventory
    join public.product_variants on product_variants.id = inventory.variant_id
    join public.products on products.id = product_variants.product_id
    where inventory.id = (item ->> 'inventoryId')::uuid
      and inventory.stock_on_hand > 0
      and products.status = 'published'
  );

  return jsonb_build_object(
    'cartMerged', merged_cart_count,
    'wishlistMerged', merged_wishlist_count,
    'unavailableInventoryIds', unavailable
  );
end;
$$;

revoke all on function public.merge_guest_commerce(jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.merge_guest_commerce(jsonb, uuid[]) to authenticated;

comment on function public.merge_guest_commerce(jsonb, uuid[]) is
  'Retry-safe deterministic guest cart/wishlist union for the current authenticated owner.';
