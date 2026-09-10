create type public.order_status as enum (
  'placed', 'processing', 'shipped', 'delivered', 'cancelled'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique check (order_number ~ '^PARA-[A-F0-9]{12}$'),
  user_id uuid references auth.users (id) on update cascade on delete set null,
  status public.order_status not null default 'placed',
  contact_email text not null check (length(contact_email) between 3 and 254),
  contact_phone text check (contact_phone is null or length(contact_phone) between 5 and 32),
  currency text not null check (currency = 'RUB'),
  subtotal_minor integer not null check (subtotal_minor >= 0),
  delivery_minor integer not null check (delivery_minor >= 0),
  total_minor integer not null check (total_minor = subtotal_minor + delivery_minor),
  payment_scenario text not null check (payment_scenario = 'demo_success'),
  idempotency_key uuid not null unique,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on update cascade on delete cascade,
  product_id uuid references public.products (id) on update cascade on delete set null,
  inventory_id uuid references public.inventory (id) on update cascade on delete set null,
  product_name_snapshot text not null,
  brand_name_snapshot text not null,
  sku_snapshot text not null,
  size_snapshot text not null,
  color_snapshot text not null,
  unit_price_minor integer not null check (unit_price_minor >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total_minor integer not null check (line_total_minor = unit_price_minor * quantity),
  currency text not null check (currency = 'RUB'),
  created_at timestamptz not null default now()
);

create table public.order_addresses (
  order_id uuid primary key references public.orders (id) on update cascade on delete cascade,
  recipient_name text not null check (length(trim(recipient_name)) between 2 and 120),
  city text not null check (length(trim(city)) between 2 and 120),
  address_line text not null check (length(trim(address_line)) between 5 and 240),
  postal_code text check (postal_code is null or length(trim(postal_code)) between 3 and 16),
  created_at timestamptz not null default now()
);

create table private.order_receipt_capabilities (
  order_id uuid primary key references public.orders (id) on update cascade on delete cascade,
  token_hash bytea not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index orders_user_placed_idx on public.orders (user_id, placed_at desc, id desc)
  where user_id is not null;
create index order_items_order_idx on public.order_items (order_id, id);
create index order_items_inventory_idx on public.order_items (inventory_id)
  where inventory_id is not null;
create index receipt_capabilities_expiry_idx on private.order_receipt_capabilities (expires_at);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_addresses enable row level security;
alter table private.order_receipt_capabilities enable row level security;

create policy "Owners read their orders" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners read their order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid()))
  );
create policy "Owners read their delivery snapshot" on public.order_addresses
  for select to authenticated using (
    exists (select 1 from public.orders where orders.id = order_addresses.order_id and orders.user_id = (select auth.uid()))
  );

revoke all on table public.orders, public.order_items, public.order_addresses from anon, authenticated;
grant select on table public.orders, public.order_items, public.order_addresses to authenticated;
revoke all on table private.order_receipt_capabilities from public, anon, authenticated;

