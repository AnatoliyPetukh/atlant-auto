// Run with Playwright available in NODE_PATH. All network requests are fixtures.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');

(async()=>{
  const root=path.resolve(__dirname,'arval-capture');
  const collector=(await fs.readFile(path.join(root,'collector.js'),'utf8')).replace('export function','function');
  const vin='WBA00000000000001';
  const pair=(key,value)=>`<div class="d-flex"><span>${key}</span><span>${value}</span></div>`;
  const image=(file,query='')=>`<img src="/pictures/cars/${vin}/LARGEIMAGE/${file}.jpg${query}">`;
  const fixture=`<main><div class="card-body"><h2 id="submenu-main-characteristics">X2 sDrive18i</h2><p>49,128 km Apr-23 Petrol Manual</p>${pair('Brand','BMW')}${pair('Vehicle Identification Number',vin)}${pair('Year of production','2023')}${pair('Model year','2020')}${pair('4 wheel drive','No')}${pair('Number of Keys','2')}${pair('Power','100 kW / 136 HP')}${pair('Paint Color/Carmaker Color','White')}${pair('Country of registration documents','France')}${pair('VAT Deductible','Yes')}${image('01','?t=1')}${image('01','?t=2')}</div><h3 id="submenu-options">Options</h3><div>${pair('Equipment Type','Equipment Specification')}${pair('Navigation system','Navigation')}</div><div id="submenu-damages">${pair('Damaged Part(s)','Door')}${pair('Nature of damage','Dent')}${pair('Damage Repair','Smart repair')}${image('13')}</div><div id="submenu-maintenance-history"><h2>Maintenance history (0)</h2></div><h3 id="submenu-tyres">Tyres</h3><div>${pair('Front left','Summer 5 mm')}${pair('Rear right','Summer 4 mm')}</div><span>Highest Bid: 14,250 EUR</span><span>55mn 10s</span><a href="https://www4.macadam.eu/Manager/SinglePage/AppraisalWebview?AssessmentFileId=fixture">Report</a></main>`;
  const server=http.createServer(async(req,res)=>{
    try {
      const file=path.join(root,new URL(req.url,'http://local').pathname);
      if (!file.startsWith(root+path.sep)) throw Error('bad path');
      const ext=path.extname(file);res.setHeader('Content-Type',['.js','.mjs'].includes(ext)?'text/javascript':ext==='.css'?'text/css':'text/html');res.end(await fs.readFile(file));
    }catch{res.statusCode=404;res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page=await browser.newPage();
    await page.route('https://remktg.arval.com/**',r=>r.fulfill({contentType:'text/html',body:fixture}));
    await page.goto('https://remktg.arval.com/buyer/#/item-details/test-lot?salesEventId=123');
    const run=()=>page.evaluate(source=>new Function(source+';return collectArvalLot();')(),collector);
    const packet=await run();
    assert.equal(packet.vehicle.keys,2);assert.equal(packet.vehicle.power_kw,100);assert.equal(packet.vehicle.power_hp,136);assert.equal(packet.vehicle.registration_country_source,'France');assert.equal(packet.vehicle.vat_deductible,true);assert.equal(packet.vehicle.awd,false);assert(packet.condition.tyres_source.includes('Summer 5 mm'));assert.equal(packet.photos[1].damage.part,'Door');
    assert.equal(packet.vehicle.vin,vin);assert.equal(packet.vehicle.mileage_km,49128);
    assert.equal(packet.photos.length,2);assert.equal(packet.photos[1].kind,'damage');
    assert.equal(packet.equipment.length,1);assert.equal(packet.condition.damages[0].part,'Door');
    await page.locator('.d-flex').filter({hasText:'Number of Keys'}).evaluate(el=>el.lastElementChild.textContent='Unknown');assert.equal((await run()).vehicle.keys,null);await page.locator('.d-flex').filter({hasText:'Number of Keys'}).evaluate(el=>el.lastElementChild.textContent='2');
    await page.locator('.d-flex').filter({hasText:'Power'}).evaluate(el=>el.lastElementChild.textContent='100');assert.equal((await run()).vehicle.power_kw,null,'Power without units is not invented as kW');await page.locator('.d-flex').filter({hasText:'Power'}).evaluate(el=>el.lastElementChild.textContent='100 kW / 136 HP');
    const timerChecks=await page.evaluate(collector=>{
      const read=()=>eval(collector+';collectArvalLot()').auction.countdown_source;
      const original=[...document.querySelectorAll('span')].find(x=>x.textContent.trim()==='55mn 10s');
      if(original)original.remove();
      const box=document.createElement('div');box.className='auction-countdown';document.querySelector('main').append(box);
      const values=[];
      for(const html of ['<span>2</span> h <span>10</span> min','1d 3h 5m 9s','02:30:05','12 mn 00 s','20h 52mn','<span>20h</span> <span>52mn</span>','<strong><span>20h</span> <span>52mn</span></strong>']){box.innerHTML=html;values.push(read());}
      box.textContent='02:30:05';box.className='ordinary';values.push(read());
      box.className='auction-countdown';box.textContent='2 h';const other=document.createElement('time');other.textContent='3 h';box.after(other);values.push(read());other.remove();box.remove();
      return values;
    },collector);
    assert.deepEqual(timerChecks,['0 d 2 h 10 mn 0 s','1 d 3 h 5 mn 9 s','0 d 2 h 30 mn 5 s','0 d 0 h 12 mn 0 s','0 d 20 h 52 mn 0 s','0 d 20 h 52 mn 0 s','0 d 20 h 52 mn 0 s',null,null]);
    assert.equal(packet.auction.price.amount,14250);assert.equal(packet.auction.price.kind,'highest_bid');
    assert.equal(packet.auction.price.tax_basis,'unknown');assert.equal(packet.auction.ends_at,null);
    assert.equal(packet.documents[0].kind,'macadam_report');assert.equal(packet.workflow.publication,'draft');
    assert(packet.warnings.some(x=>x.includes('модельный год')));
    const serviceRows=[['Jul-26','81,419 km',"AR/Balais d’essuie-glace AV/Bougie d’allumage/Révision/main-d’œuvre"],['Feb-26','67,649 km',"Filtre d’habitacle/Filtre à air/Liquide de frein/Révision"],['Aug-25','52,562 km','Révision'],['Dec-24','37,526 km',"Balai d’essuie-glace AR/Balais d’essuie-glace AV/Filtre d’habitacle/Liquide de frein/Révision"],['Jun-24','20,076 km','Révision']];
    await page.locator('#submenu-maintenance-history').evaluate((el,rows)=>{el.innerHTML='<h2>Maintenance history (5)</h2><table><tr><th>Date</th><th>Mileage</th><th>Description</th></tr>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</table>';},serviceRows);
    const servicePacket=await run();assert.equal(servicePacket.condition.maintenance_entries.length,5);assert.equal(servicePacket.condition.maintenance_entries[0].mileage_km,81419);assert.equal(servicePacket.condition.maintenance_entries[0].date_month,'2026-07');assert.equal(servicePacket.condition.maintenance_entries[2].description_source,'Révision');
    await page.locator('#submenu-maintenance-history h2').evaluate(x=>x.textContent='Maintenance history (6)');assert((await run()).warnings.some(x=>x.includes('указано 6 записей, прочитано 5')));
    await page.locator('#submenu-maintenance-history').evaluate((el,rows)=>{el.innerHTML='<h2>Maintenance history (5)</h2>'+rows.map(row=>'<div>'+row.map(x=>'<span>'+x+'</span>').join('')+'</div>').join('');},serviceRows);
    assert.equal((await run()).condition.maintenance_entries.length,5);
    console.log('PASS service history: five screenshot-style rows in table/div layouts; source dates, mileage and French descriptions preserved; partial history not advertised as complete; public summary can be disabled.');
    await page.locator('span').filter({hasText:'Highest Bid:'}).evaluate(x=>x.textContent='Starting price: 10,000 EUR');
    assert.equal((await run()).auction.price.amount,null);
    await page.locator('#submenu-options').evaluate(x=>x.remove());
    assert.equal((await run()).equipment.length,0);
    await page.locator('span').filter({hasText:vin}).evaluate(x=>x.textContent='missing');
    await assert.rejects(run(),/VIN/);
    console.log('PASS collector: VIN, fields, deduplication, damage separation, source price semantics, missing values.');

    await page.goto(`${base}/export.html`);
    const naming=await page.evaluate(async()=>{
      const {normaliseVehicleTitle,applyVehicleTitle,publicVehicleTitle}=await import('./vehicle-title.js');
      const original={make:'Kia',title:'Kia Sportage Design Hybrid 1.6 T-GDi 230CV BVA6 E6d'};
      const packet=applyVehicleTitle({vehicle:{...original}});
      const variants=[['Kia','Sportage Design PHEV 1.6 T-GDi 265CV BVA6 E6d 4x4'],['Kia','Sportage MHEV 1.6 T-GDi BVM6 E6d'],['BMW','BMW M340i xDrive 3.0 374CV BVA8 E6d'],['Volkswagen','Golf GTI 2.0 TSI 245CV DSG7 E6d'],['Mercedes-Benz','E63 AMG 4MATIC 4.0 612CV BVA9 E6d'],['BYD','e6'],['Unknown','Design Something 2.0 190CV BVA8 E6d'],['Kia','Sportage MHEV PHEV 1.6 T-GDi E6d']].map(([make,title])=>normaliseVehicleTitle({make,title}));
      return {packet,variants,manual:publicVehicleTitle({...original,title_override:'Kia Sportage · мой заголовок'})};
    });
    assert.equal(naming.packet.vehicle.display_title,'Kia Sportage 1.6 T-GDi Hybrid');assert.equal(naming.packet.vehicle.title,'Kia Sportage Design Hybrid 1.6 T-GDi 230CV BVA6 E6d');
    assert.deepEqual(naming.packet.vehicle.title_details.trim_source,['Design']);assert.deepEqual(naming.packet.vehicle.title_details.power_source,['230CV']);assert.deepEqual(naming.packet.vehicle.title_details.gearbox_source,['BVA6']);assert.deepEqual(naming.packet.vehicle.title_details.emissions_source,['E6d']);
    assert(naming.variants[0].display_title.includes('Plug-in Hybrid')&&naming.variants[0].display_title.includes('4x4'));assert(naming.variants[1].display_title.includes('Mild Hybrid'));
    assert(naming.variants[2].display_title.includes('M340i xDrive'));assert(!naming.variants[2].display_title.startsWith('BMW BMW'));assert(naming.variants[3].display_title.includes('GTI'));assert(naming.variants[4].display_title.includes('E63 AMG 4MATIC'));
    assert.equal(naming.variants[5].display_title,'BYD e6');assert(naming.variants[6].display_title.includes('Design Something')&&naming.variants[6].needs_review);assert(naming.variants[7].display_title.includes('MHEV PHEV')&&naming.variants[7].needs_review);
    assert.equal(naming.manual,'Kia Sportage · мой заголовок');
    console.log('PASS vehicle naming: Kia headline cleaned, source facts retained, no duplicate brand, PHEV/MHEV distinct, drive/performance badges and unknown models preserved.');
    const equipmentChecks=await page.evaluate(async packet=>{
      const {equipmentHighlights,applyEquipmentHighlights}=await import('./equipment-highlights.js');const{telegramCaption}=await import('./telegram.js');const{parsePartslinkText}=await import('./partslink-pdf.js');
      const sample=structuredClone(packet);
      sample.equipment=[{type:'Navigation system'},{type:'Cruise control'},{type:'Automatic air-conditionning'}];
      sample.enrichment={partslink24:{equipment:[
        {code:'base',label:'Гидроусилитель руля'},{code:'base2',label:'ABS'},{code:'audio',label:'Audio system 360 W'},
        {code:'rear',label:'Rear view camera'},{code:'roof',label:'Panoramic glass roof'},
        {code:'cruise',label:'Cruise control'},{code:'acc',label:'Adaptive cruise control'},
        {code:'led',label:'LED headlamps'},{code:'adaptive',label:'Adaptive LED headlights'},
        {code:'surround',label:'Surround view cameras 360°'},
        {code:'noHud',label:'Without head-up display'},{code:'wheel',label:'Подогрев руля'}
      ]}};
      const selected=equipmentHighlights(sample);applyEquipmentHighlights(sample);
      const pdf=parsePartslinkText(`partslink24\nVIN: ${packet.vehicle.vin}\nOptional equipment\nS3AGA Rear view camera\nS248A\nSteering wheel heating\nVehicle data\nProduction date: 2022`,packet.vehicle.vin);
      return {selected,caption:telegramCaption(sample),saved:sample.vehicle.equipment_highlights,
        fallback:equipmentHighlights({...sample,enrichment:{}}),
        baseOnly:equipmentHighlights({...sample,enrichment:{partslink24:{equipment:[{code:'x',label:'Power steering'}]}}}),
        negative:equipmentHighlights({...sample,enrichment:{partslink24:{equipment:[{label:'Без панорамной крыши'},{label:'Without rear view camera'},{label:'Audio system 360 W'}]}}}),
        brand:equipmentHighlights({...sample,vehicle:{...sample.vehicle,make:'Kia'},enrichment:{partslink24:{equipment:[{code:'S3AGA',label:'Unknown option'}]}}}),
        pdf:equipmentHighlights({...sample,enrichment:{partslink24_pdf:pdf}}),pdfRows:pdf.equipment};
    },packet);
    assert.deepEqual(equipmentChecks.selected.items.map(x=>x.id),['camera360','adaptiveCruise','panorama','adaptiveLed','heatedWheel']);
    assert.equal(equipmentChecks.selected.source,'PartsLink');assert.equal(equipmentChecks.saved.items.length,5);
    assert(!equipmentChecks.caption.includes('гидроусилитель'));assert(!equipmentChecks.caption.includes('навигация'));assert(!equipmentChecks.caption.includes('проекционный дисплей'));
    assert.equal(equipmentChecks.fallback.source,'Arval');assert(equipmentChecks.fallback.items.some(x=>x.id==='navigation'));
    assert.equal(equipmentChecks.baseOnly.items.length,0);assert.equal(equipmentChecks.negative.items.length,0);assert.equal(equipmentChecks.brand.items.length,0);
    assert.equal(equipmentChecks.pdfRows.length,2);assert.equal(equipmentChecks.pdf.source,'PartsLink');assert(equipmentChecks.pdf.items.some(x=>x.id==='heatedWheel'));
    const equipmentSelection=await page.evaluate(async packet=>{
      const {equipmentHighlights,selectedEquipmentHighlights}=await import('./equipment-highlights.js');const{telegramCaption}=await import('./telegram.js');
      const labels=['камеры 360','адаптивный круиз-контроль','панорамная крыша','матричные фары','проекционный дисплей','вентиляция сидений','электросиденье с памятью','подогрев сидений','подогрев руля','контроль слепых зон','электропривод багажника','Apple CarPlay','Android Auto','датчик дождя','автоматическое включение фар','климат-контроль','навигационная система','LED-фары','без панорамной крыши','гидроусилитель руля'];
      const input={...packet,vehicle:{...packet.vehicle},enrichment:{partslink24:{equipment:labels.map(label=>({label}))}}};
      const all=equipmentHighlights(input,15);const defaults=selectedEquipmentHighlights(input);
      input.vehicle.equipment_selection=['carplay','heatedWheel','madeUp'];const picked=selectedEquipmentHighlights(input);const caption=telegramCaption(input,{buttons:true});
      input.vehicle.equipment_selection=[];const empty=telegramCaption(input,{buttons:true});
      return {all,defaults,picked,caption,empty};
    },packet);
    assert.equal(equipmentSelection.all.items.length,15);assert.equal(equipmentSelection.defaults.items.length,5);
    assert.deepEqual(equipmentSelection.picked.items.map(x=>x.id),['heatedWheel','carplay']);
    assert(equipmentSelection.caption.includes('В комплектации:\n• подогрев руля\n• Apple CarPlay'));
    assert(!equipmentSelection.caption.includes('панорамная крыша'));assert(!equipmentSelection.empty.includes('В комплектации:'));
    console.log('PASS equipment highlights: PartsLink primary, five ranked selling features, specific options replace generic duplicates, basic/negative options excluded, BMW codes never applied to another make, structured PDF rows supported, Arval fallback explicit.');
    const locations=await page.evaluate(async packet=>{
      const {resolveLocation,applyVehicleLocation}=await import('./location.js');const{telegramCaption}=await import('./telegram.js');
      const original=structuredClone(packet);original.vehicle.storage_location='FR-91-FLEURY-TEA';applyVehicleLocation(original);
      return {rows:['FR-91-FLEURY-TEA','FR-41-NEUVY-SATAS','FR-01-AMBERIEU-CAT','FR-2A-AJACCIO','FR-971-PARC','FR-00-UNKNOWN','DE-91-FLEURY','ZZ-91-FLEURY','unknown',null].map(resolveLocation),source:original.vehicle.storage_location,saved:original.vehicle.location,caption:telegramCaption(original)};
    },packet);
    assert.equal(locations.rows[0].label,'Франция, Иль-де-Франс');assert.equal(locations.rows[0].department.name,'Essonne');
    assert.equal(locations.rows[1].region,'Центр — Долина Луары');assert.equal(locations.rows[2].region,'Овернь — Рона — Альпы');assert.equal(locations.rows[3].region,'Корсика');assert.equal(locations.rows[4].region,'Гваделупа');
    assert.equal(locations.rows[5].label,'Франция');assert.equal(locations.rows[6].label,'Германия');
    assert(locations.rows.slice(7).every(x=>x.label==='Местоположение уточняется'&&x.country===null));
    assert.equal(locations.source,'FR-91-FLEURY-TEA');assert.equal(locations.saved.method,'fr_department_code');assert(locations.caption.includes('📍 Франция, Иль-де-Франс'));assert(!locations.caption.includes('FLEURY-TEA'));assert(!locations.caption.includes('maps.google'));
    console.log('PASS locations: France department resolves region, Corsica/overseas handled, other countries stay country-only, unknowns never invent a town; raw source retained, readable location in post without maps.');
    const factChecks=await page.evaluate(async packet=>{
      const {vehicleFacts,productionDate,productionLabel}=await import('./vehicle-facts.js');
      const run=(title,fuel,fields={})=>vehicleFacts({...packet,vehicle:{...packet.vehicle,title,fuel},enrichment:{partslink24:{fields}}});
      return {
        mild:run('Sportage 1.6 CRDi MHEV','Hybrid',{'Дата производства':'21.11.2022'}),
        full:run('Sportage HEV 1.6 T-GDi','Hybrid'),plug:run('Sportage PHEV','Hybrid'),
        ambiguous:run('Sportage Hybrid 1.6 T-GDi 230CV','Hybrid'),
        conflict:run('Sportage MHEV PHEV','Hybrid'),
        month:run('Sportage T-GDi MHEV','Hybrid',{'Production date':'2022-11'}),
        invalid:run('X2','Petrol',{'Дата выпуска':'31.02.2023'}),
        dateConflict:run('X2','Petrol',{'Дата выпуска':'2022-11','Build date':'2022-12-01'}),
        missing:vehicleFacts({...packet,vehicle:{...packet.vehicle,production_year:null,first_registration_source:'Apr-23',model_year:2023}}),
        dates:['2022','11/2022','2022-11-21','29.02.2023','29.02.2024'].map(productionDate),
        labels:[null,{value:'2022-11'},{value:'2022-11-21'}].map(productionLabel)
      };
    },packet);
    assert.equal(factChecks.mild.production.value,'2022-11-21');assert.equal(factChecks.mild.production.source,'PartsLink');assert.equal(factChecks.mild.engine.label,'мягкий гибрид (дизель)');assert(factChecks.mild.publication.ready);
    assert.equal(factChecks.month.engine.label,'мягкий гибрид (бензин)');assert.equal(factChecks.month.production.precision,'month');
    for(const name of ['full','plug','ambiguous','conflict','invalid','dateConflict','missing'])assert(!factChecks[name].publication.ready,name);
    assert.equal(factChecks.full.engine.hybrid_type,'full');assert.equal(factChecks.ambiguous.engine.hybrid_type,'unknown');assert.equal(factChecks.invalid.production,null);assert.equal(factChecks.missing.production,null);
    assert.equal(factChecks.dates[3],null);assert.equal(factChecks.dates[4].value,'2024-02-29');assert.equal(factChecks.labels[1],'11.2022 г.в.');
    console.log('PASS production/powertrain: PartsLink date priority/precision, invalid/conflicting dates rejected, registration never substituted, petrol/diesel MHEV distinguished, HEV/PHEV/unknown hybrids blocked for posting.');
    const dateFallback=await page.evaluate(async packet=>{
      const {vehicleFacts,vehicleDateLabel,registrationDate}=await import('./vehicle-facts.js');const{telegramCaption}=await import('./telegram.js');
      const run=(fields,{registration='Aug-23',source='partslink24',make='Opel'}={})=>{
        const input={...packet,vehicle:{...packet.vehicle,make,title:'Astra 1.2',fuel:'Petrol',production_year:2022,first_registration_source:registration},enrichment:{[source]:{fields,equipment:[]}}};
        const facts=vehicleFacts(input);return {facts,label:vehicleDateLabel(facts),caption:telegramCaption(input)};
      };
      return {absent:run({}),empty:run({'Дата производства':''}),dash:run({'Дата производства':'—'}),pdf:run({Модель:'C4'},{source:'partslink24_pdf',make:'Citroen'}),
        known:run({'Дата производства':'17.08.2022'}),invalid:run({'Дата производства':'31.02.2022'}),conflict:run({'Дата производства':'2022','Build date':'2023'}),
        noRegistration:run({},{registration:null}),invalidRegistration:run({},{registration:'Feb-99??'}),
        registrationDates:['Apr-23','Dec-99','29.02.2024','31.02.2023'].map(registrationDate)};
    },packet);
    for(const key of ['absent','empty','dash','pdf']){
      const result=dateFallback[key];assert(result.facts.publication.ready,key);assert.equal(result.facts.production,null);assert.equal(result.facts.display_date.kind,'first_registration');assert.equal(result.facts.display_date.value,'2023-08');assert.equal(result.label,'08.2023 · первая регистрация');assert(result.caption.includes('Первая регистрация: 08.2023')); assert(!result.caption.includes('2023 г.в.'));assert(result.facts.date_notice.includes('В PartsLink дата производства не указана'));
    }
    assert.equal(dateFallback.known.label,'17.08.2022 г.в.');assert.equal(dateFallback.known.facts.display_date.kind,'production');
    for(const key of ['invalid','conflict','noRegistration','invalidRegistration'])assert(!dateFallback[key].facts.publication.ready,key);
    assert.equal(dateFallback.registrationDates[1].value,'1999-12');assert.equal(dateFallback.registrationDates[3],null);
    console.log('PASS missing catalog production date: checked page/PDF with absent/empty date uses labelled Arval registration; real production wins; invalid/conflicting catalog dates and invalid registration stay blocked; production field is never overwritten by registration.');
    const mercedesCheck=await page.evaluate(async()=>{
      const{parsePartslinkText}=await import('./partslink-pdf.js');const{vehicleFacts}=await import('./vehicle-facts.js');const{equipmentHighlights}=await import('./equipment-highlights.js');
      const vin='WDD00000000000001';const rows=[];let y=750;
      const row=(cells,page=1)=>{rows.push({page,y,text:cells.map(x=>x[1]).join(' '),cells:cells.map(([x,str])=>({x,str}))});y-=16;};
      row([[60,'Идентификация автомобиля']]);row([[60,'Характеристика'],[210,'Данные автомобиля']]);row([[60,'Номер шасси'],[210,vin]]);
      row([[60,'Торговое наименование'],[210,'A 200']]);row([[60,'Дата поставки'],[210,'03.04.2019']]);row([[60,'Агрегаты']]);
      row([[60,'Оснащение']]);row([[60,'Оснащение'],[160,'Наименование'],[460,'Код типа']]);
      row([[60,'218'],[160,'ВИДЕОКАМЕРА ЗАДНЕГО ВИДА'],[460,'sales']]);
      row([[60,'07B'],[160,'РУКОВОДСТВО НА'],[460,'sales']]);row([[160,'ФРАНЦУЗСКОМ ЯЗЫКЕ']]);
      row([[60,'M282'],[160,'БЕНЗИНОВЫЙ ДВИГАТЕЛЬ R4'],[460,'sales']]);
      row([[60,'355'],[160,'ПОДГОТОВКА К ДОПОЛНИТЕЛЬНОЙ УСТАНОВКЕ НАВИГАЦИОННОЙ'],[460,'sales']]);row([[160,'СИСТЕМЫ']]);
      row([[60,'L'],[160,'ЛЕВОЕ РАСПОЛОЖЕНИЕ РУЛЯ'],[460,'sales']]);
      row([[60,'Данные VPD']]);row([[60,'00064'],[160,'NOT AN OPTION']]);
      const text=rows.map(x=>x.text).join('\n');const parts=parsePartslinkText(text,vin,rows);
      const makePacket=make=>({vehicle:{make,first_registration_source:'May-19'},enrichment:{partslink24_pdf:{...parts,template:make==='Opel'?'partslink-labelled-text':parts.template}}});
      let mismatch=false;try{parsePartslinkText(text,'WDD00000000000002',rows);}catch{mismatch=true;}
      return {parts,facts:vehicleFacts(makePacket('Mercedes-Benz')),other:vehicleFacts(makePacket('Opel')),highlights:equipmentHighlights(makePacket('Mercedes-Benz'),15),mismatch};
    });
    assert.equal(mercedesCheck.parts.template,'mercedes-columns-ru');assert.equal(mercedesCheck.parts.equipment.length,5);
    assert.equal(mercedesCheck.parts.equipment.find(x=>x.code==='07B').label,'РУКОВОДСТВО НА ФРАНЦУЗСКОМ ЯЗЫКЕ');
    assert(!mercedesCheck.parts.equipment.some(x=>x.code==='00064'));
    assert.equal(mercedesCheck.facts.production.value,'2019-04-03');assert.equal(mercedesCheck.facts.production.label,'Дата поставки');
    assert.equal(mercedesCheck.facts.production.mapping_rule,'mercedes_delivery_as_production');assert.equal(mercedesCheck.facts.engine.fuel,'бензин');
    assert.equal(mercedesCheck.other.production,null);assert.equal(mercedesCheck.other.display_date.kind,'first_registration');
    assert(!mercedesCheck.highlights.items.some(x=>x.id==='navigation'));assert(mercedesCheck.mismatch);
    console.log('PASS Mercedes PDF: numeric/letter codes, wrapped options, VPD excluded, exact VIN, owner delivery-date rule scoped to Mercedes, preparation not advertised as installed.');
    const kiaMerge=await page.evaluate(async()=>{
      const {parsePartslinkText,mergePartslinkDocuments}=await import('./partslink-pdf.js');const {vehicleFacts}=await import('./vehicle-facts.js');
      const vin='U5Y00000000000001';const row=(y,cells)=>({page:1,y,cells:cells.map(([x,str])=>({x,str})),text:cells.map(c=>c[1]).join(' ')});
      const prefix='Идентификация автомобиля\nНомер шасси '+vin+'\nhttps://www.partslink24.com/hyundai-kia-automotive-group/kia_parts/vin-group.action';
      const basics=[row(750,[[40,'Данные автомобиля']]),row(720,[[40,'Номер шасси'],[240,vin]]),row(690,[[40,'Дата производства'],[240,'29.02.2020']]),row(660,[[40,'Топливо'],[240,'DIESEL - DIESEL']]),row(630,[[40,'Двигатель'],[240,'ENGINE TYPE (DOHC) - TCI']])];
      const options=[row(750,[[40,'Оснащение']]),row(720,[[40,'Характеристика'],[240,'Наименование']]),row(690,[[40,'0093E6'],[240,'VEHICLE PACKAGE - GT LINE']]),row(660,[[40,'956MB1'],[240,'SURROUND VIEW CAMERA']]),row(640,[[240,'SYSTEM']])];
      const extra=[row(750,[[40,'Доп.оборудование']]),row(720,[[40,'Характеристика'],[240,'Наименование']]),row(690,[[40,'009EA1'],[240,'ENVIRONMENT PACKAGE - MILD HEV']]),row(660,[[40,'963VA9'],[240,'SPEAKER BRAND - HARMAN/KARDON']])];
      const docs=[basics,options,extra].map((rows,i)=>({...parsePartslinkText(prefix+'\n'+rows.map(r=>r.text).join('\n'),vin,rows),file_name:'part-'+i+'.pdf',page_count:1}));
      const merged=mergePartslinkDocuments(docs,vin),reverse=mergePartslinkDocuments([...docs].reverse(),vin);
      const packet={vehicle:{vin,make:'Kia',title:'Sportage',fuel:'Diesel'},enrichment:{partslink24_pdf:merged}};
      let wrong=false,conflict=false;try{mergePartslinkDocuments([...docs,{...docs[0],vin:'U5Y00000000000002'}],vin);}catch{wrong=true;}
      try{mergePartslinkDocuments([...docs,{...docs[0],fields:{'Дата производства':'01.01.2021'}}],vin);}catch{conflict=true;}
      return {merged,reverse,facts:vehicleFacts(packet),wrong,conflict};
    });
    assert.equal(kiaMerge.merged.source_files.length,3);assert.equal(kiaMerge.merged.equipment.length,4);assert.equal(kiaMerge.merged.equipment[0].code,'0093E6');assert(kiaMerge.merged.equipment.some(o=>o.label==='SURROUND VIEW CAMERA SYSTEM'));assert.equal(kiaMerge.facts.production.value,'2020-02-29');assert.equal(kiaMerge.facts.engine.label,'мягкий гибрид (дизель)');assert.equal(kiaMerge.reverse.fields['Дата производства'],'29.02.2020');assert(kiaMerge.wrong&&kiaMerge.conflict);
    console.log('PASS Hyundai/Kia multi-PDF: split identification/equipment/options, leading-zero codes, wrapped labels, date and MHEV diesel, order independence, VIN/date conflict rejection.');
    const {PDFDocument,StandardFonts}=require('pdf-lib');
    const testPdf=await PDFDocument.create();const font=await testPdf.embedFont(StandardFonts.Helvetica);const pdfPage=testPdf.addPage();
    [`partslink24`,`VIN: ${vin}`,'Production date: 21.11.2022','Fuel type: Petrol','Engine type: MHEV'].forEach((line,i)=>pdfPage.drawText(line,{x:40,y:750-i*25,size:12,font}));
    const pdfBytes=Array.from(await testPdf.save());
    const pdfChecks=await page.evaluate(async({pdfBytes,vin})=>{
      const {readPartslinkPdf,parsePartslinkText}=await import('./partslink-pdf.js');
      const parts=await readPartslinkPdf(new File([new Uint8Array(pdfBytes)],'partslink.pdf',{type:'application/pdf'}),vin);
      let wrong=false,unbranded=false,ambiguous=false;
      try{parsePartslinkText(parts.text_source,'WBA00000000000002');}catch{wrong=true;}
      try{parsePartslinkText(`VIN ${vin}\nProduction date: 2022`,vin);}catch{unbranded=true;}
      try{parsePartslinkText(parts.text_source+'\nVIN WBA00000000000002',vin);}catch{ambiguous=true;}
      return {parts,wrong,unbranded,ambiguous};
    },{pdfBytes,vin});
    assert.equal(pdfChecks.parts.fields['Production date'],'21.11.2022');assert.equal(pdfChecks.parts.fields['Engine type'],'MHEV');assert(pdfChecks.wrong&&pdfChecks.unbranded&&pdfChecks.ambiguous);
    const vagCheck=await page.evaluate(async vin=>{
      const {pdfTextRows,parsePartslinkText}=await import('./partslink-pdf.js');const{vehicleFacts}=await import('./vehicle-facts.js');const{equipmentHighlights}=await import('./equipment-highlights.js');
      const row=(page,y,...cells)=>({page,y,cells:cells.map(([x,str])=>({x,str})),text:cells.map(x=>x[1]).join(' ')});
      const rows=[row(1,700,[60,'Идентификация автомобиля']),row(1,650,[60,'Номер шасси'],[211,vin]),row(1,630,[60,'Дата производства'],[211,'17.08.2022']),row(1,600,[60,'Номер PR']),row(1,580,[60,'Характеристика'],[310,'Наименование']),row(1,560,[60,'Тип привода'],[211,'1X1'],[310,'Полный привод']),row(1,540,[211,'PCT'],[310,'Area View']),row(1,520,[211,'PTC'],[310,'Power tilting panoramic sunroof']),row(1,500,[60,'Дисплей'],[211,'KS0'],[310,'Без проекционного дисплея']),row(1,480,[211,'8T8'],[310,'Адаптивный круиз-контроль']),row(1,470,[310,'с ограничителем скорости']),row(1,20,[280,'1 / 2']),row(2,700,[60,'Характеристика'],[310,'Наименование']),row(2,680,[60,'Базовый двигатель'],[211,'T6M'],[310,'4-цилиндровый дизель 2 л']),row(2,660,[211,'3PH'],[310,'Регулир. сидений, лев. с электроприв., с функц. памяти, прав. с механич. регул.'])];
      const parts=parsePartslinkText(rows.map(x=>x.text).join('\n'),vin,rows);
      const packet={vehicle:{vin,make:'Cupra',title:'Formentor TDI',production_year:2023},equipment:[],enrichment:{partslink24_pdf:parts}};
      const grouped=pdfTextRows([{str:'Дата производства',transform:[1,0,0,1,60,500],hasEOL:true},{str:'17.08.2022',transform:[1,0,0,1,211,500],hasEOL:true}]);
      return {parts,facts:vehicleFacts(packet),highlights:equipmentHighlights(packet),grouped};
    },vin);
    assert.equal(vagCheck.parts.template,'vag-pr-table-ru');assert.equal(vagCheck.parts.equipment.length,7);assert.equal(vagCheck.parts.equipment.find(x=>x.code==='8T8').label,'Адаптивный круиз-контроль с ограничителем скорости');
    assert.equal(vagCheck.facts.production.value,'2022-08-17');assert.equal(vagCheck.facts.engine.label,'дизель');assert.equal(vagCheck.grouped[0].text,'Дата производства 17.08.2022');
    assert(vagCheck.highlights.items.some(x=>x.id==='areaView'));assert(!vagCheck.highlights.items.some(x=>x.id==='hud'));assert.equal(vagCheck.highlights.items.find(x=>x.id==='memory').label,'электросиденье с памятью');
    console.log('PASS real-format PartsLink adapter: VAG PR columns without text logo, multiline rows/pages, all-letter option codes, exact production date, diesel evidence, absent HUD excluded and one powered seat not advertised as plural.');
    const stellantisCheck=await page.evaluate(async vin=>{
      const{parsePartslinkText}=await import('./partslink-pdf.js');const{vehicleFacts}=await import('./vehicle-facts.js');const{equipmentHighlights}=await import('./equipment-highlights.js');
      const row=(page,y,left,right)=>({page,y,cells:[{x:60,str:left},...(right?[{x:261,str:right}]:[])],text:[left,right].filter(Boolean).join(' ')});
      const rows=[row(1,700,'Идентификация автомобиля'),row(1,650,'Характеристика','Данные автомобиля'),row(1,630,'Номер шасси',vin),row(1,610,'Заводской код','EN'),row(1,590,'ДВИГАТЕЛЬ','1,2 Л БЕНЗИН'),row(1,570,'КОРОБКА ПЕРЕДАЧ','6-СТУПЕНЧАТАЯ МКП'),row(1,550,'Оснащение'),row(1,530,'Характеристика','Данные автомобиля'),row(1,510,'ЛАМПЫ ФАР','ECO СВЕТОДИОД'),row(1,490,'CИСТЕМА ПОМОЩИ','БЕЗ ПАНОРАМНОГО ОБЗОРА'),row(1,482,'ПАНОРАМНОГО ОБЗОРА'),row(2,700,'Характеристика','Данные автомобиля'),row(2,680,'КРУИЗ-КОНТРОЛЬ','РЕГУЛЯТОР И ОГРАНИЧИТЕЛЬ СКОРОСТИ')];
      const parts=parsePartslinkText(rows.map(x=>x.text).join('\n'),vin,rows);const input={vehicle:{vin,make:'Opel',title:'Grandland',first_registration_source:'Apr-23'},equipment:[],enrichment:{partslink24_pdf:parts}};
      return {parts,facts:vehicleFacts(input),highlights:equipmentHighlights(input)};
    },vin);
    assert.equal(stellantisCheck.parts.template,'stellantis-columns-ru');assert.equal(stellantisCheck.parts.equipment.length,3);assert.equal(stellantisCheck.parts.equipment[1].category,'CИСТЕМА ПОМОЩИ ПАНОРАМНОГО ОБЗОРА');
    assert.equal(stellantisCheck.facts.production,null);assert.equal(stellantisCheck.facts.display_date.kind,'first_registration');assert.equal(stellantisCheck.facts.engine.label,'бензин');
    assert.deepEqual(stellantisCheck.highlights.items.map(x=>x.id),['led','cruise']);
    console.log('PASS Stellantis PDF: two-column identification/equipment, wrapped labels, no fabricated production date, Arval registration fallback, LED/cruise positive and absent panorama excluded.');
    const deliveryChecks=await page.evaluate(async packet=>{
      const{parseDeliveryAmount,deliveryLabel}=await import('./delivery.js');const{telegramCaption}=await import('./telegram.js');
      const amounts=['','850','850,50','1 250.75','0'].map(parseDeliveryAmount);
      const invalid=['-1','1e3','850,999','abc','1000001'].map(value=>{try{parseDeliveryAmount(value);return false;}catch{return true;}});
      const input={...packet,logistics:{delivery_to_warsaw:{amount_minor:85050,currency:'EUR',source:'employee'}}};
      return {amounts,invalid,caption:telegramCaption(input,{buttons:true}),empty:telegramCaption({...input,logistics:{delivery_to_warsaw:null}},{buttons:true}),label:deliveryLabel(input)};
    },packet);
    assert.deepEqual(deliveryChecks.amounts,[null,85000,85050,125075,0]);assert(deliveryChecks.invalid.every(Boolean));
    assert(deliveryChecks.caption.includes('Доставка до Варшавы: 850,5 EUR'));assert(!deliveryChecks.empty.includes('Доставка до Варшавы:'));
    const vatChecks=await page.evaluate(async packet=>{const{telegramCaption}=await import('./telegram.js');return ['Yes','No',null].map(vat_deductible_source=>telegramCaption({...packet,vehicle:{...packet.vehicle,vat_deductible_source}}));},packet);
    for(const caption of vatChecks){assert(caption.includes(' · нетто'));assert(!caption.includes('НДС к вычету'));assert(!caption.includes('нетто/брутто уточняется'));}
    console.log('PASS local PartsLink PDF: actual PDF.js worker extracts date/fuel from PDF bytes; mismatched/multiple VIN and unbranded document rejected; VAT deductibility never converted into gross price.');
    const telegramChecks=await page.evaluate(async packet=>{
      const {telegramCaption,hasPrivateAuctionLink}=await import('./telegram.js');
      const {attachPartslink}=await import('./partslink.js');
      let wrongVin=false;try{attachPartslink(structuredClone(packet),{vin:'WBA00000000000002'});}catch{wrongVin=true;}
      const parts={vin:packet.vehicle.vin,captured_at:'2026-10-17T10:00:00Z',fields:{'Мощность':'103'},sections:[{expanded:true}],equipment:[{code:'S3AGA',label:'Видеокамера заднего хода'}]};
      const enriched=attachPartslink(structuredClone(packet),parts);
      return {caption:telegramCaption(enriched),noReport:telegramCaption(enriched,{includeReport:false}),warnings:enriched.warnings,wrongVin,privateLinkChecks:['https://remktg.arval.com/buyer/#/item-details/test','REMKTG.ARVAL.COM/buyer/', 'https://atlantauto.pl/cars/test'].map(hasPrivateAuctionLink)};
    },packet);
    assert(telegramChecks.caption.includes('Текущая максимальная ставка'));assert(!telegramChecks.caption.includes('Начальная цена'));
    assert(telegramChecks.caption.includes('камера заднего вида'));assert(!telegramChecks.noReport.includes('Инспекция:'));
    assert(telegramChecks.wrongVin);assert(telegramChecks.warnings.some(x=>x.includes('Мощность:')));
    assert(!telegramChecks.caption.includes('Лот:'));assert(!telegramChecks.caption.includes(packet.source.url));assert(!telegramChecks.caption.includes('remktg.arval.com'));
    assert.deepEqual(telegramChecks.privateLinkChecks,[true,true,false]);
    const serviceCaptions=await page.evaluate(async packet=>{const{telegramCaption}=await import('./telegram.js');return [telegramCaption(packet,{buttons:true}),telegramCaption(packet,{buttons:true,includeMaintenance:false}),telegramCaption({...packet,condition:{...packet.condition,maintenance_count:6}},{buttons:true})];},servicePacket);
    assert(serviceCaptions[0].includes('июль 2026')&&serviceCaptions[0].includes('81'));assert(!serviceCaptions[1].includes('Сервисная история'));assert(serviceCaptions[2].includes('из 6 указанных')&&!serviceCaptions[2].includes('последняя запись'));
    const partsSource=(await fs.readFile(path.join(root,'partslink.js'),'utf8')).replaceAll('export function','function');
    await page.route('https://www.partslink24.com/**',r=>r.fulfill({contentType:'text/html',body:`<meta charset="utf-8"><div data-testid="vinfoBasic"><button aria-expanded="true"></button><div class="MuiAccordionDetails-root"><div><div class="label">Номер шасси</div><div>${vin}</div></div><div><div class="label">Привод</div><div>FWD</div></div></div></div><div data-testid="vinfoStandardEquipment"><button aria-expanded="true"></button><div data-testid="row"><div data-testid="nameValue">S450A</div><div data-testid="valueValue">Сиденье</div></div></div><div data-testid="vinfoOptionalEquipment"><button aria-expanded="true"></button><div data-testid="row"><div data-testid="nameValue">S3AGA</div><div data-testid="valueValue">Камера</div></div></div>`}));
    await page.goto(`https://www.partslink24.com/pl24-app/bmw_parts/${vin}/0/vehicle`);
    const partsPacket=await page.evaluate(source=>new Function(source+';return collectPartslink();')(),partsSource);
    assert.equal(partsPacket.vin,vin);assert.equal(partsPacket.fields['Привод'],'FWD');assert.equal(partsPacket.equipment.length,2);
    console.log('PASS Telegram/partslink24: correct price wording, selected source link, option codes, mismatched VIN rejected, source conflicts retained, panel extraction.');
    // Exercise the actual exporter orchestration against a page where any synthetic
    // click/form submission is a tripwire. No real auction is contacted.
    const auction=await browser.newPage();const writes=[];
    await auction.addInitScript(()=>{
      window.controlActions=0;
      for(const [prototype,name] of [[HTMLElement.prototype,'click'],[HTMLFormElement.prototype,'submit'],[HTMLFormElement.prototype,'requestSubmit']]){
        prototype[name]=function(){window.controlActions++;throw Error('Auction control action is forbidden');};
      }
    });
    await auction.route('https://remktg.arval.com/**',r=>{
      if(r.request().method()!=='GET')writes.push(r.request().method());
      return r.fulfill({contentType:'text/html',body:fixture+'<a href="javascript:void(0)">Links and documents</a><form><button>Buy now</button><button>Place bid</button></form>'});
    });
    await auction.goto('https://remktg.arval.com/buyer/#/item-details/test-lot?salesEventId=123');
    const ui=await browser.newPage();
    await ui.exposeFunction('runCaptureScript',(source,args)=>auction.evaluate(({source,args})=>new Function('return ('+source+');')()(...args),{source,args:args||[]}));
    await ui.addInitScript(()=>{
      window.chrome={scripting:{executeScript:async args=>[{result:await window.runCaptureScript(args.func.toString(),args.args)}]},storage:{local:{get:async()=>({}),set:async()=>{}}}};
    });
    await ui.goto(`${base}/export.html?tab=7`);await ui.locator('#post:enabled').waitFor();
    assert.equal(await auction.evaluate(()=>window.controlActions),0);assert.equal(writes.length,0);
    await page.locator('[data-testid="vinfoOptionalEquipment"] button').evaluate(x=>x.setAttribute('aria-expanded','false'));
    await assert.rejects(()=>page.evaluate(source=>new Function(source+';return collectPartslink();')(),partsSource),/вручную/);
    await ui.close();await auction.close();
    console.log('PASS safety: actual exporter reads an auction with click/form tripwires; zero control actions and zero write requests; closed PartsLink panels require manual expansion.');
    // Exercise the real server-upload UI, but intercept every server call.
    const storageUi=await browser.newPage();const storageCalls=[];
    const storagePacket=structuredClone(packet);
    storagePacket.condition=structuredClone(servicePacket.condition);
    storagePacket.photos.push({...storagePacket.photos[0],url:storagePacket.photos[0].url.replace('01.jpg','02.jpg')});
    await storageUi.addInitScript(({packet})=>{
      window.chrome={scripting:{executeScript:async args=>[{result:args.func.name==='collectArvalLot'?structuredClone(packet):args.func.name==='readArvalPhoto'?'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ccAAAAASUVORK5CYII=':false}]},permissions:{request:async()=>true},storage:{local:{get:async()=>({telegram_employee_key:'fixture-key-00000000000000000000000000'}),set:async()=>{}}}};
    },{packet:storagePacket});
    let previewActor='owner';
    const previewProduct={draft_id:'a'.repeat(32),public_id:'c'.repeat(32),revision:1,published_json:null,record:{title:'BMW X2',description_pl:'Samochód testowy.',state:'auction',availability:'free',production_date:null,first_registration:'2023-04',mileage_km:49128,keys:2,power_kw:100,power_hp:136,engine_cm3:null,fuel_pl:'Benzyna',transmission_pl:'Manualna',color_pl:'Biały',registration_country_pl:'Francja',awd:false,vat_deductible:true,tyres_pl:'',equipment_pl:['Nawigacja'],price_net:null,price_gross:null,currency:'EUR',location_pl:'Samochód na aukcji europejskiej',eta:null,photo_ids:['b'.repeat(32)],document_ids:[],auction_bid:14250,auction_currency:'EUR'}};
    const previewAssets=[{id:'b'.repeat(32),kind:'vehicle',mime:'image/png',name:'auction.png'},{id:'e'.repeat(32),kind:'inspection',mime:'application/pdf',name:'inspection.pdf'}];
    await storageUi.route('https://serwer2454127.home.pl/**',r=>{
      const req=r.request();const headers={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'POST, GET, OPTIONS'};
      if(req.method()==='OPTIONS')return r.fulfill({status:204,headers});
      storageCalls.push({url:req.url(),body:req.postData()});
      const url=new URL(req.url());let response={ok:true,id:'a'.repeat(32),asset_id:'b'.repeat(32)};
      if(req.method()==='GET'&&url.searchParams.has('asset'))return r.fulfill({contentType:'image/png',headers,body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ccAAAAASUVORK5CYII=','base64')});
      if(url.searchParams.get('action')==='identity')response={ok:true,employee:previewActor};
      else if(req.method()==='GET'&&url.searchParams.has('id'))response={ok:true,data:{id:'a'.repeat(32),assets:previewAssets,packet:storagePacket}};
      else if(url.searchParams.get('action')==='product_create')response={ok:true,id:'a'.repeat(32),product:previewProduct};
      else if(url.searchParams.get('action')==='product_save'){Object.assign(previewProduct.record,JSON.parse(req.postData()).changes);previewProduct.revision++;response={ok:true,id:'a'.repeat(32),product:previewProduct};}
      else if(url.searchParams.get('action')==='product_publish'){previewProduct.published_json='fixture-published';response={ok:true,id:'a'.repeat(32),product:previewProduct};}
      else if(url.searchParams.get('action')==='asset'&&/name="kind"\r\n\r\non_site/.test(req.postData())){const id='d'.repeat(32);if(!previewAssets.some(a=>a.id===id))previewAssets.push({id,kind:'on_site',mime:'image/jpeg',name:'warsaw.jpg'});response.asset_id=id;}
      else if(req.url().includes('telegram-draft.php'))response={ok:true,message_ids:[1,2],history_saved:true,buttons_status:'sent'};
      return r.fulfill({contentType:'application/json',headers,body:JSON.stringify(response)});
    });
    await storageUi.goto(`${base}/export.html?tab=7`);await storageUi.locator('#post:enabled').waitFor();
    assert(await storageUi.locator('#delivery-cost').isVisible());
    await storageUi.locator('#delivery-cost').fill('850,50');
    await storageUi.locator('#retry').click();await storageUi.locator('#post:enabled').waitFor();
    assert.equal(await storageUi.locator('#delivery-cost').inputValue(),'850.5','Delivery preserved when rereading the same vehicle and region');
    assert(await storageUi.locator('#inspection-pdfs').isVisible());
    await storageUi.locator('#inspection-pdfs').setInputFiles({name:'inspection.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 fixture')});
    await storageUi.locator('#server-save').click();
    await storageUi.locator('#server-result').filter({hasText:'Превью открыто ниже'}).waitFor();
    assert.equal(storageCalls.filter(x=>x.url.includes('action=asset')).length,4);
    assert.equal(JSON.parse(storageCalls[0].body).vehicle.vin,vin);
    assert.equal(JSON.parse(storageCalls[0].body).logistics.delivery_to_warsaw.amount_minor,85050);
    assert.equal(JSON.parse(storageCalls[0].body).logistics.delivery_to_warsaw.source,'employee');
    assert(storageCalls.some(x=>x.url.includes('action=asset')&&x.body.includes('inspection.pdf')&&/name="kind"\r\n\r\ninspection/.test(x.body)),'Inspection picker uses inspection kind automatically');
    assert(!storageCalls.some(x=>x.url.includes('telegram-draft')));
    assert((await storageUi.locator('#server-link').getAttribute('href')).endsWith('a'.repeat(32)));
    await storageUi.locator('#publication-title').fill('BMW X2 · проверенный заголовок');
    await storageUi.locator('#post').click();assert((await storageUi.locator('#caption').inputValue()).includes('BMW X2 · проверенный заголовок'));
    assert((await storageUi.locator('#caption').inputValue()).includes('Доставка до Варшавы: 850,5 EUR'));
    await storageUi.locator('#delivery-cost').fill('-20');assert(await storageUi.locator('#send-draft').isDisabled());
    const beforeInvalid=storageCalls.length;await storageUi.locator('#server-save').click();await storageUi.locator('#server-result').filter({hasText:'Доставка: введите'}).waitFor();assert.equal(storageCalls.length,beforeInvalid);
    await storageUi.locator('#delivery-cost').fill('900');assert((await storageUi.locator('#caption').inputValue()).includes('BMW X2 · проверенный заголовок'));assert((await storageUi.locator('#caption').inputValue()).includes('Доставка до Варшавы: 900 EUR'));
    await storageUi.locator('#delivery-cost').fill('');assert(!(await storageUi.locator('#caption').inputValue()).includes('Доставка до Варшавы:'));
    await storageUi.locator('#delivery-cost').fill('850,50');
    const options=storageUi.locator('#equipment-picker input');assert((await options.count())>0);
    const checkedBefore=await options.first().isChecked();assert(checkedBefore);
    await options.first().uncheck();assert(!(await storageUi.locator('#caption').inputValue()).includes('В комплектации:'));
    await storageUi.locator('#post').click();assert(!(await options.first().isChecked()),'Explicit empty selection survives reopening');
    await options.first().check();assert((await storageUi.locator('#caption').inputValue()).includes('В комплектации:\n• '));

    const cleanCaption=await storageUi.locator('#caption').inputValue();assert(!cleanCaption.includes('remktg.arval.com'));
    await storageUi.locator('#caption').fill(cleanCaption+'\nЛот: https://remktg.arval.com/buyer/#/item-details/private');
    assert(await storageUi.locator('#send-draft').isDisabled());assert((await storageUi.locator('#publication-status').textContent()).includes('Удалите закрытую ссылку'));
    await storageUi.locator('#copy-caption').click();assert((await storageUi.locator('#telegram-result').textContent()).includes('перед копированием'));
    await storageUi.locator('#caption').fill(cleanCaption);
    await storageUi.locator('#publication-title').fill('BMW X2 · исправленный заголовок');assert((await storageUi.locator('#caption').inputValue()).includes('BMW X2 · исправленный заголовок'));
    await storageUi.locator('#send-draft').click();
    await storageUi.locator('#telegram-result').filter({hasText:'Ссылки на материалы находятся'}).waitFor();
    const telegramIndex=storageCalls.findIndex(x=>x.url.includes('telegram-draft.php'));
    assert(telegramIndex>0 && storageCalls[telegramIndex-1].url.includes('action=asset'));
    assert(storageCalls[telegramIndex-1].body.includes('inspection.pdf'));
    assert(storageCalls[telegramIndex].body.includes('"buttons_version":1'));
    assert(storageCalls[telegramIndex].body.includes('"share_partslink":true'));
    assert(storageCalls[telegramIndex].body.includes('"share_maintenance":true'));
    assert(storageCalls[telegramIndex].body.includes('BMW X2 · исправленный заголовок'));
    assert(!storageCalls[telegramIndex].body.includes('source_url'));assert(!storageCalls[telegramIndex].body.includes('Лот:'));
    assert.equal(await storageUi.locator('.post-buttons-preview span').count(),4);
    const splitPdfs=[];
    for(const [name,line]of[['equipment.pdf','S3AGA Rear view camera'],['options.pdf','S248A Steering wheel heating']]){
      const doc=await PDFDocument.create();const font=await doc.embedFont(StandardFonts.Helvetica);const page=doc.addPage();['partslink24',`VIN: ${vin}`,'Optional equipment',line].forEach((text,i)=>page.drawText(text,{x:40,y:750-i*25,size:12,font}));splitPdfs.push({name,mimeType:'application/pdf',buffer:Buffer.from(await doc.save())});
    }
    await storageUi.locator('#partslink-pdf').setInputFiles([{name:'partslink.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdfBytes)},...splitPdfs]);
    assert.equal(await storageUi.locator('#partslink-file-list li').count(),3);
    const callsBeforeUnread=storageCalls.length;
    await storageUi.locator('#server-save').click();await storageUi.locator('#server-result').filter({hasText:'ещё не прочитан'}).waitFor();
    assert.equal(storageCalls.length,callsBeforeUnread);
    await storageUi.locator('#post').click();assert((await storageUi.locator('#partslink-import-status').textContent()).includes('ещё не прочитан'));assert(await storageUi.locator('#send-draft').isDisabled());
    await storageUi.locator('#import-partslink').click();await storageUi.locator('#partslink-import-status').filter({hasText:'PDF прочитан'}).waitFor();
    assert((await storageUi.locator('#partslink-import-status').textContent()).includes('Данные объединены'));
    assert((await storageUi.locator('#production-fact').textContent()).includes('21.11.2022'));
    assert((await storageUi.locator('#engine-fact').textContent()).includes('мягкий гибрид (бензин)'));
    await storageUi.locator('#server-save').click();await storageUi.locator('#server-save:enabled').waitFor();await storageUi.locator('#server-result').filter({hasText:'все найденные фотографии сохранены'}).waitFor();
    for(const name of ['partslink.pdf','equipment.pdf','options.pdf'])assert(storageCalls.some(x=>x.url.includes('action=asset')&&x.body.includes(name)&&x.body.includes('partslink')),'All PartsLink PDFs uploaded: '+name);
    const fullPdf=await PDFDocument.create();const fullPage=fullPdf.addPage();const fullFont=await fullPdf.embedFont(StandardFonts.Helvetica);
    [`partslink24`,`VIN: ${vin}`,'Production date: 21.11.2022','Fuel type: Petrol','Engine type: HEV'].forEach((line,i)=>fullPage.drawText(line,{x:40,y:750-i*25,size:12,font:fullFont}));
    await storageUi.locator('#clear-partslink').click();
    await storageUi.locator('#partslink-pdf').setInputFiles({name:'full-hybrid.pdf',mimeType:'application/pdf',buffer:Buffer.from(await fullPdf.save())});
    await storageUi.locator('#import-partslink').click();await storageUi.locator('#partslink-import-status').filter({hasText:'PDF прочитан'}).waitFor();
    assert(await storageUi.locator('#send-draft').isDisabled());assert((await storageUi.locator('#publication-status').textContent()).includes('не готовится для публикации'));
    assert(await storageUi.locator('#server-save').isEnabled());
    const noDatePdf=await PDFDocument.create();const noDatePage=noDatePdf.addPage();const noDateFont=await noDatePdf.embedFont(StandardFonts.Helvetica);
    ['partslink24',`VIN: ${vin}`,'Fuel type: Petrol'].forEach((line,i)=>noDatePage.drawText(line,{x:40,y:750-i*25,size:12,font:noDateFont}));
    await storageUi.locator('#clear-partslink').click();
    await storageUi.locator('#partslink-pdf').setInputFiles({name:'partslink-without-date.pdf',mimeType:'application/pdf',buffer:Buffer.from(await noDatePdf.save())});
    await storageUi.locator('#import-partslink').click();await storageUi.locator('#partslink-import-status').filter({hasText:'PDF прочитан'}).waitFor();
    assert((await storageUi.locator('#caption').inputValue()).includes('Первая регистрация: 04.2023'));
    assert((await storageUi.locator('#publication-date-fact').textContent()).includes('первая регистрация'));
    assert((await storageUi.locator('#publication-status').textContent()).includes('В PartsLink дата производства не указана'));
    assert(await storageUi.locator('#send-draft').isEnabled());
    assert(await storageUi.locator('#website-editor').isVisible());assert((await storageUi.locator('#site-visual-preview').textContent()).includes('Liczba kluczyków'));
    await storageUi.locator('#inspection-pdfs').setInputFiles([{name:'second-report.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 second')},{name:'third-report.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 third')}]);
    assert.equal(await storageUi.locator('#inspection-file-list li').count(),3,'Reports can be added in several batches');
    const beforeWebsite=storageCalls.length;await storageUi.locator('#server-save').click();await storageUi.locator('#server-save:enabled').waitFor();
    const websiteCalls=storageCalls.slice(beforeWebsite);assert(websiteCalls.some(x=>x.url.includes('action=product_create')));assert(!websiteCalls.some(x=>x.url.includes('product_publish')));assert(!websiteCalls.some(x=>x.url.includes('telegram-draft.php')));
    assert(websiteCalls.some(x=>x.url.includes('action=asset')&&x.body.includes('second-report.pdf')));assert(websiteCalls.some(x=>x.url.includes('action=asset')&&x.body.includes('third-report.pdf')));
    await storageUi.locator('#site-title').fill('BMW X2 · poprawiony tytuł');assert((await storageUi.locator('#site-visual-preview h2').textContent()).includes('poprawiony'));
    await storageUi.locator('#website-state').selectOption('in_transit');await storageUi.locator('#website-net').fill('14500');
    const beforeTransit=storageCalls.length;await storageUi.locator('#site-save').click();await storageUi.locator('#site-result').filter({hasText:'Правки сохранены в черновик'}).waitFor();
    const transit=JSON.parse(storageCalls.slice(beforeTransit).find(x=>x.url.includes('action=product_save')).body);assert.equal(transit.changes.state,'in_transit');assert.equal(transit.changes.price_net,'14500');assert.equal(transit.changes.keys,'2');assert(!storageCalls.slice(beforeTransit).some(x=>x.url.includes('product_publish')));
    await storageUi.locator('#website-state').selectOption('on_site');
    const beforeMissing=storageCalls.length;await storageUi.locator('#site-save').click();await storageUi.locator('#site-result').filter({hasText:'выберите реальные фотографии'}).waitFor();assert.equal(storageCalls.length,beforeMissing,'Missing Warsaw photos rejected before upload');
    await storageUi.locator('#website-photos').setInputFiles({name:'warsaw.jpg',mimeType:'image/jpeg',buffer:Buffer.from('fixture-photo')});
    const beforeYard=storageCalls.length;await storageUi.locator('#site-save').click();await storageUi.locator('#site-result').filter({hasText:'Правки сохранены в черновик'}).waitFor();
    const yardCalls=storageCalls.slice(beforeYard);assert(yardCalls.some(x=>x.url.includes('action=asset')&&/name="kind"\r\n\r\non_site/.test(x.body)));
    const yard=JSON.parse(yardCalls.find(x=>x.url.includes('action=product_save')).body);assert.equal(yard.changes.state,'on_site');assert.deepEqual(yard.changes.photo_ids,['d'.repeat(32)]);assert(!yardCalls.some(x=>x.url.includes('product_publish')));
    await storageUi.locator('#website-state').selectOption('sold');
    const beforePublish=storageCalls.length;await storageUi.locator('#site-publish').click();await storageUi.locator('#site-result').filter({hasText:'Автомобиль опубликован'}).waitFor();
    const publishCalls=storageCalls.slice(beforePublish);assert(publishCalls.findIndex(x=>x.url.includes('product_save'))<publishCalls.findIndex(x=>x.url.includes('product_publish')));assert.equal(previewProduct.record.state,'sold');assert(await storageUi.locator('#site-public-link').isVisible());
    await storageUi.setViewportSize({width:1440,height:1100});await storageUi.screenshot({path:'/private/tmp/atlant-extension-070-desktop.png',fullPage:true});
    await storageUi.locator('#site-visual-preview').screenshot({path:'/private/tmp/atlant-extension-070-preview.png'});
    previewActor='employee-2';await storageUi.locator('#server-save').click();await storageUi.locator('#server-save:enabled').waitFor();assert(await storageUi.locator('#site-publish').isDisabled(),'Employee can edit but cannot publish from preview');
    await storageUi.setViewportSize({width:390,height:844});assert(await storageUi.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Extension preview fits narrow screen');
    await storageUi.close();
    console.log('PASS server drafts UI: full packet, ordinary/damage photos and PDF saved; explicit save does not publish; selected photos persisted before Telegram send.');
    const connection=await browser.newPage();const savedKeys={};let failKeyStorage=false;let identityCalls=0;
    const connectionKey='A'.repeat(43);
    await connection.exposeFunction('connectionGet',()=>structuredClone(savedKeys));
    await connection.exposeFunction('connectionSet',value=>{if(failKeyStorage)throw Error('Extension context invalidated');Object.assign(savedKeys,value);});
    await connection.addInitScript(({packet})=>{
      window.connectionDenied=false;
      window.chrome={scripting:{executeScript:async args=>[{result:args.func.name==='collectArvalLot'?structuredClone(packet):false}]},permissions:{request:async()=>!window.connectionDenied},storage:{local:{get:()=>window.connectionGet(),set:value=>window.connectionSet(value)}}};
    },{packet});
    await connection.route('https://serwer2454127.home.pl/**',r=>{
      const req=r.request();const headers={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, OPTIONS'};
      if(req.method()==='OPTIONS')return r.fulfill({status:204,headers});
      assert(req.url().endsWith('vehicle-drafts.php?action=identity'));assert.equal(req.method(),'GET');identityCalls++;
      const valid=req.headers().authorization==='Bearer '+connectionKey;
      return r.fulfill({status:valid?200:401,contentType:'application/json',headers,body:JSON.stringify(valid?{ok:true,employee:'owner'}:{ok:false,error:'Ключ сотрудника не принят.'})});
    });
    await connection.goto(`${base}/export.html?tab=7`);await connection.locator('#post:enabled').waitFor();
    await connection.locator('#employee-key').fill(JSON.stringify({employee_name:'owner',access_key:connectionKey}));await connection.locator('#save-key').click();
    await connection.locator('#connection-status').filter({hasText:'Подключено: owner'}).waitFor();
    assert(await connection.locator('#connection-status').isVisible());assert(await connection.locator('#telegram').isHidden());assert.equal(savedKeys.telegram_employee_key,connectionKey);assert.equal(identityCalls,1);
    assert(!(await connection.locator('#connection-status').textContent()).includes(connectionKey));
    await connection.reload();await connection.locator('#post:enabled').waitFor();assert.equal(await connection.locator('#employee-key').inputValue(),connectionKey);
    await connection.locator('#connection-panel').evaluate(x=>x.open=true);
    await connection.locator('#employee-key').fill('owner');await connection.locator('#save-key').click();await connection.locator('#connection-status.failed').waitFor();assert.equal(identityCalls,1);assert.equal(savedKeys.telegram_employee_key,connectionKey);
    await connection.locator('#employee-key').fill('B'.repeat(43));await connection.locator('#save-key').click();await connection.locator('#connection-status').filter({hasText:'не принят'}).waitFor();assert(await connection.locator('#connection-status').isVisible());assert.equal(identityCalls,2);
    await connection.evaluate(()=>window.connectionDenied=true);await connection.locator('#employee-key').fill(connectionKey);await connection.locator('#save-key').click();await connection.locator('#connection-status').filter({hasText:'доступ к серверу не разрешён'}).waitFor();assert.equal(savedKeys.telegram_employee_key,connectionKey);assert.equal(identityCalls,2);
    failKeyStorage=true;await connection.locator('#save-key').click();await connection.locator('#connection-status').filter({hasText:'Закройте эту вкладку'}).waitFor();assert(await connection.locator('#connection-status').isVisible());assert(await connection.locator('#save-key').isEnabled());
    await connection.close();
    console.log('PASS employee connection: visible feedback before Telegram preview, persisted key survives reload, full JSON accepted, invalid name rejected, server denial/permission refusal/invalidated extension explained without showing secrets.');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
