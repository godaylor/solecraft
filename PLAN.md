# Solecraft transformation plan

> Статус: M0–M9 GREEN; M9 manual AT covered by an explicit time-bounded accepted exception (checks NOT RUN); M10 local gates GREEN, external/public-release gate BLOCKED
> Дата: 2026-09-03
> Product: Solecraft — fit-first city sneaker store
> Inputs: [baseline](./docs/BASELINE_AUDIT.md), [product choice](./docs/PRODUCT_OPTIONS.md), [spec](./docs/TRANSFORMATION_SPEC.md), [architecture](./docs/ARCHITECTURE.md)

## Rebrand evidence — 2026-09-03

Актуальное продолжение M10 от 2026-09-08: [RELEASE_PREPARATION.md](docs/RELEASE_PREPARATION.md).
Корень уже переименован в `07-solecraft`; исторические порты и показатели ниже
сохранены как evidence прошлых запусков. Текущие локальные порты — только 32600–32699.
Доступная подготовка Vercel/cloud завершена локально; public release не объявляется
выполненным без реальных облачных настроек, manual AT и media rights.

Solecraft replaces the former user-facing product name without changing routes,
Supabase contracts, catalog identity or existing guest/auth state. Russian remains the
default; the persisted RU/EN preference translates interface copy, editorial product
content, taxonomy and metadata while footwear brand/model names remain unchanged.
Legacy storage and internal compatibility identifiers are retained only where required
for safe copy-first migration. The open repository folder remains unchanged until the
future root rename to `07-solecraft`.

This rebrand does not alter the accepted M9 waiver, the recorded M10 results or the
external/public-release gate: manual AT revalidation, hosted deployment checks,
production environment configuration, clean hosted CI evidence and media rights remain
open exactly as documented below.

## 0. Implementation evidence — M4–M8

Пакет M4–M8 выполнен последовательно после уже GREEN M0–M3. Production/remote migrations не применялись; schema и security gates выполнялись только на isolated local Supabase stack. Commit/push не выполнялись.

| Milestone                                | Статус    | Фактический outcome и gate evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M4 — PDP / variants / inventory**      | **GREEN** | Lazy PDP, canonical `?color`, reload/Back, gallery, sourced fit/size guide, unavailable sizes, exact inventory ID/SKU/stock и точный add-to-cart. Focused unit/integration, product-details pgTAP и real preview Playwright GREEN; Chromium, Firefox и installed Chrome, viewports 360×800 / 768×1024 / 1440×900, axe 0 и no horizontal overflow.                                                                                                                                                                                            |
| **M5 — trustworthy guest cart**          | **GREEN** | Versioned Zustand store сохраняет только inventory identity/quantity/timestamps; duplicate/cap/reconcile, quantity/remove/undo/clear, multi-tab last-write-wins, quick dialog и `/cart` с authoritative price/stock и delivery estimate. Focused store/cart tests, guest-cart pgTAP и real-browser persistence/dialog/multi-tab gates GREEN.                                                                                                                                                                                                 |
| **M6 — auth / wishlist / continuity**    | **GREEN** | Guest wishlist, local Supabase magic-link Auth, owner-only wishlist/cart, deterministic retry-safe guest merge, optimistic rollback/reconciliation и safe sign-out/private Query cleanup. RLS allow/deny покрывает anon/owner/other/ownership spoof; two-user real magic-link browser flow GREEN в Chromium и cross-browser shell GREEN.                                                                                                                                                                                                     |
| **M7 — checkout / atomic order**         | **GREEN** | Guarded contact → delivery → explicit demo-payment → review flow; никакие card credentials не собираются. Server-side price/stock/totals, atomic snapshots/stock update, UUID idempotency, guest/auth checkout и sessionStorage-only hashed/TTL receipt capability. Checkout focused tests и 35 pgTAP assertions GREEN; guest/auth success, double-click, refresh, fresh-session denial, decline/timeout/conflict/retry, mobile form/axe прошли в Chromium, Firefox и installed Chrome.                                                      |
| **M8 — confirmation / history / detail** | **GREEN** | Confirmation ведёт owner в `/account/orders`; paginated URL state, direct owner-only detail, locale date/money/status, loading/empty/error/retry/not-found states и immutable item/delivery snapshots. Deferred order snapshot FKs позволяют безопасно отвязать удалённый catalog product без потери history. Unit 3/3, integration 5/5 и M8 pgTAP 15/15 GREEN; checkout → history → detail → reload/Back/Forward, slow response, mobile cards, desktop detail, axe, other-user и anon denial прошли в Chromium, Firefox и installed Chrome. |

### Aggregate gate evidence

- `npm run typecheck` — PASS после последнего application-code change.
- `npm run lint` — PASS, `--max-warnings=0`.
- `npm run test:run` — PASS: **22 files / 66 tests**.
- `npm run build` — PASS: Vite production build, 205 modules; PDP/cart/checkout/order routes остаются lazy chunks.
- Clean local `npm run db:reset` применил migrations M2/M4/M5/M6/M7/M8 и deterministic seed; `npm run db:test` — PASS: **6 files / 122 pgTAP assertions**.
- Focused M7 и M8 Playwright suites — PASS в bundled Chromium, Firefox и installed Chrome; M4–M6 ранее сохранённые milestone browser gates также GREEN. Неожиданных console/page errors и axe violations в проверенных journeys нет.
- Security scan подтверждает: browser bundle не содержит service-role credential; raw receipt capability используется только в narrow response/sessionStorage/request-body contract и не помещается в URL/localStorage; card fields отсутствуют.

### Deferred / remaining evidence

- M9 hardening и все доступные automated/browser gates выполнены; точный отчёт: [M9 resilience and accessibility evidence](./docs/M9_ACCESSIBILITY_EVIDENCE.md).
- Обязательные versioned manual NVDA + Firefox и TalkBack + Chrome critical journeys не выполнялись. Для progression к M10 project owner явно принял time-bounded exception только на эти проверки; waiver истекает и требует revalidation перед public release.
- Native Playwright offline mode оставлял localhost Supabase request pending; после одного repo-local workaround coverage зафиксировано через deterministic browser 503, request-timeout unit и rejected-network integration. Native offline остаётся частью manual release matrix.
- In-app Browser kernel по-прежнему недоступен из-за Windows sandbox ACL startup error; доступные browser gates выполнены repo-local Playwright на реальном preview build.
- M10 начат после явного accepted exception M9. Production deploy и public-release cut не могут использовать истёкший waiver без revalidation.

