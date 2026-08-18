import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { messages, validateCatalog } from "../../tools/i18n-catalog.mjs";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(siteRoot, "..");
const requiredKeys = [
  "navigation.catalog", "navigation.services", "home.hero.title", "home.hero.subtitle",
  "home.hero.cta", "calculator.field.price", "home.form.submit", "validation.required",
  "notifications.requestSent", "cookie.banner.title", "error.404.title", "error.500.title",
  "footer.privacy", "vehicle.gallery.mainAlt", "email.request.subject"
];

test("translation catalogue uses semantic keys and has Polish and English values", () => {
  assert.deepEqual(validateCatalog(), []);
  for (const key of requiredKeys) assert.ok(messages[key], `required semantic key is missing: ${key}`);
  assert.ok(Object.keys(messages).length > 180, "catalogue should cover the complete site interface");
});

test("Polish and English generated pages do not contain Cyrillic interface text", () => {
  for (const locale of ["pl", "en"]) {
    const files = [];
    const walk = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".html")) files.push(full);
      }
    };
    walk(path.join(siteRoot, locale));
    for (const file of files) {
      const html = fs.readFileSync(file, "utf8");
      assert.doesNotMatch(html, /[А-Яа-яЁё]/, `${path.relative(siteRoot, file)} contains untranslated Cyrillic text`);
    }
  }
});

test("browser code does not call automatic translation services", () => {
  const files = [
    path.join(siteRoot, "app.js"),
    path.join(siteRoot, "js/cookie-consent.js")
  ];
  const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(source, /translate\.google|deepl|microsofttranslator|translation.?api/i);
});

test("request form prepares a real email draft", () => {
  const source = fs.readFileSync(path.join(siteRoot, "app.js"), "utf8");
  assert.match(source, /mailto:/);
  assert.match(source, /window\.location\.href = mailto/);
  assert.match(source, /data-service-package/);
});

test("user-facing strings are absent from interactive browser components", () => {
  for (const relative of ["app.js", "js/cookie-consent.js"]) {
    const source = fs.readFileSync(path.join(siteRoot, relative), "utf8");
    assert.doesNotMatch(source, /[А-Яа-яЁё]/, `${relative} contains hardcoded Russian interface text`);
  }
  assert.ok(fs.existsSync(path.join(projectRoot, "tools/i18n-catalog.mjs")));
});

test("every branded page uses the Atlant Auto wordmark", () => {
  const wordmark = path.join(siteRoot, "assets/site/atlant-auto-wordmark.svg");
  assert.ok(fs.existsSync(wordmark), "missing Atlant Auto wordmark asset");
  assert.ok(fs.existsSync(path.join(siteRoot, "favicon.ico")), "missing browser favicon");
  assert.ok(fs.existsSync(path.join(siteRoot, "assets/site/favicon-32.png")), "missing 32px favicon");
  assert.ok(fs.existsSync(path.join(siteRoot, "assets/site/apple-touch-icon.png")), "missing Apple touch icon");
  const wordmarkSource = fs.readFileSync(wordmark, "utf8");
  assert.match(wordmarkSource, /data-country-badge="AA"/, "wordmark must use the oval AA country badge");
  assert.doesNotMatch(wordmarkSource, /linearGradient|feDropShadow/, "wordmark must stay clean and free of chrome effects");

  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html")) {
        const html = fs.readFileSync(full, "utf8");
        if (!html.includes('class="topbar"')) continue;
        assert.match(html, /rel="icon" href="\/favicon\.ico"/, `${path.relative(siteRoot, full)} does not link the favicon`);
        assert.match(html, /rel="apple-touch-icon"[^>]*href="\/assets\/site\/apple-touch-icon\.png"/, `${path.relative(siteRoot, full)} does not link the Apple touch icon`);
        assert.match(html, /class="brand-wordmark"[^>]*><img src="\/assets\/site\/atlant-auto-wordmark\.svg"/, `${path.relative(siteRoot, full)} does not use the wordmark`);
        assert.doesNotMatch(html, /class="brand-mark"/, `${path.relative(siteRoot, full)} still uses the legacy AA mark`);
      }
    }
  };
  walk(siteRoot);

  const styles = fs.readFileSync(path.join(siteRoot, "styles.css"), "utf8");
  assert.match(styles, /#official-company-heading\s*\{[^}]*white-space:\s*nowrap;/, "official company name must stay on one line");
  assert.match(styles, /\.brand\s*\{[\s\S]*?width:\s*188px;/, "desktop wordmark must remain readable in the header");
  assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.brand\s*\{[^}]*width:\s*148px;/, "mobile wordmark must remain readable without crowding the language switcher");
});

