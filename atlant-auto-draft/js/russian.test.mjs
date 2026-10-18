import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pages,equivalents} from '../../tools/seo-config.mjs';
const read=route=>fs.readFileSync(new URL(`..${route}index.html`,import.meta.url),'utf8');
test('Russian pages have equivalent language destinations and local navigation',()=>{
 for(const [key,route] of pages.ru){
  const html=read(route);
  assert.match(html,/<html lang="ru">/);
  assert.match(html,/[А-Яа-я]/);
  assert.doesNotMatch(html,/undefined|Missing translation|View current offers|Verified cars/);
  for(const code of ['pl','en','ru'])assert.ok(html.includes(`href="${equivalents[key][code]}" lang="${code}"`),`${route}: ${code}`);
  assert.ok(html.includes('href="/ru/avtomobili/"'));
 }
});
test('Russian catalogue includes localized controls and handles network failures in Russian',()=>{
 const html=read('/ru/oferty/');
 for(const label of ['Все','В пути','В Варшаве','без НДС','Загружаем автомобили'])assert.ok(html.includes(label));
 const js=fs.readFileSync(new URL('../ru/oferty/catalog.js',import.meta.url),'utf8');
 assert.ok(js.includes('Не удалось загрузить каталог'));
 assert.ok(js.includes('ru-RU'));
 assert.ok(js.includes('Подробности подтвердим до покупки'));
 assert.ok(js.includes('map(localizeCar)'));
});