## 0.1. Implementation evidence — M9

M9 добавил bounded request timeout/retry, fail-closed session expiry/private cache cleanup, общую live-message strategy, доступные checkout errors, media fallbacks, mobile account/wishlist navigation и last-success recovery каталога без потери URL state.

## 0.2. Implementation evidence — M10

M10 local implementation завершена до внешней release-границы. Полный отчёт:
[M10 performance, CI and release evidence](./docs/M10_RELEASE_EVIDENCE.md).

- Production build и bundle budget GREEN: initial JS **114.21 KiB gzip** / 200,
  initial CSS **6.34 KiB gzip** / 40; Supabase runtime и catalog route вынесены из
  initial home chunk, route chunks измерены.
- Controlled Lighthouse mobile, median из 3: Performance **99**, Accessibility **100**,
  Best Practices **100**, SEO **100**, LCP **1.654 s**, CLS **0.012** — GREEN.
- Privacy-safe CLS/INP/LCP instrumentation, sanitized error/route observability,
  production social metadata/card и provider-neutral deployment contract добавлены.
- CI hardening включает clean quality/audit, isolated local Supabase + browser +
  Lighthouse artifact и scheduled Chromium/Firefox/WebKit suite.
- Changed-surface browser evidence: **48 passed / 3 explicit skips** across Chromium,
  Firefox, WebKit; axe clean, 320–1440 px/reflow, slow fonts, forced colors, reduced
  motion, navigation/Auth continuity. Headless WebKit system Full Keyboard Access для
  одной Tab-to-link проверки недоступен; Chromium/Firefox проверку проходят.
- `npm audit` — 0 vulnerabilities. Production/remote migrations/deploy не выполнялись;
  commit/push не выполнялись.
- Final unit gate — **25 files / 73 tests**, visual home/catalog snapshot gate — GREEN.

### M10 verdict: BLOCKED AT EXTERNAL/PUBLIC-RELEASE GATE

- Manual NVDA + native Firefox и Android TalkBack + Chrome **NOT RUN**; M9 waiver
  истекает и требует revalidation перед public release.
- Production Vercel/Supabase и hosted CI существуют; exact production Auth Site URL и
  `/auth/callback` allowlist подтверждены в dashboard 2026-09-11. Custom SMTP для
  внешних magic links ещё не настроен.
- Legacy sneaker cutouts заменены 2026-09-11 оригинальным fictional ImageGen catalog
  set; updated hosted artifact и visual/performance revalidation ещё не выполнены.

До закрытия этих пунктов M10 не помечается GREEN и Release exit gate не пересекается.

- npm run build — PASS: strict typecheck + production build, 205 modules; initial JS **139.19 KiB gzip**, CSS **7.85 KiB gzip**, тяжёлые routes остаются lazy.
- npm run lint и npm run format:check — PASS.
- npm run test:run — PASS: **24 files / 71 tests**; после финальной catalog cache правки focused suite повторно PASS **5/5**.
- npm audit --omit=dev — PASS: **0 vulnerabilities**; concrete privileged credential/runtime forbidden-field scan — **0 matches**.
- Chromium M9: full suite PASS **13/13**, затем новый focused slow-response PASS **1/1** и post-fix recovery PASS **1/1**.
- Firefox + WebKit: keyboard-only full commerce journey и mobile dialog/focus journey PASS в каждом engine (**4/4** суммарно); dynamic axe — **0 violations**.
- Viewports 320×568, 360×800, 390×844, 768×1024, 1024×768, 1440×900, 200%/400%-equivalent reflow, forced colors, reduced motion и two stable visual baselines — PASS.
- Unexpected console/page errors и unexpected 4xx/5xx fail the successful critical E2E; planned failure path покрывает slow response, 503/retry, broken PDP/cart media и сохранение user state.
- M4–M8 schema не менялась, поэтому уже GREEN isolated local Supabase reset/pgTAP/RLS gates не повторялись.

**M9 verdict: GREEN WITH ACCEPTED EXCEPTION.** Manual AT проверки не считаются выполненными. Waiver record:

- owner: project owner;
- scope: только оставшиеся manual AT проверки M9 — desktop NVDA + native Firefox и Android TalkBack + Chrome, включая touch/orientation;
- reason: unavailable manual AT environment;
- expiry/revalidation trigger: перед public release;
- compensating evidence: существующие axe, Playwright, Firefox, WebKit, responsive, forced-colors и reduced-motion проверки;
- consequence: progression к M10 разрешён, но public release требует повторной оценки waiver и фактической manual AT evidence либо нового явного release exception.

## 1. Delivery strategy

План идёт маленькими vertical slices. Каждый milestone заканчивается работающим пользовательским результатом, а не набором «готовых слоёв». Loading/empty/error, responsive, accessibility, tests и browser verification входят в slice сразу.

```text
M0 runnable typed app
  ↓
M1 recognizable responsive product shell
  ↓
M2 real catalog data spine
  ↓
M3 search/filter/sort URL discovery
  ↓
M4 variant-aware PDP
  ↓
M5 guest cart
  ↓
M6 identity + wishlist + cart merge
  ↓
M7 checkout + order transaction
  ↓
M8 order history
  ↓
M9 resilience + accessibility closure
  ↓
M10 performance + deploy + portfolio evidence
```

### Release cuts

| Cut                             | После | Что можно показать                                                                           | Gate                                                                                                                   |
| ------------------------------- | ----: | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **A. Core-commerce beta**       |    M5 | Reviewable preview: бренд → catalog → URL discovery → PDP/color/size → persistent guest cart | M0–M5 exit gates green; demo честно помечает auth/checkout/orders как ещё не входящие в cut, без noop affordances      |
| **B. Complete end-to-end demo** |    M8 | Isolated demo: guest/auth continuity, wishlist, checkout, confirmation и order history       | M0–M8 green; RLS/receipt/idempotency allow+deny tests пройдены; deterministic seed и demo payment работают             |
| **C. Public portfolio release** |   M10 | Публичный polished case и live product                                                       | M9–M10 + release exit gate green; a11y AT evidence, multi-browser, performance, security, deploy и attribution закрыты |

Cut не заменяет milestone gates: он ограничивает обещаемый scope и даёт раннюю reviewable ценность без выдачи незавершённого flow за готовый.

### Global milestone rules