test("generated pages keep the responsive layout contract", () => {
  const styles = fs.readFileSync(path.join(siteRoot, "styles.css"), "utf8");
  for (const selector of [
    ".cars-grid", ".car-card-link", ".car-page-main", ".car-hero",
    ".car-gallery-main", ".car-thumbs", ".detail-grid", ".equipment-grid"
  ]) {
    assert.ok(styles.includes(selector), `missing responsive style: ${selector}`);
  }
  assert.match(styles, /\.car-card\[hidden\]\s*\{\s*display:\s*none;/, "catalogue filters must be able to hide vehicle cards");
  assert.match(styles, /\.price-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) max-content;/, "card price and CTA must keep a stable two-column layout");
  assert.match(styles, /\.price\s*\{[^}]*white-space:\s*nowrap;/, "vehicle prices must not wrap independently of the CTA");
  assert.match(styles, /\.car-card\[data-status="sold"\][\s\S]*?grayscale\(1\)/, "sold vehicle cards must have a visually inactive grayscale treatment");
  for (const image of [
    "lot-lineup.jpg",
    "lot-crossovers.jpg",
    "vehicle-transport.jpg",
    "dealership-lot-wide.jpg",
    "dealership-selection.jpg",
    "dealership-auction-stock.jpg",
    "dealership-range.jpg",
    "dealership-delivery.jpg",
    "dealership-lineup.jpg",
  ]) {
    assert.ok(styles.includes(`/assets/site/${image}`), `site photography is not used in CSS: ${image}`);
    assert.ok(fs.existsSync(path.join(siteRoot, "assets/site", image)), `missing site photography asset: ${image}`);
  }

  for (const relative of ["pl/index.html", "en/index.html"]) {
    const html = fs.readFileSync(path.join(siteRoot, relative), "utf8");
    assert.doesNotMatch(html, /Telegram|t\.me\/atlantautopl/i, `${relative} must not publish Telegram contact details`);
    assert.match(html, /class="cars-grid"/, `${relative} lost the catalogue grid`);
    assert.match(html, /class="car-card-link"/, `${relative} lost clickable vehicle cards`);
    assert.match(html, /data-filter="all"[\s\S]*data-filter="on-site"[\s\S]*data-filter="in-transit"[\s\S]*data-filter="sold"/, `${relative} must expose all four catalogue filters in order`);
    assert.deepEqual(
      [...html.matchAll(/class="car-card" data-status="([^"]+)"/g)].map((match) => match[1]),
      ["on-site", "on-site", "on-site", "on-site", "on-site", "on-site", "in-transit", "in-transit", "in-transit", "sold", "sold", "sold", "sold", "sold", "sold"],
      `${relative} must sort on-site vehicles before incoming and sold vehicles`
    );
    assert.match(html, /class="process-roadmap"/, `${relative} lost the purchase roadmap`);
    assert.equal((html.match(/class="process-card"/g) || []).length, 5, `${relative} must show five process stages`);
    assert.match(html, /class="advantages-grid"/, `${relative} lost the advantages section`);
    assert.equal((html.match(/class="advantage-card"/g) || []).length, 6, `${relative} must show six advantages`);
    assert.match(html, /class="numbers-grid"/, `${relative} lost the catalogue figures`);
    assert.equal((html.match(/class="number-card"/g) || []).length, 4, `${relative} must show four catalogue figures`);
    assert.deepEqual([...html.matchAll(/class="number-card"><strong>(\d+)<\/strong>/g)].map((match) => match[1]), ["12", "8", "11", "119"], `${relative} has incorrect business figures`);
    assert.doesNotMatch(html, /Aktualne dane dotyczące oferty|Current figures for Atlant Auto/, `${relative} still shows the removed figures description`);
    assert.match(html, relative.startsWith("pl/") ? /11<\/strong>.*zadowolonych klientów w tym miesiącu/ : /11<\/strong>.*happy clients this month/, `${relative} must label monthly clients`);
    assert.match(html, relative.startsWith("pl/") ? /Wkrótce dostępny/ : /Coming soon/, `${relative} must use the shortened in-transit label`);
    assert.match(html, relative.startsWith("pl/") ? /4 lata na rynku.*Ponad 500 zadowolonych klientów/s : /4 years on the market.*More than 500 satisfied customers/s, `${relative} lost the company experience statement`);
    assert.match(html, relative.startsWith("pl/") ? /Samochód na zamówienie — do 3 tygodni/ : /A car to order — within 3 weeks/, `${relative} lost the three-week order promise`);
    assert.match(html, relative.startsWith("pl/") ? /Pracujemy z każdym budżetem/ : /We work with every budget/, `${relative} lost the budget statement`);
    assert.match(html, /class="platforms-section" id="platforms"/, `${relative} lost the vehicle sourcing platforms section`);
    assert.equal((html.match(/class="platform-card"/g) || []).length, 6, `${relative} must show six sourcing platforms`);
    assert.equal((html.match(/\/assets\/auctions\//g) || []).length, 6, `${relative} must show six platform logos`);
    assert.match(html, relative.startsWith("pl/") ? /Aukcje i platformy leasingowe/ : /Auctions and leasing platforms/, `${relative} lost the localized platforms heading`);
    assert.match(html, relative.startsWith("pl/") ? /nie oznaczają wyłącznego partnerstwa/ : /do not imply an exclusive partnership/, `${relative} lost the platform relationship disclaimer`);
    assert.doesNotMatch(html, /<dt>500\+<\/dt>|<dt>30%<\/dt>/, `${relative} exposes unverified hero figures`);
    assert.match(html, /class="pricing-grid"/, `${relative} lost the service pricing section`);
    assert.equal((html.match(/class="pricing-card(?: featured)?"/g) || []).length, 2, `${relative} must show two service packages`);
    assert.match(html, /class="service-price">500 €<\/strong>/, `${relative} lost the base package price`);
    assert.match(html, /class="service-price">750 €<\/strong>/, `${relative} lost the inspection package price`);
    assert.match(html, /href="#pricing"[^>]*>[^<]+<\/a>/, `${relative} lost the service navigation link`);
    assert.equal((html.match(/data-service-package=/g) || []).length, 2, `${relative} must connect both packages to the request form`);
    assert.match(html, /select name="service"/, `${relative} lost the service selector`);
    assert.match(html, /data-recipient="autoatlantcapital@gmail\.com"/, `${relative} lost the request email recipient`);
    assert.equal((html.match(/class="badge source arval-badge"/g) || []).length, 6, `${relative} must show the Arval logo for six current vehicles`);
    assert.doesNotMatch(html, /Aukcja Arval|Arval auction|Orientacyjna cena rynkowa|Indicative market price/, `${relative} exposes superseded badge or price text`);
    assert.doesNotMatch(html, /PLN (?:brutto|gross)/, `${relative} must show only the price and currency`);
    assert.match(html, /class="route-section" id="route"/, `${relative} lost the route map section`);
    assert.match(html, /Wielkiego Dębu 6, 03-262 Warszawa/, `${relative} lost the vehicle site address`);
    assert.match(html, /google\.com\/maps\?q=Wielkiego%20D%C4%99bu%206/, `${relative} lost the embedded route map`);
  }

  const routes = JSON.parse(fs.readFileSync(path.join(siteRoot, "vehicle-pages.json"), "utf8"));
  for (const route of routes) {
    const relative = route.endsWith("/") ? `${route.slice(1)}index.html` : route.slice(1);
    const html = fs.readFileSync(path.join(siteRoot, relative), "utf8");
    assert.match(html, /<main class="car-page-main">/, `${route} lost the constrained page container`);
    assert.match(html, /class="car-thumbs car-thumbnails"/, `${route} lost the adaptive gallery`);
    assert.match(html, /class="detail-grid spec-grid"/, `${route} lost the specification grid`);
  }
});

test("standalone customer pages contain the complete conversion journey", () => {
  for (const locale of ["pl", "en"]) {
    const catalogue = fs.readFileSync(path.join(siteRoot, locale, locale === "pl" ? "samochody/index.html" : "cars/index.html"), "utf8");
    assert.equal((catalogue.match(/class="car-card" data-status=/g) || []).length, 15, `${locale} catalogue must show every vehicle`);
    assert.match(catalogue, /data-filter="all"[\s\S]*data-filter="on-site"[\s\S]*data-filter="in-transit"[\s\S]*data-filter="sold"/, `${locale} catalogue filters are incomplete`);

    const processPage = fs.readFileSync(path.join(siteRoot, locale, locale === "pl" ? "jak-dzialamy/index.html" : "how-it-works/index.html"), "utf8");
    assert.equal((processPage.match(/class="process-card"/g) || []).length, 5, `${locale} process page must show five stages`);
    assert.equal((processPage.match(/<article><span>0\d<\/span>/g) || []).length, 4, `${locale} process page must explain agreement and payment`);

    const contactPage = fs.readFileSync(path.join(siteRoot, locale, "contact/index.html".replace("contact", locale === "pl" ? "kontakt" : "contact")), "utf8");
    assert.match(contactPage, /class="request-form"/, `${locale} contact page lost the enquiry form`);
    assert.match(contactPage, /google\.com\/maps\?q=Wielkiego%20D%C4%99bu%206/, `${locale} contact page lost the lot map`);
    assert.match(contactPage, /href="tel:\+48515392420"/, `${locale} contact page lost the direct phone action`);
  }

  const styles = fs.readFileSync(path.join(siteRoot, "styles.css"), "utf8");
  assert.match(styles, /\.topbar\.nav-open > \.nav\s*\{\s*display:\s*flex;/, "mobile menu must be expandable");
  assert.match(styles, /\.mobile-call-bar\s*\{[^}]*position:\s*fixed;/, "mobile call action must stay visible");
  assert.ok(fs.existsSync(path.join(siteRoot, "js/site-navigation.js")), "mobile navigation script is missing");
});
