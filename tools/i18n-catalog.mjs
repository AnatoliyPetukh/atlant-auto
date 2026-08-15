import { locales, pages } from "./seo-config.mjs";
import { carLocalizationMessages } from "./car-localization.mjs";
import { homeLocalizationMessages } from "./home-localization.mjs";

const entry = (ru, pl, en) => ({ ru, pl, en });

const common = {
  "language.ru": entry("Русский", "Rosyjski", "Russian"),
  "language.pl": entry("Польский", "Polski", "Polish"),
  "language.en": entry("Английский", "Angielski", "English"),
  "language.selector.label": entry("Язык", "Język", "Language"),
  "brand.location": entry("Варшава", "Warszawa", "Warsaw"),
  "navigation.primary.label": entry("Главная навигация", "Główna nawigacja", "Primary navigation"),
  "navigation.catalog": entry("Автомобили", "Samochody", "Cars"),
  "navigation.services": entry("Услуги", "Usługi", "Services"),
  "navigation.process": entry("Как мы работаем", "Jak działamy", "How it works"),
  "navigation.calculator": entry("Калькулятор", "Kalkulator", "Calculator"),
  "navigation.cases": entry("Кейсы", "Realizacje", "Case studies"),
  "navigation.about": entry("О компании", "O nas", "About"),
  "navigation.faq": entry("Частые вопросы", "FAQ", "FAQ"),
  "navigation.contact": entry("Контакты", "Kontakt", "Contact"),
  "navigation.home": entry("Главная", "Strona główna", "Home"),
  "navigation.backToCatalog": entry("Вернуться в каталог", "Wróć do katalogu", "Back to catalogue"),
  "navigation.breadcrumb.label": entry("Хлебные крошки", "Okruszki", "Breadcrumb"),
  "action.discussCar": entry("Обсудить подбор автомобиля", "Porozmawiajmy o samochodzie", "Discuss your car search"),
  "action.viewCars": entry("Смотреть автомобили", "Zobacz samochody", "View cars"),
  "action.viewVehicle": entry("Смотреть автомобиль", "Zobacz samochód", "View vehicle"),
  "action.requestQuote": entry("Запросить расчёт", "Poproś o wycenę", "Request a quote"),
  "action.open": entry("Открыть", "Otwórz", "Open"),
  "action.download": entry("Скачать", "Pobierz", "Download"),
  "action.calculate": entry("Рассчитать", "Oblicz", "Calculate"),
  "action.submitRequest": entry("Отправить заявку", "Wyślij zapytanie", "Send request"),
  "action.backHome": entry("На главную", "Na stronę główną", "Go home"),
  "common.telegram": entry("Telegram", "Telegram", "Telegram"),
  "common.email": entry("Email", "Email", "Email"),
  "common.phone": entry("Телефон", "Telefon", "Phone"),
  "common.address": entry("Адрес", "Adres", "Address"),
  "company.official.heading": entry("Официальная информация", "Dane rejestrowe", "Official company information"),
  "company.official.intro": entry("Юридические данные компании, ведущей деятельность под маркой Atlant Auto.", "Dane spółki prowadzącej działalność pod marką Atlant Auto.", "Registration details of the company operating under the Atlant Auto brand."),
  "company.official.legalName": entry("Полное наименование", "Pełna nazwa spółki", "Registered company name"),
  "company.official.registryLink": entry("Проверить в государственном реестре KRS", "Sprawdź w państwowej wyszukiwarce KRS", "Check the official KRS register"),
  "company.locations.heading": entry("Наши адреса в Варшаве", "Nasze lokalizacje w Warszawie", "Our Warsaw locations"),
  "company.locations.intro": entry("Офис компании и площадка автомобилей находятся по разным адресам.", "Biuro spółki i plac samochodowy znajdują się pod różnymi adresami.", "The company office and vehicle lot are at separate addresses."),
  "company.location.office": entry("Офис и юридический адрес", "Biuro i adres rejestrowy", "Office and registered address"),
  "company.location.lot": entry("Площадка автомобилей", "Plac samochodowy", "Vehicle lot"),
  "company.location.officeNote": entry("Официальный адрес Atlant Capital Sp. z o.o.", "Oficjalny adres Atlant Capital Sp. z o.o.", "Official address of Atlant Capital Sp. z o.o."),
  "company.location.lotNote": entry("Осмотр и выдача доступных автомобилей.", "Oględziny i wydanie dostępnych samochodów.", "Viewing and handover of available vehicles."),
  "company.location.openMap": entry("Открыть в Google Maps", "Otwórz w Google Maps", "Open in Google Maps"),
  "company.contact.heading": entry("Связаться с Atlant Auto", "Kontakt z Atlant Auto", "Contact Atlant Auto"),
  "company.contact.intro": entry("Перед приездом свяжитесь с нами, чтобы согласовать встречу и проверить наличие автомобиля.", "Przed przyjazdem skontaktuj się z nami, aby umówić spotkanie i potwierdzić dostępność samochodu.", "Contact us before visiting to arrange a meeting and confirm vehicle availability."),
  "company.about.cardText1": entry("Atlant Auto работает под полным юридическим наименованием Atlant Capital Sp. z o.o. Данные компании можно проверить в государственном реестре.", "Atlant Auto działa pod pełną nazwą prawną Atlant Capital Sp. z o.o. Dane spółki można sprawdzić w państwowym rejestrze.", "Atlant Auto operates under the registered company name Atlant Capital Sp. z o.o. The company details can be checked in the official register."),
  "company.about.cardText2": entry("Мы публикуем полное наименование, NIP, KRS, REGON, телефон и email, чтобы клиент сразу понимал, с какой компанией связывается.", "Publikujemy pełną nazwę, NIP, KRS, REGON, telefon i email, aby klient od początku wiedział, z jaką spółką się kontaktuje.", "We publish our registered name, NIP, KRS, REGON, phone number and email so clients know which company they are contacting."),
  "company.about.cardText3": entry("Офис на Vogla и автомобильная площадка на Wielkiego Dębu указаны отдельно, чтобы посетитель приехал в нужное место.", "Biuro przy ul. Vogla i plac samochodowy przy ul. Wielkiego Dębu podajemy osobno, aby klient mógł trafić pod właściwy adres.", "The Vogla office and Wielkiego Dębu vehicle lot are listed separately so visitors can arrive at the correct location."),
  "footer.companyInfo": entry("О компании и официальная информация", "O firmie i dane rejestrowe", "Company and registration details"),
  "common.priceOnRequest": entry("Цена по запросу", "Cena na zapytanie", "Price on request"),
  "common.priceExcludingVat": entry("без НДС", "netto (bez VAT)", "excl. VAT"),
  "common.marketEstimate": entry("Ориентировочная рыночная цена", "Orientacyjna cena rynkowa", "Indicative market price"),
  "common.notAvailable": entry("Нет данных", "Brak danych", "Not available"),
  "footer.tagline": entry(
    "Подбор, проверка, выкуп и доставка автомобилей из Европы.",
    "Wyszukiwanie, weryfikacja, zakup i dostawa samochodów z Europy.",
    "Vehicle sourcing, checks, purchase and delivery from Europe."
  ),
  "footer.privacy": entry("Политика конфиденциальности", "Polityka prywatności", "Privacy policy"),
  "footer.cookies": entry("Настройки cookie", "Ustawienia plików cookie", "Cookie settings"),
  "cookie.banner.title": entry("Cookie на сайте Atlant Auto", "Pliki cookie w Atlant Auto", "Cookies on Atlant Auto"),
  "cookie.banner.description": entry(
    "Мы используем только необходимые cookie для сохранения языковых и приватностных настроек. Аналитические cookie будут включены только после отдельного согласия.",
    "Używamy wyłącznie niezbędnych plików cookie do zapisywania ustawień języka i prywatności. Analityczne pliki cookie zostaną włączone dopiero po odrębnej zgodzie.",
    "We use only essential cookies to remember language and privacy preferences. Analytics cookies will be enabled only after separate consent."
  ),
  "cookie.banner.acceptEssential": entry("Только необходимые", "Tylko niezbędne", "Essential only"),
  "cookie.banner.acceptAll": entry("Разрешить все", "Zezwól na wszystkie", "Allow all"),
  "validation.required": entry("Заполните обязательное поле.", "Wypełnij wymagane pole.", "Complete this required field."),
  "validation.contactRequired": entry(
    "Укажите телефон, email или Telegram.",
    "Podaj telefon, email lub Telegram.",
    "Enter a phone number, email address or Telegram."
  ),
  "notifications.requestSent": entry(
    "Черновик письма подготовлен. Проверьте его и нажмите «Отправить» в почтовом приложении.",
    "Szkic wiadomości został przygotowany. Sprawdź go i kliknij „Wyślij” w programie pocztowym.",
    "An email draft has been prepared. Review it and select Send in your email app."
  ),
  "empty.cars": entry(
    "По выбранным параметрам автомобилей пока нет.",
    "Brak samochodów spełniających wybrane kryteria.",
    "No vehicles match the selected filters yet."
  ),
  "error.404.seoTitle": entry("Страница не найдена | Atlant Auto", "Nie znaleziono strony | Atlant Auto", "Page not found | Atlant Auto"),
  "error.404.title": entry("Страница не найдена", "Nie znaleziono strony", "Page not found"),
  "error.404.description": entry(
    "Возможно, адрес изменился или в нём есть опечатка. Перейдите на главную страницу или откройте каталог.",
    "Adres mógł się zmienić lub zawierać literówkę. Przejdź na stronę główną albo otwórz katalog.",
    "The address may have changed or contain a typo. Go to the home page or open the vehicle catalogue."
  ),
  "error.500.seoTitle": entry("Временная ошибка | Atlant Auto", "Błąd tymczasowy | Atlant Auto", "Temporary error | Atlant Auto"),
  "error.500.title": entry("Что-то пошло не так", "Coś poszło nie tak", "Something went wrong"),
  "error.500.description": entry(
    "Попробуйте обновить страницу позже или свяжитесь с нами напрямую.",
    "Spróbuj ponownie później lub skontaktuj się z nami bezpośrednio.",
    "Please try again later or contact us directly."
  ),
  "vehicle.status.forSale": entry("В продаже", "Dostępny", "Available"),
  "vehicle.status.onSite": entry("В наличии на площадке", "Dostępny na placu", "Available on site"),
  "vehicle.status.sold": entry("Продано", "Sprzedany", "Sold"),
  "vehicle.status.recentlySold": entry("Недавно продано", "Niedawno sprzedany", "Recently sold"),
  "vehicle.status.inTransit": entry("В пути — скоро в наличии", "W drodze — wkrótce dostępny", "In transit — arriving soon"),
  "vehicle.source.arvalAuction": entry("Аукцион Arval", "Aukcja Arval", "Arval auction"),
  "vehicle.sold.priceNote": entry("Показана ориентировочная рыночная цена, а не подтверждённая сумма сделки.", "Podana kwota jest orientacyjną ceną rynkową, a nie potwierdzoną ceną transakcyjną.", "The amount shown is an indicative market price, not a confirmed transaction price."),
  "vehicle.seo.offerSuffix": entry("в продаже в Варшаве", "na sprzedaż w Warszawie", "for sale in Warsaw"),
  "vehicle.seo.soldSuffix": entry("недавно продано", "niedawno sprzedany", "recently sold"),
  "vehicle.seo.inTransitSuffix": entry("в пути в Варшаву", "w drodze do Warszawy", "in transit to Warsaw"),
  "vehicle.fuel.petrol": entry("Бензин", "Benzyna", "Petrol"),
  "vehicle.fuel.diesel": entry("Дизель", "Diesel", "Diesel"),
  "vehicle.fuel.hybrid": entry("Гибрид", "Hybryda", "Hybrid"),
  "vehicle.fuel.electric": entry("Электромобиль", "Samochód elektryczny", "Electric"),
  "vehicle.transmission.manual": entry("Механическая", "Manualna", "Manual"),
  "vehicle.transmission.automatic": entry("Автоматическая", "Automatyczna", "Automatic"),
  "vehicle.drive.front": entry("Передний", "Przedni", "Front-wheel drive"),
  "vehicle.drive.all": entry("Полный", "Na wszystkie koła", "All-wheel drive"),
  "vehicle.body.wagon": entry("Универсал", "Kombi", "Estate"),
  "vehicle.body.hatchback": entry("Хэтчбек", "Hatchback", "Hatchback"),
  "vehicle.body.compactVan": entry("Компактвэн", "Minivan kompaktowy", "Compact MPV"),
  "vehicle.body.crossover": entry("Кроссовер", "Crossover", "Crossover"),
  "vehicle.body.fastbackCrossover": entry("Фастбэк-кроссовер", "Crossover typu fastback", "Fastback crossover"),
  "vehicle.body.sedan": entry("Седан", "Sedan", "Saloon"),
  "vehicle.section.about": entry("Об автомобиле", "O samochodzie", "About the vehicle"),
  "vehicle.section.specifications": entry("Основные характеристики", "Najważniejsze dane", "Key specifications"),
  "vehicle.section.engine": entry("Двигатель и трансмиссия", "Silnik i skrzynia biegów", "Engine and transmission"),
  "vehicle.section.equipment": entry("Комплектация", "Wyposażenie", "Equipment"),
  "vehicle.section.service": entry("История обслуживания", "Historia serwisowa", "Service history"),
  "vehicle.section.condition": entry("Состояние автомобиля", "Stan samochodu", "Vehicle condition"),
  "vehicle.section.documents": entry("Документы", "Dokumenty", "Documents"),
  "vehicle.condition.reportLimitations": entry(
    "Исходный отчёт не содержит полной диагностики кузова и салона или подтверждения отсутствия ДТП. Состояние автомобиля следует проверить при осмотре.",
    "Raport źródłowy nie zawiera pełnej diagnostyki nadwozia i wnętrza ani potwierdzenia bezwypadkowości. Stan samochodu należy zweryfikować podczas oględzin.",
    "The source report does not include a complete body and interior inspection or confirmation of accident-free history. The vehicle's condition should be verified during an inspection."
  ),
  "vehicle.field.firstRegistration": entry("Первая регистрация", "Pierwsza rejestracja", "First registration"),
  "vehicle.field.productionYear": entry("Год выпуска", "Rok produkcji", "Production year"),
  "vehicle.field.mileage": entry("Пробег", "Przebieg", "Mileage"),
  "vehicle.field.body": entry("Кузов", "Nadwozie", "Body"),
  "vehicle.field.color": entry("Цвет", "Kolor", "Colour"),
  "vehicle.field.doors": entry("Двери", "Drzwi", "Doors"),
  "vehicle.field.seats": entry("Места", "Miejsca", "Seats"),
  "vehicle.field.registrationNumber": entry("Регистрационный номер", "Numer rejestracyjny", "Registration number"),
  "vehicle.field.vin": entry("VIN", "VIN", "VIN"),
  "vehicle.field.registrationCountry": entry("Страна регистрации", "Kraj rejestracji", "Registration country"),
  "vehicle.field.keys": entry("Ключи", "Kluczyki", "Keys"),
  "vehicle.field.source": entry("Источник автомобиля", "Pochodzenie samochodu", "Vehicle source"),
  "vehicle.field.fuel": entry("Топливо", "Paliwo", "Fuel"),
  "vehicle.field.engineCapacity": entry("Объём двигателя", "Pojemność silnika", "Engine capacity"),
  "vehicle.field.power": entry("Мощность", "Moc", "Power"),
  "vehicle.field.transmission": entry("Коробка передач", "Skrzynia biegów", "Transmission"),
  "vehicle.field.drive": entry("Привод", "Napęd", "Drive"),
  "vehicle.field.emissionStandard": entry("Экологический стандарт", "Norma emisji", "Emission standard"),
  "vehicle.condition.location": entry("Местонахождение", "Lokalizacja", "Location"),
  "vehicle.location.warsawStock": entry("В наличии в Варшаве", "Dostępny od ręki w Warszawie", "In stock in Warsaw"),
  "vehicle.unit.kilometres": entry("км", "km", "km"),
  "vehicle.unit.cubicCentimetres": entry("см³", "cm³", "cc"),
  "vehicle.unit.horsepower": entry("л.с.", "KM", "hp"),
  "vehicle.unit.megabytes": entry("МБ", "MB", "MB"),
  "vehicle.gallery.mainAlt": entry("{vehicle} — основной вид", "{vehicle} — widok główny", "{vehicle} — main view"),
  "vehicle.gallery.photoAlt": entry("{vehicle} — фото {number}", "{vehicle} — zdjęcie {number}", "{vehicle} — photo {number}"),
  "vehicle.gallery.showPhoto": entry("Показать фото {number}", "Pokaż zdjęcie {number}", "Show photo {number}"),
  "vehicle.service.unavailable": entry(
    "Подробная сервисная история в доступных исходных данных отсутствует.",
    "Szczegółowa historia serwisowa nie jest dostępna w przekazanych danych.",
    "A detailed service history is not available in the supplied records."
  ),
  "topic.cards.viewVehicle": entry("Смотреть автомобиль", "Zobacz samochód", "View vehicle"),
  "topic.calculator.note": entry(
    "Рабочий калькулятор растаможки для Беларуси доступен по ссылке ниже.",
    "Kalkulator odprawy celnej dla Białorusi jest dostępny poniżej.",
    "The Belarus customs-clearance calculator is available below."
  ),
  "topic.calculator.open": entry("Открыть калькулятор", "Otwórz kalkulator", "Open calculator"),
  "topic.proof.heading": entry(
    "Прозрачный процесс и проверяемые данные",
    "Przejrzysty proces i sprawdzone dane",
    "A transparent process based on available evidence"
  ),
  "topic.proof.disclaimer": entry(
    "Мы не публикуем выдуманные рейтинги и гарантии. Объём проверки и смета зависят от конкретного автомобиля.",
    "Nie publikujemy fikcyjnych ocen ani obietnic. Zakres kontroli i kosztorys zależą od konkretnego pojazdu.",
    "We do not publish invented ratings or guarantees. The scope of checks and the estimate depend on the selected vehicle."
  ),
  "faq.answer.check": entry(
    "Да. Объём проверки зависит от источника предложения и доступных документов.",
    "Tak. Zakres kontroli zależy od źródła oferty i dostępnych dokumentów.",
    "Yes. The scope depends on the listing source and available documents."
  ),
  "faq.answer.cost": entry(
    "Стоимость включает автомобиль, согласованные комиссии, доставку и оформление.",
    "Koszt obejmuje samochód oraz uzgodnione opłaty, transport i formalności.",
    "The total includes the vehicle and agreed fees, transport and formalities."
  ),
  "faq.answer.documents": entry(
    "Комплект документов зависит от страны продавца и места регистрации.",
    "Zakres dokumentów zależy od kraju sprzedawcy i miejsca rejestracji.",
    "The document set depends on the seller country and registration destination."
  ),
  "email.request.subject": entry(
    "Запрос на подбор автомобиля — Atlant Auto",
    "Zapytanie o wyszukanie samochodu — Atlant Auto",
    "Vehicle sourcing request — Atlant Auto"
  ),
  "email.request.greeting": entry("Новая заявка с сайта", "Nowe zapytanie ze strony", "New website request")
  ,
  "calculator.seo.title": entry("Калькулятор растаможки автомобиля в Беларусь | Atlant Auto", "Kalkulator odprawy celnej samochodu na Białoruś | Atlant Auto", "Belarus vehicle customs calculator | Atlant Auto"),
  "calculator.seo.description": entry("Ориентировочный расчёт таможенного платежа и полного бюджета автомобиля для физических лиц в Беларуси.", "Orientacyjne obliczenie opłaty celnej i pełnego budżetu samochodu dla osoby fizycznej na Białorusi.", "Indicative customs-duty and full vehicle budget estimate for a private buyer in Belarus."),
  "calculator.eyebrow": entry("Беларусь · физические лица", "Białoruś · osoby fizyczne", "Belarus · private buyers"),
  "calculator.title": entry("Калькулятор растаможки автомобиля", "Kalkulator odprawy celnej samochodu", "Vehicle customs calculator"),
  "calculator.intro": entry("Ориентировочный расчёт по стоимости, месяцу выпуска и объёму двигателя. Гибриды и электромобили требуют индивидуальной проверки.", "Orientacyjne obliczenie na podstawie ceny, miesiąca produkcji i pojemności silnika. Hybrydy i samochody elektryczne wymagają indywidualnej weryfikacji.", "An indicative estimate based on price, production month and engine capacity. Hybrid and electric vehicles require an individual review."),
  "calculator.field.price": entry("Стоимость автомобиля", "Cena samochodu", "Vehicle price"),
  "calculator.field.currency": entry("Валюта", "Waluta", "Currency"),
  "calculator.field.releaseMonth": entry("Месяц выпуска", "Miesiąc produkcji", "Production month"),
  "calculator.field.releaseYear": entry("Год выпуска", "Rok produkcji", "Production year"),
  "calculator.field.engineCapacity": entry("Объём двигателя, см³", "Pojemność silnika, cm³", "Engine capacity, cc"),
  "calculator.field.engineType": entry("Тип двигателя", "Rodzaj napędu", "Powertrain"),
  "calculator.field.clearanceMode": entry("Режим растаможки", "Tryb odprawy", "Clearance mode"),
  "calculator.mode.standard": entry("Стандартная", "Standardowy", "Standard"),
  "calculator.mode.benefit50": entry("Льготная 50%", "Ulga 50%", "50% concession"),
  "calculator.field.fullBudget": entry("Показать полный бюджет под ключ", "Pokaż pełny budżet pod klucz", "Show the full turnkey budget"),
  "calculator.field.advanced": entry("Дополнительные параметры", "Dodatkowe parametry", "Additional parameters"),
  "calculator.cost.auctionFee": entry("Комиссия аукциона", "Prowizja aukcyjna", "Auction fee"),
  "calculator.cost.deliveryToWarsaw": entry("Доставка до Варшавы", "Transport do Warszawy", "Delivery to Warsaw"),
  "calculator.cost.deliveryToBelarus": entry("Доставка в Беларусь", "Transport na Białoruś", "Delivery to Belarus"),
  "calculator.cost.recyclingFee": entry("Утилизационный сбор", "Opłata recyklingowa", "Recycling fee"),
  "calculator.cost.customsFee": entry("Таможенный сбор", "Opłata celna", "Customs fee"),
  "calculator.cost.declarant": entry("Услуги декларанта", "Usługi agenta celnego", "Customs agent"),
  "calculator.cost.temporaryStorage": entry("Склад временного хранения", "Magazyn czasowego składowania", "Temporary storage"),
  "calculator.cost.epts": entry("Оформление ЭПТС", "Przygotowanie e-PTS", "Electronic vehicle passport"),
  "calculator.cost.other": entry("Другие расходы", "Inne koszty", "Other costs"),
  "calculator.cost.companyFee": entry("Комиссия ATLANT CAPITAL", "Prowizja ATLANT CAPITAL", "ATLANT CAPITAL fee"),
  "calculator.result.notIncluded": entry("Не включено в расчёт", "Nie uwzględniono", "Not included"),
  "calculator.result.manualTitle": entry("Индивидуальный расчёт", "Wycena indywidualna", "Individual estimate"),
  "calculator.result.reviewRequired": entry("Нужна проверка", "Wymagana weryfikacja", "Review required"),
  "calculator.result.manualNote": entry("Для гибридов и электромобилей ставка не применяется автоматически без подтверждённой конфигурации.", "Dla hybryd i samochodów elektrycznych stawka nie jest stosowana automatycznie bez potwierdzenia konfiguracji.", "A rate is not applied automatically to hybrids or electric vehicles without confirming the configuration."),
  "calculator.result.customsTotal": entry("Ориентировочная стоимость растаможки", "Orientacyjny koszt odprawy celnej", "Estimated customs-clearance cost"),
  "calculator.result.fullTotal": entry("Ориентировочная стоимость автомобиля под ключ", "Orientacyjny koszt samochodu pod klucz", "Estimated turnkey vehicle cost"),
  "calculator.result.ageCategory": entry("Возрастная категория", "Kategoria wiekowa", "Age category"),
  "calculator.age.under3": entry("до 3 лет включительно", "do 3 lat włącznie", "up to 3 years"),
  "calculator.age.from3to5": entry("более 3, но не более 5 лет", "powyżej 3 do 5 lat", "over 3 and up to 5 years"),
  "calculator.age.over5": entry("более 5 лет", "powyżej 5 lat", "over 5 years"),
  "calculator.result.vehiclePriceEur": entry("Стоимость автомобиля в EUR", "Cena samochodu w EUR", "Vehicle price in EUR"),
  "calculator.result.appliedRate": entry("Применённая ставка", "Zastosowana stawka", "Applied rate"),
  "calculator.result.formula": entry("Формула", "Wzór", "Formula"),
  "calculator.result.standardDuty": entry("Таможенный платёж без льготы", "Opłata celna bez ulgi", "Customs duty before concession"),
  "calculator.result.benefit": entry("Размер льготы", "Wartość ulgi", "Concession amount"),
  "calculator.result.finalDuty": entry("Таможенный платёж после льготы", "Opłata celna po uldze", "Customs duty after concession"),
  "calculator.result.benefitNote": entry("Льгота применяется только при наличии подтверждённого права. Калькулятор не проверяет право пользователя на льготу.", "Ulga ma zastosowanie wyłącznie po potwierdzeniu uprawnienia. Kalkulator nie weryfikuje prawa użytkownika do ulgi.", "The concession applies only when eligibility is confirmed. The calculator does not verify the user's eligibility."),
  "calculator.result.disclaimer": entry("Расчёт ориентировочный и не является окончательным коммерческим предложением, налоговой, таможенной или юридической консультацией.", "Obliczenie ma charakter orientacyjny i nie stanowi ostatecznej oferty handlowej ani porady podatkowej, celnej lub prawnej.", "This estimate is indicative and is not a final commercial offer or tax, customs or legal advice."),
  "calculator.error.checkData": entry("Проверьте данные", "Sprawdź dane", "Check the details"),
  "calculator.error.unavailable": entry("Расчёт невозможен", "Nie można wykonać obliczenia", "Unable to calculate"),
  "calculator.error.invalidInput": entry("Проверьте введённые значения и повторите расчёт.", "Sprawdź wprowadzone wartości i oblicz ponownie.", "Check the entered values and calculate again."),
  "calculator.month.1": entry("Январь", "Styczeń", "January"),
  "calculator.month.2": entry("Февраль", "Luty", "February"),
  "calculator.month.3": entry("Март", "Marzec", "March"),
  "calculator.month.4": entry("Апрель", "Kwiecień", "April"),
  "calculator.month.5": entry("Май", "Maj", "May"),
  "calculator.month.6": entry("Июнь", "Czerwiec", "June"),
  "calculator.month.7": entry("Июль", "Lipiec", "July"),
  "calculator.month.8": entry("Август", "Sierpień", "August"),
  "calculator.month.9": entry("Сентябрь", "Wrzesień", "September"),
  "calculator.month.10": entry("Октябрь", "Październik", "October"),
  "calculator.month.11": entry("Ноябрь", "Listopad", "November"),
  "calculator.month.12": entry("Декабрь", "Grudzień", "December")
};

