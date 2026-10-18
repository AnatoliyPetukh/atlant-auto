// Self-contained for chrome.scripting.executeScript; a DOM snapshot can also be
// supplied by fixture tests. Reads rendered markup only, never account/app state.
export function collectBcaLot(snapshot) {
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  if(!snapshot){
    const rows=[...document.querySelectorAll('#tabs-1 .row')].filter(e=>e.style.display!=='none').map(e=>({label:clean(e.querySelector('label')?.textContent),value:clean([...e.querySelectorAll('span')].map(s=>s.textContent).join(' '))}));
    const sectionText=title=>{const h=[...document.querySelectorAll('#tabs-1 h5')].find(e=>clean(e.textContent)===title);return h?clean(h.nextElementSibling?.textContent):'';};
    snapshot={url:location.href,language:document.documentElement.lang,title:clean(document.querySelector('.main h2, #main h2, h2')?.textContent),rows,
      equipment:[...document.querySelectorAll('.tabs-equ')].map(e=>({section:clean(e.querySelector('h2')?.textContent),items:[...e.querySelectorAll('.equ-item')].map(x=>clean(x.textContent))})),
      comments:sectionText('Vehicle Comments'),location:(()=>{const root=document.querySelector('.vehicle-location');return root?clean([...root.querySelectorAll('[data-bind*="VehicleAddressFormatted"]')].map(e=>e.innerHTML.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,' ')).join(' ')):sectionText('Vehicle Location');})(),
      photos:[...document.querySelectorAll('#tabs-1 .details-img-gal img[src]')].map(e=>({url:e.getAttribute('src'),alt:clean(e.alt)})),
      documents:[...document.querySelectorAll('#tabs-4 a[href]')].map(e=>({url:e.href,label:clean(e.textContent)})),
      prices:[...document.querySelectorAll('.current-bid-box')].filter(e=>e.style.display!=='none').map(e=>clean(e.textContent)),
      sale:clean(document.querySelector('#saleDescription')?.textContent)};
  }
  const page=new URL(snapshot.url);
  if(!['www.bca.com','bca.com'].includes(page.hostname)||page.protocol!=='https:'||!/^#LotDetails\//i.test(page.hash))throw Error('Откройте карточку одного автомобиля BCA Sales.');
  const available=v=>v&&!/^(?:n\/?a|unknown|missing|not available|[-–—])$/i.test(clean(v));
  const fields={};for(const row of snapshot.rows||[])if(row.label&&available(row.value))fields[clean(row.label)]=clean(row.value);
  const key=v=>clean(v).toLowerCase().replace(/[^a-z0-9]/g,'');
  const get=(...labels)=>{for(const label of labels){const found=Object.keys(fields).find(k=>key(k)===key(label));if(found)return fields[found];}return null;};
  const num=v=>{const m=clean(v).match(/(?:^|\b)(\d[\d\s.,]*)/);if(!m)return null;const n=m[1].trim().replace(/\s/g,'').replace(/,(?=\d{3}(?:\D|$))/g,'').replace(',','.');return /^\d+(?:\.\d+)?$/.test(n)?Number(n):null;};
  const yesNo=v=>/^(yes|oui|ja|tak|true)$/i.test(clean(v))?true:/^(no|non|nein|nie|false)$/i.test(clean(v))?false:null;
  const make=get('Manufacturer','Make','Brand'),model=get('Model'),type=get('Type'),vin=get('VIN Number','VIN','Vehicle Identification Number')?.toUpperCase();
  if(!vin||! /^[A-HJ-NPR-Z0-9]{17}$/.test(vin)||!make||!model)throw Error('BCA: не найдены марка, модель и корректный VIN. Дождитесь загрузки карточки.');
  const title=[make,model,type].filter(Boolean).join(' '),capturedAt=new Date().toISOString(),query=new URLSearchParams(page.hash.split('?')[1]||'');
  const equipment=[],extra={};
  for(const group of snapshot.equipment||[])for(const raw of group.items||[]){const text=clean(raw),split=text.indexOf(':'),label=split<0?text:text.slice(0,split),value=split<0?'':text.slice(split+1).trim();if(split>=0)extra[label]=value;
    if(group.section==='Others'||!available(value)||yesNo(value)===false)continue;
    equipment.push({type:label,specification:value,source_section:group.section});
  }
  const extraGet=(...labels)=>{for(const label of labels){const found=Object.keys(extra).find(k=>key(k)===key(label));if(found&&available(extra[found]))return extra[found];}return null;};
  const photos=[],seen=new Set();for(const item of snapshot.photos||[]){let u;try{u=new URL(item.url,page);}catch{continue;}
    if(u.protocol!=='https:'||u.username||u.password||u.hostname!=='www.bcaimage.com'||u.pathname!=='/Document'||u.searchParams.get('DocType')!=='VehicleImage'||!/^\d+$/.test(u.searchParams.get('docId')||'')||seen.has(u.href))continue;
    seen.add(u.href);photos.push({url:u.href,kind:'vehicle',alt:clean(item.alt)});
  }
  const documents=[],seenDocs=new Set();for(const item of snapshot.documents||[]){let u;try{u=new URL(item.url,page);}catch{continue;}
    if(u.protocol!=='https:'||u.username||u.password||!['www.bca.com','bca.com','logistics.ald.digital','www.bcaimage.com'].includes(u.hostname)||seenDocs.has(u.href))continue;
    seenDocs.add(u.href);documents.push({kind:'inspection_report',label:clean(item.label)||'BCA report',url:u.href,archive_status:'pending'});
  }
  let price={kind:'unknown',amount:null,currency:null,tax_basis:/\bnet\s+auction\b/i.test(snapshot.sale||'')?'net':'unknown',observed_at:capturedAt,source_text:null};
  for(const raw of snapshot.prices||[]){const m=clean(raw).match(/^(Starting bid|Highest bid|Current bid|Buy now)\s*:?[\s]*([A-Z]{3})\s*([\d .,]+)/i);if(!m)continue;price={...price,kind:/^starting/i.test(m[1])?'starting_price':/^buy/i.test(m[1])?'buy_now':'highest_bid',amount:num(m[3]),currency:m[2].toUpperCase(),source_text:clean(raw)};break;}
  const keysSource=get('Number of Keys','Keys'),keys=keysSource&&/^\d+(?:\s*keys?)?$/i.test(keysSource)?num(keysSource):null;
  const major=yesNo(extraGet('Previous major accident damage')),comments=clean(snapshot.comments),warnings=[];
  if(keys===null)warnings.push('BCA: количество ключей не указано.');
  if(major===true)warnings.push('BCA сообщает о предыдущих серьёзных аварийных повреждениях. Проверьте инспекцию.');
  if(!photos.length)warnings.push('Фотографии BCA не найдены. Откройте Vehicle details и дождитесь галереи.');
  if(!documents.length)warnings.push('Отчёты BCA не найдены. Если доступны, откройте Condition & Documents и перечитайте карточку.');
  if(price.amount===null)warnings.push('Цена BCA не распознана; ставка и начальная цена не подменяются друг другом.');
  if(get('Body Type')&&get('Vehicle Type')&&/pick.?up/i.test(get('Body Type'))&&/passenger/i.test(get('Vehicle Type')))warnings.push('BCA: тип кузова и категория автомобиля требуют проверки; исходные значения сохранены.');
  return {schema_version:'atlant.vehicle.capture/1',source:{auction:'bca',lot_id:query.get('VehicleId'),sales_event_id:query.get('AuctionId'),url:page.href,captured_at:capturedAt,interface_language:snapshot.language||'unknown',extractor_version:'0.10.0'},workflow:{state:'auction',publication:'draft',availability:'unknown'},
    vehicle:{vin,make,title,model,model_generation:null,production_year:num(get('Build Year')),model_year:num(get('Model Year')),first_registration_source:get('First Registration'),mileage_km:(()=>{const raw=get('Mileage');if(!raw)return null;const m=raw.match(/\d[\d .,]*/);if(!m)return null;const n=Number(m[0].replace(/\D/g,''));return /miles|\bmi\b/i.test(raw)?Math.round(n*1.609344):n;})(),mileage_source:get('Mileage'),fuel:get('Fuel Type'),transmission:get('Transmission Type'),engine_cm3:num(get('Engine Size (cc)')),power_kw:num(get('Power KW')),power_hp:num(get('Power PS')),power_source:[get('Power KW'),get('Power PS')].filter(Boolean).join(' / '),color:[get('Colour','Color'),get('Colour type')].filter(Boolean).join(' '),keys,keys_source:keysSource,awd:yesNo(get('4-wheel drive')),drive_source:get('Drive Type'),registration_country_source:get('Registration Country'),vat_deductible:yesNo(get('VAT Deductible')),vat_deductible_source:get('VAT Type'),storage_location:clean(snapshot.location)||null,body_type_source:get('Body Type'),vehicle_type_source:get('Vehicle Type'),comments_source:comments},
    auction:{price,countdown_source:null,ends_at:null,sale_terms_source:clean(snapshot.sale)},equipment,
    condition:{damages:[],tyres:[],tyres_source:'',maintenance_count:null,maintenance_entries:[],maintenance_source:'',auction_comments_source:comments,previous_major_accident_damage:major,vendor_damage_description_source:extraGet('Vendor Damage Description'),source_fields:extra},photos,documents,
    evidence:{fields,summary_source:title,sections:[{section:'BCA equipment and information',text:(snapshot.equipment||[]).map(g=>[g.section,...g.items].join('\n')).join('\n')},{section:'BCA comments',text:comments}]},warnings};
}
// Validate an observed photo in its current lot before an extension-origin download.
export function validateBcaPhoto(url,vin){
 if(!['www.bca.com','bca.com'].includes(location.hostname)||!/^#LotDetails\//i.test(location.hash))throw Error('Открытая вкладка больше не является карточкой BCA.');
 const rows=[...document.querySelectorAll('#tabs-1 .row')];const row=rows.find(e=>/^(VIN Number|VIN|Vehicle Identification Number)$/i.test(e.querySelector('label')?.textContent.trim()||''));
 if(!row||row.querySelector('span')?.textContent.trim()!==vin)throw Error('Открыт другой VIN BCA. Перечитайте карточку.');
 const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.hostname!=='www.bcaimage.com'||u.pathname!=='/Document'||u.searchParams.get('DocType')!=='VehicleImage'||!/^\d+$/.test(u.searchParams.get('docId')||''))throw Error('Недопустимый адрес фотографии BCA.');
 if(![...document.querySelectorAll('#tabs-1 .details-img-gal img[src]')].some(e=>e.src===u.href))throw Error('Фотография не найдена в текущей галерее BCA.');return u.href;
}
