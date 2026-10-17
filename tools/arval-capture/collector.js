// Self-contained: Chrome serializes this function into the selected tab.
export function collectArvalLot() {
  if (location.hostname !== 'remktg.arval.com' || !location.hash.includes('/item-details/')) {
    throw new Error('Откройте карточку одного автомобиля на remktg.arval.com.');
  }
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const text = el => clean(el?.textContent);
  const pairs = (root = document) => [...(root?.querySelectorAll('.d-flex') || [])]
    .filter(el => el.children.length === 2 && [...el.children].every(c => c.tagName === 'SPAN'))
    .map(el => [...el.children].map(text));
  const fields = Object.fromEntries(pairs(document.querySelector('main') || document));
  const get = key => fields[key] && fields[key] !== '-' ? fields[key] : null;
  const number = value => value ? Number(value.replace(/[^\d]/g, '')) : null;
  const titleEl = document.querySelector('#submenu-main-characteristics');
  const title = text(titleEl);
  const vin = get('Vehicle Identification Number');
  if (!title || !vin || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    throw new Error('Не найдены название и корректный VIN. Дождитесь загрузки лота. Первая версия поддерживает английский интерфейс Arval.');
  }
  const card = titleEl.closest('.card-body');
  const summary = text(card);
  const mileageMatch = summary.match(/([\d, .\u00a0]+)\s*km\b/i);
  const registration = summary.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}\b/i)?.[0] || null;
  const sourceUrl = new URL(location.href);
  const hashQuery = new URLSearchParams(location.hash.split('?')[1] || '');
  const capturedAt = new Date().toISOString();
  const priceEl = [...document.querySelectorAll('span')].find(el => el.children.length === 0 && /^\s*Highest Bid:/i.test(el.textContent));
  const priceText = text(priceEl);
  const priceMatch = priceText.match(/Highest Bid:\s*([\d,.\s]+)\s*([A-Z]{3})/);
  const amount = priceMatch ? Number(priceMatch[1].replace(/[,\s]/g, '')) : null;
  // Timers may have nested digits, use min/m instead of mn, or omit zero units.
  // Read visible text only; never click auction controls or infer from service dates.
  const countdowns=[];
  for(const el of document.querySelectorAll('span,div,time,p,strong,b,small,h1,h2,h3,h4')) {
    if(!el.getClientRects().length)continue;
    const raw=text(el);if(!raw || raw.length>100)continue;
    let seconds=null;
    const units=raw.match(/^(?:(\d+)\s*(?:days?|d)\s*)?(?:(\d+)\s*(?:hours?|hrs?|h)\s*)?(?:(\d+)\s*(?:minutes?|mins?|mn|m)\s*)?(?:(\d+)\s*(?:seconds?|secs?|s)\s*)?$/i);
    if(units && units.slice(1).some(x=>x!==undefined))seconds=Number(units[1]||0)*86400+Number(units[2]||0)*3600+Number(units[3]||0)*60+Number(units[4]||0);
    // Colon-form clocks need an explicit countdown context to avoid a wall clock.
    if(seconds===null && /countdown|remaining|time.?left|auction.?timer/i.test([el.className,el.id,el.getAttribute('aria-label'),el.parentElement?.className].join(' '))) {
      const clock=raw.match(/^(\d{1,3}):(\d{2}):(\d{2})$/);
      if(clock && Number(clock[2])<60 && Number(clock[3])<60)seconds=Number(clock[1])*3600+Number(clock[2])*60+Number(clock[3]);
    }
    if(seconds!==null && seconds>=0 && seconds<=90*86400)countdowns.push({el,seconds,raw});
  }
  // A complete timer container supersedes its individual hour/minute child spans.
  const completeCountdowns=countdowns.filter(candidate=>!countdowns.some(parent=>parent.el!==candidate.el&&parent.el.contains(candidate.el)));
  const distinctCountdowns=[...new Set(completeCountdowns.map(x=>x.seconds))];
  // Conflicting clocks on a page cannot safely identify this lot's deadline.
  const countdownSeconds=distinctCountdowns.length===1?distinctCountdowns[0]:null;
  const countdown=countdownSeconds===null?null:`${Math.floor(countdownSeconds/86400)} d ${Math.floor(countdownSeconds%86400/3600)} h ${Math.floor(countdownSeconds%3600/60)} mn ${countdownSeconds%60} s`;
  const optionsEl = document.querySelector('#submenu-options');
  const equipment = optionsEl ? pairs(optionsEl.nextElementSibling).filter(([key]) => key !== 'Equipment Type') : [];
  const photoMap = new Map();
  for (const img of document.querySelectorAll('main img[src], #submenu-damages img[src]')) {
    const raw = img.getAttribute('src');
    if (!raw) continue;
    let url;
    try { url = new URL(raw, document.baseURI || location.href); } catch { continue; }
    // Never guess filenames or enumerate unseen resources.
    if (url.protocol !== 'https:' || url.hostname !== location.hostname || !/\/pictures\/cars\//.test(url.pathname) || !url.pathname.includes(vin)) continue;
    const key = url.origin + url.pathname;
    const kind = img.closest('#submenu-damages') ? 'damage' : 'vehicle';
    const previous = photoMap.get(key);
    if (!previous || kind === 'damage') photoMap.set(key, {url: url.href, kind, alt: clean(img.alt)});
  }
  const damageLabels = ['Damaged Part(s)', 'Nature of damage', 'Damage Repair'];
  const damagePairs = pairs(document.querySelector('#submenu-damages'));
  const damages = [];
  for (const [label, value] of damagePairs) {
    if (label === damageLabels[0]) damages.push({part: value, nature: null, repair: null});
    else if (damages.length && label === damageLabels[1]) damages.at(-1).nature = value;
    else if (damages.length && label === damageLabels[2]) damages.at(-1).repair = value;
  }
  const maintenanceEl = document.querySelector('#submenu-maintenance-history');
  const maintenanceRoot = maintenanceEl?.matches('h1,h2,h3,h4') ? maintenanceEl.nextElementSibling : maintenanceEl;
  const maintenanceHeading = text(maintenanceEl?.querySelector('h2,h3')) || text(maintenanceEl);
  const maintenanceCount = maintenanceHeading.match(/Maintenance history\s*\((\d+)\)/i)?.[1];
  const maintenanceEntries = [];
  const maintenanceSeen = new Set();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (const row of maintenanceRoot?.querySelectorAll('*') || []) {
    const cells = [...row.children];
    if (cells.length !== 3) continue;
    const [dateSource,mileageSource,descriptionSource] = cells.map(text);
    const dateMatch = dateSource.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})$/i);
    if (!dateMatch || !/^[\d, .\u00a0]+\s*km$/i.test(mileageSource) || !descriptionSource) continue;
    const mileage = number(mileageSource);
    if (!Number.isSafeInteger(mileage) || mileage < 0) continue;
    const key = [dateSource,mileage,descriptionSource].join('|');
    if (maintenanceSeen.has(key)) continue;
    maintenanceSeen.add(key);
    const year = 2000 + Number(dateMatch[2]);
    const monthIndex = months.findIndex(m=>m.toLowerCase()===dateMatch[1].toLowerCase());
    maintenanceEntries.push({date_source:dateSource,date_month:year<=new Date().getFullYear()+1?`${year}-${String(monthIndex+1).padStart(2,'0')}`:null,mileage_km:mileage,description_source:descriptionSource});
  }
  const documents = [];
  const seenDocs = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const raw = a.getAttribute('href');
    if (!raw || !/^https?:/i.test(a.href)) continue;
    const url = new URL(a.href);
    const report = url.hostname === 'www4.macadam.eu' && url.pathname === '/Manager/SinglePage/AppraisalWebview';
    const pdf = url.hostname === location.hostname && /\.pdf$/i.test(url.pathname);
    if ((!report && !pdf) || url.protocol !== 'https:' || seenDocs.has(url.href)) continue;
    seenDocs.add(url.href);
    documents.push({kind: report ? 'macadam_report' : 'pdf', label: text(a) || (report ? 'Macadam inspection' : 'PDF'), url: url.href, archive_status: 'pending'});
  }
  const warnings = [];
  if (!photoMap.size) warnings.push('Фотографии не найдены. Проверьте загрузку галереи.');
  if (!mileageMatch) warnings.push('Пробег не распознан: проверьте вручную.');
  if (!priceMatch) warnings.push('Текущая максимальная ставка не найдена; другие виды цены пока не распознаются.');
  warnings.push('Абсолютное время окончания торгов не подтверждено. Таймер — только снимок на момент сбора; продление торгов возможно.');
  if (maintenanceCount === '0') warnings.push('Arval показывает 0 сервисных записей. Это не означает отсутствие обслуживания.');
  if (maintenanceCount !== undefined && Number(maintenanceCount) !== maintenanceEntries.length) warnings.push(`Сервисная история: указано ${maintenanceCount} записей, прочитано ${maintenanceEntries.length}. Раскройте раздел и перечитайте лот; исходный текст сохранён.`);
  if (!documents.length) warnings.push('Ссылки на отчёты не найдены. Откройте Links and documents и повторите сбор.');
  const year = number(get('Year of production'));
  const modelYear = number(get('Model year'));
  if (year && modelYear && year !== modelYear) warnings.push('Год производства и модельный год в источнике различаются; сохранены отдельно.');
  return {
    schema_version: 'atlant.vehicle.capture/1',
    source: {auction: 'arval', lot_id: location.hash.match(/item-details\/([^?]+)/)?.[1] || null, sales_event_id: hashQuery.get('salesEventId'), url: sourceUrl.href, captured_at: capturedAt, interface_language: document.documentElement.lang || 'unknown', extractor_version: '0.4.1'},
    workflow: {state: 'auction', publication: 'draft', availability: 'unknown'},
    vehicle: {vin, make: get('Brand'), title, model_generation: get('Model generation'), production_year: year, model_year: modelYear, first_registration_source: registration, mileage_km: mileageMatch ? number(mileageMatch[1]) : null, fuel: summary.match(/\b(Petrol|Diesel|Electric|Hybrid)\b/i)?.[0] || null, transmission: summary.match(/\b(Manual|Automatic)\b/i)?.[0] || null, engine_cm3: number(get('Engine Size')), power_kw: number(get('Power')), color: get('Paint Color/Carmaker Color'), keys: number(get('Number of Keys')), storage_location: get('Storage location name'), vat_deductible_source: get('VAT Deductible')},
    auction: {price: {kind: priceMatch ? 'highest_bid' : 'unknown', amount, currency: priceMatch?.[2] || null, tax_basis: 'unknown', observed_at: capturedAt, source_text: priceText || null}, countdown_source: countdown, countdown_source_original: countdown===null?null:completeCountdowns[0].raw, ends_at: null},
    equipment: equipment.map(([type, specification]) => ({type, specification})),
    condition: {damages, tyres_source: text(document.querySelector('#submenu-tyres')), maintenance_count: maintenanceCount === undefined ? null : Number(maintenanceCount), maintenance_entries: maintenanceEntries, maintenance_source: [maintenanceHeading,text(maintenanceRoot)].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join('\n')},
    photos: [...photoMap.values()], documents,
    evidence: {fields, summary_source: summary, sections: [...document.querySelectorAll('main [id^="submenu-"]')].filter(x => ['submenu-details', 'submenu-damages', 'submenu-maintenance-history', 'submenu-tyres'].includes(x.id)).map(x => ({section: x.id, text: text(x)}))},
    warnings
  };
}
