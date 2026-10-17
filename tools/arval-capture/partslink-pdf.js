const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
export function pdfTextRows(items,page=1) {
  const rows=[];
  for(const item of items){
    if(!('str' in item)||!clean(item.str))continue;
    const y=item.transform[5];let row=rows.find(x=>Math.abs(x.y-y)<2);
    if(!row){row={page,y,cells:[]};rows.push(row);}row.cells.push({x:item.transform[4],str:item.str});
  }
  for(const row of rows){row.cells.sort((a,b)=>a.x-b.x);row.text=clean(row.cells.map(x=>x.str).join(' '));}
  return rows.sort((a,b)=>b.y-a.y);
}
export function parseVagEquipment(rows) {
  const equipment=[];let active=false;let codeX=null;let labelX=null;let current=null;
  for(const row of rows){
    if(/^Номер PR$/i.test(row.text)){active=true;continue;}
    if(!active||/^\d+\s*\/\s*\d+$/.test(row.text))continue;
    if(/Характеристика\s+Наименование/i.test(row.text)){labelX=row.cells.find(x=>/Наименование/i.test(x.str))?.x??labelX;continue;}
    const cell=row.cells.find(x=>/^[A-Z0-9]{3}$/.test(clean(x.str))&&/[A-Z]/.test(x.str)&&(codeX===null||Math.abs(x.x-codeX)<4)&&labelX!==null&&x.x<labelX-10&&row.cells.some(y=>y.x>=labelX-2));
    if(cell){
      codeX=cell.x;const label=clean(row.cells.filter(x=>x.x>=labelX-2).map(x=>x.str).join(' '));
      const category=clean(row.cells.filter(x=>x.x<codeX-4).map(x=>x.str).join(' '));
      current={code:clean(cell.str),label,category,kind:'pr',page:row.page};equipment.push(current);
    }else if(current&&labelX!==null){
      const continuation=clean(row.cells.filter(x=>x.x>=labelX-2).map(x=>x.str).join(' '));
      if(continuation)current.label=clean(current.label+' '+continuation);
    }
  }
  return equipment;
}
export function parseStellantisRows(rows){
  const fields={};const equipment=[];let valueX=null;let section='basic';let current=null;let previous=null;
  for(const row of rows){
    if(/^Оснащение$/i.test(row.text)){section='equipment';current=null;previous=null;continue;}
    if(/^Характеристика\s+Данные автомобиля$/i.test(row.text)){valueX=row.cells.find(x=>/^Данные/i.test(x.str))?.x??valueX;previous=null;continue;}
    if(valueX===null||/^\d+\s*\/\s*\d+$/.test(row.text))continue;
    const left=clean(row.cells.filter(x=>x.x<valueX-3).map(x=>x.str).join(' '));
    const right=clean(row.cells.filter(x=>x.x>=valueX-3).map(x=>x.str).join(' '));
    const continuation=current&&previous&&row.page===previous.page&&previous.y-row.y<12;
    if(continuation||(!left&&right&&current)){
      current.category=clean(current.category+' '+left);current.label=clean(current.label+' '+right);
    }else if(left&&right){
      current={code:null,category:left,label:right,kind:section==='basic'?'identification':'equipment',page:row.page};
      if(section==='equipment')equipment.push(current);else fields[left]=current;
    }
    previous=row;
  }
  return {fields:Object.fromEntries(Object.values(fields).map(x=>[x.category,x.label])),equipment};
}
export function parseMercedesRows(rows){
  const fields={};const equipment=[];let section='basic';let valueX=null;let labelX=null;let typeX=null;let codeX=null;let current=null;
  for(const row of rows){
    if(/^Данные VPD$/i.test(row.text)){section='vpd';current=null;continue;}
    if(/^Агрегаты$/i.test(row.text)){section='aggregates';current=null;continue;}
    if(/^Характеристика\s+Данные автомобиля$/i.test(row.text)){
      valueX=row.cells.find(x=>/^Данные автомобиля$/i.test(x.str))?.x??null;continue;
    }
    if(/^Оснащение\s+Наименование\s+Код типа$/i.test(row.text)){
      section='equipment';current=null;
      codeX=row.cells.find(x=>/^Оснащение$/i.test(x.str))?.x??null;
      labelX=row.cells.find(x=>/^Наименование$/i.test(x.str))?.x??null;
      typeX=row.cells.find(x=>/^Код типа$/i.test(x.str))?.x??null;continue;
    }
    if(/^\d+\s*\/\s*\d+$/.test(row.text))continue;
    if(section==='basic'&&valueX!==null){
      const left=clean(row.cells.filter(x=>x.x<valueX-3).map(x=>x.str).join(' '));
      const right=clean(row.cells.filter(x=>x.x>=valueX-3).map(x=>x.str).join(' '));
      if(left&&right)fields[left]=right;continue;
    }
    if(section!=='equipment'||codeX===null||labelX===null||typeX===null)continue;
    const code=clean(row.cells.filter(x=>Math.abs(x.x-codeX)<4).map(x=>x.str).join(' '));
    const label=clean(row.cells.filter(x=>x.x>=labelX-3&&x.x<typeX-3).map(x=>x.str).join(' '));
    const type=clean(row.cells.filter(x=>x.x>=typeX-3).map(x=>x.str).join(' '));
    if(/^[A-Z0-9]{1,5}$/.test(code)&&type==='sales'){
      current={code,label,kind:'equipment',page:row.page};equipment.push(current);
    }else if(!code&&!type&&label&&current){current.label=clean(current.label+' '+label);}
  }
  // Preserve the serial number as-is; only an explicit fuel label supplies the engine type.
  const engine=equipment.find(x=>/^(?:БЕНЗИНОВЫЙ|ДИЗЕЛЬНЫЙ) ДВИГАТЕЛЬ(?:\s|$)/iu.test(x.label));
  if(engine)fields['Тип двигателя']=engine.label;
  return {fields,equipment};
}
export function parsePartslinkText(text,vin,rows=[]) {
  const vag=/Идентификация автомобиля/i.test(text)&&/Номер PR/i.test(text)&&/Номер шасси/i.test(text)&&/Дата производства/i.test(text);
  const stellantis=/Идентификация автомобиля/i.test(text)&&/Номер шасси/i.test(text)&&/Оснащение/i.test(text)&&/Заводской код/i.test(text)&&/КОРОБКА ПЕРЕДАЧ/i.test(text);
  const mercedes=/Идентификация автомобиля/i.test(text)&&/Номер шасси\s+(?:WDB|WDC|WDD|WDF|W1K|W1N|W1V)[A-HJ-NPR-Z0-9]{14}\b/i.test(text)&&/Торговое наименование/i.test(text)&&/Агрегаты/i.test(text)&&/Оснащение\s+Наименование\s+Код типа/i.test(text);
  if(!/partslink\s*24/i.test(text)&&!vag&&!stellantis&&!mercedes)throw Error('Не распознан шаблон PDF PartsLink. Файл можно сохранить как документ, но автоматический импорт отклонён.');
  const vins=[...new Set((text.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/g)||[]).filter(x=>/\d/.test(x)))];
  if(vins.length!==1||vins[0]!==vin)throw Error('В PDF должен быть один полный VIN, совпадающий с VIN лота. Импорт не выполнен.');
  const columnData=mercedes?parseMercedesRows(rows):stellantis?parseStellantisRows(rows):{fields:{},equipment:[]};
  const fields={...columnData.fields};const lines=text.split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const labels='Дата (?:выпуска|производства|изготовления)|Год (?:выпуска|производства)|Production date|Date of (?:production|manufacture)|Build date|Manufactur(?:e|ing) date|Produktionsdatum|Baudatum|Топливо|Тип (?:двигателя|топлива)|Fuel(?: type)?|Engine(?: type)?|Powertrain|Kraftstoff|Motor|Модельный год|Модель|Код двигателя|Код коробки передач';
  const pattern=new RegExp(`^(${labels})\\s*(?::|\\t|\\s)\\s*(.*)$`,'i');
  const labelOnly=new RegExp(`^(${labels})\\s*:?$`,'i');
  for(let i=0;i<lines.length;i++){
    let match=lines[i].match(pattern);let value=match?.[2];
    if(!match||!value){
      match=lines[i].match(labelOnly);
      if(match){value=lines[i+1]||'';if(pattern.test(value)||labelOnly.test(value)||/^(?:Номер PR|Характеристика|Данные автомобиля|Standard equipment|Optional equipment)\b/i.test(value))value='';}
    }
    if(!match)continue;
    const key=match[1];
    if(fields[key]&&fields[key]!==value)throw Error(`В PDF разные значения поля «${key}». Требуется ручная проверка.`);
    fields[key]=value;
  }
  const equipment=mercedes||stellantis?columnData.equipment:vag?parseVagEquipment(rows):[];let kind=null;
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(/^(?:standard equipment|серийная комплектация|серийное оснащение|serienausstattung)\s*:?$/i.test(line)){kind='standard';continue;}
    if(/^(?:optional equipment|спецоборудование|дополнительное оборудование|sonderausstattung)\s*:?$/i.test(line)){kind='optional';continue;}
    if(/^(?:vehicle (?:data|details)|данные автомобиля|технические характеристики|maintenance|service history|fahrzeugdaten)\s*:?$/i.test(line)){kind=null;continue;}
    if(!kind)continue;
    const row=line.match(/^([A-Z0-9]{3,8})(?:\s+(.+))?$/);
    if(!row||!/[A-Z]/.test(row[1])||!/[0-9]/.test(row[1]))continue;
    const label=row[2]||lines[i+1];if(!label||/^[A-Z0-9]{3,8}$/.test(label))continue;
    equipment.push({code:row[1],label,kind});if(!row[2])i++;
  }
  const baseEngine=equipment.find(x=>/^Базовый двигатель$/i.test(x.category));
  if(baseEngine)fields['Двигатель']=baseEngine.label;
  return {source:'partslink24_pdf',template:mercedes?'mercedes-columns-ru':stellantis?'stellantis-columns-ru':vag?'vag-pr-table-ru':'partslink-labelled-text',vin,captured_at:new Date().toISOString(),fields,text_source:text,equipment};
}

