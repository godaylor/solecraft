# Solecraft — визуальный редизайн M10

Дата: 2026-10-17. Scope: локальный редизайн всего существующего магазина по запросу
владельца. Публичный release gate не закрывается этим отчётом.

## Концепция: «Город в твоём ритме»

Solecraft — магазин для человека, который выбирает повседневную пару и хочет
сравнить посадку до покупки. Главная задача первого экрана — показать обувь и
привести в рабочий каталог. Hero использует реальные модели, изображения и цены
из общего catalog repository. Ручное переключение трёх моделей не меняет URL
каталога и не запускает автоматическую карусель.

Визуальный язык: крупная обувь, холодный свет, городской маршрут, спокойные
предметные карточки. Cold Paper `#F3F6FA`, Asphalt `#171C26`, Transit Blue
`#315CF5`, Sole Orange `#FF7A45`, Gauge Mint `#BDE7D6`, Line Grey `#C9D0DB`
сохранены. Осветлённые поверхности подборок производны от этой палитры.
Unbounded применяется к коротким заголовкам, Manrope — к интерфейсу, IBM Plex Mono
— к размерам и техническим подписям. Шрифты по-прежнему локальные.

Композиция desktop:

```text
brand / navigation / RU–EN / wishlist / cart / account
headline + catalog CTA       large real sneaker + route + model switch
guest shopping / fit guidance / demo returns
three real product cards
three scenario collections → URL filters
fit explanation + live three-track example
city editorial photograph + catalog CTA
store policies / footer
```

На mobile hero складывается в последовательность: смысл → действие → обувь.
Покупка сохраняет нижнее действие; фильтры и корзина используют существующие
доступные dialog surfaces.

## Ориентиры и собственная интерпретация