- Перед milestone: проверить `git status`, актуальные docs и dependency/security changelogs затронутых tools.
- После milestone: `lint`, `format:check`, `typecheck`, relevant tests, production build и browser gate.
- Не смешивать следующий feature, пока текущий exit gate не выполнен.
- Не сохранять shared MockAPI cart и не запускать mutations против него.
- Schema/payment/auth decisions с irreversible/costly эффектом получают human checkpoint до применения.
- Commit/push выполняются только по явному запросу пользователя.
- Любой Docker/Compose запуск использует отдельный project name, предварительную проверку host ports и не затрагивает resources других projects.

## 2. Milestone 0 — runnable modern foundation

### User-visible outcome

Приложение снова открывается на текущем Node, показывает typed read-only catalog fixture и имеет корректные `/`, `/catalog` и 404 route boundaries без runtime/console errors. Это ещё не редизайн, но уже стабильная точка для дальнейших slices.

### Изменяемые части

- CRA/`react-scripts` → Vite stable; `node-sass` → Dart Sass.
- JavaScript/JSX → strict TypeScript/TSX на всей маленькой codebase.
- React current stable и React Router Data Mode после отдельного compatibility step.
- Новый `main.tsx`, router/provider composition, environment validation.
- Удаление `macro-css` и опасного global outline reset; минимальный safe reset.
- ESLint, formatter, `tsconfig`, Vite/Vitest config, npm scripts, supported Node/package-manager metadata.
- Deterministic local products fixture + repository interface; никаких cart writes.
- Vitest/RTL/MSW/Playwright smoke harness и `.env.example`.
- Minimal CI workflow: clean install → lint/format/typecheck/test/build → Chromium smoke.

### Definition of Done / exit gate

- Fresh install воспроизводим из lockfile на documented Node version.
- `dev`, `build`, `preview`, `lint`, `format:check`, `typecheck`, `test:run`, `e2e:smoke` non-interactive и проходят.
- Нет `react-scripts`, `node-sass`, `macro-css` и direct Axios dependency.
- Strict TypeScript не содержит необъяснённых `any`/blanket suppressions.
- Routes не рендерят Home вне outlet; unknown path показывает 404.
- Root содержит semantic `header/main/footer`, skip link и visible focus.
- `npm audit` не содержит undocumented high/critical **direct runtime** finding.
- Baseline browser screenshots/notes записаны для следующих visual comparisons.
- Minimal CI проходит из clean checkout и использует те же non-interactive scripts, что локальная проверка.

### Tests

- Unit: fixture → Product domain adapter, money formatting, route path helpers.
- Integration: root route, catalog success, catalog error boundary, 404.
- Smoke E2E: home → catalog, direct `/catalog` reload, unknown route.
- Guard: fail test on console error/unhandled rejection/unexpected network.
- CI rehearsal: clean install/cache miss и полный required pipeline.

### Browser verification

- Chromium: `360×800`, `768×1024`, `1440×900`.
- Direct load и reload каждого route; Back/Forward.
- Keyboard: skip link, header nav, catalog link.
- Проверить отсутствие horizontal scroll и dev console errors.

### Risks

- Одновременный Vite/TS/React/router upgrade усложнит diagnosis. Делать внутри milestone последовательными checkpoints: Vite+Dart Sass → TS → React/router.
- Dart Sass меняет deprecated color functions; не пытаться сохранить broken visual output ценой legacy dependencies.
- Vite absolute asset/base-path behavior отличается от CRA; smoke проверяет production preview и deep links.

### Implementation evidence — 2026-08-28

**Status: GREEN.** M0 exit gate выполнен; M1 разрешён к началу.

- Foundation: Vite `8.2.2`, React `19.2.8`, React Router Data Mode `7.18.2`, Dart Sass `1.103.1`, strict TypeScript `6.0.3`; exact versions закреплены в lockfile. CRA, `react-scripts`, `node-sass`, `macro-css`, Axios и shared MockAPI runtime path удалены.
- Runtime: `/`, `/catalog` и meaningful `*` route работают через один Data Router/`Outlet`; catalog loader имеет отдельный recoverable error boundary. Root shell содержит `header/main/footer`, skip link и visible focus.
- Data/test spine: deterministic typed fixture repository, boundary validation, minor-unit money formatting, Vitest/RTL/MSW и Playwright harness; `.env.example`, supported Node metadata и minimal GitHub Actions CI добавлены.
- Clean-install rehearsal: `npm ci` → `lint` → `format:check` → `typecheck` → `test:run` → `build` → `e2e:smoke` прошёл локально из lockfile; `npm audit` сообщил `0 vulnerabilities`.
- Automated evidence: Vitest — `5` files / `11` tests passed; production build passed (`92.05 kB` initial JS gzip, `0.82 kB` CSS gzip); Chromium smoke — `5` tests passed, включая direct `/catalog` reload, Back/Forward, 404, keyboard skip/nav, console/page/network guard и overflow checks на `360×800`, `768×1024`, `1440×900`.
- Browser baseline: screenshots сохранены локально в ignored `.codex-temp/` (`m0-home-360.png`, `m0-catalog-768.png`, `m0-home-1440.png`) и визуально проверены. Встроенный browser runtime был недоступен из-за `windows sandbox failed: helper_unknown_error: apply deny-read ACLs`; проверка выполнена pinned Playwright Chromium на production preview, без выдачи встроенного surface за прошедший.

## 3. Milestone 1 — Solecraft shell and design-system tracer

### User-visible outcome

Пользователь видит самостоятельный бренд: focused home hero, responsive navigation, curated entry points и одну production-quality product card. «Линия посадки» объясняет ценность продукта, но не перегружает интерфейс.

### Изменяемые части

- Semantic design tokens, typography, spacing, radii, elevation, focus и motion.
- Self-hosted font subsets, app metadata/favicon/social fallback.
- Root shell: desktop/mobile nav, работающие home/catalog entry points и footer/trust links; cart/wishlist controls пока не рендерятся.
- Home hero, 2–3 curated collection teasers, reusable ProductCard tracer.
- Core primitives: Button, IconButton, Link, Price, Badge, Skeleton, EmptyState, InlineError.
- Один доступный Dialog/Sheet approach для mobile navigation после spike; commerce sheets появляются только вместе с работающими slices.

### Definition of Done / exit gate

- Visual tokens соответствуют выбранной cold-paper/asphalt/transit palette и не содержат scattered literal colors.
- Signature «Линия посадки» кодирует текстово доступные fit attributes.
- Header/nav controls имеют корректные names, states и 44 px touch targets; будущие cart/wishlist affordances отсутствуют, а не выглядят рабочими.
- Reduced motion и forced-colors не ломают meaning.
- Home имеет один `h1`; hierarchy/landmarks/skip link корректны.
- Content от 320 px до 1440 px не переполняется; zoom 200% usable.

