import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { site } from "./seo-config.mjs";
import { t } from "./i18n-catalog.mjs";
import { featureKeyByRussian, localizedCarDetails } from "./car-localization.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data/cars.js"), "utf8"), context);
const cars = context.window.ATLANT_CARS;
const localeCodes = ["pl", "en"];
const localeMeta = {
  pl: { lang: "pl", home: "/pl/", catalogue: "/pl/samochody/", about: "/pl/o-nas/", contact: "/pl/kontakt/" },
  en: { lang: "en", home: "/en/", catalogue: "/en/cars/", about: "/en/about/", contact: "/en/contact/" }
};
const carRoutes = {
  pl: (slug) => `/pl/samochody/${slug}/`,
  en: (slug) => `/en/cars/${slug}/`
};
const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const url = (route) => `${site.origin}${route}`;
const publicPath = (source) => `/${String(source).replace(/^(\.\.\/)+/, "")}`;
const carName = (car) => `${car.brand} ${car.model} ${car.version}`.trim();
const number = (value, locale) => new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB").format(value);
const date = (value, locale) => {
  const monthOnly = /^\d{4}-\d{2}$/.test(value);
  const options = monthOnly ? { month: "long", year: "numeric" } : undefined;
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", options)
    .format(new Date(`${value}${monthOnly ? "-01" : ""}T12:00:00Z`));
};
const targetFor = (route) => route.endsWith("/")
  ? path.join(root, route.slice(1), "index.html")
  : path.join(root, route.slice(1));

function alternates(car) {
  return localeCodes.map((code) =>
    `<link rel="alternate" hreflang="${code}" href="${url(carRoutes[code](car.slug))}">`
  ).concat(`<link rel="alternate" hreflang="x-default" href="${url(carRoutes.pl(car.slug))}">`).join("\n  ");
}

function languageNav(car, current) {
  return localeCodes.map((code) =>
    `<a href="${carRoutes[code](car.slug)}" lang="${code}"${code === current ? ' aria-current="page"' : ""}>${code.toUpperCase()}</a>`
  ).join("");
}

function auctionSourceBadge(car) {
  if (car.auctionSource === "Arval") {
    return `<p><span class="badge static source arval-badge"><img src="/assets/brands/arval.png" alt="Arval" width="108" height="69"></span></p>`;
  }
  if (car.auctionSource === "Automotive Trade Center") {
    return `<p><span class="badge static source atc-badge"><img src="/assets/brands/automotive-trade-center.png" alt="Automotive Trade Center" width="858" height="123"></span></p>`;
  }
  return "";
}

function price(car, locale) {
  if (car.priceOnRequest || car.price == null) return t(locale, "common.priceOnRequest");
  const formatted = new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    style: "currency", currency: car.currency, maximumFractionDigits: 0
  }).format(car.price);
  return formatted;
}

function localizedValue(value, locale) {
  if (typeof value === "string") return t(locale, value);
  return value[locale];
}

function specs(car, locale) {
  const localized = localizedCarDetails[car.slug];
  const rows = [
    car.firstRegistrationDate
      ? ["vehicle.field.firstRegistration", date(car.firstRegistrationDate, locale)]
      : ["vehicle.field.productionYear", car.productionDate],
    ["vehicle.field.mileage", `${number(car.mileageKm, locale)} ${t(locale, "vehicle.unit.kilometres")}`],
    ["vehicle.field.body", t(locale, localized.bodyKey)],
    ["vehicle.field.color", localized.color[locale]],
    ["vehicle.field.doors", car.doors],
    ["vehicle.field.seats", car.seats],
    ["vehicle.field.registrationNumber", car.registrationNumber],
    ["vehicle.field.registrationCountry", localized.registrationCountryKey ? t(locale, localized.registrationCountryKey) : car.registrationCountry],
    ["vehicle.field.keys", car.keysCount],
    ["vehicle.field.source", localized.sourceKey ? t(locale, localized.sourceKey) : car.vehicleSource],
    ["vehicle.field.fuel", t(locale, `vehicle.fuel.${car.fuelType}`)],
    ["vehicle.field.engineCapacity", `${number(car.engineCapacityCc, locale)} ${t(locale, "vehicle.unit.cubicCentimetres")}`],
    ["vehicle.field.power", car.powerHp == null ? null : `${car.powerHp} ${t(locale, "vehicle.unit.horsepower")}`],
    ["vehicle.field.transmission", t(locale, `vehicle.transmission.${car.transmission}`)],
    ["vehicle.field.drive", t(locale, car.driveType === "Полный" ? "vehicle.drive.all" : "vehicle.drive.front")],
    ["vehicle.field.emissionStandard", car.emissionStandard]
  ];
  return rows.filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => `<div><dt>${t(locale, label)}</dt><dd>${esc(value)}</dd></div>`).join("");
}

