insert into public.brands (id, slug, name)
values
  ('01000000-0000-4000-8000-000000000001', 'sever', 'СЕВЕР'),
  ('01000000-0000-4000-8000-000000000002', 'forma', 'ФОРМА'),
  ('01000000-0000-4000-8000-000000000003', 'volna', 'ВОЛНА'),
  ('01000000-0000-4000-8000-000000000004', 'krug', 'КРУГ'),
  ('01000000-0000-4000-8000-000000000005', 'smena', 'СМЕНА'),
  ('01000000-0000-4000-8000-000000000006', 'luch', 'ЛУЧ');

insert into public.categories (id, slug, name)
values
  ('02000000-0000-4000-8000-000000000001', 'city', 'Город'),
  ('02000000-0000-4000-8000-000000000002', 'office', 'Офис'),
  ('02000000-0000-4000-8000-000000000003', 'weather', 'Непогода'),
  ('02000000-0000-4000-8000-000000000004', 'light-training', 'Лёгкая тренировка');

insert into public.tags (id, type, slug, label)
values
  ('04000000-0000-4000-8000-000000000001', 'use_case', 'city-walk', 'городская прогулка'),
  ('04000000-0000-4000-8000-000000000002', 'use_case', 'all-day', 'весь день'),
  ('04000000-0000-4000-8000-000000000003', 'use_case', 'office', 'офис'),
  ('04000000-0000-4000-8000-000000000004', 'use_case', 'wet-weather', 'мокрая погода'),
  ('04000000-0000-4000-8000-000000000005', 'use_case', 'light-training', 'лёгкая тренировка');

insert into public.sizes (id, system, value, display_label, sort_order)
values
  ('03000000-0000-4000-8000-000000000001', 'EU', 36, '36', 1),
  ('03000000-0000-4000-8000-000000000002', 'EU', 37, '37', 2),
  ('03000000-0000-4000-8000-000000000003', 'EU', 38, '38', 3),
  ('03000000-0000-4000-8000-000000000004', 'EU', 39, '39', 4),
  ('03000000-0000-4000-8000-000000000005', 'EU', 40, '40', 5),
  ('03000000-0000-4000-8000-000000000006', 'EU', 41, '41', 6),
  ('03000000-0000-4000-8000-000000000007', 'EU', 42, '42', 7),
  ('03000000-0000-4000-8000-000000000008', 'EU', 42.5, '42.5', 8),
  ('03000000-0000-4000-8000-000000000009', 'EU', 43, '43', 9),
  ('03000000-0000-4000-8000-000000000010', 'EU', 44, '44', 10),
  ('03000000-0000-4000-8000-000000000011', 'EU', 45, '45', 11),
  ('03000000-0000-4000-8000-000000000012', 'EU', 46, '46', 12);

