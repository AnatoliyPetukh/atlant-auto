import {arrivalLabel} from './arrival-window.js?v=20261018-1';
const from=document.querySelector('#product-editor [name="eta_from"]'),to=document.querySelector('#product-editor [name="eta_to"]'),summary=document.getElementById('arrival-summary');
if(from&&to&&summary){
 const update=()=>{to.min=from.value;const label=arrivalLabel({eta_from:from.value,eta_to:to.value},'ru-RU');summary.textContent=label?'Ожидаемое прибытие: '+label:from.value||to.value?'Проверьте начало и конец периода.':'Укажите ожидаемый период прибытия.';};
 from.addEventListener('input',update);to.addEventListener('input',update);update();
}
