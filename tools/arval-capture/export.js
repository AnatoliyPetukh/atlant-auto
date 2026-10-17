import {createWebsiteEditor} from './website-editor.js';
import {parseDeliveryAmount,deliveryLabel} from './delivery.js';
import {collectArvalLot} from './collector.js';
import {collectPartslink,attachPartslink} from './partslink.js';
import {telegramCaption,readArvalPhoto,hasPrivateAuctionLink} from './telegram.js';
import {storeRequest,storeFile} from './server-store.js';
import {applyVehicleTitle,publicVehicleTitle} from './vehicle-title.js';
import {applyVehicleFacts,vehicleFacts,productionLabel,vehicleDateLabel} from './vehicle-facts.js';
import {readPartslinkPdfs} from './partslink-pdf.js';
import {applyVehicleLocation} from './location.js';
import {applyEquipmentHighlights,equipmentHighlights,selectedEquipmentHighlights} from './equipment-highlights.js';

const $ = id => document.getElementById(id);
const tabId = Number(new URLSearchParams(location.search).get('tab'));
let packet;
let partslinkFiles=[];
let importedPartslinkFiles=[];
let partslinkSelectionVersion=0;
let inspectionFiles=[];
let sourceLocks=[];
const websiteEditor=createWebsiteEditor({key:()=>$('employee-key').value.trim(),onBusy:busy=>{
 if(busy){sourceLocks=['server-save','retry','post','import-partslink','send-draft'].map(id=>[$(id),$(id).disabled]);for(const[control]of sourceLocks)control.disabled=true;}
 else{for(const[control,disabled]of sourceLocks)control.disabled=disabled;sourceLocks=[];}
}});
function partslinkUnread(){return partslinkFiles.length!==importedPartslinkFiles.length||partslinkFiles.some((f,i)=>f!==importedPartslinkFiles[i]);}
function ensurePartslinkRead(){if(partslinkUnread())throw Error('Выбранный комплект PDF PartsLink ещё не прочитан. Нажмите «Прочитать PDF PartsLink» и дождитесь подтверждения. При ошибке новые данные не используются.');}
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

