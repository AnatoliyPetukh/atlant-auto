import {arrivalLabel} from './arrival-window.js?v=20261018-1';
import {telegramCaption,hasPrivateAuctionLink} from './telegram.js';
import {vehicleFacts} from './vehicle-facts.js';
import {equipmentHighlights,selectedEquipmentHighlights} from './equipment-highlights.js';
export function erpCaption(packet,record,includeMaintenance=true){
 const source=structuredClone(packet);source.condition??={damages:[],maintenance_entries:[]};source.condition.damages??=[];source.documents??=[];source.auction??={price:{amount:null}};
 let text=telegramCaption(source,{buttons:true,includeMaintenance});
 if(!record||record.state==='auction')return text;
 const titles={in_transit:'🚘 В пути в Варшаву',purchased:'🚘 Куплен · ожидает отправки',on_site:'🚘 На площадке в Варшаве',sold:'🚘 Продано',closed:'🚘 Торги завершены'};
 const lines=text.split('\n').filter(x=>!x.startsWith('💶 ')&&!x.startsWith('Ставка на момент')&&!x.startsWith('📍 ')&&!x.startsWith('🚚 Доставка'));
 lines[0]=titles[record.state]||'🚘 Автомобиль';
 if(record.availability==='reserved'&&record.state!=='sold')lines.splice(1,0,'Зарезервирован под клиента');
 const price=record.price_net??record.price_gross;
 if(price!=null&&record.state!=='sold')lines.push('',`💶 Готовый автомобиль в Варшаве: ${new Intl.NumberFormat('ru').format(price)} ${record.currency} · ${record.price_net!=null?'нетто':'брутто'}`);
 const arrival=arrivalLabel(record,'ru-RU');if(arrival&&['in_transit','purchased'].includes(record.state))lines.push('',`🚚 Ожидаемое прибытие: ${arrival}`);
 lines.push('',record.state==='in_transit'?'📍 В пути в Варшаву':'📍 Варшава');
 return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
const root=typeof document==='undefined'?null:document.getElementById('erp-post-data');
if(root){
 const {packet,record}=JSON.parse(root.textContent),form=document.getElementById('erp-telegram-form'),caption=document.getElementById('erp-caption'),status=document.getElementById('erp-post-status'),send=document.getElementById('erp-send');
 const options=equipmentHighlights(packet,15),selected=new Set(selectedEquipmentHighlights(packet).items.map(x=>x.id));
 for(const item of options.items){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=item.id;input.checked=selected.has(item.id);label.append(input,document.createTextNode(' '+item.label));document.getElementById('erp-equipment').append(label);}
 const policy=vehicleFacts(packet).publication;
 function check(){const n=[...form.querySelectorAll('[name="photo_ids[]"]:checked')].length,len=[...caption.value].length;const reasons=[];if(!policy.ready)reasons.push(...policy.reasons);if(!len||len>1024)reasons.push('Текст должен содержать 1–1024 знака.');if(n<2||n>10)reasons.push('Выберите 2–10 фотографий.');if(hasPrivateAuctionLink(caption.value))reasons.push('Уберите закрытую ссылку Arval.');send.disabled=reasons.length>0;status.textContent=`${len}/1024 знаков · ${n} фото. `+reasons.join(' ');}
 function rebuild(){packet.vehicle.equipment_selection=[...document.querySelectorAll('#erp-equipment input:checked')].map(x=>x.value);caption.value=erpCaption(packet,record,document.getElementById('share-maintenance').checked);check();}
 document.getElementById('erp-rebuild').addEventListener('click',rebuild);form.addEventListener('input',check);form.addEventListener('change',check);form.addEventListener('submit',event=>{check();if(send.disabled){event.preventDefault();return;}send.disabled=true;status.textContent='Отправляю через сервер. Дождитесь результата…';});
 rebuild();
}
