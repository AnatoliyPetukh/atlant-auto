import {storeRequest,storeFile,storePhotoBlob} from './server-store.js';
const $=id=>document.getElementById(id);
const textFields=['title','description_pl','production_date','first_registration','mileage_km','keys','power_kw','power_hp','engine_cm3','fuel_pl','transmission_pl','color_pl','registration_country_pl','equipment_pl','tyres_pl'];
const states={auction:'Na aukcji',in_transit:'W drodze do Warszawy',on_site:'Na placu w Warszawie',sold:'Sprzedany',purchased:'Zakupiony',closed:'Aukcja zakończona'};
const node=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined&&value!==null)e.textContent=String(value);return e;};
export function createWebsiteEditor({key,onBusy=()=>{}}){
 let current=null,detail=null,dirty=false,busy=false,canPublish=false;
 const urls=new Map();let localUrls=[];
 const clearUrls=()=>{for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();for(const url of localUrls)URL.revokeObjectURL(url);localUrls=[];};
 window.addEventListener('unload',clearUrls);
 const selectedPhotos=()=>[...$('site-photo-picker').querySelectorAll('input:checked')].map(x=>x.value);
 function readChanges(){
  const c={};for(const field of textFields)c[field]=field==='equipment_pl'?$('site-'+field).value.split('\n').map(s=>s.trim()).filter(Boolean):$('site-'+field).value.trim();
  for(const field of ['awd','vat_deductible'])c[field]=$('site-'+field).value===''?null:$('site-'+field).value==='true';
  c.state=$('website-state').value;c.availability=$('website-availability').value;c.price_net=$('website-net').value.trim();c.price_gross=$('website-gross').value.trim();c.currency=$('website-currency').value;c.eta=$('site-eta').value;c.location_pl=$('site-location').value.trim();
  c.photo_ids=selectedPhotos();c.document_ids=[...$('site-document-picker').querySelectorAll('input:checked')].map(x=>x.value);return c;
 }
 function updateVisual(){
  if(!current)return;const c=readChanges(),host=$('site-visual-preview');host.replaceChildren();
  for(const url of localUrls)URL.revokeObjectURL(url);localUrls=[];
  const files=[...$('website-photos').files];const local=files.length&&['on_site','sold'].includes(c.state)?URL.createObjectURL(files[0]):null;if(local)localUrls.push(local);
  const cover=local||urls.get(c.photo_ids[0]);if(cover){const img=node('img');img.src=cover;img.alt=c.title;host.append(img);}
  host.append(node('p',c.availability==='reserved'&&c.state!=='sold'?'Zarezerwowany · dla klienta':states[c.state]),node('h2',c.title||'Nazwa samochodu'));
  const price=node('p');price.className='price';
  if(c.state==='auction')price.textContent=current.record.auction_bid===null||current.record.auction_bid===undefined?'Cena na zapytanie':new Intl.NumberFormat('pl-PL').format(current.record.auction_bid)+' '+(current.record.auction_currency||'EUR')+' · najwyższa oferta netto';
  else price.textContent=c.price_net?c.price_net+' '+c.currency+' netto':c.price_gross?c.price_gross+' '+c.currency+' brutto':'Cena na zapytanie';host.append(price);
  if(c.state!=='auction')host.append(node('p','Samochód przygotowany w Warszawie. Rejestracja i dodatkowe dokumenty wymagają osobnej wyceny.'));
  const specs=node('dl');
  const entries=[['Data produkcji',c.production_date],['Pierwsza rejestracja',c.first_registration],['Przebieg',c.mileage_km?c.mileage_km+' km':''],['Paliwo',c.fuel_pl],['Skrzynia biegów',c.transmission_pl],['Liczba kluczyków',c.keys],['Moc', [c.power_kw?c.power_kw+' kW':'',c.power_hp?c.power_hp+' KM':''].filter(Boolean).join(' / ')],['Kolor',c.color_pl],['Kraj dokumentów rejestracyjnych',c.registration_country_pl],['Napęd na cztery koła',c.awd===null?'':c.awd?'Tak':'Nie'],['VAT do odliczenia',c.vat_deductible===null?'':c.vat_deductible?'Tak':'Nie'],['Lokalizacja',c.location_pl],['Planowane przybycie',c.eta]];
  for(const [label,value]of entries)if(value!==''&&value!==null&&value!==undefined)specs.append(node('dt',label),node('dd',value));host.append(specs,node('h3','Opis samochodu'),node('p',c.description_pl));
  if(c.equipment_pl.length){host.append(node('h3','Wyposażenie'));const list=node('ul');for(const item of c.equipment_pl)list.append(node('li',item));host.append(list);}
  if(c.tyres_pl)host.append(node('h3','Opony'),node('p',c.tyres_pl));
  const r=current.record;if(r.damage_count!==null&&r.damage_count!==undefined)host.append(node('p','Uwagi w inspekcji: '+r.damage_count));if(r.service_count)host.append(node('p','Historia serwisowa: '+r.service_count+' zapisów.'));
  if(c.document_ids.length)host.append(node('p','Dokumenty PDF dostępne dla odwiedzających: '+c.document_ids.length));
 }
 function showState(){const state=$('website-state').value;$('website-ready-fields').hidden=state==='auction'||state==='closed';$('website-yard-fields').hidden=!['on_site','sold'].includes(state);}
 function fill(){
  const r=current.record;for(const field of textFields)$('site-'+field).value=field==='equipment_pl'?(r[field]||[]).join('\n'):r[field]??'';
  for(const field of ['awd','vat_deductible'])$('site-'+field).value=r[field]===true?'true':r[field]===false?'false':'';
  $('website-state').value=r.state;$('website-availability').value=r.availability;$('website-net').value=r.price_net??'';$('website-gross').value=r.price_gross??'';$('website-currency').value=r.currency||'EUR';$('site-eta').value=r.eta||'';$('site-location').value=r.location_pl||'';$('website-photos').value='';
  showState();$('site-public-link').hidden=!current.published_json;if(current.published_json)$('site-public-link').href='https://atlantauto.pl/pl/oferty/?id='+current.public_id;
 }
 async function galleries(){
  const photos=$('site-photo-picker');photos.replaceChildren();const docs=$('site-document-picker');docs.replaceChildren();
  const selected=new Set(current.record.photo_ids||[]),shared=new Set(current.record.document_ids||[]);
  const assets=detail.assets.filter(a=>['vehicle','on_site'].includes(a.kind)&&['image/jpeg','image/png','image/webp'].includes(a.mime)).slice(0,60);
  for(const asset of assets){
   const label=node('label'),check=node('input');check.type='checkbox';check.value=asset.id;check.checked=selected.has(asset.id);const img=node('img');img.alt=current.record.title;label.append(img,check,document.createTextNode(asset.kind==='on_site'?' Фото с площадки':' Фото аукциона'));photos.append(label);
   try{if(!urls.has(asset.id))urls.set(asset.id,URL.createObjectURL(await storePhotoBlob(key(),asset.id)));img.src=urls.get(asset.id);}catch{img.alt='Фото сохранено; предпросмотр недоступен';}
  }
  for(const asset of detail.assets.filter(a=>['inspection','partslink'].includes(a.kind)&&a.mime==='application/pdf')){
   const label=node('label'),check=node('input');check.type='checkbox';check.value=asset.id;check.checked=shared.has(asset.id);label.append(check,document.createTextNode(' '+(asset.kind==='inspection'?'Инспекция':'PartsLink')+' · '+asset.name));docs.append(label);
  }
 }
 function validate(c){
  if(!c.title||!c.description_pl)throw Error('Заполните польское название и описание.');if(!states[c.state])throw Error('Выберите состояние автомобиля.');
  for(const value of [c.price_net,c.price_gross])if(value&&!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(value))throw Error('Проверьте цену: число, не более двух знаков после запятой.');
  const files=['on_site','sold'].includes(c.state)?[...$('website-photos').files]:[];
  if(files.length>30||files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||!f.size||f.size>20*1024*1024))throw Error('Выберите до 30 фотографий JPEG, PNG или WebP, до 20 МБ каждая.');
  if(c.state==='on_site'){
   if(!c.price_net&&!c.price_gross)throw Error('Для машины на площадке укажите цену нетто или брутто.');
   const yard=detail.assets.some(a=>a.kind==='on_site'&&c.photo_ids.includes(a.id));if(!files.length&&!yard)throw Error('Для машины на площадке выберите реальные фотографии.');
  }
  return files;
 }
 async function save(publish){
  if(busy||!current)return;const result=$('site-result');busy=true;onBusy(true);$('site-save').disabled=true;$('site-publish').disabled=true;
  const locked=[...$('website-editor').querySelectorAll('input,select,textarea,button')].map(control=>[control,control.disabled]);for(const[control]of locked)control.disabled=true;
  try{
   const changes=readChanges(),files=validate(changes);const newIds=[];
   for(const [i,file]of files.entries()){result.textContent=`Сохраняю фото с площадки ${i+1} из ${files.length}…`;const uploaded=await storeFile(key(),current.draft_id,file,{name:file.name,kind:'on_site'});newIds.push(uploaded.asset_id);}
   if(newIds.length)changes.photo_ids=[...new Set(newIds)];
   result.textContent='Сохраняю правки в черновик…';
   current=(await storeRequest(key(),{action:'product_save',body:{id:current.draft_id,revision:current.revision,changes}})).product;dirty=false;
   if(publish){result.textContent='Публикую проверенную версию…';current=(await storeRequest(key(),{action:'product_publish',body:{id:current.draft_id,revision:current.revision}})).product;}
   detail=(await storeRequest(key(),{query:'?id='+current.draft_id})).data;fill();await galleries();updateVisual();
   result.textContent=publish?'Автомобиль опубликован. Откройте страницу по ссылке ниже.':'Правки сохранены в черновик. Опубликованная страница не менялась.';
  }catch(error){result.textContent=error.message+' При обрыве связи проверьте результат перед повторной отправкой.';}
  finally{for(const[control,disabled]of locked)control.disabled=disabled;busy=false;onBusy(false);$('site-save').disabled=false;$('site-publish').disabled=!canPublish;}
 }
 $('site-save').addEventListener('click',()=>save(false));$('site-publish').addEventListener('click',()=>save(true));
 $('website-editor').addEventListener('input',()=>{dirty=true;showState();updateVisual();});$('website-editor').addEventListener('change',event=>{dirty=true;
  if(event.target.id==='website-state'&&['','Samochód na aukcji europejskiej','W drodze do Warszawy','Na placu w Warszawie'].includes($('site-location').value)){
   const locations={auction:'Samochód na aukcji europejskiej',in_transit:'W drodze do Warszawy',purchased:'W drodze do Warszawy',on_site:'Na placu w Warszawie',sold:'Warszawa'};$('site-location').value=locations[$('website-state').value]||'';
  }
  showState();updateVisual();});
 return {reset(){clearUrls();current=null;detail=null;dirty=false;$('website-editor').hidden=true;},async open(row){
  if(dirty&&current?.draft_id===row.draft_id){$('site-result').textContent='Источник обновлён. Несохранённые правки превью оставлены на экране.';return;}
  clearUrls();current=row;dirty=false;detail=(await storeRequest(key(),{query:'?id='+row.draft_id})).data;
  $('website-editor').hidden=false;fill();updateVisual();
  const identity=await storeRequest(key(),{action:'identity'});canPublish=identity.employee==='owner';$('site-publish').disabled=!canPublish;
  $('site-result').textContent=canPublish?'Превью готово. Проверьте данные и нажмите «Отправить на сайт».':'Превью готово. Сохраните правки; публикация доступна владельцу с ключом owner.';
  await galleries();updateVisual();
 }};
}
