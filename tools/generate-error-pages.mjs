import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { t } from "./i18n-catalog.mjs";
import { site } from "./seo-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const homes = { pl: "/pl/", en: "/en/" };
const catalogues = { pl: "/pl/samochody/", en: "/en/cars/" };
const routes = {
  pl: { 404: "/404.html", 500: "/500.html" },
  en: { 404: "/en/404/", 500: "/en/500/" }
};
const targetFor = (route) => route.endsWith(".html") ? path.join(root, route.slice(1)) : path.join(root, route.slice(1), "index.html");

function html(locale, code) {
  const route = routes[locale][code];
  return `<!doctype html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${t(locale, `error.${code}.seoTitle`)}</title><meta name="description" content="${t(locale, `error.${code}.description`)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${site.origin}${route}"><link rel="stylesheet" href="/styles.css?v=20260816-1"></head><body class="content-page"><header class="topbar"><a class="brand" href="${homes[locale]}" aria-label="Atlant Auto"><span class="brand-wordmark"><img src="/assets/site/atlant-auto-wordmark.svg" alt="Atlant Auto" width="720" height="150"></span></a></header><main><section class="content-hero"><p class="eyebrow">${code}</p><h1>${t(locale, `error.${code}.title`)}</h1><p class="lead">${t(locale, `error.${code}.description`)}</p><div class="hero-actions"><a class="button primary" href="${homes[locale]}">${t(locale, "action.backHome")}</a><a class="button ghost dark" href="${catalogues[locale]}">${t(locale, "navigation.catalog")}</a></div></section></main></body></html>`;
}

for (const locale of Object.keys(routes)) {
  for (const code of ["404", "500"]) {
    const target = targetFor(routes[locale][code]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html(locale, code), "utf8");
  }
}
console.log("Generated localized 404 and 500 pages.");