create function private.create_order_internal(
  p_lines jsonb,
  p_contact jsonb,
  p_delivery jsonb,
  p_payment_scenario text,
  p_idempotency_key uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_order public.orders%rowtype;
  created_order public.orders%rowtype;
  subtotal integer;
  delivery integer;
  conflict_id text;
  receipt_token text;
begin
  if p_payment_scenario = 'demo_decline' then
    raise exception 'demo_payment_declined' using errcode = 'P0001';
  elsif p_payment_scenario = 'demo_timeout' then
    raise exception 'demo_payment_timeout' using errcode = 'P0001';
  elsif p_payment_scenario <> 'demo_success' then
    raise exception 'invalid_payment_scenario' using errcode = '22023';
  end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'empty_checkout' using errcode = '22023';
  end if;
  if coalesce(length(trim(p_contact ->> 'email')), 0) < 3
    or coalesce(length(trim(p_delivery ->> 'recipientName')), 0) < 2
    or coalesce(length(trim(p_delivery ->> 'city')), 0) < 2
    or coalesce(length(trim(p_delivery ->> 'addressLine')), 0) < 5 then
    raise exception 'invalid_checkout_details' using errcode = '22023';
  end if;

  select * into existing_order
  from public.orders where idempotency_key = p_idempotency_key;
  if found then
    if existing_order.user_id is distinct from p_user_id then
      raise exception 'checkout_unavailable' using errcode = '42501';
    end if;
    if existing_order.user_id is null then
      receipt_token := encode(extensions.gen_random_bytes(32), 'hex');
      insert into private.order_receipt_capabilities (order_id, token_hash, expires_at)
      values (existing_order.id, extensions.digest(receipt_token, 'sha256'), now() + interval '24 hours')
      on conflict (order_id) do update
      set token_hash = excluded.token_hash, expires_at = excluded.expires_at, created_at = now();
    end if;
    return jsonb_build_object(
      'orderNumber', existing_order.order_number,
      'userOwned', existing_order.user_id is not null,
      'receiptToken', receipt_token,
      'idempotentReplay', true
    );
  end if;

  perform inventory.id
  from public.inventory
  join (
    select (item ->> 'inventoryId')::uuid as inventory_id,
      least(10, sum(greatest(1, (item ->> 'quantity')::integer)))::integer as quantity
    from jsonb_array_elements(p_lines) source(item)
    where item ? 'inventoryId' and item ? 'quantity'
    group by (item ->> 'inventoryId')::uuid
  ) requested on requested.inventory_id = inventory.id
  order by inventory.id
  for update of inventory;

  select requested.inventory_id::text into conflict_id
  from (
    select (item ->> 'inventoryId')::uuid as inventory_id,
      least(10, sum(greatest(1, (item ->> 'quantity')::integer)))::integer as quantity
    from jsonb_array_elements(p_lines) source(item)
    where item ? 'inventoryId' and item ? 'quantity'
    group by (item ->> 'inventoryId')::uuid
  ) requested
  left join public.inventory on inventory.id = requested.inventory_id
  left join public.product_variants on product_variants.id = inventory.variant_id
  left join public.products on products.id = product_variants.product_id
  where inventory.id is null or inventory.stock_on_hand < requested.quantity or products.status <> 'published'
  order by requested.inventory_id
  limit 1;
  if conflict_id is not null then
    raise exception 'stock_conflict:%', conflict_id using errcode = 'P0001';
  end if;

  select sum(product_variants.price_minor * requested.quantity)::integer into subtotal
  from (
    select (item ->> 'inventoryId')::uuid as inventory_id,
      least(10, sum(greatest(1, (item ->> 'quantity')::integer)))::integer as quantity
    from jsonb_array_elements(p_lines) source(item)
    group by (item ->> 'inventoryId')::uuid
  ) requested
  join public.inventory on inventory.id = requested.inventory_id
  join public.product_variants on product_variants.id = inventory.variant_id;
  delivery := case when subtotal >= 1500000 then 0 else 49000 end;

  insert into public.orders (
    order_number, user_id, contact_email, contact_phone, currency,
    subtotal_minor, delivery_minor, total_minor, payment_scenario, idempotency_key
  ) values (
    'PARA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    p_user_id,
    lower(trim(p_contact ->> 'email')),
    nullif(trim(p_contact ->> 'phone'), ''),
    'RUB', subtotal, delivery, subtotal + delivery, 'demo_success', p_idempotency_key
  ) returning * into created_order;

  insert into public.order_addresses (
    order_id, recipient_name, city, address_line, postal_code
  ) values (
    created_order.id,
    trim(p_delivery ->> 'recipientName'),
    trim(p_delivery ->> 'city'),
    trim(p_delivery ->> 'addressLine'),
    nullif(trim(p_delivery ->> 'postalCode'), '')
  );

  insert into public.order_items (
    order_id, product_id, inventory_id, product_name_snapshot, brand_name_snapshot,
    sku_snapshot, size_snapshot, color_snapshot, unit_price_minor, quantity,
    line_total_minor, currency
  )
  select created_order.id, products.id, inventory.id, products.model, brands.name,
    inventory.sku, sizes.display_label, product_variants.color_name,
    product_variants.price_minor, requested.quantity,
    product_variants.price_minor * requested.quantity, product_variants.currency
  from (
    select (item ->> 'inventoryId')::uuid as inventory_id,
      least(10, sum(greatest(1, (item ->> 'quantity')::integer)))::integer as quantity
    from jsonb_array_elements(p_lines) source(item)
    group by (item ->> 'inventoryId')::uuid
  ) requested
  join public.inventory on inventory.id = requested.inventory_id
  join public.sizes on sizes.id = inventory.size_id
  join public.product_variants on product_variants.id = inventory.variant_id
  join public.products on products.id = product_variants.product_id
  join public.brands on brands.id = products.brand_id;

  update public.inventory
  set stock_on_hand = inventory.stock_on_hand - requested.quantity,
      updated_at = now()
  from (
    select (item ->> 'inventoryId')::uuid as inventory_id,
      least(10, sum(greatest(1, (item ->> 'quantity')::integer)))::integer as quantity
    from jsonb_array_elements(p_lines) source(item)
    group by (item ->> 'inventoryId')::uuid
  ) requested
  where inventory.id = requested.inventory_id;

  if p_user_id is null then
    receipt_token := encode(extensions.gen_random_bytes(32), 'hex');
    insert into private.order_receipt_capabilities (order_id, token_hash, expires_at)
    values (created_order.id, extensions.digest(receipt_token, 'sha256'), now() + interval '24 hours');
  end if;

  return jsonb_build_object(
    'orderNumber', created_order.order_number,
    'userOwned', created_order.user_id is not null,
    'receiptToken', receipt_token,
    'idempotentReplay', false
  );
end;
$$;

revoke all on function private.create_order_internal(jsonb, jsonb, jsonb, text, uuid, uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.create_order_internal(jsonb, jsonb, jsonb, text, uuid, uuid) to anon, authenticated;

create function public.create_order(
  p_lines jsonb,
  p_contact jsonb,
  p_delivery jsonb,
  p_payment_scenario text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_order_internal(
    p_lines, p_contact, p_delivery, p_payment_scenario, p_idempotency_key, auth.uid()
  );
$$;
revoke all on function public.create_order(jsonb, jsonb, jsonb, text, uuid) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, jsonb, text, uuid) to anon, authenticated;

create function private.read_guest_receipt_internal(p_order_number text, p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'orderNumber', orders.order_number,
    'status', orders.status,
    'currency', orders.currency,
    'subtotalMinor', orders.subtotal_minor,
    'deliveryMinor', orders.delivery_minor,
    'totalMinor', orders.total_minor,
    'placedAt', orders.placed_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productName', order_items.product_name_snapshot,
        'brandName', order_items.brand_name_snapshot,
        'sku', order_items.sku_snapshot,
        'size', order_items.size_snapshot,
        'color', order_items.color_snapshot,
        'unitPriceMinor', order_items.unit_price_minor,
        'quantity', order_items.quantity,
        'lineTotalMinor', order_items.line_total_minor
      ) order by order_items.id)
      from public.order_items where order_items.order_id = orders.id
    ), '[]'::jsonb)
  )
  from public.orders
  join private.order_receipt_capabilities capabilities on capabilities.order_id = orders.id
  where orders.order_number = p_order_number
    and orders.user_id is null
    and capabilities.expires_at > now()
    and capabilities.token_hash = extensions.digest(coalesce(p_token, ''), 'sha256');
$$;
revoke all on function private.read_guest_receipt_internal(text, text) from public;
grant execute on function private.read_guest_receipt_internal(text, text) to anon, authenticated;

create function public.read_guest_receipt(p_order_number text, p_token text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.read_guest_receipt_internal(p_order_number, p_token);
$$;
revoke all on function public.read_guest_receipt(text, text) from public, anon, authenticated;
grant execute on function public.read_guest_receipt(text, text) to anon, authenticated;

comment on table public.order_items is 'Immutable order-line snapshots; client roles have read-only owner access.';
comment on table private.order_receipt_capabilities is 'Guest receipt token hashes with short TTL; raw tokens are never stored.';