function renderSourceDetails(){
 const root=$('source-extra');root.replaceChildren();
 const section=(title,value)=>{const d=document.createElement('details'),h=document.createElement('summary'),p=document.createElement('p');h.textContent=title;p.className='source-detail';p.textContent=value||'Данные не найдены на открытой странице.';d.append(h,p);root.append(d);return d;};
 section('Повреждения · комментарии Arval',packet.condition.damages.map((d,i)=>`${i+1}. ${[d.part,d.nature,d.repair].filter(Boolean).join(' · ')}`).join('\n'));
 section('Сервисная история · исходные записи',packet.condition.maintenance_entries.map(e=>`${e.date_source} · ${e.mileage_km} км · ${e.description_source}`).join('\n'));
 section('Состояние шин · исходные данные',packet.condition.tyres_source);
 const docs=section('Links and documents · найденные отчёты','Ссылки сохраняются как исходные материалы. Скачанные PDF прикрепите ниже; можно несколько.');docs.classList.add('source-documents');
 for(const report of packet.documents){const a=document.createElement('a');a.textContent=report.label;a.href=report.url;a.target='_blank';a.rel='noopener noreferrer';docs.append(a,document.createElement('br'));}
}
async function readLot() {
  for(const id of ['retry','post','server-save'])$(id).disabled=true;
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
    if(previous?.vehicle?.vin&&previous.vehicle.vin!==packet?.vehicle?.vin){inspectionFiles=[];renderInspectionFiles();websiteEditor.reset();$('server-pdfs').value='';$('website-link').hidden=true;$('server-link').hidden=true;}
    if (!packet?.vehicle?.vin) throw new Error('Arval не вернул данные автомобиля.');
    if(chrome.storage?.local){const key='parts:'+packet.vehicle.vin;const stored=await chrome.storage.local.get(key);attachPartslink(packet,stored[key]);}
    if(previous?.vehicle?.vin===packet.vehicle.vin&&previous.enrichment?.partslink24_pdf)packet.enrichment={...(packet.enrichment||{}),partslink24_pdf:previous.enrichment.partslink24_pdf};
    else{partslinkFiles=[];importedPartslinkFiles=[];partslinkSelectionVersion++;$('partslink-pdf').value='';renderPartslinkFiles();}
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
      ['Количество ключей', packet.vehicle.keys==null?'Не указано':String(packet.vehicle.keys)],
      ['Мощность', [packet.vehicle.power_kw?packet.vehicle.power_kw+' кВт':'',packet.vehicle.power_hp?packet.vehicle.power_hp+' л. с.':''].filter(Boolean).join(' / ')||packet.vehicle.power_source||'Не указана'],
      ['Цвет (источник)', packet.vehicle.color||'Не указан'],
      ['Страна регистрационных документов', packet.vehicle.registration_country_source||'Не указана'],
      ['Полный привод', packet.vehicle.awd===true?'Да':packet.vehicle.awd===false?'Нет':packet.vehicle.drive_source||'Не указан'],
      ['НДС к вычету (Arval)', packet.vehicle.vat_deductible===true?'Да':packet.vehicle.vat_deductible===false?'Нет':packet.vehicle.vat_deductible_source||'Не указан'],
      ['Первая регистрация (Arval)', packet.vehicle.first_registration_source || 'Не распознана'],
      ['Текущая максимальная ставка', packet.auction.price.amount === null ? 'Не распознана' : `${packet.auction.price.amount.toLocaleString('ru')} ${packet.auction.price.currency} · нетто по правилу публикации`],
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
    renderSourceDetails();
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
  finally{$('retry').disabled=false;$('post').disabled=!ready;$('server-save').disabled=!ready;}
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
async function saveSourceAndPreview(){
 const result=$('server-result');const locked=['server-save','post','retry','send-draft','import-partslink'].map(id=>[$(id),$(id).disabled]);
 try{
  ensurePartslinkRead();ensureDeliveryValid();const key=$('employee-key').value.trim();if(!key)throw Error('Сначала подключите ключ сотрудника.');
  for(const{file}of pendingPdfs())if(file.size<=0||file.size>20*1024*1024||(!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf'))throw Error('Проверьте документы: нужны PDF до 20 МБ каждый.');
  if(!await chrome.permissions.request({origins:['https://serwer2454127.home.pl/*']}))throw Error('Нет разрешения на доступ к серверу.');
  for(const[button]of locked)button.disabled=true;$('progress').hidden=false;
  const saved=await saveServerPhotos(key,packet.photos,message=>result.textContent=message);
  if(saved.failed)throw Error('Черновик сохранён частично: не все фотографии загрузились. Повторите сохранение перед подготовкой превью.');
  for(const{file,kind}of pendingPdfs()){result.textContent=`Сохраняю ${file.name}…`;await storeFile(key,saved.id,file,{name:file.name,kind});}
  const created=await storeRequest(key,{action:'product_create',body:{id:saved.id}});
  $('server-link').href=`https://serwer2454127.home.pl/drafts/?id=${saved.id}`;$('server-link').hidden=false;
  $('website-link').href=`https://serwer2454127.home.pl/drafts/?id=${saved.id}#product-editor`;$('website-link').hidden=false;
  result.textContent='Данные, все найденные фотографии и документы сохранены. Открываю превью…';
  await websiteEditor.open(created.product);
  $('website-editor').scrollIntoView({behavior:'smooth',block:'start'});
  result.textContent='Данные и все найденные фотографии сохранены на сервере. Превью открыто ниже: внесите правки и выберите состояние. На сайте пока ничего не изменилось.';
 }catch(error){result.textContent=error.message;}finally{for(const[button,disabled]of locked)button.disabled=disabled;countCaption();}
}
$('server-save').addEventListener('click',saveSourceAndPreview);
const countCaption=()=>{
  const facts=packet?vehicleFacts(packet):null;const policy=facts?.publication||{ready:false,reasons:[]};
  const privateLink=hasPrivateAuctionLink($('caption').value);
  $('caption-count').textContent=`${$('caption').value.length} / 1024 знаков для подписи альбома`;
  $('publication-status').textContent=policy.ready?['Дата для объявления и тип двигателя определены по распознанным полям.',facts.date_notice,'Перед отправкой сверьте исходные данные.'].filter(Boolean).join(' '):policy.reasons.join(' ')+' Черновик можно сохранить на сервере; отправка поста пока отключена.';
  $('publication-status').className=policy.ready?'note':'warning';
  if(privateLink){$('publication-status').textContent+=' Удалите закрытую ссылку Arval из текста поста.';$('publication-status').className='warning';}
  let deliveryInvalid=false;try{ensureDeliveryValid();}catch{deliveryInvalid=true;}
  const unread=partslinkUnread();
  if(unread){$('publication-status').textContent+=' Выбран новый PDF PartsLink: сначала прочитайте его.';$('publication-status').className='warning';}
  $('send-draft').disabled=$('caption').value.length>1024||!policy.ready||privateLink||Boolean(unread)||deliveryInvalid;
};
function refreshPartslinkFacts(){
 if(!packet)return;applyVehicleFacts(packet);applyEquipmentHighlights(packet);const facts=packet.vehicle.publication_facts;
 $('production-fact').textContent=`${productionLabel(facts.production)}${facts.production?` · источник: ${facts.production.source}`:''}`;
 $('publication-date-fact').textContent=`${vehicleDateLabel(facts)}${facts.display_date?` · источник: ${facts.display_date.source}`:''}`;
 $('engine-fact').textContent=facts.engine.label;
 const equipment=packet.vehicle.equipment_highlights;$('equipment-fact').textContent=`${equipment.items.map(x=>x.label).join(', ')||'Нет распознанных значимых опций'} · источник: ${equipment.source}`;
 if(!$('telegram').hidden){renderEquipmentPicker();$('parts-status').textContent=partsStatus();$('caption').value=telegramCaption(packet,{includeReport:$('include-report').checked,buttons:true,includeMaintenance:$('include-service').checked});countCaption();}
}
function renderPartslinkFiles(){
 const list=$('partslink-file-list');list.replaceChildren();
 partslinkFiles.forEach((file,index)=>{
  const li=document.createElement('li');li.append(document.createTextNode(file.name+(importedPartslinkFiles.includes(file)?' · прочитан ':' · не прочитан ')));
  const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Убрать';remove.addEventListener('click',()=>{partslinkFiles.splice(index,1);partslinkSelectionVersion++;if(!partslinkFiles.length)clearPartslink();else{renderPartslinkFiles();$('partslink-import-status').textContent='Комплект изменён. Прочитайте оставшиеся файлы заново.';if(!$('telegram').hidden)countCaption();}});li.append(remove);list.append(li);
 });
}
function clearPartslink(){partslinkFiles=[];importedPartslinkFiles=[];partslinkSelectionVersion++;$('partslink-pdf').value='';if(packet?.enrichment)delete packet.enrichment.partslink24_pdf;renderPartslinkFiles();refreshPartslinkFacts();$('partslink-import-status').className='note';$('partslink-import-status').textContent='Комплект PDF очищен. Выберите один или несколько файлов PartsLink.';}
$('clear-partslink').addEventListener('click',clearPartslink);
$('partslink-pdf').addEventListener('change',()=>{
 for(const file of $('partslink-pdf').files)if(!partslinkFiles.some(f=>f.name===file.name&&f.size===file.size&&f.lastModified===file.lastModified))partslinkFiles.push(file);
 partslinkSelectionVersion++;$('partslink-pdf').value='';renderPartslinkFiles();const status=$('partslink-import-status');status.className='warning';status.textContent=`Выбрано файлов: ${partslinkFiles.length}. Нажмите «Прочитать PDF PartsLink»: все файлы будут проверены по VIN и объединены.`;
 if(!$('telegram').hidden)countCaption();
});
const pendingPdfs=()=>[...Array.from($('server-pdfs').files,file=>({file,kind:'document'})),...inspectionFiles.map(file=>({file,kind:'inspection'})),...importedPartslinkFiles.map(file=>({file,kind:'partslink'}))];
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
function renderInspectionFiles(){
 const list=$('inspection-file-list');list.replaceChildren();
 inspectionFiles.forEach((file,index)=>{const li=document.createElement('li');li.append(document.createTextNode(file.name+' '));const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Убрать';remove.addEventListener('click',()=>{inspectionFiles.splice(index,1);renderInspectionFiles();});li.append(remove);list.append(li);});
 $('inspection-upload-status').textContent=inspectionFiles.length?`Выбрано отчётов: ${inspectionFiles.length}. Можно добавить ещё. Все будут сохранены на сервере вместе с автомобилем.`:'Отчёты не выбраны. Можно прикрепить несколько PDF сразу или по очереди.';
}
$('inspection-pdfs').addEventListener('change',()=>{
 for(const file of $('inspection-pdfs').files)if(!inspectionFiles.some(f=>f.name===file.name&&f.size===file.size&&f.lastModified===file.lastModified))inspectionFiles.push(file);
 $('inspection-pdfs').value='';renderInspectionFiles();
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
    button.disabled=true;for(const [control]of locked)control.disabled=true;$('send-draft').disabled=true;const original=packet,version=partslinkSelectionVersion,files=[...partslinkFiles];status.className='';status.textContent='Читаю PDF на этом компьютере…';
    const parts=await readPartslinkPdfs(files,packet.vehicle.vin,p=>{status.textContent=`Читаю файл ${p.index} из ${p.total}: ${p.file_name}…`;});
    if(packet!==original||version!==partslinkSelectionVersion)throw Error('Лот или комплект файлов изменился во время разбора. Повторите импорт текущего комплекта.');
    packet.enrichment={...(packet.enrichment||{}),partslink24_pdf:parts};importedPartslinkFiles=files;refreshPartslinkFacts();renderPartslinkFiles();const facts=packet.vehicle.publication_facts;
    status.className='ok';status.textContent=`PDF прочитан: файлов ${files.length}, VIN каждого совпадает. ${vehicleDateLabel(facts)}. ${facts.date_notice} Распознано позиций комплектации: ${parts.equipment.length}. Данные объединены; все PDF будут приложены при сохранении на сервере.`;
  }catch(error){status.className='failed';status.textContent=error.message+(importedPartslinkFiles.length?' Ранее успешно импортированный комплект остаётся в черновике; сохранение с изменённым комплектом заблокировано до успешного чтения.':'');}
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
