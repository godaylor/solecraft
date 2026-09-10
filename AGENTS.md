# AGENTS.md — правила работы с Solecraft

## Назначение проекта

Solecraft — самостоятельный portfolio-grade e-commerce продукт: магазин городских кроссовок с fit-first опытом выбора по ширине, амортизации и сценарию использования. Исходный учебный проект и его attribution сохраняются в baseline и media-source документах.

Текущий этап — M10, подготовка portfolio release. Пользователь 2026-09-08 разрешил необходимые локальные изменения. Commit, push, deploy и изменения облачной инфраструктуры требуют отдельного запроса. Публичный release gate остаётся открытым до подтверждённых manual AT, media rights и deployed checks.

## Источники истины

Перед работой прочитай документы в этом порядке:

1. [`docs/BASELINE_AUDIT.md`](docs/BASELINE_AUDIT.md) — подтверждённое состояние legacy-проекта и риски.
2. [`docs/PRODUCT_OPTIONS.md`](docs/PRODUCT_OPTIONS.md) — выбранная концепция, визуальная система и сравнительные ориентиры.
3. [`docs/TRANSFORMATION_SPEC.md`](docs/TRANSFORMATION_SPEC.md) — продуктовые требования и acceptance criteria.
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — целевая архитектура и границы ответственности.
5. [`PLAN.md`](PLAN.md) — порядок vertical milestones и exit gates.

Если реализация расходится с этими документами, не маскируй расхождение. Сначала зафиксируй причину и обнови соответствующее решение или запроси направление пользователя, если меняется продуктовый scope.

## Обязательный рабочий протокол

- В начале каждой задачи проверь `git status --short --branch`, `git diff --stat` и релевантный diff.
- Считай все существующие незакоммиченные изменения пользовательскими. Не перезаписывай и не откатывай их.
- Работай только в текущем milestone. Не подтягивай функции из следующих milestones «заодно».
- Не удаляй и не переписывай Git-историю. Не используй destructive reset/checkout/clean.
- Не делай commit, push, PR, deploy, внешние записи или миграции production-данных без явного запроса.
- Для ручных правок используй `apply_patch`; форматтер допустим только на точно ограниченном наборе изменённых файлов.
- Не мигрируй содержимое публичной MockAPI-корзины: это общие и дублированные данные, а не доверенный пользовательский источник.
- Не добавляй библиотеку без конкретной обязанности, которую не покрывает текущий стек или web platform. Зафиксируй trade-off в архитектурном документе, если решение существенно.
- После изменения показывай, какие файлы затронуты, какие проверки запущены и что осталось непроверенным.

## Зафиксированное техническое направление

Базовый стек модернизации:

- Vite вместо Create React App;
- strict TypeScript;
- актуальный стабильный React и React Router Data Mode;
- TanStack Query для server state;
- URL search params как источник истины для поиска, фильтров, сортировки и пагинации;
- Zustand только для versioned guest cart и guest wishlist;
- локальный React state для краткоживущего UI;
- Supabase Postgres, Auth и Storage; атомарное создание заказа через Edge Function или транзакционный RPC;
- CSS Modules, Dart Sass и CSS custom properties;
- Vitest, React Testing Library, MSW, Playwright и axe;
- React Hook Form и Zod только для действительно сложных форм checkout/account.

Не вводи Redux Toolkit, Next.js, Tailwind, UI-kit или вторую библиотеку server state без нового доказанного требования. Не используй Zustand как копию Query cache и не складывай remote entities в глобальный client store.

Axios после миграции не нужен: используй Supabase client или нативный `fetch` через типизированный data-access слой.

## Границы состояния и data flow

| Вид состояния | Владелец | Примеры |
|---|---|---|
| Навигационное | React Router URL | `q`, brands, sizes, colors, price, sort, page |
| Серверное | TanStack Query | каталог, PDP, наличие, профиль, wishlist, заказы |
| Гостевое долговременное | versioned Zustand persistence | inventory ID, quantity, wishlist product ID |
| Сессионное | Supabase Auth provider | user/session/auth transition |
| Язык интерфейса | Locale provider + versioned localStorage | `ru` по умолчанию, `en`, безопасная миграция legacy keys |
| Локальное UI | component state | открытый popover, active gallery image, disclosure |

Правила:

- Query keys строятся фабриками и включают нормализованные параметры запроса.
- Компоненты не вызывают Supabase/HTTP напрямую; они используют domain query/mutation functions.
- URL codec должен иметь unit tests на parse, normalize и serialize.
- Optimistic update допустим только с rollback и серверной reconciliation.
- Cache invalidation должна быть точечной, а не глобальной по всем queries.
- Guest-to-user merge корзины и wishlist детерминирован, идемпотентен и покрыт тестами.

