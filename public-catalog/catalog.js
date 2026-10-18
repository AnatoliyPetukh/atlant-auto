import {arrivalLabel} from './arrival-window.js?v=20261018-1';
const API='https://serwer2454127.home.pl/offers/';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=String(text);if(cls)e.className=cls;return e;};
const validId=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
const asset=(car,id)=>API+'?id='+encodeURIComponent(car.id)+'&asset='+encodeURIComponent(id);
const money=(n,c)=>Number.isFinite(n)?new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2}).format(n)+' '+c:'Cena na zapytanie';
let cars=[],state='all',tax='net';
// Catalogue-only framing. Original photos remain unchanged in the vehicle gallery.
const coverFraming={'b52f6ef89d984b4f8c070c79a90461f0':{scale:1.38,origin:'52% 65%'}};
function compactSpecs(car){const node=el('p',null,'spec');const year=String(car.production_date||car.first_registration||'').slice(0,4);const mileage=Number.isFinite(car.mileage_km)?new Intl.NumberFormat('pl-PL').format(car.mileage_km)+' km':null;node.append(el('span',[year?(year+(car.production_date?' · prod.':' · rej.')):null,mileage].filter(Boolean).join(' · ')),el('span',[car.fuel_pl,car.transmission_pl].filter(Boolean).join(' · ')));node.title=specification(car);return node;}

