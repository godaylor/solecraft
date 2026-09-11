# Solecraft — portfolio handoff

## Product

**Solecraft** — fit-first магазин городских кроссовок, который помогает выбирать пару
по ширине, амортизации, поддержке, размеру и повседневному сценарию, а затем провести
заказ от точного SKU до безопасного подтверждения.

## Авторский вклад

Самостоятельная трансформация небольшого legacy React storefront в современный
portfolio-grade продукт: product discovery и visual system, strict typed frontend,
domain/data boundaries, Supabase schema/Auth/RLS/atomic checkout, RU/EN localization,
accessibility/resilience, automated browser coverage, CI и Vercel deployment contract.
Исходная учебная история не скрыта; legacy runtime/UI и неподтверждённые raster media
заменены, а применимые third-party notices сохранены.

## Фактический стек

React 19, React Router 7 Data Mode, strict TypeScript, Vite 8, TanStack Query 5,
Zustand 5, CSS Modules, Dart Sass, Supabase Postgres/Auth/RLS, Vitest, React Testing
Library, MSW, Playwright, axe-core, Lighthouse CI, GitHub Actions и Vercel Build Output
API v3.

## Главные возможности

1. Shareable URL-driven каталог с поиском, facets, сортировкой и пагинацией.
2. Variant-aware PDP с canonical colorway URL, доступными EU-размерами и точным SKU.
3. Объяснимая «Линия посадки»: width, cushioning и support с provenance/unknown.
4. Versioned guest cart/wishlist и детерминированный merge после magic-link входа.
5. Owner-only commerce data с проверенными RLS allow/deny paths.
6. Guest/auth checkout с authoritative ценой/остатком, атомарностью и idempotency.
7. Same-session guest receipt capability и immutable authenticated order history.
8. RU/EN, responsive UI, recovery states, keyboard flows и privacy-safe observability.

## Архитектура кратко

URL владеет navigation/discovery state; TanStack Query — server state; versioned
Zustand хранит только guest inventory/product IDs и quantity; Supabase Auth provider —
session; локальный React state — transient UI. Компоненты работают через typed domain
repositories. Server-side checkout повторно проверяет catalog truth и создаёт order
transactionally; guest receipt token хранится только в sessionStorage, на сервере — hash.

## Ссылки

- GitHub: https://github.com/godaylor/solecraft
- Live: https://solecraft-two.vercel.app

## Лучшие screenshots

- `docs/screenshots/solecraft-home-mobile.png`
- `docs/screenshots/solecraft-catalog-desktop.png`
- `docs/screenshots/solecraft-pdp-desktop.png`

## Лицензирование и provenance

- Project license: `LICENSE`.
- Runtime/font notices: `THIRD_PARTY_NOTICES.md` и `public/licenses/`.
- Product media: десять оригинальных fictional ImageGen sources без reference images,
  логотипов или named product silhouettes; published as optimized responsive WebP.
- Полный media record: `content/media-sources.md`.
- Legacy source attribution и решения сохранены в baseline/docs и Git history.

## Что реально работает в production

Production уже обслуживает SPA routes, catalog/PDP, guest wishlist/cart, demo checkout,
guest receipt и owner order surfaces поверх cloud Supabase. Deployed smoke и hosted CI
зелёные. Generated-media artifact опубликован 2026-09-11: live home → canonical PDP,
новая media, route rendering и cache/metadata проверены; GitHub Actions run
`34546490040` успешен. Public release gate остаётся открыт до настройки production
custom SMTP, фактической manual NVDA/Firefox + TalkBack/Chrome проверки и повторного
Lighthouse без Windows profile-lock.
