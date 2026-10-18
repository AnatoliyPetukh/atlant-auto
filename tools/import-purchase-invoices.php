<?php
declare(strict_types=1);
// Trusted CLI only: input is a locally verified invoice manifest, never public HTTP.
if(PHP_SAPI!=='cli')exit(1);
define('ATLANT_DRAFT_STORE',true);require $argv[1]??dirname(__DIR__).'/api/product-store.php';
$manifest=json_decode((string)file_get_contents($argv[2]??''),true,512,JSON_THROW_ON_ERROR);
foreach($manifest as $item){
 $q=productDb()->prepare('SELECT id FROM drafts WHERE vin=? AND NOT EXISTS (SELECT 1 FROM deleted_drafts x WHERE x.draft_id=drafts.id)');$q->execute([$item['vin']]);$id=$q->fetchColumn();if(!$id)throw new RuntimeException('Active VIN not found');
 $q=productDb()->prepare("SELECT id FROM assets WHERE draft_id=? AND digest=? AND kind='invoice' AND mime='application/pdf'");$q->execute([$id,$item['sha256']]);$asset=$q->fetchColumn();if(!$asset)throw new RuntimeException('Verified invoice attachment not found');
 $path=draftRoot().'/objects/'.$id.'/'.$asset;if(!is_file($path)||hash_file('sha256',$path)!==$item['sha256'])throw new RuntimeException('Invoice file digest mismatch');
 erpPurchaseRecord($id,$item['date'],$asset,$item['invoice_number'],$item['mailbox'],$item['message_id'],'atlant-admin');
 echo $item['vin']." purchase date recorded from invoice".PHP_EOL;
}
