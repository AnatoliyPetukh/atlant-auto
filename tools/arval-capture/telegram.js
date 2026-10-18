import {deliveryLabel} from './delivery.js';
import {publicVehicleTitle} from './vehicle-title.js';
import {vehicleFacts,vehicleDateLabel} from './vehicle-facts.js';
import {resolveLocation} from './location.js';
import {selectedEquipmentHighlights} from './equipment-highlights.js';
export const hasPrivateAuctionLink=caption=>/(?:remktg\.arval\.com|(?:www\.)?bca\.com\/sales)/i.test(String(caption));
const russianMonth=value=>String(value||'').replace(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})$/i,(_,month,year)=>`${({jan:'январь',feb:'февраль',mar:'март',apr:'апрель',may:'май',jun:'июнь',jul:'июль',aug:'август',sep:'сентябрь',oct:'октябрь',nov:'ноябрь',dec:'декабрь'})[month.toLowerCase()]} 20${year}`);
export function telegramCaption(packet,{includeReport=true,buttons=false,includeMaintenance=true}={}) {
  const v=packet.vehicle;
  const facts=vehicleFacts(packet);
  const dateLabel=vehicleDateLabel(facts).replace(/^(.+) · первая регистрация$/,'Первая регистрация: $1');
  const engine=[facts.engine.label,({Manual:'механика',Automatic:'автомат'})[v.transmission]||v.transmission].filter(Boolean).join(' · ');
  const auctionName=packet.source?.auction==='bca'?'BCA':'Arval';
  const lines=[`🚘 На аукционе ${auctionName}`,'',publicVehicleTitle(v),'',dateLabel,v.mileage_km==null?null:`Пробег: ${v.mileage_km.toLocaleString('ru')} км`,engine];
  const price=packet.auction.price;
  // Owner's Arval publication convention: unknown auction tax basis is displayed as net.
  // Keep the raw source unchanged and never relabel an explicit gross amount as net.
  if(price.amount!==null&&price.currency) lines.push('',`💶 ${price.kind==='highest_bid'?'Текущая максимальная ставка':price.kind==='starting_price'?'Начальная цена':'Цена лота'}: ${price.amount.toLocaleString('ru')} ${price.currency} · ${price.tax_basis==='gross'?'брутто':price.tax_basis==='net'||auctionName==='Arval'?'нетто':'нетто/брутто уточняется'}`);
  if(price.kind==='highest_bid') lines.push('Ставка на момент подготовки; это не итоговая стоимость автомобиля.');
  if(v.storage_location)lines.push('',`📍 ${resolveLocation(v.storage_location).label.replace('Центр — Долина Луары','Центр')}`);
  const delivery=deliveryLabel(packet);if(delivery)lines.push(delivery);
  const highlights=selectedEquipmentHighlights(packet).items.map(x=>x.label);
  if(highlights.length)lines.push('','В комплектации:',...highlights.map(label=>`• ${label}`));
  if(packet.condition.damages.length)lines.push('',`Состояние: ${packet.condition.damages.length} замечаний.`);
  if(packet.condition.previous_major_accident_damage===true)lines.push('', 'BCA: указаны предыдущие серьёзные аварийные повреждения. См. инспекцию.');
  const maintenance=packet.condition.maintenance_entries||[];
  const declared=packet.condition.maintenance_count;
  if(includeMaintenance&&maintenance.length){
    const complete=declared==null||declared===maintenance.length;
    const latest=complete?[...maintenance].filter(x=>x.date_month).sort((a,b)=>b.date_month.localeCompare(a.date_month))[0]:null;
    lines.push('',`Сервисная история ${auctionName}: ${maintenance.length} записей${!complete?` из ${declared} указанных`:''}${latest?`; последняя запись — ${russianMonth(latest.date_source)}, ${latest.mileage_km.toLocaleString('ru')} км`:''}.`);
  }
  const report=packet.documents.find(x=>x.kind==='macadam_report');
  if(includeReport&&report&&!buttons)lines.push(`Инспекция: ${report.url}`);
  // Avoid silently truncating links or promoting uncertain fields.
  return lines.filter(x=>x!==null&&x!==undefined).join('\n');
}

// Runs in the original Arval tab, using its ordinary authenticated session.
export async function readArvalPhoto(url, vin) {
  if(location.hostname!=='remktg.arval.com')throw Error('Открытая вкладка больше не является Arval.');
  const u=new URL(url);
  if(u.protocol!=='https:'||u.hostname!==location.hostname||!u.pathname.includes('/pictures/cars/')||!u.pathname.includes(vin))throw Error('Фотография не принадлежит этому лоту.');
  const response=await fetch(u.href,{method:'GET',credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Arval не отдал фотографию.');
  const blob=await response.blob();
  if(!['image/jpeg','image/png'].includes(blob.type)||blob.size>8*1024*1024||blob.size===0)throw Error('Формат или размер фотографии не поддерживается.');
  return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Не удалось прочитать фотографию'));reader.readAsDataURL(blob);});
}
