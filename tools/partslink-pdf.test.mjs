import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePartslinkText,mergePartslinkDocuments} from './arval-capture/partslink-pdf.js';
import {vehicleFacts} from './arval-capture/vehicle-facts.js';
const vin='UU100000000000001';
const row=(left,right='',page=1)=>({page,y:700,text:[left,right].filter(Boolean).join(' '),cells:[{x:60,str:left},...(right?[{x:212,str:right}]:[])]});
const rows=()=>[row('Идентификация автомобиля'),row('Характеристика','Данные автомобиля'),row('Номер шасси',vin),row('Модель','EXAMPLE'),row('Дата производства','2023-03-15'),row('Тип двигателя','БЕНЗИНОВЫЙ ДВИГАТЕЛЬ 1,0'),row('Оснащение'),row('Оснащение','Наименование'),row('LEDH2 - ТИП ФАР','LED HEADLAMP'),row('PTCAV - ПРЕДНАТЯЖИТЕЛЬ','FRONT SEAT BELT'),row('ПОЯСНЫХ ЛЯМОК','WITH PRETENSIONER'),row('1 / 2'),row('Оснащение','Наименование',2),row('NOCAM -','NO OUTSIDE CAMERA',2),row('APV003_A - ЗАВОД-','GEARBOX MANUFACTURER',2)];
const parse=r=>parsePartslinkText(r.map(x=>x.text).join('\n'),vin,r);
test('common columns work without a text logo or brand-specific signature',()=>{
 const p=parse(rows());assert.equal(p.template,'partslink-identification-columns');assert.equal(p.fields['Дата производства'],'2023-03-15');assert.equal(p.equipment.length,4);
 assert.equal(p.equipment[1].category,'ПРЕДНАТЯЖИТЕЛЬ ПОЯСНЫХ ЛЯМОК');assert.equal(p.equipment[1].label,'FRONT SEAT BELT WITH PRETENSIONER');assert.equal(p.equipment[2].label,'NO OUTSIDE CAMERA');assert.equal(p.equipment[3].code,'APV003_A');
 const f=vehicleFacts({vehicle:{make:'Dacia',first_registration_source:'May-23'},enrichment:{partslink24_pdf:p}});assert.equal(f.production.value,'2023-03-15');assert.equal(f.engine.fuel,'бензин');
});
test('column position is detected with separately extracted header words',()=>{
 const r=rows();r[1].cells=[{x:60,str:'Характеристика'},{x:212,str:'Данные'},{x:244,str:'автомобиля'}];assert.equal(parse(r).fields['Модель'],'EXAMPLE');
});
test('no production date uses explicitly labelled registration; invalid date does not',()=>{
 const r=rows().filter(x=>!x.text.startsWith('Дата производства'));const p=parse(r);
 const facts=parts=>vehicleFacts({vehicle:{make:'Dacia',first_registration_source:'May-23'},enrichment:{partslink24_pdf:parts}});
 assert.equal(facts(p).display_date.kind,'first_registration');p.fields['Дата производства']='2023-02-31';assert.equal(facts(p).display_date,null);
});
test('wrong and multiple VINs cannot bypass structural detection',()=>{
 assert.throws(()=>parsePartslinkText(rows().map(x=>x.text).join('\n'),'UU100000000000002',rows()),/VIN/);
 assert.throws(()=>parse([...rows(),row('VIN','UU100000000000002')]),/VIN/);
});
test('conflicting basic fields and multi-document dates are rejected',()=>{
 const r=rows();r.splice(5,0,row('Дата производства','2023-04-01'));assert.throws(()=>parse(r),/разные значения/);
 const p=parse(rows());assert.throws(()=>mergePartslinkDocuments([p,{...p,fields:{...p.fields,'Дата производства':'2023-04-01'}}],vin),/разные значения/);
});
test('a plain unbranded VIN/date document is not accepted as PartsLink',()=>{
 assert.throws(()=>parsePartslinkText(`VIN ${vin}\nProduction date: 2023`,vin),/определить таблицы/);
 assert.throws(()=>parse(rows().filter(x=>!x.text.startsWith('Модель'))),/определить таблицы/);
});
test('existing labelled PartsLink PDFs retain their parser and options',()=>{
 const p=parsePartslinkText(`partslink24\nVIN ${vin}\nProduction date: 2022\nOptional equipment\nS248A Steering wheel heating`,vin);
 assert.equal(p.template,'partslink-labelled-text');assert.equal(p.fields['Production date'],'2022');assert.equal(p.equipment[0].code,'S248A');
});
