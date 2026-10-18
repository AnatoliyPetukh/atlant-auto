import test from 'node:test';import assert from 'node:assert/strict';
import {arrivalLabel} from '../erp-assets/arrival-window.js';
import {erpCaption} from '../erp-assets/erp-telegram.js';
test('arrival windows compact dates in Polish and Russian',()=>{
 const r={eta_from:'2026-10-07',eta_to:'2026-10-14'};assert.equal(arrivalLabel(r),'7–14 października 2026');assert.equal(arrivalLabel(r,'ru-RU'),'7–14 октября 2026');
 assert.equal(arrivalLabel({eta_from:'2026-10-28',eta_to:'2026-11-04'},'ru-RU'),'28 октября–4 ноября 2026');
 assert.equal(arrivalLabel({eta_from:'2026-12-28',eta_to:'2027-01-04'},'ru-RU'),'28 декабря 2026 – 4 января 2027');
});
test('legacy single dates work; missing and invalid windows stay absent',()=>{
 assert.equal(arrivalLabel({eta:'2026-10-28'},'ru-RU'),'28 октября 2026');
 for(const record of [{},{eta_from:'2026-02-30'},{eta_from:'2026-10-14',eta_to:'2026-10-07'},{eta_to:'2026-10-14'}])assert.equal(arrivalLabel(record),null);
});
test('ERP Telegram includes the complete arrival window in transit',()=>{
 const packet={vehicle:{title:'Fixture',fuel:'Petrol'},condition:{},source:{},auction:{price:{amount:null}},documents:[]};
 const text=erpCaption(packet,{state:'in_transit',eta_from:'2026-10-07',eta_to:'2026-10-14'});assert.match(text,/Ожидаемое прибытие: 7–14 октября 2026/);
});

import {weekWindow,weekForDate} from '../erp-assets/product-arrival.js';
test('calendar week selects Monday through Sunday, including ISO year boundaries',()=>{
 assert.deepEqual(weekWindow('2026-W44'),{eta_from:'2026-10-26',eta_to:'2026-11-01'});
 assert.deepEqual(weekWindow('2026-W01'),{eta_from:'2025-12-29',eta_to:'2026-01-04'});
 assert.deepEqual(weekWindow('2020-W53'),{eta_from:'2020-12-28',eta_to:'2021-01-03'});
 assert.equal(weekForDate('2021-01-01'),'2020-W53');assert.equal(weekForDate('2026-10-28'),'2026-W44');
 for(const value of ['2021-W53','2026-W00','2026-W54','bad',''])assert.equal(weekWindow(value),null);
 assert.equal(weekForDate('2026-02-30'),'');
});