## Домен и данные

- Product, product variant/colorway, size и inventory item — разные сущности со стабильными ID; sellable SKU принадлежит точному inventory item.
- В URL используется стабильный product slug; identity строки cart — `inventoryId` точного variant + size + SKU, а не variant/title/image URL.
- Деньги хранятся целым числом в minor units вместе с currency. Не вычисляй финальную сумму из форматированных строк или client-supplied price.
- Остаток, актуальная цена, скидка, доставка и итог заказа повторно проверяются на сервере.
- `order_items` сохраняют immutable snapshot имени, SKU, размера, цвета и цены на момент покупки.
- Checkout принимает idempotency key и не должен создавать два заказа при повторном submit/retry.
- Локальная корзина хранит только идентификаторы, количество, версию схемы и безопасные timestamps. Не хранит PII, токены, полные товары или доверенные цены.

## Security и Supabase

- В браузере разрешён только publishable/anon key. Service-role key никогда не попадает в frontend, `.env` для клиента, лог или документацию.
- RLS включена для каждой таблицы в exposed schema, включая catalog/reference tables; public catalog открывается только явной read policy и минимальными table/function grants.
- Owner policies должны ограничивать `select`, `insert`, `update`, `delete`; для update проверяй и `USING`, и `WITH CHECK`.
- Views с пользовательскими данными используют безопасную модель исполнения, включая `security_invoker`, где это применимо.
- Любая privileged mutation проходит через узкий server-side контракт. Клиент не назначает владельца, статус или итог заказа.
- Добавляй позитивные и deny-path проверки: anonymous, owner, другой пользователь, подмена user ID, повтор checkout.
- Не логируй адрес, телефон, email, auth tokens и платёжные данные. В portfolio demo не собирай реальные карточные реквизиты.
- Guest order number не является credential. Same-session receipt использует short-lived opaque token: browser хранит его только в `sessionStorage`, server — только hash; token не попадает в URL, localStorage, Query persistence или logs.
- Receipt endpoint принимает token в request body, возвращает PII-minimized projection и одинаково fails closed для missing/wrong/expired token.
- Automated tests используют isolated local stack или dedicated test project; production — отдельный Supabase project. Schema внутри production project не считается test isolation.
- Секреты и environment-specific URLs не коммитятся. Для шаблона используй только `.env.example` без значений.

## Product и UI guardrails

Выбранное направление — **Solecraft / fit-first city sneaker store**.

- Solecraft не переводится; русский используется по умолчанию, RU/EN переводит UI, editorial descriptions, taxonomy и metadata, а выбор переживает reload.
- Названия брендов и моделей обуви не переводятся. Внутренние legacy identifiers допускаются только для обратной совместимости и не показываются пользователю.

- Сохраняй отличительный приём «Линия посадки»: три tracks — width, cushioning, support — читают constrained catalog data; use cases остаются typed tags, а не числовым score.
- Fit taxonomy обязана поддерживать `unknown/not assessed` и provenance. EU/mm brand guide показывает только sourced mapping; UI не выдумывает conversion и не обещает персональную/медицинскую точность.
- Используй дизайн-токены из `PRODUCT_OPTIONS.md`: Cold Paper, Asphalt, Transit Blue, Sole Orange, Gauge Mint и Line Grey.
- Типографическое направление: Unbounded для display, Manrope для интерфейса, IBM Plex Mono для размеров/SKU/технических данных; шрифты self-hosted и subsetted.
- Не скатывай дизайн в generic marketplace, полностью чёрный hype-магазин или тёплый beige/serif шаблон.
- Любая функция должна иметь loading/skeleton, empty, error, retry и success/feedback states там, где они семантически нужны.
- Не показывай cart/wishlist/search affordance до milestone, где оно имеет реальный route, state и action; noop-контролы запрещены.
- Mobile — не уменьшенная desktop-версия: учитывай bottom actions, filter sheet, thumb reach, safe areas и отсутствие hover.
- Минимальная интерактивная цель — 44×44 CSS px; фокус всегда видим; интерактивность реализуется нативными `button`, `a`, `input`, `dialog`-совместимыми паттернами.
- Dialog/drawer требует доступного имени, focus trap, Escape, возврата фокуса и блокировки фонового взаимодействия.
- Не кодируй смысл только цветом. Поддерживай клавиатуру, screen reader labels, zoom/reflow, `prefers-reduced-motion` и достаточный contrast.
- Product media должны иметь определённые размеры/aspect ratio, responsive `srcset/sizes`, осмысленные alt-тексты и оптимизированный формат.

