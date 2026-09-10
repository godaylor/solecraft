# Product and visual options

> Статус: концептуальное решение
> Дата: 2026-08-28
> Решение: **Option A — Solecraft**
> Основание: baseline в [BASELINE_AUDIT.md](./BASELINE_AUDIT.md)

## 1. Что показывает современный рынок

Benchmark использован как набор продуктовых паттернов, а не как визуальный референс для копирования.

| Продукт | Наблюдаемый паттерн | Что взять в Solecraft |
|---|---|---|
| [Nike catalog](https://www.nike.com/w/mens-shoes-nik1zy7ok) | Category navigation, sport/use-case groups, filter/sort, merchandising | Быстрый discovery по реальной задаче, не только brand/color |
| [Nike PDP](https://www.nike.com/t/air-max-dn8-mens-shoes-YPsmAOxu/IH2137-001) | Gallery, colorway, size grid, size guide, fit advice, pickup/shipping, favorite, reviews | Размер и посадка — часть решения до add-to-cart |
| [adidas catalog](https://www.adidas.com/us/men-athletic_sneakers) | Filter & Sort, category-led PLP | Mobile filter sheet и ясный result count |
| [adidas PDP](https://www.adidas.com/qa/en/run-60s-shoes-kids/IH7751.html) | Несколько цветов, size chart, quantity, wishlist, current/original price | Variant-aware product model и price semantics |
| [END. sneakers](https://www.endclothing.com/gb/new-in/latest-sneakers?storeCode=GB) | Multi-brand catalog, brand/size/price facets, latest-drop merchandising | Curated assortment и editorial layer поверх commerce core |
| [New Balance wide shoes](https://www.newbalance.com/men/wide-shoes/) | Width как first-class discovery attribute | Отличимый fit-first фильтр, полезный именно для обуви |
| [Nike order tracking](https://www.nike.com/help/a/order-tracking) | Signed-in order history и status | Account history как продолжение checkout, а не отдельная демо-страница |
| [adidas order history](https://www.adidas.com/us/help/us-ordering/why-cant-i-find-my-order-in-my-order-history) | Guest checkout отделён от account history, guest order доступен через tracker | Guest purchase не блокируется auth; история доступна после входа |

### Product baseline рынка

Для правдоподобного sneaker shop недостаточно product grid + cart drawer. Минимальный коммерческий язык включает:

- stable product/variant/size identity и фактическую availability;
- shareable catalog state: query, facets, sort, page;
- PDP с gallery, fit/size guidance, delivery/returns и ясной primary action;
- guest cart и checkout без обязательной регистрации;
- wishlist и order history, которые становятся сильнее после auth;
- trust и recovery: доставка, возврат, retry, stock/price conflicts;
- mobile-first sheets, 44 px touch targets и keyboard/screen-reader flow;
- мерчандайзинг: collections, new/drop/low-stock/sale — без подмены core commerce декоративным контентом.

## 2. Критерии выбора

Оценка 1–5. Вес отражает цель: сильный коммерческий frontend case, который реально довести до polished результата.

| Критерий | Вес | Как трактуется |
|---|---:|---|
| Wow-effect | 25% | Запоминаемая, предметная визуальная идея, не template look |
| Скорость реализации | 20% | Возможность получить сильный v1 без content/backend бесконечности |
| Frontend depth | 25% | URL state, variants, forms, data states, accessibility, performance |
| Реалистичность | 15% | Похоже на жизнеспособный магазин и реальные user jobs |
| Ценность работодателю | 15% | Демонстрирует decisions, engineering quality и product thinking |

## 3. Option A — Solecraft: fit-first city sneaker store

### Product thesis

**Solecraft помогает выбрать кроссовки не только по виду, но и по посадке, ширине стопы и городскому сценарию.**

Аудитория: русскоязычные покупатели 20–35 лет, которым нужны кроссовки для города, офиса, долгой ходьбы и лёгких тренировок; они ценят стиль, но не хотят угадывать размер и комфорт по одной фотографии.

Single job каталога: быстро сократить ассортимент до моделей, которые доступны в нужном размере и подходят под способ использования.

### Отличимые product features

- Size-first catalog: фильтр «мой размер» сразу исключает недоступные SKU.
- Fit profile: width, fit note, cushioning, support и use case — структурированные attributes.
- «Линия посадки» на card/PDP: компактная, объяснимая visual trace по трём независимым tracks — width, cushioning, support; use cases остаются categorical tags, а не псевдонаучным score.
- Size guide и brand-specific fit note рядом с size picker.
- Сравнение colorways и stock без создания ложных отдельных products.
- Editorial collections вроде «12 000 шагов», «Дождливый город», «Лёгкий офис» строятся на тех же facets.
- Полный стандартный commerce flow остаётся центром: catalog → PDP → cart → checkout → order.

Полноценный questionnaire-based Fit Finder — stretch goal после v1. В обязательном scope только данные, фильтры и ясное fit explanation.

### Fit data contract

- Primary size label — EU; sourced foot length показывается в cm и хранится в mm.
- Brand-specific size guide не подменяется универсальной формулой.
- Width: narrow / standard / wide / extra wide / not assessed.
- Cushioning: firm / balanced / soft / not assessed.
- Support: flexible / balanced / structured / not assessed.
- Use cases: city walk, all day, office, wet weather, light training — tags, не шкала качества.
- Fit note: runs small / true to size / runs large / not assessed.
- Каждое значение имеет provenance: manufacturer, editorial demo или unknown. Solecraft показывает guidance и источник, но не обещает персональную точность.

### Visual direction

Это не медицинский dashboard и не очередной чёрный интерфейс с acid green. Визуальный язык берётся из city navigation, shoe measurement marks и материалов подошвы.

**Palette**

| Token | Hex | Роль |
|---|---|---|
| Cold Paper | `#F3F6FA` | Основная светлая поверхность |
| Asphalt | `#171C26` | Основной текст и dark sections |
| Transit Blue | `#315CF5` | Primary action, focus, active path |
| Sole Orange | `#FF7A45` | Stock/fit accent и один эмоциональный момент |
| Gauge Mint | `#BDE7D6` | Fit/comfort data surface |
| Line Grey | `#C9D0DB` | Dividers, disabled, measurement grid |

**Typography**

- Display: `Unbounded`, короткие русские headlines и числовые statements.
- Body/UI: `Manrope`, основной интерфейс и длинные объяснения.
- Utility/data: `IBM Plex Mono`, SKU, sizes, order number, fit scale.
- Все шрифты self-hosted WOFF2 с нужными Cyrillic subsets; display используется дозированно.

**Layout**

- 4-column mobile, 8-column tablet, 12-column desktop.
- Catalog grid остаётся ровным и спокойным; fit data помещается в нижний «measurement rail» card.
- PDP строится как 7/5 split: визуальная gallery слева, sticky decision panel справа; на mobile decision panel становится обычным потоком со sticky add bar после выбора SKU.
- Filters — sidebar на wide desktop и modal sheet на touch/compact layout.

```text
Desktop catalog
┌──────────────────────────────────────────────────────────┐
│ brand / search / account / cart                          │
├──────────────────────────────────────────────────────────┤
│ headline + active fit route + result count               │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ filters      │ product      │ product      │ product      │
│ size first   │ image        │ image        │ image        │
│ width        │ name / price │ name / price │ name / price │
│ use case     │ fit trace ─● │ fit trace ●─ │ fit trace ─● │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Signature element**

Одна «Линия посадки» проходит через hero, active filters, product cards и PDP. Три tracks кодируют width/cushioning/support, use-case tags стоят рядом; unknown отображается как «не оценено», а не как средняя отметка.

**Motion**

- Один orchestrated moment: линия строится при первом появлении home/catalog hero.
- Дальше только functional feedback 120–220 ms: selected size, wishlist, drawer, filter count.
- `prefers-reduced-motion` отключает построение линии и сохраняет мгновенное состояние.

### Риски

- Fit claims должны быть честными и объяснимыми; нельзя обещать персональную точность без данных.
- Нужен richer seed dataset, чем текущие 10 объектов.
- Signature легко превратить в decorative chart; data contract должен появиться раньше анимации.

## 4. Option B — `DROP/INDEX`: release desk for collectors

### Product thesis

Curated store для покупателей, которые следят за релизами, colorways и ограниченной доступностью. Каталог ощущается как оперативный release index: что вышло, что скоро, что осталось в размерах.

### Product/visual core

- Drop calendar, launch status, reminders и release collections.
- Dense product metadata: release time, SKU, colorway, size availability.
- Editorial release pages и countdown только для реальных scheduled drops.
- Signature: «release receipt» — timestamped rail, который связывает catalog, PDP и confirmation.

Palette: `#EEF1F5` cold sheet, `#111318` ink, `#D64B43` release red, `#8B93A1` archive grey, `#5B6CFF` digital blue. Typography: `Bebas Neue`/подтверждённый Cyrillic display, `Onest` body, `PT Mono` data.

### Сильные стороны

- Самый высокий instant wow и хороший storytelling для case study.
- Богатые time/status UI, optimistic reminder actions, countdown edge cases.

### Риски

- Требует постоянного release content и правдоподобных дат.
- Countdown/notifications уводят внимание от обязательного catalog/checkout.
- Ограниченный stock добавляет backend concurrency раньше, чем нужен core v1.

## 5. Option C — `PAIR/LOOK`: outfit-led fashion boutique

### Product thesis

Магазин продаёт не отдельную пару, а готовый городской образ. Покупатель переключает product card между cutout и on-foot context, открывает shoppable look и собирает wishlist как moodboard.

### Product/visual core

- Shoppable looks, color stories, editorial collections, outfit/product view toggle.
- Signature: split-frame card — обувь и реальный образ совмещаются по одной линии шага.
- Palette: `#E4EBF2` mist, `#1D2028` graphite, `#B44355` berry, `#53756B` fabric green, `#FFFFFF` lightbox.
- Typography: `Prata` display с проверенным Cyrillic subset, `Onest` body, `IBM Plex Mono` price/SKU.

### Сильные стороны

- Сильный fashion art direction и высокая эмоциональная ценность.
- Хорошая демонстрация responsive art direction и media behavior.

### Риски

- Самая высокая зависимость от дорогого photo/content production.
- Shoppable looks добавляют новую domain model, не закрывая size/inventory глубину.
- При слабых assets превращается в обычную editorial landing page.

## 6. Scoring

| Option | Wow 25% | Speed 20% | FE depth 25% | Realism 15% | Employer 15% | Weighted result |
|---|---:|---:|---:|---:|---:|---:|
| **A. Solecraft** | 4.5 | 4.0 | 5.0 | 5.0 | 5.0 | **4.68 / 5 (93.5%)** |
| B. `DROP/INDEX` | 5.0 | 3.5 | 4.5 | 4.0 | 4.5 | 4.35 / 5 (87.0%) |
| C. `PAIR/LOOK` | 4.5 | 3.0 | 4.0 | 4.0 | 4.0 | 3.93 / 5 (78.5%) |

## 7. Решение

Выбран **Option A — Solecraft**.

Почему:

- wow строится на предметной особенности обуви, а не на декоративной теме;
- fit/size/variant UX создаёт настоящую frontend глубину;
- концепция усиливает обязательные catalog/PDP/filter/cart flows, а не конкурирует с ними;
- v1 не зависит от release feed или большого lookbook production;
- работодатель видит product reasoning, domain modeling, URL/data architecture, forms, accessibility и performance в одном связном case.

### Зафиксированное и обратимое

Зафиксировано для planning: fit-first позиционирование, «Линия посадки» как signature, светлая cold-paper palette, русский UI по умолчанию и сохраняемый RU/EN режим.

Обратимо до начала design-system milestone: финальное имя, конкретные font licenses/subsets, один из secondary accents, объём editorial home content. Эти решения не должны менять domain architecture.
