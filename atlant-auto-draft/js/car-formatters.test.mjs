import test from "node:test";
import assert from "node:assert/strict";

global.window = {};
await import("./car-formatters.js");
const format = global.window.CarFormat;

test("catalog date prefers production date", () => {
  assert.deepEqual(format.catalogDate({ productionDate: "2021-04", firstRegistrationDate: "2021-06" }), {
    label: "Дата производства", value: "04.2021"
  });
});

test("catalog date clearly labels first registration fallback", () => {
  assert.deepEqual(format.catalogDate({ productionDate: null, firstRegistrationDate: "2022-01-07" }), {
    label: "Первая регистрация", value: "01.2022"
  });
});

test("formatters hide invalid values", () => {
  assert.equal(format.mileage(null), "");
  assert.equal(format.engine(Number.NaN), "");
  assert.equal(format.date(undefined), "");
});

test("mileage, engine and price have consistent units", () => {
  assert.match(format.mileage(172509), /^172[\s\u00a0]509 км$/);
  assert.equal(format.engine(999), "1.0 л");
  assert.match(format.price({ price: 15500, currency: "EUR" }), /15[\s\u00a0]500/);
});

test("title omits empty values", () => {
  assert.equal(format.title({ brand: "BMW", model: "X1", version: "" }), "BMW X1");
});
