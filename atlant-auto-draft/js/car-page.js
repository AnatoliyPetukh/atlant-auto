const carSlug = document.body.dataset.carSlug;
const car = (window.ATLANT_CARS || []).find((item) => item.slug === carSlug);
const format = window.CarFormat;
const root = document.getElementById("carPage");

function item(label, value) {
  return format.present(value) ? `<div><dt>${label}</dt><dd>${value}</dd></div>` : "";
}

function section(title, content, className = "") {
  return content ? `<section class="car-section ${className}"><h2>${title}</h2>${content}</section>` : "";
}

function equipment(car) {
  const groups = Object.entries(car.equipment || {}).filter(([, values]) => values && values.length);
  if (!groups.length) return "";
  return groups.map(([group, values]) => `<div><h3>${format.labels.equipment[group] || group}</h3><ul>${values.map((value) => `<li>${value}</li>`).join("")}</ul></div>`).join("");
}

function service(car) {
  if (car.serviceHistory && car.serviceHistory.length) {
    return `<ol class="timeline">${car.serviceHistory.map((entry) => `<li><strong>${format.date(entry.date)}</strong>${format.present(entry.mileageKm) ? `<span>${format.mileage(entry.mileageKm)}</span>` : ""}<p>${entry.work}</p></li>`).join("")}</ol>`;
  }
  return `<p>${car.serviceHistoryNote || "Подробная сервисная история в доступных исходных данных отсутствует."}</p>`;
}

function documentBlock(document) {
  if (!document || !document.file) return "";
  return `<div class="document-card"><div><strong>${document.title || "Инспекционный отчёт"}</strong><small>${document.type || "application/pdf"}${document.size ? ` · ${document.size}` : ""}</small></div><div><a class="small-button" href="${document.file}" target="_blank" rel="noopener">Открыть</a><a class="small-button" href="${document.file}" download>Скачать</a></div></div>`;
}

function documents(car) {
  const availableDocuments = car.documents && car.documents.length
    ? car.documents
    : [car.inspectionDocument].filter(Boolean);
  return availableDocuments.map(documentBlock).join("");
}

if (!car) {
  root.innerHTML = `<section class="car-section"><h1>Автомобиль не найден</h1><a href="../index.html#cars">Вернуться в каталог</a></section>`;
} else {
  document.title = `${format.title(car)} — Atlant Auto`;
  const images = car.images && car.images.length ? car.images : [car.mainImage];
  root.innerHTML = `
    <a class="back-link" href="../index.html#cars">← Вернуться в каталог</a>
    <section class="car-hero">
      <div class="car-gallery">
        <img id="mainCarImage" class="car-gallery-main" src="${images[0]}" alt="${format.title(car)}">
        ${images.length > 1 ? `<div class="car-thumbs">${images.map((image, index) => `<button type="button" data-image="${image}" aria-label="Фото ${index + 1}"><img src="${image}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="car-summary">
        <span class="badge static ${car.status === "sold" ? "sold" : ""}">${format.labels.status[car.status]}</span>
        <h1>${format.title(car)}</h1>
        <p class="detail-price">${format.price(car)}</p>
        <a class="button primary" href="../index.html#request">Запросить расчёт</a>
      </div>
    </section>
    ${car.description && car.description.ru ? section("Об автомобиле", `<p class="car-description">${car.description.ru}</p>`) : ""}
    ${section("Основные характеристики", `<dl class="detail-grid">
      ${item("Дата производства", format.date(car.productionDate))}
      ${item("Первая регистрация", format.date(car.firstRegistrationDate))}
      ${item("Пробег", format.mileage(car.mileageKm))}
      ${item("Кузов", car.bodyType)}${item("Цвет", car.color)}${item("Двери", car.doors)}
      ${item("Места", car.seats)}${item("VIN", car.vin)}${item("Ключи", car.keysCount)}
      ${item("Регистрационный номер", car.registrationNumber)}${item("Страна регистрации", car.registrationCountry)}
      ${item("Источник", car.vehicleSource)}
    </dl>`)}
    ${section("Двигатель и трансмиссия", `<dl class="detail-grid">
      ${item("Топливо", format.labels.fuelType[car.fuelType])}${item("Объём двигателя", format.engine(car.engineCapacityCc))}
      ${item("Мощность", format.present(car.powerKw) ? `${car.powerKw} кВт` : "")}${item("Мощность", format.present(car.powerHp) ? `${car.powerHp} л.с.` : "")}
      ${item("Коробка передач", format.labels.transmission[car.transmission])}${item("Привод", car.driveType)}
      ${item("Экологический стандарт", car.emissionStandard)}${item("CO₂", format.present(car.co2GKm) ? `${car.co2GKm} г/км` : "")}
    </dl>`)}
    ${section("Комплектация", `<div class="equipment-grid">${equipment(car)}</div>`)}
    ${section("История обслуживания", service(car))}
    ${car.wheelsAndTyres && Object.keys(car.wheelsAndTyres).length ? section("Шины и колёса", `<dl class="detail-grid">${Object.entries(car.wheelsAndTyres).map(([key, value]) => item(key, value)).join("")}</dl>`) : ""}
    ${car.condition && Object.keys(car.condition).length ? section("Состояние автомобиля", `<dl class="detail-grid">${Object.entries(car.condition).map(([key, value]) => item(key, value)).join("")}</dl>`) : ""}
    ${documents(car) ? section("Документы", documents(car)) : ""}`;

  root.querySelectorAll("[data-image]").forEach((button) => button.addEventListener("click", () => {
    root.querySelector("#mainCarImage").src = button.dataset.image;
  }));
}
