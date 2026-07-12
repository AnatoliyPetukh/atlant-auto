const ids = [
  "vehicle", "year", "registrationDate", "mileage", "fuel", "power",
  "gearbox", "drive", "color", "vin", "keys", "auctionDate", "price",
  "equipment", "maintenance"
];
const fields = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const pdfInput = document.getElementById("pdfInput");
const auctionInput = document.getElementById("auction");
const workspace = document.getElementById("workspace");
const notice = document.getElementById("notice");
const preview = document.getElementById("postPreview");
const telegramButton = document.getElementById("telegramButton");
const AI_ENDPOINT = window.AUCTION_CONFIG?.aiEndpoint || "parse-auction.php";
let lastPdfText = "";

const monthMap = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
};

pdfInput.addEventListener("change", () => handlePdf(pdfInput.files[0]));
auctionInput.addEventListener("change", () => {
  const isOther = auctionInput.value === "other";
  document.getElementById("auctionHelp").textContent = isOther
    ? "Для этого формата потребуется образец PDF и отдельный обработчик."
    : "Сейчас настроен обработчик ARVAL. Новые форматы добавляются отдельно.";
});
ids.forEach((id) => fields[id].addEventListener("input", renderPost));

const drop = document.getElementById("pdfDrop");
["dragenter", "dragover"].forEach((event) => drop.addEventListener(event, (e) => {
  e.preventDefault();
  drop.classList.add("drag");
}));
["dragleave", "drop"].forEach((event) => drop.addEventListener(event, (e) => {
  e.preventDefault();
  drop.classList.remove("drag");
}));
drop.addEventListener("drop", (e) => {
  const file = [...e.dataTransfer.files].find((item) => item.type === "application/pdf");
  if (file) handlePdf(file);
});

async function handlePdf(file) {
  if (!file) return;
  document.getElementById("pdfName").textContent = file.name;
  showNotice("Читаю документ…", false);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pages = await extractPdfText(bytes);
    if (!pages.length) throw new Error("В документе не найден текст");
    lastPdfText = pages.join("\n\n--- page ---\n\n");
    const processor = resolveProcessor(auctionInput.value, pages);
    if (!processor) {
      throw new Error("Для выбранного аукциона обработчик ещё не настроен");
    }
    auctionInput.value = processor.id;
    const parsed = processor.parse(pages);
    fillFields(parsed);
    workspace.hidden = false;
    telegramButton.disabled = false;
    showNotice(
      "PDF обработан. Проверьте распознанные значения и заполните дату аукциона и цену.",
      false
    );
    workspace.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error(error);
    showNotice(
      "Не удалось прочитать этот PDF. Возможно, это скан без текстового слоя или другой формат документа.",
      true
    );
  }
}

const auctionProcessors = [
  {
    id: "arval",
    name: "ARVAL ItemPrint",
    detect: (pages) => /Vehicle Category[\s\S]+Main characteristics/i.test(pages[0] || ""),
    parse: parseAuctionPdf
  }
];

function resolveProcessor(selected, pages) {
  if (selected !== "auto") {
    return auctionProcessors.find((processor) => processor.id === selected);
  }
  return auctionProcessors.find((processor) => processor.detect(pages));
}

async function extractPdfText(bytes) {
  const source = new TextDecoder("windows-1252").decode(bytes);
  const pages = [];
  let cursor = 0;

  while (cursor < source.length) {
    const marker = source.indexOf("stream", cursor);
    if (marker < 0) break;

    const dictionaryStart = source.lastIndexOf("<<", marker);
    const dictionary = source.slice(dictionaryStart, marker);
    let dataStart = marker + 6;
    if (source[dataStart] === "\r") dataStart += 1;
    if (source[dataStart] === "\n") dataStart += 1;
    const dataEnd = source.indexOf("endstream", dataStart);
    if (dataEnd < 0) break;

    if (/FlateDecode/.test(dictionary)) {
      const compressed = bytes.slice(dataStart, trimStreamEnd(bytes, dataStart, dataEnd));
      try {
        const stream = new Blob([compressed])
          .stream()
          .pipeThrough(new DecompressionStream("deflate"));
        const inflated = new Uint8Array(await new Response(stream).arrayBuffer());
        const content = new TextDecoder("windows-1252").decode(inflated);
        if (/\bBT\b/.test(content)) {
          const text = extractPdfStrings(content);
          if (text.trim()) pages.push(text);
        }
      } catch {
        // Некоторые служебные потоки могут использовать иной вариант сжатия.
      }
    }
    cursor = dataEnd + 9;
  }

  return pages;
}

