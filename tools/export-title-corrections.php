<?php
declare(strict_types=1);
// CLI only. Read historical capture packets without changing the vehicle database.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$path=$argv[1]??'';
if(!is_file($path))throw new RuntimeException('Provide an existing drafts.sqlite path');
$db=new PDO('sqlite:'.$path,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec('PRAGMA query_only=ON');
$out=fopen('php://stdout','wb');fwrite($out,"\xEF\xBB\xBF");
function cell(mixed $value):string{
 $s=preg_replace('/\s+/u',' ',trim((string)$value));
 return preg_match('/^[=+@-]/u',$s)?"'".$s:$s;
}
function row($out,array $values):void{fputcsv($out,array_map('cell',$values),',','"','');}
row($out,['VIN','Дата сохранения','Сотрудник','Марка','Исходное название аукциона','После автоматической очистки','После ручной правки','Версия правила']);
$seen=[];
$q=$db->query("SELECT packet_json,actor,created_at FROM snapshots ORDER BY created_at,id");
while($r=$q->fetch(PDO::FETCH_ASSOC)){
 $p=json_decode($r['packet_json'],true);$v=$p['vehicle']??[];
 $manual=trim((string)($v['title_override']??''));
 if($manual==='')continue;
 $source=trim((string)($v['title']??''));$auto=trim((string)($v['title_details']['display_title']??''));
 if($manual===$auto)continue;
 $key=json_encode([$v['vin']??'',$source,$auto,$manual]);if(isset($seen[$key]))continue;$seen[$key]=true;
 row($out,[$v['vin']??'',$r['created_at'],$r['actor'],$v['make']??'',$source,$auto,$manual,$v['title_details']['strategy']??'']);
}
fclose($out);
fwrite(STDERR,'Exported '.count($seen)." unique manual title corrections\n");
