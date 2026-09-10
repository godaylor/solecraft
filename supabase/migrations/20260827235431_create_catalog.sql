create type public.product_status as enum ('draft', 'published', 'archived');
create type public.fit_width as enum ('narrow', 'standard', 'wide', 'extra_wide', 'unknown');
create type public.cushioning as enum ('firm', 'balanced', 'soft', 'unknown');
create type public.support_level as enum ('flexible', 'balanced', 'structured', 'unknown');
create type public.fit_note as enum ('runs_small', 'true_to_size', 'runs_large', 'unknown');
create type public.data_provenance as enum ('manufacturer', 'editorial_demo', 'unknown');
create type public.tag_type as enum ('use_case', 'collection');
create type public.media_kind as enum ('catalog', 'gallery');

create table public.brands (
  id uuid primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  brand_id uuid not null references public.brands (id) on update cascade on delete restrict,
  category_id uuid not null references public.categories (id) on update cascade on delete restrict,
  model text not null check (length(trim(model)) > 0),
  title text not null check (length(trim(title)) > 0),
  description text not null check (length(trim(description)) > 0),
  status public.product_status not null default 'draft',
  fit_width public.fit_width not null default 'unknown',
  cushioning public.cushioning not null default 'unknown',
  support_level public.support_level not null default 'unknown',
  fit_note public.fit_note not null default 'unknown',
  fit_provenance public.data_provenance not null default 'unknown',
  fit_source_note text,
  fit_reviewed_at date,
  merch_rank integer not null default 1000 check (merch_rank >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null),
  check (
    fit_provenance = 'unknown'
    or (fit_source_note is not null and fit_reviewed_at is not null)
  )
);

create table public.tags (
  id uuid primary key,
  type public.tag_type not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label text not null check (length(trim(label)) > 0),
  created_at timestamptz not null default now(),
  unique (type, slug)
);

create table public.product_tags (
  product_id uuid not null references public.products (id) on update cascade on delete cascade,
  tag_id uuid not null references public.tags (id) on update cascade on delete restrict,
  primary key (product_id, tag_id)
);