function trimStreamEnd(bytes, start, end) {
  let result = end;
  while (result > start && (bytes[result - 1] === 10 || bytes[result - 1] === 13)) {
    result -= 1;
  }
  return result;
}

function extractPdfStrings(content) {
  const values = [];
  const literalPattern = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const arrayPattern = /\[((?:.|\n)*?)\]\s*TJ/g;
  let result;

  while ((result = literalPattern.exec(content))) {
    values.push(decodePdfString(result[1]));
  }
  while ((result = arrayPattern.exec(content))) {
    const parts = [...result[1].matchAll(/\(((?:\\.|[^\\()])*)\)/g)];
    values.push(parts.map((part) => decodePdfString(part[1])).join(""));
  }
  return values.join(" ").replace(/\s+/g, " ").trim();
}

function decodePdfString(value) {
  return value
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([\\()])/g, "$1")
    .replace(/\\\r?\n/g, "");
}

function parseAuctionPdf(pages) {
  const first = pages[0] || "";
  const all = pages.join(" ");
  const title = first.split(/\s+Vehicle Category/i)[0].trim();
  const brand = match(first, /Main characteristics\s+([A-Za-zÀ-ÿ-]+)\s+Brand/i);
  const powerKw = match(first, /Power\s+([A-Z0-9]{17})[\s\S]*?(\d{2,3})\s*KW/i, 2)
    || match(first, /(\d{2,3})\s*KW/i);
  const vin = match(first, /\b([A-HJ-NPR-Z0-9]{17})\b/i);
  const mileage = match(first, /([\d,.]+)\s*km/i);
  const registration = match(first, /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})\b/i, 0);
  const year = match(all, /Year of production\s+(?:Model year\s+Number of doors\s+Steering left side\s+)?(?:[A-Z0-9-]+\s+)?(20\d{2})/i)
    || match(title, /\b(20\d{2})\b/);
  const engine = match(all, /([\d,]+)\s*cm3\s+Engine Size/i);
  const fuel = inferFuel(first);
  const color = match(first, /Paint Color\/Carmaker Color\s+(?:\d+\s*KW\s+)?(?:Vehicle Identification Number\s+)?(.+?)\s+General Information/i);
  const keys = match(first, /Number of Keys\s+(\d+)/i);
  const equipment = extractEquipment(all);
  const maintenance = extractMaintenance(pages.find((page) => /MAINTENANCE HISTORY/i.test(page)) || "");

  return {
    vehicle: cleanTitle(title, brand),
    year,
    registrationDate: registration ? formatRegistration(registration) : "",
    mileage: mileage ? `${normalizeNumber(mileage)} км` : "",
    fuel,
    power: powerKw ? `${powerKw} кВт${kwToHp(powerKw)}` : "",
    gearbox: /Automatic/i.test(first) ? "Автомат" : "",
    drive: /4 wheel drive\s+(?:Electric\s+)?[\d,]+\s*cm3[\s\S]*?Yes/i.test(all) ? "Полный" : "Передний",
    color: translateColor(color?.replace(/\s*\/\s*.*/, "").trim() || ""),
    vin: vin || "",
    keys: keys || "",
    equipment,
    maintenance
  };
}

function inferFuel(text) {
  if (/Petrol\s*\+\s*Elect/i.test(text)) return "Подключаемый гибрид";
  if (/Diesel/i.test(text)) return "Дизель";
  if (/Electric/i.test(text) && !/Petrol/i.test(text)) return "Электро";
  if (/Petrol/i.test(text)) return "Бензин";
  return "";
}

function extractEquipment(text) {
  const labels = [
    ["M Sport", /m sport/i],
    ["цифровая приборная панель", /Virtual Dashboard/i],
    ["климат-контроль", /Automatic air-conditionning/i],
    ["электрорегулировка сидений", /Electrically adjustable seats/i],
    ["подогрев сидений", /Heated seats/i],
    ["кожаный салон", /Leather upholstery/i],
    ["контроль слепых зон", /Dead angle assistant/i],
    ["задний парктроник", /Rear parking aid/i],
    ["электропривод багажника", /Electric boot\/hatchback/i],
    ["бесключевой доступ", /Keyless access/i],
    ["LED-фары", /Led headlamp/i],
    ["фаркоп", /Tow-bar/i],
    ["легкосплавные диски", /Alloy wheels/i],
    ["экстренное торможение", /Active Brake-Assist/i]
  ];
  return labels.filter(([, pattern]) => pattern.test(text)).map(([label]) => label).join(", ");
}

