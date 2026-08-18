import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";

global.window = {};
await import("../data/cars.js");
const cars = global.window.ATLANT_CARS;

test("catalog has unique ids and slugs", () => {
  assert.ok(cars.length > 0);
  assert.equal(new Set(cars.map((car) => car.id)).size, cars.length);
  assert.equal(new Set(cars.map((car) => car.slug)).size, cars.length);
});

test("every car has required catalog fields", () => {
  for (const car of cars) {
    assert.ok(car.id);
    assert.ok(car.slug);
    assert.ok(["for-sale", "sold"].includes(car.status));
    assert.ok(car.brand);
    assert.ok(car.model);
    assert.ok(car.mainImage);
    assert.ok(Array.isArray(car.images) && car.images.length > 0);
    assert.equal(car.productionDate === undefined, false);
    assert.equal(car.firstRegistrationDate === undefined, false);
  }
});

test("every car has Polish and English detail pages", async () => {
  for (const car of cars) {
    await access(new URL(`../pl/samochody/${car.slug}/index.html`, import.meta.url));
    await access(new URL(`../en/cars/${car.slug}/index.html`, import.meta.url));
  }
});

test("structured values do not contain display sentinels", () => {
  const serialized = JSON.stringify(cars);
  assert.equal(/"(?:null|undefined|NaN)"/.test(serialized), false);
});

test("catalog vehicles do not store VIN values", () => {
  for (const car of cars) assert.equal(Object.hasOwn(car, "vin"), false, car.slug);

  const currentCars = cars.filter((car) => ["on-site", "in-transit"].includes(car.availability));
  assert.equal(currentCars.length, 8);
  assert.equal(currentCars.filter((car) => car.availability === "in-transit").length, 3);
  for (const car of currentCars.filter((car) => car.auctionSource)) {
    assert.ok(["Arval", "Automotive Trade Center"].includes(car.auctionSource), car.slug);
  }
  assert.equal(currentCars.filter((car) => car.auctionSource === "Automotive Trade Center").length, 1);
});

test("historic vehicles are marked as recently sold with transparent estimates", () => {
  const soldCars = cars.filter((car) => car.status === "sold");
  assert.equal(soldCars.length, 6);
  for (const car of soldCars) {
    assert.equal(car.availability, "sold", car.slug);
    assert.equal(car.priceType, "market-estimate", car.slug);
    assert.equal(Object.hasOwn(car, "priceExcludingVat"), false, car.slug);
    assert.equal(car.currency, "PLN", car.slug);
    assert.ok(car.price > 0, car.slug);
  }
});
