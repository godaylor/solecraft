# Solecraft — подготовка публикации, 2026-09-08

**Статус: доступная локальная подготовка выполнена; PUBLIC RELEASE BLOCKED.**
M10 не закрыт. Commit, push, PR, deploy, remote migrations и cloud data writes не
выполнялись. Этот отчёт актуальнее исторических evidence от 2026-09-03.

## Результат и границы

- Root rename в `E:\Projects\PetProjects\07-solecraft` не ломает запуск/build.
  В активных scripts/config/source нет зависимости от старого абсолютного root.
  Историческая attribution и прошлые evidence сохранены.
- Solecraft присутствует в текущем worktree. Старый UI prefix `PARA-` заменён
  display-only alias `SOLECRAFT-` для SKU/номеров заказов. Raw IDs, URLs, SKU в базе,
  immutable snapshots и legacy storage migration keys не переписаны.
- Убраны устаревшие пользовательские подписи о seeded/local Supabase и будущем
  checkout. Сохранены русский по умолчанию, EN, persistence и metadata localization.
- Исправлены mobile header overflow и длинный SKU в EN-корзине. Quick sheet теперь
  делает inert настоящий `#main-content`, а не статический boot placeholder.
- Frontend собирается статически, но магазин **требует Supabase backend**: каталог,
  Auth, owner cart/wishlist, server-authoritative checkout и order history. Он не был
  заменён статической заглушкой ради deploy.
- Подготовлены Vercel Build Output API v3, exact-origin CSP, asset/SPA routing,
  cache/security headers и fail-closed cloud settings validation. Облачное подключение
  не выполнено: реального проекта/ключей и CLI authorization нет.
- Лицензии шрифтов и source attribution не удалялись. Права на legacy sneaker media
  не выданы за подтверждённые; см. `content/media-sources.md`.

## Проверки

| Проверка | Фактический результат |
| --- | --- |
| Node/build runtime | Node 22.19.0; официальный archive проверен по SHA256, используется только repo-local runtime |
| Lint / format | PASS; точечный Prettier исправил только файлы, не проходившие проверку |
| TypeScript + production build | PASS, Vite 8.2.2, 213 modules; финальный `dist` использует основной локальный backend 32621 |
| Unit/integration | PASS: 29 files, 81 tests |
| Deploy config unit tests | PASS: 2 tests, включая запрет localhost/privileged keys и порядок SPA/assets |
| Hosted build без settings | Ожидаемый отказ до build: `Set VITE_APP_ENV to preview or production for a hosted build`; cloud artifact не объявляется готовым |
| Dependency audit | `npm audit`: 0 vulnerabilities |
| Initial gzip budget | JS 118.91 KiB / 200; CSS 6.48 KiB / 40 |
| PostgreSQL/RLS/checkout pgTAP | PASS: 122 assertions в отдельной свежей test database; atomic 35, auth 24, catalog 34, guest cart 6, order history 15, product 8 |
| Chromium, свежие fixtures | Полный запуск: 60 PASS, 2 explicit deployed-only SKIP, 1 visual mismatch (5 pixels). После обновления baseline отдельный visual test PASS без `--update-snapshots`. Единый полностью зелёный full run после этого обновления не выполнялся |
| Firefox + WebKit, critical subset | Совместный запуск 23 PASS / 24 explicit SKIP / 1 WebKit network failure; повтор именно WebKit owner-history test PASS. Полный cross-engine release gate этим не закрыт |
| RU/EN + responsive journey | Home → EN → catalog → PDP → available size → cart → reload проверен на 360×800, 768×1024, 1440×900 в Chromium/Firefox/WebKit; финальный dev RU/EN smoke на 32600 также PASS, HTTP 200 |
| Keyboard / axe / recovery | Chromium critical flows, overlays/focus return, 500/retry, validation, double submit/idempotency, guest receipt и owner/other/anonymous denial прошли; проверенные axe сценарии без violations |
| Visual review | Просмотрены мобильная EN-корзина, home mobile и catalog desktop screenshots; Windows Chromium baselines обновлены для Solecraft |
| Lighthouse mobile, 3 runs | PASS: все Performance 99, Accessibility 100, Best Practices 100, SEO 100; выбранный median run LCP 1.804 s, CLS 0.0133 |
| Manual NVDA + native Firefox | NOT RUN — не заменяется headless automation |
| Manual Android TalkBack + Chrome | NOT RUN — не заменяется viewport emulation |
| Hosted CI / real Vercel smoke | NOT RUN — нет commit/push/deploy и выбранного cloud configuration |