with catalog (
  product_no,
  brand_no,
  category_no,
  slug,
  model,
  title,
  description,
  fit_width,
  cushioning,
  support_level,
  fit_note
) as (
  values
    (1, 1, 1, 'sever-signal-01', 'Signal 01', 'Городские кроссовки Signal 01', 'Спокойная городская пара для длинного маршрута и ежедневного темпа.', 'standard', 'soft', 'balanced', 'true_to_size'),
    (2, 2, 2, 'forma-metro', 'Metro', 'Кроссовки Metro для лёгкого офиса', 'Сдержанный силуэт для офиса, поездок и прогулок после работы.', 'narrow', 'balanced', 'balanced', 'runs_small'),
    (3, 3, 1, 'volna-route', 'Route', 'Мягкие кроссовки Route', 'Мягкая амортизация и свободный шаг для целого дня в городе.', 'wide', 'soft', 'flexible', 'true_to_size'),
    (4, 4, 3, 'krug-rain-2', 'Rain 2', 'Кроссовки Rain 2 для мокрого города', 'Структурная городская пара для дождливых маршрутов и прохладных дней.', 'standard', 'balanced', 'structured', 'true_to_size'),
    (5, 5, 1, 'smena-block', 'Block', 'Кроссовки Block на каждый день', 'Универсальный профиль с устойчивой посадкой и плотным верхом.', 'wide', 'firm', 'structured', 'true_to_size'),
    (6, 6, 4, 'luch-tempo', 'Tempo', 'Лёгкие кроссовки Tempo', 'Гибкая пара для короткой тренировки, поездки и быстрой прогулки.', 'standard', 'balanced', 'flexible', 'runs_large'),
    (7, 1, 1, 'sever-line-02', 'Line 02', 'Кроссовки Line 02', 'Лаконичная модель с упругой амортизацией для ровного городского темпа.', 'narrow', 'firm', 'balanced', 'runs_small'),
    (8, 2, 2, 'forma-office-one', 'Office One', 'Кроссовки Office One', 'Минималистичная пара для спокойного дресс-кода и дня на ногах.', 'standard', 'soft', 'balanced', 'true_to_size'),
    (9, 3, 1, 'volna-airwalk', 'Airwalk', 'Кроссовки Airwalk', 'Лёгкая мягкая модель для длинных прогулок и пересадок.', 'wide', 'soft', 'flexible', 'true_to_size'),
    (10, 4, 3, 'krug-guard', 'Guard', 'Кроссовки Guard', 'Защищённый верх и структурная поддержка для переменчивой погоды.', 'standard', 'firm', 'structured', 'runs_small'),
    (11, 5, 1, 'smena-shift', 'Shift', 'Кроссовки Shift', 'Сбалансированная городская пара для рабочего дня и вечернего маршрута.', 'extra_wide', 'balanced', 'balanced', 'true_to_size'),
    (12, 6, 4, 'luch-pulse', 'Pulse', 'Кроссовки Pulse', 'Мягкий перекат и гибкий верх для лёгких тренировок без спешки.', 'standard', 'soft', 'flexible', 'runs_large'),
    (13, 1, 3, 'sever-north-03', 'North 03', 'Кроссовки North 03', 'Плотная городская модель для прохладной погоды и мокрого асфальта.', 'wide', 'balanced', 'structured', 'true_to_size'),
    (14, 2, 2, 'forma-frame', 'Frame', 'Кроссовки Frame', 'Чистые линии, умеренная амортизация и собранная офисная посадка.', 'narrow', 'balanced', 'structured', 'runs_small'),
    (15, 3, 1, 'volna-cloud', 'Cloud', 'Кроссовки Cloud', 'Очень мягкий характер шага для прогулок и насыщенного дня.', 'extra_wide', 'soft', 'balanced', 'true_to_size'),
    (16, 4, 1, 'krug-asphalt', 'Asphalt', 'Кроссовки Asphalt', 'Устойчивая подошва и плотная поддержка для быстрого городского ритма.', 'standard', 'firm', 'structured', 'true_to_size'),
    (17, 5, 2, 'smena-daylight', 'Daylight', 'Кроссовки Daylight', 'Светлая офисная пара с мягкой посадкой и аккуратным профилем.', 'wide', 'soft', 'balanced', 'runs_large'),
    (18, 6, 4, 'luch-sprint-lite', 'Sprint Lite', 'Кроссовки Sprint Lite', 'Гибкая и лёгкая модель для коротких пробежек и активных прогулок.', 'narrow', 'balanced', 'flexible', 'runs_small'),
    (19, 1, 1, 'sever-axis', 'Axis', 'Кроссовки Axis', 'Стабильная посадка и ровная амортизация для ежедневного маршрута.', 'standard', 'balanced', 'structured', 'true_to_size'),
    (20, 2, 2, 'forma-softdesk', 'Softdesk', 'Кроссовки Softdesk', 'Мягкая офисная пара для тех, кто много ходит между встречами.', 'wide', 'soft', 'balanced', 'true_to_size'),
    (21, 3, 1, 'volna-river', 'River', 'Кроссовки River', 'Свободный носок и гибкая подошва для длинной городской прогулки.', 'extra_wide', 'balanced', 'flexible', 'runs_large'),
    (22, 4, 3, 'krug-shelter', 'Shelter', 'Кроссовки Shelter', 'Собранная погодная модель с защищённым верхом и уверенной опорой.', 'standard', 'firm', 'structured', 'runs_small'),
    (23, 5, 4, 'smena-cross', 'Cross', 'Кроссовки Cross', 'Универсальная пара для лёгкой тренировки и дел по городу.', 'wide', 'balanced', 'balanced', 'true_to_size'),
    (24, 6, 4, 'luch-flow', 'Flow', 'Кроссовки Flow', 'Мягкий гибкий профиль для разминки и повседневного движения.', 'standard', 'soft', 'flexible', 'true_to_size'),
    (25, 1, 1, 'sever-vector', 'Vector', 'Кроссовки Vector', 'Структурная городская модель с плотной пяткой и ровным перекатом.', 'narrow', 'firm', 'structured', 'runs_small'),
    (26, 2, 2, 'forma-balance', 'Balance', 'Кроссовки Balance', 'Сдержанная универсальная пара для офиса и дороги домой.', 'standard', 'balanced', 'balanced', 'true_to_size'),
    (27, 3, 1, 'volna-step', 'Step', 'Кроссовки Step', 'Мягкая широкая посадка для спокойного темпа и длинных выходных.', 'wide', 'soft', 'flexible', 'runs_large'),
    (28, 4, 3, 'krug-rainline', 'Rainline', 'Кроссовки Rainline', 'Защищённая модель для мокрой погоды без тяжёлого походного характера.', 'extra_wide', 'balanced', 'structured', 'true_to_size'),
    (29, 5, 4, 'smena-pace', 'Pace', 'Кроссовки Pace', 'Упругая посадка для активной прогулки и лёгкой тренировки.', 'standard', 'firm', 'balanced', 'true_to_size'),
    (30, 6, 1, 'luch-move', 'Move', 'Кроссовки Move', 'Простая гибкая пара для ежедневных коротких маршрутов.', 'wide', 'balanced', 'flexible', 'runs_large'),
    (31, 1, 1, 'sever-tram', 'Tram', 'Кроссовки Tram', 'Городская пара с неполной редакционной оценкой посадки.', 'unknown', 'balanced', 'unknown', 'unknown'),
    (32, 2, 2, 'forma-outline', 'Outline', 'Кроссовки Outline', 'Чистый офисный силуэт с нейтральным характером шага.', 'standard', 'unknown', 'balanced', 'unknown')
)
insert into public.products (
  id,
  slug,
  brand_id,
  category_id,
  model,
  title,
  description,
  status,
  fit_width,
  cushioning,
  support_level,
  fit_note,
  fit_provenance,
  fit_source_note,
  fit_reviewed_at,
  merch_rank,
  published_at
)
select
  ('10000000-0000-4000-8000-' || lpad(product_no::text, 12, '0'))::uuid,
  slug,
  ('01000000-0000-4000-8000-' || lpad(brand_no::text, 12, '0'))::uuid,
  ('02000000-0000-4000-8000-' || lpad(category_no::text, 12, '0'))::uuid,
  model,
  title,
  description,
  'published',
  fit_width::public.fit_width,
  cushioning::public.cushioning,
  support_level::public.support_level,
  fit_note::public.fit_note,
  case
    when fit_width = 'unknown' or cushioning = 'unknown' or support_level = 'unknown'
      then 'unknown'::public.data_provenance
    else 'editorial_demo'::public.data_provenance
  end,
  case
    when fit_width = 'unknown' or cushioning = 'unknown' or support_level = 'unknown'
      then null
    else 'Детерминированный demo catalog Solecraft'
  end,
  case
    when fit_width = 'unknown' or cushioning = 'unknown' or support_level = 'unknown'
      then null
    else date '2026-08-01'
  end,
  product_no * 10,
  timestamptz '2026-07-01 09:00:00+00' + (product_no * interval '1 day')
