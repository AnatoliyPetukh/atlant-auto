import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { messages, t } from "./i18n-catalog.mjs";
import { site } from "./seo-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const routes = { ru: "/customs-calculator.html", pl: "/pl/customs-calculator.html", en: "/en/customs-calculator.html" };
const homes = { ru: "/", pl: "/pl/", en: "/en/" };
const catalogues = { ru: "/avtomobili/", pl: "/pl/samochody/", en: "/en/cars/" };
const contacts = { ru: "/kontakty/", pl: "/pl/kontakt/", en: "/en/contact/" };
const runtimeKeys = Object.keys(messages).filter((key) =>
  key.startsWith("calculator.result.") || key.startsWith("calculator.cost.") || key.startsWith("calculator.error.")
);
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const targetFor = (route) => route.endsWith(".html") ? path.join(root, route.slice(1)) : path.join(root, route.slice(1), "index.html");

function alternateLinks() {
  return Object.entries(routes).map(([locale, route]) =>
    `<link rel="alternate" hreflang="${locale}" href="${site.origin}${route}">`
  ).concat(`<link rel="alternate" hreflang="x-default" href="${site.origin}${routes.ru}">`).join("\n  ");
}

function html(locale) {
  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    `<option value="${index + 1}"${index === 6 ? " selected" : ""}>${t(locale, `calculator.month.${index + 1}`)}</option>`
  ).join("");
  const runtime = Object.fromEntries(runtimeKeys.map((key) => [key, t(locale, key)]));
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t(locale, "calculator.seo.title")}</title>
  <meta name="description" content="${t(locale, "calculator.seo.description")}">
  <link rel="canonical" href="${site.origin}${routes[locale]}">
  ${alternateLinks()}
  <link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/site/favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/site/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${t(locale, "calculator.seo.title")}">
  <meta property="og:description" content="${t(locale, "calculator.seo.description")}">
  <meta property="og:url" content="${site.origin}${routes[locale]}">
  <link rel="stylesheet" href="/styles.css?v=20260818-2">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="${homes[locale]}" aria-label="Atlant Auto"><span class="brand-wordmark"><img src="/assets/site/atlant-auto-wordmark.svg" alt="Atlant Auto" width="720" height="150"></span></a>
    <nav class="nav" aria-label="${t(locale, "navigation.primary.label")}"><a href="${catalogues[locale]}">${t(locale, "navigation.catalog")}</a><a href="${routes[locale]}" aria-current="page">${t(locale, "navigation.calculator")}</a><a href="${contacts[locale]}">${t(locale, "navigation.contact")}</a></nav>
    <div class="language-nav" aria-label="${t(locale, "language.selector.label")}">${Object.entries(routes).map(([code, route]) => `<a href="${route}" lang="${code}"${code === locale ? ' aria-current="page"' : ""}>${code.toUpperCase()}</a>`).join("")}</div>
  </header>
  <main>
    <section class="calc-page-hero"><div><p class="eyebrow">${t(locale, "calculator.eyebrow")}</p><h1>${t(locale, "calculator.title")}</h1><p class="lead">${t(locale, "calculator.intro")}</p></div></section>
    <section class="section calc-section"><div class="calc-layout">
      <form class="calc-form" id="customsCalculatorForm">
        <label>${t(locale, "calculator.field.price")}<input name="price" type="number" min="1" step="0.01" value="10000" required></label>
        <label>${t(locale, "calculator.field.currency")}<select name="currency"><option value="EUR" selected>EUR</option><option value="PLN">PLN</option></select></label>
        <label>${t(locale, "calculator.field.releaseMonth")}<select name="releaseMonth">${monthOptions}</select></label>
        <label>${t(locale, "calculator.field.releaseYear")}<input name="releaseYear" type="number" min="1990" max="2026" value="2022" required></label>
        <label>${t(locale, "calculator.field.engineCapacity")}<input name="volumeCc" type="number" min="1" step="1" value="2000" required></label>
        <label>${t(locale, "calculator.field.engineType")}<select name="engineType"><option value="petrol">${t(locale, "vehicle.fuel.petrol")}</option><option value="diesel">${t(locale, "vehicle.fuel.diesel")}</option><option value="hybrid">${t(locale, "vehicle.fuel.hybrid")}</option><option value="electric">${t(locale, "vehicle.fuel.electric")}</option></select></label>
        <fieldset class="calc-fieldset calc-mode"><legend>${t(locale, "calculator.field.clearanceMode")}</legend><label><input type="radio" name="clearanceMode" value="standard" checked> ${t(locale, "calculator.mode.standard")}</label><label><input type="radio" name="clearanceMode" value="benefit50"> ${t(locale, "calculator.mode.benefit50")}</label></fieldset>
        <label class="calc-check"><input name="includeFullBudget" type="checkbox"> ${t(locale, "calculator.field.fullBudget")}</label>
        <button class="small-button calc-advanced-toggle" id="advancedToggle" type="button" aria-expanded="false">${t(locale, "calculator.field.advanced")}</button>
        <div class="calc-advanced" id="advancedPanel" hidden>
          ${["auctionFee","deliveryToWarsaw","deliveryToBelarus","recyclingFee","customsFee","declarant","temporaryStorage","epts","other"].map((name) => `<label>${t(locale, `calculator.cost.${name}`)}, EUR<input name="${name}" type="number" min="0" step="0.01"></label>`).join("")}
        </div>
        <button class="button primary" type="submit">${t(locale, "action.calculate")}</button>
      </form>
      <aside class="calc-result" id="customsCalculatorResult" aria-live="polite"></aside>
    </div></section>
  </main>
  <footer class="footer"><div><a class="brand footer-brand" href="${homes[locale]}" aria-label="Atlant Auto"><span class="brand-wordmark"><img src="/assets/site/atlant-auto-wordmark.svg" alt="Atlant Auto" width="720" height="150"></span></a><p>${t(locale, "footer.tagline")}</p></div><address><a href="tel:+48515392420">${site.phone}</a><a href="mailto:${site.email}">${site.email}</a><span>${site.address}</span></address></footer>
  <aside class="cookie-banner" data-cookie-banner hidden><div><strong>${t(locale, "cookie.banner.title")}</strong><p>${t(locale, "cookie.banner.description")}</p></div><div class="cookie-actions"><button class="small-button" type="button" data-cookie-choice="essential">${t(locale, "cookie.banner.acceptEssential")}</button><button class="button primary" type="button" data-cookie-choice="all">${t(locale, "cookie.banner.acceptAll")}</button></div></aside>
  <script id="calculatorMessages" type="application/json">${JSON.stringify({ locale, messages: runtime }).replaceAll("<", "\\u003c")}</script>
  <script src="/js/cookie-consent.js" defer></script>
  <script type="module" src="/js/customs-calculator-page.mjs"></script>
</body>
</html>`;
}

for (const locale of Object.keys(routes)) {
  const target = targetFor(routes[locale]);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html(locale), "utf8");
}
console.log("Generated 3 localized calculator pages.");
