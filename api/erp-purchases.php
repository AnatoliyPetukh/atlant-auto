<?php
declare(strict_types=1);
if(!defined('ATLANT_DRAFT_STORE')){http_response_code(404);exit;}
function erpPurchaseDb():PDO{
 $db=draftDb();$db->exec('CREATE TABLE IF NOT EXISTS vehicle_purchases (draft_id TEXT PRIMARY KEY REFERENCES drafts(id), purchase_date TEXT NOT NULL, invoice_asset_id TEXT NOT NULL REFERENCES assets(id), invoice_number TEXT NOT NULL, source_mailbox TEXT NOT NULL, source_message_id TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL)');return $db;
}
function erpPurchaseGet(string $id):?array{
 draftFind($id);$q=erpPurchaseDb()->prepare('SELECT * FROM vehicle_purchases WHERE draft_id=?');$q->execute([draftId($id)]);return $q->fetch()?:null;
}
function erpPurchaseRecord(string $id,string $date,string $asset,string $number,string $mailbox,string $message,string $actor):void{
 if(!erpCanPublish($actor))throw new InvalidArgumentException('Нужны права публикации.');
 $parsed=DateTimeImmutable::createFromFormat('!Y-m-d',$date);if(!$parsed||$parsed->format('Y-m-d')!==$date)throw new InvalidArgumentException('Неверная дата инвойса.');
 if($number===''||strlen($number)>80||!filter_var($mailbox,FILTER_VALIDATE_EMAIL)||!preg_match('/^[a-f0-9]{10,64}$/D',$message))throw new InvalidArgumentException('Проверьте источник инвойса.');
 $db=erpPurchaseDb();$db->exec('BEGIN IMMEDIATE');try{
  draftFind($id);$q=$db->prepare("SELECT 1 FROM assets WHERE id=? AND draft_id=? AND kind='invoice' AND mime='application/pdf'");$q->execute([draftId($asset),$id]);if(!$q->fetchColumn())throw new InvalidArgumentException('Подтверждающий PDF должен быть инвойсом этой машины.');
  $q=$db->prepare('SELECT purchase_date,invoice_asset_id,invoice_number FROM vehicle_purchases WHERE draft_id=?');$q->execute([$id]);$old=$q->fetch();
  if($old){if($old['purchase_date']!==$date||$old['invoice_asset_id']!==$asset||$old['invoice_number']!==$number)throw new InvalidArgumentException('Дата покупки уже подтверждена другим инвойсом. Требуется проверка.');$db->exec('COMMIT');return;}
  $db->prepare('INSERT INTO vehicle_purchases VALUES (?,?,?,?,?,?,?,?)')->execute([$id,$date,$asset,$number,$mailbox,$message,$actor,gmdate('c')]);
  draftEvent($db,$id,'purchase_confirmed',$actor,['purchase_date'=>$date,'basis'=>'invoice_date','asset_id'=>$asset,'invoice_number'=>$number,'mailbox'=>$mailbox,'message_id'=>$message]);$db->exec('COMMIT');
 }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
}
