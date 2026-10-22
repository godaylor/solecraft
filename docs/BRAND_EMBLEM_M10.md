# Solecraft — графическая эмблема

Дата: 2026-10-23. Продолжение M10 по запросу владельца.

## Результат

Вместо тонкого маршрутного значка в шапке и подвале используется отдельная
объёмная картинка: S из слоёв кроссовочной подошвы. Синий корпус, светлая верхняя
поверхность и оранжевый протектор поддерживают существующую палитру. Название
Solecraft остаётся текстом. Картинка не меняет цвет вместе с темой.

Оригинал создан встроенным OpenAI ImageGen без сторонних изображений, сохранён
в [content/brand](../content/brand/README.md) вместе с точным prompt. PNG имеет
прозрачный alpha. Оптимизированные WebP: 96 px — 5702 байта, 192 px — 13230,
384 px — 33530. Генерация не вызывается при сборке или открытии сайта.

Знак используется также в favicon, Apple touch icon, manifest и social preview.
Все производные воспроизводятся `node scripts/build-brand-assets.mjs` через
установленный Chrome без новой зависимости или платного ресурса.

## Анимация и доступность

- Однократное упругое приземление за 720 ms при появлении оболочки сайта.
- Небольшой подъём и наклон при наведении/фокусе ссылки на главную.
- Нет бесконечного вращения, скрытия контента или изменений размеров layout.
- Reduced motion отключает движение полностью.
- У картинки задана геометрия; декоративный `alt=""` сохраняет единое доступное
  имя ссылки. Размеры знака: header 32/36/44 px, footer 56/64 px.
- На 320 px сокращены интервалы и размер wordmark, чтобы сохранить кнопки шапки.

## Изменённые части

- `src/shared/ui/BrandMark/` — картинка и CSS-анимация.
- `src/app/layouts/RootLayout.tsx` и `.module.scss` — header/footer.
- `public/brand/`, `index.html`, `public/site.webmanifest`, `public/social-card.*`.
- `scripts/build-brand-assets.mjs`, `content/brand/`, `content/media-sources.md`.
- Два визуальных эталона Home/Catalog обновлены после просмотра результата.

## Проверки

- 109 unit/component tests, сборка и bundle budget: PASS.
- 11 Chrome-сценариев: темы, RU/EN, reflow, гостевой путь до проверки checkout — PASS.
- Firefox и WebKit: обе темы с новой эмблемой проходят reflow-сценарий — 2/2 PASS.
- Картинка, отсутствие пересечений, hover, 720 ms / 1 iteration и reduced motion:
  320, 360, 390, 768, 1024, 1440 px × light/dark — 12/12 PASS.
- Скриншоты просмотрены в обеих темах на mobile и desktop.
- Home/Catalog visual baseline после обновления повторно проверен — PASS.
- Lint, format и deployment contracts — PASS. Initial JS 123.37 KiB gzip,
  CSS 9.89 KiB gzip; бюджеты 200/40 KiB соблюдены.
- Первый Vitest-запуск был заблокирован EPERM при rename во временной папке
  sandbox. Повторный запуск существующих тестов вне этого ограничения: 109 PASS.

Production-база и пользовательские данные не менялись. Эта правка не закрывает
прежние внешние вопросы SMTP, российских сетевых маршрутов и manual AT.

## Сравнение

- [До, mobile](screenshots/brand-20261023/before-390-light.png) →
  [после, mobile](screenshots/brand-20261023/home-390-light.png).
- [До, desktop](screenshots/brand-20261023/before-1440-dark.png) →
  [после, desktop](screenshots/brand-20261023/home-1440-dark.png).
- [Подвал, mobile](screenshots/brand-20261023/footer-390-dark.png).
- [Social preview](../public/social-card.png).
