# Solecraft transformation spec

> Статус: approved planning specification, implementation not started
> Версия: 1.0
> Дата: 2026-08-28
> Product direction: **Solecraft — fit-first city sneaker store**
> Delivery plan: [../PLAN.md](../PLAN.md)
> Technical contract: [ARCHITECTURE.md](./ARCHITECTURE.md)

## 1. Product vision

Превратить старый учебный React demo в самостоятельный portfolio-grade e-commerce продукт, который выглядит как правдоподобный магазин, выдерживает полный пользовательский путь и демонстрирует senior-level frontend decisions.

Продукт должен отвечать на два вопроса одновременно:

1. **Покупателю:** «Какая пара подходит моему размеру, посадке и сценарию — и как безопасно её заказать?»
2. **Работодателю:** «Умеет ли автор проектировать сложный frontend как продукт: domain/data flow, states, accessibility, performance, tests и trade-offs?»

## 2. Assumptions

Это обратимые assumptions до начала реализации:

- UI locale: Russian by default with persisted `ru` / `en` selection;
- currency: `RUB`, суммы хранятся в minor units и форматируются через `Intl.NumberFormat`;
- ассортимент: curated demo catalog 24–40 products, 2–4 colorways и реалистичные size/stock matrices;
- продукт демонстрационный, но все состояния и правила должны быть production-shaped;
- guest browsing/cart/checkout разрешены; auth не является gate для покупки;
- order history и cross-device wishlist доступны authenticated user;
- payment в обязательном scope — безопасный demo adapter; реальные card details приложение не собирает;
- финальный content set использует легально допустимые, собственные или сгенерированные assets с source/license manifest.

Изменение locale, currency, payment provider или hosting требует обновить эту спецификацию до затронутого milestone.

## 3. Users and jobs

### U1. Intentional browser

Хочет быстро найти кроссовки для конкретного use case, размера и бюджета, сохранить shareable URL и сравнить несколько моделей.

### U2. Size-conscious buyer

Боится ошибиться с размером/шириной; ищет availability, size guide и fit note до добавления в корзину.

### U3. Returning customer

Возвращается к wishlist/cart, оформляет заказ и проверяет его статус/history.

### U4. Portfolio reviewer

Оценивает продукт за 3–7 минут: visual identity, responsive polish, глубину flows, failure handling, quality evidence и ясность решений.

## 4. Product principles

1. **Размер раньше hype.** Availability и fit не спрятаны после красивой gallery.
2. **URL — часть интерфейса.** Search, filters, sort и page переживают reload, Back/Forward и share.
3. **Одна правда на тип state.** Remote data, URL, persisted guest state и transient UI не зеркалируются между stores.
4. **Failure is a designed state.** Ошибка всегда объясняет, что сохранилось и что можно сделать дальше.
5. **Guest-first, account-enhanced.** Регистрация усиливает continuity, но не блокирует покупку.
6. **Сервер подтверждает commerce truth.** Price, stock и order totals не доверяются клиенту.
7. **Accessibility входит в component contract.** Не отдельный финальный cleanup.
8. **Wow тратится в одном месте.** «Линия посадки» запоминается; остальной UI остаётся точным и спокойным.

## 5. Scope

### Must ship

- brand shell и responsive home/catalog navigation;
- полноценный catalog;
- PDP;
- colorway/size/inventory variants;
- search, filters, sort, pagination и URL state;
- guest cart с quantity/persistence;
- guest/auth wishlist;
- authentication и account shell;
- multistep checkout с demo payment;
- order confirmation, history и detail;
- skeleton/empty/error/offline-ish recovery states;
- mobile/tablet/desktop layouts;
- no-known-failures WCAG 2.2 Level A/AA accessibility gate;
- typed production-quality state/data architecture;
- unit, integration, RLS/contract и browser E2E tests;
- deployed build, CI quality gates и portfolio case documentation.
- Solecraft branding and localized UI/editorial content/taxonomy/metadata in Russian
  and English; footwear brand and model names remain untranslated.

### Explicit non-goals for v1

- admin/CMS interface;
- seller marketplace или multi-tenant model;
- real card storage или production payment processing;
- reviews/ratings authoring;
- returns/refunds workflow;
- push notifications и real-time drop alerts;
- recommendations/ML personalization;
- warehouse/ERP integration;
- PWA/offline checkout;
- localization beyond `ru-RU`;
- SSR/organic-SEO program, если он не будет отдельно принят до routing milestone.

