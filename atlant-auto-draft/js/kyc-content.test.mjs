import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}

walk(root);

test("public site exposes only Polish and English pages", () => {
  const rootHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(rootHtml, /url=\/pl\//);
  assert.doesNotMatch(rootHtml, /lang="ru"|hreflang="ru"|>RU</i);

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /lang="ru"|hreflang="ru"|>RU</i, path.relative(root, file));
  }
});

test("calculator pages and links are absent from the public site", () => {
  for (const relative of [
    "customs-calculator.html",
    "pl/customs-calculator.html",
    "en/customs-calculator.html",
    "pl/kalkulator/index.html",
    "en/calculator/index.html"
  ]) assert.equal(fs.existsSync(path.join(root, relative)), false, relative);

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /customs-calculator|\/kalkulator\/|\/calculator\//i, path.relative(root, file));
  }
});

test("public copy contains no vehicle export claims", () => {
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /\bexport(?:s|ed|ing)?\b|\beksport\w*/i, path.relative(root, file));
  }
});

test("new on-site vehicle VINs are absent from every public page", () => {
  const privateIdentifiers = [
    "VR3FPHNSTPY601376",
    "WBA7M710707M02404",
    "VF1RFB00X70267513"
    ,"VR3FPHNSTPY557022"
    ,"VSSZZZKJ8PR014353"
    ,"U5YPX81AHPL110108"
  ];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    for (const identifier of privateIdentifiers) {
      assert.doesNotMatch(html, new RegExp(identifier, "i"), path.relative(root, file));
    }
  }
});

test("every generated vehicle detail page includes the condition limitation", () => {
  const vehiclePages = htmlFiles.filter((file) => /\/(?:pl\/samochody|en\/cars)\/[^/]+\/index\.html$/.test(file));
  assert.ok(vehiclePages.length > 0);
  for (const file of vehiclePages) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /class="condition-disclaimer"/, path.relative(root, file));
  }
});

test("public pages do not expose downloadable PDF reports", () => {
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /href=["'][^"']+\.pdf(?:[?#][^"']*)?["']/i, path.relative(root, file));
  }
});
