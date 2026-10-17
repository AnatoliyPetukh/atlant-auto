import {productionDate} from './vehicle-facts.js';
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
export function parseHyundaiKiaRows(rows){
  const fields={};const equipment=[];let section=null,valueX=null,labelX=null,codeX=null,current=null,previousKey=null;
  for(const row of rows){
    if(/^https?:\/\//i.test(row.text)||/partslink24$/i.test(row.text)||/^\d+\s*\/\s*\d+$/.test(row.text))continue;
    if(/^Данные автомобиля$/i.test(row.text)){section='identification';current=null;continue;}
    if(/^(?:Оснащение|Доп\.?\s*оборудование|Дополнительное оборудование)$/i.test(row.text)){section=/^Оснащение/i.test(row.text)?'equipment':'optional';current=null;continue;}
    if(section==='identification'){
      const vin=row.cells.find(cell=>/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean(cell.str)));
      if(vin&&/Номер шасси/i.test(row.text))valueX=vin.x;
      if(valueX===null)continue;
      const left=clean(row.cells.filter(c=>c.x<valueX-3).map(c=>c.str).join(' '));
      const right=clean(row.cells.filter(c=>c.x>=valueX-3).map(c=>c.str).join(' '));
      if(left){previousKey=left;if(right)fields[left]=right;}
      else if(right&&previousKey&&fields[previousKey])fields[previousKey]=clean(fields[previousKey]+' '+right);
    }else if(section==='equipment'||section==='optional'){
      if(/^Характеристика\s+Наименование$/i.test(row.text)){codeX=row.cells.find(c=>/^Характеристика$/i.test(clean(c.str)))?.x??null;labelX=row.cells.find(c=>/^Наименование$/i.test(clean(c.str)))?.x??null;continue;}
      if(codeX===null||labelX===null)continue;
      const code=clean(row.cells.filter(c=>Math.abs(c.x-codeX)<4).map(c=>c.str).join(' '));
      const label=clean(row.cells.filter(c=>c.x>=labelX-3).map(c=>c.str).join(' '));
      if(/^[A-Z0-9]{6}$/.test(code)&&label){current={code,label,kind:section,page:row.page};equipment.push(current);}
      else if(!code&&label&&current)current.label=clean(current.label+' '+label);
    }
  }
  return {fields,equipment};
}
function enrichHyundaiKia(fields,equipment){
  if(equipment.some(o=>/^ENVIRONMENT PACKAGE\s*-\s*MILD HEV$/i.test(clean(o.label))))fields['Тип двигателя']=[fields['Двигатель'],'MHEV'].filter(Boolean).join(' · ');
}
// Recognise the common identification/equipment table by its columns, not its brand.
// A graphical PartsLink logo is often absent from the PDF text layer.
export function parseIdentificationRows(rows){
  const fields={},equipment=[];let section=null,valueX=null,current=null;
  for(const row of rows){
    if(/^(?:Характеристика\s+Данные автомобиля|Characteristic\s+Vehicle data)$/i.test(row.text)){
      section='basic';valueX=row.cells.find(c=>/^(?:Данные|Vehicle)(?:\s|$)/i.test(clean(c.str)))?.x??null;current=null;continue;
    }
    if(/^(?:Оснащение\s+Наименование|Equipment\s+Description)$/i.test(row.text)){
      section='equipment';valueX=row.cells.find(c=>/^(?:Наименование|Description)$/i.test(clean(c.str)))?.x??null;current=null;continue;
    }
    if(valueX===null||/^\d+\s*\/\s*\d+$/.test(row.text)||/^https?:\/\//i.test(row.text))continue;
    if(/^(?:Оснащение|Данные автомобиля|Идентификация автомобиля|Equipment|Vehicle data|Vehicle identification)$/i.test(row.text)){section=null;current=null;continue;}
    const left=clean(row.cells.filter(c=>c.x<valueX-3).map(c=>c.str).join(' '));
    const right=clean(row.cells.filter(c=>c.x>=valueX-3).map(c=>c.str).join(' '));
    if(section==='basic'){
      if(left&&right){
        if(fields[left]&&fields[left]!==right)throw Error(`В PDF разные значения поля «${left}». Требуется ручная проверка.`);
        fields[left]=right;current=left;
      }else if(!left&&right&&current)fields[current]=clean(fields[current]+' '+right);
    }else if(section==='equipment'){
      const match=left.match(/^([A-Z0-9][A-Z0-9_]{0,15})\s*[-–—]\s*(.*)$/);
      if(match){current={code:match[1],category:match[2],label:right,kind:'equipment',page:row.page};equipment.push(current);}
      else if(current){current.category=clean(current.category+' '+left);current.label=clean(current.label+' '+right);}
    }
  }
  const identified=/^[A-HJ-NPR-Z0-9]{17}$/i.test(fields['Номер шасси']||fields['VIN']||'')
    &&Boolean(fields['Модель']||fields['Model'])
    &&Object.keys(fields).length>=3&&equipment.length>0;
  return {fields,equipment,identified};
}
export function parsePartslinkText(text,vin,rows=[]) {
  const hyundaiKia=/Идентификация автомобиля/i.test(text)&&/Номер шасси/i.test(text)&&/partslink24/i.test(text)&&/(?:hyundai-kia-automotive-group|\b(?:kia|hyundai)_parts\b)/i.test(text);
  const vag=/Идентификация автомобиля/i.test(text)&&/Номер PR/i.test(text)&&/Номер шасси/i.test(text)&&/Дата производства/i.test(text);
  const stellantis=/Идентификация автомобиля/i.test(text)&&/Номер шасси/i.test(text)&&/Оснащение/i.test(text)&&/Заводской код/i.test(text)&&/КОРОБКА ПЕРЕДАЧ/i.test(text);
  const mercedes=/Идентификация автомобиля/i.test(text)&&/Номер шасси\s+(?:WDB|WDC|WDD|WDF|W1K|W1N|W1V)[A-HJ-NPR-Z0-9]{14}\b/i.test(text)&&/Торговое наименование/i.test(text)&&/Агрегаты/i.test(text)&&/Оснащение\s+Наименование\s+Код типа/i.test(text);
  const generic=(!hyundaiKia&&!mercedes&&!stellantis&&!vag)?parseIdentificationRows(rows):null;
  if(!/partslink\s*24/i.test(text)&&!vag&&!stellantis&&!mercedes&&!hyundaiKia&&!generic?.identified)throw Error('Не удалось уверенно определить таблицы данных автомобиля в PDF PartsLink. Файл можно сохранить как документ; автоматический импорт требует проверки.');
  const vins=[...new Set((text.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/g)||[]).filter(x=>/\d/.test(x)))];
  if(vins.length!==1||vins[0]!==vin)throw Error('В PDF должен быть один полный VIN, совпадающий с VIN лота. Импорт не выполнен.');
  const columnData=hyundaiKia?parseHyundaiKiaRows(rows):mercedes?parseMercedesRows(rows):stellantis?parseStellantisRows(rows):generic?.identified?generic:{fields:{},equipment:[]};
  const fields={...columnData.fields};const lines=text.split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const labels='Дата (?:выпуска|производства|изготовления)|Год (?:выпуска|производства)|Production date|Date of (?:production|manufacture)|Build date|Manufactur(?:e|ing) date|Produktionsdatum|Baudatum|Топливо|Тип (?:двигателя|топлива)|Fuel(?: type)?|Engine(?: type)?|Powertrain|Kraftstoff|Motor|Модельный год|Модель|Код двигателя|Код коробки передач';
  const pattern=new RegExp(`^(${labels})\\s*(?::|\\t|\\s)\\s*(.*)$`,'i');
  const labelOnly=new RegExp(`^(${labels})\\s*:?$`,'i');
  for(let i=0;i<lines.length;i++){
    if(hyundaiKia||generic?.identified)continue;
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
  const equipment=hyundaiKia||mercedes||stellantis||generic?.identified?columnData.equipment:vag?parseVagEquipment(rows):[];let kind=null;
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
  if(hyundaiKia)enrichHyundaiKia(fields,equipment);
  return {source:'partslink24_pdf',template:hyundaiKia?'hyundai-kia-columns-ru':mercedes?'mercedes-columns-ru':stellantis?'stellantis-columns-ru':vag?'vag-pr-table-ru':generic?.identified?'partslink-identification-columns':'partslink-labelled-text',vin,captured_at:new Date().toISOString(),fields,text_source:text,equipment};
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
      return {...parsePartslinkText(text,vin,rows),file_name:file.name,page_count:pdf.numPages};
    })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Разбор PDF занял больше 30 секунд.')),30000);})]);
  }finally{clearTimeout(timer);await task.destroy();}
}

