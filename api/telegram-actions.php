<?php
declare(strict_types=1);
if (!defined('ATLANT_DRAFT_STORE')) {http_response_code(404);exit;}
require_once __DIR__.'/draft-store.php';
function actionDb(): PDO {
    $db=draftDb();
    $db->exec('CREATE TABLE IF NOT EXISTS telegram_offers (token TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, draft_id TEXT NOT NULL REFERENCES drafts(id), created_at TEXT NOT NULL, resources_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS damage_requests (id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES drafts(id), offer_token TEXT NOT NULL REFERENCES telegram_offers(token), user_id TEXT NOT NULL, user_json TEXT NOT NULL, day TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(draft_id,user_id,day));
      CREATE TABLE IF NOT EXISTS telegram_updates (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, created_at INTEGER NOT NULL, status TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS telegram_updates_user ON telegram_updates(user_id,created_at);');
    return $db;
}
function actionInspectionUrl(string $url): ?string {
    $u=parse_url($url);
    return $u && ($u['scheme']??'')==='https' && ($u['host']??'')==='www4.macadam.eu' && !isset($u['user']) && !isset($u['pass']) && (!isset($u['port']) || $u['port']===443) && str_starts_with($u['path']??'','/Manager/') && strlen($url)<=2048?$url:null;
}
function actionOffer(string $vin,string $requestId,array $options): array {
    $db=actionDb();$q=$db->prepare('SELECT * FROM telegram_offers WHERE request_id=?');$q->execute([$requestId]);
    if ($row=$q->fetch()) {draftFind($row['draft_id']);return $row;}
    $q=$db->prepare('SELECT id FROM drafts WHERE vin=?');$q->execute([$vin]);$id=$q->fetchColumn();
    if (!$id)throw new OutOfBoundsException('Save draft before posting');
    $draft=draftDetail($id);$p=$draft['packet'];
    $resources=['title'=>$draft['title'],'vin'=>$vin,'inspection_files'=>[],'parts_files'=>[],'inspection_url'=>null,'equipment'=>[],'maintenance'=>null,'damage_files'=>actionDamageFiles($id)];
    foreach ($draft['assets'] as $asset) {
        if ($asset['mime']!=='application/pdf')continue;
        if (!empty($options['inspection']) && $asset['kind']==='inspection' && count($resources['inspection_files'])<3)$resources['inspection_files'][]=$asset['id'];
        if (!empty($options['parts']) && $asset['kind']==='partslink' && count($resources['parts_files'])<10)$resources['parts_files'][]=$asset['id'];
    }
    if (!empty($options['inspection'])) foreach (($p['documents']??[]) as $doc) {
        if (($doc['kind']??'')==='macadam_report' && ($url=actionInspectionUrl((string)($doc['url']??'')))) {$resources['inspection_url']=$url;break;}
    }
    if (!empty($options['parts'])) foreach (array_slice($p['enrichment']['partslink24_pdf']['equipment']??$p['enrichment']['partslink24']['equipment']??[],0,1000) as $option) {
        if (!is_array($option))continue;
        $resources['equipment'][]=['code'=>mbSafeCut((string)($option['code']??''),50),'label'=>mbSafeCut((string)($option['label']??''),300)];
    }
    if (!empty($options['maintenance'])) {
        $history=$p['condition']??[];$rows=[];
        foreach(array_slice($history['maintenance_entries']??[],0,200) as $entry) {
            if(!is_array($entry) || !is_int($entry['mileage_km']??null) || $entry['mileage_km']<0 || $entry['mileage_km']>10000000)continue;
            $rows[]=['date_source'=>mbSafeCut((string)($entry['date_source']??''),40),'mileage_km'=>$entry['mileage_km'],'description_source'=>mbSafeCut((string)($entry['description_source']??''),3000)];
        }
        $resources['maintenance']=['entries'=>$rows,'declared_count'=>is_int($history['maintenance_count']??null)?$history['maintenance_count']:null,'source'=>mbSafeCut((string)($history['maintenance_source']??''),50000)];
    }
    $token=bin2hex(random_bytes(16));$at=gmdate('c');$json=json_encode($resources,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
    $db->prepare('INSERT INTO telegram_offers VALUES (?,?,?,?,?)')->execute([$token,$requestId,$id,$at,$json]);
    draftEvent($db,$id,'telegram_materials_shared','telegram',['offer_token'=>$token,'inspection'=>(bool)($options['inspection']??false),'parts'=>(bool)($options['parts']??false),'maintenance'=>(bool)($options['maintenance']??false)]);
    return ['token'=>$token,'draft_id'=>$id,'resources_json'=>$json];
}
function actionKeyboard(string $token,string $bot): array {
    if (!preg_match('/^[a-f0-9]{32}$/D',$token) || !preg_match('/^[A-Za-z0-9_]{5,32}$/D',$bot))throw new InvalidArgumentException('Invalid buttons');
    $rows=[];
    foreach (['damage'=>'📷 Запросить фото повреждений','inspection'=>'📋 Инспекция','parts'=>'🧩 Данные PartsLink','service'=>'🔧 Сервисная история'] as $action=>$label)$rows[]=[['text'=>$label,'url'=>'https://t.me/'.$bot.'?start='.$action.'_'.$token]];
    return ['inline_keyboard'=>$rows];
}
function actionBotCall(array $config,string $method,array $data): array {
    if (!in_array($method,['sendMessage','sendDocument','sendPhoto','sendMediaGroup'],true))throw new InvalidArgumentException('Bot method denied');
    $curl=curl_init('https://api.telegram.org/bot'.$config['bot_token'].'/'.$method);
    curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$data,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
    $raw=curl_exec($curl);curl_close($curl);$result=is_string($raw)?json_decode($raw,true):null;
    if (!is_array($result) || !isset($result['ok']))throw new RuntimeException('Telegram result uncertain');return $result;
}
function actionDamage(array $offer,array $user): array {
    $db=actionDb();$db->exec('BEGIN IMMEDIATE');
    try {
        $userId=(string)$user['id'];$day=gmdate('Y-m-d');$q=$db->prepare('SELECT * FROM damage_requests WHERE draft_id=? AND user_id=? AND day=?');$q->execute([$offer['draft_id'],$userId,$day]);
        if ($row=$q->fetch()) {$db->exec('COMMIT');return $row+['duplicate'=>true];}
        $id=bin2hex(random_bytes(16));$at=gmdate('c');
        $person=['id'=>$userId,'username'=>mbSafeCut((string)($user['username']??''),64),'name'=>mbSafeCut(trim((string)($user['first_name']??'').' '.(string)($user['last_name']??'')),150)];
        $db->prepare('INSERT INTO damage_requests VALUES (?,?,?,?,?,?,?,?)')->execute([$id,$offer['draft_id'],$offer['token'],$userId,json_encode($person,JSON_UNESCAPED_UNICODE),$day,'queued',$at]);
        draftEvent($db,$offer['draft_id'],'damage_requested','telegram-user:'.$userId,['request_id'=>$id,'user'=>$person,'status'=>'queued']);
        $db->exec('COMMIT');return ['id'=>$id,'status'=>'queued','duplicate'=>false];
    }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
}
// Only explicitly classified, stored damage images may leave the private store.
function actionDamageFiles(string $draftId): array {
    $q=actionDb()->prepare("SELECT id FROM assets WHERE draft_id=? AND kind='damage' AND mime IN ('image/jpeg','image/png','image/webp') ORDER BY rowid LIMIT 200");
    $q->execute([$draftId]);return $q->fetchAll(PDO::FETCH_COLUMN);
}
function actionDeliverDamage(array $offer,array $resources,int $offset,string $userId,array $config,callable $call): bool {
    $db=actionDb();
    // Upgrade old buttons once; retain a fixed list for subsequent pages.
    if(!array_key_exists('damage_files',$resources)) {
        $db->exec('BEGIN IMMEDIATE');
        try {
            $q=$db->prepare('SELECT resources_json FROM telegram_offers WHERE token=?');$q->execute([$offer['token']]);
            $resources=json_decode($q->fetchColumn(),true,512,JSON_THROW_ON_ERROR);
            if(!array_key_exists('damage_files',$resources)) {
                $resources['damage_files']=actionDamageFiles($offer['draft_id']);
                if($resources['damage_files']) {
                    $db->prepare('UPDATE telegram_offers SET resources_json=? WHERE token=?')->execute([json_encode($resources,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$offer['token']]);
                    draftEvent($db,$offer['draft_id'],'telegram_damage_shared','telegram',['offer_token'=>$offer['token'],'count'=>count($resources['damage_files'])]);
                }
            }
            $db->exec('COMMIT');
        }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
    }
    $available=[];
    foreach(array_slice($resources['damage_files']??[],0,200) as $aid) {
        $q=$db->prepare("SELECT * FROM assets WHERE id=? AND draft_id=? AND kind='damage' AND mime IN ('image/jpeg','image/png','image/webp')");
        $q->execute([$aid,$offer['draft_id']]);$asset=$q->fetch();
        if(!$asset)continue;
        $path=draftRoot().'/objects/'.$offer['draft_id'].'/'.$asset['id'];
        if(is_file($path))$available[]=$asset+['path'=>$path];
    }
    if(!$available)return false;
    $total=count($available);$page=array_slice($available,$offset,10);
    if(!$page) {
        $result=$call('sendMessage',['chat_id'=>$userId,'text'=>'Все доступные фото повреждений уже показаны.']);
        if(empty($result['ok']))throw new RuntimeException('Damage reply rejected');return true;
    }
    $caption=mbSafeCut($resources['title'],200)."\nФото повреждений · ".($offset+1).'–'.($offset+count($page)).' из '.$total;
    $photos=[];$documents=[];
    foreach($page as $asset) {
        // Photo albums cannot accept WebP or images above the photo upload limit.
        if($asset['mime']==='image/webp' || $asset['bytes']>10*1024*1024)$documents[]=$asset;else $photos[]=$asset;
    }
    if(count($photos)>1) {
        $data=['chat_id'=>$userId];$media=[];
        foreach($photos as $i=>$asset) {
            $key='damage'.$i;$data[$key]=new CURLFile($asset['path'],$asset['mime'],'damage-'.($offset+$i+1).($asset['mime']==='image/png'?'.png':'.jpg'));
            $item=['type'=>'photo','media'=>'attach://'.$key];if($i===0)$item['caption']=$caption;$media[]=$item;
        }
        $data['media']=json_encode($media,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);$result=$call('sendMediaGroup',$data);
        if(empty($result['ok']))throw new RuntimeException('Damage album rejected');
    }elseif($photos) {
        $asset=$photos[0];$result=$call('sendPhoto',['chat_id'=>$userId,'photo'=>new CURLFile($asset['path'],$asset['mime'],'damage'.($asset['mime']==='image/png'?'.png':'.jpg')),'caption'=>$caption]);
        if(empty($result['ok']))throw new RuntimeException('Damage photo rejected');
    }
    foreach($documents as $asset) {
        $ext=['image/jpeg'=>'.jpg','image/png'=>'.png','image/webp'=>'.webp'][$asset['mime']];
        $result=$call('sendDocument',['chat_id'=>$userId,'document'=>new CURLFile($asset['path'],$asset['mime'],'damage'.$ext),'caption'=>$caption]);
        if(empty($result['ok']))throw new RuntimeException('Damage original rejected');
    }
    $next=$offset+count($page);
    if($next<$total) {
        $bot=(string)($config['bot_username']??'');if(!preg_match('/^[A-Za-z0-9_]{5,32}$/D',$bot))throw new RuntimeException('Bot username missing');
        $result=$call('sendMessage',['chat_id'=>$userId,'text'=>'Остальные фото повреждений — следующей подборкой.',
            'reply_markup'=>json_encode(['inline_keyboard'=>[[['text'=>'📷 Ещё фото ('.($next+1).'–'.min($next+10,$total).')','url'=>'https://t.me/'.$bot.'?start=damage_'.$offer['token'].'_'.$next]]]],JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE)]);
        if(empty($result['ok']))throw new RuntimeException('Damage pagination rejected');
    }
    draftEvent($db,$offer['draft_id'],'damage_delivered','telegram-user:'.$userId,['offer_token'=>$offer['token'],'offset'=>$offset,'count'=>count($page)]);
    return true;
}
// Plain text stays editable; Telegram entities supply emphasis without parsing HTML.
function actionPostPresentation(string $caption,array $packet,bool $includeAuction=true): array {
    $lines=[];$ordinal=0;$titleText=null;
    foreach(explode("\n",str_replace(["\r\n","\r"],"\n",$caption)) as $line) {
        $line=trim(preg_replace('/[\p{Zs}\t]+/u',' ',$line));if($line==='')continue;
        $ordinal++;
        if(preg_match('/^НДС к вычету/u',$line))continue;
        $line=str_replace(['нетто/брутто уточняется','Центр — Долина Луары','Ставка на момент подготовки; это не итоговая стоимость автомобиля.'],['нетто','Центр','Ставка на момент подготовки, не итоговая стоимость.'],$line);
        if(preg_match('/^(\d{2}\.\d{4}) · первая регистрация(?: · (.+))?$/u',$line,$spec)) {
            $line='Первая регистрация: '.$spec[1];
            if(!empty($spec[2])){$parts=explode(' · ',$spec[2]);$mileage=array_shift($parts);$line.="\nПробег: ".$mileage;if($parts)$line.="\n".implode(' · ',$parts);}
        }
        $line=preg_replace('/^(Состояние: \d+ замечаний) по инспекции\.$/u','$1.',$line);

        $line=preg_replace_callback('/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})\b/',fn($m)=>actionMaintenanceDate($m[0]),$line);
        if(str_starts_with($line,'💶 ')) {
            $line=preg_replace('/^(💶 [^:]+):\s*/u',"$1\n",$line);
            if($lines)$lines[]='';
        }elseif(preg_match('/^(📍|В комплектации:|Состояние:|Сервисная история)/u',$line) && $lines)$lines[]='';
        $line=preg_replace('/^В комплектации:\s*/u',"✨ Комплектация\n",$line);
        $line=preg_replace('/^Состояние:\s*/u','🔎 Инспекция: ',$line);
        $line=preg_replace('/^Сервисная история Arval:\s*/u',"🔧 Сервисная история Arval\n",$line);
        $line=str_replace('; последняя запись — ',"\nПоследняя запись: ",$line);
        if($ordinal===2){$lines[]='';$titleText=$line;}
        $lines[]=$line;
        if($ordinal===2)$lines[]='';
    }
    $text=implode("\n",$lines);
    // Compact block boundaries before calculating UTF-16 offsets for Telegram.
    $text=preg_replace('/(✨ Комплектация)\n+/u',"$1\n",$text);
    $text=preg_replace('/🔧 Сервисная история Arval\n(\d+ записей[^\n]*)/u','🔧 Сервисная история · $1',$text);
    $text=trim(preg_replace('/\n{3,}/',"\n\n",$text));$entities=[];
    $utf16=fn(string $value):int=>(int)(strlen(iconv('UTF-8','UTF-16LE',$value))/2);
    $offset=0;
    foreach(explode("\n",$text) as $i=>$line) {
        if($line!=='' && ($line===$titleText || preg_match('/^(?:[\d\s\x{00A0}\x{202F},.]+ (?:EUR|PLN|USD)\b|✨ Комплектация|🔧 Сервисная история)/u',$line)))
            $entities[]=['type'=>'bold','offset'=>$offset,'length'=>$utf16($line)];
        $offset+=$utf16($line)+1;
    }
    if(!$includeAuction)return ['caption'=>$text,'caption_entities'=>$entities];
    $auction=$packet['auction']??[];$timestamp=null;$estimated=false;
    // Only accept an absolute instant with timezone, never infer a timezone from display text.
    $end=$auction['ends_at']??null;
    if(is_string($end) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/D',$end))$timestamp=strtotime($end)?:null;
    $capture=strtotime((string)($packet['source']['captured_at']??''));
    if(!$timestamp && $capture && $capture<=time()+300) {
        $raw=trim((string)($auction['countdown_source']??''));
        if(preg_match('/^(?:(\d+)\s*d\s*)?(?:(\d+)\s*h\s*)?(\d+)\s*mn\s*(\d+)\s*s$/D',$raw,$m)) {
            $duration=(int)$m[1]*86400+(int)$m[2]*3600+(int)$m[3]*60+(int)$m[4];
            if($duration>0 && $duration<=90*86400 && (int)$m[3]<60 && (int)$m[4]<60){$timestamp=$capture+$duration;$estimated=true;}
        }
    }
    if($timestamp) {
        $date=(new DateTimeImmutable('@'.$timestamp))->setTimezone(new DateTimeZone('Europe/Warsaw'))->format('d.m.Y, H:i');
        $prefix="\n\n⏳ ".($estimated?'По таймеру Arval':'Окончание торгов').": ";
        $text.=$prefix;$start=$utf16($text);$text.=$date;
        $entities[]=['type'=>'date_time','offset'=>$start,'length'=>$utf16($date),'unix_time'=>$timestamp,'date_time_format'=>'r'];
        $text.="\n".$date.' · Варшава';

    }else $text.="\n\n⏳ Время окончания торгов не распознано.";
    return ['caption'=>$text,'caption_entities'=>$entities];
}
// Albums accept caption text links even though they do not accept inline keyboards.
function actionPostMaterials(array $presentation,string $token,string $bot): array {
    $keyboard=actionKeyboard($token,$bot);$text=$presentation['caption'];$entities=$presentation['caption_entities'];
    $length=fn(string $s):int=>(int)(strlen(iconv('UTF-8','UTF-16LE',$s))/2);
    $text.="\n\n📎 Материалы\n";
    foreach(['Фото повреждений','Инспекция','PartsLink','Сервисная история'] as $i=>$label){
        if($i>0)$text.=$i===2?"\n":' · ';
        $entities[]=['type'=>'text_link','offset'=>$length($text),'length'=>$length($label),'url'=>$keyboard['inline_keyboard'][$i][0]['url']];
        $text.=$label;
    }
    return ['caption'=>$text,'caption_entities'=>$entities];
}
// Render saved source records at delivery time; never rewrite the original snapshot.
function actionMaintenanceDate(string $source): string {
    $months=['jan'=>'Январь','feb'=>'Февраль','mar'=>'Март','apr'=>'Апрель','may'=>'Май','jun'=>'Июнь','jul'=>'Июль','aug'=>'Август','sep'=>'Сентябрь','oct'=>'Октябрь','nov'=>'Ноябрь','dec'=>'Декабрь'];
    if(preg_match('/^([a-z]{3})[- ](\d{2}|\d{4})$/iD',trim($source),$m) && isset($months[strtolower($m[1])])) {
        return $months[strtolower($m[1])].' '.(strlen($m[2])===2?'20'.$m[2]:$m[2]);
    }
    return $source;
}
function actionMaintenanceItems(string $source): array {
    $terms=[
        'revision'=>'Техническое обслуживание', 'vidange'=>'Замена масла',
        "pneu 4 saisons"=>'Всесезонные шины', 'pneus 4 saisons'=>'Всесезонные шины',
        'pneu ete'=>'Летние шины', 'pneu hiver'=>'Зимние шины',
        "bougie d'allumage"=>'Свечи зажигания', "bougies d'allumage"=>'Свечи зажигания',
        "bougie de prechauffage"=>'Свечи накаливания',
        "filtre d'habitacle"=>'Салонный фильтр', 'filtre habitacle'=>'Салонный фильтр',
        'filtre a air'=>'Воздушный фильтр', 'filtre a huile'=>'Масляный фильтр',
        'filtre a carburant'=>'Топливный фильтр', 'filtre a gazole'=>'Топливный фильтр',
        'liquide de frein'=>'Тормозная жидкость', 'liquide de refroidissement'=>'Охлаждающая жидкость',
        'plaquettes freins av'=>'Передние тормозные колодки', 'plaquettes freins ar'=>'Задние тормозные колодки',
        'plaquettes de frein av'=>'Передние тормозные колодки', 'plaquettes de frein ar'=>'Задние тормозные колодки',
        'disques freins av'=>'Передние тормозные диски', 'disques freins ar'=>'Задние тормозные диски',
        "balai d'essuie-glace ar"=>'Задняя щётка стеклоочистителя',
        "balais d'essuie-glace ar"=>'Задняя щётка стеклоочистителя',
        "balai d'essuie-glace av"=>'Передние щётки стеклоочистителя',
        "balais d'essuie-glace av"=>'Передние щётки стеклоочистителя',
        'recyclage'=>'Утилизация (объект в источнике не указан)',
        'batterie'=>'Аккумулятор', 'courroie de distribution'=>'Ремень ГРМ',
        'kit de distribution'=>'Комплект ГРМ', 'pompe a eau'=>'Водяной насос',
        'controle technique'=>'Технический осмотр', 'diagnostic'=>'Диагностика',
    ];
    $items=[];
    foreach(preg_split('~[/\r\n]+~u',$source)?:[] as $part) {
        $part=trim($part);if($part==='')continue;
        $key=strtolower(strtr($part,['’'=>"'",'É'=>'e','é'=>'e','è'=>'e','ê'=>'e','à'=>'a','â'=>'a','ô'=>'o','û'=>'u','ù'=>'u','î'=>'i','ï'=>'i','ç'=>'c','–'=>'-']));
        $key=preg_replace('/\s+/u',' ',$key);
        // Exact terms only: unknown wording remains visible instead of a guessed repair.
        $items[]=$terms[$key]??($part.' [оригинал; перевод не уточнён]');
    }
    return array_values(array_unique($items));
}
function actionMaintenanceText(string $title,array $history): string {
    $entries=$history['entries']??[];$declared=$history['declared_count']??null;
    $full="🔧 Сервисная история\n".$title."\nПо данным Arval";
    if($declared!==null)$full.=(count($entries)===$declared?' · записей: '.$declared:' · доступно записей: '.count($entries).' из '.$declared);
    $full.="\n";
    foreach($entries as $entry) {
        $full.="\n".actionMaintenanceDate($entry['date_source']).' · '.number_format($entry['mileage_km'],0,',',' ')." км\n";
        foreach(actionMaintenanceItems($entry['description_source']) as $item)$full.='• '.$item."\n";
    }
    if(!$entries && !empty($history['source']))$full.="\nНе удалось выделить отдельные записи. Исходный текст:\n".$history['source']."\n";
    $full.="\nНазвания деталей переданы по записям аукциона и сами по себе не подтверждают их замену. История может быть неполной.";
    return $full;
}
function actionHandle(array $update,array $config,callable $call): string {
    $db=actionDb();$id=$update['update_id']??null;$msg=$update['message']??null;
    if (!is_int($id) || $id<0 || !is_array($msg) || ($msg['chat']['type']??'')!=='private' || !is_array($msg['from']??null) || !is_int($msg['from']['id']??null) || ($msg['from']['is_bot']??true) || (string)($msg['chat']['id']??'')!==(string)$msg['from']['id'])return 'ignored';
    $user=$msg['from'];$userId=(string)$user['id'];$db->exec('BEGIN IMMEDIATE');
    try {
        $q=$db->prepare('SELECT id FROM telegram_updates WHERE id=?');$q->execute([$id]);if($q->fetchColumn()!==false){$db->exec('COMMIT');return 'duplicate';}
        $q=$db->prepare('SELECT COUNT(*) FROM telegram_updates WHERE user_id=? AND created_at>?');$q->execute([$userId,time()-60]);$limited=(int)$q->fetchColumn()>=10;
        $db->prepare('INSERT INTO telegram_updates VALUES (?,?,?,?)')->execute([$id,$userId,time(),$limited?'rate_limited':'processing']);$db->exec('COMMIT');
    }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
    if ($limited)return 'rate_limited';
    $send=function(string $text)use($call,$userId):void{$result=$call('sendMessage',['chat_id'=>$userId,'text'=>$text,'link_preview_options'=>json_encode(['is_disabled'=>true])]);if(empty($result['ok']))throw new RuntimeException('Bot reply rejected');};
    try {
        $text=(string)($msg['text']??'');
        if (!preg_match('/^\/start(?:@[A-Za-z0-9_]+)?\s+(damage|inspection|parts|service)_([a-f0-9]{32})(?:_([0-9]{1,3}))?$/D',$text,$m)) {
            if (preg_match('/^\/start(?:@[A-Za-z0-9_]+)?$/D',$text))$send('Откройте нужные материалы кнопкой под объявлением автомобиля.');
            $status='ignored';
        }else{
            $q=$db->prepare('SELECT * FROM telegram_offers WHERE token=? AND NOT EXISTS (SELECT 1 FROM deleted_drafts x WHERE x.draft_id=telegram_offers.draft_id)');$q->execute([$m[2]]);$offer=$q->fetch();
            if (!$offer) {$send('Ссылка не найдена. Запросите актуальное объявление у менеджера.');$status='not_found';}
            else {
                $r=json_decode($offer['resources_json'],true,512,JSON_THROW_ON_ERROR);$title=$r['title'];$kind=$m[1];
                if ($kind==='damage') {
                    $offset=(int)($m[3]??0);
                    if($offset%10!==0 || $offset>200)throw new InvalidArgumentException('Invalid damage page');
                    if(actionDeliverDamage($offer,$r,$offset,$userId,$config,$call)) {
                        // Delivered directly to the requester; no manager lead required.
                    }else{
                    $request=actionDamage($offer,$user);$manager=(string)($config['manager_chat_id']??'');
                    if (!$request['duplicate'] && preg_match('/^-[0-9]+$/D',$manager)) {
                        $db->prepare('UPDATE damage_requests SET status=? WHERE id=?')->execute(['sending',$request['id']]);
                        try {
                            $notice="Запрос фото повреждений\n".$title."\nVIN: ".$r['vin']."\nКлиент: ".mbSafeCut((string)($user['first_name']??''),150)."\nTelegram ID: ".$userId;
                            if(preg_match('/^[A-Za-z0-9_]{5,32}$/D',(string)($user['username']??'')))$notice.="\nКонтакт: https://t.me/".$user['username'];
                            $notice.="\nЧерновик: https://serwer2454127.home.pl/drafts/?id=".$offer['draft_id'];
                            $sent=$call('sendMessage',['chat_id'=>$manager,'text'=>$notice,'link_preview_options'=>json_encode(['is_disabled'=>true])]);$request['status']=!empty($sent['ok'])?'sent':'rejected';
                        }catch(Throwable $e){$request['status']='uncertain';}
                        $db->prepare('UPDATE damage_requests SET status=? WHERE id=?')->execute([$request['status'],$request['id']]);
                    }
                    $send($title."\n".($request['duplicate']?'Такой запрос уже сохранён сегодня.':'Запрос на фото повреждений сохранён.').($request['status']==='sent'?"\nУведомление передано менеджерам.":"\nАвтоматическая передача менеджерам пока не подтверждена. Для срочного ответа свяжитесь с продавцом."));
                    }
                }elseif($kind==='service') {
                    $history=$r['maintenance']??null;
                    if(!$history || (!(($history['entries']??[])) && empty($history['source']) && ($history['declared_count']??null)!==0)) {
                        $send($title."\nСервисная история пока не приложена к этому объявлению или не разрешена для выдачи. Уточните у продавца.");
                    }else{
                        $full=actionMaintenanceText($title,$history);
                        if(strlen($full)<=3500)$send($full);
                        else {$result=$call('sendDocument',['chat_id'=>$userId,'document'=>new CURLStringFile($full,'service-history.txt','text/plain'),'caption'=>'Сервисная история Arval — сохранённый снимок']);if(empty($result['ok']))throw new RuntimeException('Service history rejected');}
                    }
                }else {
                    $assets=$kind==='inspection'?$r['inspection_files']:$r['parts_files'];$hasText=$kind==='parts' && count($r['equipment'])>0;$hasUrl=$kind==='inspection' && !empty($r['inspection_url']);
                    $send($title."\n".($kind==='inspection'?'Инспекция':'Данные PartsLink').(!$assets && !$hasText && !$hasUrl?"\nМатериалы пока не приложены к этому объявлению. Уточните у продавца.":''));
                    foreach($assets as $assetId){
                        $q=$db->prepare('SELECT * FROM assets WHERE id=? AND draft_id=?');$q->execute([$assetId,$offer['draft_id']]);$asset=$q->fetch();
                        $expected=$kind==='inspection'?'inspection':'partslink';
                        if(!$asset || $asset['kind']!==$expected || $asset['mime']!=='application/pdf')continue;
                        $path=draftRoot().'/objects/'.$asset['draft_id'].'/'.$asset['id'];
                        if(is_file($path)){$result=$call('sendDocument',['chat_id'=>$userId,'document'=>new CURLFile($path,'application/pdf',$expected.'.pdf')]);if(empty($result['ok']))throw new RuntimeException('Document rejected');}
                    }
                    if($hasUrl)$send("Исходная инспекция: ".$r['inspection_url']."\nСсылка может требовать входа на сайт инспекции.");
                    if($hasText){
                        $full="Комплектация PartsLink — сохранённый снимок. Фактическое наличие опций проверяется отдельно.\n";
                        foreach($r['equipment'] as $option)$full.=$option['code'].' — '.$option['label']."\n";
                        $result=$call('sendDocument',['chat_id'=>$userId,'document'=>new CURLStringFile($full,'partslink.txt','text/plain'),'caption'=>'Сохранённая комплектация PartsLink']);if(empty($result['ok']))throw new RuntimeException('PartsLink rejected');
                    }
                }
                $status='done';
            }
        }
    }catch(Throwable $e){$status='uncertain';error_log('Atlant bot action uncertain: '.get_class($e));}
    $db->prepare('UPDATE telegram_updates SET status=? WHERE id=?')->execute([$status,$id]);return $status;
}
