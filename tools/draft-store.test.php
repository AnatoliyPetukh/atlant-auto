<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') exit(1);
$root=sys_get_temp_dir().'/atlant-store-test-'.bin2hex(random_bytes(8));
putenv('ATLANT_DRAFT_ROOT='.$root);define('ATLANT_DRAFT_STORE',true);
require $argv[1]??dirname(__DIR__).'/api/draft-store.php';
function check(bool $condition,string $message): void {if(!$condition)throw new RuntimeException($message);}
try {
    $packet=['vehicle'=>['vin'=>'WBA00000000000001','make'=>'BMW','title'=>'Test'],'source'=>['lot_id'=>'fixture-lot','url'=>'https://example.com/fixture']];
    $first=draftCapture($packet,'test');$repeat=draftCapture($packet,'test');check($repeat['duplicate'] && $first['id']===$repeat['id'],'VIN capture dedup');
    $changed=$packet;$changed['vehicle']['title']='Changed';draftCapture($changed,'test');draftCapture($packet,'test');
    $detail=draftDetail($first['id']);check(count($detail['snapshots'])===2 && $detail['packet']===$packet,'Snapshots/restoration');
    check(count(draftList('fixture-lot'))===1 && count(draftList('notfound'))===0,'Search');
    $request=str_repeat('a',64);
    check(draftTelegramReceipt($packet['vehicle']['vin'],$request,'sending','Fixture caption',[],'test'),'Sending receipt');
    check(draftTelegramReceipt($packet['vehicle']['vin'],$request,'sent','Fixture caption',[5,6],'test'),'Sent receipt');
    draftTelegramReceipt($packet['vehicle']['vin'],$request,'sent','Fixture caption',[5,6],'test');
    $events=array_filter(draftDetail($first['id'])['events'],fn($e)=>str_starts_with($e['type'],'telegram_'));
    check(count($events)===2,'Receipt idempotency');
    check(!draftTelegramReceipt('WBA00000000000002',$request,'sent','Fixture',[],'test'),'Unknown VIN not silently created');
    $named=['vehicle'=>['vin'=>'WBA00000000000003','make'=>'Kia','title'=>'Kia Sportage Design Hybrid 1.6 T-GDi 230CV BVA6 E6d','display_title'=>'Kia Sportage 1.6 T-GDi Hybrid']];
    $namedId=draftCapture($named,'test')['id'];$namedDetail=draftDetail($namedId);check($namedDetail['title']==='Kia Sportage 1.6 T-GDi Hybrid' && $namedDetail['packet']['vehicle']['title']===$named['vehicle']['title'],'Display name/source separation');
    $named['vehicle']['display_title']='';draftCapture($named,'test');check(!str_starts_with(draftDetail($namedId)['title'],'Kia Kia'),'Legacy brand deduplication');
    $bad=false;try{draftCapture(['vehicle'=>['vin'=>'BAD']],'test');}catch(InvalidArgumentException $e){$bad=true;}check($bad,'VIN validation');
    check(draftDb()->query('PRAGMA integrity_check')->fetchColumn()==='ok','Database integrity');
    echo "PASS store: VIN uniqueness, immutable snapshots, restored current source, lot search, Telegram receipts/idempotency, invalid VIN, SQLite integrity.\n";
}finally{
    if(is_dir($root)) {
        foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST) as $f) {if($f->isDir())rmdir($f->getPathname());else unlink($f->getPathname());}
        rmdir($root);
    }
}
