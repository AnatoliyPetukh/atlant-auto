(function () {
  const labels = {
    fuelType: { diesel: "Дизель", petrol: "Бензин", "petrol-hybrid": "Бензин, мягкий гибрид" },
    transmission: { automatic: "Автомат", manual: "Механика" },
    status: { "for-sale": "В продаже", sold: "Продано" },
    equipment: { comfort: "Комфорт", safety: "Безопасность", multimedia: "Мультимедиа", driverAssistance: "Помощь водителю", interior: "Салон", exterior: "Внешнее оборудование" }
  };

  function present(value) { return value !== null && value !== undefined && value !== "" && !(typeof value === "number" && Number.isNaN(value)); }
  function title(car) { return [car.brand, car.model, car.version].filter(present).join(" "); }
  function date(value) {
    if (!present(value)) return "";
    const match = String(value).match(/^(\d{4})-(\d{2})/);
    return match ? `${match[2]}.${match[1]}` : String(value);
  }
  function mileage(value) { return present(value) ? `${new Intl.NumberFormat("ru-RU").format(value)} км` : ""; }
  function engine(value) { return present(value) ? `${(value / 1000).toFixed(value % 1000 ? 1 : 0)} л` : ""; }
  function price(car) {
    if (car.priceOnRequest || !present(car.price)) return "Цена по запросу";
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: car.currency || "EUR", maximumFractionDigits: 0 }).format(car.price);
  }
  function catalogDate(car) {
    if (present(car.productionDate)) return { label: "Дата производства", value: date(car.productionDate) };
    if (present(car.firstRegistrationDate)) return { label: "Первая регистрация", value: date(car.firstRegistrationDate) };
    return null;
  }
  window.CarFormat = { labels, present, title, date, mileage, engine, price, catalogDate };
})();