from catalog;

insert into public.products (
  id,
  slug,
  brand_id,
  category_id,
  model,
  title,
  description,
  status,
  merch_rank
)
values (
  '10000000-0000-4000-8000-000000000099',
  'draft-internal-sample',
  '01000000-0000-4000-8000-000000000001',
  '02000000-0000-4000-8000-000000000001',
  'Internal 99',
  'Черновик внутреннего каталога',
  'Эта запись нужна только для allow/deny теста и не доступна публичным ролям.',
  'draft',
  9999
);

with colors (color_no, slug, name, code) as (
  values
    (1, 'black', 'Чёрный', '#171C26'),
    (2, 'graphite', 'Графит', '#515966'),
    (3, 'white', 'Белый', '#F3F6FA'),
    (4, 'navy', 'Тёмно-синий', '#22345F'),
    (5, 'blue', 'Синий', '#315CF5'),
    (6, 'orange', 'Оранжевый', '#FF7A45'),
    (7, 'mint', 'Мятный', '#8CCBB4'),
    (8, 'burgundy', 'Бордовый', '#763B4B')
),
published_products as (
  select *
  from public.products
  where status = 'published'
)
insert into public.product_variants (
  id,
  product_id,
  slug,
  color_slug,
  color_name,
  color_code,
  price_minor,
  compare_at_minor,
  currency,
  is_default,
  created_at
)
select
  ('20000000-0000-4000-8000-' || lpad(products.merch_rank::text, 12, '0'))::uuid,
  products.id,
  products.slug || '-' || colors.slug,
  colors.slug,
  colors.name,
  colors.code,
  999000 + products.merch_rank * 2300,
  case
    when mod(products.merch_rank, 40) = 0
      then 1249000 + products.merch_rank * 2300
    else null
  end,
  'RUB',
  true,
  timestamptz '2026-07-01 09:00:00+00' + (products.merch_rank * interval '1 minute')
