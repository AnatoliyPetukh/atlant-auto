import {parseDeliveryAmount,deliveryLabel} from './delivery.js';
import {collectArvalLot} from './collector.js';
import {collectPartslink,attachPartslink} from './partslink.js';
import {telegramCaption,readArvalPhoto,hasPrivateAuctionLink} from './telegram.js';
import {storeRequest,storeFile} from './server-store.js';
import {applyVehicleTitle,publicVehicleTitle} from './vehicle-title.js';
import {applyVehicleFacts,vehicleFacts,productionLabel,vehicleDateLabel} from './vehicle-facts.js';
import {readPartslinkPdf} from './partslink-pdf.js';
import {applyVehicleLocation} from './location.js';
import {applyEquipmentHighlights,equipmentHighlights,selectedEquipmentHighlights} from './equipment-highlights.js';

const $ = id => document.getElementById(id);
const tabId = Number(new URLSearchParams(location.search).get('tab'));
let packet;
let partslinkFile=null;
function ensurePartslinkRead(){
  if($('partslink-pdf').files[0]&&$('partslink-pdf').files[0]!==partslinkFile)throw Error('Выбранный PDF PartsLink ещё не прочитан. Нажмите «Прочитать PDF PartsLink» и дождитесь подтверждения. При ошибке данные этого файла не используются.');
}
function ensureDeliveryValid(){parseDeliveryAmount($('delivery-cost').value);}
function syncDeliveryInput(){
  if(!packet)return;
  const status=$('delivery-status');
  try{
    const amount=parseDeliveryAmount($('delivery-cost').value);
    packet.logistics={...(packet.logistics||{}),delivery_to_warsaw:amount===null?null:{amount_minor:amount,currency:'EUR',destination:'Warsaw',origin_source:packet.vehicle.storage_location||null,source:'employee',entered_at:new Date().toISOString()}};
    status.className='note';status.textContent=amount===null?'Стоимость доставки не указана — строки в посте не будет.':'Сумма будет сохранена с черновиком и добавлена в пост отдельно от ставки.';
  }catch(error){
    packet.logistics={...(packet.logistics||{}),delivery_to_warsaw:null};status.className='failed';status.textContent=error.message;
  }
  if(!$('telegram').hidden){
    const lines=$('caption').value.split('\n').filter(x=>!x.startsWith('🚚 Доставка до Варшавы:'));const label=deliveryLabel(packet);
    if(label){const location=lines.findIndex(x=>x.startsWith('📍'));if(location>=0)lines.splice(location+1,0,label);else lines.push('',label);}
    $('caption').value=lines.join('\n');countCaption();
  }
}
$('delivery-cost').addEventListener('input',syncDeliveryInput);
const setStatus = message => { $('status').textContent = message; };
const addLog = (message, failed = false) => {
  const li = document.createElement('li'); li.textContent = message; li.className = failed ? 'failed' : 'ok'; $('log').append(li);
};

