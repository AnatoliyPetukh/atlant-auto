// Preserve date meaning: production and first registration remain separate facts.
const clean=value=>String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim();
export function productionDate(value) {
  const raw=clean(value);let year,month,day;
  let m=raw.match(/^(\d{4})(?:[-./](\d{1,2})(?:[-./](\d{1,2}))?)?$/);
  if(m)[,year,month,day]=m;
  else if((m=raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)))[,day,month,year]=m;
  else if((m=raw.match(/^(\d{1,2})[./-](\d{4})$/)))[,month,year]=m;
  if(!year||+year<1900||+year>new Date().getUTCFullYear()+1)return null;
  if(month&&(+month<1||+month>12))return null;
  if(day&&(+day<1||+day>new Date(Date.UTC(+year,+month,0)).getUTCDate()))return null;
  return {value:[year,month?.padStart(2,'0'),day?.padStart(2,'0')].filter(Boolean).join('-'),precision:day?'day':month?'month':'year',source_value:raw};
}
export function registrationDate(value) {
  const raw=clean(value);const months={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  const match=raw.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[- ](\d{2}|\d{4})$/i);
  let date;
  if(match){const n=Number(match[2]);const year=match[2].length===4?n:n>=80?1900+n:2000+n;date=productionDate(`${year}-${months[match[1].toLowerCase()]}`);}
  else date=productionDate(raw);
  if(!date||Number(date.value.slice(0,4))>new Date().getUTCFullYear())return null;
  return {...date,source_value:raw,source:'Arval',kind:'first_registration'};
}
export function vehicleFacts(packet) {
  const v=packet.vehicle;
  const production=[];const engine=[];
  const partsChecked=Boolean(packet.enrichment?.partslink24||packet.enrichment?.partslink24_pdf);
  for(const [source,entry] of [['PartsLink',packet.enrichment?.partslink24],['PartsLink PDF',packet.enrichment?.partslink24_pdf]]) for(const [label,value] of Object.entries(entry?.fields||{})) {
    const key=clean(label).replace(/:$/,'');
    if(/^(?:дата (?:выпуска|производства|изготовления)|год (?:выпуска|производства)|production date|date of (?:production|manufacture)|build date|manufactur(?:e|ing) date|produktionsdatum|baudatum|дата пр-ва)$/i.test(key))production.push({label,source,...(productionDate(value)||{value:null,source_value:clean(value)})});
    // Owner's business rule: Mercedes PartsLink delivery date is used as production.
    // Keep its original field name/value and explicit mapping provenance.
    const mercedes=/^mercedes(?:[- ]?benz)?$/i.test(clean(v.make))||entry?.template==='mercedes-columns-ru';
    if(mercedes&&/^(?:Дата поставки|Delivery date|Date of delivery|Lieferdatum)$/i.test(key))production.push({label,source,mapping_rule:'mercedes_delivery_as_production',...(productionDate(value)||{value:null,source_value:clean(value)})});
    if(/^(?:тип (?:двигателя|топлива|привода)|топливо|двигатель|fuel(?: type)?|engine(?: type)?|powertrain|antrieb|kraftstoff|motor)$/i.test(key))engine.push(`${label}: ${clean(value)}`);
  }
  const present=production.filter(x=>!/^\s*(?:[-—–]|n\/?a|unknown|not available|not specified|not provided|нет данных|не указан[ао]?|неизвестн[ао]?|отсутствует)?\s*$/i.test(x.source_value));
  const valid=present.filter(x=>x.value);const dateConflict=present.some(x=>!x.value)||valid.some(a=>valid.some(b=>!a.value.startsWith(b.value)&&!b.value.startsWith(a.value)));
  const partsDate=!dateConflict?[...valid].sort((a,b)=>b.value.length-a.value.length)[0]:null;
  const fallback=productionDate(v.production_year);
  // A checked catalog with no production date uses registration, clearly labelled.
  // Invalid/conflicting nonempty dates must never be hidden by this fallback.
  const date=partsChecked?(partsDate?{...partsDate,kind:'production'}:null):(fallback?{...fallback,source:packet.source?.auction==='bca'?'BCA':'Arval',kind:'production'}:null);
  const registration=registrationDate(v.first_registration_source);if(registration)registration.source=packet.source?.auction==='bca'?'BCA':'Arval';
  const registrationFallback=partsChecked&&present.length===0;
  const displayDate=date||(registrationFallback?registration:null);
  const dateNotice=registrationFallback?'В PartsLink дата производства не указана. Для объявления используется первая регистрация с аукциона.':'';
  const evidence=[clean(v.title),clean(v.fuel),...engine].join(' | ');
  const mild=/\b(?:MHEV|mild[- ]?hybrid)\b|мягк\S* гибрид/i.test(evidence);
  const plug=/\b(?:PHEV|plug[- ]?in|hybride rechargeable)\b|подзаряжаем\S* гибрид/i.test(evidence);
  const full=/\b(?:HEV|FHEV|full[- ]?hybrid|strong[- ]?hybrid)\b|полн\S* гибрид/i.test(evidence);
  const hybrid=mild||plug||full||/\bhybrid[e]?\b|гибрид/i.test(evidence);
  const conflicting=[mild,plug,full].filter(Boolean).length>1;
  const kind=conflicting?'conflict':plug?'plug_in':full?'full':mild?'mild':hybrid?'unknown':null;
  const petrol=/\b(?:petrol|gasoline|essence|T[- ]?GDi|GDi)\b|бензин/i.test(evidence);
  const diesel=/\b(?:diesel|CRDi)\b|дизель/i.test(evidence);
  const fuel=petrol===diesel?null:petrol?'бензин':'дизель';
  let engineLabel=hybrid?`${{mild:'мягкий гибрид',full:'полный гибрид',plug_in:'подзаряжаемый гибрид',unknown:'гибрид — тип уточняется',conflict:'гибрид — противоречивые данные'}[kind]}${fuel?` (${fuel})`:' — топливо уточняется'}`:fuel||(/\belectric\b|электр/i.test(evidence)?'электро':'тип двигателя уточняется');
  const reasons=[];
  if(!displayDate)reasons.push(dateConflict?'Дата производства в PartsLink не распознана или противоречива. Требуется проверка.':registrationFallback?'В PartsLink нет даты производства, а первая регистрация с аукциона не распознана.':'Дата производства не подтверждена. Загрузите PartsLink для проверки даты и возможного использования первой регистрации Arval.');
  if(kind==='full'||kind==='plug_in')reasons.push('По правилу компании полный и подзаряжаемый гибрид не готовится для публикации в канал.');
  else if(hybrid&&(kind!=='mild'||!fuel))reasons.push('Перед публикацией подтвердите тип гибрида и топливо по источнику.');
  return {production:date,production_candidates:production,first_registration:registration,display_date:displayDate,date_notice:dateNotice,partslink_date_checked:partsChecked,engine:{hybrid_type:kind,fuel,label:engineLabel,evidence},publication:{ready:reasons.length===0,reasons}};
}
export function vehicleDateLabel(facts){
  const date=facts.display_date;
  if(!date)return 'дата уточняется';
  if(date.kind!=='first_registration')return productionLabel(date);
  const parts=date.value.split('-');return `${parts.reverse().join('.')} · первая регистрация`;
}
export function productionLabel(date) {
  if(!date)return 'дата выпуска уточняется';
  const parts=date.value.split('-');return parts.length===3?`${parts[2]}.${parts[1]}.${parts[0]} г.в.`:parts.length===2?`${parts[1]}.${parts[0]} г.в.`:`${parts[0]} г.в.`;
}
export function applyVehicleFacts(packet) {packet.vehicle.publication_facts=vehicleFacts(packet);return packet;}