### Обнаруженные ограничения повторных тестов

1. В одном Chromium trace первый catalog request получил
   `net::ERR_NO_BUFFER_SPACE`; retry привёл к двум запросам. Следующий slow-catalog
   test прошёл с одним запросом. Глобальные Windows/network settings не менялись.
2. Многократные checkout runs истощили stock только в созданной test database;
   cart quantity button корректно стал disabled. После восстановления её fixtures
   cart test прошёл. Основная database не reset/reseed.
3. Visual catalog baseline содержит live stock/число размеров. После свежего seed
   возникло расхождение в 5 pixels; влияние fixtures вероятно, но точная причина
   этих пяти pixels отдельно не доказана. Baseline обновлён и проверен отдельным запуском.
   Для следующего полного release run нужны свежие fixtures и повтор visual review;
   динамический stock не следует принимать за доказательство layout regression.
4. Единственный WebKit failure содержал access-control error для owner cart request;
   focused повтор прошёл. Причина не доказана, ошибка не подавлена и не объявлена
   исправленной. Нужен чистый cross-engine rerun.
5. В repository есть только `*-chromium-win32.png` visual baselines. Linux GitHub
   runner потребует отдельные просмотренные baselines; автоматическое создание
   отсутствующего snapshot не считается зелёным gate. Hosted CI ещё не запускался.

Raw local artifacts: ignored `test-results/m10/` (Lighthouse JSON/bundle report),
`.codex-temp/release-*.jpg` (responsive screenshots), Playwright traces для последних
ошибок при наличии. Playwright перезаписывает `test-results` следующими запусками;
данный отчёт сохраняет итоги предыдущих прогонов.

## Локальные порты и сохранность данных

Перед новым bind проверялась занятость. Автоматический fallback dev/preview порта
отключён. Ни один чужой container/network/volume не остановлен или удалён.

| Назначение | Host port / итоговое состояние |
| --- | --- |
| Dev сайт | 32600, запущен на 127.0.0.1 |
| Preview / Playwright | 32601, после проверок остановлен |
| Lighthouse debugging | 32602, временный, после проверки освобождён |
| Основной Supabase API / PostgreSQL / Mailpit | 32621 / 32622 / 32624, running, bind 127.0.0.1 |
| Остальные настроенные Supabase host ports | 32620 shadow, 32623 Studio, 32625 SMTP comment, 32626 POP3 comment, 32627 analytics, 32628 inspector, 32629 pooler; не все сервисы включены/запущены |
| Отдельный test API / Mailpit | 32641 / 32644; четыре созданных test сервиса остановлены после проверок |

Внутренние container ports (5432, 8000, 9999 и т. п.) не являются host binds.
Старые 4173/5173/55320–55329 при финальной проверке не слушались.

Сохранён существующий volume `supabase_db_react-sneakers-para` и compatibility
project ID `react-sneakers-para`: его переименование создало бы риск подмены volume.
Основные пять контейнеров сохранили логические имена и получили новый workdir label.
Auth API/site/callback и четыре mail verification URL переведены на новые порты.
`.env.local` изменён только в части URL; существующий публичный локальный key сохранён.

