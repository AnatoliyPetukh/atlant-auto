<?php
declare(strict_types=1);
if(!defined('ATLANT_DRAFT_STORE')){http_response_code(404);exit;}
require_once __DIR__.'/draft-store.php';
require_once __DIR__.'/erp-accounts.php';
function productDb():PDO {
 $db=draftDb();$db->exec('CREATE TABLE IF NOT EXISTS vehicle_products (draft_id TEXT PRIMARY KEY REFERENCES drafts(id), public_id TEXT UNIQUE NOT NULL, revision INTEGER NOT NULL, record_json TEXT NOT NULL, published_json TEXT, published_revision INTEGER, updated_at TEXT NOT NULL, published_at TEXT)');$db->exec('CREATE TABLE IF NOT EXISTS vehicle_product_versions (draft_id TEXT NOT NULL REFERENCES drafts(id), revision INTEGER NOT NULL, record_json TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(draft_id,revision))');return $db;
}
function productRemember(PDO $db,string $id,int $revision,array $record,string $actor,string $at):void {
 $db->prepare('INSERT OR IGNORE INTO vehicle_product_versions VALUES (?,?,?,?,?)')->execute([$id,$revision,json_encode($record,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$actor,$at]);
}
function productVersions(string $id):array {
 $db=productDb();$row=productGet($id);if($row)productRemember($db,$id,$row['revision'],$row['record'],'existing',$row['updated_at']);
 $q=$db->prepare('SELECT revision,actor,created_at FROM vehicle_product_versions WHERE draft_id=? ORDER BY revision DESC');$q->execute([draftId($id)]);return $q->fetchAll();
}
function productRestore(string $id,int $current,int $target,string $actor):array {
 $q=productDb()->prepare('SELECT record_json FROM vehicle_product_versions WHERE draft_id=? AND revision=?');$q->execute([draftId($id),$target]);$json=$q->fetchColumn();if(!$json)throw new OutOfBoundsException('Версия не найдена.');
 return productSave($id,$current,json_decode($json,true,512,JSON_THROW_ON_ERROR),$actor);
}
function productStates():array{return ['auction'=>'Na aukcji','purchased'=>'Zakupiony','in_transit'=>'W drodze do Warszawy','on_site'=>'Na placu w Warszawie','sold'=>'Sprzedany','closed'=>'Aukcja zakończona — nie kupiony'];}
function productErpStates():array{return ['auction'=>'На аукционе','in_transit'=>'В пути в Варшаву','on_site'=>'На площадке в Варшаве','sold'=>'Продано'];}
function productRegistrySource(array $row):string{
 $source=trim((string)($row['source_auction']??''));
 if($source!=='')return ['arval'=>'Arval','bca'=>'BCA','autorola'=>'Autorola','openlane'=>'OPENLANE'][strtolower($source)]??mbSafeCut($source,80);
 return strtolower((string)parse_url((string)($row['source_url']??''),PHP_URL_HOST))==='remktg.arval.com'?'Arval':'—';
}
function productRegistryList(string $search='',string $state='',int $offset=0):array {
 $db=productDb();$sql='SELECT d.id,d.vin,d.title,d.lot_id,d.source_url,json_extract(d.packet_json,\'$.source.auction\') AS source_auction,d.created_at,d.updated_at,(SELECT COUNT(*) FROM assets WHERE draft_id=d.id) AS asset_count FROM drafts d LEFT JOIN vehicle_products p ON p.draft_id=d.id WHERE (d.vin LIKE ? OR d.title LIKE ? OR d.lot_id LIKE ?)';
 $term='%'.mbSafeCut($search,150).'%';$args=[$term,$term,$term];
 if($state==='incoming')$sql.=' AND p.draft_id IS NULL';elseif(isset(productStates()[$state])){$sql.=" AND json_extract(p.record_json,'$.state')=?";$args[]=$state;}
 $sql.=' ORDER BY d.updated_at DESC,d.id LIMIT 50 OFFSET ?';$args[]=max(0,$offset);$q=$db->prepare($sql);$q->execute($args);return $q->fetchAll();
}
function productAssertPublishable(array $record,array $draft):void {
 if(!$record['photo_ids']||$record['description_pl']==='')throw new InvalidArgumentException('Для публикации нужны описание и хотя бы одно фото.');
 if($record['state']==='closed')throw new InvalidArgumentException('Завершённый без покупки лот оставьте в архиве.');
 if(in_array($record['state'],['purchased','in_transit','on_site'],true)&&$record['price_net']===null&&$record['price_gross']===null)throw new InvalidArgumentException('Для сайта укажите готовую цену автомобиля в Варшаве.');
 if($record['state']==='on_site'){
  $yard=array_column(array_filter($draft['assets'],fn($a)=>$a['kind']==='on_site'),'id');
  if(!array_intersect($record['photo_ids'],$yard))throw new InvalidArgumentException('Для состояния «На площадке» выберите реальные фотографии с площадки.');
 }
}
function productEquipmentLabels():array{return ['areaView'=>'Kamery Area View','camera360'=>'Kamery 360°','adaptiveCruise'=>'Adaptacyjny tempomat','panorama'=>'Dach panoramiczny','awd'=>'Napęd na cztery koła','matrix'=>'Reflektory matrycowe','adaptiveLed'=>'Adaptacyjne reflektory LED','hud'=>'Wyświetlacz Head-Up','ventilation'=>'Wentylacja foteli','memory'=>'Elektryczny fotel z pamięcią','cameraRear'=>'Kamera cofania','heatedSeats'=>'Podgrzewane fotele','heatedWheel'=>'Podgrzewana kierownica','blindSpot'=>'Monitorowanie martwego pola','tailgate'=>'Elektryczna klapa bagażnika','led'=>'Reflektory LED','parking'=>'Czujniki parkowania z przodu i z tyłu','navigation'=>'Nawigacja','climate'=>'Klimatyzacja automatyczna','cruise'=>'Tempomat','aeb'=>'Automatyczne hamowanie awaryjne','laneAssist'=>'Asystent pasa ruchu','keyless'=>'Dostęp bezkluczykowy','carplay'=>'Apple CarPlay','androidAuto'=>'Android Auto','activeParking'=>'Aktywny asystent parkowania','parkingAssist'=>'Asystent parkowania','powerSeat'=>'Elektryczna regulacja fotela','sunroof'=>'Szyberdach','leather'=>'Skórzana tapicerka','foldingMirrors'=>'Elektrycznie składane lusterka','heatedWindscreen'=>'Podgrzewana przednia szyba','premiumAudio'=>'System audio premium','rainSensor'=>'Czujnik deszczu','autoLights'=>'Automatyczne włączanie świateł'];}
function productGet(string $id):?array {$q=productDb()->prepare('SELECT * FROM vehicle_products WHERE draft_id=?');$q->execute([draftId($id)]);$row=$q->fetch();if(!$row)return null;$row['record']=json_decode($row['record_json'],true,512,JSON_THROW_ON_ERROR);unset($row['record_json']);return $row;}
function productText(mixed $value,int $max):string{if(!is_string($value))throw new InvalidArgumentException('Нужен текст.');$value=trim($value);if(preg_match_all('/./us',$value)>$max||preg_match('/https?:\/\/|remktg\.arval|partslink24\.com|[\x00-\x08\x0b\x0c\x0e-\x1f]/iu',$value))throw new InvalidArgumentException('Текст слишком длинный или содержит ссылку/служебные символы.');return $value;}
function productDate(mixed $value):?string {
 if($value===null||$value==='')return null;
 if(!is_string($value)||!preg_match('/^(\d{4})-(\d{2})(?:-(\d{2}))?$/D',$value,$m)||!checkdate((int)$m[2],(int)($m[3]??1),(int)$m[1]))throw new InvalidArgumentException('Дата должна быть ГГГГ-ММ или ГГГГ-ММ-ДД.');return $value;
}
function productNumber(mixed $value,int $max,bool $integer=true):int|float|null {
 if($value===null||$value==='')return null;
 if(!is_scalar($value)||is_bool($value)||!preg_match($integer?'/^\d+$/D':'/^\d+(?:[.,]\d{1,2})?$/D',(string)$value))throw new InvalidArgumentException('Проверьте числовые характеристики.');
 $n=(float)str_replace(',','.',(string)$value);if($n>$max)throw new InvalidArgumentException('Характеристика вне допустимого диапазона.');return $integer?(int)$n:$n;
}
function productSeed(array $draft):array {
 $p=$draft['packet'];$v=$p['vehicle'];$facts=$v['publication_facts']??[];$date=$facts['display_date']??null;
 $ids=$p['website_seed']['equipment_ids']??array_column($v['equipment_highlights']['items']??[],'id');$labels=productEquipmentLabels();$equipment=[];foreach(array_slice($ids,0,15) as $id)if(is_string($id)&&isset($labels[$id]))$equipment[]=$labels[$id];
 $fuelMap=['бензин'=>'Benzyna','дизель'=>'Diesel','мягкий гибрид (бензин)'=>'Benzyna · mild hybrid','мягкий гибрид (дизель)'=>'Diesel · mild hybrid','электро'=>'Elektryczny','Petrol'=>'Benzyna','Diesel'=>'Diesel','Electric'=>'Elektryczny'];
 $fuel=$fuelMap[$facts['engine']['label']??$v['fuel']??'']??null;$trans=['Manual'=>'Manualna','Automatic'=>'Automatyczna'][$v['transmission']??'']??null;
 $photos=array_values(array_map(fn($a)=>$a['id'],array_filter($draft['assets'],fn($a)=>$a['kind']==='vehicle'&&in_array($a['mime'],['image/jpeg','image/png','image/webp'],true))));
 $price=$p['auction']['price']??[];$amount=is_numeric($price['amount']??null)?(float)$price['amount']:null;
 $service=$p['condition']??[];$entries=$service['maintenance_entries']??[];$complete=($service['maintenance_count']??count($entries))===count($entries);
 usort($entries,fn($a,$b)=>strcmp((string)($b['date_month']??''),(string)($a['date_month']??'')));$last=$complete?($entries[0]??null):null;
 $auctionEnd=$p['auction']['ends_at']??null;
 if(!$auctionEnd&&preg_match('/^(?:(\d+)\s*d\s*)?(?:(\d+)\s*h\s*)?(\d+)\s*mn\s*(\d+)\s*s$/D',trim((string)($p['auction']['countdown_source']??'')),$timer)){
  $capture=strtotime((string)($p['source']['captured_at']??''));$seconds=(int)$timer[1]*86400+(int)$timer[2]*3600+(int)$timer[3]*60+(int)$timer[4];if($capture&&$seconds>0&&$seconds<=90*86400)$auctionEnd=gmdate('c',$capture+$seconds);
 }
 $colorMap=['white'=>'Biały','black'=>'Czarny','grey'=>'Szary','gray'=>'Szary','silver'=>'Srebrny','blue'=>'Niebieski','red'=>'Czerwony','green'=>'Zielony','brown'=>'Brązowy','beige'=>'Beżowy'];
 $countryMap=['france'=>'Francja','germany'=>'Niemcy','belgium'=>'Belgia','netherlands'=>'Holandia','poland'=>'Polska','italy'=>'Włochy','spain'=>'Hiszpania'];
 $newFacts=['keys'=>is_int($v['keys']??null)?$v['keys']:null,'power_kw'=>is_numeric($v['power_kw']??null)?(float)$v['power_kw']:null,'power_hp'=>is_numeric($v['power_hp']??null)?(float)$v['power_hp']:null,'color_pl'=>$colorMap[strtolower(trim($v['color']??''))]??'','registration_country_pl'=>$countryMap[strtolower(trim($v['registration_country_source']??''))]??'','awd'=>is_bool($v['awd']??null)?$v['awd']:null,'vat_deductible'=>is_bool($v['vat_deductible']??null)?$v['vat_deductible']:null,'tyres_pl'=>''];
 $title=productText($draft['title'],250);$mileage=is_int($v['mileage_km']??null)?$v['mileage_km']:null;
 $description=$title.'. '.($mileage!==null?'Przebieg: '.number_format($mileage,0,',',' ').' km. ':'').implode(', ',array_filter([$fuel,$trans])).'.';
 return $newFacts+['title'=>$title,'description_pl'=>trim($description),'state'=>'auction','availability'=>'free','production_date'=>($date['kind']??'')==='production'?($date['value']??null):null,'first_registration'=>($facts['first_registration']['value']??null),'mileage_km'=>$mileage,'fuel_pl'=>$fuel,'transmission_pl'=>$trans,'engine_cm3'=>is_int($v['engine_cm3']??null)?$v['engine_cm3']:null,'equipment_pl'=>array_values(array_unique($equipment)),'damage_count'=>count($service['damages']??[]),'service_count'=>is_int($service['maintenance_count']??null)?$service['maintenance_count']:count($entries),'service_last_date'=>$last['date_month']??null,'service_last_mileage'=>$last['mileage_km']??null,'auction_end_estimate'=>$auctionEnd,'auction_bid'=>$amount,'auction_currency'=>in_array($price['currency']??'', ['EUR','PLN'],true)?$price['currency']:'EUR','auction_observed_at'=>$price['observed_at']??$p['source']['captured_at']??null,'price_net'=>null,'price_gross'=>null,'currency'=>'EUR','eta'=>null,'location_pl'=>'Samochód na aukcji europejskiej','delivery_eur'=>is_int($p['logistics']['delivery_to_warsaw']['amount_minor']??null)?$p['logistics']['delivery_to_warsaw']['amount_minor']/100:null,'photo_ids'=>array_slice($photos,0,30),'document_ids'=>[]];
}
function productCreate(string $id,string $actor):array {
 $draft=draftDetail($id);$db=productDb();$db->exec('BEGIN IMMEDIATE');try{
  if($row=productGet($id)){$db->exec('COMMIT');return $row;}
  $record=productSeed($draft);$db->prepare('INSERT INTO vehicle_products VALUES (?,?,?,?,NULL,NULL,?,NULL)')->execute([$id,bin2hex(random_bytes(16)),1,json_encode($record,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),gmdate('c')]);
  productRemember($db,$id,1,$record,$actor,gmdate('c'));
  draftEvent($db,$id,'product_created',$actor,['state'=>'auction']);$db->exec('COMMIT');return productGet($id);
 }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
}
function productMoney(mixed $value):?float{if($value===null||$value==='')return null;if(!is_scalar($value)||!preg_match('/^\d{1,8}(?:[.,]\d{1,2})?$/D',(string)$value))throw new InvalidArgumentException('Проверьте цену.');return round((float)str_replace(',','.',(string)$value),2);}
function productValidated(array $record,array $draft):array {
 $record['title']=productText($record['title']??'',250);if($record['title']==='')throw new InvalidArgumentException('Укажите название.');
 $record['description_pl']=productText($record['description_pl']??'',3000);$record['location_pl']=productText($record['location_pl']??'',160);
 if(!isset(productStates()[$record['state']??''])||!in_array($record['availability']??'', ['free','reserved'],true))throw new InvalidArgumentException('Проверьте состояние и резерв.');
 foreach(['price_net','price_gross','delivery_eur'] as $key)$record[$key]=productMoney($record[$key]??null);
 if(!in_array($record['currency']??'', ['EUR','PLN'],true))throw new InvalidArgumentException('Неизвестная валюта.');
 if(!empty($record['eta'])&&(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$record['eta'])||date('Y-m-d',strtotime($record['eta']))!==$record['eta']))throw new InvalidArgumentException('Проверьте дату прибытия.');
 foreach(['production_date','first_registration'] as $key)$record[$key]=productDate($record[$key]??null);
 foreach(['keys'=>20,'mileage_km'=>3000000,'engine_cm3'=>20000] as $key=>$max)$record[$key]=productNumber($record[$key]??null,$max);
 foreach(['power_kw','power_hp'] as $key)$record[$key]=productNumber($record[$key]??null,5000,false);
 foreach(['fuel_pl'=>100,'transmission_pl'=>100,'color_pl'=>100,'registration_country_pl'=>100,'tyres_pl'=>1500] as $key=>$max)$record[$key]=productText($record[$key]??'',$max);
 foreach(['awd','vat_deductible'] as $key){$v=$record[$key]??null;if($v==='')$v=null;if($v==='true')$v=true;if($v==='false')$v=false;if($v!==null&&!is_bool($v))throw new InvalidArgumentException('Проверьте привод и НДС.');$record[$key]=$v;}
 $equipment=$record['equipment_pl']??[];if(!is_array($equipment)||count($equipment)>30)throw new InvalidArgumentException('Слишком много опций.');$record['equipment_pl']=array_values(array_unique(array_map(fn($s)=>productText($s,150),$equipment)));
 foreach(['photo_ids','document_ids'] as $key){
  $ids=$record[$key]??[];if(!is_array($ids)||count($ids)>30)throw new InvalidArgumentException('Проверьте файлы.');$record[$key]=array_values(array_unique($ids));
  foreach($record[$key] as $aid){draftId($aid);$matches=array_values(array_filter($draft['assets'],fn($a)=>$a['id']===$aid));$asset=$matches[0]??null;
   if(!$asset||($key==='photo_ids'?(!in_array($asset['kind'],['vehicle','on_site'],true)||!in_array($asset['mime'],['image/jpeg','image/png','image/webp'],true)):(!in_array($asset['kind'],['inspection','partslink'],true)||$asset['mime']!=='application/pdf')))throw new InvalidArgumentException('Для публикации выбраны неподходящие файлы.');
  }
 }
 return $record;
}
function productSave(string $id,int $revision,array $changes,string $actor,bool $syncPublished=false):array {
 $db=productDb();$db->exec('BEGIN IMMEDIATE');try{
  $row=productGet($id);if(!$row)throw new OutOfBoundsException('Сначала создайте карточку.');if($row['revision']!==$revision)throw new DomainException('Карточка изменилась. Обновите страницу.');
  $sync=$syncPublished&&!empty($row['published_json']);
  if($sync&&!erpCanPublish($actor))throw new InvalidArgumentException('Для изменения опубликованного автомобиля нужны права публикации.');
  $allowed=['title','description_pl','state','availability','price_net','price_gross','currency','eta','location_pl','delivery_eur','equipment_pl','photo_ids','document_ids','keys','power_kw','power_hp','color_pl','registration_country_pl','awd','vat_deductible','tyres_pl','production_date','first_registration','mileage_km','engine_cm3','fuel_pl','transmission_pl'];$r=$row['record'];foreach($allowed as $key)if(array_key_exists($key,$changes))$r[$key]=$changes[$key];
  productRemember($db,$id,$revision,$row['record'],'existing',$row['updated_at']);
  $r=productValidated($r,draftDetail($id));$q=$db->prepare('UPDATE vehicle_products SET revision=revision+1,record_json=?,updated_at=? WHERE draft_id=?');$q->execute([json_encode($r,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),gmdate('c'),$id]);
  productRemember($db,$id,$revision+1,$r,$actor,gmdate('c'));
  if($sync){
   if($r['state']==='closed'){$db->prepare('UPDATE vehicle_products SET published_json=NULL,published_revision=NULL,published_at=NULL WHERE draft_id=?')->execute([$id]);}
   else{productAssertPublishable($r,draftDetail($id));$public=productPublicSnapshot(['record'=>$r,'public_id'=>$row['public_id']]);$db->prepare('UPDATE vehicle_products SET published_json=?,published_revision=?,published_at=? WHERE draft_id=?')->execute([json_encode($public,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$revision+1,gmdate('c'),$id]);}
   draftEvent($db,$id,'erp_site_synced',$actor,['revision'=>$revision+1,'state'=>$r['state']]);
  }
  draftEvent($db,$id,'product_saved',$actor,['state'=>$r['state'],'previous_state'=>$row['record']['state'],'revision'=>$revision+1]);$db->exec('COMMIT');return productGet($id);
 }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
}
function productPublicSnapshot(array $row):array {
 $r=$row['record'];$public=['id'=>$row['public_id']];
 foreach(['title','description_pl','state','availability','production_date','first_registration','mileage_km','fuel_pl','transmission_pl','engine_cm3','equipment_pl','damage_count','service_count','service_last_date','service_last_mileage','price_net','price_gross','currency','eta','location_pl','delivery_eur','photo_ids','document_ids','keys','power_kw','power_hp','color_pl','registration_country_pl','awd','vat_deductible','tyres_pl'] as $key)$public[$key]=$r[$key]??null;
 if($r['state']==='auction'){foreach(['auction_bid','auction_currency','auction_observed_at','auction_end_estimate'] as $key)$public[$key]=$r[$key]??null;}
 $public['state_label']=productStates()[$r['state']];return $public;
}
function productPublish(string $id,int $revision,string $actor):array {
 if(!erpCanPublish($actor))throw new InvalidArgumentException('Для публикации нужны права публикации.');$db=productDb();$db->exec('BEGIN IMMEDIATE');try{
  $row=productGet($id);if(!$row)throw new OutOfBoundsException();if($row['revision']!==$revision)throw new DomainException('Сначала сохраните изменения и обновите страницу.');
  $r=productValidated($row['record'],draftDetail($id));productAssertPublishable($r,draftDetail($id));
  $public=productPublicSnapshot($row);$at=gmdate('c');$db->prepare('UPDATE vehicle_products SET published_json=?,published_revision=?,published_at=? WHERE draft_id=?')->execute([json_encode($public,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$revision,$at,$id]);
  draftEvent($db,$id,'product_published',$actor,['revision'=>$revision]);$db->exec('COMMIT');return productGet($id);
 }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
}
function productUnpublish(string $id,string $actor):void{if(!erpCanPublish($actor))throw new InvalidArgumentException('Для этого действия нужны права публикации.');$db=productDb();$db->beginTransaction();try{$db->prepare('UPDATE vehicle_products SET published_json=NULL,published_revision=NULL,published_at=NULL WHERE draft_id=?')->execute([draftId($id)]);draftEvent($db,$id,'product_unpublished',$actor,[]);$db->commit();}catch(Throwable $e){$db->rollBack();throw $e;}}
function productPublicList(?string $id=null):array{$sql='SELECT published_json FROM vehicle_products WHERE published_json IS NOT NULL';$args=[];if($id!==null){$sql.=' AND public_id=?';$args[] =draftId($id);}$sql.=' ORDER BY published_at DESC LIMIT 200';$q=productDb()->prepare($sql);$q->execute($args);return array_map(fn($json)=>json_decode($json,true,512,JSON_THROW_ON_ERROR),$q->fetchAll(PDO::FETCH_COLUMN));}