### Tests

- Component: Button/IconButton states, ProductCard link/fit attributes, mobile-nav Sheet focus lifecycle.
- Integration: mobile nav open/close, Escape, focus return, inert background.
- Accessibility: axe для home/shell; contrast tokens проверены.
- Visual snapshots: home + card states на mobile/desktop.

### Browser verification

- `320×568`, `390×844`, `768×1024`, `1440×900`, Chrome/Firefox zoom 200%.
- Keyboard-only nav и sheet; touch targets; reduced-motion emulation.
- Проверить long Russian labels, missing image fallback и slow font load.

### Risks

- Слишком ранняя библиотека компонентов создаст generic look. Primitives строятся только из реальных tracer needs.
- Display font может ухудшить Cyrillic quality/performance; license/subset/FOIT проверяются до закрепления.
- Hero media может съесть LCP budget; сначала art direction и reserved dimensions, затем animation.
- Premature commerce icons создадут ложные affordances; cart/wishlist controls вводятся только в M5/M6 вместе с реальным state/action.

### Implementation evidence — 2026-08-28

**Status: GREEN.** M1 exit gate выполнен; работа остановлена до M2.

- Brand/system: самостоятельный shell Solecraft собран на semantic Cold Paper / Asphalt / Transit Blue / Sole Orange / Gauge Mint tokens. Unbounded, Manrope и IBM Plex Mono self-hosted из OFL Fontsource packages; подключены только Cyrillic + basic Latin subsets с `font-display: swap`. Добавлены brand mark, web manifest, social fallback и metadata.
- Responsive slice: home содержит один `h1`, fit-first hero, три curated entry point, объяснение «Линии посадки», featured ProductCard и trust/footer. Desktop navigation и accessible mobile `dialog` имеют working routes, Escape, focus trap/return, background `inert`, safe-area padding и 44 px controls. Cart/wishlist/auth affordances отсутствуют.
- Tracer/primitives: reusable ProductCard резервирует media ratio/dimensions, lazy-loads below-fold image, показывает descriptive fallback, minor-unit Price, use-case Badge и три независимых текстовых fit tracks с provenance/`unknown`. Реализованы только нужные slice primitives: Button/ButtonLink, IconButton, TextLink, Price, Badge, Skeleton, EmptyState и InlineError.
- Automated evidence: clean-lockfile rehearsal `npm ci` → ESLint → Prettier check → strict typecheck → Vitest (`9` files / `18` tests) → production build → Chromium smoke прошёл; `npm audit` — `0 vulnerabilities`. Final build: initial JS `96.71 kB` gzip, CSS `5.68 kB` gzip; font subset pass удалил ненужные Greek/Vietnamese/Latin-ext assets. Chromium production-preview suite — `14/14`; установленный Google Chrome + Firefox — `28/28`.
- Accessibility/browser evidence: axe home/shell — `0` violations; проверены один `h1`, landmarks/skip link, keyboard-only nav, mobile Sheet lifecycle, 44×44 targets, reduced motion, forced colors, missing-image fallback, slow self-hosted font load и отсутствие horizontal overflow на `320×568`, `360×800`, `390×844`, `768×1024`, `1440×900`. Chrome/Firefox 200% reflow проверен эквивалентным `720` CSS-px layout viewport.
- Visual evidence: локальные ignored screenshots `.codex-temp/m1-home-320.png`, `m1-home-390.png`, `m1-home-768.png`, `m1-home-1440.png`, `m1-catalog-1440.png` просмотрены; по результату tablet curated grid переведён в свободную 2-column композицию. Встроенный browser runtime по-прежнему блокируется Windows ACL helper; фактическая проверка выполнена реальными Google Chrome/Firefox через pinned Playwright на production preview. Preview остановлен, порт `4173` освобождён.

## 4. Milestone 2 — real catalog data spine

### User-visible outcome

`/catalog` показывает реальный seeded assortment из Supabase: stable products, variants preview, цены и availability. Slow, empty и backend error states отличаются и восстанавливаются.

### Изменяемые части

- Isolated Supabase local/test setup и отдельный production project; migration workflow выбран и задокументирован.
- Catalog tables: brands, categories, products, typed tags/use cases, variants, media, sizes, brand size guides, inventory.
- Constraints/indexes, seed dataset 24–40 products, storage/media manifest.
- Public read grants + RLS/published view contract.
- Generated DB types, Product adapters/repository, TanStack Query provider/key factory.
- Catalog grid, pagination shell, count, skeleton/empty/error/retry.
- MockAPI полностью удаляется из runtime path.

### Definition of Done / exit gate

- Migrations replay cleanly from zero; seed deterministic.
- Products/variants/sizes имеют stable IDs/slugs/SKUs и valid price/stock constraints.
- `tags(type, slug)` и `product_tags` имеют FK/indexes; `uses[]` query однозначно читает `type = use_case`.
- EU/mm size contract, brand-specific guide и three-track fit taxonomy (width/cushioning/support) имеют explicit unknown/provenance; универсальная conversion не выдумывается.
- Public видит только published safe fields; drafts/internal fields закрыты.
- RLS включена на всех exposed tables, grants проверены отдельно; automated tests не направлены в production project.
- Catalog Query не зеркалируется в Zustand/Context.
- Skeleton сохраняет layout; retry оставляет текущий route.
- Direct `/catalog?page=2` работает после production deploy preview.
- Asset source/license manifest существует; текущие 266×224 images не выдаются за PDP quality.

### Tests

- DB: constraints, unique slug/SKU/tag, product-tag FKs/indexes, size-guide mm ranges, fit enums/provenance/unknown, non-negative stock/price, public read vs draft deny.
- Unit: DB row → Product model adapter, price semantics.
- Integration/MSW: success, slow, empty, malformed payload, 500, retry, background refresh.
- E2E: load catalog, paginate, reload page 2, broken image fallback.

### Browser verification

- Network throttle: skeleton без layout shift; cached/back navigation не collapses UI.
- 1, 2, 3, 4-column behavior на representative widths.
- Screen reader: result count, price, badge, card link names.
- Inspect network: нет duplicate catalog requests или eager full-size gallery images.

### Risks