До и после переноса/тестов основная БД `postgres`: **33 products, 4 orders,
10 auth.users**. Тесты не направлялись в неё. Перед переносом создан и проверен
pg_dump внутри этого же volume:
`/var/lib/postgresql/data/solecraft-before-port-move-20260908.dump`.
Это локальная recovery-копия, не независимый off-device backup.

Для восстановления сохранены, не удалены:

- остановленные original containers с suffix `-before-326xx` и auth containers
  с suffix `-before-mail-paths`;
- локальные images `solecraft-local-backup/*:20260908`;
- network `solecraft-release-test-20260908` и четыре остановленных test containers;
- отдельные БД `solecraft_release_test_20260908_v2` (E2E),
  `solecraft_release_pgtap_20260908` (pgTAP) и незавершённая первая restore-копия
  `solecraft_release_test_20260908`;
- ignored recovery helpers `.codex-temp/migrate-ports.ps1`,
  `create-test-stack.ps1`, `fix-auth-paths.ps1` (это одноразовые операции, не startup scripts).

Не запускать старый и новый PostgreSQL container одновременно на одном volume.
Не запускать migration helpers повторно вслепую. Не публиковать dumps/images:
они могут содержать локальные Auth settings и данные. Очистка сохранённых recovery
ресурсов требует отдельного решения; глобальный prune/reset запрещён.

## Git и изменённые области

Ветка `master`; HEAD и read-only `git ls-remote origin master` совпали:
`8083f8c71a0d8ded01da80c993d58c9f87802504`.
Origin остался `https://github.com/godaylor/react-sneakers.git` — remote name не обязан
совпадать с local folder. Принадлежность и право push не предполагались.
Worktree содержит большую существовавшую незакоммиченную модернизацию. Она сохранена;
`git diff --stat` не включает новые untracked source/docs, поэтому не описывает весь
release. До commit нужен просмотр также untracked files. `git diff --check` прошёл.

В этой подготовке затронуты:

- UI: shared display reference helper + tests; cart/quick sheet; SKU/order display;
  home/catalog/Auth copy; responsive header/cart CSS; связанные assertions;
- delivery/config: `vercel.json`, deploy/budget/port scripts, package scripts,
  Vite/Playwright/Vitest/ESLint, `.github/workflows/ci.yml`, `.gitignore`,
  `supabase/config.toml`, ignored `.env.local`;
- tests: RU/EN responsive release journey, reviewed Windows visual baselines,
  updated Auth Mailpit/callback URLs; CI browser matrix имеет отдельный свежий stack
  на engine, а реальные local anon keys читаются из созданного stack status;
- docs: README, AGENTS, PLAN, ARCHITECTURE, DEPLOYMENT и этот report;
- только форматирование: дополнительные ранее неотформатированные TSX/model/test
  файлы из точного списка `prettier --list-different`.

## Что нужно для публикации

Подробный порядок и места настроек: [DEPLOYMENT.md](DEPLOYMENT.md).

1. Выбрать/авторизовать GitHub repository, Vercel account/project/domain и отдельные
   Preview/test + Production Supabase projects. Нужны настоящие Project URL,
   publishable keys, Auth Site URL/callback allowlist и SMTP для посетителей.
2. Отдельно разрешить remote migrations/catalog seed, commit/push и Preview deploy.
   Локальные пользователи/заказы/корзины не переносятся в облако автоматически.
3. Подтвердить права или заменить legacy sneaker images; затем повторить visual QA.
4. Выполнить manual NVDA/Firefox и TalkBack/Chrome, clean hosted CI (включая Linux
   visual baselines), чистый cross-engine rerun и real deployed smoke.

Codex может после предоставления доступа/разрешения применить точные настройки,
проверить migration dry-run, подготовить commit/push, Preview и hosted smoke.
Владелец должен лично пройти login/2FA/authorization, выбрать account/project/domain,
подтвердить доступы, media rights и выполнить/подтвердить ручные AT checks.
Ни один из этих внешних шагов не отмечен выполненным.
