# Atlant Auto: технический SEO-фундамент

Дата реализации: 19 июля 2026 года.

## Архитектура

Сайт остаётся статическим и публикуется из каталога `atlant-auto-draft` через GitHub Pages. SEO-страницы создаются из централизованной конфигурации `tools/seo-config.mjs` генераторами:

- `tools/generate-seo-pages.mjs` — языковые и тематические страницы, `sitemap.xml`, `robots.txt`;
- `tools/generate-car-pages.mjs` — статические карточки автомобилей с Vehicle/Product schema;
- `atlant-auto-draft/js/seo.test.mjs` — автоматическая проверка метаданных, canonical, hreflang, sitemap, JSON-LD и статического контента.

Команда повторной генерации: `npm run generate:seo`.

## Языковые URL

| Раздел | Русский | Polski | English |
| --- | --- | --- | --- |
| Главная | `/` | `/pl/` | `/en/` |
| Авто из Европы | `/avto-iz-evropy/` | `/pl/samochody-z-europy/` | `/en/cars-from-europe/` |
| Авто с аукциона | `/avto-s-aukciona/` | `/pl/samochody-z-aukcji/` | `/en/auction-cars/` |
| Каталог | `/avtomobili/` | `/pl/samochody/` | `/en/cars/` |
| Калькулятор | `/kalkulator/` | `/pl/kalkulator/` | `/en/calculator/` |
| Процесс | `/kak-my-rabotaem/` | `/pl/jak-dzialamy/` | `/en/how-it-works/` |
| Кейсы | `/kejsy/` | `/pl/realizacje/` | `/en/case-studies/` |
| О компании | `/o-kompanii/` | `/pl/o-nas/` | `/en/about/` |
| FAQ | `/faq/` | `/pl/faq/` | `/en/faq/` |
| Контакты | `/kontakty/` | `/pl/kontakt/` | `/en/contact/` |
| Privacy | `/privacy/` | `/pl/polityka-prywatnosci/` | `/en/privacy/` |

Каждая языковая группа содержит самоссылочный canonical, взаимные `hreflang="ru|pl|en"` и `x-default` на русскую версию.

## Метаданные и заголовки

Title, description и H1 централизованы в `tools/seo-config.mjs`. Автотест запрещает:

- пустые или повторяющиеся title/description;
- отсутствие либо несколько H1;
- canonical, не совпадающий с фактическим URL;
- hreflang без опубликованной взаимной страницы.

## Structured data

- главная: `Organization`, `AutoDealer`, `WebSite`;
- тематические страницы: `Organization`, `AutoDealer`, `WebSite`, `BreadcrumbList`;
- FAQ: дополнительно `FAQPage`;
- карточки автомобилей: `Product`, `Vehicle`, а `Offer` добавляется только при известной цене.

Искусственные рейтинги и `aggregateRating` не используются.

## Индексация

- `robots.txt` разрешает обход и указывает канонический sitemap;
- `sitemap.xml` содержит только существующие индексируемые canonical URL;
- `404.html` содержит `noindex,follow`; GitHub Pages отдаёт его с HTTP 404;
- критический каталог и карточки автомобилей находятся в исходном HTML, а не только в JavaScript.

## Проверка

- 23 автоматических теста: успешно;
- desktop 1440×900: один H1, три карточки каталога, без горизонтального переполнения и ошибок консоли;
- mobile 390×844: польская страница каталога и карточка BMW X1 без горизонтального переполнения и ошибок консоли;
- контрольные изображения: `docs/seo-qa-desktop.png` и `docs/seo-qa-mobile-viewport.png`.

## Ограничения и следующие шаги

- реальные GA4 и Search Console ID не добавлялись, потому что они не были предоставлены;
- показатель Lighthouse следует зафиксировать на production после завершения GitHub Pages deployment;
- рабочий калькулятор растаможки пока русскоязычный и вынесен на `/customs-calculator.html`; языковые SEO-страницы калькулятора объясняют назначение и ведут к нему;
- перед расширением каталога стоит добавить польские и английские версии каждой карточки автомобиля и только затем включать для них hreflang.
