export function arrivalLabel(record,locale='pl-PL'){
 const parse=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value?d:null;};
 const from=parse(record?.eta_from||record?.eta),to=parse(record?.eta_to);
 if(!from||(record?.eta_to&&!to)||to&&to<from)return null;
 const format=new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',timeZone:'UTC'}),dayMonth=d=>format.format(d),year=d=>d.getUTCFullYear();
 if(!to||+from===+to)return `${dayMonth(from)} ${year(from)}`;
 if(year(from)!==year(to))return `${dayMonth(from)} ${year(from)} – ${dayMonth(to)} ${year(to)}`;
 if(from.getUTCMonth()===to.getUTCMonth())return `${from.getUTCDate()}–${dayMonth(to)} ${year(to)}`;
 return `${dayMonth(from)}–${dayMonth(to)} ${year(to)}`;
}