export function mergePartslinkDocuments(documents,vin){
  if(!documents.length)throw Error('Выберите хотя бы один PDF PartsLink.');
  const fields={},equipment=[],seen=new Set(),fieldSources=[];let totalText=0;
  for(const doc of documents){
    if(doc.vin!==vin)throw Error('VIN одного из файлов PartsLink не совпадает с VIN автомобиля.');
    totalText+=(doc.text_source||'').length;if(totalText>500000)throw Error('Суммарный объём текста PartsLink слишком большой.');
    for(const [label,value]of Object.entries(doc.fields)){
      fieldSources.push({label,value,file_name:doc.file_name});
      if(!value)continue;
      if(fields[label]&&clean(fields[label])!==clean(value)){
        const a=/дата|date|datum/i.test(label)?productionDate(fields[label]):null,b=/дата|date|datum/i.test(label)?productionDate(value):null;
        if(a&&b&&(a.value.startsWith(b.value)||b.value.startsWith(a.value))){if(b.value.length>a.value.length)fields[label]=value;continue;}
        throw Error(`В файлах PartsLink разные значения поля «${label}». Проверьте комплект документов.`);
      }
      fields[label]=value;
    }
    for(const item of doc.equipment){const id=clean(item.code)+'|'+clean(item.label);if(!seen.has(id)){seen.add(id);equipment.push({...item,file_name:doc.file_name});}}
  }
  if(documents.every(d=>d.template==='hyundai-kia-columns-ru'))enrichHyundaiKia(fields,equipment);
  return {source:'partslink24_pdf',template:documents.length===1?documents[0].template:'partslink-multi-pdf',vin,captured_at:new Date().toISOString(),fields,equipment,field_sources:fieldSources,source_files:documents.map(d=>({file_name:d.file_name,template:d.template,page_count:d.page_count,equipment_count:d.equipment.length})),text_source:documents.map(d=>'--- '+d.file_name+' ---\n'+d.text_source).join('\n')};
}
export async function readPartslinkPdfs(files,vin,onProgress=()=>{}){
  files=Array.from(files||[]);if(!files.length||files.length>10)throw Error('Выберите от 1 до 10 PDF PartsLink.');
  if(files.reduce((n,f)=>n+f.size,0)>100*1024*1024)throw Error('Общий размер PDF PartsLink больше 100 МБ.');
  const started=Date.now(),documents=[];let pages=0;
  for(const [i,file]of files.entries()){
    onProgress({index:i+1,total:files.length,file_name:file.name});
    let parsed;try{parsed=await readPartslinkPdf(file,vin);}catch(error){throw Error(file.name+': '+error.message);}
    pages+=parsed.page_count;if(pages>90||Date.now()-started>120000)throw Error('Комплект PartsLink слишком большой: до 90 страниц и двух минут обработки.');documents.push(parsed);
  }
  return mergePartslinkDocuments(documents,vin);
}