## 6. Functional requirements

Priority: `MUST`, `SHOULD`, `COULD`.

### Navigation and shell

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| NAV-01 | MUST | Каждая surface имеет собственный route | Direct URL/reload открывает только нужную страницу |
| NAV-02 | MUST | Header/nav доступны keyboard и touch | Visible focus, 44×44 targets, semantic links/buttons |
| NAV-03 | MUST | Есть meaningful 404 и route error boundary | Unknown slug/route не маскируются каталогом |
| NAV-04 | MUST | Mobile navigation и cart/filter sheets управляют focus | Escape, trap, return focus, inert background, scroll lock |
| NAV-05 | SHOULD | Home объясняет product thesis и ведёт в curated collections | Hero не блокирует быстрый переход в catalog |

### Catalog and discovery

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| CAT-01 | MUST | Catalog показывает published products, result count и pagination | Stable cards, no duplicate identity, direct page URL |
| CAT-02 | MUST | Search работает по title/brand/model/tags | Debounced query, clear, no-results recovery |
| CAT-03 | MUST | Facets: brand, category/use case, size, width/fit, color, price, in-stock | Multi-select rules определены и отражены в URL |
| CAT-04 | MUST | Sort: recommended, newest, price asc/desc | Stable deterministic order и canonical default |
| CAT-05 | MUST | Search/filter/sort/page живут в URL | Reload/share/Back/Forward воспроизводят выдачу |
| CAT-06 | MUST | Invalid/unknown params безопасно нормализуются | Нет crash/empty trap; canonical URL обновляется предсказуемо |
| CAT-07 | MUST | Loading, empty, no-results и recoverable error различимы | Skeleton зеркалит grid; retry сохраняет URL filters |
| CAT-08 | SHOULD | Active filters видны chips и сбрасываются по одному/все | Count и result state обновляются без ambiguity |
| CAT-09 | COULD | Prefetch PDP on intent | Только hover/focus/touch intent, без массового prefetch |

### Product details and variants

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| PDP-01 | MUST | PDP имеет canonical slug, gallery, brand/model, description, price | Direct URL, responsive gallery, image fallback |
| PDP-02 | MUST | Colorway и size выбирают конкретный inventory SKU | Colorway воспроизводится URL; size остаётся явным local selection; комбинация имеет stable `inventoryId` |
| PDP-03 | MUST | Add-to-cart требует доступный size | Inline error/focus на size picker; unavailable size disabled с пояснением |
| PDP-04 | MUST | Fit note, width/cushioning/support и use-case attributes объяснены текстом | «Линия посадки» не является единственным носителем смысла |
| PDP-05 | MUST | Delivery/returns/demo-store policy видна до checkout | Trust content доступен keyboard/screen reader |
| PDP-06 | SHOULD | Related products используют объяснимые shared tags | Нет блокирующего waterfall, section lazy below fold |
| PDP-07 | SHOULD | Sale price показывает current/original/discount семантически | Currency format единообразен, color не единственный cue |

### Cart

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| CART-01 | MUST | Cart line уникальна по `inventoryId` точного variant + size + SKU | Повторное добавление того же inventory item увеличивает quantity в пределах stock |
| CART-02 | MUST | Guest cart versioned и переживает reload | Хранится минимум identity/quantity, без PII и server objects |
| CART-03 | MUST | Quantity/remove/clear имеют pending/error/rollback semantics | Rapid click не создаёт duplicate request/race |
| CART-04 | MUST | Subtotal/discount/delivery estimate вычисляются из line model | UI totals детерминированы; final total подтверждает server |
| CART-05 | MUST | Cart доступна как route и quick drawer/sheet | Оба view читают один source of truth |
| CART-06 | MUST | Stock/price conflict объясняет, какая строка изменилась | Пользователь может обновить/удалить и продолжить |
| CART-07 | SHOULD | Remove предоставляет короткий undo | Undo не нарушает stock constraints |