async function readLot() {
  for(const id of ['retry','post','server-save','website-create'])$(id).disabled=true;
  let ready=false;
  try {
    if (!Number.isSafeInteger(tabId) || tabId <= 0) throw new Error('Запустите расширение кнопкой на открытой карточке Arval.');
    const [site]=await chrome.scripting.executeScript({target:{tabId},func:()=>location.hostname==='www.partslink24.com'});
    if(site?.result===true) {
      const [data]=await chrome.scripting.executeScript({target:{tabId},func:collectPartslink});
      await chrome.storage.local.set({['parts:'+data.result.vin]:data.result});
      $('progress').hidden=false;$('log').replaceChildren();
      for(const option of data.result.equipment)addLog(`${option.code} — ${option.label}`);
      setStatus(`Сохранено ${data.result.equipment.length} опций partslink24 для VIN ${data.result.vin}. Теперь откройте этот автомобиль в Arval и нажмите расширение.`);
      return;
    }
    // No clicks, forms, or synthetic input on auction/catalog pages.
    // The operator opens documents and equipment panels before invoking capture.
    const [response] = await chrome.scripting.executeScript({target:{tabId}, func: collectArvalLot});
    const previous=packet;packet = response.result;
    if (!packet?.vehicle?.vin) throw new Error('Arval не вернул данные автомобиля.');
    if(chrome.storage?.local){const key='parts:'+packet.vehicle.vin;const stored=await chrome.storage.local.get(key);attachPartslink(packet,stored[key]);}
    if(previous?.vehicle?.vin===packet.vehicle.vin&&previous.enrichment?.partslink24_pdf)packet.enrichment={...(packet.enrichment||{}),partslink24_pdf:previous.enrichment.partslink24_pdf};
    else{partslinkFile=null;$('partslink-pdf').value='';}
    if(previous?.vehicle?.vin===packet.vehicle.vin && previous.vehicle.title_override)packet.vehicle.title_override=previous.vehicle.title_override;
    if(previous?.vehicle?.vin===packet.vehicle.vin && Array.isArray(previous.vehicle.equipment_selection))packet.vehicle.equipment_selection=[...previous.vehicle.equipment_selection];
    if(previous?.vehicle?.vin===packet.vehicle.vin&&previous.vehicle.storage_location===packet.vehicle.storage_location&&previous.logistics?.delivery_to_warsaw)packet.logistics={...(packet.logistics||{}),delivery_to_warsaw:{...previous.logistics.delivery_to_warsaw}};
    const delivery=packet.logistics?.delivery_to_warsaw;
    $('delivery-cost').value=delivery?String(delivery.amount_minor/100):'';
    $('delivery-status').className='note';$('delivery-status').textContent=delivery?'Стоимость доставки сохранена для этого автомобиля и региона.':'Укажите доставку до Варшавы из региона автомобиля. Пустое поле — без строки в посте.';
    applyVehicleTitle(packet);
    applyVehicleFacts(packet);
    applyVehicleLocation(packet);
    applyEquipmentHighlights(packet);
    $('preview').hidden = false;
    $('title').textContent = publicVehicleTitle(packet.vehicle);
    $('publication-title').value=packet.vehicle.display_title;
    $('source-title').textContent=packet.vehicle.title_details.source_title;
    const naming=packet.vehicle.title_details;
    $('title-note').textContent=[naming.needs_review?'Название обработано консервативно: проверьте незнакомые обозначения.':'Название для публикации подготовлено по правилам Kia Sportage.',naming.trim_source.length?`Комплектация: ${naming.trim_source.join(', ')}.`:'',naming.power_source.length?`Мощность из названия: ${naming.power_source.join(', ')}.`:'',naming.gearbox_source.length?`КПП из названия: ${naming.gearbox_source.join(', ')}.`:'',naming.emissions_source.length?`Экостандарт из названия: ${naming.emissions_source.join(', ')}.`:''].filter(Boolean).join(' ');
    $('identity').textContent = `VIN ${packet.vehicle.vin} · ${packet.vehicle.location.label}`;
    $('facts').replaceChildren();
    const facts = [
      ['Локация в источнике', packet.vehicle.storage_location || 'Не указана'],
      ['Дата производства', `${productionLabel(packet.vehicle.publication_facts.production)}${packet.vehicle.publication_facts.production?` · источник: ${packet.vehicle.publication_facts.production.source}`:''}`],
      ['Дата в объявлении', `${vehicleDateLabel(packet.vehicle.publication_facts)}${packet.vehicle.publication_facts.display_date?` · источник: ${packet.vehicle.publication_facts.display_date.source}`:''}`],
      ['Тип двигателя', packet.vehicle.publication_facts.engine.label],
      ['Пробег', packet.vehicle.mileage_km === null ? 'Не распознан' : `${packet.vehicle.mileage_km.toLocaleString('ru')} км`],
      ['Первая регистрация (Arval)', packet.vehicle.first_registration_source || 'Не распознана'],
      ['Текущая максимальная ставка', packet.auction.price.amount === null ? 'Не распознана' : `${packet.auction.price.amount.toLocaleString('ru')} ${packet.auction.price.currency} · НДС не определён`],
      ['До окончания торгов (на момент сбора)', packet.auction.countdown_source_original||packet.auction.countdown_source||'Таймер не распознан'],
      ['Основные / повреждения', `${packet.photos.filter(p=>p.kind==='vehicle').length} / ${packet.photos.filter(p=>p.kind==='damage').length} фото`],
      ['Комплектация / замечания', `${packet.equipment.length} опций / ${packet.condition.damages.length} замечаний`],
      ['Главное в комплектации', `${packet.vehicle.equipment_highlights.items.map(x=>x.label).join(', ')||'Нет распознанных значимых опций'} · источник: ${packet.vehicle.equipment_highlights.source}`],
      ['Отчёты и PDF', `${packet.documents.length}`]
    ];
    for (const [label, value] of facts) {
      const dt = document.createElement('dt');dt.textContent = label;
      const dd = document.createElement('dd');dd.textContent = value;if(label==='Дата производства')dd.id='production-fact';if(label==='Дата в объявлении')dd.id='publication-date-fact';if(label==='Тип двигателя')dd.id='engine-fact';if(label==='Главное в комплектации')dd.id='equipment-fact';$('facts').append(dt, dd);
    }
    $('warnings').replaceChildren();
    for (const warning of packet.warnings) {const p = document.createElement('p');p.className='warning';p.textContent=warning;$('warnings').append(p);}
    setStatus('Лот прочитан. Проверьте данные, сохраните на сервере или подготовьте пост для Telegram.');
    ready=true;
    if(chrome.storage?.local && !$('employee-key').value){
      $('employee-key').value=(await chrome.storage.local.get('telegram_employee_key')).telegram_employee_key||'';
      if($('employee-key').value)$('connection-status').textContent='На этом компьютере уже есть сохранённый ключ. Нажмите «Сохранить и проверить подключение», чтобы проверить его на сервере.';
      else $('connection-panel').open=true;
    }
  } catch(error) { setStatus(error.message); }
  finally{$('retry').disabled=false;$('post').disabled=!ready;$('server-save').disabled=!ready;$('website-create').disabled=!ready;}
}