- **Costly gate:** schema и product/media dataset должны быть review до migration apply.
- Supabase Data API grants и RLS — разные controls; оба проверяются.
- Weak seed data обесценит весь visual direction; content quality входит в exit gate.

### Implementation evidence — 2026-08-28

**Status: GREEN (environment waiver accepted 2026-08-28).** M2 реализован полностью; progression к M3/M4 разрешён. Manual AT не заявлена как пройденная и перенесена в deferred evidence M9/public release gate.

- Database: существующий изолированный local/test compatibility Supabase project использует порты `55320–55329`; clean `db reset` повторно применил migration и deterministic seed (`32` published + `1` draft, `64` variants, `768` inventory rows). Generated `database.types.ts` получен из локальной schema. Remote/production не подключались.
- Security/data: brands/categories/products/variants/media/sizes/inventory/tags/brand guides имеют constraints/indexes; RLS и explicit public-read grants покрыты `34/34` pgTAP allow/deny checks. Public Data API возвращает только published safe view, draft и writes закрыты. Media manifest фиксирует ограничение legacy card assets.
- Runtime: Supabase repository + generated row adapter и TanStack Query key/provider питают реальный catalog grid; pagination/count, stable skeleton, empty, malformed/error/retry и background-refetch states покрыты. Query cache не зеркалируется в client store; MockAPI отсутствует в production path. Local stack с выключенным Auth использует документированный loopback-only sentinel без auth headers; remote URL по-прежнему требует настоящий publishable key.
- Automated evidence: ESLint, Prettier check, strict typecheck, Vitest (`10` files / `22` tests) и production build прошли. Initial JS `163.31 KiB` gzip и CSS `6.17 KiB` gzip остаются внутри budget `200/40 KiB`; Vite raw-chunk warning не является budget breach.
- Browser evidence: Chromium production-preview suite — `18/18`; M2 catalog suite в установленном Chrome + Firefox — `8/8`. Проверены real pagination, reload/Back/Forward page 2, slow skeleton, один initial Data API request, broken image fallback, 1/2/3/4 columns (`360/768/1000/1440`), no horizontal overflow и axe catalog `0` violations. Встроенный browser surface заблокирован известным Windows ACL helper; проверка выполнена реальными браузерами через pinned Playwright, preview остановлен и `4173` освобождён.
- Environment waiver: `NVDA_NOT_FOUND`, `ADB_NOT_FOUND`; manual desktop NVDA + Firefox и mobile TalkBack + Chrome journeys **не выполнены и не считаются пройденными**. Пользователь явно принял недоступность tooling для M2/M3 progression; это evidence обязательно закрывается в M9 до public release.
- Environment note: registry pull exact CLI image `17.6.1.165` зависал; локальный gate выполнен на уже установленном Supabase Postgres `17.6.1.143` через additive tag alias (тот же PostgreSQL `17.6`). Чужие containers/volumes/data, включая LifeOS, не запускались и не изменялись.

## 5. Milestone 3 — search, facets, sort and URL state

### User-visible outcome

Покупатель ищет и фильтрует пары по brand/use case/size/width/color/price/stock, сортирует выдачу, делится URL и возвращается Back/Forward без потери состояния.

### Изменяемые части

- Typed CatalogParams parser/normalizer/serializer.
- Search field с debounce/transition и committed history semantics.
- Backend/repository query mapping, stable sort и pagination reset rules.
- Desktop filter rail, mobile filter sheet, active chips, clear one/all, result count.
- No-results suggestions и invalid URL normalization.
- Query key factory привязан к normalized URL, не к raw objects.

### Definition of Done / exit gate

- Любая комбинация filters имеет canonical reproducible URL.
- Default/duplicate/unknown values нормализуются без crash и history loop.
- Изменение facet/search/sort сбрасывает page; Back возвращает предыдущее состояние и scroll policy.
- Size filter действительно учитывает in-stock inventory, а не product label.
- Mobile sheet сохраняет uncommitted/committed semantics предсказуемо.
- Search no-results предлагает изменить/очистить query, а не пустой экран.

### Tests

- Property/table unit tests: parse → normalize → serialize → parse.
- Table-driven coverage для title/brand/model/tags search, всех MUST facets и каждого sort option из spec.
- Unit: query-to-backend mapping, stable sort, page reset.
- Integration: typing, clear, multi-select, apply/cancel mobile sheet, empty/error.
- E2E: construct URL, copy/reload, Back/Forward, invalid params, Cyrillic and long query.

### Browser verification

- Desktop rail и mobile sheet на `360`, `768`, `1440`.
- Keyboard: search, chips, checkboxes, Apply/Clear, focus return.
- Slow network while changing filters; stale results не маркируются как current incorrectly.
- Touch: no hover-only facets, all controls ≥44 px.

### Risks

- Два источника state при локальном mirror filters. URL остаётся единственным committed owner.
- Search request storm и out-of-order results. Query keys/cancellation/debounce проверяются throttling test.
- Over-faceting маленького ассортимента. Facets показываются только при meaningful choice.

### Implementation evidence — 2026-08-28

**Status: GREEN (environment waiver accepted 2026-08-28).** M3 реализован полностью; progression к M4 разрешён. Manual AT не заявлена как пройденная и перенесена в deferred evidence M9/public release gate.

