# Atlant Auto localization

## Source language and approval

Russian (`ru`) is the source language. New or changed customer-facing copy is first written and approved in Russian. Polish (`pl`) and English (`en`) values are then prepared as contextual localizations for automotive sales, sourcing, delivery, payment and documentation.

The public site never calls a translation service. All three language versions are generated in advance and deployed as static HTML.

## Translation catalogue

The catalogue entry point is `tools/i18n-catalog.mjs`. Every entry uses a permanent semantic key and contains exactly three values:

```js
"navigation.catalog": {
  ru: "Автомобили",
  pl: "Samochody",
  en: "Cars"
}
```

Russian text is never used as a key. Page, home-page and vehicle content is split into focused source files and merged into the central catalogue:

- `tools/seo-config.mjs` — SEO landing-page content;
- `tools/home-localization.mjs` — home-page content and forms;
- `tools/car-localization.mjs` — equipment, condition, service and document terminology;
- `atlant-auto-draft/data/cars.js` — factual vehicle records and approved advertising descriptions.

## Generated language routes

- Russian: `/`, `/avtomobili/`, `/cars/<slug>.html`
- Polish: `/pl/`, `/pl/samochody/`, `/pl/samochody/<slug>/`
- English: `/en/`, `/en/cars/`, `/en/cars/<slug>/`

The customs calculator, 404 and 500 pages also have pre-generated RU, PL and EN versions. Every indexable equivalent has a self-referencing canonical URL and reciprocal `hreflang` links.

## Adding or changing text

1. Create a stable key that describes meaning and context.
2. Add and approve the Russian value.
3. Add natural Polish and English localizations.
4. Use `t(locale, "semantic.key")` in a generator; do not put display text in browser scripts or business logic.
5. Run `npm run generate:seo`.
6. Run `npm test`.

The localization test rejects invalid keys, missing language values, Cyrillic text on Polish or English pages, browser translation-service calls and hardcoded Russian strings in interactive browser components.