### Wishlist and identity

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| AUTH-01 | MUST | Browse/cart/checkout не требуют входа | Auth prompt не блокирует core journey |
| AUTH-02 | MUST | Email OTP/magic-link flow возвращает на исходный route | Return URL validated, session errors recoverable |
| AUTH-03 | MUST | Sign-out очищает user-specific cache | Данные предыдущего user не видны следующему |
| WISH-01 | MUST | Guest wishlist сохраняется локально и dedupe-ится | Toggle state одинаков на catalog/PDP/wishlist |
| WISH-02 | MUST | После login wishlist/cart merge детерминирован и retry-safe | Guest data очищается только после server success |
| WISH-03 | MUST | User wishlist защищён ownership rules | Cross-user read/write получает denial |
| WISH-04 | SHOULD | Move-to-cart требует размер, если он не выбран | После успеха wishlist behavior явно определён |

### Checkout and orders

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| CHK-01 | MUST | Steps: contact → delivery → payment → review | Current step deep-linkable внутри допустимого flow |
| CHK-02 | MUST | Forms имеют labels, autocomplete, inline/summary errors | Keyboard, autofill, paste и screen reader работают |
| CHK-03 | MUST | Draft сохраняет только допустимые non-sensitive fields | Card/payment secrets никогда не попадают в localStorage/logs |
| CHK-04 | MUST | Submit idempotent и блокирует duplicate order | Double-click/refresh не создают два заказа |
| CHK-05 | MUST | Server заново проверяет price/stock и считает total | Client total не принимается как authority |
| CHK-06 | MUST | Demo payment имеет success, decline и timeout scenarios | Ясно обозначен demo mode, card details не собираются |
| CHK-07 | MUST | Success route показывает immutable order summary: owner session для user или short-lived scoped receipt capability для guest | Refresh в той же browser session безопасен; missing/wrong/expired capability fails closed; cart очищается только после confirmed order |
| ORD-01 | MUST | Signed-in user видит order list и detail | Empty/loading/error/pagination/status states |
| ORD-02 | MUST | Order item хранит snapshot title/SKU/size/price/image | Изменение catalog не переписывает историю |
| ORD-03 | MUST | User не может читать чужой order | RLS/contract test подтверждает denial |
| ORD-04 | SHOULD | Guest получает confirmation number и same-session receipt guidance | Public lookup/history отсутствует; order number сам по себе никогда не авторизует чтение |

## 7. State contract

Для каждой data surface обязательна полная state model.

| Surface | Loading | Empty | Error/recovery | Mutation feedback |
|---|---|---|---|---|
| Home/collections | Stable content skeleton | Fallback collection | Inline retry | — |
| Catalog | Card-grid skeleton без CLS | Catalog empty | Retry с сохранённым URL | Filter count/pending |
| Search | Delayed progress | No results + edit/reset | Search error + retry | Clear announcement |
| PDP | Media/info skeleton | N/A → 404 | Retry или back to catalog | Size/add pending/success/error |
| Cart | Rehydration shell | Directed empty state | Per-line conflict + retry | Qty/remove/undo |
| Wishlist | Stable cards | Directed empty state | Retry, local state preserved | Toggle/move pending |
| Checkout | Step-level pending | Invalid empty cart redirect | Validation, decline, timeout, conflict | Submit lock/idempotency |
| Guest receipt | Capability validation shell | Missing/expired → safe guidance | Generic retry без раскрытия existence/PII | — |
| Orders | List/detail skeleton | First-order invitation | Retry/contact guidance | — |
| Images | Reserved aspect ratio | Placeholder | Local fallback | — |

Правила loading UI:

- delay появления примерно 150–300 ms, чтобы не мигал на быстром ответе;
- skeleton повторяет финальную геометрию;
- background fetch не заменяет уже показанные данные полным skeleton;
- async updates объявляются через concise `aria-live` messaging.

## 8. URL contract

Canonical catalog route: `/catalog`.

```text
/catalog
  ?q=air
  &brand=nike&brand=new-balance
  &use=city-walk
  &size=42
  &width=wide
  &color=black
  &priceMin=800000
  &priceMax=1800000
  &inStock=true
  &sort=price-asc
  &page=2
```

Rules:

- defaults не сериализуются;
- arrays сортируются canonical order, duplicate values удаляются;
- currency URL values — minor units или другой один явно документированный формат;
- typing search может использовать `replace`, committed filter/page changes — history entry;
- любое URL state входит в query key только после parse/normalize;
- неизвестные params сохраняются только если принадлежат другой согласованной feature; мусор удаляется;
- pagination сбрасывается на 1 при изменении query/facet/sort;
- product route: `/products/:slug?color=:colorwaySlug`; default color не сериализуется, committed color switch создаёт history entry, direct/reload/Back восстанавливают variant;
- unknown color нормализуется через `replace` к canonical default без loop; size намеренно не входит в URL, сбрасывается при несовместимом colorway и становится persistent только как cart `inventoryId`;
- orders: `/account/orders/:orderNumber`.

