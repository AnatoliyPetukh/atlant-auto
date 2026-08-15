export const site = {
  origin: "https://atlantauto.pl",
  name: "Atlant Auto",
  legalName: "Atlant Capital Sp. z o.o.",
  phone: "+48 515 392 420",
  email: "autoatlantcapital@gmail.com",
  address: "Wielkiego Dębu 6, 03-262 Warszawa",
  nip: "9512563774",
  telegram: "https://t.me/atlantautopl"
};

export const locales = {
  pl: {
    lang: "pl",
    home: "/pl/",
    label: "Polski",
    nav: ["Samochody", "Jak działamy", "Kalkulator", "O nas", "Kontakt"],
    routes: ["/pl/samochody/", "/pl/jak-dzialamy/", "/pl/kalkulator/", "/pl/o-nas/", "/pl/kontakt/"],
    cta: "Porozmawiajmy o samochodzie",
    eyebrow: "Atlant Auto · Warszawa",
    footer: "Wyszukiwanie, weryfikacja, zakup i dostawa samochodów z Europy.",
    breadcrumb: "Strona główna"
  },
  en: {
    lang: "en",
    home: "/en/",
    label: "English",
    nav: ["Cars", "How it works", "Calculator", "About", "Contact"],
    routes: ["/en/cars/", "/en/how-it-works/", "/en/calculator/", "/en/about/", "/en/contact/"],
    cta: "Discuss your car search",
    eyebrow: "Atlant Auto · Warsaw",
    footer: "Vehicle sourcing, checks, purchase and delivery from Europe.",
    breadcrumb: "Home"
  }
};

const ru = [
  ["home", "/", "Автомобили из Европы под ключ в Польше | Atlant Auto", "Подбор, проверка, выкуп и доставка автомобилей из Европы в Польшу. Прозрачный расчёт, документы и сопровождение сделки.", "Автомобили из Европы под ключ", "Подбираем автомобиль под бюджет, проверяем историю и документы, согласовываем полную стоимость до покупки и сопровождаем доставку в Варшаву.", ["Подбор по вашим критериям", "Проверка истории и состояния", "Выкуп, доставка и документы"]],
  ["europe", "/avto-iz-evropy/", "Авто из Европы с доставкой в Польшу | Atlant Auto", "Помогаем купить автомобиль из Европы: подбор, проверка, расчёт расходов, доставка и документы в Польше.", "Автомобили из Европы с проверкой и доставкой", "Ищем автомобили у европейских дилеров и на профессиональных площадках. До сделки показываем исходные документы, доступные отчёты и полный расчёт расходов.", ["Проверенные источники", "Понятный бюджет до покупки", "Сопровождение до передачи ключей"]],
  ["auction", "/avto-s-aukciona/", "Автомобили с европейских аукционов | Atlant Auto", "Подбор и покупка автомобилей с европейских аукционов: анализ лота, проверка документов, ставка, доставка и оформление.", "Автомобили с аукциона без покупки вслепую", "Разбираем отчёт по лоту, историю обслуживания и заметные дефекты. Ставку делаем только после согласования автомобиля и максимального бюджета.", ["Анализ аукционного отчёта", "Согласованный лимит ставки", "Документы и логистика"]],
  ["cars", "/avtomobili/", "Автомобили в наличии и под заказ | Atlant Auto", "Каталог автомобилей Atlant Auto в Варшаве: характеристики, фотографии, документы и предложения под заказ.", "Автомобили в наличии и под заказ", "В каталоге публикуем фактические характеристики, собственные фотографии и доступные документы. Если подходящего автомобиля нет, подберём вариант под заказ.", ["BMW 216d Gran Tourer", "BMW X1 sDrive16d", "Ford Focus Wagon", "Peugeot 308 SW Allure", "Peugeot 408 Allure", "Mercedes-Benz CLA 180 AMG Line"]],
  ["calculator", "/kalkulator/", "Калькулятор расходов на автомобиль | Atlant Auto", "Предварительный расчёт расходов на покупку, доставку и оформление автомобиля из Европы.", "Калькулятор расходов на автомобиль", "Используйте расчёт как ориентир, а точную смету мы подготовим после выбора страны, продавца и конкретного автомобиля.", ["Стоимость автомобиля", "Комиссии и доставка", "Оформление и дополнительные расходы"]],
  ["process", "/kak-my-rabotaem/", "Как купить авто из Европы | Процесс Atlant Auto", "Пошаговый процесс покупки автомобиля из Европы: запрос, подбор, проверка, выкуп, доставка и документы.", "Как мы подбираем и доставляем автомобиль", "Каждый этап согласовывается с клиентом. До финансового решения вы получаете информацию об автомобиле и понятную структуру расходов.", ["Запрос и бюджет", "Подбор и проверка", "Выкуп, доставка, документы"]],
  ["cases", "/kejsy/", "Кейсы доставки автомобилей из Европы | Atlant Auto", "Примеры автомобилей, подобранных и доставленных Atlant Auto, с исходными данными и этапами работы.", "Примеры выполненных заказов", "Показываем реальные автомобили из нашего каталога: фотографии, комплектацию, документы и известную историю без выдуманных обещаний.", ["BMW 216d Gran Tourer", "BMW X1 sDrive16d", "Ford Focus Wagon"]],
  ["about", "/o-kompanii/", "О компании Atlant Auto в Варшаве", "Atlant Auto — направление Atlant Capital Sp. z o.o. по подбору и доставке автомобилей из Европы.", "О компании Atlant Auto", "Работаем в Варшаве как польская компания Atlant Capital Sp. z o.o. Помогаем разобраться в предложениях, документах и полной стоимости автомобиля.", ["Польское юридическое лицо", "Прозрачные исходные данные", "Связь на русском и польском"]],
  ["faq", "/faq/", "Частые вопросы об авто из Европы | Atlant Auto", "Ответы на частые вопросы о подборе, проверке, покупке, доставке и оформлении автомобиля из Европы.", "Частые вопросы", "Собрали короткие ответы о процессе покупки. Условия конкретной сделки фиксируем после выбора автомобиля и маршрута доставки.", ["Можно ли проверить автомобиль до покупки?", "Из чего складывается итоговая стоимость?", "Какие документы получает клиент?"]],
  ["contact", "/kontakty/", "Контакты Atlant Auto в Варшаве", "Телефон, email, Telegram и адрес Atlant Auto в Варшаве. Свяжитесь с нами для подбора автомобиля.", "Контакты Atlant Auto", "Расскажите, какой автомобиль ищете и какой бюджет планируете. Мы уточним задачу и предложим следующий практический шаг.", ["Телефон: +48 515 392 420", "Telegram: @atlantautopl", "Wielkiego Dębu 6, Warszawa"]],
  ["privacy", "/privacy/", "Политика конфиденциальности | Atlant Auto", "Основная информация об обработке персональных данных посетителей сайта Atlant Auto.", "Политика конфиденциальности", "Администратор данных — Atlant Capital Sp. z o.o. Данные, отправленные по телефону, email или в мессенджере, используются для ответа на запрос и подготовки предложения.", ["Контактные данные используются для ответа", "Данные не продаются третьим лицам", "Запрос об удалении можно направить по email"]]
];