function date(value){if(!value)return null;const parts=String(value).split('-');return parts.reverse().join('.');}
function price(car,mode=tax){
 if(car.state==='auction')return {value:money(car.auction_bid,car.auction_currency||'EUR'),label:({starting_price:'Cena wywoławcza',buy_now:'Cena kup teraz',unknown:'Cena z aukcji'}[car.auction_price_kind]||'Najwyższa oferta na aukcji')+' · '+(car.auction_tax_basis==='gross'?'brutto':car.auction_tax_basis==='unknown'?'VAT do potwierdzenia':'netto')};
 return {value:money(mode==='net'?car.price_net:car.price_gross,car.currency),label:(mode==='net'?'Netto':'Brutto')+' · samochód w Warszawie'};
}
function inquiry(car){const sold=car.state==='sold'||car.availability==='reserved';const a=el('a',sold?'Znajdź podobny':car.state==='auction'?'Zapytaj o zakup':'Zapytaj o rezerwację','cta');a.href='mailto:biuro@atlantauto.pl?subject='+encodeURIComponent((sold?'Szukam podobnego: ':'Zapytanie: ')+car.title)+'&body='+encodeURIComponent('Oferta: '+location.origin+location.pathname+'?id='+car.id);return a;}
function toggle(car,host,onChange){
 const wrapper=el('div',null,'tax');for(const [key,label]of[['net','Netto'],['gross','Brutto']]){const b=el('button',label,key===tax?'active':'');b.type='button';b.addEventListener('click',()=>{for(const node of wrapper.children)node.classList.remove('active');b.classList.add('active');onChange(key);});wrapper.append(b);}host.append(wrapper);
}
function badge(car){return el('span',car.state==='sold'?'Sprzedany':car.availability==='reserved'?'Zarezerwowany · dla klienta':car.state_label,'badge'+(car.availability==='reserved'?' reserved':''));}
function specification(car){return [car.production_date?date(car.production_date)+' · produkcja':car.first_registration?date(car.first_registration)+' · pierwsza rejestracja':null,car.mileage_km===null?null:new Intl.NumberFormat('pl-PL').format(car.mileage_km)+' km',car.fuel_pl,car.transmission_pl].filter(Boolean).join(' · ');}
function clock(car){
 const target=Date.parse(car.auction_end_estimate||'');if(car.state!=='auction'||!Number.isFinite(target))return null;
 const node=el('p',null,'muted clock');node.dataset.deadline=String(target);node.title='Termin według ostatniego odczytu aukcji; może ulec zmianie.';return node;
}
function updateClocks(){for(const node of document.querySelectorAll('[data-deadline]')){const minutes=Math.ceil((Number(node.dataset.deadline)-Date.now())/60000);node.textContent=minutes<=0?'Termin z odczytu minął — zapytaj o aktualny status.':'⏳ Do końca według odczytu: '+(minutes>=60?Math.floor(minutes/60)+' godz. ':'')+(minutes%60)+' min';}}
setInterval(updateClocks,30000);
function cards(){
 $('catalog').replaceChildren();const list=cars.filter(c=>state==='all'||(state==='in_transit'?['in_transit','purchased'].includes(c.state):c.state===state));
 const order={in_transit:0,purchased:0,on_site:1,auction:2,sold:3};list.sort((a,b)=>(order[a.state]??9)-(order[b.state]??9)||(a.availability==='reserved')-(b.availability==='reserved'));
 $('status').textContent=list.length?list.length+' '+(list.length===1?'oferta':list.length%100<12||list.length%100>14?[2,3,4].includes(list.length%10)?'oferty':'ofert':'ofert'):'Brak opublikowanych ofert w tej kategorii. Skontaktuj się z nami — pomożemy znaleźć samochód.';
 for(const car of list){
  const card=el('article',null,'card');const link=el('a',null,'view');link.href='?id='+car.id;
  if(car.photo_ids?.length){const img=el('img');img.className='cover';img.src=asset(car,car.photo_ids[0]);img.alt=car.title;img.loading='lazy';const framing=coverFraming[car.id];if(framing){img.style.setProperty('--cover-scale',framing.scale);img.style.setProperty('--cover-origin',framing.origin);}link.append(img);}
  const body=el('div',null,'card-body');const heading=el('h2');const name=el('a',car.title,'view');name.href=link.href;heading.append(name);body.append(badge(car),heading,compactSpecs(car));
  if(arrivalLabel(car))body.append(el('p','Planowane przybycie: '+arrivalLabel(car),'muted'));
  const value=el('p',price(car).value,'price'),label=el('p',price(car).label,'price-label');body.append(value,label);card.append(link,body);
  if(car.state!=='auction')toggle(car,body,mode=>{value.textContent=price(car,mode).value;label.textContent=price(car,mode).label;});
  if(car.state==='auction')body.append(el('p','Odczyt aukcji · cena zakupu do ustalenia.','card-note'));
  const timer=clock(car);if(timer)body.append(timer);body.append(el('div',null,'card-spacer'),inquiry(car));$('catalog').append(card);
 }
 updateClocks();
}
function detail(car){
 $('intro').hidden=true;$('filters').hidden=true;$('catalog').hidden=true;$('status').hidden=true;const host=$('detail');host.hidden=false;host.replaceChildren();
 const back=el('a','← Wszystkie oferty','back');back.href=location.pathname;host.append(back);
 const grid=el('div',null,'detail-grid'),gallery=el('div',null,'gallery'),panel=el('div',null,'panel');
 if(car.photo_ids.length){const image=el('img');image.src=asset(car,car.photo_ids[0]);image.alt=car.title;gallery.append(image);const thumbs=el('div',null,'thumbs');for(const id of car.photo_ids){const b=el('button');b.type='button';const thumb=el('img');thumb.src=asset(car,id);thumb.alt=car.title;thumb.loading='lazy';b.append(thumb);b.addEventListener('click',()=>image.src=asset(car,id));thumbs.append(b);}gallery.append(thumbs);}
 panel.append(badge(car),el('h1',car.title));const amount=el('p',price(car).value,'price'),label=el('p',price(car).label,'price-label');panel.append(amount,label);
 if(car.state!=='auction')toggle(car,panel,mode=>{amount.textContent=price(car,mode).value;label.textContent=price(car,mode).label;});
 const specs=el('dl');for(const[name,value]of[['Data produkcji',date(car.production_date)],['Pierwsza rejestracja',date(car.first_registration)],['Przebieg',car.mileage_km===null?null:new Intl.NumberFormat('pl-PL').format(car.mileage_km)+' km'],['Paliwo',car.fuel_pl],['Skrzynia biegów',car.transmission_pl],['Pojemność',car.engine_cm3?car.engine_cm3+' cm³':null],['Liczba kluczyków',car.keys??null],['Moc', [car.power_kw?car.power_kw+' kW':null,car.power_hp?car.power_hp+' KM':null].filter(Boolean).join(' / ')||null],['Kolor',car.color_pl||null],['Kraj dokumentów rejestracyjnych',car.registration_country_pl||null],['Napęd na cztery koła',car.awd===true?'Tak':car.awd===false?'Nie':null],['VAT do odliczenia',car.vat_deductible===true?'Tak':car.vat_deductible===false?'Nie':null],['Lokalizacja',car.location_pl],['Dostawa do Warszawy',car.delivery_eur===null?null:money(car.delivery_eur,'EUR')],['Planowane przybycie',arrivalLabel(car)]])if(value!==null&&value!==''){specs.append(el('dt',name),el('dd',value));}panel.append(specs);
 if(car.state==='auction')panel.append(el('p','Oferta z ostatniego odczytu aukcji; nie jest to końcowa cena zakupu.','muted'));else panel.append(el('p','Cena samochodu przygotowanego w Warszawie. Rejestracja i dodatkowe dokumenty wymagają osobnej wyceny.','muted'));
 const timer=clock(car);if(timer)panel.append(timer);panel.append(inquiry(car));const tel=el('a','Zadzwoń: +48 515 392 420','back');tel.href='tel:+48515392420';panel.append(el('br'),tel);grid.append(gallery,panel);host.append(grid);
 const info=el('section',null,'panel');info.style.marginTop='24px';info.append(el('h2','Opis samochodu'),el('p',car.description_pl,'description'));
 if(car.equipment_pl.length){info.append(el('h2','Wyposażenie'));const list=el('ul',null,'equipment');for(const option of car.equipment_pl)list.append(el('li',option));info.append(list);}
 if(car.tyres_pl)info.append(el('h2','Opony'),el('p',car.tyres_pl));
 if(Number.isInteger(car.damage_count))info.append(el('p','Uwagi w inspekcji: '+car.damage_count+'. Szczegóły potwierdzimy przed zakupem.'));
 if(car.service_count){info.append(el('h2','Historia serwisowa'),el('p','Liczba zapisów w źródle: '+car.service_count+'.'+(car.service_last_date?' Ostatni zapis: '+date(car.service_last_date)+(car.service_last_mileage!=null?' · '+new Intl.NumberFormat('pl-PL').format(car.service_last_mileage)+' km':'')+'.':'')));}
 if(car.document_ids.length){info.append(el('h2','Dokumenty'));const docs=el('div',null,'docs');car.document_ids.forEach((id,i)=>{const a=el('a','Dokument '+(i+1)+' (PDF)');a.href=asset(car,id);a.target='_blank';a.rel='noopener';docs.append(a);});info.append(docs);}host.append(info);
 document.title=car.title+' | Atlant Auto';updateClocks();
}
for(const b of document.querySelectorAll('[data-state]'))b.addEventListener('click',()=>{if(!$('detail').hidden)return;state=b.dataset.state;for(const x of document.querySelectorAll('[data-state]'))x.classList.toggle('active',x===b);cards();});
for(const b of document.querySelectorAll('[data-tax]'))b.addEventListener('click',()=>{if(!$('detail').hidden)return;tax=b.dataset.tax;for(const x of document.querySelectorAll('[data-tax]'))x.classList.toggle('active',x===b);cards();});
try{
 const id=new URLSearchParams(location.search).get('id');if(id&&!validId(id))throw Error('Nieprawidłowy adres oferty.');
 const response=await fetch(API+'?format=json'+(id?'&id='+id:''),{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('Katalog jest chwilowo niedostępny. Spróbuj ponownie lub skontaktuj się z nami.');
 const data=await response.json();cars=(data.cars||[]).filter(c=>validId(c.id));if(id){if(!cars.length)throw Error('Ta oferta nie jest obecnie opublikowana. Skontaktuj się z nami, aby zapytać o podobny samochód.');detail(cars[0]);}else cards();
}catch(error){$('status').textContent=error.message;}
