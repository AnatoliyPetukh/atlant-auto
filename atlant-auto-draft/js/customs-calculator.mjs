import { CALCULATOR_CONFIG, CUSTOMS_RATE_TABLES } from "./customs-rates.mjs";

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateVehicleAge(releaseMonth, releaseYear, atDate = new Date()) {
  const month = Number(releaseMonth);
  const year = Number(releaseYear);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("calculator.error.releaseMonth");
  }
  if (!Number.isInteger(year) || year > atDate.getFullYear()) {
    throw new Error("calculator.error.releaseYear");
  }

  const releaseIndex = year * 12 + (month - 1);
  const currentIndex = atDate.getFullYear() * 12 + atDate.getMonth();
  if (releaseIndex > currentIndex) {
    throw new Error("calculator.error.releaseDate");
  }

  const totalMonths = currentIndex - releaseIndex;
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    totalMonths
  };
}

export function getAgeCategory(age) {
  if (age.totalMonths <= 36) return "under3";
  if (age.totalMonths <= 60) return "from3to5";
  return "over5";
}

export function selectRate(priceEur, volumeCc, ageCategory, rateTables = CUSTOMS_RATE_TABLES) {
  if (ageCategory === "under3") {
    const matches = rateTables.under3.filter((rate) => priceEur <= rate.maxPrice);
    if (matches.length === 0) throw new Error("calculator.error.priceRate");
    return { ...matches[0], table: "under3" };
  }

  const table = rateTables[ageCategory];
  if (!table) throw new Error("calculator.error.ageCategory");
  const matches = table.filter((rate) => volumeCc <= rate.maxVolume);
  if (matches.length === 0) throw new Error("calculator.error.capacityRate");
  return { ...matches[0], table: ageCategory };
}

export function calculateCustomsDuty(priceEur, volumeCc, ageCategory, rate) {
  if (ageCategory === "under3") {
    const percentPart = priceEur * rate.percent;
    const volumePart = volumeCc * rate.minRatePerCc;
    return {
      value: roundMoney(Math.max(percentPart, volumePart)),
      formula: `max(${rate.percent * 100}%, ${rate.minRatePerCc} EUR/cc)`,
      appliedRate: rate.label
    };
  }

  return {
    value: roundMoney(volumeCc * rate.ratePerCc),
    formula: `${volumeCc} cc × ${rate.ratePerCc} EUR/cc`,
    appliedRate: rate.label
  };
}

export function calculateBenefit(standardDuty, clearanceMode) {
  if (clearanceMode !== "benefit50") {
    return {
      amount: 0,
      finalDuty: roundMoney(standardDuty)
    };
  }

  const amount = roundMoney(standardDuty * 0.5);
  return {
    amount,
    finalDuty: roundMoney(standardDuty - amount)
  };
}

export function calculateCompanyFee(priceEur, config = CALCULATOR_CONFIG.companyFee) {
  if (priceEur < config.thresholdEur) {
    return config.flatBelowThresholdEur;
  }
  return roundMoney(priceEur * config.percentAtOrAboveThreshold);
}

export function convertPriceToEur(price, currency, exchangeRates = CALCULATOR_CONFIG.currencyRatesToEur) {
  const rate = exchangeRates[currency];
  if (currency === "EUR") return price;
  if (!rate || rate <= 0) {
    throw new Error(`calculator.error.exchangeRate.${currency}`);
  }
  return roundMoney(price * rate);
}

export function normalizeOptionalCost(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error("calculator.error.negativeCost");
  }
  return roundMoney(number);
}

export function calculateTotal(parts) {
  return roundMoney(parts.reduce((sum, value) => sum + (value || 0), 0));
}

export function calculateCustomsQuote(input, options = {}) {
  const atDate = options.atDate || new Date();
  const price = Number(input.price);
  const volumeCc = Number(input.volumeCc);

  if (!Number.isFinite(price) || price <= 0) throw new Error("calculator.error.price");
  if (!Number.isFinite(volumeCc) || volumeCc <= 0) throw new Error("calculator.error.capacity");
  if (!["EUR", "PLN"].includes(input.currency)) throw new Error("calculator.error.currency");

  if (!CALCULATOR_CONFIG.supportedFuelTypes.includes(input.engineType)) {
    return {
      status: "manual_required",
      messageKey: "calculator.result.manualNote"
    };
  }

  const exchangeRates = {
    ...CALCULATOR_CONFIG.currencyRatesToEur,
    ...(options.exchangeRates || {})
  };
  const priceEur = convertPriceToEur(price, input.currency, exchangeRates);
  const age = calculateVehicleAge(input.releaseMonth, input.releaseYear, atDate);
  const ageCategory = getAgeCategory(age);
  const rate = selectRate(priceEur, volumeCc, ageCategory, options.rateTables || CUSTOMS_RATE_TABLES);
  const duty = calculateCustomsDuty(priceEur, volumeCc, ageCategory, rate);
  const benefit = calculateBenefit(duty.value, input.clearanceMode);

  const additionalCosts = {
    auctionFee: normalizeOptionalCost(input.auctionFee),
    deliveryToWarsaw: normalizeOptionalCost(input.deliveryToWarsaw),
    deliveryToBelarus: normalizeOptionalCost(input.deliveryToBelarus),
    recyclingFee: normalizeOptionalCost(input.recyclingFee),
    customsFee: normalizeOptionalCost(input.customsFee),
    declarant: normalizeOptionalCost(input.declarant),
    temporaryStorage: normalizeOptionalCost(input.temporaryStorage),
    epts: normalizeOptionalCost(input.epts),
    other: normalizeOptionalCost(input.other)
  };

  const additionalCostsTotal = calculateTotal(Object.values(additionalCosts));
  const companyFee = input.includeFullBudget ? calculateCompanyFee(priceEur) : 0;
  const customsTotal = benefit.finalDuty;
  const fullBudgetTotal = calculateTotal([
    priceEur,
    customsTotal,
    additionalCostsTotal,
    companyFee
  ]);

  return {
    status: "ok",
    priceEur,
    age,
    ageCategory,
    rate,
    formula: duty.formula,
    appliedRate: duty.appliedRate,
    standardDuty: duty.value,
    benefitAmount: benefit.amount,
    finalDuty: benefit.finalDuty,
    additionalCosts,
    additionalCostsTotal,
    companyFee,
    includeFullBudget: Boolean(input.includeFullBudget),
    customsTotal,
    fullBudgetTotal
  };
}
