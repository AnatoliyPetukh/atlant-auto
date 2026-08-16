import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { equivalents, locales, pages, site } from "./seo-config.mjs";
import { t } from "./i18n-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const absolute = (route) => `${site.origin}${route}`;
const outputPath = (route) => route === "/" ? path.join(root, "index.html") : path.join(root, route.slice(1), "index.html");

function alternates(key) {
  return Object.entries(equivalents[key]).map(([lang, route]) =>
    `<link rel="alternate" hreflang="${lang}" href="${absolute(route)}">`
  ).concat(`<link rel="alternate" hreflang="x-default" href="${absolute(equivalents[key].pl)}">`).join("\n  ");
}

function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${site.origin}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: site.origin,
    telephone: site.phone,
    email: site.email,
    taxID: site.nip,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Zygmunta Vogla 28 lok. 02.42",
      postalCode: "02-963",
      addressLocality: "Warszawa",
      addressCountry: "PL"
    },
    sameAs: [site.telegram]
  };
}

function dealerSchema() {
  return {
    "@type": "AutoDealer",
    "@id": `${site.origin}/#dealer`,
    name: site.name,
    url: site.origin,
    telephone: site.phone,
    email: site.email,
    parentOrganization: { "@id": `${site.origin}/#organization` },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Wielkiego Dębu 6",
      postalCode: "03-262",
      addressLocality: "Warszawa",
      addressCountry: "PL"
    }
  };
}

function schema(page, locale) {
  const [key, route] = page;
  const localeCode = locale.lang;
  const h1 = t(localeCode, `page.${key}.h1`);
  const graph = [
    organizationSchema(),
    dealerSchema(),
    {
      "@type": "WebSite",
      "@id": `${site.origin}/#website`,
      url: site.origin,
      name: site.name,
      publisher: { "@id": `${site.origin}/#organization` },
      inLanguage: locale.lang
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t(localeCode, "navigation.home"), item: absolute(locale.home) },
        { "@type": "ListItem", position: 2, name: h1, item: absolute(route) }
      ]
    }
  ];
  if (key === "faq") {
    const questions = Array.from({ length: 10 }, (_, index) => ({
      question: t(localeCode, `faq.item${index + 1}.question`),
      answer: t(localeCode, `faq.item${index + 1}.answer`)
    }));
    graph.push({
      "@type": "FAQPage",
      mainEntity: questions.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer
        }
      }))
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

function nav(locale) {
  const items = [
    ["navigation.catalog", locale.routes[0]],
    ["navigation.services", `${locale.home}#pricing`],
    ["navigation.process", locale.routes[1]],
    ["navigation.about", locale.routes[3]],
    ["navigation.contact", locale.routes[4]]
  ];
  return items.map(([key, route]) => `<a href="${route}">${t(locale.lang, key)}</a>`).join("");
}

function languageNav(current) {
  return Object.entries(locales).map(([code, locale]) =>
    `<a href="${locale.home}" lang="${code}"${code === current ? ' aria-current="page"' : ""}>${code.toUpperCase()}</a>`
  ).join("");
}