## Routing и URL-контракт

- Поддерживай route map из `ARCHITECTURE.md`, включая отдельные catalog, PDP, cart, wishlist, checkout steps, account orders, auth callback и not-found.
- Каталожное состояние должно быть воспроизводимо после refresh, Back/Forward и по общей ссылке.
- PDP colorway живёт в canonical `?color=:variantSlug`; default omitted, switch/reload/Back воспроизводимы. Size остаётся local selection и сбрасывается при несовместимом variant.
- Не записывай default filters в URL; неизвестные или некорректные параметры нормализуй предсказуемо.
- Изменение filter/search/sort сбрасывает page. Мультизначения сериализуются в стабильном порядке.
- Route-level ошибки не должны обрушать весь app shell; тяжёлые маршруты грузятся лениво с полезным fallback.

## Testing и browser verification

Для каждого milestone выполняй проверки из `PLAN.md`, а не только общий smoke test.

Минимальная пирамида:

- unit: money/formatters, URL codec, reducers/store migrations, merge/idempotency rules;
- component/integration: карточка, filter controls, variant picker, cart lines, form errors, state views через RTL + MSW;
- database/security: migrations, constraints, RLS allow/deny, атомарность checkout;
- E2E: browse → filter/search → PDP → variant → cart → checkout → order → history; отдельно guest/auth merge и failure paths;
- accessibility: нет известных WCAG 2.2 A/AA failures; все axe findings triaged, serious/critical = 0; ручные keyboard/focus/zoom и versioned NVDA+Firefox/TalkBack+Chrome evidence.

Browser verification обязательна на реальном dev/preview build:

- минимум 360×800, 768×1024 и 1440×900;
- refresh и Back/Forward для URL state;
- keyboard-only journey и возврат фокуса из overlays;
- desktop NVDA + Firefox и mobile TalkBack + Chrome critical journey; если environment недоступен, gate остаётся открытым;
- slow network, empty response, 4xx/5xx, offline/retry и double-submit;
- отсутствие неожиданных console errors, горизонтального scroll и layout shift.

Если browser tooling или приложение заблокированы окружением, не выдавай проверку за пройденную. Зафиксируй точную причину, приложи доступные логи и оставь gate открытым.

## Performance и observability

- Соблюдай бюджеты из `ARCHITECTURE.md`; любое превышение требует измерения и объяснения.
- Избегай waterfalls: prefetch следующего вероятного route/query только там, где это подтверждено сценарием.
- Не загружай PDP/gallery/checkout/account код в initial catalog chunk.
- Не используй `useMemo`, `useCallback`, виртуализацию или optimistic UI автоматически; сначала докажи проблему профилированием или UX-требованием.
- Сохраняй стабильные media boxes и резервируй место под skeletons, чтобы контролировать CLS.
- Ошибки логируются с route/action/request ID и очищенным контекстом без PII. Пользователь получает понятное восстановление, а не raw backend message.

## Milestone discipline и exit gate

Milestone считается закрытым только когда одновременно:

1. Достигнут его user-visible outcome.
2. Выполнены все пункты Definition of Done из `PLAN.md`.
3. Пройдены указанные automated tests.
4. Выполнена browser verification на заданных viewport и сценариях.
5. Нет известных WCAG 2.2 A/AA failures, неожиданных console errors и незадокументированных рисков; все axe findings triaged.
6. Изменения ограничены заявленными частями и отражены в документации.

Если gate не пройден, milestone остаётся открытым. Сообщай отдельно: пройдено, не пройдено, заблокировано окружением.

## Docker и Compose

Docker не является обязательной частью выбранной архитектуры. Если он всё же нужен для локальной инфраструктуры:

- используй уникальный compose project name, например `07-solecraft`, через `docker compose -p 07-solecraft ...` или отдельный `COMPOSE_PROJECT_NAME`;
- до каждого host bind read-only проверкой убеждайся, что порт свободен;
- не используй случайный fallback-порт без отражения в env/docs;
- никогда не выполняй глобальные `docker stop`, `docker rm`, `docker compose down` или volume prune;
- останавливай только точные контейнеры текущего compose project;
- не удаляй чужие containers, networks или volumes даже при конфликте имён/портов;
- перед удалением ресурса проверь labels/project ownership и попроси разрешение, если действие необратимо.

## Формат handoff

В конце работы сообщи кратко:

- пользовательский результат;
- изменённые файлы;
- пройденные automated и browser checks;
- открытые риски или непройденные gates;
- состояние Git без commit/push, если пользователь не просил иного.
