# Solecraft

[![CI](https://github.com/godaylor/solecraft/actions/workflows/ci.yml/badge.svg)](https://github.com/godaylor/solecraft/actions/workflows/ci.yml)

Канонический репозиторий: [github.com/godaylor/solecraft](https://github.com/godaylor/solecraft).
Production demo: [solecraft-two.vercel.app](https://solecraft-two.vercel.app).
Cloud backend: Supabase project ref `nwekblxelexknvvrfwig`.

Solecraft — portfolio-grade fit-first магазин городских кроссовок. Каталог помогает
сравнивать ширину, амортизацию и поддержку, а commerce flow сохраняет точную
variant/size/SKU identity от PDP до immutable order snapshot.

Сейчас M0–M9 завершены, production deploy M10 доступен. Официальный public-release
gate остаётся открытым для manual AT, Auth/SMTP настройки и подтверждения media rights;
это не скрывает уже выполненную cloud и hosted проверку.

## Что реализовано

- URL-driven каталог с поиском, фильтрами, сортировкой и пагинацией;
- PDP с canonical colorway URL, gallery, size guide и точным inventory item/SKU;
- persistent guest cart/wishlist и детерминированный merge после magic-link входа;
- owner-only Supabase data с RLS allow/deny и безопасной очисткой private cache;
- guest/auth checkout с server-authoritative totals, stock, idempotency и atomic order;
- scoped guest receipt capability и authenticated order history/detail;
- loading/empty/error/retry states, keyboard flows, axe и responsive browser coverage.
- русский интерфейс по умолчанию и сохраняемый RU/EN режим для UI, описаний,
  категорий и metadata; названия обувных брендов и моделей остаются исходными.

## Локальный запуск

Требуются Node `22.19.0`, npm `10.9.x`, Docker и доступные порты из
`supabase/config.toml` (`32620–32629`). Существующий изолированный compatibility
stack не должен управлять контейнерами других проектов.

```bash
npm ci
npm run db:start
```

Скопируйте `.env.example` в ignored `.env.local` и заполните:

```dotenv
VITE_APP_ENV=local
VITE_SUPABASE_URL=http://127.0.0.1:32621
VITE_SUPABASE_PUBLISHABLE_KEY=
```

На существующем стеке не запускайте `db:reset`: это удаляет данные. Для чистого
изолированного тестового стека seed/reset допустим отдельно. Возьмите публичный
локальный ключ из `npm run db:status`; не используйте service-role/secret key.

Пустой ключ нужно заменить реальным публичным ключом этого локального стека.
Исторический `local-test-anon` используется лишь отдельными тестовыми fixtures и
не подходит для полного Auth/commerce flow. Remote environment требует реальный
Supabase publishable key.

```bash
npm run dev
```

Production build и локальный preview:
Dev: `http://127.0.0.1:32600`. Preview/Playwright: `http://127.0.0.1:32601`.
Порты фиксированы, автоматический переход на другой порт отключён.

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 32601
```

## Демо-сценарий

1. Откройте каталог, примените URL-фильтры и перейдите на PDP.
2. Выберите colorway и доступный EU-размер, добавьте точный SKU в корзину.
3. Для гостевого checkout пройдите contact → delivery → demo-payment → review.
4. Выберите «Успешная демо-оплата». Реальные card credentials приложение не собирает.
5. Для owner history войдите по magic link. Локальная ссылка доступна в Mailpit на
   `http://127.0.0.1:32624`.

Общего demo account/password нет: Auth passwordless, а пользовательские данные
изолированы RLS. Сценарии «отклонение» и «таймаут» существуют только для проверки
recovery и не обращаются к платёжному провайдеру.

## Архитектура и владение состоянием

| Состояние                                                    | Владелец                       |
| ------------------------------------------------------------ | ------------------------------ |
| Поиск, фильтры, sort, page, PDP colorway                     | React Router URL               |
| Каталог, inventory, profile, owner cart/wishlist, orders     | TanStack Query                 |
| Guest cart (inventory ID + quantity) и wishlist (product ID) | Versioned Zustand persistence  |
| Session/user                                                 | Supabase Auth provider         |
| Язык RU/EN                                                   | Locale provider + localStorage |
| Краткоживущий UI                                             | Local React state              |

Компоненты используют domain repositories, а не вызывают Supabase напрямую. Supabase
runtime загружается после первого UI paint и остаётся единым singleton для Auth и всех
repositories. Checkout повторно проверяет цену/остаток на сервере; money хранится в
minor units. Guest receipt token хранится только в `sessionStorage`, на сервере — hash.
Versioned storage keys Solecraft принимают данные из прежних cart, wishlist, checkout,
auth-return, receipt и locale keys по copy-first миграции без потери нового состояния.

Подробности: [архитектура](docs/ARCHITECTURE.md),
[product requirements](docs/TRANSFORMATION_SPEC.md) и [план/evidence](PLAN.md).

## Проверки

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run db:test
npm run build
npm run bundle:check
npm run lighthouse:ci
npm run e2e:smoke
npm audit
```

Deployed smoke запускается только против явно переданного live URL:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://example.invalid'
npm run e2e:deployed
```

CI выполняет quality/security, local Supabase/browser/Lighthouse gates и отдельный
scheduled Chromium/Firefox/WebKit suite. Workflow не содержит production credentials.

Production deployed smoke (2026-09-10):

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://solecraft-two.vercel.app'
npm run e2e:deployed
```

Результат: 2/2 Chromium tests PASS. Текущий [GitHub Actions run](https://github.com/godaylor/solecraft/actions/runs/34426350108) также зелёный.

## Измеренный результат M10

- initial JavaScript: `114.21 KiB gzip` при budget `200 KiB`;
- initial CSS: `6.34 KiB gzip` при budget `40 KiB`;
- controlled mobile Lighthouse (median из 3): Performance `99`, Accessibility `100`;
- LCP `1.654 s`, CLS `0.012`; field instrumentation собирает CLS/INP/LCP без PII и
  без внешней отправки по умолчанию.

Отчёт и методика: [M10 release evidence](docs/M10_RELEASE_EVIDENCE.md).

## Portfolio evidence

- [mobile home visual baseline](e2e/resilience-a11y.m9.spec.ts-snapshots/m9-home-mobile-chromium-win32.png);
- [desktop catalog visual baseline](e2e/resilience-a11y.m9.spec.ts-snapshots/m9-catalog-desktop-chromium-win32.png);
- [M9 resilience/accessibility evidence](docs/M9_ACCESSIBILITY_EVIDENCE.md);
- URL state и error/recovery evidence перечислены в [PLAN.md](PLAN.md);
- social preview: [SVG source](public/social-card.svg) и [PNG](public/social-card.png).

## Ограничения перед public release

Подготовка от 2026-09-08: [результат и проверки](docs/RELEASE_PREPARATION.md),
[Vercel и cloud Supabase](docs/DEPLOYMENT.md). `vercel.json` вызывает
`npm run build:vercel`: Build Output API v3, SPA fallback, cache/security headers
и CSP с точным origin из реальной переменной окружения. Сборка для Vercel
отклоняет localhost, отсутствующие настройки и privileged keys.

- waiver M9 истекает перед public release: NVDA + native Firefox и Android
  TalkBack + Chrome journeys должны быть реально выполнены и сохранены;
- live host и production Supabase project выбраны, production smoke выполнен; ещё
  нужно добавить exact Auth Site URL/redirect allowlist и настроить SMTP для live magic links;
- права на legacy sneaker cutouts не заявлены: перед публичным merchandising deploy
  их нужно заменить или формально разрешить;
- headless Playwright WebKit не включает системный Full Keyboard Access для ссылок;
  этот один Tab-to-link test явно skipped, а Firefox/Chromium keyboard и WebKit
  navigation/dialog/axe gates проходят.

## Данные и attribution

Schema/migrations/pgTAP предназначены для isolated local/test stack. Не запускайте
remote `db push`/`db reset` повторно без review: migrations и catalog seed уже применены
к Supabase project `nwekblxelexknvvrfwig` по явному запросу владельца. Shared legacy
MockAPI cart не используется. Источник и ограничения media описаны в
[content/media-sources.md](content/media-sources.md).

## Лицензии

Код и оригинальные материалы Solecraft распространяются на условиях
[LICENSE](LICENSE). Уведомления для сторонних runtime-зависимостей и встроенных
шрифтов находятся в [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); копии font
copyright notices и SIL OFL также публикуются вместе с сайтом в `public/licenses/`.
