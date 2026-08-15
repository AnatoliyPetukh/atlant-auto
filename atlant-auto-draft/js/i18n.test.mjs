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

test("generated pages keep the responsive layout contract", () => {
  const styles = fs.readFileSync(path.join(siteRoot, "styles.css"), "utf8");
  for (const selector of [
    ".cars-grid", ".car-card-link", ".car-page-main", ".car-hero",
    ".car-gallery-main", ".car-thumbs", ".detail-grid", ".equipment-grid"
  ]) {
    assert.ok(styles.includes(selector), `missing responsive style: ${selector}`);
  }
  assert.match(styles, /\.car-card\[data-status="sold"\][\s\S]*?grayscale\(1\)/, "sold vehicle cards must have a visually inactive grayscale treatment");
  for (const image of ["lot-lineup.jpg", "lot-crossovers.jpg", "vehicle-transport.jpg"]) {
    assert.ok(styles.includes(`/assets/site/${image}`), `site photography is not used in CSS: ${image}`);
    assert.ok(fs.existsSync(path.join(siteRoot, "assets/site", image)), `missing site photography asset: ${image}`);
  }

  for (const relative of ["pl/index.html", "en/index.html"]) {
    const html = fs.readFileSync(path.join(siteRoot, relative), "utf8");
    assert.match(html, /class="cars-grid"/, `${relative} lost the catalogue grid`);
    assert.match(html, /class="car-card-link"/, `${relative} lost clickable vehicle cards`);
    assert.match(html, /class="process-roadmap"/, `${relative} lost the purchase roadmap`);
    assert.equal((html.match(/class="process-card"/g) || []).length, 5, `${relative} must show five process stages`);
    assert.match(html, /class="advantages-grid"/, `${relative} lost the advantages section`);
    assert.equal((html.match(/class="advantage-card"/g) || []).length, 6, `${relative} must show six advantages`);
    assert.match(html, /class="numbers-grid"/, `${relative} lost the catalogue figures`);
    assert.equal((html.match(/class="number-card"/g) || []).length, 4, `${relative} must show four catalogue figures`);
    assert.deepEqual([...html.matchAll(/class="number-card"><strong>(\d+)<\/strong>/g)].map((match) => match[1]), ["14", "8", "24", "11"], `${relative} has incorrect business figures`);
    assert.doesNotMatch(html, /Aktualne dane dotyczące oferty|Current figures for Atlant Auto/, `${relative} still shows the removed figures description`);
    assert.match(html, relative.startsWith("pl/") ? /11<\/strong><span>samochodów sprzedanych w tym miesiącu/ : /11<\/strong><span>vehicles sold this month/, `${relative} must label monthly sales`);
    assert.match(html, relative.startsWith("pl/") ? /Wkrótce dostępny/ : /Coming soon/, `${relative} must use the shortened in-transit label`);
    assert.match(html, relative.startsWith("pl/") ? /3 lata działalności w branży motoryzacyjnej/ : /3 years in the automotive market/, `${relative} lost the company experience statement`);
    assert.match(html, /class="platforms-section" id="platforms"/, `${relative} lost the vehicle sourcing platforms section`);
    assert.equal((html.match(/class="platform-card"/g) || []).length, 6, `${relative} must show six sourcing platforms`);
    assert.equal((html.match(/\/assets\/auctions\//g) || []).length, 6, `${relative} must show six platform logos`);
    assert.match(html, relative.startsWith("pl/") ? /Aukcje i platformy leasingowe/ : /Auctions and leasing platforms/, `${relative} lost the localized platforms heading`);
    assert.match(html, relative.startsWith("pl/") ? /nie oznaczają wyłącznego partnerstwa/ : /do not imply an exclusive partnership/, `${relative} lost the platform relationship disclaimer`);
    assert.match(html, /class="faq-grid"/, `${relative} lost the expanded FAQ grid`);
    assert.equal((html.match(/<details(?: open)?>/g) || []).length, 8, `${relative} must show eight practical FAQ entries`);
    assert.match(html, relative.startsWith("pl/") ? /href="\/pl\/faq\/"/ : /href="\/en\/faq\/"/, `${relative} lost the full FAQ link`);
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