function extractMaintenance(page) {
  if (!page) return "";
  const records = [...page.matchAll(/\b([A-Z][a-z]{2}-\d{2})\s+(?:(null)|([\d,.]+)\s*km)\s+(.+?)(?=\s+[A-Z][a-z]{2}-\d{2}\s+|$)/g)];
  return records.map((record) => {
    const mileage = record[2] ? "пробег не указан" : `${normalizeNumber(record[3])} км`;
    return `${formatRegistration(record[1])}, ${mileage}: ${record[4].trim()}`;
  }).join("\n");
}

function cleanTitle(value, brand) {
  let result = value
    .replace(/\(TOTAL OPTIONS:[^)]+\)/i, "")
    .replace(/\b(\d+)CV\b/i, "$1 л.с.")
    .replace(/\s+/g, " ")
    .trim();
  if (brand && !result.toLowerCase().startsWith(brand.toLowerCase())) {
    result = `${brand} ${result}`;
  }
  return result
    .replace(/\bALLURE\b/g, "Allure")
    .replace(/\bPURETECH\b/g, "PureTech");
}

function translateColor(value) {
  const colors = {
    Grey: "Серый",
    Gray: "Серый",
    Blue: "Синий",
    Black: "Чёрный",
    White: "Белый",
    Red: "Красный",
    Silver: "Серебристый",
    Green: "Зелёный",
    Brown: "Коричневый"
  };
  return colors[value] || value;
}

function match(text, pattern, group = 1) {
  return text.match(pattern)?.[group]?.trim() || "";
}

function formatRegistration(value) {
  const result = value.match(/([A-Z][a-z]{2})-(\d{2})/);
  return result ? `${monthMap[result[1]]}/20${result[2]}` : value;
}

function normalizeNumber(value) {
  return String(value).replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
}

function kwToHp(value) {
  const hp = Math.round(Number(value) * 1.35962);
  return Number.isFinite(hp) ? ` / ≈${hp} л.с.` : "";
}

function fillFields(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (fields[key]) fields[key].value = value || "";
  });
  renderPost();
}

function renderPost() {
  const v = Object.fromEntries(ids.map((id) => [id, fields[id].value.trim()]));
  const auction = v.auctionDate
    ? new Date(`${v.auctionDate}T12:00:00`).toLocaleDateString("ru-RU")
    : "уточняется";

  preview.textContent = [
    "🔥 СКОРО НА АУКЦИОНЕ",
    "",
    `🚘 ${v.vehicle || "Автомобиль"}`,
    v.year && `📅 ${v.year} год${v.registrationDate ? ` · первая регистрация ${v.registrationDate}` : ""}`,
    v.mileage && `🛣 Пробег: ${v.mileage}`,
    v.fuel && `⛽ ${v.fuel}`,
    v.power && `💪 Мощность: ${v.power}`,
    (v.gearbox || v.drive) && `⚙️ ${[v.gearbox, v.drive && `${v.drive} привод`].filter(Boolean).join(" · ")}`,
    v.color && `🎨 ${v.color}`,
    v.keys && `🔑 Ключей: ${v.keys}`,
    "",
    v.equipment && `В комплектации: ${v.equipment}.`,
    v.maintenance && `\n✅ История обслуживания:\n${maintenanceHighlight(v.maintenance)}`,
    "",
    `📆 Дата аукциона: ${auction}`,
    `💰 Цена: ${v.price || "уточняется"}`,
    "",
    "Для расчёта итоговой стоимости и участия в торгах — пишите менеджеру."
  ].filter((line) => line !== false && line !== "").join("\n").replace(/\n{3,}/g, "\n\n");
}

