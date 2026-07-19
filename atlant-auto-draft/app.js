const cars = window.ATLANT_CARS || [];
const format = window.CarFormat;
const carsGrid = document.getElementById("carsGrid");
const filters = document.querySelectorAll(".filter");
let currentFilter = "all";

function fromPage(path) {
  return path.startsWith("../") ? path.slice(3) : path;
}

function compactLine(values) {
  const visibleValues = values.filter(format.present);
  return visibleValues.length ? `<div>${visibleValues.map((value) => `<span>${value}</span>`).join("")}</div>` : "";
}

function renderCars() {
  const visibleCars = cars.filter((car) => currentFilter === "all" || car.status === currentFilter);
  carsGrid.innerHTML = visibleCars.map((car) => {
    const displayDate = format.catalogDate(car);
    return `
      <article class="car-card">
        <div class="car-media">
          <img src="${fromPage(car.mainImage)}" alt="${format.title(car)}" width="1280" height="960" loading="lazy">
          <span class="badge ${car.status === "sold" ? "sold" : ""}">${format.labels.status[car.status]}</span>
        </div>
        <div class="car-body">
          <h3>${format.title(car)}</h3>
          <div class="compact-specs">
            ${compactLine([
              displayDate && displayDate.value,
              format.labels.fuelType[car.fuelType],
              format.labels.transmission[car.transmission]
            ])}
            ${compactLine([
              format.mileage(car.mileageKm),
              format.engine(car.engineCapacityCc)
            ])}
          </div>
          <div class="price-row">
            <span class="price">${format.price(car)}</span>
            <a class="small-button" href="cars/${car.slug}.html">Подробнее</a>
          </div>
        </div>
      </article>`;
  }).join("");
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderCars();
  });
});

document.getElementById("requestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  document.getElementById("formNote").textContent = "Черновик заявки готов. На следующем этапе подключим отправку в Telegram, email или CRM.";
});

renderCars();
