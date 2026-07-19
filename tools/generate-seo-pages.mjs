import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { equivalents, locales, pages, site } from "./seo-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const absolute = (route) => `${site.origin}${route}`;
const outputPath = (route) => route === "/" ? path.join(root, "index.html") : path.join(root, route.slice(1), "index.html");

function alternates(key) {
  return Object.entries(equivalents[key]).map(([lang, route]) =>
    `<link rel="alternate" hreflang="${lang}" href="${absolute(route)}">`
  ).concat(`<link rel="alternate" hreflang="x-default" href="${absolute(equivalents[key].ru)}">`).join("\n  ");
}

function organizationSchema() {
  return {
    "@type": ["Organization", "AutoDealer"],
    "@id": `${site.origin}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: site.origin,
    telephone: site.phone,
    email: site.email,
    taxID: site.nip,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Wielkiego Dębu 6",
      postalCode: "03-262",
      addressLocality: "Warszawa",
      addressCountry: "PL"
    },
    sameAs: [site.telegram]
  };
}

function schema(page, locale) {
  const [key, route, title, description, h1] = page;
  const graph = [
    organizationSchema(),
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
        { "@type": "ListItem", position: 1, name: locale.breadcrumb, item: absolute(locale.home) },
        { "@type": "ListItem", position: 2, name: h1, item: absolute(route) }
      ]
    }
  ];
  if (key === "faq") {
    const questions = page[6];
    graph.push({
      "@type": "FAQPage",
      mainEntity: questions.map((question, index) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: locale.lang === "pl"
            ? ["Tak. Zakres kontroli zależy od źródła oferty i dostępnych dokumentów.", "Cena obejmuje auto oraz uzgodnione opłaty, transport i formalności.", "Zakres dokumentów zależy od kraju, sprzedawcy i celu rejestracji."][index]
            : locale.lang === "en"
              ? ["Yes. The scope depends on the seller, listing source and available documents.", "It includes the vehicle and agreed fees, transport and formalities.", "The exact document set depends on the seller country and registration destination."][index]
              : ["Да. Объём проверки зависит от продавца, площадки и доступных документов.", "Она включает автомобиль, согласованные комиссии, доставку и оформление.", "Точный комплект зависит от страны продавца и места регистрации."][index]
        }
      }))
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

function nav(locale) {
  return locale.nav.map((label, index) => `<a href="${locale.routes[index]}">${label}</a>`).join("");
}

function languageNav(current) {
  return Object.entries(locales).map(([code, locale]) =>
    `<a href="${locale.home}" lang="${code}"${code === current ? ' aria-current="page"' : ""}>${code.toUpperCase()}</a>`
  ).join("");
}

function pageHtml(page, localeCode) {
  const locale = locales[localeCode];
  const [key, route, title, description, h1, intro, cards] = page;
  const isHome = key === "home";
  const contactAction = locale.routes[4];
  const catalogue = locale.routes[0];
  const cardLinks = key === "cars" || key === "cases"
    ? ["/cars/bmw-216d-gran-tourer-2022.html", "/cars/bmw-x1-sdrive16d-2021.html", "/cars/ford-focus-wagon-1-0-ecoboost-st-line-x-business-2022.html"]
    : null;
  const cardsHtml = cards.map((card, index) => `<article class="topic-card"><span>0${index + 1}</span><h2>${esc(card)}</h2><p>${esc(intro)}</p>${cardLinks ? `<a class="text-link" href="${cardLinks[index]}">${localeCode === "pl" ? "Zobacz samochód" : localeCode === "en" ? "View vehicle" : "Смотреть автомобиль"}</a>` : ""}</article>`).join("");
  const faq = key === "faq" ? `<section class="content-section faq">${cards.map((q, index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${localeCode === "pl" ? ["Tak. Zakres kontroli zależy od źródła i dostępnych dokumentów.", "Koszt obejmuje samochód oraz uzgodnione opłaty, transport i formalności.", "Zakres dokumentów zależy od kraju sprzedawcy i miejsca rejestracji."][index] : localeCode === "en" ? ["Yes. The scope depends on the source and available documents.", "The total includes the vehicle and agreed fees, transport and formalities.", "The document set depends on seller country and registration destination."][index] : ["Да. Объём проверки зависит от источника и доступных документов.", "Стоимость включает автомобиль, согласованные комиссии, доставку и оформление.", "Комплект документов зависит от страны продавца и места регистрации."][index]}</p></details>`).join("")}</section>` : "";
  const calculatorNote = key === "calculator" ? `<p class="seo-callout">${localeCode === "ru" ? "Рабочий калькулятор растаможки для Беларуси доступен по ссылке ниже." : localeCode === "pl" ? "Kalkulator odprawy dla Białorusi jest dostępny poniżej." : "The Belarus customs calculator is available below."} <a class="text-link" href="/customs-calculator.html">${localeCode === "ru" ? "Открыть калькулятор" : localeCode === "pl" ? "Otwórz kalkulator" : "Open calculator"}</a></p>` : "";
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
<body class="content-page">
  <header class="topbar">
    <a class="brand" href="${locale.home}" aria-label="Atlant Auto"><span class="brand-mark">AA</span><span><strong>Atlant Auto</strong><small>Warszawa</small></span></a>
    <nav class="nav" aria-label="Primary navigation">${nav(locale)}</nav>
    <div class="language-nav" aria-label="Language">${languageNav(localeCode)}</div>
  </header>
  <main>
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${locale.home}">${locale.breadcrumb}</a><span aria-hidden="true">/</span><span>${esc(h1)}</span></nav>
    <section class="content-hero${isHome ? " content-hero-home" : ""}">
      <p class="eyebrow">${locale.eyebrow}</p>
      <h1>${esc(h1)}</h1>
      <p class="lead">${esc(intro)}</p>
      <div class="hero-actions"><a class="button primary" href="${contactAction}">${locale.cta}</a><a class="button ghost dark" href="${catalogue}">${locale.nav[0]}</a></div>
    </section>
    ${calculatorNote}
    <section class="content-section topic-grid">${cardsHtml}</section>
    ${faq}
    <section class="content-section seo-copy">
      <h2>${localeCode === "pl" ? "Przejrzysty proces i sprawdzone dane" : localeCode === "en" ? "A transparent process based on available evidence" : "Прозрачный процесс и проверяемые данные"}</h2>
      <p>${esc(intro)} ${localeCode === "pl" ? "Nie publikujemy fikcyjnych ocen ani obietnic. Zakres kontroli i kosztorys zależą od konkretnego pojazdu." : localeCode === "en" ? "We do not publish invented ratings or guarantees. The scope of checks and the estimate depend on the selected vehicle." : "Мы не публикуем выдуманные рейтинги и гарантии. Объём проверки и смета зависят от конкретного автомобиля."}</p>
      <p><a class="text-link" href="${locale.routes[1]}">${locale.nav[1]}</a> · <a class="text-link" href="${locale.routes[3]}">${locale.nav[3]}</a> · <a class="text-link" href="${locale.routes[4]}">${locale.nav[4]}</a></p>
    </section>
  </main>
  <footer class="footer">
    <div><a class="brand footer-brand" href="${locale.home}"><span class="brand-mark">AA</span><span><strong>Atlant Auto</strong><small>${site.legalName}</small></span></a><p>${locale.footer}</p><p>NIP ${site.nip}</p></div>
    <address><a href="tel:+48515392420">${site.phone}</a><a href="mailto:${site.email}">${site.email}</a><a href="${site.telegram}">Telegram</a><span>${site.address}</span><a href="${localeCode === "ru" ? "/privacy/" : localeCode === "pl" ? "/pl/polityka-prywatnosci/" : "/en/privacy/"}">${localeCode === "pl" ? "Polityka prywatności" : localeCode === "en" ? "Privacy policy" : "Политика конфиденциальности"}</a></address>
  </footer>
</body>
</html>`;
}

const generated = [];
for (const [localeCode, localePages] of Object.entries(pages)) {
  for (const page of localePages) {
    if (page[1] === "/") continue;
    const target = outputPath(page[1]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, pageHtml(page, localeCode), "utf8");
    generated.push(page[1]);
  }
}

const sitemapRoutes = [
  "/",
  ...generated,
  "/customs-calculator.html",
  "/cars/ford-focus-wagon-1-0-ecoboost-st-line-x-business-2022.html",
  "/cars/bmw-216d-gran-tourer-2022.html",
  "/cars/bmw-x1-sdrive16d-2021.html"
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
