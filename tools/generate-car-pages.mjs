import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { site } from "./seo-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");
const source = fs.readFileSync(path.join(root, "data/cars.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const cars = context.window.ATLANT_CARS;
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const title = (car) => [car.brand, car.model, car.version].filter(Boolean).join(" ");
const fuel = { petrol: "Бензин", diesel: "Дизель", hybrid: "Гибрид", electric: "Электромобиль" };
const transmission = { manual: "Механическая", automatic: "Автоматическая" };
const price = (car) => car.price ? `${new Intl.NumberFormat("ru-RU").format(car.price)} ${car.currency}` : "Цена по запросу";
const date = (value) => value ? new Intl.DateTimeFormat("ru-RU").format(new Date(`${value}T00:00:00Z`)) : "";
const mileage = (value) => value ? `${new Intl.NumberFormat("ru-RU").format(value)} км` : "";
const groupNames = { comfort: "Комфорт", safety: "Безопасность", multimedia: "Мультимедиа", driverAssistance: "Помощь водителю", interior: "Салон", exterior: "Экстерьер" };

function item(label, value) {
  return value !== null && value !== undefined && value !== "" ? `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>` : "";
}

function vehicleSchema(car) {
  const route = `/cars/${car.slug}.html`;
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Product", "Vehicle"],
    "@id": `${site.origin}${route}#vehicle`,
    name: title(car),
    description: car.description?.ru || `${title(car)} в каталоге Atlant Auto.`,
    url: `${site.origin}${route}`,
    image: (car.images || [car.mainImage]).map((image) => `${site.origin}/${image.replace("../", "")}`),
    sku: car.id,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleIdentificationNumber: car.vin,
    vehicleModelDate: car.firstRegistrationDate?.slice(0, 4),
    mileageFromOdometer: car.mileageKm ? { "@type": "QuantitativeValue", value: car.mileageKm, unitCode: "KMT" } : undefined,
    fuelType: fuel[car.fuelType],
    vehicleTransmission: transmission[car.transmission],
    vehicleConfiguration: car.version,
    offers: car.price ? {
      "@type": "Offer",
      price: car.price,
      priceCurrency: car.currency,
      availability: "https://schema.org/InStock",
      url: `${site.origin}${route}`,
      seller: { "@id": `${site.origin}/#organization` }
    } : undefined
  };
  return JSON.stringify(schema).replaceAll("<", "\\u003c");
}

function carHtml(car) {
  const carTitle = title(car);
  const route = `/cars/${car.slug}.html`;
  const description = car.description?.ru || `${carTitle}: фотографии, характеристики и доступные документы автомобиля в каталоге Atlant Auto.`;
  const images = car.images?.length ? car.images : [car.mainImage];
  const equipment = Object.entries(car.equipment || {}).filter(([, values]) => values?.length).map(([group, values]) =>
    `<div><h3>${groupNames[group] || esc(group)}</h3><ul>${values.map((value) => `<li>${esc(value)}</li>`).join("")}</ul></div>`
  ).join("");
  const service = car.serviceHistory?.length
    ? `<ol class="timeline">${car.serviceHistory.map((entry) => `<li><strong>${date(entry.date)}</strong><span>${mileage(entry.mileageKm)}</span><p>${esc(entry.work)}</p></li>`).join("")}</ol>`
    : `<p>${esc(car.serviceHistoryNote || "Подробная сервисная история в доступных исходных данных отсутствует.")}</p>`;
  const condition = car.condition ? `<dl class="detail-grid">${Object.entries(car.condition).map(([key, value]) => item(key, value)).join("")}</dl>` : "";
  const documents = (car.documents?.length ? car.documents : [car.inspectionDocument].filter(Boolean)).map((document) =>
    `<div class="document-card"><div><strong>${esc(document.title)}</strong><small>${esc(document.type)}${document.size ? ` · ${esc(document.size)}` : ""}</small></div><div><a class="small-button" href="${esc(document.file)}" target="_blank" rel="noopener">Открыть</a><a class="small-button" href="${esc(document.file)}" download>Скачать</a></div></div>`
  ).join("");
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(carTitle)} | Atlant Auto</title>
  <meta name="description" content="${esc(description.slice(0, 158))}">
  <link rel="canonical" href="${site.origin}${route}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Atlant Auto">
  <meta property="og:title" content="${esc(carTitle)}">
  <meta property="og:description" content="${esc(description.slice(0, 180))}">
  <meta property="og:url" content="${site.origin}${route}">
  <meta property="og:image" content="${site.origin}/${car.mainImage.replace("../", "")}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <script type="application/ld+json">${vehicleSchema(car)}</script>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/" aria-label="Atlant Auto"><span class="brand-mark">AA</span><span><strong>Atlant Auto</strong><small>Warszawa</small></span></a>
    <nav class="nav" aria-label="Главная навигация"><a href="/avtomobili/">Автомобили</a><a href="/kak-my-rabotaem/">Как мы работаем</a><a href="/kalkulator/">Калькулятор</a><a href="/kontakty/">Контакты</a></nav>
    <a class="top-action" href="${site.telegram}">Telegram</a>
  </header>
  <main class="car-page-main">
    <nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span>/</span><a href="/avtomobili/">Автомобили</a><span>/</span><span>${esc(carTitle)}</span></nav>
    <section class="car-hero">
      <div class="car-gallery">
        <img id="mainCarImage" class="car-gallery-main" src="${esc(images[0])}" alt="${esc(carTitle)} — основной вид" width="1280" height="960">
        ${images.length > 1 ? `<div class="car-thumbs">${images.map((image, index) => `<button type="button" data-image="${esc(image)}" aria-label="Показать фото ${index + 1}"><img src="${esc(image)}" alt="${esc(carTitle)} — фото ${index + 1}" width="160" height="120" loading="lazy"></button>`).join("")}</div>` : ""}
      </div>
      <div class="car-summary"><span class="badge static">В продаже</span><h1>${esc(carTitle)}</h1><p class="detail-price">${price(car)}</p><a class="button primary" href="/kontakty/">Запросить расчёт</a></div>
    </section>
    ${description ? `<section class="car-section"><h2>Об автомобиле</h2><p class="car-description">${esc(description)}</p></section>` : ""}
    <section class="car-section"><h2>Основные характеристики</h2><dl class="detail-grid">
      ${item("Первая регистрация", date(car.firstRegistrationDate))}${item("Пробег", mileage(car.mileageKm))}${item("Кузов", car.bodyType)}${item("Цвет", car.color)}
      ${item("Двери", car.doors)}${item("Места", car.seats)}${item("VIN", car.vin)}${item("Регистрационный номер", car.registrationNumber)}
    </dl></section>
    <section class="car-section"><h2>Двигатель и трансмиссия</h2><dl class="detail-grid">
      ${item("Топливо", fuel[car.fuelType])}${item("Объём двигателя", car.engineCapacityCc ? `${car.engineCapacityCc} см³` : "")}${item("Мощность", car.powerHp ? `${car.powerHp} л.с.` : "")}
      ${item("Коробка передач", transmission[car.transmission])}${item("Привод", car.driveType)}${item("Экологический стандарт", car.emissionStandard)}
    </dl></section>
    ${equipment ? `<section class="car-section"><h2>Комплектация</h2><div class="equipment-grid">${equipment}</div></section>` : ""}
    <section class="car-section"><h2>История обслуживания</h2>${service}</section>
    ${condition ? `<section class="car-section"><h2>Состояние автомобиля</h2>${condition}</section>` : ""}
    ${documents ? `<section class="car-section"><h2>Документы</h2>${documents}</section>` : ""}
  </main>
  <footer class="footer"><div><a class="brand footer-brand" href="/"><span class="brand-mark">AA</span><span><strong>Atlant Auto</strong><small>${site.legalName}</small></span></a><p>Автомобили из Европы под ключ.</p></div><address><a href="tel:+48515392420">${site.phone}</a><a href="mailto:${site.email}">${site.email}</a><span>${site.address}</span></address></footer>
  <script>document.querySelectorAll("[data-image]").forEach((button)=>button.addEventListener("click",()=>{document.querySelector("#mainCarImage").src=button.dataset.image;}));</script>
</body>
</html>`;
}

for (const car of cars) {
  fs.writeFileSync(path.join(root, "cars", `${car.slug}.html`), carHtml(car), "utf8");
}
console.log(`Generated ${cars.length} static vehicle pages.`);
