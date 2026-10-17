<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
$root=sys_get_temp_dir().'/atlant-actions-test-'.bin2hex(random_bytes(8));putenv('ATLANT_DRAFT_ROOT='.$root);define('ATLANT_DRAFT_STORE',true);
require $argv[1]??dirname(__DIR__).'/api/telegram-actions.php';
function verify(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
try {
    $packet=['vehicle'=>['vin'=>'WBA00000000000001','make'=>'BMW','title'=>'Fixture'],'source'=>['url'=>'https://example.com/fixture','lot_id'=>'test'],
      'documents'=>[['kind'=>'macadam_report','url'=>'https://www4.macadam.eu/Manager/SinglePage/AppraisalWebview?AssessmentFileId=fixture']],
      'enrichment'=>['partslink24'=>['equipment'=>[['code'=>'S3AGA','label'=>'Camera']]]],
      'condition'=>['maintenance_count'=>2,'maintenance_source'=>'Maintenance history (2)','maintenance_entries'=>[['date_source'=>'Jul-26','mileage_km'=>81419,'description_source'=>'Révision'],['date_source'=>'Feb-26','mileage_km'=>67649,'description_source'=>'Filtre à air']]]];
    $car=draftCapture($packet,'test');$db=actionDb();$generic=bin2hex(random_bytes(16));$inspection=bin2hex(random_bytes(16));
    mkdir($root.'/objects/'.$car['id'],0700,true);
    foreach([$generic=>'document',$inspection=>'inspection'] as $aid=>$kind){$raw='%PDF-1.4 '.$kind;file_put_contents($root.'/objects/'.$car['id'].'/'.$aid,$raw);$db->prepare('INSERT INTO assets VALUES (?,?,?,?,?,?,?,?,?)')->execute([$aid,$car['id'],hash('sha256',$raw),'fixture.pdf','application/pdf',strlen($raw),$kind,'',gmdate('c')]);}
    $offer=actionOffer($packet['vehicle']['vin'],str_repeat('1',64),['inspection'=>true,'parts'=>true,'maintenance'=>true]);$r=json_decode($offer['resources_json'],true);
    verify($r['inspection_files']===[$inspection] && !in_array($generic,$r['inspection_files'],true),'Private PDFs must not be shared');
    verify(count($r['equipment'])===1 && $r['inspection_url']!==null,'Allowed source resources');
    verify(count($r['maintenance']['entries'])===2 && $r['maintenance']['entries'][0]['mileage_km']===81419,'Service snapshot');
    $changed=$packet;$changed['enrichment']['partslink24']['equipment']=[];draftCapture($changed,'test');
    verify(actionOffer($packet['vehicle']['vin'],str_repeat('1',64),[])['token']===$offer['token'],'Offer idempotency');
    verify(count(json_decode(actionOffer($packet['vehicle']['vin'],str_repeat('1',64),[])['resources_json'],true)['equipment'])===1,'Frozen public snapshot');
    $hidden=actionOffer($packet['vehicle']['vin'],str_repeat('2',64),['inspection'=>false,'parts'=>false]);$h=json_decode($hidden['resources_json'],true);verify(!$h['inspection_files'] && !$h['inspection_url'] && !$h['equipment'],'Unapproved material excluded');
    verify(actionInspectionUrl('https://evil.example/Manager/test')===null && actionInspectionUrl('https://user:pass@www4.macadam.eu/Manager/test')===null,'External URL validation');
    verify($h['maintenance']===null,'Unapproved service excluded');
    $keyboard=actionKeyboard($offer['token'],'Soon_on_auction_bot');verify(count($keyboard['inline_keyboard'])===4,'Four URL buttons');
    foreach($keyboard['inline_keyboard'] as $row)verify(!str_contains($row[0]['url'],$packet['vehicle']['vin']),'Opaque publication token');
    $calls=[];$call=function($method,$data)use(&$calls){$calls[]=[$method,$data];return ['ok'=>true,'result'=>['message_id'=>count($calls)]];};
    $update=function($id,$user,$action)use($offer){return ['update_id'=>$id,'message'=>['chat'=>['id'=>$user,'type'=>'private'],'from'=>['id'=>$user,'is_bot'=>false,'first_name'=>'Fixture','username'=>'fixture_user'],'text'=>'/start '.$action.'_'.$offer['token']]];};
    verify(actionHandle($update(1,111,'damage'),[],$call)==='done','Queued damage request');verify((int)$db->query('SELECT COUNT(*) FROM damage_requests')->fetchColumn()===1,'Lead saved');
    verify($db->query('SELECT status FROM damage_requests')->fetchColumn()==='queued','No fake manager notification');
    $n=count($calls);verify(actionHandle($update(1,111,'damage'),[],$call)==='duplicate' && count($calls)===$n,'Telegram update replay rejected');
    actionHandle($update(2,111,'damage'),[],$call);verify((int)$db->query('SELECT COUNT(*) FROM damage_requests')->fetchColumn()===1,'Repeated request per VIN/user/day deduplicated');
    foreach($calls as [$method,$data])verify((string)$data['chat_id']==='111','No notification to unconfigured manager group');
    actionHandle($update(3,222,'damage'),['manager_chat_id'=>'-10042'],$call);
    verify(count(array_filter($calls,fn($c)=>(string)$c[1]['chat_id']==='-10042'))===1,'Configured manager receives one notice');
    actionHandle($update(4,222,'damage'),['manager_chat_id'=>'-10042'],$call);verify(count(array_filter($calls,fn($c)=>(string)$c[1]['chat_id']==='-10042'))===1,'No duplicate manager notice');
    verify(actionHandle($update(5,333,'inspection'),[],$call)==='done','Inspection delivered through fake transport');
    verify(count(array_filter($calls,fn($c)=>$c[0]==='sendDocument' && $c[1]['document'] instanceof CURLFile))===1,'Only approved inspection PDF delivered');
    verify(actionHandle($update(6,444,'parts'),[],$call)==='done','PartsLink delivered');
    verify(count(array_filter($calls,fn($c)=>$c[0]==='sendDocument' && $c[1]['document'] instanceof CURLStringFile))===1,'PartsLink as bounded text document');
    verify(actionHandle($update(8,888,'service'),[],$call)==='done','Service delivered privately');
    $service=array_values(array_filter($calls,fn($c)=>(string)$c[1]['chat_id']==='888'));verify(count($service)===1 && str_contains($service[0][1]['text'],'81 419') && str_contains($service[0][1]['text'],'Июль 2026') && str_contains($service[0][1]['text'],'Техническое обслуживание'),'Russian history and original mileage delivered');
    verify($r['maintenance']['entries'][0]['description_source']==='Révision','French snapshot unchanged');
    $example=['declared_count'=>5,'entries'=>[
      ['date_source'=>'Jan-26','mileage_km'=>85454,'description_source'=>'Pneu 4 saisons'],
      ['date_source'=>'Dec-25','mileage_km'=>84834,'description_source'=>"Bougie d'allumage/Filtre d'habitacle/Filtre à air/Recyclage/Révision"],
      ['date_source'=>'May-25','mileage_km'=>64394,'description_source'=>'Liquide de frein/Plaquettes freins AV/Recyclage/Révision'],
      ['date_source'=>'Oct-24','mileage_km'=>44617,'description_source'=>"Balai d'essuie-glace AR/Balais d'essuie-glace AV/Bougie d'allumage/Filtre d'habitacle/Filtre à air/Révision"],
      ['date_source'=>'Feb-24','mileage_km'=>22444,'description_source'=>'Recyclage/Révision']]];
    $rendered=actionMaintenanceText('Opel Grandland X 1.2 Turbo',$example);
    verify(str_contains($rendered,'Январь 2026 · 85 454 км') && str_contains($rendered,'Всесезонные шины') && str_contains($rendered,'Передние тормозные колодки') && !str_contains($rendered,'перевод не уточнён'),'All supplied French service items translated');
    verify(strlen($rendered)<=3500,'Five-record example delivered as message, not file');
    verify(actionMaintenanceItems('Mystery operation')===['Mystery operation [оригинал; перевод не уточнён]'],'Unknown work not invented or dropped');
    verify(actionMaintenanceDate('unknown')==='unknown','Unknown date not invented');
    verify(str_contains(actionMaintenanceText('Fixture',['entries'=>[],'declared_count'=>5]),'доступно записей: 0 из 5'),'Partial source count disclosed');
    verify(str_contains(actionMaintenanceText('Fixture',['entries'=>[],'declared_count'=>0]),'записей: 0'),'Zero records preserved');
    $legacy=$r;unset($legacy['maintenance']);$db->prepare('UPDATE telegram_offers SET resources_json=? WHERE token=?')->execute([json_encode($legacy),$offer['token']]);
    verify(actionHandle($update(9,889,'service'),[],$call)==='done','Legacy offer service handled');
    $service=array_values(array_filter($calls,fn($c)=>(string)$c[1]['chat_id']==='889'));verify(str_contains($service[0][1]['text'],'пока не приложена'),'No fabricated service for legacy posts');
    $foreign=$update(7,555,'damage');$foreign['message']['chat']['id']=666;verify(actionHandle($foreign,[],$call)==='ignored','Cannot send to different chat');
    for($i=100;$i<110;$i++)actionHandle($update($i,777,'parts'),[],$call);
    $n=count($calls);verify(actionHandle($update(110,777,'parts'),[],$call)==='rate_limited' && count($calls)===$n,'Per-user rate limit');
    $sample="🚘 На аукционе Arval\nOpel Grandland X 1.2 Turbo\n07.2023 · первая регистрация · 107 849 км · бензин · механика\n💶 Текущая максимальная ставка: 6 829 EUR · нетто/брутто уточняется\nНДС к вычету.\nСтавка на момент подготовки; это не итоговая стоимость автомобиля.\n📍 Франция, Центр — Долина Луары\nВ комплектации: LED-фары, климат-контроль, круиз-контроль.\nСостояние: 6 замечаний по инспекции.\nСервисная история Arval: 5 записей; последняя запись — Jan-26, 85 454 км.";
    $timed=['source'=>['captured_at'=>'2026-10-17T10:00:00Z'],'auction'=>['countdown_source'=>'1 h 20 mn 30 s','ends_at'=>null]];
    $pretty=actionPostPresentation($sample,$timed);
    verify(str_contains($pretty['caption'],"Turbo\n\nПервая регистрация: 07.2023\nПробег: 107 849 км\nбензин · механика") && str_contains($pretty['caption'],'Январь 2026') && !str_contains($pretty['caption'],'Оценка по таймеру при сборе') && !str_contains($pretty['caption'],'НДС к вычету') && str_contains($pretty['caption'],'6 829 EUR · нетто'),'Readable blocks and honest clock provenance');
    verify(preg_match_all('/./us',$pretty['caption'])<=1024,'Supplied post fits album caption');
    $clocks=array_values(array_filter($pretty['caption_entities'],fn($e)=>$e['type']==='date_time'));
    verify(count($clocks)===1 && $clocks[0]['unix_time']===strtotime('2026-10-17T11:20:30Z') && $clocks[0]['date_time_format']==='r','Relative timer anchored to capture, not send time');
    $utf=iconv('UTF-8','UTF-16LE',$pretty['caption']);
    foreach($pretty['caption_entities'] as $entity) {
        $segment=iconv('UTF-16LE','UTF-8',substr($utf,$entity['offset']*2,$entity['length']*2));
        verify($segment!==false && $segment!=='','Telegram UTF16 entity boundaries');
        if($entity['type']==='bold' && $entity['offset']===strlen(iconv('UTF-8','UTF-16LE',"🚘 На аукционе Arval\n\n"))/2)verify($segment==='Opel Grandland X 1.2 Turbo','Car title highlighted');
    }
    $messy="🚘 На аукционе Arval\r\n\r\nOpel\tGrandland X 1.2 Turbo\r\n\r\nПервая регистрация: 07.2023\r\nПробег: 107 849 км\r\nбензин · механика\r\nВ комплектации:\r\n\r\n• LED-фары\r\n• климат-контроль\r\nСервисная история Arval: 5 записей; последняя запись — Jan-26, 85 454 км.";
    $compact=actionPostPresentation($messy,$timed)['caption'];
    verify(!str_contains($compact,"\r")&&!str_contains($compact,"\t")&&!str_contains($compact,"\n\n\n")&&!str_contains($compact,'  '),'No CR, tabs, repeated spaces or triple newlines');
    verify(str_contains($compact,"✨ Комплектация\n• LED-фары\n• климат-контроль"),'No blank line after equipment heading or between items');
    verify(str_contains($compact,"🔧 Сервисная история · 5 записей\nПоследняя запись:"),'Service heading and count share one line');
    $linked=actionPostMaterials($pretty,$offer['token'],'Soon_on_auction_bot');
    $links=array_values(array_filter($linked['caption_entities'],fn($e)=>$e['type']==='text_link'));
    verify(count($links)===4 && str_contains($linked['caption'],"Фото повреждений · Инспекция\nPartsLink · Сервисная история"),'Four material links live inside the album caption');
    $utf=iconv('UTF-8','UTF-16LE',$linked['caption']);
    foreach($links as $i=>$entity){
        $label=iconv('UTF-16LE','UTF-8',substr($utf,$entity['offset']*2,$entity['length']*2));
        verify($label===['Фото повреждений','Инспекция','PartsLink','Сервисная история'][$i],'Material link Unicode boundaries');
        verify(str_starts_with($entity['url'],'https://t.me/Soon_on_auction_bot?start=')&&!str_contains($entity['url'],$packet['vehicle']['vin']),'Only opaque bot links shared');
    }
    verify(preg_match_all('/./us',$linked['caption'])<=1024,'Formatted example plus all links fits caption');
    $missing=actionPostPresentation('Auction\nCar',[]);verify(str_contains($missing['caption'],'не распознано') && !array_filter($missing['caption_entities'],fn($e)=>$e['type']==='date_time'),'Missing clock never invented');
    $bad=$timed;$bad['auction']['countdown_source']='9999 h';verify(!array_filter(actionPostPresentation('Auction\nCar',$bad)['caption_entities'],fn($e)=>$e['type']==='date_time'),'Unknown timer format never guessed');
    // An old post gets its first damage-only snapshot; PDFs and ordinary photos stay private.
    $damageIds=[];
    for($i=0;$i<12;$i++) {
        $aid=bin2hex(random_bytes(16));$isDamage=$i<11;$damageIds[]=$aid;
        file_put_contents($root.'/objects/'.$car['id'].'/'.$aid,'fake image '.$i);
        $db->prepare('INSERT INTO assets VALUES (?,?,?,?,?,?,?,?,?)')->execute([$aid,$car['id'],hash('sha256','fake image '.$i),'fixture.jpg','image/jpeg',20,$isDamage?'damage':'vehicle','',gmdate('c')]);
    }
    $old=$r;unset($old['damage_files']);$db->prepare('UPDATE telegram_offers SET resources_json=? WHERE token=?')->execute([json_encode($old),$offer['token']]);
    $config=['bot_username'=>'Soon_on_auction_bot','manager_chat_id'=>'-10042'];$n=count($calls);
    verify(actionHandle($update(201,901,'damage'),$config,$call)==='done','Legacy damage delivered directly');
    $delivery=array_slice($calls,$n);verify(count($delivery)===2 && $delivery[0][0]==='sendMediaGroup' && count(json_decode($delivery[0][1]['media'],true))===10,'First ten damage photos and next button');
    foreach($delivery as $c)verify((string)$c[1]['chat_id']==='901','Damage sent only to requester');
    verify(str_contains($delivery[1][1]['reply_markup'],'damage_'.$offer['token'].'_10'),'Opaque next-page deep link');
    $n=count($calls);$next=$update(202,901,'damage');$next['message']['text'].='_10';
    verify(actionHandle($next,$config,$call)==='done' && count($calls)===$n+1 && $calls[$n][0]==='sendPhoto','Single last photo delivered');
    verify(actionHandle($next,$config,$call)==='duplicate' && count($calls)===$n+1,'Damage webhook replay sends nothing');
    $q=$db->prepare('SELECT resources_json FROM telegram_offers WHERE token=?');$q->execute([$offer['token']]);$shared=json_decode($q->fetchColumn(),true);
    verify(count($shared['damage_files'])===11 && !in_array($damageIds[11],$shared['damage_files'],true),'Only damage-classified images are shared');
    $new=actionOffer($packet['vehicle']['vin'],str_repeat('3',64),[]);verify(count(json_decode($new['resources_json'],true)['damage_files'])===11,'New offers freeze damage images');
    // Even a corrupt share list cannot expose another draft or an ordinary photo.
    $tampered=$shared;$tampered['damage_files']=[$damageIds[11],$generic];
    verify(!actionDeliverDamage($offer,$tampered,0,'901',$config,$call),'MIME and kind checked at delivery');
    $big=$damageIds[0];$db->prepare('UPDATE assets SET bytes=? WHERE id=?')->execute([11*1024*1024,$big]);
    $large=$shared;$large['damage_files']=[$big];$n=count($calls);
    verify(actionDeliverDamage($offer,$large,0,'902',$config,$call) && $calls[$n][0]==='sendDocument','Oversized photo delivered as original file');
    $multiPacket=$packet;$multiPacket['enrichment']['partslink24_pdf']=['equipment'=>[['code'=>'OPTION1','label'=>'Merged PDF equipment']]];for($i=0;$i<350;$i++)$multiPacket['enrichment']['partslink24_pdf']['equipment'][]=['code'=>'F'.$i,'label'=>'Fixture equipment '.$i];draftCapture($multiPacket,'test');
    $partsIds=[];for($i=0;$i<4;$i++){$aid=bin2hex(random_bytes(16));$partsIds[]=$aid;$raw='%PDF-1.4 parts fixture '.$i;file_put_contents($root.'/objects/'.$car['id'].'/'.$aid,$raw);$db->prepare('INSERT INTO assets VALUES (?,?,?,?,?,?,?,?,?)')->execute([$aid,$car['id'],hash('sha256',$raw),'part-'.$i.'.pdf','application/pdf',strlen($raw),'partslink','',gmdate('c')]);}
    $multiOffer=actionOffer($packet['vehicle']['vin'],str_repeat('8',64),['parts'=>true]);$multiResources=json_decode($multiOffer['resources_json'],true);verify($multiResources['parts_files']===$partsIds,'All four PartsLink PDFs available, not only first three');verify($multiResources['equipment'][0]['label']==='Merged PDF equipment','Merged PDF equipment used in bot');verify(count($multiResources['equipment'])===351,'Combined list over 300 options is retained for Kia multi-file exports');
    verify(draftDb()->query('PRAGMA integrity_check')->fetchColumn()==='ok','Integrity');
    echo "PASS actions: four deep links, service history/legacy privacy, immutable share snapshot, private PDFs excluded, queued leads, update/request idempotency, manager routing, inspection PDF, PartsLink TXT, chat isolation and rate limit. No real Telegram calls.\n";
}finally{if(is_dir($root)){foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST) as $f){if($f->isDir())rmdir($f->getPathname());else unlink($f->getPathname());}rmdir($root);}}