const messages = { ...common, ...carLocalizationMessages, ...homeLocalizationMessages };
const pageFields = ["title", "description", "h1", "intro"];

for (const [locale, localePages] of Object.entries(pages)) {
  for (const page of localePages) {
    const [pageId, , title, description, h1, intro, cards] = page;
    pageFields.forEach((field, index) => {
      const key = `page.${pageId}.${field}`;
      messages[key] ||= {};
      messages[key][locale] = page[index + 2];
    });
    cards.forEach((card, index) => {
      const key = `page.${pageId}.card.${index + 1}`;
      messages[key] ||= {};
      messages[key][locale] = card;
    });
  }
}

for (const [locale, config] of Object.entries(locales)) {
  const localeMessages = {
    "locale.label": config.label,
    "locale.cta": config.cta,
    "locale.eyebrow": config.eyebrow,
    "locale.footer": config.footer,
    "locale.breadcrumb": config.breadcrumb
  };
  for (const [key, value] of Object.entries(localeMessages)) {
    messages[key] ||= {};
    messages[key][locale] = value;
  }
}

export { messages };

export function t(locale, key, variables = {}) {
  const translation = messages[key]?.[locale];
  if (typeof translation !== "string" || !translation.trim()) {
    throw new Error(`Missing translation: ${key} (${locale})`);
  }
  return translation.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : match
  );
}

export function validateCatalog() {
  const errors = [];
  for (const [key, values] of Object.entries(messages)) {
    if (!/^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+$/.test(key)) {
      errors.push(`${key}: invalid semantic key`);
    }
    for (const locale of Object.keys(locales)) {
      if (typeof values[locale] !== "string" || !values[locale].trim()) {
        errors.push(`${key}: missing ${locale}`);
      }
    }
  }
  return errors;
}
