# Solecraft — темы и плавные переходы

Дата: 2026-10-23. Продолжение опубликованного редизайна M10 по запросу владельца.
Название Solecraft, каталог, Supabase, данные и пользовательский путь сохранены.

## Что изменилось

- Светлая, тёмная и системная темы. Выбор находится в desktop header и мобильном
  меню, сохраняется между посещениями и синхронизируется между вкладками.
- Тема применяется внешним same-origin скриптом до загрузки React. CSP не ослаблена.
- Тёмная палитра покрывает главную, каталог, PDP, фильтры, избранное, корзину,
  checkout, вход и заказы. Изображения обуви не перекрашиваются.
- Вход заголовка при смене страницы, однократное появление секций при прокрутке,
  более спокойные реакции фото и стрелок. Текст сохраняет полный контраст во время
  переходов; формы не перемонтируются. Reduced motion отключает движение.
- Уточнены подписи размеров, текст о посадке и условиях демо-заказа. Удалено
  фиктивное обещание возврата товара, который не отправляется.
- Границы интерактивных полей выделены отдельным контрастным токеном. Проверены
  недоступные фото, состояния без товаров, focus trap и возврат фокуса.

Решения отражены в `PRODUCT_OPTIONS.md` и `ARCHITECTURE.md`. Новых библиотек,
платных ресурсов или production-миграций нет.

## Проверки

Полный гостевой заказ проверяется только на ранее созданной изолированной базе
Solecraft. На production автоматическая проверка останавливается на подтверждении
checkout и не изменяет заказы/остатки.

- Unit/component: 109 проверок, включая темы, storage failure и motion lifecycle.
- Chrome: каталог целиком — 32 модели / 64 colorways; мобильная и desktop покупка
  до receipt, повторная отправка и reload; keyboard-only journey; формы и ошибки;
  медленная сеть, 503/retry, недоступные изображения; forced colors и reduced motion.
- Обе темы: 320, 360, 390, 768, 844 landscape, 1024, 1440, 2560 px; прежняя
  RU/EN проверка дополнительно охватывает ширины до 7680 px.
- Axe: главная, каталог, PDP, меню, drawer, review и error/empty states.
- Firefox и WebKit: все 7 appearance-сценариев пройдены в каждом движке.
  WebKit проверяется после готовности локальных шрифтов и завершения reflow;
  ранние промежуточные измерения цвета/ширины не считаются финальным layout.
- Визуальные эталоны Home/Catalog просмотрены, обновлены и повторно проверены.
- Lint, format, typecheck/build, deployment contracts и bundle budget пройдены.
  Initial JS: 123.15 KiB gzip / 200 KiB; CSS: 9.65 KiB / 40 KiB.
- Первый Lighthouse-набор: performance 81/89/98, LCP 4.393/3.345/2.129 s,
  median budget FAIL. Повторный отдельный набор на том же коде: 98/98/98,
  accessibility 100, median LCP 2.125 s, median CLS 0.00581 — PASS. Причина
  разброса не доказана; оба набора сохранены в ignored `.codex-temp/appearance-performance*`.
- Визуальное сравнение: `screenshots/appearance-20261022/` (начало работы 22 октября).

Карточка: [до](screenshots/appearance-20261022/before-card-desktop.png),
[после, светлая](screenshots/appearance-20261022/after-card-desktop-light.png),
[после, тёмная](screenshots/appearance-20261022/after-card-desktop-dark.png).
Дополнительно: [desktop](screenshots/appearance-20261022/after-home-desktop-dark.png),
[mobile](screenshots/appearance-20261022/after-home-mobile-dark.png),
[корзина](screenshots/appearance-20261022/after-drawer-mobile-dark.png),
[checkout](screenshots/appearance-20261022/after-checkout-mobile-dark.png).

## Обновление инструментов

Release-проверка обнаружила новые advisories в инструментах разработки. Vite
обновлён с 8.2.2 до 8.2.4, Vitest — с 4.1.11 до 4.1.12, в пределах текущих
веток. Причины: [Vite advisory](https://github.com/advisories/GHSA-rq7h-c2jc-7f22)
и [Vitest Windows path advisory](https://github.com/advisories/GHSA-xp26-3454-mjgp).
Новых прямых зависимостей нет. `npm audit`: 0 vulnerabilities. Внутренняя ошибка
Arborist у npm 10 при обновлении optional peers обойдена одноразовым npm 11;
итоговый lockfile проходит `npm ci --dry-run --ignore-scripts` обычным npm проекта.

## Границы результата

Эта задача завершает изменение оформления, а не закрывает все portfolio release
gates. Существующие вопросы SMTP для публичного email-входа, проверки без VPN на
обычных российских провайдерах и ручные NVDA/TalkBack проверки не подменяются
тестами темы. Их актуальные ограничения описаны в
[предыдущем release-отчёте](REDESIGN_M10.md).
