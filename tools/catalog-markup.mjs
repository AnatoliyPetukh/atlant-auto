import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { t } from "./i18n-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data/cars.js"), "utf8"), context);
export const cars = context.window.ATLANT_CARS;

const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const format = (value, locale) => new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB").format(value);
const carRoute = (locale, slug) => locale === "pl" ? `/pl/samochody/${slug}/` : `/en/cars/${slug}/`;

function statusKey(car) {
  if (car.status === "sold") return "vehicle.status.recentlySold";
  if (car.availability === "in-transit") return "vehicle.status.inTransit";
  if (car.availability === "on-site") return "vehicle.status.onSite";
  return "vehicle.status.forSale";
}

function sourceBadge(car) {
  if (car.auctionSource === "Arval") return `<span class="badge source arval-badge"><img src="/assets/brands/arval.png" alt="Arval" width="108" height="69"></span>`;
  if (car.auctionSource === "Automotive Trade Center") return `<span class="badge source atc-badge"><img src="/assets/brands/automotive-trade-center.png" alt="Automotive Trade Center" width="858" height="123"></span>`;
  if (car.auctionSource === "mobile.de") return `<span class="badge source mobilede-badge" aria-label="mobile.de"><span>mobile</span><b>.de</b></span>`;
  return "";
}

export function catalogueCards(locale) {
  const order = { "on-site": 0, "in-transit": 1, sold: 2 };
  return [...cars].sort((a, b) => (order[a.availability] ?? 99) - (order[b.availability] ?? 99)).map((car) => {
    const name = `${car.brand} ${car.model} ${car.version}`.trim();
    const sold = car.status === "sold";
    const state = sold ? "sold" : car.availability === "in-transit" ? "in-transit" : "on-site";
    const year = car.productionDate || car.firstRegistrationDate?.slice(0, 4) || t(locale, "common.notConfirmed");
    const mileage = car.mileageKm == null ? t(locale, "common.notConfirmed") : `${format(car.mileageKm, locale)} ${t(locale, "vehicle.unit.kilometres")}`;
    const price = car.price == null ? t(locale, "common.priceOnRequest") : `${format(car.price, locale)} ${car.currency}`;
    return `<article class="car-card" data-status="${state}"><a class="car-card-link" href="${carRoute(locale, car.slug)}" aria-label="${esc(t(locale, "action.viewVehicle"))}: ${esc(name)}">
      <div class="car-media"><img src="/${car.mainImage.replace(/^(\.\.\/)+/, "")}" alt="${esc(t(locale, "vehicle.gallery.mainAlt", { vehicle: name }))}" width="1280" height="960" loading="lazy"><div class="car-badges"><span class="badge${sold ? " sold" : ""}">${t(locale, statusKey(car))}</span>${sourceBadge(car)}</div></div>
      <div class="car-body"><h3>${esc(name)}</h3><div class="compact-specs"><div><span>${year}</span><span>${t(locale, `vehicle.fuel.${car.fuelType}`)}</span><span>${t(locale, `vehicle.transmission.${car.transmission}`)}</span></div><div><span>${mileage}</span><span>${format(car.engineCapacityCc, locale)} ${t(locale, "vehicle.unit.cubicCentimetres")}</span></div></div><div class="price-row"><span class="price-block"><span class="price">${esc(price)}</span></span><span class="car-cta"><span>${t(locale, sold ? "action.viewDetails" : "action.checkOffer")}</span><span class="car-cta-arrow" aria-hidden="true">→</span></span></div></div>
    </a></article>`;
  }).join("");
}
