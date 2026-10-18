import {arrivalLabel} from './arrival-window.js?v=20261018-1';
export function weekWindow(value){
 if(!/^\d{4}-W\d{2}$/.test(value||''))return null;
 const [year,week]=value.split('-W').map(Number);if(year<1||week<1||week>53)return null;
 const jan4=new Date(0);jan4.setUTCFullYear(year,0,4);jan4.setUTCHours(0,0,0,0);
 const from=new Date(+jan4+((week-1)*7-((jan4.getUTCDay()+6)%7))*86400000),thursday=new Date(+from+3*86400000);
 if(thursday.getUTCFullYear()!==year)return null;
 return {eta_from:from.toISOString().slice(0,10),eta_to:new Date(+from+6*86400000).toISOString().slice(0,10)};
}
export function weekForDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';
 const date=new Date(value+'T00:00:00Z');if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)return '';
 date.setUTCDate(date.getUTCDate()+3-((date.getUTCDay()+6)%7));
 const year=date.getUTCFullYear(),jan4=new Date(0);jan4.setUTCFullYear(year,0,4);jan4.setUTCHours(0,0,0,0);
 const firstMonday=+jan4-((jan4.getUTCDay()+6)%7)*86400000;
 return `${String(year).padStart(4,'0')}-W${String(Math.floor((+date-firstMonday)/604800000)+1).padStart(2,'0')}`;
}
if(typeof document!=='undefined'){
 const week=document.getElementById('arrival-week'),from=document.querySelector('#product-editor [name="eta_from"]'),to=document.querySelector('#product-editor [name="eta_to"]'),summary=document.getElementById('arrival-summary');
 if(week&&from&&to&&summary){
  const candidate=weekForDate(from.value),range=weekWindow(candidate);
  if(range&&range.eta_from===from.value&&range.eta_to===to.value)week.value=candidate;
  const updateSummary=()=>{const label=arrivalLabel({eta_from:from.value,eta_to:to.value},'ru-RU');summary.textContent=label?'Ожидаемое прибытие: '+label:'Выберите неделю: понедельник–воскресенье.';};
  week.addEventListener('input',()=>{const range=weekWindow(week.value);if(week.value&&!range){week.setCustomValidity('Выберите корректную неделю.');return;}week.setCustomValidity('');from.value=range?.eta_from||'';to.value=range?.eta_to||'';updateSummary();});updateSummary();
 }
}