const pl = [
  ["home", "/pl/", "Samochody z Europy z dostawą | Atlant Auto", "Wyszukiwanie, weryfikacja, zakup i dostawa samochodów z Europy do Polski. Jasny kosztorys i wsparcie formalne.", "Samochody z Europy — kompleksowa obsługa", "Dobieramy samochód do budżetu, sprawdzamy historię i dokumenty, uzgadniamy koszty przed zakupem i organizujemy dostawę do Warszawy.", ["Dobór według kryteriów", "Weryfikacja historii i stanu", "Zakup, transport i dokumenty"]],
  ["europe", "/pl/samochody-z-europy/", "Samochody z Europy do Polski | Atlant Auto", "Pomagamy kupić samochód z Europy: wyszukiwanie, weryfikacja, kosztorys, transport i dokumenty.", "Samochody z Europy z weryfikacją", "Szukamy ofert u europejskich dealerów i na profesjonalnych platformach. Przed zakupem przedstawiamy dostępne dokumenty, raporty i pełny kosztorys.", ["Sprawdzone źródła", "Kosztorys przed zakupem", "Obsługa do wydania auta"]],
  ["auction", "/pl/samochody-z-aukcji/", "Samochody z aukcji europejskich | Atlant Auto", "Analiza, zakup i dostawa samochodów z aukcji europejskich wraz z weryfikacją dokumentów.", "Samochody z aukcji bez kupowania w ciemno", "Analizujemy raport, historię serwisową i widoczne uszkodzenia. Licytujemy dopiero po akceptacji samochodu i maksymalnego budżetu.", ["Analiza raportu aukcyjnego", "Uzgodniony limit", "Dokumenty i transport"]],
  ["cars", "/pl/samochody/", "Samochody dostępne i na zamówienie | Atlant Auto", "Katalog samochodów Atlant Auto w Warszawie: zdjęcia, dane techniczne, dokumenty i auta na zamówienie.", "Samochody dostępne i na zamówienie", "Publikujemy faktyczne dane, własne zdjęcia i dostępne dokumenty. Jeśli nie ma odpowiedniego auta, przygotujemy wyszukiwanie na zamówienie.", ["Peugeot 408 GT", "Peugeot 408 Allure", "BMW 116d Business Advantage", "Renault Mégane Sporter Equilibre", "BMW 216d Gran Tourer", "BMW X1 sDrive16d", "Ford Focus Wagon", "Peugeot 308 SW Allure", "Peugeot 408 Allure", "Mercedes-Benz CLA 180 AMG Line"]],
  ["calculator", "/pl/kalkulator/", "Kalkulator kosztów samochodu | Atlant Auto", "Wstępny kalkulator kosztów zakupu, transportu i formalności samochodu z Europy.", "Kalkulator kosztów samochodu", "Wynik jest orientacyjny. Dokładny kosztorys przygotujemy po wyborze kraju, sprzedawcy i konkretnego samochodu.", ["Cena samochodu", "Opłaty i transport", "Formalności i dodatkowe koszty"]],
  ["process", "/pl/jak-dzialamy/", "Jak działamy przy zakupie auta | Atlant Auto", "Proces zakupu samochodu z Europy: wymagania, wyszukiwanie, weryfikacja, zakup, transport i dokumenty.", "Jak wyszukujemy i dostarczamy samochód", "Każdy etap uzgadniamy z klientem. Przed decyzją finansową otrzymujesz informacje o aucie i przejrzystą strukturę kosztów.", ["Wymagania i budżet", "Wyszukiwanie i kontrola", "Zakup, transport, dokumenty"]],
  ["cases", "/pl/realizacje/", "Realizacje zakupu aut z Europy | Atlant Auto", "Przykłady samochodów wyszukanych i dostarczonych przez Atlant Auto wraz ze zdjęciami i danymi.", "Przykładowe realizacje", "Pokazujemy prawdziwe samochody z katalogu: zdjęcia, wyposażenie, dokumenty i znaną historię bez sztucznych ocen.", ["BMW 216d Gran Tourer", "BMW X1 sDrive16d", "Ford Focus Wagon"]],
  ["about", "/pl/o-nas/", "O Atlant Auto w Warszawie", "Atlant Auto to marka Atlant Capital Sp. z o.o. zajmująca się wyszukiwaniem i dostawą samochodów z Europy.", "O firmie Atlant Auto", "Działamy w Warszawie jako polska spółka Atlant Capital Sp. z o.o. Pomagamy ocenić oferty, dokumenty i pełny koszt zakupu.", ["Polska spółka", "Przejrzyste dane źródłowe", "Obsługa po polsku i angielsku"]],
  ["faq", "/pl/faq/", "Najczęstsze pytania o auta z Europy | Atlant Auto", "Odpowiedzi o wyszukiwaniu, weryfikacji, zakupie, transporcie i dokumentach samochodu z Europy.", "Najczęstsze pytania", "Krótkie odpowiedzi o procesie zakupu. Warunki konkretnej transakcji ustalamy po wyborze auta i trasy transportu.", ["Czy auto można sprawdzić przed zakupem?", "Co obejmuje całkowity koszt?", "Jakie dokumenty otrzymuje klient?"]],
  ["contact", "/pl/kontakt/", "Kontakt z Atlant Auto w Warszawie", "Telefon, email, Telegram i adres Atlant Auto w Warszawie. Skontaktuj się z nami w sprawie samochodu.", "Kontakt z Atlant Auto", "Napisz, jakiego samochodu szukasz i jaki planujesz budżet. Ustalimy wymagania i zaproponujemy kolejny krok.", ["Telefon: +48 515 392 420", "Telegram: @atlantautopl", "Wielkiego Dębu 6, Warszawa"]],
  ["privacy", "/pl/polityka-prywatnosci/", "Polityka prywatności | Atlant Auto", "Informacje o przetwarzaniu danych osobowych użytkowników strony Atlant Auto.", "Polityka prywatności", "Administratorem danych jest Atlant Capital Sp. z o.o. Dane przekazane telefonicznie, przez email lub komunikator służą do odpowiedzi na zapytanie.", ["Dane służą do obsługi zapytania", "Dane nie są sprzedawane", "Żądanie usunięcia można wysłać emailem"]]
];