$('retry').addEventListener('click',readLot);
readLot();

const DRAFT_ENDPOINT='https://serwer2454127.home.pl/internal-api/telegram-draft.php';
let draftFingerprint=null;
const photoCache=new Map();
async function photoBlob(photo){
  const cacheKey=packet.vehicle.vin+':'+photo.url;
  if(photoCache.has(cacheKey))return photoCache.get(cacheKey);
  const [read]=await chrome.scripting.executeScript({target:{tabId},func:readArvalPhoto,args:[photo.url,packet.vehicle.vin]});
  if(typeof read.result!=='string'||!read.result.startsWith('data:image/'))throw Error('Не удалось получить фотографию из Arval.');
  const blob=await(await fetch(read.result)).blob();photoCache.set(cacheKey,blob);return blob;
}
async function saveServerPhotos(key,photos,progress){
  packet.website_seed={equipment_ids:selectedEquipmentHighlights(packet).items.map(x=>x.id)};
  const draft=await storeRequest(key,{body:packet});let failed=0;
  for(const [i,photo]of photos.entries()){
    progress(`Сохраняю на сервер фото ${i+1} из ${photos.length}…`);
    try{const blob=await photoBlob(photo);await storeFile(key,draft.id,blob,{name:`${String(i+1).padStart(3,'0')}.${blob.type==='image/png'?'png':'jpg'}`,kind:photo.kind==='damage'?'damage':'vehicle',sourceUrl:photo.url});}
    catch(error){failed++;addLog(`Сервер: фото ${i+1}: ${error.message}`,true);}
  }
  return {...draft,failed};
}
function websiteSettings(){
 const state=$('website-state').value;if(!['auction','in_transit','on_site'].includes(state))throw Error('Выберите состояние автомобиля.');
 const changes={state,availability:$('website-availability').value};
 const files=Array.from($('website-photos').files||[]);
 if(state!=='auction'){
  changes.currency=$('website-currency').value;
  for(const[field,id]of[['price_net','website-net'],['price_gross','website-gross']]){const value=$(id).value.trim();if(value){if(!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(value))throw Error('Проверьте цену автомобиля: число, не более двух знаков после запятой.');changes[field]=value;}}
 }
 if(state==='on_site'){
  if(!changes.price_net&&!changes.price_gross)throw Error('Для машины на площадке укажите цену нетто или брутто.');
  if(!files.length)throw Error('Для машины на площадке выберите реальные фотографии.');
  if(files.length>30||files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size<=0||f.size>20*1024*1024))throw Error('Выберите до 30 фотографий JPEG, PNG или WebP, до 20 МБ каждая.');
  changes.location_pl='Na placu w Warszawie';
 }else if(state==='in_transit')changes.location_pl='W drodze do Warszawy';
 else changes.location_pl='Samochód na aukcji europejskiej';
 return {changes,files:state==='on_site'?files:[]};
}
function showWebsiteFields(){$('website-ready-fields').hidden=$('website-state').value==='auction';$('website-yard-fields').hidden=$('website-state').value!=='on_site';}
$('website-state').addEventListener('change',showWebsiteFields);showWebsiteFields();
$('website-create').addEventListener('click',async()=>{
  const result=$('website-result');const locked=['website-create','server-save','post','retry','send-draft','import-partslink'].map(id=>[$(id),$(id).disabled]);
  try{
    ensurePartslinkRead();ensureDeliveryValid();const settings=websiteSettings();const key=$('employee-key').value.trim();if(!key)throw Error('Сначала подключите ключ сотрудника.');
    if(!await chrome.permissions.request({origins:['https://serwer2454127.home.pl/*']}))throw Error('Нет разрешения на доступ к серверу.');
    for(const [button]of locked)button.disabled=true;$('progress').hidden=false;
    const saved=await saveServerPhotos(key,packet.photos,message=>result.textContent=message);
    if(saved.failed)throw Error('Не все фото сохранены. Повторите загрузку перед подготовкой карточки.');
    for(const{file,kind}of pendingPdfs())await storeFile(key,saved.id,file,{name:file.name,kind});
    const sitePhotos=[];
    for(const [i,file]of settings.files.entries()){
      result.textContent=`Сохраняю фото с площадки ${i+1} из ${settings.files.length}…`;
      const uploaded=await storeFile(key,saved.id,file,{name:file.name,kind:'on_site'});sitePhotos.push(uploaded.asset_id);
    }
    const created=await storeRequest(key,{action:'product_create',body:{id:saved.id}});
    if(sitePhotos.length)settings.changes.photo_ids=sitePhotos;
    await storeRequest(key,{action:'product_save',body:{id:saved.id,revision:created.product.revision,changes:settings.changes}});
    $('website-link').href=`https://serwer2454127.home.pl/drafts/?id=${saved.id}#product-editor`;$('website-link').hidden=false;
    result.textContent='Карточка автомобиля на польском создана или обновлена на сервере. Откройте её, проверьте состояние, цену и материалы. На сайте она появится после отдельной публикации владельцем.';
  }catch(error){result.textContent=error.message;}finally{for(const[button,disabled]of locked)button.disabled=disabled;countCaption();}
});
$('server-save').addEventListener('click',async()=>{
  const result=$('server-result');
  try{
    ensurePartslinkRead();ensureDeliveryValid();
    const key=$('employee-key').value.trim();if(!key)throw Error('Введите ключ сотрудника ниже.');
    if(!await chrome.permissions.request({origins:['https://serwer2454127.home.pl/*']}))throw Error('Нет разрешения на доступ к серверу Atlant Auto.');
    $('server-save').disabled=true;$('retry').disabled=true;$('post').disabled=true;$('send-draft').disabled=true;$('import-partslink').disabled=true;$('progress').hidden=false;
    const draft=await saveServerPhotos(key,packet.photos,message=>result.textContent=message);
    let pdfFailed=0;
    for(const {file,kind} of pendingPdfs()){
      result.textContent=`Сохраняю ${file.name}…`;
      try{await storeFile(key,draft.id,file,{name:file.name,kind});}catch(error){pdfFailed++;addLog(`${file.name}: ${error.message}`,true);}
    }
    result.textContent=draft.failed||pdfFailed?`Черновик сохранён частично: не загружено фото ${draft.failed}, документов ${pdfFailed}. Можно повторить — одинаковые файлы не дублируются.`:'Черновик и все найденные фотографии сохранены на сервере. Прикреплённые PDF также сохранены. Ссылки на отчёты сохранены; сами отчёты нужно приложить PDF.';
    $('server-link').href=`https://serwer2454127.home.pl/drafts/?id=${draft.id}`;$('server-link').hidden=false;
  }catch(error){result.textContent=error.message;}finally{$('server-save').disabled=false;$('retry').disabled=false;$('post').disabled=false;$('import-partslink').disabled=false;countCaption();}
});
const countCaption=()=>{
  const facts=packet?vehicleFacts(packet):null;const policy=facts?.publication||{ready:false,reasons:[]};
  const privateLink=hasPrivateAuctionLink($('caption').value);
  $('caption-count').textContent=`${$('caption').value.length} / 1024 знаков для подписи альбома`;
  $('publication-status').textContent=policy.ready?['Дата для объявления и тип двигателя определены по распознанным полям.',facts.date_notice,'Перед отправкой сверьте исходные данные.'].filter(Boolean).join(' '):policy.reasons.join(' ')+' Черновик можно сохранить на сервере; отправка поста пока отключена.';
  $('publication-status').className=policy.ready?'note':'warning';
  if(privateLink){$('publication-status').textContent+=' Удалите закрытую ссылку Arval из текста поста.';$('publication-status').className='warning';}
  let deliveryInvalid=false;try{ensureDeliveryValid();}catch{deliveryInvalid=true;}
  const unread=$('partslink-pdf').files[0]&&$('partslink-pdf').files[0]!==partslinkFile;
  if(unread){$('publication-status').textContent+=' Выбран новый PDF PartsLink: сначала прочитайте его.';$('publication-status').className='warning';}
  $('send-draft').disabled=$('caption').value.length>1024||!policy.ready||privateLink||Boolean(unread)||deliveryInvalid;
};
$('partslink-pdf').addEventListener('change',()=>{
  const status=$('partslink-import-status');status.className='warning';status.textContent=$('partslink-pdf').files[0]?'Файл выбран. Теперь нажмите «Прочитать PDF PartsLink». До успешного чтения его данные не добавлены к лоту.':'Файл не выбран.';
  if(!$('telegram').hidden)countCaption();
});
const pendingPdfs=()=>[...Array.from($('server-pdfs').files,file=>({file,kind:'document'})),...Array.from($('inspection-pdfs').files,file=>({file,kind:'inspection'})),...(partslinkFile?[{file:partslinkFile,kind:'partslink'}]:[])];
function renderEquipmentPicker(){
  const candidates=equipmentHighlights(packet,15);const selected=new Set(selectedEquipmentHighlights(packet).items.map(x=>x.id));
  const root=$('equipment-picker');root.replaceChildren();
  for(const option of candidates.items){
    const label=document.createElement('label');label.title=`Источник: ${option.source_label}${option.source_code?` (${option.source_code})`:''}`;
    const input=document.createElement('input');input.type='checkbox';input.value=option.id;input.checked=selected.has(option.id);
    const name=document.createElement('span');name.textContent=option.label;label.append(input,name);root.append(label);
    input.addEventListener('change',()=>{
      packet.vehicle.equipment_selection=[...root.querySelectorAll('input:checked')].map(x=>x.value);
      $('equipment-selection-count').textContent=`Выбрано: ${packet.vehicle.equipment_selection.length} из ${candidates.items.length} · источник: ${candidates.source}`;
      $('caption').value=telegramCaption(packet,{includeReport:$('include-report').checked,buttons:true,includeMaintenance:$('include-service').checked});countCaption();
    });
  }
  $('equipment-selection-count').textContent=candidates.items.length?`Выбрано: ${selected.size} из ${candidates.items.length} · источник: ${candidates.source}`:'Подтверждённые значимые опции не распознаны. Подключите PartsLink; список не дополняется предположениями.';
}
$('inspection-pdfs').addEventListener('change',()=>{
  const files=[...$('inspection-pdfs').files];
  $('inspection-upload-status').textContent=files.length?`Выбрано отчётов: ${files.length}. Следующий шаг — «Сохранить на сервере». Для выдачи в боте оставьте включённым «Разрешить выдачу инспекции через кнопку» при подготовке поста.`:'Файл не выбран. Прикрепите PDF инспекции и нажмите «Сохранить на сервере».';
});
function partsStatus(){
  const page=packet.enrichment?.partslink24;const pdf=packet.enrichment?.partslink24_pdf;
  if(page||pdf)return `Данные PartsLink подключены по VIN. Распознано опций: ${[page?`страница — ${page.equipment?.length||0}`:'',pdf?`PDF — ${pdf.equipment?.length||0}`:''].filter(Boolean).join('; ')}. Для поста выбираются значимые опции.`;
  return 'Данные PartsLink пока не сохранены. Прочитайте открытую страницу PartsLink и перечитайте лот Arval либо импортируйте PDF в блоке «Данные PartsLink».';
}
$('import-partslink').addEventListener('click',async()=>{
  const button=$('import-partslink');const status=$('partslink-import-status');
  const locked=['server-save','retry','post'].map(id=>[$(id),$(id).disabled]);
  try{
    if(!packet)throw Error('Сначала прочитайте лот Arval.');
    button.disabled=true;for(const [control]of locked)control.disabled=true;$('send-draft').disabled=true;const original=packet;const file=$('partslink-pdf').files[0];status.className='';status.textContent='Читаю PDF на этом компьютере…';
    const parts=await readPartslinkPdf(file,packet.vehicle.vin);
    if(packet!==original)throw Error('Лот был перечитан во время разбора PDF. Повторите импорт для текущего лота.');
    packet.enrichment={...(packet.enrichment||{}),partslink24_pdf:parts};partslinkFile=file;applyVehicleFacts(packet);applyEquipmentHighlights(packet);
    const facts=packet.vehicle.publication_facts;
    $('production-fact').textContent=`${productionLabel(facts.production)}${facts.production?` · источник: ${facts.production.source}`:''}`;
    $('publication-date-fact').textContent=`${vehicleDateLabel(facts)}${facts.display_date?` · источник: ${facts.display_date.source}`:''}`;
    $('engine-fact').textContent=facts.engine.label;
    const equipment=packet.vehicle.equipment_highlights;$('equipment-fact').textContent=`${equipment.items.map(x=>x.label).join(', ')||'Нет распознанных значимых опций'} · источник: ${equipment.source}`;
    status.className='ok';status.textContent=`PDF прочитан, VIN совпадает. ${vehicleDateLabel(facts)}. ${facts.date_notice} Распознано позиций комплектации: ${parts.equipment.length}. Данные уже добавлены к лоту и будут использованы в посте. Следующий шаг — «Сохранить на сервере».`;
    if(!$('telegram').hidden){renderEquipmentPicker();$('parts-status').textContent=partsStatus();$('caption').value=telegramCaption(packet,{includeReport:$('include-report').checked,buttons:true,includeMaintenance:$('include-service').checked});countCaption();}
  }catch(error){status.className='failed';status.textContent=error.message+(partslinkFile?' Ранее успешно импортированный PDF остаётся в черновике.':'');}
  finally{button.disabled=false;for(const [control,disabled]of locked)control.disabled=disabled;if(!$('telegram').hidden)countCaption();}
});
$('publication-title').addEventListener('input',()=>{
  if(!packet)return;
  const previous=publicVehicleTitle(packet.vehicle);packet.vehicle.title_override=$('publication-title').value.trim();applyVehicleTitle(packet);
  const next=publicVehicleTitle(packet.vehicle);$('title').textContent=next;
  if(!$('telegram').hidden){const lines=$('caption').value.split('\n');const titleIndex=lines.indexOf(previous);if(titleIndex!==-1){lines[titleIndex]=next;$('caption').value=lines.join('\n');countCaption();}}
});
$('post').addEventListener('click',async()=>{
  try{ensurePartslinkRead();ensureDeliveryValid();}catch(error){$('partslink-import-status').className='warning';$('partslink-import-status').textContent=error.message;$('import-partslink').focus();return;}
  $('telegram').hidden=false;
  renderEquipmentPicker();
  $('caption').value=telegramCaption(packet,{includeReport:$('include-report').checked,buttons:true,includeMaintenance:$('include-service').checked});countCaption();
  $('parts-status').textContent=partsStatus();
  $('photo-picker').replaceChildren();
  packet.photos.filter(x=>x.kind==='vehicle').forEach((photo,i)=>{
    const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.value=String(i);input.checked=i<5;
    const img=document.createElement('img');img.src=photo.url;img.alt=`Фото ${i+1}`;img.referrerPolicy='no-referrer';
    label.append(img,input,document.createTextNode(` Фото ${i+1}`));$('photo-picker').append(label);
  });
});
for(const id of ['include-report','include-service'])$(id).addEventListener('change',()=>{$('caption').value=telegramCaption(packet,{includeReport:$('include-report').checked,buttons:true,includeMaintenance:$('include-service').checked});countCaption();});
$('caption').addEventListener('input',countCaption);
$('save-key').addEventListener('click',async()=>{
  const status=$('connection-status');const button=$('save-key');let saved=false;
  status.className='';
  try{
    let key=$('employee-key').value.trim();
    if(key.startsWith('{')||key.startsWith('"')){
      try{const value=JSON.parse(key);key=typeof value==='string'?value:value?.access_key;}catch{throw Error('Не удалось прочитать файл доступа. Скопируйте только значение поля access_key без кавычек.');}
    }
    if(typeof key!=='string'||!/^[A-Za-z0-9_-]{32,128}$/.test(key))throw Error('Нужен длинный ключ access_key из вашего файла. Название owner и пароль сайта не подходят.');
    button.disabled=true;$('employee-key').value=key;
    status.textContent='Сохраняю ключ на этом компьютере…';
    // Start the optional permission request inside the click gesture, before await.
    const permission=chrome.permissions.request({origins:['https://serwer2454127.home.pl/*']}).catch(()=>false);
    await chrome.storage.local.set({telegram_employee_key:key});
    const check=await chrome.storage.local.get('telegram_employee_key');
    if(check.telegram_employee_key!==key)throw Error('Chrome не подтвердил сохранение ключа. Закройте вкладку расширения и откройте его заново из Arval.');
    saved=true;status.textContent='Ключ сохранён на этом компьютере. Проверяю доступ к серверу…';
    if(!await permission){status.className='warning';status.textContent='Ключ сохранён на этом компьютере, но проверка не выполнена: доступ к серверу не разрешён. Повторите проверку и разрешите доступ к serwer2454127.home.pl.';return;}
    const connected=await storeRequest(key,{action:'identity'});
    if(typeof connected.employee!=='string')throw Error('Сервер пока не поддерживает проверку подключения.');
    status.className='ok';status.textContent=`Подключено: ${connected.employee}. Ключ сохранён на этом компьютере. Теперь можно сохранить черновик на сервере или подготовить пост для Telegram.`;
  }catch(error){
    status.className='failed';
    const message=String(error?.message||'Неизвестная ошибка.');
    status.textContent=/context invalidated|Extension context|Cannot read properties/i.test(message)?'Расширение было обновлено или Chrome не дал доступ к его хранилищу. Закройте эту вкладку и заново нажмите значок расширения на странице Arval.':`${saved?'Ключ сохранён локально, но подключение не подтверждено. ':''}${message}`;
  }finally{button.disabled=false;}
});
$('copy-caption').addEventListener('click',async()=>{
  try{ensurePartslinkRead();ensureDeliveryValid();}catch(error){$('telegram-result').textContent=error.message;return;}
  if(hasPrivateAuctionLink($('caption').value)){$('telegram-result').textContent='Удалите закрытую ссылку Arval из текста перед копированием.';return;}
  try{await navigator.clipboard.writeText($('caption').value);$('telegram-result').textContent='Текст скопирован.';}catch{$('caption').select();$('telegram-result').textContent='Выделен текст — нажмите Ctrl+C или Cmd+C.';}
});
$('send-draft').addEventListener('click',async()=>{
  const result=$('telegram-result');
  try{
    ensurePartslinkRead();ensureDeliveryValid();
    const caption=$('caption').value.trim();
    if(hasPrivateAuctionLink(caption))throw Error('Закрытая ссылка Arval не должна попадать в пост. Удалите её из текста.');
    const policy=vehicleFacts(packet).publication;if(!policy.ready)throw Error(policy.reasons.join(' '));
    const key=$('employee-key').value.trim();
    const photos=packet.photos.filter(x=>x.kind==='vehicle');
    const selected=[...$('photo-picker').querySelectorAll('input:checked')].map(x=>photos[Number(x.value)]);
    if(!key)throw Error('Сначала создайте бота и подключите сервер. Здесь нужен отдельный ключ сотрудника, не токен бота.');
    if(caption.length>1024||!caption)throw Error('Подпись должна содержать от 1 до 1024 знаков.');
    if(selected.length<2||selected.length>10)throw Error('Выберите от 2 до 10 фотографий.');
    const granted=await chrome.permissions.request({origins:['https://serwer2454127.home.pl/*']});
    if(!granted)throw Error('Нет разрешения на отправку в сервер Atlant Auto.');
    $('send-draft').disabled=true;
    $('retry').disabled=true;$('server-save').disabled=true;$('import-partslink').disabled=true;
    const saved=await saveServerPhotos(key,selected,message=>result.textContent=message);
    if(saved.failed)throw Error('Часть фото не сохранилась на сервере. Черновик Telegram ещё не отправлен.');
    for(const {file,kind} of pendingPdfs()){
      result.textContent=`Сохраняю документ ${file.name} перед отправкой…`;
      await storeFile(key,saved.id,file,{name:file.name,kind});
    }
    const payload={vin:packet.vehicle.vin,caption,captured_at:packet.source.captured_at,photos:selected.map(x=>x.url),buttons_version:1,share_inspection:$('include-report').checked,share_partslink:$('include-parts').checked,share_maintenance:$('include-service').checked};
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
    const requestId=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(draftFingerprint===requestId)throw Error('Этот черновик уже отправлен.');
    const form=new FormData();form.append('payload',JSON.stringify({...payload,request_id:requestId}));
    for(const [i,photo]of selected.entries()){
      result.textContent=`Читаю фото ${i+1} из ${selected.length}…`;
      const blob=await photoBlob(photo);form.append('photo_'+i,blob,`${i+1}.${blob.type==='image/png'?'png':'jpg'}`);
    }
    result.textContent='Отправляю альбом в закрытый чат…';
    const response=await fetch(DRAFT_ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+key},body:form,credentials:'omit',redirect:'error',signal:AbortSignal.timeout(120000)});
    let body;try{body=await response.json();}catch{throw Error('Сервер не подключён или вернул неизвестный ответ.');}
    if(!response.ok||!body.ok)throw Error(body.error||'Сервер не подтвердил отправку.');
    draftFingerprint=requestId;result.textContent=body.buttons_status==='sent'?'Альбом отправлен. Ссылки на материалы находятся внизу описания первого сообщения; отдельное сообщение не требуется.':body.buttons_status?'Альбом отправлен, но доставка кнопок не подтверждена. Проверьте чат; не отправляйте альбом повторно.':'Черновик отправлен в закрытый чат. Можно проверить и переслать его в канал.';
  }catch(error){result.textContent=error.message+' Если соединение оборвалось во время отправки, сначала проверьте закрытый чат: автоматических повторов нет.';}
  finally{$('retry').disabled=false;$('server-save').disabled=false;$('import-partslink').disabled=false;countCaption();}
});