- URL contract: typed parse/normalize/serialize codec канонизирует `q`, repeated brand/use/color, size, width, minor-unit price range, stock, sort и page; defaults/duplicates/unknown params удаляются через replace без loop. Canonical state целиком входит в Query key, pagination сохраняет discovery params, любое search/facet/sort изменение сбрасывает page.
- Data/search: Supabase request plan реализует AND между facets и OR внутри repeated facets; size читает только `available_sizes` из in-stock inventory. Search через `simple` websearch покрывает title, brand, model и typed use-case tags. Recommended/newest/price asc/desc имеют deterministic `id` tie-break; AbortSignal + Query placeholder сохраняют прежние cards только как явно объявленный pending state.
- UI: desktop получает sticky filter rail, mobile/tablet — modal filter sheet с draft/apply/cancel, Escape, focus trap/return и scroll lock. Search debounce пишет committed state только в URL; active chips снимаются по одному/все, no-results предлагает reset. Использованы существующие Solecraft tokens и «Линия отбора», без новой UI-библиотеки или M4 affordances.
- Automated evidence: ESLint, Prettier, strict typecheck, Vitest (`13` files / `36` tests) и production build прошли. Codec round-trip/canonicalization, all-facet query plan, четыре sort mapping, page reset, desktop commits, debounced no-results recovery и mobile draft/apply/cancel покрыты. Build: JS `167.16 KiB` gzip, CSS `7.00 KiB` gzip — внутри `200/40 KiB` budget.
- Browser evidence: текущий Chromium M3 suite — `6/6`, включая slow older-request/latest-URL-wins; Firefox core M3 — `5/5`; установленный Chrome core M3 — `5/5`. В полном Chromium regression run все `18` M0–M2 scenarios прошли. Проверены invalid canonical URL, share/reload/Back/Forward, Cyrillic/title/brand/model/tag search, every required facet, deterministic price sort, no-results reset, rail/sheet, axe dialog `0`, 44 px trigger и `360/768/1440` responsive/overflow coverage.
- Browser tooling note: production screenshots на `360×800`, `768×1024`, `1440×900` созданы в ignored `.codex-temp`; встроенный browser/image viewer заблокирован тем же Windows ACL helper, поэтому визуальный просмотр через него не выдан за пройденный. Functional browser gate выполнен реальными Chromium/Chrome/Firefox через pinned Playwright; preview остановлен, `4173` свободен.
- Environment waiver: `NVDA_NOT_FOUND`, `ADB_NOT_FOUND`; catalog discovery и filter sheet **не проходили** manual NVDA + Firefox / TalkBack + Chrome journeys. Пользователь явно принял это ограничение только для progression M2/M3; deferred evidence остаётся обязательным для M9/public release gate.

## 6. Milestone 4 — product details, colorways and size inventory

### User-visible outcome

На `/products/:slug?color=:variantSlug` покупатель изучает gallery и fit details, делится выбранным colorway, выбирает доступный размер и добавляет точный SKU в корзину. Неверный slug даёт meaningful 404.

### Изменяемые части

- PDP route/loader/query, route-level lazy chunk.
- Responsive gallery, thumbnails, zoom/lightbox только если нужен и доступен.
- Variant/colorway selector, size grid, size guide, stock/fit note.
- «Линия посадки» + текстовые width/cushioning/support tracks, categorical use cases, fit provenance и not-assessed states.
- Delivery/returns trust content, price/sale semantics, related products below fold.
- Add-to-cart handoff contract `inventoryId + quantity`.

### Definition of Done / exit gate

- Direct PDP reload работает; slug 404 отличается от network error.
- Default color canonical URL не сериализует; committed color switch, reload и Back/Forward воспроизводят variant; invalid color normalizes без loop.
- Size selection намеренно local, сбрасывается при несовместимом colorway и не становится cart identity до получения точного `inventoryId`.
- Color/size combination однозначно соответствует SKU и current stock.
- Brand guide показывает EU + sourced cm только при валидном mapping; unknown/provenance видимы, fit claim не обещает персональную точность.
- Нельзя add без size или с unavailable size; error получает focus/description.
- Selected/disabled/low-stock states не кодируются только цветом.
- Gallery не вызывает CLS и не загружает все full-resolution media до нужды.
- PDP usable keyboard, touch, screen reader и zoom 200%.

### Tests

- Unit: variant/size availability matrix, default selection, color URL codec, fit enum/unknown/provenance mapping.
- Integration: PDP states, direct color query/reload/Back, invalid color normalization, size reset, unavailable stock, successful cart handoff, 404/500.
- Axe/component tests: size picker, gallery controls, price/discount.
- E2E: catalog → PDP → select color → copy/reload/Back → select size → add; invalid color, unavailable и 404 scenarios.

### Browser verification

- `360×800`: normal flow + sticky add bar; `768×1024`; `1440×900`: 7/5 split.
- Keyboard-only gallery/size/add; reduced motion.
- Shared colorway URL на fresh tab; Back/Forward; brand guide with sourced и not-assessed data.
- Throttle images/API, broken primary image, long product title/fit copy.

### Risks

- Product vs variant vs inventory identity легко смешать. Types и tests должны появиться до UI polish.
- Sticky controls могут перекрывать focus/content/safe area.
- Zoom/lightbox — optional; не добавлять, если он задерживает core size/add flow.

## 7. Milestone 5 — trustworthy guest cart

### User-visible outcome

Гость управляет size-aware cart через quick sheet и `/cart`: quantity, remove/undo, subtotal, delivery estimate, persistence после reload и ясные stock/price conflicts.

### Изменяемые части

- Pure cart domain functions и versioned Zustand guest store.
- Persistence validation/migration и multi-tab policy.
- Cart query enrichment текущими SKU/price/stock data.
- Quick cart accessible sheet + canonical cart route.
- Active header cart entry/count появляется только теперь и читает тот же cart source of truth.
- Quantity controls, remove/undo, clear, totals, empty/conflict/error states.
- Live announcements и cart count в shell.

### Definition of Done / exit gate

- Cart line key = inventory SKU identity; duplicate add увеличивает quantity в limits.
- Persisted payload содержит только IDs/quantity/version, без PII/prices/full objects.
- Sheet и route отображают одну view model; локальные Card flags отсутствуют.
- Rapid click не превышает stock и не создаёт races.
- Reload/multi-tab policy предсказуема; corrupted/old persisted data восстанавливается безопасно.
- Totals покрыты pure tests, но помечены как estimate до server checkout confirmation.
- Clear cart требует явного confirmation и не предлагает undo после подтверждения; line remove сохраняет undo. Clear сохраняется после reload.

### Tests

- Unit: add/dedupe/quantity/remove/undo/clear/totals/caps/schema migration.
- Integration: rehydrate, current price/stock enrichment, conflicts, retry, empty, clear confirmation/cancel.
- Component: sheet focus trap/Escape/return, quantity accessible names/live messages.
- E2E: PDP add → sheet → route → quantity/remove/undo → clear cancel/confirm → reload; rapid double click; multi-tab policy.

### Browser verification

- Full-width mobile sheet с `100dvh`/safe-area и sticky totals.
- Keyboard/screen reader cart updates; focus after remove/undo.
- Offline/500 current-data refresh: persisted line не теряется молча.
- Zoom 200%, long names и max quantity.

### Risks

- Persisting server objects создаст stale price/data leak; store schema review обязателен.
- Multi-tab merge может терять update; выбрать и документировать конкретную policy.
- Optimistic animation не должна скрывать rejected stock constraint.

## 8. Milestone 6 — authentication, wishlist and account continuity

### User-visible outcome

Гость сохраняет wishlist, может войти по email OTP/magic link и получить user-owned wishlist/cart на другом сеансе. После входа guest data объединяется прозрачно; после выхода private data исчезает из UI/cache.

