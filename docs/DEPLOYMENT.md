# Deployment contract

Это M10 runbook для Vercel + облачного Supabase, актуализированный 2026-09-08.
Он не является разрешением на commit, push, production deploy или remote migration.
Frontend публикуется статически, но приложение НЕ автономный static-only магазин:
каталог, Auth, owner commerce, атомарный checkout и история требуют Supabase.

## Что подготовлено локально

- `vercel.json`: framework `Other` (`null`), install `npm ci`, build
  `npm run build:vercel`; используется Vercel Build Output API v3.
- `scripts/build-vercel.mjs` проверяет реальные cloud settings до сборки, запускает
  TypeScript/Vite и bundle budget, создаёт `.vercel/output/static` и `config.json`.
- Настройки hosted build берутся только из process environment. Отсутствующие
  параметры, localhost, loopback sentinel и secret/service-role keys приводят к
  ошибке, а не к публикации сайта с локальным backend.
- CSP генерируется с точным заданным Supabase origin, без wildcard. Реальные файлы
  обслуживаются до SPA fallback; отсутствующие assets возвращают 404.
- `.env.local` остаётся ignored и подключён к сохранённой локальной базе на 32621.
  Это не production config. `.env.example` намеренно не содержит значений.

## Первый запуск через GitHub и Vercel

1. Сначала закрыть hard prerequisites ниже и просмотреть весь текущий diff: worktree
   содержит незакоммиченную модернизацию, а не только последний release patch.
   После отдельного разрешения сделать commit/push в выбранный GitHub repository.
   Не добавлять `.env.local`, `.codex-temp`, dumps, Docker snapshots и test artifacts.
2. Выбрать отдельные Preview/test и Production Supabase projects. Получить реальные
   Project URL и **publishable** key. Не переносить локальные auth users, корзины,
   заказы или другие пользовательские данные в облако.
3. После отдельного разрешения подключить CLI к точному project ref, проверить
   migration history и dry-run. Применить существующие `supabase/migrations` только
   к выбранному проекту. Catalog seed допустим лишь для явно подтверждённого пустого
   demo project; `db reset` в облаке запрещён. Повторить RLS/checkout tests в отдельном
   test project, не на Production.
4. В Vercel импортировать разрешённый GitHub repository. Root Directory — корень
   repository (`.`), не имя локальной Windows-папки. Framework — Other; Build Command
   `npm run build:vercel`; Install Command `npm ci`; Node.js 22.x (локально проверен
   22.19.0). Custom Output Directory не задавать: используется Build Output API.
5. Заполнить три переменные ниже отдельно для Preview и Production. Preview не должен
   обращаться к production database. После выбора настоящего URL приложения настроить
   Supabase Auth Site URL и exact callback allowlist. Сначала deploy в Preview;
   доступность Preview ограничить до закрытия public gates.
6. Проверить hosted smoke, security/cache headers, reload direct routes, RU/EN,
   magic link, guest/auth cart и demo checkout на Preview/test database. Выполнить
   ручные AT checks. Только после явного разрешения публиковать Production.

### Настройки, которых сейчас нет

| Настройка | Где получить / задать |
| --- | --- |
| Выбранный GitHub repository и право push | GitHub владельца |
| Vercel account/team, project и настоящий app domain | Vercel dashboard |
| Preview и Production Supabase project refs / URLs | Supabase dashboard |
| Публичный `sb_publishable_…` key каждого проекта | Project API settings; не secret key |
| Auth Site URL и redirect `/auth/callback` | Auth URL Configuration, после выбора app domain |
| SMTP sender/provider и его credentials | Supabase Auth SMTP; не Vite/Vercel frontend env |
| Разрешение на remote migrations и catalog seed | Отдельное подтверждение владельца |

CLI cloud discovery 2026-09-08 заблокирован `LegacyPlatformAuthRequiredError`:
авторизация Supabase CLI отсутствует. Ни один cloud URL/key/project не выдуман и
облачное подключение не объявляется выполненным. Default SMTP ограничивает доставку;
для входа внешних посетителей нужен настроенный SMTP и проверка реального письма.
CLI access token/DB password, если понадобятся для migrations, хранятся вне frontend
environment и не выводятся в отчёт.

## Hard prerequisites

Перед public release одновременно нужны:

1. Реальная revalidation manual AT waiver: NVDA + native Firefox и Android TalkBack +
   Chrome, с сохранённым versioned evidence.
2. Vercel account/project, настоящий production domain и отдельный production
   Supabase project с корректными Auth/SMTP settings.
3. Подтверждённые права на sneaker media либо их замена.
4. Отдельное разрешение на применение additive migrations к production Supabase.

## Build environment

Используются только frontend-safe значения:

```dotenv
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Service-role/secret keys запрещены в build environment, repository, bundle и logs.
Supabase Auth Site URL и redirect allowlist должны включать точные preview/production
origins и `/auth/callback`; wildcard для произвольных origins не допускается.

## Static host rules

- существующие asset paths обслуживаются как файлы; неизвестный asset возвращает 404;
- application routes переписываются на `/index.html` для SPA direct reload;
- HTML: `Cache-Control: no-cache` либо `max-age=0, must-revalidate`;
- hashed `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`;
- ответы с user/order/receipt data не должны кэшироваться shared/public cache;
- source maps публикуются только после отдельного решения и без embedded secrets.

Минимальные security headers:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://<project-ref>.supabase.co; form-action 'self'; upgrade-insecure-requests
```

`style-src 'unsafe-inline'` здесь ограничен CSS и нужен текущему build, который inline
entry CSS ради cold-load LCP. После выбора provider его можно заменить generated hash;
ослаблять `script-src` нельзя.

## Verification

После deploy и до переключения public traffic:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://<preview-or-production-origin>'
npm run e2e:deployed
```

Проверяются direct routes, SPA 404/auth callback, social PNG, HTML cache policy и
immutable hashed asset. Затем Lighthouse запускается против того же URL через
`LIGHTHOUSE_URL`, а DevTools review подтверждает отсутствие PII/token в URL, logs,
localStorage и public cache.

Rollback — возврат к предыдущему immutable static artifact. Destructive database
rollback, reset или удаление production data в этот процесс не входит.

## Источники

- [Vercel Build Output API](https://vercel.com/docs/build-output-api)
- [Output configuration / routing](https://vercel.com/docs/build-output-api/configuration)
- [Supabase environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