create table public.product_variants (
  id uuid primary key,
  product_id uuid not null references public.products (id) on update cascade on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  color_slug text not null check (color_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  color_name text not null check (length(trim(color_name)) > 0),
  color_code text not null check (color_code ~ '^#[0-9A-Fa-f]{6}$'),
  price_minor integer not null check (price_minor >= 0),
  compare_at_minor integer check (
    compare_at_minor is null or compare_at_minor > price_minor
  ),
  currency text not null default 'RUB' check (currency = 'RUB'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, slug),
  unique (product_id, color_slug)
);

create unique index product_variants_one_default_idx
  on public.product_variants (product_id)
  where is_default;

create table public.product_media (
  id uuid primary key,
  variant_id uuid not null references public.product_variants (id) on update cascade on delete cascade,
  kind public.media_kind not null default 'catalog',
  storage_path text not null check (length(trim(storage_path)) > 0),
  alt text not null check (length(trim(alt)) > 0),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (variant_id, position)
);

create table public.sizes (
  id uuid primary key,
  system text not null check (system = 'EU'),
  value numeric(4, 1) not null check (value >= 30 and value <= 55),
  display_label text not null check (length(trim(display_label)) > 0),
  sort_order integer not null check (sort_order >= 0),
  unique (system, value),
  unique (system, display_label),
  unique (system, sort_order)
);

create table public.brand_size_guide_entries (
  brand_id uuid not null references public.brands (id) on update cascade on delete cascade,
  size_id uuid not null references public.sizes (id) on update cascade on delete cascade,
  foot_length_min_mm integer,
  foot_length_max_mm integer,
  provenance public.data_provenance not null default 'unknown',
  source_note text,
  reviewed_at date,
  primary key (brand_id, size_id),
  check (
    (
      provenance = 'unknown'
      and foot_length_min_mm is null
      and foot_length_max_mm is null
      and source_note is null
      and reviewed_at is null
    )
    or (
      provenance <> 'unknown'
      and foot_length_min_mm is not null
      and foot_length_max_mm is not null
      and foot_length_min_mm > 0
      and foot_length_min_mm <= foot_length_max_mm
      and source_note is not null
      and reviewed_at is not null
    )
  )
);

create table public.inventory (
  id uuid primary key,
  variant_id uuid not null references public.product_variants (id) on update cascade on delete cascade,
  size_id uuid not null references public.sizes (id) on update cascade on delete restrict,
  sku text not null unique check (sku ~ '^[A-Z0-9-]+$'),
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  updated_at timestamptz not null default now(),
  unique (variant_id, size_id)
);

create index products_status_brand_idx on public.products (status, brand_id);
create index products_status_category_idx on public.products (status, category_id);
create index products_catalog_order_idx
  on public.products (status, merch_rank, published_at desc, id);
create index tags_type_idx on public.tags (type);
create index product_tags_tag_product_idx on public.product_tags (tag_id, product_id);
create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_color_idx on public.product_variants (color_slug, product_id);
create index product_variants_price_idx on public.product_variants (price_minor, product_id);
create index product_media_variant_idx on public.product_media (variant_id, position);
create index brand_size_guide_size_idx
  on public.brand_size_guide_entries (size_id, brand_id);
create index inventory_variant_idx on public.inventory (variant_id);
create index inventory_size_stock_idx
  on public.inventory (size_id, stock_on_hand, variant_id);
create index inventory_positive_stock_idx
  on public.inventory (variant_id, size_id)
  where stock_on_hand > 0;

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.tags enable row level security;
alter table public.product_tags enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.sizes enable row level security;
alter table public.brand_size_guide_entries enable row level security;
alter table public.inventory enable row level security;

create policy "Public brands are readable"
  on public.brands for select to anon, authenticated using (true);
create policy "Public categories are readable"
  on public.categories for select to anon, authenticated using (true);
create policy "Published products are readable"
  on public.products for select to anon, authenticated
  using (status = 'published');
create policy "Public tags are readable"
  on public.tags for select to anon, authenticated using (true);
create policy "Published product tags are readable"
  on public.product_tags for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products
      where products.id = product_tags.product_id
        and products.status = 'published'
    )
  );
create policy "Published product variants are readable"
  on public.product_variants for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products
      where products.id = product_variants.product_id
        and products.status = 'published'
    )
  );
create policy "Published product media are readable"
  on public.product_media for select to anon, authenticated
  using (
    exists (
      select 1
      from public.product_variants
      join public.products on products.id = product_variants.product_id
      where product_variants.id = product_media.variant_id
        and products.status = 'published'
    )
  );
create policy "Public sizes are readable"
  on public.sizes for select to anon, authenticated using (true);
create policy "Public size guides are readable"
  on public.brand_size_guide_entries for select to anon, authenticated using (true);
create policy "Published inventory is readable"
  on public.inventory for select to anon, authenticated
  using (
    exists (
      select 1
      from public.product_variants
      join public.products on products.id = product_variants.product_id
      where product_variants.id = inventory.variant_id
        and products.status = 'published'
    )
  );

revoke all on table public.brands from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.tags from anon, authenticated;
revoke all on table public.product_tags from anon, authenticated;
revoke all on table public.product_variants from anon, authenticated;
revoke all on table public.product_media from anon, authenticated;
revoke all on table public.sizes from anon, authenticated;
revoke all on table public.brand_size_guide_entries from anon, authenticated;
revoke all on table public.inventory from anon, authenticated;

grant select on table public.brands to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.tags to anon, authenticated;
grant select on table public.product_tags to anon, authenticated;
grant select on table public.product_variants to anon, authenticated;
grant select on table public.product_media to anon, authenticated;
grant select on table public.sizes to anon, authenticated;
grant select on table public.brand_size_guide_entries to anon, authenticated;
grant select on table public.inventory to anon, authenticated;