function equipment(car, locale) {
  return Object.entries(car.equipment).map(([group, items]) => {
    const list = items.map((item) => {
      const key = featureKeyByRussian.get(item);
      if (!key) throw new Error(`Missing semantic feature key for "${item}" (${car.slug})`);
      return `<li>${t(locale, key)}</li>`;
    }).join("");
    return `<div class="equipment-group"><h3>${t(locale, `vehicle.equipmentGroup.${group}`)}</h3><ul>${list}</ul></div>`;
  }).join("");
}

function service(car, locale) {
  const details = localizedCarDetails[car.slug];
  if (!car.serviceHistory?.length) return `<p>${t(locale, car.slug.startsWith("ford-") ? "vehicle.ford.service.unavailable" : "vehicle.service.unavailable")}</p>`;
  if (details.serviceKeys.length !== car.serviceHistory.length) throw new Error(`Service translation count mismatch: ${car.slug}`);
  return `<ol class="timeline service-list">${car.serviceHistory.map((item, index) => {
    const mileage = item.mileageKm == null ? "" : ` · ${number(item.mileageKm, locale)} ${t(locale, "vehicle.unit.kilometres")}`;
    return `<li><strong>${date(item.date, locale)}${mileage}</strong><p>${t(locale, details.serviceKeys[index])}</p></li>`;
  }).join("")}</ol>`;
}

function condition(car, locale) {
  const items = localizedCarDetails[car.slug]?.condition;
  if (!items) throw new Error(`Missing localized condition: ${car.slug}`);
  return `<dl class="detail-grid condition-list">${items.map(([label, value]) => {
    const displayedValue = car.status === "sold" && label === "vehicle.condition.location"
      ? "vehicle.location.recentlySold"
      : value;
    return `<div><dt>${t(locale, label)}</dt><dd>${esc(localizedValue(displayedValue, locale))}</dd></div>`;
  }).join("")}</dl>`;
}

function documents(car, locale) {
  return `<p>${t(locale, "common.notAvailable")}</p>`;
}

function gallery(car, locale) {
  const name = carName(car);
  return `<div class="car-gallery">
    <img id="mainCarImage" class="car-gallery-main car-main-image" src="${publicPath(car.mainImage)}" width="1200" height="900" alt="${esc(t(locale, "vehicle.gallery.mainAlt", { vehicle: name }))}">
    <div class="car-thumbs car-thumbnails">${car.images.map((image, index) =>
      `<button type="button" data-image="${publicPath(image)}" aria-label="${esc(t(locale, "vehicle.gallery.photoAlt", { vehicle: name, number: index + 1 }))}"><img src="${publicPath(image)}" width="180" height="135" loading="lazy" alt="${esc(t(locale, "vehicle.gallery.photoAlt", { vehicle: name, number: index + 1 }))}"></button>`
    ).join("")}</div>
  </div>`;
}

function schema(car, locale) {
  const route = carRoutes[locale](car.slug);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": ["Product", "Vehicle"],
    name: carName(car),
    description: car.description[locale],
    image: car.images.map((image) => url(publicPath(image))),
    url: url(route),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileageKm, unitCode: "KMT" },
    fuelType: t(locale, `vehicle.fuel.${car.fuelType}`),
    vehicleTransmission: t(locale, `vehicle.transmission.${car.transmission}`),
    ...(car.status === "sold" ? {} : { offers: {
      "@type": "Offer",
      availability: car.availability === "in-transit" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      ...(car.price == null ? {} : { price: car.price, priceCurrency: car.currency }),
      seller: { "@type": "AutoDealer", name: site.name, url: site.origin }
    }}),
    inLanguage: locale
  }).replaceAll("<", "\\u003c");
}

function cookieBanner(locale) {
  return `<aside class="cookie-banner" data-cookie-banner hidden>
    <div><strong>${t(locale, "cookie.banner.title")}</strong><p>${t(locale, "cookie.banner.description")}</p></div>
    <div class="cookie-actions"><button class="small-button" type="button" data-cookie-choice="essential">${t(locale, "cookie.banner.acceptEssential")}</button><button class="button primary" type="button" data-cookie-choice="all">${t(locale, "cookie.banner.acceptAll")}</button></div>
  </aside>`;
}

