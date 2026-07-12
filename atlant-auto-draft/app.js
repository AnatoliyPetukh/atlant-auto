const cars = [
  {
    id: "peugeot-2008-gt-black-2026",
    status: "available",
    title: "Peugeot 2008 BlueHDi 130 EAT8 GT",
    images: [
      "assets/cars/peugeot-2008-gt-black-1.jpg",
      "assets/cars/peugeot-2008-gt-black-2.jpg"
    ],
    price: "Цена по запросу",
    mileage: "173 609 км",
    date: "01.2023",
    engine: "1.5 BlueHDi, дизель, автомат",
    summary: "Черный Peugeot 2008 GT с коробкой EAT8. По инспекции: 131 PS, 5 мест, 2 ключа, навигация, круиз-контроль, датчик дождя, Bluetooth, спортивные сиденья и тонированные стекла. Последнее обслуживание 10.02.2026 на 167 800 км, техосмотр до 29.01.2027.",
    highlights: ["GT", "EAT8", "2 ключа", "Сервис 10.02.2026"]
  },
  {
    id: "peugeot-3008-blue-2026",
    status: "available",
    title: "Peugeot 3008 Active Pack 1.5 HDi 130 BVA8",
    images: [
      "assets/cars/peugeot-3008-blue-front.jpg",
      "assets/cars/peugeot-3008-blue-rear.jpg"
    ],
    price: "Цена по запросу",
    mileage: "193 191 км",
    date: "05.2022",
    engine: "1.5 HDi 130, дизель, автомат",
    summary: "Синий Peugeot 3008 Active Pack, 5 мест, автомат BVA8. В комплектации навигация NAC 3D/DAB, камера 180 градусов, передние и задние парктроники, keyless start, LED, распознавание знаков, удержание полосы и Active Brake Assist. В отчете 10 сервисных записей, последняя в январе 2026 на 182 070 км.",
    highlights: ["BVA8", "Камера 180", "10 сервисных записей", "LED"]
  },
  {
    id: "peugeot-5008-white-2026",
    status: "available",
    title: "Peugeot 5008 Allure Pack 1.5 HDi 130 BVA8",
    images: [
      "assets/cars/peugeot-5008-white-1.jpg"
    ],
    price: "Цена по запросу",
    mileage: "191 622 км",
    date: "07.2023",
    engine: "1.5 HDi 130, дизель, автомат",
    summary: "Белый Peugeot 5008 Allure Pack на 7 мест с автоматом BVA8. По инспекции: навигация, камера 180 градусов, передние и задние парктроники, контроль слепых зон, keyless access/start, рейлинги, 18-дюймовые диски Detroit и LED. В отчете 9 сервисных записей, последняя в апреле 2026 на 191 372 км; указан 1 ключ.",
    highlights: ["7 мест", "BVA8", "Контроль слепых зон", "9 сервисных записей"]
  },
  {
    id: "ford-focus-blue-2026",
    status: "available",
    title: "Ford Focus Wagon 1.0 EcoBoost ST-Line X Business",
    images: [
      "assets/cars/ford-focus-blue-1.jpg",
      "assets/cars/ford-focus-blue-2.jpg"
    ],
    price: "Цена по запросу",
    mileage: "172 509 км",
    date: "01.2022",
    engine: "1.0 EcoBoost, бензин, механика",
    summary: "Синий Ford Focus Wagon ST-Line X Business, 125 PS, механическая коробка. В комплектации LED-фары, камера заднего вида, передние и задние парктроники, навигация, Bluetooth, круиз-контроль, датчик дождя и подогрев передних сидений. Техосмотр до 07.01.2026; сервисная история в PDF отмечена как Missing.",
    highlights: ["ST-Line X", "Камера", "Подогрев сидений", "MOT до 07.01.2026"]
  },
  {
    id: "audi-a3-2022",
    status: "available",
    title: "Audi A3 30 TFSI",
    image: "https://optim.tildacdn.net/tild6633-3862-4563-b761-353163326639/-/resize/720x/-/format/webp/photo_53438848537342.jpg.webp",
    price: "13 950 EUR",
    mileage: "137 212 км",
    date: "05.2022",
    engine: "1.0 TFSI MHEV, автомат",
    summary: "Компактный седан с мягким гибридом, S tronic, LED, MMI Navigation Plus и подтвержденной сервисной историей.",
    highlights: ["Audi Virtual Cockpit", "Камера заднего вида", "Ассистент удержания полосы", "Регулярное обслуживание"]
  },
  {
    id: "peugeot-5008-2021",
    status: "available",
    title: "Peugeot 5008 Allure",
    image: "https://optim.tildacdn.net/tild3634-3361-4963-b331-343133326362/-/resize/720x/-/format/webp/photo_53775576378530.jpg.webp",
    price: "13 000 EUR",
    mileage: "132 000 км",
    date: "12.2021",
    engine: "1.5 BlueHDi, автомат",
    summary: "7-местный SUV для семьи или бизнеса: экономичный дизель, EAT8, Allure, история обслуживания.",
    highlights: ["7 мест", "Адаптивный круиз-контроль", "Камера и парктроники", "6 записей сервиса"]
  },
  {
    id: "bmw-2-gran-tourer",
    status: "available",
    title: "BMW 2 Gran Tourer",
    image: "https://thb.tildacdn.net/tild3331-6466-4263-a231-313262306464/-/empty/5404520085327647822.jpg",
    price: "11 000 EUR",
    mileage: "179 000 км",
    date: "02.2022",
    engine: "1.5 дизель, автомат",
    summary: "Практичный 7-местный автомобиль с экономичным дизельным двигателем и подробной сервисной историей.",
    highlights: ["7 мест", "Навигация", "Камера заднего вида", "11 сервисных записей"]
  },
  {
    id: "peugeot-208-2018",
    status: "available",
    title: "Peugeot 208",
    image: "https://thb.tildacdn.net/tild6662-6133-4035-b930-383230663565/-/empty/photo_53730540382256.jpg",
    price: "4 660 EUR",
    mileage: "95 000 км",
    date: "05.2018",
    engine: "1.2 бензин, механика",
    summary: "Компактный городской автомобиль в коммерческой версии, подходит для малого бизнеса и сервисных задач.",
    highlights: ["2 места", "Круиз-контроль", "Климат-контроль", "18 сервисных записей"]
  },
  {
    id: "vw-crafter-2019",
    status: "available",
    title: "VW Crafter 35 L4H3",
    image: "https://thb.tildacdn.net/tild3332-3039-4633-b862-636635313231/-/empty/IMG_20250604_1258036.jpg",
    price: "16 700 EUR",
    mileage: "110 000 км",
    date: "04.2019",
    engine: "2.0 TDI, механика",
    summary: "Коммерческий фургон с длинной базой и высокой крышей для логистики, сервиса и ежедневной работы.",
    highlights: ["L4H3", "Камера заднего вида", "Круиз-контроль", "До 3.5 т"]
  },
  {
    id: "bmw-x1-2019",
    status: "sold",
    title: "BMW X1 sDrive",
    image: "https://thb.tildacdn.net/tild3032-6435-4235-a534-623930376434/-/empty/photo_53259322469192.jpg",
    price: "11 500 EUR",
    mileage: "164 750 км",
    date: "06.2019",
    engine: "1.5 дизель, автомат",
    summary: "Проданный пример SUV с комплектацией Advantage, навигацией, камерой, LED и проверенной историей.",
    highlights: ["Продано", "Навигация BMW", "LED", "Электропривод багажника"]
  }
];