## 9. Business and data rules

1. Product — merchandising entity; colorway/variant — purchasable model branch; inventory item — конкретные variant + size + SKU.
2. Stable identifiers не выводятся из title/image URL.
3. Money хранится integer minor units + ISO currency. Floating point не используется для totals.
4. Discount не может сделать price отрицательной; original price должен быть больше current price.
5. Quantity — integer `1..availableStock` с configurable per-line cap.
6. Wishlist уникальна на user/product; preferred variant может храниться отдельно, но не создаёт duplicate card.
7. Order item — immutable snapshot. Order total равен server-calculated sum snapshots + delivery − discount.
8. Checkout mutation имеет idempotency key и атомарно создаёт order/items и резервирует/списывает stock.
9. Published catalog доступен public read; drafts, cost/admin fields не экспонируются.
10. Authenticated cart/wishlist/orders доступны только владельцу; guest persistence не содержит PII.
11. Guest success читает только PII-minimized receipt через short-lived capability: raw token высокоэнтропийный, server хранит hash; token не попадает в URL, logs или localStorage, а order number не является credential.
12. Shared MockAPI cart records не импортируются.

### Fit and sizing data contract

- Primary display system — EU; длина стопы показывается в cm, но хранится integer millimeters. «RU» не считается отдельной универсальной шкалой без подтверждённого source mapping.
- Inventory item ссылается на нормализованный size. Brand-specific guide отдельно связывает brand + EU label с допустимым диапазоном foot length и provenance; при отсутствии source UI не выдумывает conversion.
- «Линия посадки» имеет ровно три независимых track: width `narrow | standard | wide | extra_wide | unknown`, cushioning `firm | balanced | soft | unknown`, support `flexible | balanced | structured | unknown`.
- Use case не является числовым score: это typed tags, например `city_walk`, `all_day`, `office`, `wet_weather`, `light_training`.
- Fit note использует constrained value `runs_small | true_to_size | runs_large | unknown` и видимый текст. `unknown` означает «не оценено», а не neutral midpoint.
- Каждый fit/size claim имеет provenance `manufacturer | editorial_demo | unknown`, optional source note и review date. UI называет данные ориентиром, не гарантирует персональную/медицинскую точность и не рекомендует размер без достаточного source.

## 10. Responsive contract

Breakpoints определяются поведением контента; для verification используются representative widths.

| Range | Contract |
|---|---|
| 320–599 | 16 px gutter, compact header, 2-column card grid если card выдерживает content; иначе 1 column, full-width sheets, sticky PDP/cart action |
| 600–899 | 24 px gutter, 2–3 columns, filter sheet, tablet gallery layout |
| 900–1199 | 32 px gutter, 3 columns, optional compact filter rail |
| 1200+ | max content width около 1440 px, 4 columns + sidebar или 4-column full grid, 7/5 PDP split |

Required checks: `320×568`, `360×800`, `390×844`, `768×1024`, `1024×768`, `1440×900`, zoom 200%. Не должно быть horizontal scroll, clipped dialogs, unreachable sticky actions или hover-only functionality.

## 11. Accessibility contract

Target: нет известных WCAG 2.2 Level A/AA failures в in-scope journeys; результат подтверждается automation, triage и manual assistive-technology checks.

- semantic landmarks, skip link, один page `h1`, логичная hierarchy;
- native link/button/input semantics прежде ARIA;
- visible unobscured `:focus-visible`, forced-colors compatible;
- 44×44 minimum touch targets на compact/touch UI;
- dialog/sheet: label, modal semantics, focus trap, Escape, return focus, inert background;
- icon actions имеют contextual name; toggles — `aria-pressed`/equivalent state;
- selected/unavailable/discount/error не кодируются только цветом;
- form labels, descriptions, autocomplete, correct input type/mode, error summary;
- live regions для cart/wishlist/filter/checkout updates без verbosity;
- reduced motion; zoom 200%; keyboard-only core journey;
- product image alt описывает конкретный товар/view, decorative marks скрыты;
- все axe findings triaged; serious/critical = 0 — только нижняя граница и не заменяет manual screen reader/keyboard review;
- сохраняется evidence matrix минимум для desktop `NVDA + Firefox` и mobile `TalkBack + Chrome` (актуальные stable versions), плюс keyboard-only и zoom checks; недоступная platform фиксируется как открытый release gate, а не молча считается пройденной.