function html(car, locale) {
  const meta = localeMeta[locale];
  const name = carName(car);
  const route = carRoutes[locale](car.slug);
  const statusKey = car.status === "sold"
    ? "vehicle.status.recentlySold"
    : car.availability === "in-transit"
      ? "vehicle.status.inTransit"
      : car.availability === "on-site"
        ? "vehicle.status.onSite"
        : "vehicle.status.forSale";
  const statusLabel = t(locale, statusKey);
  const titleDetail = car.status === "sold"
    ? t(locale, "vehicle.seo.soldSuffix")
    : car.availability === "in-transit"
      ? t(locale, "vehicle.seo.inTransitSuffix")
      : car.availability === "on-site"
        ? `${number(car.mileageKm, locale)} ${t(locale, "vehicle.unit.kilometres")} · ${statusLabel}`
        : t(locale, "vehicle.seo.offerSuffix");
  const title = `${name} — ${titleDetail} | Atlant Auto`;
  const description = car.description[locale];
  return `<!doctype html>
<html lang="${meta.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url(route)}">
  ${alternates(car)}
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url(route)}">
  <meta property="og:image" content="${url(publicPath(car.mainImage))}">
  <link rel="stylesheet" href="/styles.css?v=20260816-2">
  <script type="application/ld+json">${schema(car, locale)}</script>
</head>
<body class="car-page">
  <header class="topbar">
    <a class="brand" href="${meta.home}" aria-label="Atlant Auto"><span class="brand-wordmark"><img src="/assets/site/atlant-auto-wordmark.svg" alt="Atlant Auto" width="720" height="150"></span></a>
    <nav class="nav" aria-label="${t(locale, "navigation.primary.label")}"><a href="${meta.catalogue}">${t(locale, "navigation.catalog")}</a><a href="${meta.home}#pricing">${t(locale, "navigation.services")}</a><a href="${meta.about}">${t(locale, "navigation.about")}</a><a href="${meta.contact}">${t(locale, "navigation.contact")}</a></nav>
    <div class="language-nav" aria-label="${t(locale, "language.selector.label")}">${languageNav(car, locale)}</div>
  </header>
  <main class="car-page-main">
    <nav class="breadcrumbs" aria-label="${t(locale, "navigation.breadcrumb.label")}"><a href="${meta.home}">${t(locale, "navigation.home")}</a><span>/</span><a href="${meta.catalogue}">${t(locale, "navigation.catalog")}</a><span>/</span><span>${esc(name)}</span></nav>
    <section class="car-hero">
      ${gallery(car, locale)}
      <div class="car-summary"><p class="eyebrow">${statusLabel}</p>${auctionSourceBadge(car)}<h1>${esc(name)}</h1><p class="detail-price">${esc(price(car, locale))}</p><p>${esc(description)}</p><p class="condition-disclaimer">${t(locale, "vehicle.condition.reportLimitations")}</p>${car.status === "sold" ? `<a class="button primary" href="${meta.catalogue}">${t(locale, "navigation.backToCatalog")}</a>` : `<a class="button primary" href="${meta.contact}">${t(locale, "action.requestQuote")}</a>`}</div>
    </section>
    <section class="car-section"><h2>${t(locale, "vehicle.section.specifications")}</h2><dl class="detail-grid spec-grid">${specs(car, locale)}</dl></section>
    <section class="car-section"><h2>${t(locale, "vehicle.section.equipment")}</h2><div class="equipment-grid">${equipment(car, locale)}</div></section>
    <section class="car-section"><h2>${t(locale, "vehicle.section.service")}</h2>${service(car, locale)}</section>
    <section class="car-section"><h2>${t(locale, "vehicle.section.condition")}</h2>${condition(car, locale)}</section>
    <section class="car-section"><h2>${t(locale, "vehicle.section.documents")}</h2>${documents(car, locale)}</section>
    <p class="catalogue-back"><a class="text-link" href="${meta.catalogue}">${t(locale, "navigation.backToCatalog")}</a></p>
  </main>
  <footer class="footer"><div><a class="brand footer-brand" href="${meta.home}" aria-label="Atlant Auto"><span class="brand-wordmark"><img src="/assets/site/atlant-auto-wordmark.svg" alt="Atlant Auto" width="720" height="150"></span></a><p>${t(locale, "footer.tagline")}</p><p>${site.legalName} · NIP ${site.nip}</p></div><address><a href="tel:+48515392420">${site.phone}</a><a href="mailto:${site.email}">${site.email}</a><span>${site.vehicleLotAddress}</span><a href="${meta.about}">${t(locale, "footer.companyInfo")}</a></address></footer>
  ${cookieBanner(locale)}
  <script src="/js/cookie-consent.js?v=20260719-2" defer></script>
  <script>document.querySelectorAll("[data-image]").forEach((button) => button.addEventListener("click", () => { const image = document.querySelector("#mainCarImage"); if (image) image.src = button.dataset.image; }));</script>
</body>
</html>`;
}

const generated = [];
for (const car of cars) {
  for (const locale of localeCodes) {
    const route = carRoutes[locale](car.slug);
    const target = targetFor(route);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html(car, locale), "utf8");
    generated.push(route);
  }
}

fs.writeFileSync(path.join(root, "vehicle-pages.json"), JSON.stringify(generated, null, 2), "utf8");
console.log(`Generated ${generated.length} localized vehicle pages.`);
