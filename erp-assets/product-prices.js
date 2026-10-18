// ERP Warsaw sale prices: gross = net + 23%, rounded to whole cents.
export function grossFromNet(value){
 const text=String(value??'').replace(/[\s\u00a0\u202f]/g,'').replace(',','.');
 if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(text))return null;
 const [whole,fraction='']=text.split('.');const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 return (Math.floor((cents*123+50)/100)/100).toFixed(2);
}
if(typeof document!=='undefined'){
 const net=document.querySelector('#product-editor input[name="price_net"]');
 const gross=document.querySelector('#product-editor input[name="price_gross"]');
 if(net&&gross){
  net.addEventListener('input',()=>{gross.value=grossFromNet(net.value)??'';});
  net.addEventListener('change',()=>{if(grossFromNet(net.value)!==null)net.value=net.value.replace(/[\s\u00a0\u202f]/g,'').replace(',','.');});
 }
}