## 12. Content and media

- Product media minimum: 1200 px long edge для PDP source, consistent art direction и aspect-ratio metadata.
- Generate responsive AVIF/WebP + fallback; explicit width/height или aspect ratio.
- Hero/LCP image получает controlled preload/fetch priority; below-fold cards lazy + async decode.
- Не дублировать PNG/JPG без purpose.
- `content/media-sources.md` или machine-readable manifest фиксирует origin, license и allowed use.
- Brand/product claims не копируются с retailer sites без права; benchmark copy не становится production copy.
- Error/empty copy объясняет next action, не использует vague «Что-то пошло не так» без выхода.

## 13. Quality and performance requirements

| ID | Requirement | Gate |
|---|---|---|
| QLT-01 | Strict TypeScript | `tsc --noEmit` passes, no unexplained `any` |
| QLT-02 | Lint/format/build | Все scripts non-interactive и проходят локально/CI |
| QLT-03 | Domain coverage | Critical money/cart/URL/order branches ≥90%; changed code ≥80% |
| QLT-04 | Integration behavior | RTL/MSW покрывает success/loading/empty/error/rollback |
| QLT-05 | Browser E2E | Critical journey проходит Chromium PR; 3 engines scheduled/release |
| QLT-06 | Accessibility conformance | Нет известных WCAG 2.2 A/AA failures; все axe findings triaged, serious/critical = 0; сохранено desktop/mobile AT evidence |
| QLT-07 | Security | 0 undocumented high/critical direct runtime advisories; RLS allow/deny tests pass |
| PERF-01 | Core Web Vitals target | Field p75: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 |
| PERF-02 | Lab target | Lighthouse mobile Perf ≥90, Accessibility ≥95 на controlled profile |
| PERF-03 | Bundle budget | Initial route JS ≤200 KiB gzip, CSS ≤40 KiB gzip; lazy route chunk ≤100 KiB gzip unless documented |
| PERF-04 | Runtime hygiene | 0 unexpected console errors, unhandled rejections и failed requests в E2E |

Core Web Vitals thresholds соответствуют [web.dev guidance](https://web.dev/articles/vitals). Budgets — initial guardrails; после первого production build они уточняются измеренным baseline, но не снимаются молча.

## 14. Observability and product events

Минимальный event vocabulary, без PII и raw search histories в debug logs:

- `catalog_viewed`;
- `search_committed`;
- `filter_applied` / `filters_cleared`;
- `product_viewed`;
- `variant_selected` / `size_selected`;
- `wishlist_toggled`;
- `cart_item_added` / `cart_updated`;
- `checkout_step_completed`;
- `checkout_failed` с safe reason code;
- `order_completed`.

Analytics provider не обязателен для первого slice. Event interface и payload privacy contract должны быть provider-agnostic; development logger выключается в production.

## 15. Portfolio acceptance

Проект считается сильным case, если reviewer может:

1. открыть live URL без инструкции;
2. понять позиционирование Solecraft за первый экран;
3. отфильтровать каталог по размеру/use case и поделиться URL;
4. открыть PDP, выбрать colorway/size, увидеть fit guidance;
5. завершить demo checkout;
6. войти и увидеть order history/wishlist continuity;
7. пройти те же действия на mobile и keyboard;
8. открыть README/case study и увидеть baseline, decisions, architecture, tests, performance evidence и честные trade-offs.

## 16. Open gates before implementation

| Gate | Когда решить | Default, если пользователь не изменит |
|---|---|---|
| Final brand name | Решено 2026-09-03 | Solecraft |
| Product/media rights | До catalog content import | Fictional/demo catalog + owned/generated/licensed media |
| Supabase project and environments | До backend catalog milestone | Isolated local test stack или dedicated test project + отдельный production project; schemas одного project не считаются изоляцией; tests никогда не идут в production |
| Payment scope | До checkout milestone | Demo adapter only |
| Hosting | До final deploy, но SPA rewrite проверить в foundation | Static host such as Vercel with explicit fallback |
| SSR/SEO | До окончательной route architecture | Vite SPA/Data Router; document SEO limitation |
| Guest order lookup | До checkout schema | Same-session scoped receipt capability only; no general unauthenticated lookup/history in v1 |
