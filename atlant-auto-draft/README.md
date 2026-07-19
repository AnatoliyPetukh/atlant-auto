# Atlant Auto Draft

Статический черновик сайта Atlant Auto вне Tilda. Он открывается напрямую через `index.html` и не требует сборки.

## Каталог автомобилей

Все автомобили используют единую структуру в `data/cars.js`. Карточки каталога создаёт `app.js`, а отдельные страницы — общий сценарий `js/car-page.js`.

Для добавления автомобиля:

1. Создайте папку `assets/cars/<slug>/` и поместите туда фотографии.
2. Если есть инспекционный отчёт, добавьте PDF в ту же папку.
3. Добавьте нормализованный объект в `data/cars.js`. Не смешивайте `productionDate` и `firstRegistrationDate`.
4. Создайте небольшую HTML-страницу в `cars/<slug>.html` по существующему образцу, указав `data-car-slug`.
5. Проверьте карточку, отдельную страницу, галерею и фильтры на широком и узком экране.

Пустые поля оставляйте `null`, пустой строкой или не добавляйте. Интерфейс скрывает их. Не используйте строки `null`, `undefined` и `NaN` как значения.

## Основные поля

- `id`, `slug`, `status`
- `brand`, `model`, `version`
- `productionDate`, `firstRegistrationDate`
- `mileageKm`, `fuelType`, `engineCapacityCc`, `powerKw`, `powerHp`
- `transmission`, `driveType`, `bodyType`, `color`
- `doors`, `seats`, `vin`, `keysCount`, `registrationCountry`
- `price`, `currency`, `priceOnRequest`
- `mainImage`, `images`
- `equipment`, `serviceHistory`, `wheelsAndTyres`, `condition`
- `inspectionDocument`

Инспекционный PDF подтверждает данные, но не заменяет структурированное описание автомобиля.
