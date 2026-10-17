<?php
declare(strict_types=1);
if(!defined('ATLANT_DRAFT_STORE')){http_response_code(404);exit;}
require_once __DIR__.'/draft-store.php';
function erpFileKinds():array{return ['invoice'=>'Инвойсы','transport'=>'Транспортные документы','registration'=>'Регистрационные документы','inspection'=>'Инспекции','partslink'=>'PartsLink','specification'=>'Спецификации','document'=>'Другие документы','vehicle'=>'Фото с аукциона','on_site'=>'Фото с площадки','damage'=>'Фото повреждений','inspection_video'=>'Видео осмотра','review'=>'Обзоры'];}
function erpNotes():PDO{$db=draftDb();$db->exec('CREATE TABLE IF NOT EXISTS vehicle_notes (id TEXT PRIMARY KEY,draft_id TEXT NOT NULL REFERENCES drafts(id),body TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL)');return $db;}
function erpAddNote(string $id,string $body,string $actor):void{
 draftFind($id);$body=trim($body);if($body===''||preg_match_all('/./us',$body)>4000||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/u',$body))throw new InvalidArgumentException('Комментарий: от 1 до 4000 знаков.');
 $db=erpNotes();$db->beginTransaction();try{$db->prepare('INSERT INTO vehicle_notes VALUES (?,?,?,?,?)')->execute([bin2hex(random_bytes(16)),$id,$body,$actor,gmdate('c')]);draftEvent($db,$id,'note_added',$actor,[]);$db->prepare('UPDATE drafts SET updated_at=? WHERE id=?')->execute([gmdate('c'),$id]);$db->commit();}catch(Throwable $e){$db->rollBack();throw $e;}
}
function erpVehicleNotes(string $id):array{$q=erpNotes()->prepare('SELECT body,actor,created_at FROM vehicle_notes WHERE draft_id=? ORDER BY rowid DESC LIMIT 200');$q->execute([draftId($id)]);return $q->fetchAll();}
function erpDate(string $value):string{try{return (new DateTimeImmutable($value))->setTimezone(new DateTimeZone('Europe/Warsaw'))->format('d.m.Y H:i');}catch(Throwable $e){return $value;}}
function erpTelegramPhotoFiles(string $id,array $ids):array{
 draftFind($id);if(count($ids)<2||count($ids)>10||count(array_unique($ids))!==count($ids))throw new InvalidArgumentException('Выберите от 2 до 10 разных фотографий.');
 $result=[];$q=draftDb()->prepare("SELECT * FROM assets WHERE id=? AND draft_id=? AND kind IN ('vehicle','on_site') AND mime IN ('image/jpeg','image/png')");
 foreach($ids as $aid){$q->execute([draftId((string)$aid),$id]);$asset=$q->fetch();if(!$asset)throw new InvalidArgumentException('Фото не принадлежит машине или не подходит для поста.');$path=draftRoot().'/objects/'.$id.'/'.$asset['id'];
  if(is_link($path)||!is_file($path)||filesize($path)!==(int)$asset['bytes']||$asset['bytes']>8*1024*1024||!hash_equals($asset['digest'],hash_file('sha256',$path)))throw new InvalidArgumentException('Фотография недоступна, повреждена или больше 8 МБ.');
  $result[]=['tmp_name'=>$path,'size'=>$asset['bytes'],'error'=>UPLOAD_ERR_OK];
 }
 return $result;
}
