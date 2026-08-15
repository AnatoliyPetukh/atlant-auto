import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { t } from "./i18n-catalog.mjs";
import { site } from "./seo-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data/cars.js"), "utf8"), context);
const cars = context.window.ATLANT_CARS;
const catalogueCounts = { available: 14, onSite: 8, inTransit: 24, sold: 11 };
const routes = { pl: "/pl/", en: "/en/" };
const catalogue = { pl: "/pl/samochody/", en: "/en/cars/" };
const process = { pl: "/pl/jak-dzialamy/", en: "/en/how-it-works/" };
const contact = { pl: "/pl/kontakt/", en: "/en/contact/" };
const about = { pl: "/pl/o-nas/", en: "/en/about/" };
const privacy = { pl: "/pl/polityka-prywatnosci/", en: "/en/privacy/" };
const carRoute = (locale, slug) => locale === "pl" ? `/pl/samochody/${slug}/` : `/en/cars/${slug}/`;
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const format = (value, locale) => new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB").format(value);
const output = (locale) => path.join(root, locale, "index.html");

function statusKey(car) {
  if (car.status === "sold") return "vehicle.status.recentlySold";
  if (car.availability === "in-transit") return "vehicle.status.inTransit";
  if (car.availability === "on-site") return "vehicle.status.onSite";
  return "vehicle.status.forSale";
}

function carCards(locale) {
  return cars.map((car) => {
    const name = `${car.brand} ${car.model} ${car.version}`;
    const basePrice = car.price == null ? t(locale, "common.priceOnRequest") : `${format(car.price, locale)} ${car.currency}`;
    const price = basePrice;
    const year = car.productionDate || car.firstRegistrationDate?.slice(0,4) || "";
    const transmission = t(locale, `vehicle.transmission.${car.transmission}`);
    const detailUrl = carRoute(locale, car.slug);
    const sold = car.status === "sold";
    const statusLabel = t(locale, statusKey(car));
    const sourceBadge = car.auctionSource === "Arval" ? `<span class="badge source arval-badge"><img src="/assets/brands/arval.png" alt="Arval" width="108" height="69"></span>` : "";
    return `<article class="car-card" data-status="${sold ? "sold" : "available"}"><a class="car-card-link" href="${detailUrl}" aria-label="${esc(t(locale, "action.viewVehicle"))}: ${esc(name)}">
      <div class="car-media"><img src="/${car.mainImage.replace(/^(\.\.\/)+/, "")}" alt="${esc(t(locale, "vehicle.gallery.mainAlt", { vehicle: name }))}" width="1280" height="960" loading="lazy"><div class="car-badges"><span class="badge${sold ? " sold" : ""}">${statusLabel}</span>${sourceBadge}</div></div>
      <div class="car-body"><h3>${esc(name)}</h3><div class="compact-specs"><div><span>${year}</span><span>${t(locale, `vehicle.fuel.${car.fuelType}`)}</span><span>${transmission}</span></div><div><span>${format(car.mileageKm, locale)} ${t(locale, "vehicle.unit.kilometres")}</span><span>${format(car.engineCapacityCc, locale)} ${t(locale, "vehicle.unit.cubicCentimetres")}</span></div></div><div class="price-row"><span class="price-block"><span class="price">${esc(price)}</span></span><span class="small-button">${t(locale, "action.viewVehicle")}</span></div></div>
    </a></article>`;
  }).join("");
}

