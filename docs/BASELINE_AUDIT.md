# Legacy training storefront — baseline audit

> Статус: исследование текущего состояния, без реализации
> Дата среза: 2026-08-27
> Репозиторий: `react-sneakers`, ветка `master`
> Связанные документы: [PRODUCT_OPTIONS.md](./PRODUCT_OPTIONS.md), [TRANSFORMATION_SPEC.md](./TRANSFORMATION_SPEC.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [../PLAN.md](../PLAN.md)

## 1. Резюме

Текущий проект — небольшой учебный прототип, а не основа, которую достаточно визуально «дополировать». В нём есть узнаваемая заготовка магазина: список товаров, поиск по названию, избранное, корзина и React Router. Но критические пользовательские потоки либо не завершены, либо нарушают целостность данных, приложение не собирается в текущем окружении, а публичный MockAPI используется как общая для всех посетителей корзина.

Рекомендуемая стратегия — не переписывание одним большим релизом и не косметический редизайн. Нужна последовательная замена vertical slices: сначала восстановить современный toolchain и тестовый контур, затем провести через целевую архитектуру каталог, discovery, PDP/варианты, корзину, identity/wishlist, checkout и заказы. Каждый slice должен сразу включать loading/empty/error, responsive, accessibility и browser-проверки.

Итоговый baseline verdict: **P0 / transformation required**.

## 2. Метод и проверенная область

Проверены:

- все 9 файлов в `src/` — 671 строка JSX/JS/SCSS;
- `package.json`, `package-lock.json`, CRA HTML/manifest и локальные media assets;
- история и чистота worktree;
- установленное dependency tree;
- текущие MockAPI endpoints и фактическая схема ответов;
- запуск dev server на локальной машине;
- наличие тестов, responsive rules, accessibility hooks, routing/data/error patterns;
- актуальные официальные рекомендации React, Vite, React Router, TanStack Query и Supabase.

Команды аудита были read-only, кроме временного запуска dev server. Временный процесс и его дочерние процессы остановлены; порт `3000` освобождён. `npm audit fix`, форматтеры, codemods, migrations и другие изменяющие команды не запускались.

### Ограничение визуальной проверки

Полноценный screenshot/browser walkthrough текущего UI невозможен по двум независимым причинам:

1. Browser runtime в сессии не поднялся из-за системной ACL-ошибки sandbox.
2. Само приложение не компилирует SCSS на Node `22.15.1`: `node-sass@7.0.3` не поддерживает runtime ABI 127, webpack завершает компиляцию с 4 errors и 2 warnings.

HTTP `200` от CRA dev server в этом состоянии отдаёт только оболочку dev server; пользовательского приложения для честной визуальной проверки нет. Поэтому UI-выводы ниже основаны на JSX/CSS, media metadata и runtime logs, а не выдаются за screenshot-аудит. Browser baseline следует повторить первым действием после milestone 0.

## 3. Фактический технический срез

| Область | Текущее состояние | Вывод |
|---|---|---|
| Runtime | Node `22.15.1`, npm `10.9.2` | Node современный, старый Sass/toolchain — нет |
| Build | CRA / `react-scripts@5.0.1` | Deprecated и не проходит локальный dev compile |
| React | `18.2.0` | Рабочая база, но отстаёт от актуальной стабильной ветки |
| Routing | `react-router-dom@6.9.0` | Установлен, но route tree собран неверно |
| Data access | `axios@1.3.4` прямо из `App.js` | Нет API boundary, cache, cancellation, states, rollback |
| Server state | 5 `useState` в `App` | Remote, domain и UI state смешаны |
| Backend | публичный MockAPI | Нет auth, ownership, relations, transactions, inventory |
| Styling | global SCSS + CSS Module + `macro-css` + `node-sass` | Несогласованная система, build blocker, reset удаляет focus |
| Tests | библиотеки установлены, test files отсутствуют | Нулевая regression safety net |
| Type safety | JavaScript/JSX | Нет контракта product/variant/cart/order |
| CI/quality | нет lint/typecheck/build/e2e pipeline | Нельзя доказать production readiness |
| Docs | дефолтный CRA README | Проект и решения не объяснены работодателю |

`package-lock.json` использует lockfile v2 и занимает около 1.3 MB. Большая часть дерева — наследие `react-scripts` и `node-sass`, а не сложность самого продукта.

### Dependency security

`npm audit` на дату среза сообщил **83 vulnerabilities: 15 low, 19 moderate, 42 high, 7 critical**. Значительная часть относится к transitive build/test toolchain, поэтому это не равняется 83 напрямую эксплуатируемым production-уязвимостям. Однако среди direct dependencies присутствуют устаревшие `axios@1.3.4` и `react-router-dom@6.9.0`, а `react-scripts` удерживает уязвимую и неподдерживаемую цепочку. `npm audit fix --force` здесь неприемлем: он предлагает breaking replacements и не решает архитектурную причину. Нужна контролируемая замена toolchain.

React официально deprecated Create React App и советует существующим приложениям миграцию на framework либо build tool вроде Vite: [Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app).

## 4. Текущая архитектура и data flow

```text
BrowserRouter
  └─ App
      ├─ remote products ─┐
      ├─ remote cart ─────┤
      ├─ local wishlist ──┼─ useState in one component
      ├─ local search ────┤
      └─ drawer UI state ─┘
            │
            ├─ direct axios GET/POST/DELETE → public MockAPI
            └─ props drilled into Home / Card / Overlay / Favourites
```

Разделения между server state, URL state, persisted client state и ephemeral UI state нет. Компонент `App` одновременно является composition root, API client, cart service, wishlist service, search controller и route layout.

## 5. Findings по приоритету

### P0 — блокируют рабочий продукт

#### P0.1. Проект не запускается в актуальном окружении

- Evidence: `package.json:11`, `package.json:18`; SCSS imports в `src/index.js:4` и `src/components/Card/index.js:2`.
- Runtime: `node-sass@7.0.3` сообщает unsupported runtime 127; обе SCSS entry points падают.
- Пользовательский эффект: приложение невозможно открыть для локальной разработки или browser QA.
- Направление: CRA → Vite, `node-sass` → Dart Sass (`sass`), затем зафиксировать поддерживаемую Node version.

#### P0.2. Cart backend публичный и общий для всех пользователей

- Evidence: hardcoded endpoints в `src/App.js:25-34`, `src/App.js:37-39`, `src/App.js:50-52`.
- Runtime-срез: `/items` вернул 10 товаров без `id`; `/cart` — 14 строк, включая повторяющиеся product signatures. Состояние endpoint изменяемое и может отличаться после даты аудита.
- Пользовательский эффект: один посетитель видит и удаляет позиции другого; отсутствуют privacy, ownership и достоверная история.
- Направление: shared cart data **не мигрировать**. Ввести guest cart локально и user-owned cart/order data в backend с authorization/RLS.

#### P0.3. Добавление и удаление корзины нарушают целостность

- Evidence: `src/App.js:37-40`, `src/App.js:50-53`, `src/components/Card/index.js:15-18`.
- `POST` не `await`-ится, response с backend `id` игнорируется, но локально добавляется объект без `id`.
- Последующий delete идёт на `/cart/undefined`; фильтрация по `undefined` может убрать из UI несколько новых строк, не удалив их на backend.
- Ошибки API не откатывают optimistic UI и не показываются пользователю.

#### P0.4. Favourites flow падает при взаимодействии

- Evidence: `src/pages/Favourites.jsx:33-40` передаёт `onFavourite`, тогда как Card ожидает `onFavorite` (`src/components/Card/index.js:8,20-22`); `onPlus` не передан, но вызывается в `src/components/Card/index.js:15-17`.
- Favorite objects создаются без `id` (`src/components/Card/index.js:20-22`), а removal требует `id` (`src/pages/Favourites.jsx:42`, `src/App.js:55-57`).
- Пользовательский эффект: remove не адресует товар, heart/add-to-cart могут вызвать `TypeError`.

#### P0.5. Checkout отсутствует, суммы недостоверны

- Evidence: header total `1205 руб.` в `src/components/Header.js:15-18`; total/tax `21 498` и `1074` в `src/components/Overlay.js:55-69`; checkout button не имеет handler.
- Пользовательский эффект: витрина создаёт ложное ощущение коммерческого потока, но цена не связана с корзиной, заказ не создаётся.

### P1 — высокая продуктовая и инженерная ценность

#### P1.1. Routing фактически не маршрутизирует каталог

- Evidence: пустой route `/` в `src/App.js:75-77`; `Home` рендерится вне `<Routes>` в `src/App.js:89-96`.
- `/favourites` показывает wishlist и каталог одновременно; неизвестные URL также показывают каталог; отсутствуют PDP, cart, checkout, account, orders, 404 и route error boundaries.

#### P1.2. Нет loading, empty-search, error и retry states

- Evidence: GET effects в `src/App.js:16-35` обрабатывают только success; `src/pages/Home.jsx:34-49` сразу рендерит массив.
- Пустой initial array визуально неотличим от пустого каталога; rejected Promise не перехватывается; search без совпадений не объясняет следующий шаг.

#### P1.3. Responsive layout отсутствует

- Единственное layout-ограничение — `max-width: 1080px` (`src/index.scss:19-26`). `@media`, CSS grid/container queries и fluid rules отсутствуют.
- Drawer имеет `width: 420px` плюс `padding: 30px` при content-box (`src/index.scss:109-119`), поэтому переполняет узкий viewport.
- Catalog — flex-wrap фиксированных карточек `220px` + margin-right (`src/components/Card/Card.module.scss:1-10`), без управляемых gutters/columns.

#### P1.4. Keyboard accessibility системно сломана

- `macro-css` применяется на корневом `.clear` (`src/App.js:64`, `src/index.js:5`) и задаёт `outline: none` всем потомкам (`node_modules/macro-css/src/clear.scss:1-5`).
- Cart trigger — `li onClick` (`src/components/Header.js:14-17`), clear/remove/close — click handler на `img` (`src/pages/Home.jsx:20-25`, `src/components/Overlay.js:7-12,46-51`). Они не получают keyboard semantics.
- Search input не имеет visible label/accessibility name (`src/pages/Home.jsx:17-31`).
- Drawer не имеет `role="dialog"`, accessible name, focus trap, Escape, focus return или scroll lock (`src/components/Overlay.js:1-76`).

#### P1.5. Семантика и accessible names несогласованы

- `Link` оборачивает `li`, нарушая структуру списка (`src/components/Header.js:14-24`).
- Decorative icons имеют шумные alt `Arrow`, `Plus`, `Unliked`, а product image всегда называется `Sneakers` (`src/components/Card/index.js:27-47`).
- Иконки меняют состояние, но accessible name не меняется; async updates не объявляются через live region.
- В `Favourites` и `Overlay` используется `class` вместо `className` (`src/pages/Favourites.jsx:19-24`, `src/components/Overlay.js:16-29`).
- `<html lang="en">` конфликтует с русским интерфейсом (`public/index.html:2`).

#### P1.6. Visual system не проходит quality floor

- Global colors и Card Module используют несвязанные literal values (`src/index.scss:3-26`, `src/components/Card/Card.module.scss:1-19`), tokens отсутствуют.
- Тёмный текст `rgb(24,24,26)` на фоне `#4b4b4b` карточки имеет явно недостаточный contrast для основного текста.
- Типографика ограничена Inter, scale и роли не заданы; hover-only lift не имеет keyboard/reduced-motion эквивалента (`src/components/Card/Card.module.scss:26-29`).
- UI copy смешивает русский и английский accessible text; currency не форматируется через `Intl.NumberFormat`.

#### P1.7. Domain model не поддерживает e-commerce

У товара есть только `title`, `price`, `imageUrl`. Нет stable id/slug, brand/category, descriptions, media gallery, colorway, variant/SKU, size, stock, compare-at price, tags/fit data. Cart line не различает размер и вариант; quantity отсутствует; order snapshot невозможен.

### P2 — существенный technical debt

#### P2.1. Component state расходится с source of truth

- Card хранит `isAdded` и `isFavourite` локально (`src/components/Card/index.js:12-23`), независимо от cart/wishlist arrays в `App`.
- После server refresh, удаления из drawer или смены route карточка может показывать неверное состояние.

#### P2.2. Keys и props ненадёжны

- Product key — `imageUrl` (`src/pages/Home.jsx:40-47`), а не domain id.
- В wishlist key стоит на вложенном Card, а outer sibling wrapper key не имеет (`src/pages/Favourites.jsx:31-47`).
- Cart rows не имеют key (`src/components/Overlay.js:35-53`).
- `className={styles}` передаёт объект CSS Module как строку (`src/components/Card/index.js:41-46`).

#### P2.3. Поиск — локальный и несохраняемый

- Client-side title substring filter выполняется прямо в render (`src/pages/Home.jsx:35-48`).
- Search не попадает в URL, не переживает reload/back-forward, не имеет debounce, count, suggestions или empty recovery.

#### P2.4. Asset pipeline непригоден для PDP

- 10 product images имеют разрешение всего `266×224`, при этом хранятся одновременно в PNG и JPG.
- В `public/img/bg-ez` есть крупные неиспользуемые editorial images и один unreadable для текущего metadata tool WebP.
- Нет responsive `srcset`, AVIF/WebP strategy, lazy loading, preload для LCP, source/license manifest.

#### P2.5. Maintainability и documentation

- Нет API client/repository, domain services, feature boundaries, design tokens, environment config, lint scripts, formatter, CI или meaningful README.
- Закомментированный fetch и недописанная favorite toggle logic оставлены в `src/App.js:17-24,42-46`.
- Тестовые библиотеки лежат в `dependencies`, а не в `devDependencies` (`package.json:6-8`).

## 6. Gap matrix относительно целевого продукта

| Capability | Baseline | Gap |
|---|---|---|
| Полноценный каталог | 10 карточек из MockAPI | Нет schema, pagination, states, categories |
| Product details | Нет | Новый route и data model |
| Размеры/варианты | Нет | Variant/SKU/inventory model |
| Поиск | Только title substring | URL, debounce, backend query, empty/error |
| Filters/sort | Нет | Facets, canonical URL codec, query |
| URL state | Нет | Search params как source of truth |
| Cart | Shared remote array | Guest persistence, quantity, variant, totals, sync |
| Wishlist | Session-only broken array | Guest + authenticated ownership/merge |
| Checkout | Неактивная кнопка | Multistep forms, server validation, order transaction |
| Order history | Нет | Auth, order snapshots, RLS, list/detail routes |
| Loading/empty/error | Только 2 cart/wishlist empty blocks | State contract для каждого surface |
| Responsive | Нет | 4/8/12-column adaptive system |
| Accessibility | Несколько alt, но focus/semantics broken | WCAG 2.2 AA + manual/automated verification |
| Tests/E2E | Нет | Vitest/RTL/MSW/Playwright/axe/RLS tests |
| Performance | Не измеряется | Route splitting, media pipeline, budgets, Web Vitals |

## 7. Что стоит сохранить

- Саму предметную область и узнаваемый sneaker-commerce сценарий.
- Небольшой размер репозитория: миграцию можно вести вертикально без долгой совместимости двух приложений.
- React function components как концептуальную основу.
- Наличие React Router как сигнал, что route-oriented продукт ожидаем.
- Существующие 10 products как временные fixtures для regression/smoke, но не как финальный content set.
- Русскоязычную локаль и цены в рублях как обратимое product assumption.

Не следует сохранять public cart records, hardcoded totals, `node-sass`, CRA, `macro-css`, компонентные флаги `isAdded/isFavourite` и прямые HTTP-вызовы из composition root.

## 8. Baseline risks

| Risk | Вероятность / эффект | Ответ в плане |
|---|---|---|
| Big-bang rewrite без проверяемых slices | Высокая / высокий | Milestones с user-visible exit gate |
| Одновременная смена toolchain, UI, backend и model | Высокая / высокий | Foundation и catalog spine разделены |
| Supabase принят без RLS/transaction design | Средняя / критический | Schema review + RLS allow/deny tests до user data |
| URL filters и Query cache расходятся | Средняя / высокий | Единый typed URL codec → query key |
| Guest/auth cart merge теряет позиции | Средняя / высокий | Versioned local schema + deterministic merge tests |
| Visual wow строится на тяжёлых media | Высокая / высокий | Media budget и art direction до массовой загрузки assets |
| Accessibility отложена на финал | Высокая / высокий | A11y checks в DoD каждого milestone |
| Реальный payment раздувает scope | Средняя / высокий | Demo payment adapter в обязательном scope; Stripe — gated extension |

## 9. Baseline exit condition

Baseline считается закрытым, когда:

- findings отражены в целевых requirements и milestones;
- решение по stack и state ownership зафиксировано в `ARCHITECTURE.md`;
- shared MockAPI cart явно исключён из migration scope;
- первый implementation milestone начинается с воспроизводимой сборки и browser baseline;
- до отдельного запроса пользователя не меняются `src/`, dependencies и backend.