### Изменяемые части

- Supabase Auth setup, callback/return URL validation, auth/session provider.
- Profiles, wishlist, authenticated carts/items migrations + owner-only RLS/grants.
- Guest wishlist store и authenticated Query/mutations.
- Active wishlist route/header entry/count появляются только теперь и читают guest или authenticated owner.
- Deterministic guest/server cart/wishlist merge service.
- Sign-in, callback, account shell, auth expired/retry states.

### Definition of Done / exit gate

- Browse/cart/checkout по-прежнему доступны guest.
- Return URL не допускает open redirect и возвращает пользователя к исходному flow.
- Owner может CRUD свои wishlist/cart rows; anon/other user получают deny.
- Merge retry-safe, учитывает unavailable/quantity conflicts и очищает guest state только после success.
- Authenticated cart quantity/remove/clear имеют pending guard, rollback/retry и authoritative reconciliation.
- Guest wishlist переживает reload, deduplicates IDs и безопасно сбрасывает corrupted/version-incompatible payload.
- Sign-out очищает private Query cache и не копирует private cart в guest store.
- Session expiry сохраняет допустимый guest/cart context и объясняет recovery.

### Tests

- DB/RLS: anon, owner, different user allow/deny; ownership reassignment deny.
- Unit: merge matrices, conflict report, safe return URL.
- Integration: auth loading/error/expired; guest wishlist add/reload/dedupe/remove/corrupted payload; server cart quantity/remove/clear pending/failure/rollback/retry; merge success/failure/retry.
- E2E с двумя isolated users: guest wishlist reload; sign-in/out; cross-user denial; authenticated wishlist persistence; cart merge и rejected server-cart mutation recovery.

### Browser verification

- Guest wishlist → sign-in → return → merged state.
- Sign-out → next user на том же browser не видит прошлые private data.
- Keyboard/OTP paste/autocomplete; error/live messages.
- Mobile auth callback и interrupted network recovery.

### Risks

- **Security gate:** auth/RLS policies review и deny tests до включения production data.
- Magic-link redirect configuration различается по environments.
- Merge может создавать silent loss; UI summary и deterministic test table обязательны.

## 9. Milestone 7 — checkout and atomic order creation

### User-visible outcome

Пользователь проходит contact → delivery → demo payment → review, получает stock/price validation и создаёт ровно один заказ даже при double-click/retry. Guest checkout разрешён, а его receipt безопасно переживает refresh в той же browser session.

### Изменяемые части

- Nested checkout routes/step guard и checkout state machine/form model.
- Accessible contact/delivery/payment/review forms, autocomplete и error summary.
- Orders/order items/address schema, privacy/retention decision.
- Transactional RPC/Edge Function с authoritative price/stock/totals и idempotency.
- Demo payment adapter: success/decline/timeout; explicit demo labeling.
- Conflict resolution и success route; cart clears only after confirmed order.
- Scoped guest receipt service: opaque high-entropy token, server-side hash/TTL, sessionStorage-only client capability и PII-minimized response.

### Definition of Done / exit gate

- Empty cart не входит в checkout; invalid step redirect не теряет допустимый draft.
- Raw payment secrets/card data не собираются, не сохраняются и не логируются.
- Server ignores client totals, атомарно создаёт order/items и корректирует stock.
- Idempotency key предотвращает duplicate order при double submit/refresh/retry.
- Order items содержат immutable snapshots.
- Price/stock conflict возвращает actionable affected lines.
- Signed-in success читает order как owner; guest success требует valid scoped receipt capability.
- Guest receipt refresh-safe в той же session; missing/wrong/expired token fails closed одинаково и не раскрывает existence/PII.
- Raw guest token отсутствует в URL, localStorage, analytics/error logs и persisted Query cache.

### Tests

- Unit: step guards, form schemas, delivery calculation presentation, safe draft serialization.
- DB/function: stock race, rollback, idempotency repeat, authoritative pricing, constraints, receipt hash/TTL/revocation.
- Integration: validation summary, decline, timeout, 409 conflict, retry, success; missing/wrong/expired guest receipt capability.
- E2E: guest success + same-session refresh; fresh session without token fails closed; signed-in success; double-click; refresh review/success; decline/timeout/conflict.

### Browser verification

- Autofill-friendly labels/names/autocomplete, paste, mobile keyboards/input modes.
- Keyboard step navigation, error focus/summary, no disabled dead end.
- Slow network and refresh at each step; cart preserved until success.
- Inspect URL/storage/network/logs: receipt token есть только в sessionStorage/request body и не попадает в telemetry.
- Screen reader announces step, errors and order completion once.

### Risks

- **One-way/costly gate:** PII schema, retention и transactional API review до migration.
- Checkout state can become a second global store; form/route ownership stays explicit.
- Demo payment must not look like a real card collection or imply production security certification.
- Receipt capability leak даст private-order exposure; endpoint projection, short TTL, CSP/log redaction и deny tests входят в security gate.

## 10. Milestone 8 — order confirmation, history and detail

### User-visible outcome

Signed-in customer opens account, sees paginated order history/status and immutable order detail. Guest получает confirmation number и понятное объяснение, что account history для него не создана.

### Изменяемые части

- `/account/orders` and `/:orderNumber` lazy routes/queries.
- Order list/card/detail/status presentation and empty/loading/error states.
- Confirmation → account navigation, private cache keys and invalidation.
- Order number/date/currency/status formatting; support/help links.
- General guest lookup contract остаётся вне v1; M7 same-session receipt capability не является публичным search/history surface.

### Definition of Done / exit gate

- Order history показывает только orders текущего user; direct чужой order не раскрывает existence/details.
- Snapshot data остаётся прежней после изменения catalog seed/product price.
- Empty account ведёт в catalog; error даёт retry/help, не dead end.
- Pagination/direct detail URL/Back работают.
- Status имеет text + visual cue; numbers tabular и locale-aware.

### Tests

- DB/RLS: owner/other/anon detail/list denial.
- Unit: status/date/money formatting и snapshot mapping.
- Integration: list/detail loading/empty/error/pagination/not-found.
- E2E: checkout success → history → detail; direct reload; second user denial.

### Browser verification

- Mobile order cards и desktop detail, long address/product snapshot.
- Keyboard headings/links/status; screen reader order summary.
- Back/Forward, slow network, deleted catalog product, unknown order number.

### Risks

