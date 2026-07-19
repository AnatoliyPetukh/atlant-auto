import { CUSTOMS_RATE_SOURCES } from "./customs-rates.mjs";
import { calculateCustomsQuote } from "./customs-calculator.mjs";

const form = document.getElementById("customsCalculatorForm");
const result = document.getElementById("customsCalculatorResult");
const advancedToggle = document.getElementById("advancedToggle");
const advancedPanel = document.getElementById("advancedPanel");
const configuration = JSON.parse(document.getElementById("calculatorMessages")?.textContent || "{}");
const locale = configuration.locale || "ru";
const messages = configuration.messages || {};
const msg = (key) => messages[key] || key;
const numberLocale = locale === "ru" ? "ru-RU" : locale === "pl" ? "pl-PL" : "en-GB";

function money(value, currency = "EUR") {
  if (value === null || value === undefined) return msg("calculator.result.notIncluded");
  return `${new Intl.NumberFormat(numberLocale, { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value)} ${currency}`;
}

function readNumber(formData, name) {
  const value = formData.get(name);
  return value === "" || value === null ? null : Number(value);
}

function renderLine(labelKey, value, currency = "EUR") {
  return `<div class="calc-line"><span>${msg(labelKey)}</span><strong>${money(value, currency)}</strong></div>`;
}

function renderSources() {
  return CUSTOMS_RATE_SOURCES.map((source) => {
    const hostname = new URL(source.sourceUrl).hostname.replace(/^www\./, "");
    return `<li><a href="${source.sourceUrl}" target="_blank" rel="noopener">${hostname}</a><span>${source.verifiedAt}</span></li>`;
  }).join("");
}

function readQuoteInput() {
  const formData = new FormData(form);
  return {
    price: readNumber(formData, "price"),
    currency: formData.get("currency"),
    releaseMonth: readNumber(formData, "releaseMonth"),
    releaseYear: readNumber(formData, "releaseYear"),
    volumeCc: readNumber(formData, "volumeCc"),
    engineType: formData.get("engineType"),
    clearanceMode: formData.get("clearanceMode"),
    includeFullBudget: formData.get("includeFullBudget") === "on",
    auctionFee: readNumber(formData, "auctionFee"),
    deliveryToWarsaw: readNumber(formData, "deliveryToWarsaw"),
    deliveryToBelarus: readNumber(formData, "deliveryToBelarus"),
    recyclingFee: readNumber(formData, "recyclingFee"),
    customsFee: readNumber(formData, "customsFee"),
    declarant: readNumber(formData, "declarant"),
    temporaryStorage: readNumber(formData, "temporaryStorage"),
    epts: readNumber(formData, "epts"),
    other: readNumber(formData, "other")
  };
}

function renderManualRequired() {
  result.innerHTML = `<div class="calc-total"><span>${msg("calculator.result.manualTitle")}</span><strong>${msg("calculator.result.reviewRequired")}</strong><small>${msg("calculator.result.manualNote")}</small></div>`;
}

function rateLabel(quote) {
  if (quote.ageCategory === "under3") return `${quote.rate.percent * 100}% / min ${quote.rate.minRatePerCc} EUR/cc`;
  return `${quote.rate.ratePerCc} EUR/cc`;
}

function formula(quote) {
  if (quote.ageCategory === "under3") return `max(${quote.rate.percent * 100}%, ${quote.rate.minRatePerCc} EUR/cc)`;
  return `${quote.rate.ratePerCc} EUR/cc × ${quote.rate.table === "from3to5" || quote.rate.table === "over5" ? form.elements.volumeCc.value : ""}`;
}

function renderQuote(quote) {
  const mainTotal = quote.includeFullBudget ? quote.fullBudgetTotal : quote.customsTotal;
  result.innerHTML = `
    <div class="calc-total">
      <span>${msg(quote.includeFullBudget ? "calculator.result.fullTotal" : "calculator.result.customsTotal")}</span>
      <strong>${money(mainTotal)}</strong>
      <small>${msg("calculator.result.ageCategory")}: ${msg(`calculator.age.${quote.ageCategory}`)}</small>
    </div>
    <div class="calc-lines">
      ${renderLine("calculator.result.vehiclePriceEur", quote.priceEur)}
      <div class="calc-line"><span>${msg("calculator.result.appliedRate")}</span><strong>${rateLabel(quote)}</strong></div>
      <div class="calc-line"><span>${msg("calculator.result.formula")}</span><strong>${formula(quote)}</strong></div>
      ${renderLine("calculator.result.standardDuty", quote.standardDuty)}
      ${renderLine("calculator.result.benefit", quote.benefitAmount)}
      ${renderLine("calculator.result.finalDuty", quote.finalDuty)}
      ${renderLine("calculator.cost.auctionFee", quote.additionalCosts.auctionFee)}
      ${renderLine("calculator.cost.deliveryToWarsaw", quote.additionalCosts.deliveryToWarsaw)}
      ${renderLine("calculator.cost.deliveryToBelarus", quote.additionalCosts.deliveryToBelarus)}
      ${renderLine("calculator.cost.recyclingFee", quote.additionalCosts.recyclingFee)}
      ${renderLine("calculator.cost.customsFee", quote.additionalCosts.customsFee)}
      ${renderLine("calculator.cost.declarant", quote.additionalCosts.declarant)}
      ${renderLine("calculator.cost.temporaryStorage", quote.additionalCosts.temporaryStorage)}
      ${renderLine("calculator.cost.epts", quote.additionalCosts.epts)}
      ${renderLine("calculator.cost.other", quote.additionalCosts.other)}
      ${renderLine("calculator.cost.companyFee", quote.companyFee)}
    </div>
    <p class="calc-note">${msg("calculator.result.benefitNote")}</p>
    <p class="calc-note">${msg("calculator.result.disclaimer")}</p>
    <ul class="calc-sources">${renderSources()}</ul>`;
}

function calculate() {
  try {
    const quote = calculateCustomsQuote(readQuoteInput());
    if (quote.status === "manual_required") return renderManualRequired();
    renderQuote(quote);
  } catch {
    result.innerHTML = `<div class="calc-total calc-total-warning"><span>${msg("calculator.error.checkData")}</span><strong>${msg("calculator.error.unavailable")}</strong><small>${msg("calculator.error.invalidInput")}</small></div>`;
  }
}

advancedToggle?.addEventListener("click", () => {
  const isOpen = advancedPanel.hasAttribute("hidden");
  advancedPanel.toggleAttribute("hidden", !isOpen);
  advancedToggle.setAttribute("aria-expanded", String(isOpen));
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});
if (form) calculate();