function html(locale) {
  const alternates = Object.entries(routes).map(([code, route]) => `<link rel="alternate" hreflang="${code}" href="${site.origin}${route}">`).concat(`<link rel="alternate" hreflang="x-default" href="${site.origin}/pl/">`).join("\n  ");
  const languageNav = Object.entries(routes).map(([code, route]) => `<a href="${route}" lang="${code}"${code === locale ? ' aria-current="page"' : ""}>${code.toUpperCase()}</a>`).join("");
  const processSteps = [1,2,3,4,5].map((index) => `<li${index === 3 ? ' class="featured"' : ""}><span class="process-marker">0${index}</span><article class="process-card"><small>${t(locale, `home.process.step${index}.tag`)}</small><h3>${t(locale, `home.process.step${index}.title`)}</h3><p>${t(locale, `home.process.step${index}.text`)}</p></article></li>`).join("");
  const advantages = [1,2,3,4,5,6].map((index) => `<article class="advantage-card"><span class="advantage-number">0${index}</span><h3>${t(locale, `home.advantages.item${index}.title`)}</h3><p>${t(locale, `home.advantages.item${index}.text`)}</p></article>`).join("");
  const numberCards = Object.entries(catalogueCounts).map(([key, value]) => `<div class="number-card"><strong>${value}</strong><span>${t(locale, `home.numbers.${key}`)}</span></div>`).join("");
  const pricingItems = (packageName, count) => Array.from({ length: count }, (_, index) => `<li>${t(locale, `home.pricing.${packageName}.item${index + 1}`)}</li>`).join("");
  const pricingCards = [
    { key: "base", price: "500 €", items: 6 },
    { key: "inspection", price: "750 €", items: 5 }
  ].map(({ key, price, items }) => `<article class="pricing-card${key === "inspection" ? " featured" : ""}"><span class="pricing-label">${t(locale, `home.pricing.${key}.label`)}</span><h3>${t(locale, `home.pricing.${key}.title`)}</h3><strong class="service-price">${price}</strong><p class="pricing-description">${t(locale, `home.pricing.${key}.description`)}</p><ul>${pricingItems(key, items)}</ul><p class="pricing-note">${t(locale, `home.pricing.${key}.note`)}</p><a class="button ${key === "inspection" ? "primary" : "secondary"}" href="#request" data-service-package="${key}">${t(locale, "home.pricing.cta")}</a></article>`).join("");
  const faq = [1,2,3,4].map((index) => `<details${index === 1 ? " open" : ""}><summary>${t(locale, `home.faq.q${index}`)}</summary><p>${t(locale, `home.faq.a${index}`)}</p></details>`).join("");
  const companySchema = {"@context":"https://schema.org","@graph":[
    {"@type":"Organization","@id":`${site.origin}/#organization`,name:site.name,legalName:site.legalName,url:site.origin,telephone:site.phone,email:site.email,taxID:site.nip,address:{"@type":"PostalAddress",streetAddress:"Zygmunta Vogla 28 lok. 02.42",postalCode:"02-963",addressLocality:"Warszawa",addressCountry:"PL"}},
    {"@type":"AutoDealer","@id":`${site.origin}/#dealer`,name:site.name,url:site.origin,telephone:site.phone,email:site.email,parentOrganization:{"@id":`${site.origin}/#organization`},address:{"@type":"PostalAddress",streetAddress:"Wielkiego Dębu 6",postalCode:"03-262",addressLocality:"Warszawa",addressCountry:"PL"}}
  ]};
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t(locale, "home.seo.title")}</title><meta name="description" content="${t(locale, "home.seo.description")}">
  <link rel="canonical" href="${site.origin}${routes[locale]}">${alternates}
  <meta property="og:type" content="website"><meta property="og:site_name" content="${site.name}"><meta property="og:title" content="${t(locale, "home.seo.title")}"><meta property="og:description" content="${t(locale, "home.seo.description")}"><meta property="og:url" content="${site.origin}${routes[locale]}">
  <link rel="stylesheet" href="/styles.css?v=20260719-2">
  <script type="application/ld+json">${JSON.stringify(companySchema).replaceAll("<","\\u003c")}</script>
