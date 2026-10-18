<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
$root=sys_get_temp_dir().'/atlant-purchases-'.bin2hex(random_bytes(8));putenv('ATLANT_DRAFT_ROOT='.$root);define('ATLANT_DRAFT_STORE',true);require $argv[1]??dirname(__DIR__).'/api/product-store.php';
function check(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
function rejects(callable $fn):bool{try{$fn();return false;}catch(InvalidArgumentException $e){return true;}}
try{
 $a=draftCapture(['vehicle'=>['vin'=>'WBA00000000000001','title'=>'Fixture A'],'source'=>[]],'owner')['id'];$b=draftCapture(['vehicle'=>['vin'=>'WBA00000000000002','title'=>'Fixture B'],'source'=>[]],'owner')['id'];$db=productDb();$invoice=bin2hex(random_bytes(16));$other=bin2hex(random_bytes(16));$inspection=bin2hex(random_bytes(16));
 foreach([[$invoice,$a,'invoice'],[$other,$b,'invoice'],[$inspection,$a,'inspection']] as [$asset,$id,$kind])$db->prepare('INSERT INTO assets VALUES (?,?,?,?,?,?,?,?,?)')->execute([$asset,$id,hash('sha256',$asset),'fixture.pdf','application/pdf',7,$kind,'',gmdate('c')]);
 $record=fn($date,$asset,$actor='owner')=>erpPurchaseRecord($a,$date,$asset,'TEST-001','fixture@example.com','1234567890abcdef',$actor);
 check(rejects(fn()=>$record('2026-02-30',$invoice)),'Invalid calendar date rejected');check(rejects(fn()=>$record('2026-09',$invoice)),'Full document date required');check(rejects(fn()=>$record('2026-09-10',$other)),'Invoice from another VIN rejected');check(rejects(fn()=>$record('2026-09-10',$inspection)),'Inspection cannot prove purchase date');check(rejects(fn()=>$record('2026-09-10',$invoice,'employee-2')),'Unprivileged metadata write rejected');
 $record('2026-09-10',$invoice);$record('2026-09-10',$invoice);$purchase=erpPurchaseGet($a);check($purchase['purchase_date']==='2026-09-10'&&$purchase['invoice_asset_id']===$invoice,'Date retains exact invoice evidence');check(rejects(fn()=>$record('2026-09-11',$invoice)),'Conflicting date requires review');check(erpPurchaseGet($a)['purchase_date']==='2026-09-10','Conflict leaves confirmed date intact');
 $list=productRegistryList();$dates=array_column($list,'purchase_date','id');check($dates[$a]==='2026-09-10'&&$dates[$b]===null,'Registry shows only confirmed date');check((int)$db->query("SELECT COUNT(*) FROM events WHERE type='purchase_confirmed'")->fetchColumn()===1,'Repeated import is idempotent');
 $product=productCreate($a,'owner');$public=productPublicSnapshot($product);check(!array_key_exists('purchase_date',$public)&&!str_contains(json_encode($public),'TEST-001')&&$public['document_ids']===[],'Purchase data and invoice excluded from public projection');
 echo "PASS purchase dates: exact date validation, matching invoice evidence, role check, conflict protection, idempotency, registry display and public-data exclusion.\n";
}finally{if(is_dir($root)){foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST)as$f){if($f->isDir())rmdir($f->getPathname());else unlink($f->getPathname());}rmdir($root);}}