from published_products as products
join colors
  on colors.color_no = mod((products.merch_rank / 10)::integer - 1, 8) + 1
union all
select
  ('21000000-0000-4000-8000-' || lpad(products.merch_rank::text, 12, '0'))::uuid,
  products.id,
  products.slug || '-' || colors.slug,
  colors.slug,
  colors.name,
  colors.code,
  1079000 + products.merch_rank * 2300,
  null,
  'RUB',
  false,
  timestamptz '2026-07-01 09:05:00+00' + (products.merch_rank * interval '1 minute')
from published_products as products
join colors
  on colors.color_no = mod((products.merch_rank / 10)::integer + 2, 8) + 1;

insert into public.product_media (
  id,
  variant_id,
  kind,
  storage_path,
  alt,
  width,
  height,
  position
)
select
  (
    case when variants.is_default then '30000000-0000-4000-8000-' else '31000000-0000-4000-8000-' end
    || lpad(products.merch_rank::text, 12, '0')
  )::uuid,
  variants.id,
  'catalog',
  '/img/sneakers/' ||
    (
      mod((products.merch_rank / 10)::integer - 1 + case when variants.is_default then 0 else 1 end, 10)
      + 1
    )::text ||
    '.png',
  products.title || ', цвет «' || variants.color_name || '», вид сбоку',
  266,
  224,
  0
from public.product_variants as variants
join public.products as products on products.id = variants.product_id
where products.status = 'published';

insert into public.product_tags (product_id, tag_id)
select products.id, tags.id
from public.products as products
join public.tags as tags on tags.slug = 'city-walk' and tags.type = 'use_case'
where products.status = 'published'
union
select
  products.id,
  tags.id
from public.products as products
join public.categories as categories on categories.id = products.category_id
join public.tags as tags
  on tags.type = 'use_case'
  and tags.slug = case categories.slug
    when 'city' then 'all-day'
    when 'office' then 'office'
    when 'weather' then 'wet-weather'
    else 'light-training'
  end
where products.status = 'published';

insert into public.brand_size_guide_entries (
  brand_id,
  size_id,
  foot_length_min_mm,
  foot_length_max_mm,
  provenance,
  source_note,
  reviewed_at
)
select
  brands.id,
  sizes.id,
  case when brands.slug = 'luch' then null else 220 + sizes.sort_order * 5 end,
  case when brands.slug = 'luch' then null else 224 + sizes.sort_order * 5 end,
  case
    when brands.slug = 'luch' then 'unknown'::public.data_provenance
    else 'editorial_demo'::public.data_provenance
  end,
  case
    when brands.slug = 'luch' then null
    else 'Демо-таблица бренда; не универсальная конвертация'
  end,
  case when brands.slug = 'luch' then null else date '2026-08-01' end
from public.brands as brands
cross join public.sizes as sizes;

insert into public.inventory (
  id,
  variant_id,
  size_id,
  sku,
  stock_on_hand,
  updated_at
)
select
  (
    '40000000-0000-4000-8000-' ||
    lpad(
      (
        products.merch_rank * 100 +
        case when variants.is_default then 0 else 50 end +
        sizes.sort_order
      )::text,
      12,
      '0'
    )
  )::uuid,
  variants.id,
  sizes.id,
  'PARA-' ||
    lpad((products.merch_rank / 10)::integer::text, 2, '0') ||
    '-' ||
    case when variants.is_default then 'A' else 'B' end ||
    '-' ||
    replace(sizes.display_label, '.', ''),
  mod(
    (products.merch_rank / 10)::integer +
    sizes.sort_order +
    case when variants.is_default then 0 else 3 end,
    7
  ),
  timestamptz '2026-08-01 10:00:00+00'
from public.product_variants as variants
join public.products as products on products.id = variants.product_id
cross join public.sizes as sizes
where products.status = 'published';