const carsGrid = document.getElementById("carsGrid");
const filters = document.querySelectorAll(".filter");
const dialog = document.getElementById("carDialog");
const dialogContent = document.getElementById("dialogContent");
const dialogClose = document.getElementById("dialogClose");

let currentFilter = "all";

function getCarImages(car) {
  return car.images && car.images.length ? car.images : [car.image];
}

function renderCars() {
  const visibleCars = cars.filter((car) => {
    if (currentFilter === "all") return true;
    return car.status === currentFilter;
  });

  carsGrid.innerHTML = visibleCars.map((car) => {
    const cover = getCarImages(car)[0];
    return `
    <article class="car-card">
      <div class="car-media">
        <img src="${cover}" alt="${car.title}" loading="lazy">
        <span class="badge ${car.status === "sold" ? "sold" : ""}">${car.status === "sold" ? "Продано" : "В продаже"}</span>
      </div>
      <div class="car-body">
        <h3>${car.title}</h3>
        <div class="specs">
          <span>${car.mileage}</span>
          <span>${car.date}</span>
          <span>${car.engine}</span>
        </div>
        <p>${car.summary}</p>
        <div class="price-row">
          <span class="price">${car.price}</span>
          <button class="small-button" data-car="${car.id}">Подробнее</button>
        </div>
      </div>
    </article>
  `;
  }).join("");
}