</head>
<body>
  <header class="topbar"><a class="brand" href="${routes[locale]}" aria-label="Atlant Auto"><span class="brand-mark">AA</span><span><strong>Atlant Auto</strong><small>Warszawa</small></span></a><nav class="nav" aria-label="${t(locale, "navigation.primary.label")}"><a href="${catalogue[locale]}">${t(locale, "navigation.catalog")}</a><a href="#pricing">${t(locale, "navigation.services")}</a><a href="${process[locale]}">${t(locale, "navigation.process")}</a><a href="${about[locale]}">${t(locale, "navigation.about")}</a><a href="${contact[locale]}">${t(locale, "navigation.contact")}</a></nav><div class="language-nav" aria-label="${t(locale, "language.selector.label")}">${languageNav}</div></header>
  <main>
    <section class="hero"><div class="hero-bg" role="img" aria-label="${t(locale, "home.hero.imageAlt")}"></div><div class="hero-overlay"></div><div class="hero-content"><p class="eyebrow">${t(locale, "home.hero.eyebrow")}</p><h1>${t(locale, "home.hero.title")}</h1><p class="lead">${t(locale, "home.hero.subtitle")}</p><div class="hero-actions"><a class="button primary" href="#request">${t(locale, "home.hero.cta")}</a><a class="button ghost" href="#cars">${t(locale, "home.hero.secondaryCta")}</a></div></div></section>
    <section class="section trust-band"><div><strong>${t(locale, "home.trust.companyTitle")}</strong><span>${t(locale, "home.trust.companyText")}</span></div><div><strong>${t(locale, "home.trust.checkTitle")}</strong><span>${t(locale, "home.trust.checkText")}</span></div><div><strong>${t(locale, "home.trust.supportTitle")}</strong><span>${t(locale, "home.trust.supportText")}</span></div></section>
    <section class="section numbers-section" id="numbers"><header class="numbers-head"><div><p class="eyebrow">${t(locale, "home.numbers.eyebrow")}</p><h2>${t(locale, "home.numbers.title")}</h2></div><p>${t(locale, "home.numbers.intro")}</p></header><div class="numbers-grid">${numberCards}</div></section>
    <section class="section cars-section" id="cars"><div class="section-head"><div><p class="eyebrow">${t(locale, "home.catalog.eyebrow")}</p><h2>${t(locale, "home.catalog.title")}</h2></div><div class="filters" aria-label="${t(locale, "home.catalog.filterLabel")}"><button class="filter active" data-filter="all">${t(locale, "home.catalog.filterAll")}</button><button class="filter" data-filter="available">${t(locale, "home.catalog.filterAvailable")}</button><button class="filter" data-filter="sold">${t(locale, "home.catalog.filterSold")}</button></div></div><div class="cars-grid" id="carsGrid">${carCards(locale)}</div><p class="empty-state" data-empty-state hidden>${t(locale, "empty.cars")}</p></section>
    <section class="section process-showcase" id="process"><header class="process-intro"><div><p class="eyebrow">${t(locale, "home.process.eyebrow")}</p><h2>${t(locale, "home.process.title")}</h2></div><div><p class="section-text">${t(locale, "home.process.intro")}</p><a class="text-link" href="${process[locale]}">${t(locale, "home.process.more")}</a></div></header><ol class="process-roadmap">${processSteps}</ol></section>
    <section class="advantages-section" id="advantages"><div class="advantages-inner"><header class="advantages-head"><p class="eyebrow">${t(locale, "home.advantages.eyebrow")}</p><h2>${t(locale, "home.advantages.title")}</h2><p>${t(locale, "home.advantages.intro")}</p></header><div class="advantages-grid">${advantages}</div></div></section>
    <section class="section pricing-section" id="pricing"><header class="pricing-head"><p class="eyebrow">${t(locale, "home.pricing.eyebrow")}</p><h2>${t(locale, "home.pricing.title")}</h2><p>${t(locale, "home.pricing.intro")}</p></header><div class="pricing-grid">${pricingCards}</div></section>
    <section class="section audience"><article><p class="eyebrow">${t(locale, "home.audience.privateEyebrow")}</p><h3>${t(locale, "home.audience.privateTitle")}</h3><p>${t(locale, "home.audience.privateText")}</p></article><article><p class="eyebrow">${t(locale, "home.audience.businessEyebrow")}</p><h3>${t(locale, "home.audience.businessTitle")}</h3><p>${t(locale, "home.audience.businessText")}</p></article></section>
    <section class="section proof" id="proof"><div class="section-head"><div><p class="eyebrow">${t(locale, "home.reviews.eyebrow")}</p><h2>${t(locale, "home.reviews.title")}</h2></div><a class="text-link" href="https://search.google.com/local/reviews?placeid=ChIJoYSF3kXJHkcR2H5scCwjHDA">${t(locale, "home.reviews.google")}</a></div><div class="reviews-widget" aria-label="${t(locale, "home.reviews.title")}"><div class="sk-ww-google-reviews" data-embed-id="25670143"></div></div><script src="https://widgets.sociablekit.com/google-reviews/widget.js" defer></script></section>
    <section class="section split faq-section" id="faq"><div><p class="eyebrow">FAQ</p><h2>${t(locale, "home.faq.title")}</h2></div><div class="faq">${faq}</div></section>
    <section class="section request" id="request"><div><p class="eyebrow">${t(locale, "home.form.eyebrow")}</p><h2>${t(locale, "home.form.title")}</h2><p class="section-text">${t(locale, "home.form.intro")}</p></div><form class="request-form" data-success="${t(locale, "notifications.requestSent")}" data-recipient="${site.email}" data-subject="${t(locale, "home.form.emailSubject")}" data-label-name="${t(locale, "home.form.name")}" data-label-contact="${t(locale, "home.form.contact")}" data-label-service="${t(locale, "home.form.service")}" data-label-budget="${t(locale, "home.form.budget")}" data-label-message="${t(locale, "home.form.message")}"><label>${t(locale, "home.form.name")}<input name="name" autocomplete="name" placeholder="${t(locale, "home.form.namePlaceholder")}"></label><label>${t(locale, "home.form.contact")}<input name="contact" placeholder="${t(locale, "home.form.contactPlaceholder")}" required></label><label>${t(locale, "home.form.service")}<select name="service"><option value="general">${t(locale, "home.form.serviceGeneral")}</option><option value="base">${t(locale, "home.form.serviceBase")}</option><option value="inspection">${t(locale, "home.form.serviceInspection")}</option></select></label><label>${t(locale, "home.form.budget")}<input name="budget" placeholder="${t(locale, "home.form.budgetPlaceholder")}"></label><label class="wide">${t(locale, "home.form.message")}<textarea name="message" rows="4" placeholder="${t(locale, "home.form.messagePlaceholder")}"></textarea></label><button class="button primary" type="submit">${t(locale, "home.form.submit")}</button><p class="form-note" aria-live="polite"></p></form></section>
    <section class="route-section" id="route"><div class="route-inner"><div class="route-copy"><p class="eyebrow">${t(locale, "home.location.eyebrow")}</p><h2>${t(locale, "home.location.title")}</h2><p>${t(locale, "home.location.intro")}</p><address>${site.vehicleLotAddress}</address><a class="button primary" href="${site.vehicleLotMap}" target="_blank" rel="noopener noreferrer">${t(locale, "home.location.cta")}</a></div><div class="route-map"><iframe title="${t(locale, "home.location.mapTitle")}" src="https://www.google.com/maps?q=Wielkiego%20D%C4%99bu%206%2C%2003-262%20Warszawa&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div></section>
  </main>
  <footer class="footer"><div><strong>Atlant Auto</strong><p>${t(locale, "footer.tagline")}</p><p>${site.legalName} · NIP ${site.nip}</p></div><address><a href="tel:+48515392420">${site.phone}</a><a href="mailto:${site.email}">${site.email}</a><a href="${site.telegram}">Telegram</a><span>${site.vehicleLotAddress}</span><a href="${about[locale]}">${t(locale, "footer.companyInfo")}</a><a href="${privacy[locale]}">${t(locale, "footer.privacy")}</a></address></footer>
  <aside class="cookie-banner" data-cookie-banner hidden><div><strong>${t(locale, "cookie.banner.title")}</strong><p>${t(locale, "cookie.banner.description")}</p></div><div class="cookie-actions"><button class="small-button" type="button" data-cookie-choice="essential">${t(locale, "cookie.banner.acceptEssential")}</button><button class="button primary" type="button" data-cookie-choice="all">${t(locale, "cookie.banner.acceptAll")}</button></div></aside>
  <script src="/app.js?v=20260719-2" defer></script><script src="/js/cookie-consent.js?v=20260719-2" defer></script>
</body></html>`;
}

for (const locale of Object.keys(routes)) fs.writeFileSync(output(locale), html(locale), "utf8");
fs.writeFileSync(path.join(root, "index.html"), `<!doctype html>
<html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Atlant Auto — Warszawa</title><meta name="description" content="Atlant Auto — samochody dostępne w Warszawie.">
<meta name="robots" content="noindex,follow"><link rel="canonical" href="${site.origin}/pl/"><meta http-equiv="refresh" content="0; url=/pl/">
</head><body><p><a href="/pl/">Przejdź do polskiej wersji Atlant Auto</a></p></body></html>`, "utf8");
console.log("Generated Polish and English home pages plus Polish root redirect.");
