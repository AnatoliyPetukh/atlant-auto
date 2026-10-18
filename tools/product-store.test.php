<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
$root=sys_get_temp_dir().'/atlant-products-'.bin2hex(random_bytes(8));putenv('ATLANT_DRAFT_ROOT='.$root);define('ATLANT_DRAFT_STORE',true);require $argv[1]??dirname(__DIR__).'/api/product-store.php';
function expect(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
function rejected(callable $fn):bool{try{$fn();return false;}catch(InvalidArgumentException|DomainException $e){return true;}}
try{
 if(!is_dir($root))mkdir($root,0700,true);
 $accounts=$root.'/accounts.json';file_put_contents($accounts,json_encode(['users'=>['publisher-test'=>['password_hash'=>password_hash('fixture',PASSWORD_BCRYPT),'role'=>'publisher','enabled'=>true]]]));putenv('ATLANT_ERP_ACCOUNTS='.$accounts);
 $packet=['vehicle'=>['vin'=>'WBA00000000000001','display_title'=>'BMW X2','make'=>'BMW','title'=>'Private source','mileage_km'=>12345,'fuel'=>'Petrol','transmission'=>'Automatic','publication_facts'=>['display_date'=>['kind'=>'production','value'=>'2022-05-10'],'first_registration'=>['value'=>'2022-06'],'engine'=>['label'=>'бензин']]],'source'=>['url'=>'https://remktg.arval.com/private','lot_id'=>'secret-lot','captured_at'=>'2026-10-17T10:00:00Z'],'auction'=>['price'=>['kind'=>'highest_bid','amount'=>9000,'currency'=>'EUR']],'website_seed'=>['equipment_ids'=>['cameraRear','heatedSeats']],'private'=>['client'=>'private-person@example.com']];
 $id=draftCapture($packet,'employee-2')['id'];$db=productDb();$photo=bin2hex(random_bytes(16));$damage=bin2hex(random_bytes(16));$private=bin2hex(random_bytes(16));$inspection=bin2hex(random_bytes(16));$yard=bin2hex(random_bytes(16));
 mkdir($root.'/objects/'.$id,0700,true);
 foreach([$yard=>['on_site','image/jpeg'],$photo=>['vehicle','image/jpeg'],$damage=>['damage','image/jpeg'],$private=>['document','application/pdf'],$inspection=>['inspection','application/pdf']]as$aid=>$attrs){file_put_contents($root.'/objects/'.$id.'/'.$aid,'fixture');$db->prepare('INSERT INTO assets VALUES (?,?,?,?,?,?,?,?,?)')->execute([$aid,$id,hash('sha256',$aid),'private-name',$attrs[1],7,$attrs[0],'https://private.example/token',gmdate('c')]);}
 $row=productCreate($id,'employee-2');expect($row['record']['state']==='auction'&&$row['record']['price_net']===null,'Auction source is not sale price');expect(productCreate($id,'employee-2')['public_id']===$row['public_id'],'One product per VIN');
 expect($row['record']['equipment_pl']===['Kamera cofania','Podgrzewane fotele'],'Polish equipment');expect($row['record']['photo_ids']===[$photo]&&$row['record']['document_ids']===[],'No damage/private documents auto-shared');expect(productPublicList()===[],'Private by default');
 expect(rejected(fn()=>productPublish($id,1,'employee-2')),'Only owner publishes');
 $row=productSave($id,1,['state'=>'in_transit','availability'=>'reserved','price_net'=>'12500,50','description_pl'=>'Samochód w drodze do Warszawy.'],'employee-2');expect($row['record']['price_net']===12500.5,'Explicit ready price');expect($row['record']['price_gross']===15400,'Changed net calculates gross at 23 percent rounded to nearest hundred');expect(rejected(fn()=>productSave($id,1,[],'owner')),'Stale revision rejected');
 $changed=$packet;$changed['vehicle']['display_title']='New auction title';draftCapture($changed,'employee-2');expect(productGet($id)['record']['state']==='in_transit'&&productGet($id)['record']['title']==='BMW X2','Reimport preserves product edits');
 expect(rejected(fn()=>productSave($id,2,['photo_ids'=>[$damage]],'owner')),'Damage excluded from product photos');expect(rejected(fn()=>productSave($id,2,['document_ids'=>[$private]],'owner')),'Internal PDF cannot be shared');expect(rejected(fn()=>productSave($id,2,['state'=>'fake-state'],'owner')),'State allowlist');
 $row=productPublish($id,2,'publisher-test');$public=productPublicList()[0];$json=json_encode($public);foreach(['WBA00000000000001','private-person','secret-lot','remktg','private.example','source_url','draft_id']as$secret)expect(!str_contains($json,$secret),'No private source leak: '.$secret);
 expect(!isset($public['auction_bid'])&&$public['price_net']===12500.5,'Purchased card uses ready price only');
 $row=productSave($id,2,['state'=>'on_site','availability'=>'free','document_ids'=>[$inspection],'photo_ids'=>[$yard]],'employee-2');expect(productPublicList()[0]['state']==='in_transit','Unpublished changes not public');
 productPublish($id,3,'owner');expect(productPublicList()[0]['photo_ids']===[$yard],'Yard gallery selected independently');expect(productPublicList()[0]['state']==='on_site'&&productPublicList()[0]['document_ids']===[$inspection],'Explicit update publishes selected document');
 productUnpublish($id,'owner');expect(productPublicList()===[],'Unpublish removes public data');expect(productGet($id)['record']['state']==='on_site','Unpublish retains entity');
 expect(count(productVersions($id))===3,'Full revision history');$restored=productRestore($id,3,1,'employee-2');expect($restored['revision']===4&&$restored['record']['state']==='auction','Restore creates new revision');expect(productPublicList()===[],'Restore never publishes');expect(count(productVersions($id))===4,'Original versions retained');
 expect(rejected(fn()=>productSave($id,4,['keys'=>'-1'],'owner')),'Invalid key count rejected');expect(rejected(fn()=>productSave($id,4,['production_date'=>'2023-02-31'],'owner')),'Invalid date rejected');
 $facts=productSave($id,4,['keys'=>'0','power_kw'=>'100,5','power_hp'=>'136','color_pl'=>'Biały','registration_country_pl'=>'Francja','awd'=>false,'vat_deductible'=>true,'tyres_pl'=>'Opony letnie, bieżnik 5 mm.'],'employee-2');
 expect($facts['record']['keys']===0&&$facts['record']['power_kw']===100.5&&$facts['record']['awd']===false,'Reviewed facts typed without losing zero/false');
 productPublish($id,5,'owner');$visible=productPublicList()[0];expect($visible['keys']===0&&$visible['vat_deductible']===true&&$visible['tyres_pl']!==''&&$visible['registration_country_pl']==='Francja','Reviewed facts reach public projection');productUnpublish($id,'owner');
 // ERP is the authority. Explicit ERP saves atomically refresh an existing public card.
 productPublish($id,5,'owner');
 expect(rejected(fn()=>productSave($id,5,['state'=>'sold'],'employee-2',true)),'Staff cannot change an already-public vehicle');
 expect(productGet($id)['revision']===5&&productPublicList()[0]['state']==='auction','Rejected ERP change is atomic');
 expect(rejected(fn()=>productSave($id,5,['state'=>'on_site','photo_ids'=>[$photo],'price_net'=>'12000'],'owner',true)),'Cannot advertise auction photos as yard arrival');
 expect(productGet($id)['revision']===5,'Failed publication validation rolls back ERP revision');
 $erp=productSave($id,5,['state'=>'in_transit','price_net'=>'12000'],'publisher-test',true);
 expect(productVersions($id)[0]['actor']==='publisher-test','Publisher personal identity recorded in history');
 expect($erp['published_revision']===6&&productPublicList()[0]['state']==='in_transit','ERP state reaches website in same transaction');
 $again=$packet;$again['vehicle']['display_title']='Recaptured source';draftCapture($again,'employee-2');
 expect(productGet($id)['record']['state']==='in_transit'&&productPublicList()[0]['state']==='in_transit','Recapture cannot reset ERP or website state');
 expect(count(productRegistryList('WBA00000000000001','in_transit'))===1&&productRegistryList('WBA00000000000001','on_site')===[],'VIN registry state filters');
 expect(rejected(fn()=>productSave($id,5,['state'=>'sold'],'owner',true)),'Stale ERP revision cannot overwrite newer state');
 $erp=productSave($id,6,['state'=>'on_site','photo_ids'=>[$yard]],'owner',true);expect(productPublicList()[0]['state']==='on_site','Yard arrival sync with real photos');
 $erp=productSave($id,7,['state'=>'sold'],'owner',true);expect(productPublicList()[0]['state']==='sold','Sold state sync');
 productUnpublish($id,'owner');productSave($id,8,['state'=>'auction'],'employee-2',true);expect(productPublicList()===[],'Hidden vehicle never auto-publishes');
 $newPacket=$packet;$newPacket['vehicle']['vin']='WBA00000000000002';$new=draftCapture($newPacket,'employee-2');
 expect(count(productRegistryList('WBA00000000000002','incoming'))===1&&productGet($new['id'])===null,'Extension upload appears in ERP without creating a public product');
 expect($db->query('PRAGMA integrity_check')->fetchColumn()==='ok','Database integrity');
 echo "PASS products: VIN identity, Polish seed, price separation, workflow/availability, source reimport isolation, owner publication, frozen public version, revision conflict, private document and VIN boundaries, unpublish. No real vehicles published.\n";
}finally{if(is_dir($root)){foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST)as$f){if($f->isDir())rmdir($f->getPathname());else unlink($f->getPathname());}rmdir($root);}}
