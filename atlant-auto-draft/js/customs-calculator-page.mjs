import { CUSTOMS_RATE_SOURCES } from "./customs-rates.mjs";
import { calculateCustomsQuote } from "./customs-calculator.mjs";

const form = document.getElementById("customsCalculatorForm");
const result = document.getElementById("customsCalculatorResult");
const advancedToggle = document.getElementById("advancedToggle");
const advancedPanel = document.getElementById("advancedPanel");

function money(value, currency = "EUR") {
  if (value === null || value === undefined) return "Не включено в расчёт";
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value) + " " + currency;
}

function readNumber(formData, name) {
  const value = formData.get(name);
  return value === "" || value === null ? null : Number(value);
}

function renderLine(label, value, currency = "EUR") {
  return `<div class="calc-line"><span>${label}</span><strong>${money(value, currency)}</strong></div>`;
}

function renderSources() {
  return CUSTOMS_RATE_SOURCES.map((source) => `
    <li>
      <a href="${source.sourceUrl}" target="_blank" rel="noopener">${source.sourceTitle}</a>
      <span>${source.verificationStatus}, ${source.verifiedAt}</span>
    </li>
  `).join("");
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

function renderManualRequired(message) {
  result.innerHTML = `
    <div class="calc-total">
      <span>Индивидуальный расчёт</span>
      <strong>Нужна проверка</strong>
      <small>${message}</small>
    </div>
    <p class="calc-note">Для гибридов и электромобилей ставка не применяется автоматически без подтверждённой конфигурации.</p>
  `;
}

function renderQuote(quote) {
  const mainTotal = quote.includeFullBudget ? quote.fullBudgetTotal : quote.customsTotal;
  result.innerHTML = `
    <div class="calc-total">
      <span>${quote.includeFullBudget ? "Ориентировочная стоимость автомобиля под ключ" : "Ориентировочная стоимость растаможки"}</span>
      <strong>${money(mainTotal)}</strong>
      <small>Возрастная категория: ${quote.ageCategory === "under3" ? "до 3 лет включительно" : quote.ageCategory === "from3to5" ? "более 3, но не более 5 лет" : "более 5 лет"}</small>
    </div>
    <div class="calc-lines">
      ${renderLine("Стоимость автомобиля в EUR", quote.priceEur)}
      <div class="calc-line"><span>Применённая ставка</span><strong>${quote.appliedRate}</strong></div>
      <div class="calc-line"><span>Формула</span><strong>${quote.formula}</strong></div>
      ${renderLine("Таможенный платёж без льготы", quote.standardDuty)}
      ${renderLine("Размер льготы", quote.benefitAmount)}
      ${renderLine("Таможенный платёж после льготы", quote.finalDuty)}
      ${renderLine("Комиссия аукциона", quote.additionalCosts.auctionFee)}
      ${renderLine("Доставка до Варшавы", quote.additionalCosts.deliveryToWarsaw)}
      ${renderLine("Доставка в Беларусь", quote.additionalCosts.deliveryToBelarus)}
      ${renderLine("Утилизационный сбор", quote.additionalCosts.recyclingFee)}
      ${renderLine("Таможенный сбор", quote.additionalCosts.customsFee)}
      ${renderLine("Услуги декларанта", quote.additionalCosts.declarant)}
      ${renderLine("Склад временного хранения", quote.additionalCosts.temporaryStorage)}
      ${renderLine("Оформление ЭПТС", quote.additionalCosts.epts)}
      ${renderLine("Другие расходы", quote.additionalCosts.other)}
      ${renderLine("Комиссия ATLANT CAPITAL", quote.companyFee)}
    </div>
    <p class="calc-note">Льгота применяется только при наличии подтверждённого права. Калькулятор не проверяет право пользователя на льготу.</p>
    <p class="calc-note">${quote.disclaimer}</p>
    <ul class="calc-sources">${renderSources()}</ul>
  `;
}

function calculate() {
  try {
    const quote = calculateCustomsQuote(readQuoteInput());
    if (quote.status === "manual_required") {
      renderManualRequired(quote.message);
      return;
    }
    renderQuote(quote);
  } catch (error) {
    result.innerHTML = `
      <div class="calc-total calc-total-warning">
        <span>Проверьте данные</span>
        <strong>Расчёт невозможен</strong>
        <small>${error.message}</small>
      </div>
    `;
  }
}

if (advancedToggle && advancedPanel) {
  advancedToggle.addEventListener("click", () => {
    const isOpen = advancedPanel.hasAttribute("hidden");
    advancedPanel.toggleAttribute("hidden", !isOpen);
    advancedToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
  calculate();
}