function openCar(id) {
  const car = cars.find((item) => item.id === id);
  if (!car) return;
  const images = getCarImages(car);

  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-gallery">
        <img src="${images[0]}" alt="${car.title}">
        ${images.length > 1 ? `<div class="dialog-thumbs">${images.map((image, index) => `<img src="${image}" alt="${car.title} фото ${index + 1}">`).join("")}</div>` : ""}
      </div>
      <div class="dialog-info">
        <p class="eyebrow">${car.status === "sold" ? "Проданный пример" : "Актуальное предложение"}</p>
        <h3>${car.title}</h3>
        <div class="specs">
          <span>${car.mileage}</span>
          <span>${car.date}</span>
          <span>${car.engine}</span>
        </div>
        <p>${car.summary}</p>
        <ul>${car.highlights.map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="price-row">
          <span class="price">${car.price}</span>
          <a class="button primary" href="#request" data-close-dialog>Запросить расчет</a>
        </div>
      </div>
    </div>
  `;
  dialog.showModal();
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderCars();
  });
});

carsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-car]");
  if (button) openCar(button.dataset.car);
});

dialogClose.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog || event.target.matches("[data-close-dialog]")) dialog.close();
});

document.getElementById("requestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const note = document.getElementById("formNote");
  note.textContent = "Черновик заявки готов. На следующем этапе подключим отправку в Telegram, email или CRM.";
});

const customsCalc = document.getElementById("customsCalc");
const calcResult = document.getElementById("calcResult");
const calcVolumeWrap = document.getElementById("calcVolumeWrap");
const calcDiscountWrap = document.getElementById("calcDiscountWrap");

const fixedBynCosts = {
  storage: 110,
  customsFee: 120,
  declarant: 350,
  epts: 170,
  service: 870
};

function money(value, currency = "EUR") {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value) + " " + currency;
}

function readCalcNumber(id, fallback = 0) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) ? value : fallback;
}

function physicalFuelDuty(price, volume, age) {
  if (age === "3to5") {
    const rate = volume <= 1000 ? 1.5 : volume <= 1500 ? 1.7 : volume <= 1800 ? 2.5 : volume <= 2300 ? 2.7 : volume <= 3000 ? 3 : 3.6;
    return volume * rate;
  }
  if (age === "over5") {
    const rate = volume <= 1000 ? 3 : volume <= 1500 ? 3.2 : volume <= 1800 ? 3.5 : volume <= 2300 ? 4.8 : volume <= 3000 ? 5 : 5.7;
    return volume * rate;
  }
  const tier = price <= 8500 ? [0.54, 2.5] : price <= 16700 ? [0.48, 3.5] : price <= 42300 ? [0.48, 5.5] : price <= 84500 ? [0.48, 7.5] : price <= 169000 ? [0.48, 15] : [0.48, 20];
  return Math.max(price * tier[0], volume * tier[1]);
}

function calculateCustoms() {
  const price = Math.max(0, readCalcNumber("calcPrice", 10000));
  const volume = Math.max(0, readCalcNumber("calcVolume", 2000));
  const delivery = Math.max(0, readCalcNumber("calcDelivery", 1500));
  const eurByn = Math.max(0.1, readCalcNumber("calcRate", 3.56));
  const age = document.getElementById("calcAge").value;
  const engine = document.querySelector('input[name="calcEngine"]:checked').value;
  const owner = document.querySelector('input[name="calcOwner"]:checked').value;
  const discount = document.getElementById("calcDiscount").checked && owner === "person";
  const utilByn = age === "under3" ? 624.92 : 1282.02;

  let duty = 0;
  let vat = 0;
  let note = "Расчет ориентировочный. В ставках использована открытая модель белорусской растаможки для легковых авто.";

  if (engine === "electric") {
    duty = 0;
    vat = owner === "entity" ? price * 0.2 : 0;
    note = "Для электромобиля у физлица пошлина и НДС в расчете равны 0; возраст влияет на утильсбор.";
  } else if (engine === "erev") {
    duty = price * 0.15;
    vat = (price + duty) * 0.2;
  } else if (owner === "person") {
    duty = physicalFuelDuty(price, volume, age);
  } else {
    duty = price * 0.15;
    vat = (price + duty) * 0.2;
    note = "Для юрлица показана базовая импортная модель: пошлина 15% и НДС 20%. Точный расчет зависит от кода ТН ВЭД и документов.";
  }

  if (discount && engine !== "electric") {
    duty *= 0.5;
    vat *= 0.5;
  }

  const bynCosts = utilByn + fixedBynCosts.storage + fixedBynCosts.declarant + fixedBynCosts.epts + fixedBynCosts.service + (engine === "electric" && owner === "person" ? 0 : fixedBynCosts.customsFee);
  const bynCostsEur = bynCosts / eurByn;
  const totalEur = price + delivery + duty + vat + bynCostsEur;
  const totalUsd = totalEur * 1.14;

  calcResult.innerHTML = `
    <div class="calc-total">
      <span>Итого под ключ</span>
      <strong>${money(totalEur)}</strong>
      <small>примерно ${money(totalUsd, "USD")}</small>
    </div>
    <div class="calc-lines">
      <div class="calc-line"><span>Стоимость авто</span><strong>${money(price)}</strong></div>
      <div class="calc-line"><span>Доставка до Минска</span><strong>${money(delivery)}</strong></div>
      <div class="calc-line"><span>Таможенная пошлина</span><strong>${money(duty)}</strong></div>
      <div class="calc-line"><span>НДС</span><strong>${money(vat)}</strong></div>
      <div class="calc-line"><span>Утилизационный сбор</span><strong>${money(utilByn, "BYN")}</strong></div>
      <div class="calc-line"><span>Сборы, склад, ЭПТС, декларант, услуги</span><strong>${money(bynCosts - utilByn, "BYN")}</strong></div>
      <div class="calc-line"><span>BYN-расходы в EUR</span><strong>${money(bynCostsEur)}</strong></div>
    </div>
    <p class="calc-note">${note} Курс EUR/BYN и USD показан для предварительной оценки.</p>
  `;
}

function updateCalcVisibility() {
  const engine = document.querySelector('input[name="calcEngine"]:checked').value;
  const owner = document.querySelector('input[name="calcOwner"]:checked').value;
  calcVolumeWrap.style.display = engine === "fuel" ? "" : "none";
  calcDiscountWrap.style.display = owner === "person" && engine !== "electric" ? "flex" : "none";
  calculateCustoms();
}

if (customsCalc) {
  customsCalc.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateCustoms();
  });
  customsCalc.addEventListener("input", updateCalcVisibility);
  customsCalc.addEventListener("change", updateCalcVisibility);
  updateCalcVisibility();
}

renderCars();
