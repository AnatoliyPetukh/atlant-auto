<?php
declare(strict_types=1);
$root=sys_get_temp_dir().'/atlant-ai-'.bin2hex(random_bytes(6));mkdir($root,0700,true);putenv('ATLANT_DRAFT_ROOT='.$root);putenv('ATLANT_AI_CONFIG='.$root.'/ai.json');define('ATLANT_DRAFT_STORE',true);require ($argv[1]??dirname(__DIR__).'/api/ai-store.php');require dirname($argv[1]??dirname(__DIR__).'/api/ai-store.php').'/product-store.php';
function aiCheck(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
function aiFails(callable$f):bool{try{$f();return false;}catch(InvalidArgumentException|RuntimeException$e){return true;}}
try{
 file_put_contents($root.'/ai.json',json_encode(['enabled'=>true,'api_key'=>'test-key-not-real-'.str_repeat('x',30),'model'=>'gpt-4.1-mini','daily_job_limit'=>20]));
 $p=['vehicle'=>['vin'=>'WBA00000000000011','display_title'=>'BMW test','keys'=>2],'condition'=>['damages'=>[['description'=>'Scratch']]],'source'=>['url'=>'https://private-auction.invalid/secret'],'invoice'=>['secret'=>'PRIVATE_INVOICE']];$id=draftCapture($p,'owner')['id'];
 aiCheck(aiFails(fn()=>aiEnqueue($id,[],'owner',false)),'Consent required');
 $db=aiDb();$private=bin2hex(random_bytes(16));$db->prepare('INSERT INTO assets VALUES(?,?,?,?,?,?,?,?,?)')->execute([$private,$id,'hash','invoice','application/pdf',100,'invoice','',gmdate('c')]);aiCheck(aiFails(fn()=>aiInput($id,[$private])),'Invoice excluded');
 $input=aiInput($id,[]);aiCheck(!str_contains(json_encode($input),'PRIVATE_INVOICE')&&!str_contains(json_encode($input),'private-auction'),'Allowlisted inputs only');
 $job=aiEnqueue($id,[],'owner',true);aiCheck(aiEnqueue($id,[],'owner',true)===$job,'Identical click is deduplicated');
 $r=['description_pl'=>'Samochód z dwoma kluczami.','description_ru'=>'Автомобиль с двумя ключами.','condition_pl'=>'Zarysowanie według źródła.','condition_ru'=>'Царапина по данным источника.','maintenance_pl'=>'','maintenance_ru'=>'','equipment_pl'=>[],'equipment_ru'=>[],'checks_ru'=>['Проверьте оригинал инспекции.'],'evidence'=>[['section'=>'description','sources'=>['vehicle']],['section'=>'condition','sources'=>['condition']]]];
 $calls=0;$transport=function($request)use($r,&$calls){$calls++;aiCheck($request['store']===false,'Response storage disabled');aiCheck(!isset($request['tools']),'No action tools');aiCheck($request['text']['format']['strict']===true,'Strict schema');return ['status'=>'completed','output'=>[['content'=>[['type'=>'output_text','text'=>json_encode($r)]]]],'usage'=>['total_tokens'=>12]];};
 aiCheck(aiRunOne($transport)==='needs_review'&&$calls===1,'Worker produces review draft');aiCheck(aiRunOne($transport)==='idle'&&$calls===1,'Worker never repeats completed request');aiCheck(aiResult($id,$job)['description_pl']===$r['description_pl'],'Result belongs to vehicle');aiCheck(productPublicList()===[],'No automatic publication');
 $uncited=$r;$uncited['evidence']=[];$safe=aiValidate($uncited,$input);aiCheck($safe['description_pl']===''&&$safe['condition_ru']===''&&count($safe['checks_ru'])>1,'Uncited sections excluded instead of fabricated');
 $bad=$r;$bad['evidence'][0]['sources']=['unknown-pdf'];aiCheck(aiFails(fn()=>aiValidate($bad,$input)),'Unknown evidence rejected');
 $p['vehicle']['keys']=1;draftCapture($p,'owner');aiCheck(aiFails(fn()=>aiResult($id,$job)),'Stale preview cannot apply');$next=aiEnqueue($id,[],'owner',true);$p['vehicle']['keys']=3;draftCapture($p,'owner');aiCheck(aiRunOne($transport)==='error'&&$calls===1,'Changed source rejected before API');
 $last=aiEnqueue($id,[],'owner',true);aiCheck(aiRunOne(function(){throw new RuntimeException('delivery_uncertain');})==='uncertain','Ambiguous send marked uncertain');aiCheck(aiRunOne($transport)==='idle'&&$calls===1,'Ambiguous request not retried automatically');
 echo "PASS generator: consent, invoice exclusion, minimal inputs, deduplication, strict request, review draft, evidence, stale source, uncertain delivery, no publication. Mock API only.\n";
}finally{foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST)as$f){$f->isDir()?rmdir($f->getPathname()):unlink($f->getPathname());}rmdir($root);}
