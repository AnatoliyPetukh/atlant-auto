// Metric horsepower (л. с. / KM / PS), rounded to the nearest whole number.
export function horsepowerFromKw(value){
 const text=String(value??'').trim().replace(',','.');
 if(!/^\d+(?:\.\d+)?$/.test(text))return null;
 const kw=Number(text);return kw>0&&kw<=5000?String(Math.round(kw/0.73549875)):null;
}
if(typeof document!=='undefined'){
 const kw=document.querySelector('#product-editor [name="power_kw"]'),hp=document.querySelector('#product-editor [name="power_hp"]');
 if(kw&&hp){
  kw.inputMode='decimal';hp.inputMode='numeric';
  kw.addEventListener('input',()=>{hp.value=horsepowerFromKw(kw.value)??'';});
  if(!hp.value.trim())hp.value=horsepowerFromKw(kw.value)??'';
 }
}