create view public.catalog_products
with (security_invoker = true)
as
select
  products.id,
  products.slug,
  brands.id as brand_id,
  brands.slug as brand_slug,
  brands.name as brand_name,
  categories.id as category_id,
  categories.slug as category_slug,
  categories.name as category_name,
  products.model,
  products.title,
  products.description,
  products.fit_width,
  products.cushioning,
  products.support_level,
  products.fit_note,
  products.fit_provenance,
  products.fit_source_note,
  products.fit_reviewed_at,
  products.merch_rank,
  products.published_at,
  default_variant.id as default_variant_id,
  default_variant.slug as default_variant_slug,
  default_variant.color_slug as default_color_slug,
  default_variant.color_name as default_color_name,
  default_variant.color_code as default_color_code,
  default_variant.price_minor,
  default_variant.compare_at_minor,
  default_variant.currency,
  primary_media.storage_path as image_path,
  primary_media.alt as image_alt,
  primary_media.width as image_width,
  primary_media.height as image_height,
  coalesce(tag_summary.use_case_slugs, array[]::text[]) as use_case_slugs,
  coalesce(tag_summary.use_case_labels, array[]::text[]) as use_case_labels,
  coalesce(variant_summary.color_slugs, array[]::text[]) as color_slugs,
  coalesce(variant_summary.color_names, array[]::text[]) as color_names,
  variant_summary.price_min_minor,
  variant_summary.price_max_minor,
  coalesce(inventory_summary.available_sizes, array[]::text[]) as available_sizes,
  coalesce(inventory_summary.total_stock, 0)::integer as total_stock,
  coalesce(inventory_summary.total_stock, 0) > 0 as in_stock,
  to_tsvector(
    'simple',
    concat_ws(
      ' ',
      products.title,
      products.model,
      brands.name,
      brands.slug,
      array_to_string(coalesce(tag_summary.use_case_labels, array[]::text[]), ' '),
      array_to_string(coalesce(tag_summary.use_case_slugs, array[]::text[]), ' ')
    )
  ) as search_document
from public.products
join public.brands on brands.id = products.brand_id
join public.categories on categories.id = products.category_id
join lateral (
  select variants.*
  from public.product_variants as variants
  where variants.product_id = products.id
  order by variants.is_default desc, variants.created_at, variants.id
  limit 1
) as default_variant on true
left join lateral (
  select media.storage_path, media.alt, media.width, media.height
  from public.product_media as media
  where media.variant_id = default_variant.id
  order by media.position, media.id
  limit 1
) as primary_media on true
left join lateral (
  select
    array_agg(tags.slug order by tags.slug)
      filter (where tags.type = 'use_case') as use_case_slugs,
    array_agg(tags.label order by tags.slug)
      filter (where tags.type = 'use_case') as use_case_labels
  from public.product_tags
  join public.tags on tags.id = product_tags.tag_id
  where product_tags.product_id = products.id
) as tag_summary on true
left join lateral (
  select
    array_agg(distinct variants.color_slug order by variants.color_slug) as color_slugs,
    array_agg(distinct variants.color_name order by variants.color_name) as color_names,
    min(variants.price_minor)::integer as price_min_minor,
    max(variants.price_minor)::integer as price_max_minor
  from public.product_variants as variants
  where variants.product_id = products.id
) as variant_summary on true
left join lateral (
  select
    array_agg(distinct sizes.display_label order by sizes.display_label)
      filter (where inventory.stock_on_hand > 0) as available_sizes,
    sum(inventory.stock_on_hand)::integer as total_stock
  from public.product_variants as variants
  join public.inventory on inventory.variant_id = variants.id
  join public.sizes on sizes.id = inventory.size_id
  where variants.product_id = products.id
) as inventory_summary on true
where products.status = 'published';

revoke all on table public.catalog_products from anon, authenticated;
grant select on table public.catalog_products to anon, authenticated;

comment on view public.catalog_products is
  'Public, RLS-backed catalog projection for the storefront. Contains published safe fields only.';
