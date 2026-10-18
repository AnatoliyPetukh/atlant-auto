import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {translations,pageTranslations} from './catalog-ru.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'atlant-auto-draft/ru/oferty');
fs.mkdirSync(target,{recursive:true});
let html=fs.readFileSync(path.join(root,'public-catalog/index.html'),'utf8');
for(const [source,value] of Object.entries(pageTranslations).sort((a,b)=>b[0].length-a[0].length))html=html.replaceAll(source,value);
html=html.replace('lang="pl"','lang="ru"').replaceAll('/pl/oferty/','/ru/oferty/').replaceAll('/pl/kontakt/','/ru/kontakty/').replaceAll('/pl/','/ru/').replace(/https:\/\/serwer2454127.home.pl\/offers\/catalog.js\?[^" ]+/, '/ru/oferty/catalog.js?v=20261018-ru1');
html=html.replace('</nav></header>','<a href="/pl/oferty/" lang="pl">PL</a><a href="/en/" lang="en">EN</a><a href="/ru/oferty/" lang="ru" aria-current="page">RU</a></nav></header>');
fs.writeFileSync(path.join(target,'index.html'),html);
let js=fs.readFileSync(path.join(root,'public-catalog/catalog.js'),'utf8');
// Replace complete string literals, never data keys or arbitrary substrings.
js=js.replace(/'((?:[^'\\]|\\.)*)'/g,(literal,value)=>Object.hasOwn(translations,value)?JSON.stringify(translations[value]):literal);
js=js.replaceAll("'pl-PL'","'ru-RU'").replaceAll('arrivalLabel(car)',"arrivalLabel(car,'ru-RU')");
js=js.replace('cars=(data.cars||[])','cars=(data.cars||[]).map(localizeCar)');
js=js.replace("$('status').textContent=error.message;", "$('status').textContent=error instanceof TypeError ? 'Не удалось загрузить каталог. Попробуйте снова или свяжитесь с нами.' : error.message;");
const descriptions=JSON.parse(fs.readFileSync(path.join(root,'tools/catalog-descriptions-ru.json'),'utf8'));
js=`const dictionary=${JSON.stringify({...translations,...descriptions})};
function localizeCar(car){const copy={...car};for(const key of Object.keys(copy)){if(key.endsWith('_pl')||key==='state_label'){const translate=value=>dictionary[value]||value;copy[key]=Array.isArray(copy[key])?copy[key].map(translate):translate(copy[key]);}}return copy;}
`+js;
fs.writeFileSync(path.join(target,'catalog.js'),js);
fs.copyFileSync(path.join(root,'public-catalog/arrival-window.js'),path.join(target,'arrival-window.js'));
// The existing Polish catalogue must also expose the restored language choice.
const plPath=path.join(root,'atlant-auto-draft/pl/oferty/index.html');
let pl=fs.readFileSync(plPath,'utf8');
if(!pl.includes('lang="ru"'))pl=pl.replace('</nav></header>','<a href="/pl/oferty/" lang="pl" aria-current="page">PL</a><a href="/en/" lang="en">EN</a><a href="/ru/oferty/" lang="ru">RU</a></nav></header>');
fs.writeFileSync(plPath,pl);
