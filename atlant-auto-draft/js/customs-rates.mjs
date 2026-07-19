export const CUSTOMS_RATE_SOURCES = [
  {
    sourceUrl: "https://goldenmotors.by/blog/poshliny-i-sbory/",
    sourceTitle: "Golden Motors: Пошлины и сборы",
    verifiedAt: "2026-07-12",
    verificationStatus: "commercial_reference"
  },
  {
    sourceUrl: "https://www.customs.gov.by/calc/",
    sourceTitle: "Таможенный калькулятор Республики Беларусь",
    verifiedAt: "2026-07-12",
    verificationStatus: "official_reference"
  },
  {
    sourceUrl: "https://www.customs.gov.by/fizicheskim-litsam/vvoz-tovarov-dlya-lichnogo-polzovaniya-s-uplatoy-tamozhennykh-platezhey/",
    sourceTitle: "Ввоз товаров для личного пользования с уплатой таможенных платежей",
    verifiedAt: "2026-07-12",
    verificationStatus: "official_reference"
  }
];

export const CUSTOMS_RATE_TABLES = {
  under3: [
    { maxPrice: 8500, percent: 0.54, minRatePerCc: 2.5, label: "до 8 500 EUR" },
    { maxPrice: 16700, percent: 0.48, minRatePerCc: 3.5, label: "8 500,01 - 16 700 EUR" },
    { maxPrice: 42300, percent: 0.48, minRatePerCc: 5.5, label: "16 700,01 - 42 300 EUR" },
    { maxPrice: 84500, percent: 0.48, minRatePerCc: 7.5, label: "42 300,01 - 84 500 EUR" },
    { maxPrice: 169000, percent: 0.48, minRatePerCc: 15, label: "84 500,01 - 169 000 EUR" },
    { maxPrice: Infinity, percent: 0.48, minRatePerCc: 20, label: "более 169 000 EUR" }
  ],
  from3to5: [
    { maxVolume: 1000, ratePerCc: 1.5, label: "до 1 000 см3 включительно" },
    { maxVolume: 1500, ratePerCc: 1.7, label: "1 000,01 - 1 500 см3" },
    { maxVolume: 1800, ratePerCc: 2.5, label: "1 500,01 - 1 800 см3" },
    { maxVolume: 2300, ratePerCc: 2.7, label: "1 800,01 - 2 300 см3" },
    { maxVolume: 3000, ratePerCc: 3, label: "2 300,01 - 3 000 см3" },
    { maxVolume: Infinity, ratePerCc: 3.6, label: "более 3 000 см3" }
  ],
  over5: [
    { maxVolume: 1000, ratePerCc: 3, label: "до 1 000 см3 включительно" },
    { maxVolume: 1500, ratePerCc: 3.2, label: "1 000,01 - 1 500 см3" },
    { maxVolume: 1800, ratePerCc: 3.5, label: "1 500,01 - 1 800 см3" },
    { maxVolume: 2300, ratePerCc: 4.8, label: "1 800,01 - 2 300 см3" },
    { maxVolume: 3000, ratePerCc: 5, label: "2 300,01 - 3 000 см3" },
    { maxVolume: Infinity, ratePerCc: 5.7, label: "более 3 000 см3" }
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
