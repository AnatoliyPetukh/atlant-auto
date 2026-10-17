// Ranked, evidence-based candidates for the sales post; the complete source list is retained.
const clean=value=>String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const rules=[
  ['areaView','camera',101,'камеры Area View',/\barea view\b/i],
  ['camera360','camera',100,'камеры 360°',/(?:камер\S*|camera\S*).{0,25}360|360.{0,25}(?:камер|camera)|surround view|кругов\S* обзор|rundumsicht/i],
  ['adaptiveCruise','cruise',98,'адаптивный круиз-контроль',/адаптивн\S* круиз|активн\S* круиз|adaptive cruise|active cruise|abstandsregel|régulateur.*adaptatif/i],
  ['panorama','roof',96,'панорамная крыша',/панорамн\S* (?:крыш|люк)|panoramic (?:glass )?(?:roof|sunroof)|panorama (?:glass )?roof|panoramadach|toit panoramique/i],
  ['awd','drive',95,'полный привод',/^полный привод$|\ball[- ]wheel drive\b|\ballradantrieb\b/i],
  ['matrix','lights',94,'матричные фары',/матричн\S* фар|matrix[- ]?(?:led|head|licht)|matrix beam/i],
  ['adaptiveLed','lights',92,'адаптивные LED-фары',/adaptive led|адаптивн\S* (?:led|светодиодн)|adaptives led/i],
  ['hud','hud',90,'проекционный дисплей',/head[- ]?up display|проекционн\S* дисплей|проекци\S* на лобов/i],
  ['ventilation','ventilation',88,'вентиляция сидений',/вентиляци\S* (?:передн\S* )?сидений|ventilat\S* (?:front )?seats|sitzbelüftung/i],
  ['memory','memory',86,'электросиденье с памятью',/(?:электр\S*|эл\.)[^.]*сиден[^.]*памят|сиден.{0,45}электроприв.{0,35}памят|(?:electric|power)[^.]*seat[^.]*memory|seat[^.]*power[^.]*memory|sitzverstellung[^.]*memory/i],
  ['cameraRear','camera',84,'камера заднего вида',/камера заднего вида|видеокамера заднего хода|rear[- ]?view camera|revers(?:e|ing) camera|rückfahrkamera|caméra de recul/i],
  ['heatedSeats','heatedSeats',82,'подогрев сидений',/подогрев\S* (?:передн\S* )?сидений|подогрев сиденья водителя и переднего пассажира|обогрев\S* (?:передн\S* )?сидений|heated (?:front )?seats|seat heating|sitzheizung|sièges chauffants/i],
  ['heatedWheel','heatedWheel',80,'подогрев руля',/подогрев\S* руля|обогрев\S* руля|обогреваем.{0,35}рул|heated steering wheel|steering wheel heating|lenkradheizung|volant chauffant/i],
  ['blindSpot','blindSpot',78,'контроль слепых зон',/слепых зон|м[её]ртвых зон|blind[- ]?spot|totwinkel|angle mort/i],
  ['tailgate','tailgate',76,'электропривод багажника',/электропривод багажника|автоматическ\S* привод (?:двери )?багаж|electric (?:boot|tailgate|hatchback)|power tailgate|automatic tailgate|automatische heckklappen|hayon électrique/i],
  ['led','lights',74,'LED-фары',/led[- ]?(?:headlamps?|headlights?|scheinwerfer)|светодиодн\S*(?: основн\S*)? фар|led[- ]фар|phares led/i],
  ['parking','parking',70,'парктроники спереди и сзади',/parking sensor front\/rear|парктроники спереди и сзади|датчики парковки.*(?:спереди и сзади|передние и задние)/i],
  ['navigation','navigation',66,'навигация',/навигационн\S* систем|navigation system|navigationssystem|navigation professionnelle/i],
  ['climate','climate',62,'климат-контроль',/климат[- ]контрол|automatic air[- ]condition|climate control|klimaautomatik|climatisation automatique/i],
  ['aeb','aeb',79,'автоматическое экстренное торможение',/автоматическ\S* торможени.*(?:столкновени|аварийн|экстренн)|automatic emergency braking|autonomous emergency braking|\baeb\b/i],
  ['laneAssist','laneAssist',77,'удержание в полосе',/удержани\S* (?:автомобиля )?в полос|удержани\S* полосы движения|lane keeping assist|lane assist|spurhalteassistent/i],
  ['keyless','keyless',75,'бесключевой доступ',/бесключев\S* доступ|keyless (?:entry|access)|comfort access|acces sans cle/i],
  ['carplay','carplay',73,'Apple CarPlay',/apple carplay|\bcarplay\b/i],
  ['androidAuto','androidAuto',72,'Android Auto',/android auto/i],
  ['activeParking','parkingAssist',71,'активный ассистент парковки',/активная система облегчения паркования/i],
  ['parkingAssist','parkingAssist',71,'автоматическая парковка',/автоматическ\S* парковк|parking assistant|park assist|parklenkassistent/i],
  ['powerSeat','memory',69,'электрорегулировка сиденья',/(?:электрорегулировк|электропривод)\S* (?:водительск\S* |передн\S* )?сиден|сиден.{0,30}электропривод|(?:electric|power)(?:ally adjustable)? (?:driver.?s? )?seat/i],
  ['sunroof','roof',68,'люк в крыше',/электрическ\S* люк|сдвижн\S* люк|electric sunroof|sliding sunroof/i],
  ['leather','leather',67,'кожаный салон',/кожан\S* (?:салон|обивк\S* сиден)|leather (?:upholstery|seats|interior)|lederausstattung/i],
  ['foldingMirrors','foldingMirrors',59,'электроскладывание зеркал',/электро\S*складыван\S* зеркал|складывающ\S* (?:наружн\S* )?зеркал.{0,35}электропривод|зеркал.{0,45}электрическ.{0,25}складыван|(?:electric|power)[ -]?folding (?:door )?mirrors/i],
  ['heatedWindscreen','heatedWindscreen',58,'обогрев лобового стекла',/(?:подогрев|обогрев)\S* (?:лобов\S*|ветров\S*) стекл|heated (?:windscreen|windshield)/i],
  ['premiumAudio','premiumAudio',57,'премиальная аудиосистема',/harman.{0,4}kardon|bang.{0,4}olufsen|bowers.{0,4}wilkins|\bbose\b|burmester|dynaudio|beats audio/i],
  ['rainSensor','rainSensor',55,'датчик дождя',/датчик\S* дождя|дат\.дождя|rain sensor|regensensor/i],
  ['autoLights','autoLights',54,'автоматическое включение фар',/автоматическ\S* включени\S* (?:света|фар)|automatic headlights|automatic light activation/i],
  ['cruise','cruise',60,'круиз-контроль',/cruise control|круиз[- ]контрол|^темпомат$|geschwindigkeitsregelung|régulateur de vitesse/i]
];
// Existing verified adapter mappings are scoped to BMW, never applied across makes.
const bmwCodes={S3AGA:'cameraRear',S316A:'tailgate',S508A:'parking',S534A:'climate',S544A:'cruise',S6UNA:'navigation',S5A4A:'led'};
const negative=/(?:^|\s)(?:без|нет|отсутствует|without|no|not fitted|not equipped|ohne|sans)(?:\s|$)|(?:не установлен|не оборудован|не поддержива)/i;
export function equipmentHighlights(packet,limit=5) {
  const page=packet.enrichment?.partslink24?.equipment||[];
  const pdf=packet.enrichment?.partslink24_pdf?.equipment||[];
  // Never fill a populated catalog list with possibly contradictory auction options.
  const source=page.length||pdf.length?'PartsLink':'Arval';
  const items=source==='PartsLink'?[...page.map(x=>({...x,origin:'partslink24'})),...pdf.map(x=>({...x,origin:'partslink24_pdf'}))]: (packet.equipment||[]).map(x=>({label:x.type,code:null,origin:'arval'}));
  const candidates=[];
  for(const item of items){
    const label=clean(item.label);if(negative.test(label)||/подготовк\S* (?:для|под|к)|preparation for|pre[- ]?wiring for/i.test(label))continue;
    const category=clean(item.category);
    const code=clean(item.code).toUpperCase();const mapped=/^BMW$/i.test(clean(packet.vehicle?.make))?bmwCodes[code]:null;
    const explicitStellantis=category==='ЛАМПЫ ФАР'&&/СВЕТОДИОД/i.test(label)?'led':category==='КРУИЗ-КОНТРОЛЬ'&&/РЕГУЛЯТОР.*СКОРОСТИ/i.test(label)?'cruise':category==='СИСТЕМА КОНДИЦИОНИРОВАНИЯ ВОЗДУХА'&&/АВТОМАТИЧЕСКИЙ КОНДИЦИОНЕР/i.test(label)?'climate':null;
    const matches=rules.filter(rule=>rule[0]===mapped||rule[0]===explicitStellantis||rule[4].test(label));
    // Specific labels win over a generic code; contradictions are kept out.
    for(const rule of matches)candidates.push({id:rule[0],group:rule[1],priority:rule[2],label:rule[3],source:item.origin,source_code:code||null,source_label:label});
  }
  candidates.sort((a,b)=>b.priority-a.priority);
  const selected=[];const groups=new Set();
  for(const item of candidates){if(groups.has(item.group))continue;groups.add(item.group);selected.push(item);if(selected.length>=limit)break;}
  return {source,items:selected};
}
export function applyEquipmentHighlights(packet){packet.vehicle.equipment_highlights=equipmentHighlights(packet);return packet;}

// Selection is scoped to the current VIN packet; an empty selection intentionally hides the list.
export function selectedEquipmentHighlights(packet){
  const candidates=equipmentHighlights(packet,15);
  const ids=packet.vehicle?.equipment_selection;
  return {...candidates,items:Array.isArray(ids)?candidates.items.filter(x=>ids.includes(x.id)):candidates.items.slice(0,5)};
}
