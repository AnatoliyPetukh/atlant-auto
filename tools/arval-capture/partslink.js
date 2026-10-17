// Read only the vehicle-identification panels, never the parts shopping cart.
export function collectPartslink() {
  if(location.hostname!=='www.partslink24.com') throw Error('Откройте страницу автомобиля в partslink24.');
  const t=el=>(el?.textContent||'').replace(/\s+/g,' ').trim();
  const vin=location.pathname.match(/\/([A-HJ-NPR-Z0-9]{17})\//i)?.[1]?.toUpperCase();
  const basic=document.querySelector('[data-testid="vinfoBasic"] .MuiAccordionDetails-root');
  if(!vin||!basic||!basic.textContent.includes(vin)) throw Error('VIN страницы не подтверждён в данных автомобиля.');
  const fields={};
  for(const el of basic.querySelectorAll('div')) {
    if(el.children.length===2&&/label/.test(el.firstElementChild.className)) fields[t(el.firstElementChild)]=t(el.lastElementChild);
  }
  const equipment=[];const sections=[];
  for(const [id,kind] of [['vinfoStandardEquipment','standard'],['vinfoOptionalEquipment','optional']]) {
    const section=document.querySelector(`[data-testid="${id}"]`);
    const expanded=section?.querySelector('button')?.getAttribute('aria-expanded')==='true';
    sections.push({section:id,expanded});
    for(const row of section?.querySelectorAll('[data-testid="row"]')||[]) {
      const code=t(row.querySelector('[data-testid="nameValue"]'));const label=t(row.querySelector('[data-testid="valueValue"]'));
      if(code&&label) equipment.push({code,label,kind});
    }
  }
  if(sections.some(x=>!x.expanded))throw Error('Откройте вручную разделы «Серийная комплектация» и «Спецоборудование», дождитесь загрузки и повторно нажмите расширение. Автоматические клики отключены.');
  return {source:'partslink24',vin,url:location.href,captured_at:new Date().toISOString(),fields,equipment,sections};
}

export function attachPartslink(packet, parts) {
  if(!parts)return packet;
  if(parts.vin!==packet.vehicle.vin)throw Error('VIN комплектации не совпадает с VIN лота.');
  packet.enrichment={...(packet.enrichment||{}),partslink24:parts};
  packet.warnings.push(`Комплектация partslink24 сохранена ${parts.captured_at}. Проверьте её актуальность.`);
  if(parts.sections.some(x=>!x.expanded))packet.warnings.push('В partslink24 не все разделы были раскрыты: комплектация может быть неполной.');
  if(parts.fields['Мощность']&&Number(parts.fields['Мощность'])!==packet.vehicle.power_kw)packet.warnings.push(`Мощность: Arval ${packet.vehicle.power_kw} кВт, partslink24 ${parts.fields['Мощность']} (исходное значение). Требуется сверка.`);
  return packet;
}
