// Presentation rules only. Original auction title/vehicle facts remain untouched.
const clean=value=>String(value??'').normalize('NFKC').replace(/[\u2010-\u2015]/g,'-').replace(/\s+/g,' ').trim();
const escapeRe=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function normaliseVehicleTitle(vehicle) {
  const source=clean(vehicle.title);let make=clean(vehicle.make);
  if(/^kia$/i.test(make))make='Kia';
  if(!make && /^Kia\s+Sportage\b/i.test(source))make='Kia';
  let body=source;
  if(make){const prefix=new RegExp('^'+escapeRe(make)+'(?:\\s+|$)','i');while(prefix.test(body))body=body.replace(prefix,'').trim();}
  const details={power_source:[],gearbox_source:[],emissions_source:[],trim_source:[]};
  body=body.replace(/\b\d{2,4}\s*(?:CV|CH|HP|PS)\b/gi,value=>{details.power_source.push(clean(value));return ' ';});
  body=body.replace(/\b(?:BVA|BVM)\s*(?:10|[4-9])\b/gi,value=>{details.gearbox_source.push(clean(value));return ' ';});
  body=body.replace(/\b(?:E6[a-e](?:[- ]?TEMP)?|Euro\s*[4-6](?:[a-e](?:[- ]?TEMP)?)?)\b/gi,value=>{details.emissions_source.push(clean(value));return ' ';});
  body=clean(body);
  let model=null;let strategy='conservative-rules/1';let needsReview=true;
  if(/^Kia$/i.test(make) && /^Sportage\b/i.test(body)) {
    model='Sportage';strategy='kia-sportage-rules/1';body=body.replace(/^Sportage\b/i,'');
    body=body.replace(/\bDesign\b/gi,value=>{details.trim_source.push(value);return ' ';});
    let displacement=null;let engine=null;let hybrid=null;
    body=body.replace(/\b([1-6])[.,]([0-9])\b/,(value,litres,decimal)=>{displacement=litres+'.'+decimal;return ' ';});
    body=body.replace(/\b(T[- ]?GDi|CRDi|GDi)\b/i,value=>{engine=/^T/i.test(value)?'T-GDi':/^CR/i.test(value)?'CRDi':'GDi';return ' ';});
    const plug= /\b(?:PHEV|Plug[- ]?in\s+Hybr(?:id|ide)|Hybr(?:id|ide)\s+Rechargeable)\b/i.test(body);
    const mild= /\b(?:MHEV|Mild\s+Hybrid)\b/i.test(body);
    if(plug && mild) {
      // Conflicting source labels remain visible and require human review.
      hybrid=null;
    }else if(plug){hybrid='Plug-in Hybrid';body=body.replace(/\b(?:PHEV|Plug[- ]?in\s+Hybr(?:id|ide)|Hybr(?:id|ide)\s+Rechargeable)\b/gi,' ');body=body.replace(/\b(?:Hybrid|Hybride|HEV)\b/gi,' ');}
    else if(mild){hybrid='Mild Hybrid';body=body.replace(/\b(?:MHEV|Mild\s+Hybrid)\b/gi,' ');body=body.replace(/\b(?:Hybrid|Hybride|HEV)\b/gi,' ');}
    else if(/\b(?:Hybrid|Hybride|HEV)\b/i.test(body)){hybrid='Hybrid';body=body.replace(/\b(?:Hybrid|Hybride|HEV)\b/gi,' ');}
    const remainder=clean(body);needsReview=Boolean(remainder)||Boolean(plug&&mild);
    body=[model,displacement,engine,hybrid,remainder].filter(Boolean).join(' ');
  }
  // Never substitute an unrecognised model or infer engine/drive from a catalog.
  const display=clean([make,body].filter(Boolean).join(' '));
  return {source_title:source,display_title:display||source||make,model,strategy,needs_review:needsReview,...details};
}
export function applyVehicleTitle(packet) {
  const naming=normaliseVehicleTitle(packet.vehicle);packet.vehicle.title_details=naming;
  packet.vehicle.display_title=clean(packet.vehicle.title_override)||naming.display_title;
  return packet;
}
export function publicVehicleTitle(vehicle) {
  return clean(vehicle.title_override)||clean(vehicle.display_title)||normaliseVehicleTitle(vehicle).display_title;
}