export async function readPartslinkPdf(file,vin) {
  if(!file||file.size===0||file.size>20*1024*1024)throw Error('Выберите PDF PartsLink до 20 МБ.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder('ascii').decode(bytes.slice(0,5))!=='%PDF-')throw Error('Выбранный файл не является PDF.');
  const {getDocument,GlobalWorkerOptions}=await import('./vendor/pdfjs/pdf.min.mjs');
  GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
  const task=getDocument({data:bytes,isEvalSupported:false,enableXfa:false,useWasm:false,useSystemFonts:true,disableFontFace:true});
  let timer;
  try {
    return await Promise.race([(async()=>{
      const pdf=await task.promise;if(pdf.numPages>30)throw Error('В PDF больше 30 страниц. Для импорта используйте открытую карточку PartsLink.');
      let text='';const rows=[];
      for(let i=1;i<=pdf.numPages;i++){
        const page=await pdf.getPage(i);const content=await page.getTextContent();
        const pageRows=pdfTextRows(content.items,i);rows.push(...pageRows);text+=pageRows.map(x=>x.text).join('\n')+'\n';page.cleanup();
        if(text.length>500000)throw Error('Слишком большой объём текста в PDF.');
      }
      if(text.trim().length<20)throw Error('В PDF нет читаемого текста. Скан пока не распознаётся: используйте открытую страницу PartsLink.');
      return {...parsePartslinkText(text,vin,rows),file_name:file.name};
    })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Разбор PDF занял больше 30 секунд.')),30000);})]);
  }finally{clearTimeout(timer);await task.destroy();}
}
