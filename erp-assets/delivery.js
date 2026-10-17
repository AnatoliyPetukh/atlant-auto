// Employee-entered quote, independent of auction price and its tax basis.
export function parseDeliveryAmount(value){
  const text=String(value??'').trim().replace(/[ \u00a0\u202f]/g,'');
  if(!text)return null;
  if(!/^\d{1,7}(?:[.,]\d{1,2})?$/.test(text))throw Error('Доставка: введите сумму в EUR, например 850 или 850,50.');
  const [whole,fraction='']=text.replace(',','.').split('.');
  const minor=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(minor)||minor>100000000)throw Error('Доставка: проверьте сумму — допускается до 1 000 000 EUR.');
  return minor;
}
export function deliveryLabel(packet){
  const quote=packet.logistics?.delivery_to_warsaw;
  if(!quote||quote.currency!=='EUR'||!Number.isSafeInteger(quote.amount_minor)||quote.amount_minor<0||quote.amount_minor>100000000)return null;
  return `🚚 Доставка до Варшавы: ${(quote.amount_minor/100).toLocaleString('ru',{maximumFractionDigits:2})} EUR`;
}
