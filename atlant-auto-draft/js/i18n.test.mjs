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

  for (const relative of ["pl/index.html", "en/index.html"]) {
    const html = fs.readFileSync(path.join(siteRoot, relative), "utf8");
    assert.match(html, /class="cars-grid"/, `${relative} lost the catalogue grid`);
    assert.match(html, /class="car-card-link"/, `${relative} lost clickable vehicle cards`);
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
