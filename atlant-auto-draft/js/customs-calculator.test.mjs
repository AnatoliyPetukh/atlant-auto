import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateBenefit,
  calculateCompanyFee,
  calculateCustomsQuote,
  calculateVehicleAge,
  getAgeCategory,
  selectRate
} from "./customs-calculator.mjs";

const atDate = new Date(2026, 6, 12);

test("selects under-3 price boundaries", () => {
  const cases = [
    [8500, 2.5],
    [8500.01, 3.5],
    [16700, 3.5],
    [16700.01, 5.5],
    [42300, 5.5],
    [42300.01, 7.5],
    [84500, 7.5],
    [84500.01, 15],
    [169000, 15],
    [169000.01, 20]
  ];

  for (const [price, minRatePerCc] of cases) {
    const rate = selectRate(price, 2000, "under3");
    assert.equal(rate.minRatePerCc, minRatePerCc);
  }
});

test("selects volume boundaries for 3-5 year vehicles", () => {
  const cases = [
    [1000, 1.5],
    [1001, 1.7],
    [1500, 1.7],
    [1501, 2.5],
    [1800, 2.5],
    [1801, 2.7],
    [2300, 2.7],
    [2301, 3],
    [3000, 3],
    [3001, 3.6]
  ];

  for (const [volume, ratePerCc] of cases) {
    const rate = selectRate(10000, volume, "from3to5");
    assert.equal(rate.ratePerCc, ratePerCc);
  }
});

test("selects volume boundaries for over-5 year vehicles", () => {
  const cases = [
    [1000, 3],
    [1001, 3.2],
    [1500, 3.2],
    [1501, 3.5],
    [1800, 3.5],
    [1801, 4.8],
    [2300, 4.8],
    [2301, 5],
    [3000, 5],
    [3001, 5.7]
  ];

  for (const [volume, ratePerCc] of cases) {
    const rate = selectRate(10000, volume, "over5");
    assert.equal(rate.ratePerCc, ratePerCc);
  }
});

test("calculates age by month and year", () => {
  assert.equal(getAgeCategory(calculateVehicleAge(7, 2023, atDate)), "under3");
  assert.equal(getAgeCategory(calculateVehicleAge(6, 2023, atDate)), "from3to5");
  assert.equal(getAgeCategory(calculateVehicleAge(7, 2021, atDate)), "from3to5");
  assert.equal(getAgeCategory(calculateVehicleAge(6, 2021, atDate)), "over5");
});

test("calculates ATLANT CAPITAL company fee", () => {
  assert.equal(calculateCompanyFee(14999), 350);
  assert.equal(calculateCompanyFee(15000), 375);
  assert.equal(calculateCompanyFee(20000), 500);
});

test("applies benefit only to customs duty", () => {
  const quote = calculateCustomsQuote({
    price: 10000,
    currency: "EUR",
    releaseMonth: 6,
    releaseYear: 2022,
    volumeCc: 2000,
    engineType: "petrol",
    clearanceMode: "benefit50",
    includeFullBudget: true,
    auctionFee: 100,
    deliveryToWarsaw: 200,
    deliveryToBelarus: 300
  }, { atDate });

  assert.equal(quote.standardDuty, 5400);
  assert.equal(quote.benefitAmount, 2700);
  assert.equal(quote.finalDuty, 2700);
  assert.equal(quote.additionalCostsTotal, 600);
  assert.equal(quote.companyFee, 350);
  assert.equal(quote.fullBudgetTotal, 13650);
});

test("requires manual calculation for hybrid and electric vehicles", () => {
  for (const engineType of ["hybrid", "electric"]) {
    const quote = calculateCustomsQuote({
      price: 10000,
      currency: "EUR",
      releaseMonth: 1,
      releaseYear: 2024,
      volumeCc: 1600,
      engineType,
      clearanceMode: "standard"
    }, { atDate });

    assert.equal(quote.status, "manual_required");
  }
});

test("calculates standard customs quote", () => {
  const quote = calculateCustomsQuote({
    price: 20000,
    currency: "EUR",
    releaseMonth: 1,
    releaseYear: 2024,
    volumeCc: 1600,
    engineType: "diesel",
    clearanceMode: "standard",
    includeFullBudget: false
  }, { atDate });

  assert.equal(quote.status, "ok");
  assert.equal(quote.ageCategory, "under3");
  assert.equal(quote.standardDuty, 9600);
  assert.equal(quote.finalDuty, 9600);
  assert.equal(quote.customsTotal, 9600);
});
