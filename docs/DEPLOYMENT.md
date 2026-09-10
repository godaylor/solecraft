# Deployment contract

Это M10 runbook для Vercel + облачного Supabase, актуализированный 2026-09-10.
Production deployment и additive migrations выполнены по явному запросу владельца.
Frontend публикуется статически, но приложение НЕ автономный static-only магазин:
каталог, Auth, owner commerce, атомарный checkout и история требуют Supabase.

## Текущее развертывание

- GitHub: [godaylor/solecraft](https://github.com/godaylor/solecraft), ветка `master`.
- Vercel production: [solecraft-two.vercel.app](https://solecraft-two.vercel.app).
- Vercel deployment details: [ENL19q6gBZiHdaopuyYLJ2kiRKkq](https://vercel.com/maxeem/solecraft/ENL19q6gBZiHdaopuyYLJ2kiRKkq).
- Supabase project ref: `nwekblxelexknvvrfwig`, URL
  `https://nwekblxelexknvvrfwig.supabase.co`.
- Все 6 локальных migrations применены, затем применён `supabase/seed.sql`.
- `npm run e2e:deployed` против первого production deployment: 2/2 PASS. Текущий
  alias после GitHub auto-deploy подтверждён в обычном браузере (главная и каталог
  загружаются); headless повтор из этой среды может получить Vercel Security
  Checkpoint (403) до выполнения browser challenge.

Vercel хранит только `VITE_APP_ENV`, `VITE_SUPABASE_URL` и
`VITE_SUPABASE_PUBLISHABLE_KEY` для production. Service-role/secret keys, DB password
и CLI credentials не входят в repository, frontend bundle или этот документ.

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

1. Просмотреть текущий diff и историю перед новым release commit. Commit/push для
   канонического GitHub repository уже выполнены; `.env.local`, `.codex-temp`, dumps,
   Docker snapshots и test artifacts не добавлялись.
2. Для production выбран Supabase project `nwekblxelexknvvrfwig`. Локальные auth users,
   корзины и заказы в облако не переносились.
3. CLI link, migration history, dry-run, additive migrations и catalog seed уже
   выполнены для этого пустого demo project. `db reset` в облаке запрещён. Для
   следующего этапа нужен отдельный Preview/test project, чтобы не смешивать его с
   production demo data.
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
| Отдельный Preview/test Supabase project и его publishable key | Supabase dashboard |
| Auth Site URL и redirect `/auth/callback` для live origin | Auth URL Configuration |
| SMTP sender/provider и его credentials | Supabase Auth SMTP; не Vite/Vercel frontend env |
| Manual NVDA/TalkBack evidence и права на legacy media | Release owner / content review |

Supabase CLI был авторизован через одноразовый device-login. Default SMTP ограничивает
доставку; для входа внешних посетителей нужен настроенный SMTP и проверка реального
письма. CLI access token/DB password хранятся вне frontend environment и не выводятся
в отчёт.

## Hard prerequisites

Перед public release одновременно нужны:

1. Реальная revalidation manual AT waiver: NVDA + native Firefox и Android TalkBack +
   Chrome, с сохранённым versioned evidence.
2. Отдельный Preview/test Supabase project и корректные Auth/SMTP settings для live
   origin. Production project и Vercel alias уже доступны.
3. Подтверждённые права на sneaker media либо их замена.
4. Для будущих schema changes — отдельный review и разрешение; текущие additive
   migrations и catalog seed уже применены.

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
$env:PLAYWRIGHT_BASE_URL = 'https://solecraft-two.vercel.app'
npm run e2e:deployed
```

Фактический production smoke 2026-09-10 на первом production artifact: direct routes,
SPA fallback, asset 404, HTML cache policy и hashed-asset cache policy прошли
(`2 passed`). Для повторения с текущего IP сначала откройте alias в обычном браузере,
если Vercel покажет Security Checkpoint; это anti-bot interstitial, а не ответ
приложения.

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