function maintenanceHighlight(value) {
  const lines = value
    .split(/\n+/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);

  if (!lines.length) return "";

  const important = lines.filter((line) =>
    /грм|ремен|courroie|distribution|масл|фильтр|свеч|тормоз|колод|аккумулятор|шин|liquide|revision|vidange|service|то\b/i.test(line)
  );

  const selected = (important.length ? important : lines).slice(0, 6);
  const restCount = lines.length - selected.length;
  const suffix = restCount > 0 ? `\n…и ещё ${restCount} запис${restCount === 1 ? "ь" : "ей"} по обслуживанию.` : "";

  return selected.map((line) => `• ${line}`).join("\n") + suffix;
}

document.getElementById("copyButton").addEventListener("click", async () => {
  await navigator.clipboard.writeText(preview.textContent);
  const button = document.getElementById("copyButton");
  button.textContent = "Скопировано ✓";
  setTimeout(() => { button.textContent = "Скопировать текст"; }, 1600);
});

telegramButton.textContent = "Улучшить через AI";
telegramButton.disabled = true;
telegramButton.addEventListener("click", improveWithAi);

async function improveWithAi() {
  if (!lastPdfText.trim()) {
    showNotice("Сначала загрузите PDF — AI нужен текст документа.", true);
    return;
  }

  const originalLabel = telegramButton.textContent;
  telegramButton.disabled = true;
  telegramButton.textContent = "AI обрабатывает…";

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auction: auctionInput.value,
        language: "ru",
        text: lastPdfText
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `API вернул ошибку ${response.status}`);
    }

    applyAiData(result.data || {});
    showNotice("AI обработал PDF. Проверьте поля и скопируйте текст для Telegram.", false);
    telegramButton.textContent = "AI готов ✓";
  } catch (error) {
    console.error(error);
    showNotice(`AI обработка пока не сработала: ${error.message}`, true);
    telegramButton.textContent = originalLabel;
  } finally {
    setTimeout(() => {
      telegramButton.disabled = false;
      telegramButton.textContent = originalLabel;
    }, 2200);
  }
}

function applyAiData(data) {
  const vehicle = [data.make, data.model, data.version].filter(isKnown).join(" ");
  fields.vehicle.value = vehicle || fields.vehicle.value;
  fields.year.value = isKnown(data.year) ? data.year : fields.year.value;
  fields.registrationDate.value = isKnown(data.first_registration) ? data.first_registration : fields.registrationDate.value;
  fields.mileage.value = isKnown(data.mileage_km) ? data.mileage_km : fields.mileage.value;
  fields.fuel.value = isKnown(data.fuel) ? data.fuel : fields.fuel.value;

  const powerParts = [];
  if (isKnown(data.power_kw)) powerParts.push(`${data.power_kw} кВт`);
  if (isKnown(data.power_hp)) powerParts.push(`≈${data.power_hp} л.с.`);
  if (powerParts.length) fields.power.value = powerParts.join(" / ");

  fields.gearbox.value = isKnown(data.transmission) ? data.transmission : fields.gearbox.value;
  fields.drive.value = isKnown(data.drive) ? data.drive : fields.drive.value;
  fields.color.value = isKnown(data.color) ? data.color : fields.color.value;
  fields.vin.value = isKnown(data.vin) ? data.vin : fields.vin.value;
  fields.keys.value = isKnown(data.keys_count) ? data.keys_count : fields.keys.value;
  fields.equipment.value = isKnown(data.equipment) ? data.equipment : fields.equipment.value;

  const maintenance = [data.service_history, data.timing_belt].filter(isKnown).join("\n");
  if (maintenance) fields.maintenance.value = maintenance;

  const dateForInput = normalizeDateForInput(data.auction_date);
  if (dateForInput) fields.auctionDate.value = dateForInput;
  fields.price.value = isKnown(data.price) ? data.price : fields.price.value;

  renderPost();
}

function isKnown(value) {
  const text = String(value || "").trim();
  return text && !/^уточняется$/i.test(text) && !/^null$/i.test(text);
}

function normalizeDateForInput(value) {
  if (!isKnown(value)) return "";
  const text = String(value).trim();
  let matchDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchDate) return text;
  matchDate = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (matchDate) {
    const [, day, month, year] = matchDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return "";
}

document.getElementById("downloadButton").addEventListener("click", () => {
  const data = Object.fromEntries(ids.map((id) => [id, fields[id].value]));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "auction-car.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

function showNotice(message, isError) {
  notice.hidden = false;
  notice.textContent = message;
  notice.style.background = isError ? "#ffe2dd" : "#fff0e9";
}

renderPost();
