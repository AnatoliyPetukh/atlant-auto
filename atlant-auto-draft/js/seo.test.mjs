import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://atlantauto.pl";
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}
walk(root);

const read = (file) => fs.readFileSync(file, "utf8");
const match = (html, regex) => html.match(regex)?.[1]?.trim() || "";
const routeFor = (file) => {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -10)}`;
  return `/${relative}`;
};

test("all indexable HTML pages have unique title, description, one H1 and self canonical", () => {
  const titles = new Map();
  const descriptions = new Map();
  for (const file of htmlFiles) {
    const html = read(file);
    if (/name="robots" content="noindex/i.test(html)) continue;
    const route = routeFor(file);
    const title = match(html, /<title>([\s\S]*?)<\/title>/i);
    const description = match(html, /<meta name="description" content="([^"]+)"/i);
    const canonical = match(html, /<link rel="canonical" href="([^"]+)"/i);
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    assert.ok(title, `${route}: title is missing`);
    assert.ok(description, `${route}: description is missing`);
    assert.equal(h1Count, 1, `${route}: expected one H1`);
    assert.equal(canonical, `${origin}${route}`, `${route}: canonical must be self-referencing`);
    assert.ok(!titles.has(title), `${route}: duplicate title with ${titles.get(title)}`);
    assert.ok(!descriptions.has(description), `${route}: duplicate description with ${descriptions.get(description)}`);
    titles.set(title, route);
    descriptions.set(description, route);
  }
});

test("public pages have reciprocal Polish and English hreflang sets", () => {
  const localized = htmlFiles.filter((file) => {
    const html = read(file);
    return /hreflang="(?:pl|en)"/.test(html);
  });
  for (const file of localized) {
    const html = read(file);
    const route = routeFor(file);
    const links = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    const map = Object.fromEntries(links.map(([, lang, href]) => [lang, href]));
    for (const lang of ["pl", "en", "x-default"]) assert.ok(map[lang], `${route}: missing ${lang}`);
    assert.equal(map.ru, undefined, `${route}: Russian hreflang must not be published`);
    for (const lang of ["pl", "en"]) {
      const targetRoute = new URL(map[lang]).pathname;
      const targetFile = targetRoute === "/" ? path.join(root, "index.html")
        : targetRoute.endsWith("/") ? path.join(root, targetRoute.slice(1), "index.html")
        : path.join(root, targetRoute.slice(1));
      assert.ok(fs.existsSync(targetFile), `${route}: hreflang target ${targetRoute} is missing`);
      const targetHtml = read(targetFile);
      assert.match(targetHtml, /hreflang="(?:pl|en)"/);
      assert.ok(targetHtml.includes(`href="${origin}${route}"`), `${targetRoute}: no reciprocal link to ${route}`);
    }
  }
});

test("all JSON-LD blocks parse and contain no aggregateRating", () => {
  for (const file of htmlFiles) {
    const html = read(file);
    const route = routeFor(file);
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => JSON.parse(block[1]), `${route}: invalid JSON-LD`);
      assert.ok(!block[1].includes("aggregateRating"), `${route}: aggregateRating is not allowed without verified data`);
    }
  }
});

test("sitemap contains only existing canonical indexable pages", () => {
  const sitemap = read(path.join(root, "sitemap.xml"));
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(locations.length > 20, "sitemap should include Polish and English SEO pages");
  for (const location of locations) {
    const route = new URL(location).pathname;
    const file = route === "/" ? path.join(root, "index.html")
      : route.endsWith("/") ? path.join(root, route.slice(1), "index.html")
      : path.join(root, route.slice(1));
    assert.ok(fs.existsSync(file), `sitemap target is missing: ${route}`);
    const html = read(file);
    assert.ok(!/name="robots" content="noindex/i.test(html), `noindex URL in sitemap: ${route}`);
    assert.ok(html.includes(`rel="canonical" href="${location}"`), `non-canonical URL in sitemap: ${route}`);
  }
});

test("robots allows crawling and points to the canonical sitemap", () => {
  const robots = read(path.join(root, "robots.txt"));
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/atlantauto\.pl\/sitemap\.xml/);
});

test("critical vehicle and catalogue content exists in static HTML", () => {
  const home = read(path.join(root, "pl/index.html"));
  const vehicleRoutes = JSON.parse(read(path.join(root, "vehicle-pages.json")));
  const vehicleCount = vehicleRoutes.filter((route) => route.startsWith("/pl/samochody/")).length;
  assert.equal((home.match(/<article class="car-card"/g) || []).length, vehicleCount);
  for (const route of vehicleRoutes.filter((item) => item.startsWith("/pl/samochody/"))) {
    const file = path.join(root, route.slice(1), "index.html");
    const html = read(file);
    assert.match(html, /<section class="car-hero">/);
    assert.match(html, /<section class="car-section">/);
    for (const image of html.matchAll(/<img\b([^>]+)>/gi)) {
      assert.match(image[1], /\balt="[^"]*"/, `${routeFor(file)}: image alt missing`);
      assert.match(image[1], /\bwidth="\d+"/, `${routeFor(file)}: image width missing`);
      assert.match(image[1], /\bheight="\d+"/, `${routeFor(file)}: image height missing`);
    }
  }
});