- Joining live products breaks historical truth; UI reads order snapshots.
- Distinguishing forbidden/not-found must not leak another order existence.
- Guest tracking can expand auth/security scope; keep behind explicit decision.

## 11. Milestone 9 — cross-journey resilience and accessibility closure

### User-visible outcome

Полный магазин остаётся понятным при slow/offline/500/broken image/session expiry, работает keyboard/screen reader/zoom и выглядит устойчиво на mobile/tablet/desktop.

### Изменяемые части

- Error mapping/boundaries, retry/timeout policies, image/media fallbacks.
- Global live-message strategy, focus management audit, skip/heading/landmark cleanup.
- Reduced motion, forced colors, contrast and zoom fixes.
- Full state matrix audit against spec.
- Playwright axe, visual regression and manual QA checklists.
- Eliminate console warnings, flaky races and stale cache leaks.

### Definition of Done / exit gate

- Каждый MUST surface имеет distinct loading/empty/error/recovery state.
- Нет известных WCAG 2.2 Level A/AA failures на home/catalog/PDP/cart/wishlist/checkout/orders; все axe findings triaged, serious/critical = 0.
- Сохранено manual evidence минимум для desktop `NVDA + Firefox` и mobile `TalkBack + Chrome` на critical journey.
- Deferred from M2/M3 by explicit environment waiver: catalog grid, discovery controls и mobile filter sheet должны войти в эти NVDA/Firefox и TalkBack/Chrome journeys; waiver разрешает только progression к M4 и не распространяется на public release gate.
- Full critical journey keyboard-only; dialogs/sheets trap/return focus correctly.
- Zoom 200%, forced colors и reduced motion preserve functionality/meaning.
- Unexpected console error/unhandled rejection/network request fails E2E.
- No P0/P1 finding from baseline survives; accepted exceptions documented with owner/reason.

### Tests

- Full integration state matrix, retry/rollback/session-expiry cases.
- E2E: Chromium/Firefox/WebKit critical flows and target viewports.
- Axe after opening dynamic regions, не только initial page; every finding имеет disposition.
- Visual snapshots for stable key states; versioned NVDA/Firefox и TalkBack/Chrome screen-reader evidence + keyboard checklist.

### Browser verification

- Viewports: `320×568`, `360×800`, `390×844`, `768×1024`, `1024×768`, `1440×900`.
- 200% zoom Chrome/Firefox; forced colors; reduced motion.
- NVDA + Firefox desktop и TalkBack + Chrome mobile: landmarks, names/states, live messages, dialogs, forms, receipt/order summaries.
- Offline/Slow 3G/500/timeout/broken image across catalog/PDP/cart/checkout/orders.
- Touch-only and keyboard-only journeys; mobile safe areas/orientation.

### Risks

- Hardening milestone не должен стать свалкой отложенных states; missing state блокирует более ранний milestone.
- Axe не находит все issues; manual checks обязательны.
- Недоступность desktop/mobile AT environment блокирует public release; matrix планируется до M9, а не обнаруживается в конце.
- Visual snapshots станут brittle, если покрывать каждую card вместо stable pages/states.

## 12. Milestone 10 — performance, CI hardening, deployment and portfolio case

### User-visible outcome

Магазин быстро открывается по live URL, deep links работают, critical flows защищены CI, а README/case study честно показывает baseline → decisions → result с измерениями.

### Изменяемые части

- Route/component bundle analysis, image/font optimization, intent prefetch tuning.
- Lighthouse/Web Vitals instrumentation и bundle budgets.
- CI hardening поверх M0 pipeline: bundle/Lighthouse/deploy gates, artifact reports и scheduled 3-browser suite.
- Static hosting config, SPA rewrites, cache/security headers, env/secrets, preview/prod separation.
- Production-safe logging/analytics interface без PII.
- README, architecture summary, screenshots/video, test/performance reports и known limitations.

### Definition of Done / exit gate

- Initial route JS ≤200 KiB gzip, CSS ≤40 KiB; route chunk exceptions measured/documented.
- Controlled mobile Lighthouse: Performance ≥90, Accessibility ≥95; CLS ≤0.1.
- Field-ready targets/instrumentation: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 p75.
- Production deploy проходит direct reload всех routes; hashed assets cacheable; private data не cached publicly.
- CI green from clean checkout; no secret in repo/bundle/logs.
- README содержит setup, architecture/state ownership, test commands, demo account/payment, decisions, limitations and media attribution.
- Portfolio evidence показывает не только beauty shots, но URL state, errors, mobile, keyboard, tests и performance.

### Tests

- Bundle-budget script and production build inspection.
- Lighthouse CI controlled profiles.
- Deployed smoke for home/catalog/PDP/wishlist/cart/checkout/auth, `/account/orders` и `/account/orders/:orderNumber` deep links.
- Scheduled multi-browser E2E; dependency/security scan with documented triage.

### Browser verification

- Cold-cache mobile throttle и warm navigation; inspect LCP element, requests, route chunks.
- Real deployed URL on mobile/tablet/desktop; no localhost-only assumptions.
- Social/metadata fallback, 404, auth callback and SPA rewrites.
- Console/network/privacy review in production build.

### Risks

- Lighthouse score gaming вместо user performance; budgets сопровождаются trace/network inspection.
- Over-prefetch harms data/media budgets; prefetch only on intent.
- Hosting/auth redirect mismatch может проявиться только на preview/prod; оба environments входят в gate.

## 13. Release exit gate

Transformation завершена только если одновременно:

- все `MUST` requirements из `TRANSFORMATION_SPEC.md` трассируются к passed tests/browser evidence;
- каталог, PDP, variants, URL discovery, cart, wishlist, checkout и orders работают end-to-end;
- нет открытых P0/P1 defects;
- source of truth boundaries соответствуют `ARCHITECTURE.md`;
- RLS allow/deny и checkout idempotency/transaction tests проходят;
- strict types/lint/format/tests/build/CI green;
- critical E2E проходят Chromium, Firefox и WebKit;
- accessibility/performance/security gates выполнены или есть явно согласованное исключение;
- live deploy и portfolio docs воспроизводимы;
- legacy MockAPI/CRA code и shared cart data не входят в production path.

## 14. Stretch backlog — только после release gate

- Questionnaire Fit Finder;
- compare products;
- real Stripe test integration through provider adapter/webhook;
- guest order lookup;
- reviews and ratings;
- release calendar/notifications;
- shoppable looks;
- admin/CMS;
- SSR/prerender/SEO program;
- PWA/offline catalog;
- realtime stock.
