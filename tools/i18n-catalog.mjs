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
  "action.checkOffer": entry("Проверить предложение", "Sprawdź ofertę", "View offer"),
  "action.viewDetails": entry("Посмотреть детали", "Zobacz szczegóły", "View details"),
  "action.requestQuote": entry("Запросить расчёт", "Poproś o wycenę", "Request a quote"),
  "action.bookViewing": entry("Записаться на осмотр", "Umów oględziny", "Book a viewing"),
  "action.askDelivery": entry("Уточнить срок поступления", "Zapytaj o termin dostawy", "Ask about arrival date"),
  "action.callAboutCar": entry("Позвонить по этому авто", "Zadzwoń w sprawie auta", "Call about this car"),
  "action.writeAboutCar": entry("Написать по этому авто", "Napisz w sprawie auta", "Ask about this car"),
  "action.callNow": entry("Позвонить", "Zadzwoń", "Call now"),
  "action.contactUs": entry("Связаться с нами", "Skontaktuj się z nami", "Contact us"),
  "action.open": entry("Открыть", "Otwórz", "Open"),
  "action.download": entry("Скачать", "Pobierz", "Download"),
  "action.calculate": entry("Рассчитать", "Oblicz", "Calculate"),
  "action.submitRequest": entry("Отправить заявку", "Wyślij zapytanie", "Send request"),
  "action.backHome": entry("На главную", "Na stronę główną", "Go home"),
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
  "common.notConfirmed": entry("Не подтверждено", "Niepotwierdzone", "Not confirmed"),
  "common.byAppointment": entry("По предварительной записи", "Po wcześniejszym umówieniu", "By appointment"),
  "catalogue.page.heading": entry("Каталог автомобилей", "Aktualny katalog samochodów", "Current vehicle catalogue"),
  "catalogue.page.intro": entry("Доступные автомобили, машины в пути и недавно проданные предложения — с фотографиями, ценой и известными данными.", "Samochody dostępne na placu, auta w drodze i niedawno sprzedane oferty — ze zdjęciami, ceną i znanymi danymi.", "Vehicles on site, cars in transit and recently sold listings—with photos, prices and known details."),
  "contact.direct.heading": entry("Выберите удобный способ связи", "Wybierz wygodny kontakt", "Choose how to contact us"),
  "contact.direct.intro": entry("Перед поездкой договоритесь о встрече и подтвердите наличие конкретного автомобиля.", "Przed przyjazdem umów spotkanie i potwierdź dostępność konkretnego samochodu.", "Before visiting, arrange a meeting and confirm that the specific vehicle is available."),
  "contact.office.note": entry("Офис компании. Встречи по предварительной записи.", "Biuro spółki. Spotkania po wcześniejszym umówieniu.", "Company office. Meetings by appointment."),
  "contact.lot.note": entry("Осмотр и выдача автомобилей по предварительной записи.", "Oględziny i wydanie samochodów po wcześniejszym umówieniu.", "Vehicle viewings and handovers by appointment."),
  "process.contract.heading": entry("Договор, бюджет и оплата", "Umowa, budżet i płatność", "Agreement, budget and payment"),
  "process.contract.intro": entry("До финансового решения клиент получает данные юридического лица, согласованный объём услуги и структуру затрат по конкретной сделке.", "Przed decyzją finansową klient otrzymuje dane strony umowy, uzgodniony zakres usługi i strukturę kosztów konkretnej transakcji.", "Before making a financial decision, the client receives the contracting party details, agreed scope and cost structure for the specific transaction."),
  "process.contract.item1.title": entry("Сторона договора", "Strona umowy", "Contracting party"),
  "process.contract.item1.text": entry("Условия подтверждаются с Atlant Capital Sp. z o.o.; регистрационные данные опубликованы на сайте и доступны в KRS.", "Warunki są potwierdzane z Atlant Capital Sp. z o.o.; dane rejestrowe publikujemy na stronie i można je sprawdzić w KRS.", "Terms are confirmed with Atlant Capital Sp. z o.o.; registration details are published on the site and can be checked in KRS."),
  "process.contract.item2.title": entry("Платёж по документу", "Płatność według dokumentu", "Payment against documentation"),
  "process.contract.item2.text": entry("Сумма, назначение и реквизиты получателя указываются в документе по конкретной сделке.", "Kwota, tytuł płatności i dane odbiorcy wynikają z dokumentu dotyczącego konkretnej transakcji.", "The amount, payment reference and recipient details are set out in the document for the specific transaction."),
  "process.contract.item3.title": entry("Раздельные расходы", "Rozdzielone koszty", "Itemised costs"),
  "process.contract.item3.text": entry("Стоимость автомобиля, услуги, транспорт и дополнительные формальности показываются отдельными позициями до согласования.", "Cena samochodu, usługa, transport i dodatkowe formalności są przedstawiane osobno przed akceptacją.", "Vehicle price, service, transport and additional formalities are shown separately before approval."),
  "process.contract.item4.title": entry("Решение клиента", "Decyzja klienta", "Client approval"),
  "process.contract.item4.text": entry("Покупка проводится только в согласованном лимите и после одобрения выбранного автомобиля и известных затрат.", "Zakup odbywa się wyłącznie w uzgodnionym limicie, po akceptacji samochodu i znanych kosztów.", "The purchase proceeds only within the agreed limit after the vehicle and known costs have been approved."),
  "vehicle.transparency.heading": entry("Информация перед контактом", "Informacje przed kontaktem", "Information before you contact us"),
  "vehicle.transparency.saleDocument": entry("Документ продажи и НДС", "Dokument sprzedaży i VAT", "Sales document and VAT"),
  "vehicle.transparency.saleDocumentValue": entry("Подтверждается для конкретной сделки", "Do potwierdzenia dla konkretnej transakcji", "Confirmed for the specific transaction"),
  "vehicle.transparency.viewing": entry("Осмотр", "Oględziny", "Viewing"),
  "vehicle.transparency.viewingOnSite": entry("На площадке в Варшаве по предварительной записи", "Na placu w Warszawie po wcześniejszym umówieniu", "At the Warsaw lot by appointment"),
  "vehicle.transparency.viewingTransit": entry("После поступления автомобиля на площадку", "Po dostarczeniu samochodu na plac", "After the vehicle arrives at the lot"),
  "vehicle.transparency.history": entry("История и отчёты", "Historia i raporty", "History and reports"),
  "vehicle.transparency.historyKnown": entry("Доступные записи приведены ниже", "Dostępne wpisy pokazujemy poniżej", "Available records are shown below"),
  "vehicle.transparency.historyUnknown": entry("Нет подтверждённой полной истории", "Brak potwierdzonej pełnej historii", "No complete verified history"),
  "vehicle.cta.heading": entry("Хотите посмотреть этот автомобиль?", "Chcesz obejrzeć ten samochód?", "Would you like to view this vehicle?"),
  "vehicle.cta.text": entry("Свяжитесь с нами, чтобы подтвердить наличие, договориться о времени и уточнить известные данные.", "Skontaktuj się z nami, aby potwierdzić dostępność, ustalić termin i wyjaśnić znane dane.", "Contact us to confirm availability, arrange a time and clarify the known details."),
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
    "Укажите телефон или email.",
    "Podaj telefon lub email.",
    "Enter a phone number or email address."
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
  "vehicle.status.inTransit": entry("Скоро в наличии", "Wkrótce dostępny", "Coming soon"),
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
  "faq.item1.question": entry("Как начинается подбор автомобиля?", "Jak rozpoczyna się wyszukiwanie samochodu?", "How does the vehicle search begin?"),
  "faq.item1.answer": entry(
    "Сначала мы уточняем бюджет, назначение автомобиля и обязательные требования. После этого согласовываем формат работы и начинаем поиск подходящих предложений.",
    "Najpierw ustalamy budżet, przeznaczenie samochodu i najważniejsze wymagania. Następnie uzgadniamy zakres współpracy i rozpoczynamy wyszukiwanie odpowiednich ofert.",
    "We first confirm your budget, intended use and essential requirements. We then agree the scope of work and begin searching for suitable offers."
  ),
  "faq.item2.question": entry("Можно ли проверить автомобиль до покупки?", "Czy samochód można sprawdzić przed zakupem?", "Can the vehicle be checked before purchase?"),
  "faq.item2.answer": entry(
    "Да, в объёме, который допускает источник предложения. Мы анализируем фотографии, описание, доступные отчёты, документы и сервисную историю, если она предоставлена.",
    "Tak, w zakresie dostępnym dla danego źródła oferty. Analizujemy zdjęcia, opis, dostępne raporty, dokumenty oraz historię serwisową, jeżeli została udostępniona.",
    "Yes, to the extent allowed by the listing source. We review photos, the description, available reports, documents and service history when provided."
  ),
  "faq.item3.question": entry("Что я получу перед решением о покупке?", "Jakie informacje otrzymam przed decyzją o zakupie?", "What information will I receive before deciding?"),
  "faq.item3.answer": entry(
    "Мы передаём доступные данные по конкретному автомобилю, отмечаем обнаруженные риски и заранее показываем структуру расходов. Финансовое решение остаётся за клиентом.",
    "Przekazujemy dostępne dane konkretnego samochodu, wskazujemy zauważone ryzyka i przedstawiamy strukturę kosztów przed zakupem. Decyzja finansowa należy do klienta.",
    "We provide the available information for the specific vehicle, highlight identified risks and show the cost structure before purchase. The financial decision remains with the client."
  ),
  "faq.item4.question": entry("Из чего складывается итоговая стоимость?", "Co składa się na całkowity koszt?", "What makes up the total cost?"),
  "faq.item4.answer": entry(
    "Итоговая сумма включает цену автомобиля, комиссии продавца или площадки, услугу Atlant Auto, транспорт и согласованные формальности. Точную смету фиксируем для выбранного автомобиля.",
    "Całkowita kwota obejmuje cenę samochodu, opłaty sprzedawcy lub platformy, usługę Atlant Auto, transport i uzgodnione formalności. Dokładny kosztorys przygotowujemy dla wybranego auta.",
    "The total includes the vehicle price, seller or platform fees, the Atlant Auto service, transport and agreed formalities. We prepare an exact estimate for the selected vehicle."
  ),
  "faq.item5.question": entry("Как проходит покупка на аукционе?", "Jak przebiega zakup na aukcji?", "How does an auction purchase work?"),
  "faq.item5.answer": entry(
    "До торгов мы согласовываем автомобиль и максимальный бюджет. Ставка не превышает утверждённый лимит, а покупка подтверждается документами площадки или продавца.",
    "Przed licytacją uzgadniamy samochód i maksymalny budżet. Oferta nie przekracza zaakceptowanego limitu, a zakup jest potwierdzony dokumentami platformy lub sprzedawcy.",
    "Before bidding, we agree the vehicle and maximum budget. The bid does not exceed the approved limit, and the purchase is confirmed by the platform or seller documentation."
  ),
  "faq.item6.question": entry("Сколько занимает доставка автомобиля?", "Ile trwa dostawa samochodu?", "How long does vehicle delivery take?"),
  "faq.item6.answer": entry(
    "Срок зависит от страны, местонахождения автомобиля, готовности документов и перевозчика. Ориентировочную дату сообщаем после подтверждения покупки и возможности забора.",
    "Termin zależy od kraju, lokalizacji samochodu, gotowości dokumentów i przewoźnika. Przewidywaną datę podajemy po potwierdzeniu zakupu i możliwości odbioru auta.",
    "Timing depends on the country, vehicle location, document readiness and carrier. We provide an estimate after the purchase and collection availability are confirmed."
  ),
  "faq.item7.question": entry("Можно ли заказать проверку автомобиля в сервисе?", "Czy można zamówić kontrolę samochodu w serwisie?", "Can I order a workshop inspection?"),
  "faq.item7.answer": entry(
    "Да. В расширенном пакете мы организуем стандартную проверку в согласованном сервисе. Углублённая диагностика и ремонт выполняются только после отдельного согласования.",
    "Tak. W rozszerzonym pakiecie organizujemy standardową kontrolę w uzgodnionym serwisie. Diagnostyka rozszerzona i naprawy wymagają osobnej akceptacji.",
    "Yes. Our extended package includes a standard check at an agreed workshop. Advanced diagnostics and repairs require separate approval."
  ),
  "faq.item8.question": entry("Какие документы получает клиент?", "Jakie dokumenty otrzymuje klient?", "Which documents does the client receive?"),
  "faq.item8.answer": entry(
    "Комплект зависит от страны и продавца. Мы передаём документы покупки и доступные документы автомобиля, необходимые для дальнейших формальностей в Польше.",
    "Zakres zależy od kraju i sprzedawcy. Przekazujemy dokumenty zakupu oraz dostępne dokumenty pojazdu potrzebne do dalszych formalności w Polsce.",
    "The document set depends on the country and seller. We provide the purchase documents and available vehicle documents needed for subsequent formalities in Poland."
  ),
  "faq.item9.question": entry("Можно ли зарегистрировать автомобиль в Польше?", "Czy samochód można zarejestrować w Polsce?", "Can the vehicle be registered in Poland?"),
  "faq.item9.answer": entry(
    "Мы помогаем подготовить документы и пройти согласованные формальности, связанные с регистрацией автомобиля в Польше. Точный перечень зависит от происхождения автомобиля.",
    "Pomagamy przygotować dokumenty i przejść uzgodnione formalności związane z rejestracją samochodu w Polsce. Dokładny zakres zależy od pochodzenia pojazdu.",
    "We help prepare the documents and handle agreed formalities connected with registering the vehicle in Poland. The exact requirements depend on the vehicle's origin."
  ),
  "faq.item10.question": entry("Что происходит, если состояние отличается от описания?", "Co się dzieje, gdy stan auta różni się od opisu?", "What happens if the condition differs from the description?"),
  "faq.item10.answer": entry(
    "Мы фиксируем расхождения и сравниваем их с исходным описанием и документами. Дальнейшие действия зависят от условий конкретного продавца или аукционной площадки.",
    "Dokumentujemy różnice i porównujemy je z pierwotnym opisem oraz dokumentami. Dalsze działania zależą od warunków konkretnego sprzedawcy lub platformy aukcyjnej.",
    "We document the differences and compare them with the original description and records. The next steps depend on the terms of the specific seller or auction platform."
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
