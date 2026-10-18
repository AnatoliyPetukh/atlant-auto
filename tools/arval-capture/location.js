import {franceDepartments} from './france-departments.js';

const countries={AT:'Австрия',BE:'Бельгия',BG:'Болгария',HR:'Хорватия',CY:'Кипр',CZ:'Чехия',DK:'Дания',EE:'Эстония',FI:'Финляндия',FR:'Франция',DE:'Германия',GR:'Греция',HU:'Венгрия',IE:'Ирландия',IT:'Италия',LV:'Латвия',LT:'Литва',LU:'Люксембург',MT:'Мальта',NL:'Нидерланды',PL:'Польша',PT:'Португалия',RO:'Румыния',SK:'Словакия',SI:'Словения',ES:'Испания',SE:'Швеция',NO:'Норвегия',CH:'Швейцария',GB:'Великобритания',IS:'Исландия',LI:'Лихтенштейн'};
const franceRegions={'01':'Гваделупа','02':'Мартиника','03':'Французская Гвиана','04':'Реюньон','06':'Майотта','11':'Иль-де-Франс','24':'Центр — Долина Луары','27':'Бургундия — Франш-Конте','28':'Нормандия','32':'О-де-Франс','44':'Гранд-Эст','52':'Пеи-де-ла-Луар','53':'Бретань','75':'Новая Аквитания','76':'Окситания','84':'Овернь — Рона — Альпы','93':'Прованс — Альпы — Лазурный Берег','94':'Корсика'};

export function resolveLocation(value) {
  const source=String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim();
  const namedCountries={Germany:'DE',Deutschland:'DE',France:'FR',Poland:'PL',Polska:'PL',Netherlands:'NL',Belgium:'BE',Spain:'ES',Italy:'IT',Denmark:'DK',Norway:'NO',Sweden:'SE',Austria:'AT',Finland:'FI',Portugal:'PT',Switzerland:'CH'};
  const named=Object.keys(namedCountries).find(name=>source.toLowerCase().endsWith(name.toLowerCase()));
  const code=source.toUpperCase().match(/^([A-Z]{2})(?:-|$)/)?.[1]||namedCountries[named];
  const country=countries[code]||null;
  const result={source,country_code:country?code:null,country,region:null,department:null,method:country?'country_code':'unresolved',label:country||'Местоположение уточняется'};
  if(code==='FR') {
    // The second segment is a department identifier, not a street/postal address.
    const departmentCode=source.toUpperCase().match(/^FR-([0-9]{2,3}|2[AB])(?:-|$)/)?.[1];
    const department=franceDepartments[departmentCode];
    const region=department&&franceRegions[department.region];
    if(region){result.region=region;result.department={code:departmentCode,name:department.name};result.method='fr_department_code';result.label=`${country}, ${region}`;}
  }
  return result;
}
export function applyVehicleLocation(packet) {packet.vehicle.location=resolveLocation(packet.vehicle.storage_location);return packet;}