function pageHtml(page, localeCode) {
  const locale = locales[localeCode];
  const [key, route, , , , , cards] = page;
  const title = t(localeCode, `page.${key}.title`);
  const description = t(localeCode, `page.${key}.description`);
  const h1 = t(localeCode, `page.${key}.h1`);
  const intro = t(localeCode, `page.${key}.intro`);
  const localizedCards = cards.map((_, index) => t(localeCode, `page.${key}.card.${index + 1}`));
  const isHome = key === "home";
  const contactAction = locale.routes[4];
  const catalogue = locale.routes[0];
  const vehiclePrefix = localeCode === "pl" ? "/pl/samochody/" : "/en/cars/";
  const vehicleSuffix = "/";
  const linkedVehicleSlugs = key === "cars"
      ? [
        "kia-sportage-gt-line-4wd-2022-68234",
        "seat-arona-style-business-2022-204417",
        "peugeot-408-gt-2023-127024",
        "peugeot-408-allure-2023-157570",
        "bmw-116d-business-advantage-2022",
        "renault-megane-sporter-equilibre-2022",
        "bmw-216d-gran-tourer-2022",
        "bmw-x1-sdrive16d-2021",
        "ford-focus-wagon-1-0-ecoboost-st-line-x-business-2022",
        "peugeot-308-sw-allure-2023",
        "peugeot-408-allure-2023",
        "mercedes-benz-cla-180-amg-line-2023"
      ]
    : key === "cases"
      ? ["bmw-216d-gran-tourer-2022", "bmw-x1-sdrive16d-2021", "ford-focus-wagon-1-0-ecoboost-st-line-x-business-2022"]
      : null;
  const cardLinks = linkedVehicleSlugs?.map((slug) => `${vehiclePrefix}${slug}${vehicleSuffix}`) || null;
  const cardsHtml = localizedCards.map((card, index) => {
    const cardText = key === "about" ? t(localeCode, `company.about.cardText${index + 1}`) : intro;
    return `<article class="topic-card"><span>0${index + 1}</span><h2>${esc(card)}</h2><p>${esc(cardText)}</p>${cardLinks ? `<a class="text-link" href="${cardLinks[index]}">${t(localeCode, "topic.cards.viewVehicle")}</a>` : ""}</article>`;
  }).join("");
  const cardsSection = key === "faq" ? "" : `<section class="content-section topic-grid">${cardsHtml}</section>`;
  const faq = key === "faq" ? `<section class="content-section faq faq-page">${Array.from({ length: 10 }, (_, index) => `<details${index === 0 ? " open" : ""}><summary>${esc(t(localeCode, `faq.item${index + 1}.question`))}</summary><p>${esc(t(localeCode, `faq.item${index + 1}.answer`))}</p></details>`).join("")}</section>` : "";
  const about = key === "about" ? `<section class="content-section company-details" aria-labelledby="official-company-heading">
      <div class="official-panel">
        <div><p class="eyebrow">${t(localeCode, "company.official.heading")}</p><h2 id="official-company-heading">${site.legalName}</h2><p>${t(localeCode, "company.official.intro")}</p></div>
        <dl class="official-data">
          <div><dt>${t(localeCode, "company.official.legalName")}</dt><dd>${site.legalName}</dd></div>
          <div><dt>NIP</dt><dd>${site.nip}</dd></div>
          <div><dt>KRS</dt><dd>${site.krs}</dd></div>
          <div><dt>REGON</dt><dd>${site.regon}</dd></div>
        </dl>
        <a class="text-link" href="${site.krsSearch}" target="_blank" rel="noopener noreferrer">${t(localeCode, "company.official.registryLink")}</a>
      </div>
      <div class="locations-heading"><p class="eyebrow">Atlant Auto · Warszawa</p><h2>${t(localeCode, "company.locations.heading")}</h2><p>${t(localeCode, "company.locations.intro")}</p></div>
      <div class="location-grid">
        <article class="location-card"><span class="location-label">01</span><h3>${t(localeCode, "company.location.office")}</h3><address>${site.registeredAddress}</address><p>${t(localeCode, "company.location.officeNote")}</p><a class="button ghost dark" href="${site.officeMap}" target="_blank" rel="noopener noreferrer">${t(localeCode, "company.location.openMap")}</a></article>
        <article class="location-card"><span class="location-label">02</span><h3>${t(localeCode, "company.location.lot")}</h3><address>${site.vehicleLotAddress}</address><p>${t(localeCode, "company.location.lotNote")}</p><a class="button ghost dark" href="${site.vehicleLotMap}" target="_blank" rel="noopener noreferrer">${t(localeCode, "company.location.openMap")}</a></article>
      </div>
      <div class="company-contact"><div><h2>${t(localeCode, "company.contact.heading")}</h2><p>${t(localeCode, "company.contact.intro")}</p></div><div><a href="tel:+48515392420">${site.phone}</a><a href="mailto:${site.email}">${site.email}</a></div></div>
    </section>` : "";
  return `<!doctype html>
<html lang="${locale.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${absolute(route)}">
  ${alternates(key)}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${absolute(route)}">
  <meta property="og:image" content="${site.origin}/assets/cars/bmw-x1-sdrive16d-2021/photo_6_2026-07-19_12-41-08.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${schema(page, locale)}</script>
</head>
<body class="content-page page-${key}">
  <header class="topbar">
    <a class="brand" href="${locale.home}" aria-label="Atlant Auto"><span class="brand-wordmark"><img src="/assets/site/atlant-auto-wordmark.svg" alt="Atlant Auto" width="720" height="150"></span></a>
    <nav class="nav" aria-label="${t(localeCode, "navigation.primary.label")}">${nav(locale)}</nav>
    <div class="language-nav" aria-label="${t(localeCode, "language.selector.label")}">${languageNav(localeCode)}</div>
  </header>
  <main>
    <nav class="breadcrumbs" aria-label="${t(localeCode, "navigation.breadcrumb.label")}"><a href="${locale.home}">${t(localeCode, "navigation.home")}</a><span aria-hidden="true">/</span><span>${esc(h1)}</span></nav>
    <section class="content-hero${isHome ? " content-hero-home" : ""}">
      <p class="eyebrow">${t(localeCode, "locale.eyebrow")}</p>
      <h1>${esc(h1)}</h1>
      <p class="lead">${esc(intro)}</p>
      <div class="hero-actions"><a class="button primary" href="${contactAction}">${t(localeCode, "action.discussCar")}</a><a class="button ghost dark" href="${catalogue}">${t(localeCode, "navigation.catalog")}</a></div>
    </section>
${cardsSection}
${about}
${faq}
    <section class="content-section seo-copy">
      <h2>${t(localeCode, "topic.proof.heading")}</h2>
      <p>${esc(intro)} ${t(localeCode, "topic.proof.disclaimer")}</p>
      <p><a class="text-link" href="${locale.routes[1]}">${t(localeCode, "navigation.process")}</a> · <a class="text-link" href="${locale.routes[3]}">${t(localeCode, "navigation.about")}</a> · <a class="text-link" href="${locale.routes[4]}">${t(localeCode, "navigation.contact")}</a></p>
    </section>
  </main>
  <footer class="footer">
    <div><a class="brand footer-brand" href="${locale.home}" aria-label="Atlant Auto"><span class="brand-wordmark"><img src="/assets/site/atlant-auto-wordmark.svg" alt="Atlant Auto" width="720" height="150"></span></a><p>${t(localeCode, "footer.tagline")}</p><p>NIP ${site.nip}</p></div>
    <address><a href="tel:+48515392420">${site.phone}</a><a href="mailto:${site.email}">${site.email}</a><a href="${site.telegram}">${t(localeCode, "common.telegram")}</a><span>${site.vehicleLotAddress}</span><a href="${locale.routes[3]}">${t(localeCode, "footer.companyInfo")}</a><a href="${localeCode === "pl" ? "/pl/polityka-prywatnosci/" : "/en/privacy/"}">${t(localeCode, "footer.privacy")}</a></address>
  </footer>
  <aside class="cookie-banner" data-cookie-banner hidden>
    <div><strong>${t(localeCode, "cookie.banner.title")}</strong><p>${t(localeCode, "cookie.banner.description")}</p></div>
    <div class="cookie-actions"><button class="small-button" type="button" data-cookie-choice="essential">${t(localeCode, "cookie.banner.acceptEssential")}</button><button class="button primary" type="button" data-cookie-choice="all">${t(localeCode, "cookie.banner.acceptAll")}</button></div>
  </aside>
  <script src="/js/cookie-consent.js" defer></script>
</body>
</html>`;
}

const generated = [];
for (const [localeCode, localePages] of Object.entries(pages)) {
  for (const page of localePages) {
    if (page[0] === "home") continue;
    const target = outputPath(page[1]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, pageHtml(page, localeCode), "utf8");
    generated.push(page[1]);
  }
}

const vehicleRoutesFile = path.join(root, "vehicle-pages.json");
const vehicleRoutes = fs.existsSync(vehicleRoutesFile) ? JSON.parse(fs.readFileSync(vehicleRoutesFile, "utf8")) : [];
const sitemapRoutes = [
  "/pl/",
  "/en/",
  ...generated,
  ...vehicleRoutes
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => `  <url><loc>${absolute(route)}</loc></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`, "utf8");
fs.writeFileSync(path.join(root, "seo-pages.json"), JSON.stringify({ generatedAt: new Date().toISOString(), pages: sitemapRoutes }, null, 2), "utf8");
console.log(`Generated ${generated.length} localized pages plus sitemap and robots.txt.`);