| Источник                                                                                                                      | Что изучено                                          | Решение Solecraft                                                          |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| [On / Cloudboom Strike](https://www.on.com/en-ad/products/cloudboom-strike-ls-u-3ue3001/unisex/white-black-shoes-3UE30010462) | Предметная подача обуви и независимые характеристики | Крупный реальный силуэт и три независимые fit tracks                       |
| [Salomon / Awwwards](https://www.awwwards.com/inspiration/salomon-ofitsialnyi-internet-magazin-sportivnykh-tovarov-v-moskve)  | Спортивный commerce и городская предметность         | Спокойный каталог внутри выразительной редакционной оболочки               |
| [Awwwards / interactive motion](https://www.awwwards.com/inspiration/interactive-dot-matrix-animations-axelar)                | Направление движения и реакция на взаимодействие     | Однократное построение маршрута и короткий feedback; без WebGL-зависимости |

Это ориентиры для композиции и взаимодействий; чужие изображения, код и
торговые марки в assets Solecraft не переносились.

## Изменения магазина

- Новая главная с реальными товарами и фильтрующими подборками, редакционным
  городским кадром, объяснением посадки и условиями гостевой покупки.
- Общая навигация, собственный route mark, header actions, footer и базовые controls.
- Карточки: избранное в отдельном toolbar над фото, один сценарий ниже фото,
  название/цена, фактический цвет и наличие, компактная «Линия посадки».
- PDP: крупное фото, title/wishlist row, согласованные color/size controls,
  feedback и прямой переход в корзину после добавления.
- Корзина/drawer, wishlist, checkout, receipt, sign-in/account и order surfaces
  приведены к общей типографике, поверхностям, рамкам и радиусам.
- ScrollRestoration восстанавливает Back/Forward; новые страницы открываются
  сверху. Colorway и фильтры используют preventScrollReset.
- Описания сопоставляются с проверенным семейством изображения. Текст описывает
  видимый дизайн без неподтверждённых обещаний водозащиты/комфорта. Демо-статус,
  shared silhouettes и условность fit-данных остаются явно обозначенными.
- Изображения показываются без color blending, меняющего их цвет. Зафиксированы
  размеры/aspect ratio; исправлено растяжение editorial cutouts по высоте.
- Убрано принудительное async decoding в карточках: повторные cached WebP теперь
  стабильно отрисовываются при переходах и полном capture страницы.

## Движение

| Момент                    | Реализация                                                     |
| ------------------------- | -------------------------------------------------------------- |
| Hero route                | Однократный stroke reveal, 1400 ms                             |
| Появление/смена hero shoe | transform + opacity, 750 ms                                    |
| Product hover             | Небольшой поворот/масштаб, 450 ms; только hover-capable device |
| PDP colorway              | Короткая смена opacity/position, 260 ms                        |
| Drawer/filter             | Вход панели, 240 ms                                            |
| Wishlist/size             | Цвет/граница/небольшой feedback, 160–220 ms                    |

`prefers-reduced-motion` сокращает анимации до мгновенного состояния. Нет
перехвата scroll, autoplay или зависимости покупки от завершения анимации.

## Проверки и воспроизведение

Перед изменениями: `master...origin/master`, чистый worktree. Снимки до:
`docs/screenshots/redesign/before-*`. Итоговые снимки: `after-*` в той же папке.
Сравнение: [comparison.html](screenshots/redesign/comparison.html).

Runtime: repo-local Node 22.19.0, штатный dev 32600, preview 32601. Основной
Supabase 32621 сохранён. Automated commerce tests используют API 32641 и Mailpit
32644, отдельный новый контейнер Postgres с собственным volume. В него перенесены
только schema и demo seed, а также номера внутренних Auth migrations; пользователи,
заказы и sessions основной БД не копировались.

Автоматическая проверка запретила добавление основной БД в тестовую сеть. Эта
операция не выполнена; тесты используют отдельный контейнер БД. Сохранённые test
Auth images оказались старее текущей схемы; для тестов создан отдельный Auth из
уже установленной актуальной версии. Другие проекты не останавливались.

Команды для повторения проверок (после подготовки dedicated test stack):

```powershell
$env:PATH = (Join-Path (Get-Location) '.codex-temp/runtime/node-v22.19.0-win-x64') + ';' + $env:PATH
npm run lint
npm run format:check
npm run test:run
$env:VITE_SUPABASE_URL = 'http://127.0.0.1:32641'
npm run build
$env:MAILPIT_BASE_URL = 'http://127.0.0.1:32644'
npx playwright test --project=chrome
node scripts/capture-redesign.mjs
npm run bundle:check
```

Capture script заполняет только вымышленные checkout fields и останавливается
на review. Он не отправляет auth email и не создаёт заказ. Реальное создание
демо-заказов проверяется E2E только в изолированной БД.

## Финальные результаты

| Проверка                                                   | Результат                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Strict TypeScript / production build                       | PASS                                                                                       |
| ESLint / Prettier / diff whitespace                        | PASS                                                                                       |
| Vitest                                                     | 30 файлов, 93 tests PASS                                                                   |
| Полный установленный Chrome suite                          | 76 PASS, 3 explicit SKIP (два deployed-only, один отдельный visual gate)                   |
| Согласованность каталога                                   | Все 32 модели / 64 colorways, разные SKU и правильное семейство изображения PASS           |
| Размещение избранного / tags                               | 360, 390, 768, 1440 px, все три страницы каталога PASS                                     |
| Guest checkout / refresh / double submit                   | Mobile и desktop PASS; один authoritative order на submit                                  |
| Auth / merge / order history / deny                        | PASS в изолированном Chrome suite                                                          |
| Keyboard / overlays / focus return / axe                   | PASS; в проверенных сценариях violations = 0                                               |
| Slow response / 500 / unavailable network / image fallback | PASS; состояние пользователя сохраняется                                                   |
| RU/EN / reflow                                             | 320–7680 CSS px PASS; целевые 360×800, 768×1024, 1440×900 просмотрены                      |
| Firefox + WebKit                                           | Guest mobile/desktop flows PASS; hero/colorway/reduced-motion/scroll checks PASS           |
| Visual baseline                                            | Два просмотренных Windows Chromium baseline обновлены и повторно проверены без update flag |
| JS/CSS gzip                                                | Около 122 KiB / 8.84 KiB при лимитах 200 / 40 KiB                                          |
| Deploy config unit tests                                   | 2 PASS; deploy не выполнялся                                                               |

После полного Chrome suite исправлены только наблюдаемые presentation issues:
пропорции editorial images, image capture timing, WebKit scroll restoration и
первый мобильный paint. Финальный targeted Chrome run повторяет guest flow,
hero interactions и unavailable-image recovery (6/6 PASS). Visual baselines маскируют только
изменяемую строку наличия; stock semantics проверяются функциональными тестами.

WebKit выявил конфликт глобального CSS smooth-scroll с Router restoration.
Глобальный smooth-scroll убран; шесть повторных motion/scroll тестов в трёх
engines прошли. Начальные sandbox-запуски Firefox падали до загрузки сайта
(`browserContext.newPage ... _page`); разрешённый запуск процесса снял ограничение.

### Производительность

Стандартный `npm run lighthouse:ci` столкнулся с существующим Windows `EBUSY`
при очистке временного Chrome profile. Использован тот же установленный Lighthouse
через Node API и управляемый Playwright Chrome на свободном 32602. Повторяемый
fallback: `node scripts/measure-lighthouse-local.mjs`; три cold-storage mobile
измерения, тот же реальный production preview. Порог проверяется по медиане.

| Run | Performance | Accessibility | LCP     | CLS     |
| --- | ----------- | ------------- | ------- | ------- |
| 1   | 99          | 100           | 1.955 s | 0.00585 |
| 2   | 99          | 100           | 1.954 s | 0.00609 |
| 3   | 99          | 100           | 1.953 s | 0.00585 |

Сначала декоративное MOVE на mobile становилось поздним LCP-элементом. На узком
экране надпись убрана ради более спокойной композиции; две основные кириллические
font subsets предзагружаются. Это измеренный итог после исправления, а не числа
исторического релиза. Field p75 INP/LCP ещё не измерены в deployed environment.

### Сохранность окружения и открытые gates

Основная БД до и после: **33 products / 32 orders / 11 auth.users**. Основной DB
container не включался в test network. Промежуточная scratch database, созданная
в начале задачи на основном container и не использованная browser tests,
проверена (0 orders / 0 users) и удалена. Тестовые данные живут только в отдельном
контейнере и volume. Чужие containers/processes/volumes не останавливались.

В конце штатный dev 32600 оставлен работающим (HTTP 200). Временный preview 32601
и запущенные для задачи test services 32641/32644 остановлены; их containers и
отдельный test volume сохранены. Финальный `dist` пересобран с основными локальными
settings из `.env.local`, а не с тестовым API. Будущий запуск preview использует
обычную локальную конфигурацию.

Native NVDA + Firefox и Android TalkBack + Chrome не выполнялись. Их gate остаётся
открытым; viewport emulation и axe его не заменяют. Деплой, deployed smoke,
cloud SMTP и field Web Vitals не перепроверены этой задачей. Commit/push/deploy
не выполнялись. Полный multi-engine suite не заявляется: Firefox/WebKit покрыты
выбранными критическими сценариями.

## Артефакты и изменённые области

- `src/routes/home/HomeRoute.tsx`, `HomeRoute.module.scss` — композиция и motion.
- `src/app/layouts/RootLayout.*`, `src/shared/ui/Icon/Icon.tsx`, shared styles,
  Button/Badge/WishlistButton — общий визуальный язык и navigation.
- `src/entities/product/ui/ProductCard.*`, `FitLine.module.scss`,
  `model/productLocalization.*`, `src/routes/product/ProductRoute.*` — обувь,
  цвет, copy и решение о размере.
- Catalog/Discovery, Cart/CartLines/CartQuickSheet, Wishlist, Checkout, Auth,
  Orders CSS Modules — согласованные surfaces всего магазина.
- `index.html`, `src/test/setup.ts`, e2e smoke/redesign/resilience suites,
  два reviewed snapshots, `scripts/capture-redesign.mjs`,
  `scripts/measure-lighthouse-local.mjs` — первый paint и evidence.
- `public/media/editorial/city-route*.webp` — built-in ImageGen, prompt и
  provenance в [media-sources](../content/media-sources.md).
- [Интерактивное до/после](screenshots/redesign/comparison.html),
  [сравнение одним изображением](screenshots/redesign/before-after-desktop.png),
  [запись взаимодействий](screenshots/redesign/motion-and-shopping.webm),
  [desktop home](screenshots/redesign/after-home-desktop.png),
  [mobile home](screenshots/redesign/after-home-mobile.png),
  [PDP](screenshots/redesign/after-product-desktop.png),
  [корзина](screenshots/redesign/after-cart-desktop.png),
  [review](screenshots/redesign/after-checkout-review-mobile.png),
  [receipt](screenshots/redesign/after-receipt-mobile.png).

## Дополнительный аудит — 2026-10-18

Это проверка по запросу владельца, а не исправление или публикация редизайна.
Существующие незакоммиченные изменения сохранены. Product source, Git history,
production settings, VPN configuration and database records were not changed.

### Доступность через VPN и прямое подключение

- Проверены два отдельных исходящих соединения на одном компьютере: текущий Happ
  tunnel (Cloudflare trace: FR) и запросы с привязкой к физическому Ethernet
  (Cloudflare trace: RU). Общий VPN не переключался. Для прямого browser context
  использован временный localhost CONNECT proxy на свободном Solecraft-порту
  41700; исходящий socket привязан к Ethernet. Оба browser contexts подтвердили
  разные страны выхода. Cookies и пользовательские сессии не переносились.
- `https://solecraft-two.vercel.app/` возвращает HTTP 200 в обоих режимах.
  Однако реальный гостевой путь на опубликованном сайте не проходит: каталог
  не получает товары из backend. Browser фиксирует `ERR_NAME_NOT_RESOLVED` для
  `nwekblxelexknvvrfwig.supabase.co`; независимый DNS-over-HTTPS запрос возвращает
  NXDOMAIN. Supabase CLI подтвердил у проекта `solecraft` статус `INACTIVE`.
  Причина перевода проекта в это состояние не установлена. Проект не возобновляли.
- Production build marker по-прежнему указывает `149f2c1` от 2026-09-28.
  Редизайн от 2026-10-17 существует локально и пока не опубликован.

### Подтверждённые проблемы

| Приоритет | Наблюдение                                                                                                                                               | Точное место / действие                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P1        | Production frontend открывается, но каталог, PDP и зависимый checkout недоступны из-за неактивного backend                                               | Восстановить существующий Supabase project и повторить оба network journeys; новый проект/платный ресурс для этого аудита не создавался   |
| P2        | Длинный допустимый email растягивает review: при 390 CSS px document width становится 967 px; на 768 px — около 1163 px, сумма и кнопка выходят за экран | `src/routes/checkout/CheckoutRoute.module.scss:119`: `1fr 1fr` без ограничения min-content; в review children нет переноса длинных строк  |
| P2        | На 430×932 нижняя фиксированная кнопка закрывает клавиатурный фокус на размере; `focus()` и следующий Tab оставляют центр выбранного control под кнопкой | `src/routes/product/ProductRoute.module.scss:373`: fixed action; необходима компенсация нижнего перекрытия при focus/scroll               |
| P3        | Размерная таблица названа справочником бренда, хотя все строки имеют источник «Редакционная демо-оценка»                                                 | `src/routes/product/ProductRoute.tsx:123`: вводный текст должен соответствовать provenance; пояснение `sourceNote` сейчас не показывается |

### Что прошло и пределы проверки

- Текущий локальный код успешно собран (strict TypeScript + Vite).
- Chromium: гостевой каталог → PDP → colorway/reload → wishlist/reload →
  drawer → cart quantity/reload → checkout final review прошёл на 1440×900
  и 390×844. Неожиданных page errors и failed requests нет; axe на review — 0
  violations. Создание заказа и отправка писем намеренно не выполнялись.
- Firefox и WebKit: тот же mobile/desktop гостевой путь до review прошёл 4/4
  в существующем `public-demo-polish` suite с read-only флагом.
- Проверены 14 размеров: 320×568, 360×800, 390×844, 430×932, 667×375,
  720×450 (эквивалент 200% zoom), 768×1024, 844×390, 1024×768, 1280×720,
  1440×900, 1920×1080, 2560×1080, 3840×2160. Для пяти страниц в RU и пяти
  дополнительных EN страниц при 320 px — 75 измерений. С обычными данными
  горизонтальное переполнение и обрезанные по ширине controls не обнаружены.
  Отдельные проверки keyboard occlusion и длинного email выявили проблемы выше.
- Native NVDA/TalkBack, физические телефоны/ультраширокие мониторы, реальный
  browser zoom и внешняя доставка magic-link email не проверены. Эмуляция
  viewport не считается физическим устройством. Полный повтор unit/security/
  checkout-submit suite не выполнялся: продуктовый код этим аудитом не менялся.

Просмотренные доказательства:
[production catalog](screenshots/redesign/audit-20261018/production-catalog.png),
[focused size covered by action](screenshots/redesign/audit-20261018/size-focus-430.png),
[long email review](screenshots/redesign/audit-20261018/long-email-review-390.png).
Сырые JSON и дополнительные кадры: ignored `.codex-temp/audit-20261018/`.

Для portfolio demo новые продуктовые функции не требуются, чтобы исправить
подтверждённые проблемы. Приоритет: активный backend, две ошибки вёрстки,
источник размерной таблицы, затем сохранение и публикация проверенного редизайна.
Настоящая оплата, доставка и коммерческие условия — отдельный scope реального
магазина; они не заявляются отсутствующими обязательными возможностями этого demo.

## Исправления и подготовка публикации — 2026-10-18

После аудита владелец явно разрешил восстановление Supabase, исправления,
commit/push и production deploy. Существующий редизайн сохранён.

- Тот же production Supabase восстановлен до `ACTIVE_HEALTHY` штатным API.
  Каталог и Auth settings отвечают 200; данные, схема, тариф и Auth URL сохранены.
  Новые облачные ресурсы не создавались.
- Review использует ограниченные grid tracks и перенос длинных строк; длинный
  допустимый email не скрывает итог и submit на 320/390/768/1440 px. Аналогичный
  перенос добавлен для auth/account.
- Mobile PDP резервирует scroll-padding под fixed purchase action и header.
  Focus, Tab и Shift+Tab больше не оставляют активный размер под overlay.
- Таблица размеров различает manufacturer/demo/unknown, показывает source note
  и не выводит неподтверждённый mm mapping для unknown.
- Реальная production-конфигурация не содержит custom SMTP. Форма email-входа
  честно сообщает временную недоступность; guest cart/wishlist/checkout доступны.
  Сессии существующих пользователей, callback и owner-only данные сохранены.
- Три точечных transitive security updates в lockfile: source-map-js 1.2.2,
  brace-expansion 5.0.12, undici 7.30.1. Новых библиотек нет; npm audit — 0.

### Локальная проверка исправленного кода

- Lint, форматирование, strict TypeScript, deploy-config tests и build прошли.
  Vitest: 95/95, 31 файл; финальный повтор ограничен двумя workers после одного
  timing failure lazy-route при параллельной нагрузке. Assertions не ослаблялись.
- Chrome: 80 PASS, 3 предусмотренных SKIP. Bundled Chromium: отдельный visual
  regression test PASS; оба reviewed snapshots совпали.
- Firefox и WebKit: по 8 критических сценариев PASS, включая mobile/desktop
  гостевой заказ до receipt, colorway, wishlist, qty=2, keyboard focus,
  reduced motion, недоступное hero image и длинный email.
- Order/Auth mutations выполнялись только на существующем изолированном стеке
  32641/32644 и отдельной БД. Production этим прогоном не засорялась. Тест
  quantity=2 при исчерпанном цвете выбирает доступную расцветку той же модели;
  проверка точного SKU/цвета сохраняется, stock не сбрасывался.
- Повторены 75 измерений на 14 viewport из аудита выше: горизонтального
  переполнения и обрезанных по ширине controls нет. Проверены оба гостевых пути
  до review; page errors, failed requests, axe violations на review — 0.
  Обычное перекрытие прокручиваемого контента fixed header/CTA само по себе не
  считается ошибкой фокуса: активный control отдельно проверен в трёх движках.
- Initial JS 121.74 KiB gzip, CSS 8.83 KiB. Первые Lighthouse-проходы дали
  78/82/99 и нестабильный LCP 4.90/4.24/1.98 s. Повтор без параллельной
  браузерной нагрузки: 99/99/99, accessibility 100, median LCP 1.954 s,
  CLS 0.00585. Оба набора сохранены; медленный первый набор не скрывается.

До/после найденных ошибок:
[focus до](screenshots/redesign/audit-20261018/size-focus-430.png) /
[после](screenshots/redesign/release-20261018/size-focus-430.png),
[review до](screenshots/redesign/audit-20261018/long-email-review-390.png) /
[после](screenshots/redesign/release-20261018/long-email-review-390.png).
Результаты и дополнительные кадры: ignored `.codex-temp/release-20261018-*`.

### Предварительная доступность из России

Проверка одного российского Ethernet-маршрута и одного VPN не доказывает
доступность у всех операторов. После публикации повторяется именно browser
journey с полной загрузкой assets и backend, а не только HEAD/HTTP 200.

В [первичном сообщении Vercel Community](https://community.vercel.com/t/custom-domain-response-bodies-stall-in-russia-while-vercel-app-works-on-the-same-ips/49387)
пользователь описывает обрыв тела custom .ru при рабочем .vercel.app.
В [другом обсуждении с ответом Vercel](https://community.vercel.com/t/custom-domain-unreachable-from-some-russian-isps-while-vercel-app-works/48756)
есть российские ISP-случаи и похожее наблюдение из UK: это не доказательство
единой причины или общероссийского запрета. Существующий бесплатный alias
сохраняется; данных для платного CDN/переезда нет.

Для Mail/Яндекс/Rambler ограничение сейчас общее для любых внешних адресов:
[default Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp) допускает
лишь участников команды (2 письма/час). Нужен существующий отправитель, проверка
SPF/DKIM/DMARC и фактически полученная ссылка с завершённым callback на нужных
почтовых провайдерах. API 200 не подтверждает доставку. Подтверждение email не
отключалось; чужие SMTP credentials не используются.

Оставшиеся внешние gates: custom SMTP и реальная доставка/вход; native
NVDA+Firefox и Android TalkBack+Chrome. Free Supabase может снова pause при низкой
активности согласно [условиям сервиса](https://supabase.com/docs/guides/platform/free-project-pausing).
Это ограничение бесплатного uptime, а не основание включать платный ресурс.

### Результат production deploy и проверок

Код сохранён и отправлен в `master`: `30a268d747f4d7b2a7c5b13ad9746c87518ef190`.
Опубликован в существующем проекте, alias `https://solecraft-two.vercel.app`;
`build-info.json` подтвердил этот commit. Следующий commit добавляет только
документацию/доказательства; production marker повторно сверяется с HEAD.

- [CI 39081039154](https://github.com/godaylor/solecraft/actions/runs/39081039154):
  SUCCESS — quality, database/security, Chromium E2E, Lighthouse. Scheduled
  three-browser job пропущен по условию workflow; локальное покрытие Firefox/
  WebKit указано выше, полный multi-engine suite не заявляется.
- Production Chrome: 20/20 PASS. Автоматически пройдены 32 published models и
  64 colorways: стабильные title/description/media family, точный цвет/alt,
  уникальные SKU между цветами, смена фото и сброс выбранного размера.
  Все 64 изображения отдельно просмотрены на двух atlas sheets.
- Проверены карточки 360/390/768/1440 px: сердце, фото и один scenario не
  пересекаются. RU/EN reflow повторён вплоть до 7680 CSS px. Checkout review с
  длинным email, keyboard focus и source notes прошли на опубликованном коде.
- Два VPN journeys (FR) прошли на 1440×900 и 390×844: каталог → PDP → цвет →
  избранное → compact drawer → qty=2/reload → checkout review. Production
  заказы и Auth email не отправлялись; полный submit/receipt был в test stack.

Сеть требует отдельной оговорки. Через физический Ethernet (trace RU) обычные
DNS answers `216.198.79.131`/`64.29.17.131` на этом подключении дают TLS reset
до HTTP. То же поведение воспроизведено curl, отдельным выбором каждого IP и
TLS 1.2; default direct browser journey НЕ ПРОШЁЛ. Ответ DNS через независимый
DoH (`.3`) здесь также не загрузился. Точную причину/виновника эти проверки не
устанавливают. Нельзя обещать, что обычное отключение VPN устранит проблему:
его системные маршруты и DNS в этой задаче не переключались.

Два дополнительных прямых RU browser journeys прошли на desktop/mobile через
доступный edge `216.198.79.195`. IP выбирался только внутри временного CONNECT
proxy; hostname, HTTPS/SNI, приложение и backend оставались production.
`64.29.17.195` также отдал точный build marker. Это диагностический PASS с
явным IP override, а не исправление обычного DNS-маршрута. Page errors, failed
requests и axe review violations на успешных journeys — 0. Каталог и публичный
Auth API Supabase ответили 200 через оба физических исходящих соединения.

Независимая [Globalping-проверка](https://api.globalping.io/v1/measurements/2W8P6mlXvrtXtQH5A00021KuB)
от 2026-10-18 00:03:35 UTC: Москва/Timeweb AS9123, Петербург/Selectel AS49505,
Москва/Selectel AS50340 и Франция/OVH AS16276 получили полный 91-byte JSON
с `30a268d`, HTTP 200, valid TLS 1.3, `truncated:false`. Это серверные сети,
не домашние/мобильные операторы. [Check-Host](https://check-host.net/check-report/51acdfe1kb6):
две RU-ноды и Париж 200, ещё одна московская нода timeout. В совокупности это
подтверждает зависимость от маршрута и исключает вывод о всеобщей недоступности
из РФ в момент измерения. Внешние HTTP probes не заменяют browser checkout.

Production evidence: [карточка 390 px](screenshots/redesign/release-20261018/production-card-390.png),
[карточка desktop](screenshots/redesign/release-20261018/production-card-desktop.png),
[drawer mobile](screenshots/redesign/release-20261018/production-drawer-390.png),
[atlas 1](screenshots/redesign/release-20261018/catalog-atlas-1.png),
[atlas 2](screenshots/redesign/release-20261018/catalog-atlas-2.png).
Карточка до редизайна: [desktop catalog](screenshots/redesign/before-catalog-desktop.png).
Mapping и сырые сетевые результаты сохранены в ignored release artifacts.

Реально незакрыто: публичная доставка email/вход без существующего SMTP;
native NVDA/TalkBack evidence; нестабильная доступность Vercel по обычному
маршруту конкретного российского подключения. Платные ресурсы, миграции/reset
production и общий admin password не создавались. Эти gates остаются открытыми;
публикация проверенного demo выполнена по прямому запросу владельца.