const en = [
  ["home", "/en/", "Cars from Europe delivered to Poland | Atlant Auto", "Vehicle sourcing, checks, purchase and delivery from Europe to Poland with a clear budget and document support.", "Cars from Europe — end-to-end support", "We match vehicles to your budget, review history and documents, agree the full cost before purchase and arrange delivery to Warsaw.", ["Search tailored to your needs", "History and condition checks", "Purchase, transport and documents"]],
  ["europe", "/en/cars-from-europe/", "Cars from Europe to Poland | Atlant Auto", "Buy a car from Europe with sourcing, checks, a transparent cost estimate, transport and document support.", "Cars from Europe with checks and delivery", "We source vehicles from European dealers and professional platforms. Before purchase, we share available documents, reports and a complete cost estimate.", ["Professional sources", "Budget before purchase", "Support through handover"]],
  ["auction", "/en/auction-cars/", "Cars from European auctions | Atlant Auto", "Auction vehicle analysis, purchase, delivery and document verification for cars from Europe.", "Auction cars without buying blind", "We review the listing report, service history and visible defects. We bid only after the vehicle and maximum budget are approved.", ["Auction report review", "Agreed bid limit", "Documents and logistics"]],
  ["cars", "/en/cars/", "Available cars and vehicle sourcing | Atlant Auto", "Atlant Auto vehicle catalogue in Warsaw with photos, specifications, documents and sourcing on request.", "Available cars and sourcing on request", "We publish factual specifications, our photos and available documents. If no listed vehicle fits, we can start a tailored search.", ["Peugeot 408 GT", "Peugeot 408 Allure", "BMW 116d Business Advantage", "Renault Mégane Sporter Equilibre", "BMW 216d Gran Tourer", "BMW X1 sDrive16d", "Ford Focus Wagon", "Peugeot 308 SW Allure", "Peugeot 408 Allure", "Mercedes-Benz CLA 180 AMG Line"]],
  ["calculator", "/en/calculator/", "Vehicle cost calculator | Atlant Auto", "Preliminary estimate for vehicle purchase, delivery and formalities when buying a car from Europe.", "Vehicle cost calculator", "Use the result as a guide. We prepare an exact estimate after the country, seller and specific vehicle are known.", ["Vehicle price", "Fees and transport", "Formalities and other costs"]],
  ["process", "/en/how-it-works/", "How vehicle sourcing works | Atlant Auto", "The car buying process: brief, sourcing, checks, purchase, transport and documents.", "How we source and deliver your car", "Every stage is agreed with the client. Before any financial decision, you receive vehicle information and a clear cost breakdown.", ["Brief and budget", "Sourcing and checks", "Purchase, transport, documents"]],
  ["cases", "/en/case-studies/", "European car sourcing case studies | Atlant Auto", "Examples of vehicles sourced and delivered by Atlant Auto with photos, documents and verified details.", "Selected vehicle case studies", "We show real catalogue vehicles with photos, equipment, available documents and known history—without invented scores.", ["BMW 216d Gran Tourer", "BMW X1 sDrive16d", "Ford Focus Wagon"]],
  ["about", "/en/about/", "About Atlant Auto in Warsaw", "Atlant Auto is the European vehicle sourcing and delivery service of Atlant Capital Sp. z o.o.", "About Atlant Auto", "We operate in Warsaw as the Polish company Atlant Capital Sp. z o.o., helping clients assess listings, documents and total purchase cost.", ["Polish legal entity", "Transparent source data", "Polish and English support"]],
  ["faq", "/en/faq/", "Frequently asked questions | Atlant Auto", "Answers about sourcing, checks, purchase, transport and vehicle documentation in Europe.", "Frequently asked questions", "Short answers about the buying process. Transaction details are agreed after a vehicle and transport route are selected.", ["Can the vehicle be checked before purchase?", "What makes up the total cost?", "Which documents does the client receive?"]],
  ["contact", "/en/contact/", "Contact Atlant Auto in Warsaw", "Atlant Auto phone, email, Telegram and Warsaw address. Contact us about sourcing a vehicle.", "Contact Atlant Auto", "Tell us what vehicle you need and your planned budget. We will clarify the brief and suggest the next practical step.", ["Phone: +48 515 392 420", "Telegram: @atlantautopl", "Wielkiego Dębu 6, Warsaw"]],
  ["privacy", "/en/privacy/", "Privacy policy | Atlant Auto", "Information about personal data processing for visitors to the Atlant Auto website.", "Privacy policy", "Atlant Capital Sp. z o.o. is the data controller. Details shared by phone, email or messenger are used to answer enquiries and prepare an offer.", ["Data is used to answer enquiries", "Personal data is not sold", "Deletion requests can be sent by email"]]
];

const publicPage = (page) => page[0] !== "calculator";
export const pages = { pl: pl.filter(publicPage), en: en.filter(publicPage) };

export const equivalents = Object.fromEntries(
  pages.pl.map((page) => {
    const english = pages.en.find((candidate) => candidate[0] === page[0]);
    return [page[0], { pl: page[1], en: english[1] }];
  })
);
