export const CUSTOMS_RATE_SOURCES = [
  {
    sourceUrl: "https://goldenmotors.by/blog/poshliny-i-sbory/",
    sourceKey: "calculator.source.goldenMotors",
    verifiedAt: "2026-07-12",
    verificationStatus: "commercial_reference"
  },
  {
    sourceUrl: "https://www.customs.gov.by/calc/",
    sourceKey: "calculator.source.belarusCalculator",
    verifiedAt: "2026-07-12",
    verificationStatus: "official_reference"
  },
  {
    sourceUrl: "https://www.customs.gov.by/fizicheskim-litsam/vvoz-tovarov-dlya-lichnogo-polzovaniya-s-uplatoy-tamozhennykh-platezhey/",
    sourceKey: "calculator.source.eecPersonalImports",
    verifiedAt: "2026-07-12",
    verificationStatus: "official_reference"
  }
];

export const CUSTOMS_RATE_TABLES = {
  under3: [
    { maxPrice: 8500, percent: 0.54, minRatePerCc: 2.5, label: "price-lte-8500" },
    { maxPrice: 16700, percent: 0.48, minRatePerCc: 3.5, label: "8 500,01 - 16 700 EUR" },
    { maxPrice: 42300, percent: 0.48, minRatePerCc: 5.5, label: "16 700,01 - 42 300 EUR" },
    { maxPrice: 84500, percent: 0.48, minRatePerCc: 7.5, label: "42 300,01 - 84 500 EUR" },
    { maxPrice: 169000, percent: 0.48, minRatePerCc: 15, label: "84 500,01 - 169 000 EUR" },
    { maxPrice: Infinity, percent: 0.48, minRatePerCc: 20, label: "price-gt-169000" }
  ],
  from3to5: [
    { maxVolume: 1000, ratePerCc: 1.5, label: "volume-lte-1000" },
    { maxVolume: 1500, ratePerCc: 1.7, label: "volume-1000-1500" },
    { maxVolume: 1800, ratePerCc: 2.5, label: "volume-1500-1800" },
    { maxVolume: 2300, ratePerCc: 2.7, label: "volume-1800-2300" },
    { maxVolume: 3000, ratePerCc: 3, label: "volume-2300-3000" },
    { maxVolume: Infinity, ratePerCc: 3.6, label: "volume-gt-3000" }
  ],
  over5: [
    { maxVolume: 1000, ratePerCc: 3, label: "volume-lte-1000" },
    { maxVolume: 1500, ratePerCc: 3.2, label: "volume-1000-1500" },
    { maxVolume: 1800, ratePerCc: 3.5, label: "volume-1500-1800" },
    { maxVolume: 2300, ratePerCc: 4.8, label: "volume-1800-2300" },
    { maxVolume: 3000, ratePerCc: 5, label: "volume-2300-3000" },
    { maxVolume: Infinity, ratePerCc: 5.7, label: "volume-gt-3000" }
  ]
};

export const CALCULATOR_CONFIG = {
  supportedFuelTypes: ["petrol", "diesel"],
  currencyRatesToEur: {
    EUR: 1,
    PLN: null
  },
  additionalCosts: {
    recyclingFee: null,
    customsFee: null,
    declarant: null,
    temporaryStorage: null,
    epts: null,
    other: null
  },
  companyFee: {
    thresholdEur: 15000,
    flatBelowThresholdEur: 350,
    percentAtOrAboveThreshold: 0.025
  }
};
