<?php
declare(strict_types=1);

// Internal library. Apache denies direct HTTP access; entry points require auth first.
if (!defined('ATLANT_DRAFT_STORE')) { http_response_code(404); exit; }
umask(0077);
function draftRoot(): string {
    $root = getenv('ATLANT_DRAFT_ROOT') ?: dirname(__DIR__).'/.atlant-internal/vehicle-drafts';
    if (!is_dir($root) && !mkdir($root,0700,true)) throw new RuntimeException('Storage unavailable');
    return $root;
}
function draftDb(): PDO {
    static $db;
    if ($db) return $db;
    $db = new PDO('sqlite:'.draftRoot().'/drafts.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $db->exec('PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON;');
    $db->exec('CREATE TABLE IF NOT EXISTS drafts (id TEXT PRIMARY KEY, vin TEXT UNIQUE NOT NULL, title TEXT NOT NULL, lot_id TEXT NOT NULL, source_url TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, packet_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES drafts(id), digest TEXT NOT NULL, packet_json TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(draft_id,digest));
      CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES drafts(id), digest TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL, kind TEXT NOT NULL, source_url TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(draft_id,digest));
      CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, draft_id TEXT NOT NULL REFERENCES drafts(id), type TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL, details_json TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS events_draft ON events(draft_id,id);
      CREATE TABLE IF NOT EXISTS deleted_drafts (draft_id TEXT PRIMARY KEY REFERENCES drafts(id), deleted_at TEXT NOT NULL, actor TEXT NOT NULL);');
    chmod(draftRoot().'/drafts.sqlite',0600);
    return $db;
}
function draftId(string $id): string {
    if (!preg_match('/^[a-f0-9]{32}$/D',$id)) throw new InvalidArgumentException('Некорректный ID.');
    return $id;
}
function draftEvent(PDO $db,string $id,string $type,string $actor,array $details=[]): void {
    $q=$db->prepare('INSERT INTO events(draft_id,type,actor,created_at,details_json) VALUES (?,?,?,?,?)');
    $q->execute([$id,$type,$actor,gmdate('c'),json_encode($details,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE)]);
}
function draftCapture(array $packet,string $actor): array {
    $vin=$packet['vehicle']['vin'] ?? null;
    if (!is_string($vin) || !preg_match('/^[A-HJ-NPR-Z0-9]{17}$/D',$vin)) throw new InvalidArgumentException('Нужен корректный VIN.');
    $json=json_encode($packet,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    if (strlen($json)>2*1024*1024) throw new InvalidArgumentException('Данные больше 2 МБ.');
    $title=trim((string)($packet['vehicle']['display_title']??''));
    if($title==='') {
        $make=trim((string)($packet['vehicle']['make']??''));$raw=trim((string)($packet['vehicle']['title']??''));
        $title=$make!=='' && !preg_match('/^'.preg_quote($make,'/').'(?:\s|$)/iu',$raw)?trim($make.' '.$raw):$raw;
    }
    $title=mbSafeCut($title,250);
    $source=(string)($packet['source']['url']??'');
    $lot=(string)($packet['source']['lot_id']??$packet['auction']['lot_id']??$packet['source']['item_id']??'');
    if (strlen($source)>2048 || strlen($lot)>150) throw new InvalidArgumentException('Слишком длинный адрес или номер лота.');
    $db=draftDb(); $db->exec('BEGIN IMMEDIATE');
    try {
        $q=$db->prepare('SELECT id,packet_json FROM drafts WHERE vin=?');$q->execute([$vin]);$previous=$q->fetch();$id=$previous['id']??null;
        $deleted=$db->prepare('SELECT 1 FROM deleted_drafts WHERE draft_id=?');$deleted->execute([$id]);if($id&&$deleted->fetchColumn())throw new InvalidArgumentException('Автомобиль удалён из ERP. Владелец может восстановить его из корзины перед повторной загрузкой.');
        $created=!$id; $id=$id?:bin2hex(random_bytes(16));$now=gmdate('c');
        if ($created) {
            if ((int)$db->query('SELECT COUNT(*) FROM drafts')->fetchColumn()>=10000) throw new RuntimeException('Draft quota reached');
            $q=$db->prepare('INSERT INTO drafts VALUES (?,?,?,?,?,?,?,?)');$q->execute([$id,$vin,$title,$lot,$source,$now,$now,$json]);
        }
        $q=$db->prepare('SELECT id FROM snapshots WHERE draft_id=? AND digest=?');$digest=hash('sha256',$json);$q->execute([$id,$digest]);
        $duplicate=(bool)$q->fetchColumn();
        if (!$duplicate) {
            $q=$db->prepare('SELECT COUNT(*) FROM snapshots WHERE draft_id=?');$q->execute([$id]);
            if ((int)$q->fetchColumn()>=100) throw new RuntimeException('Snapshot quota reached');
            $q=$db->prepare('INSERT INTO snapshots VALUES (?,?,?,?,?,?)');$q->execute([bin2hex(random_bytes(16)),$id,$digest,$json,$actor,$now]);
            draftEvent($db,$id,$created?'created':'source_updated',$actor,['snapshot_sha256'=>$digest]);
        }
        if ($duplicate && $previous['packet_json']!==$json) draftEvent($db,$id,'source_restored',$actor,['snapshot_sha256'=>$digest]);
        $q=$db->prepare('UPDATE drafts SET title=?,lot_id=?,source_url=?,updated_at=?,packet_json=? WHERE id=?');$q->execute([$title,$lot,$source,$now,$json,$id]);
        $db->exec('COMMIT');return ['id'=>$id,'vin'=>$vin,'duplicate'=>$duplicate];
    } catch(Throwable $e) {$db->exec('ROLLBACK');throw $e;}
}
function mbSafeCut(string $value,int $length): string {
    return function_exists('mb_substr')?mb_substr($value,0,$length):substr($value,0,$length);
}
function draftFind(string $id): array {
    $q=draftDb()->prepare('SELECT * FROM drafts WHERE id=? AND NOT EXISTS (SELECT 1 FROM deleted_drafts x WHERE x.draft_id=drafts.id)');$q->execute([draftId($id)]);$row=$q->fetch();
    if (!$row) throw new OutOfBoundsException('Черновик не найден.');return $row;
}
function draftList(string $search='',int $offset=0): array {
    $search=mbSafeCut($search,150);$q=draftDb()->prepare('SELECT id,vin,title,lot_id,created_at,updated_at,(SELECT COUNT(*) FROM assets WHERE draft_id=d.id) AS asset_count FROM drafts d WHERE NOT EXISTS (SELECT 1 FROM deleted_drafts x WHERE x.draft_id=d.id) AND (vin LIKE ? OR title LIKE ? OR lot_id LIKE ?) ORDER BY updated_at DESC,id LIMIT 50 OFFSET ?');
    $term='%'.strtr($search,['%'=>'','_'=>'']).'%';
    $q->bindValue(1,$term);$q->bindValue(2,$term);$q->bindValue(3,$term);$q->bindValue(4,max(0,$offset),PDO::PARAM_INT);$q->execute();return $q->fetchAll();
}
function draftDetail(string $id): array {
    $row=draftFind($id);$row['packet']=json_decode($row['packet_json'],true,512,JSON_THROW_ON_ERROR);unset($row['packet_json']);
    foreach (['assets'=>'SELECT * FROM assets WHERE draft_id=? ORDER BY rowid','events'=>'SELECT * FROM events WHERE draft_id=? ORDER BY id DESC LIMIT 100','snapshots'=>'SELECT id,digest,actor,created_at FROM snapshots WHERE draft_id=? ORDER BY rowid DESC'] as $key=>$sql) {
        $q=draftDb()->prepare($sql);$q->execute([$id]);$row[$key]=$q->fetchAll();
    }
    $row['damage_requests']=[];
    if(draftDb()->query("SELECT name FROM sqlite_master WHERE type='table' AND name='damage_requests'")->fetchColumn()) {
        $q=draftDb()->prepare('SELECT id,user_json,status,created_at FROM damage_requests WHERE draft_id=? ORDER BY created_at DESC LIMIT 100');$q->execute([$id]);$row['damage_requests']=$q->fetchAll();
    }
    return $row;
}
function draftUploadMimeAllowed(string $kind,string $mime):bool {
 $images=['image/jpeg','image/png','image/webp'];$video=['video/mp4','video/quicktime','video/webm'];
 if(in_array($kind,['vehicle','on_site','damage'],true))return in_array($mime,$images,true);
 if(in_array($kind,['invoice','transport','registration','inspection','partslink','specification'],true))return $mime==='application/pdf';
 if($kind==='inspection_video')return in_array($mime,$video,true);
 if($kind==='review')return $mime==='application/pdf'||in_array($mime,$video,true);
 return $kind==='document'&&($mime==='application/pdf'||in_array($mime,$images,true));
}
function draftUpload(string $id,array $file,string $kind,string $source,string $actor): array {
    draftFind($id);
    if (!in_array($kind,['vehicle','on_site','damage','inspection','partslink','document','invoice','transport','registration','specification','inspection_video','review'],true)) throw new InvalidArgumentException('Некорректный тип файла.');
    if (strlen($source)>2048 || is_array($file['error']??null) || ($file['error']??-1)!==UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name']??'') || ($file['size']??0)<=0 || $file['size']>20*1024*1024) throw new InvalidArgumentException('Файл не загружен или больше 20 МБ.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!draftUploadMimeAllowed($kind,$mime)) throw new InvalidArgumentException('Формат файла не подходит для выбранного раздела.');
    if ($kind==='on_site'&&!in_array($mime,['image/jpeg','image/png','image/webp'],true))throw new InvalidArgumentException('Для площадки нужны фотографии.');
    if (str_starts_with($mime,'image/')) {
        $size=@getimagesize($file['tmp_name']);if (!$size || $size[0]*$size[1]>50000000) throw new InvalidArgumentException('Некорректные размеры изображения.');
    }
    $digest=hash_file('sha256',$file['tmp_name']);$db=draftDb();$db->exec('BEGIN IMMEDIATE');$path=null;
    try {
        $q=$db->prepare('SELECT id,kind,mime FROM assets WHERE draft_id=? AND digest=?');$q->execute([$id,$digest]);$existing=$q->fetch();
        if ($existing) {
            if ($existing['mime']==='application/pdf' && in_array($existing['kind'],['inspection','partslink','document'],true) && in_array($kind,['inspection','partslink','document'],true) && $existing['kind']!==$kind) {
                $db->prepare('UPDATE assets SET kind=? WHERE id=?')->execute([$kind,$existing['id']]);draftEvent($db,$id,'file_reclassified',$actor,['asset_id'=>$existing['id'],'from'=>$existing['kind'],'to'=>$kind]);
            }
            $db->exec('COMMIT');return ['asset_id'=>$existing['id'],'duplicate'=>true];
        }
        $q=$db->prepare('SELECT COUNT(*),COALESCE(SUM(bytes),0) FROM assets WHERE draft_id=?');$q->execute([$id]);$usage=$q->fetch(PDO::FETCH_NUM);
        if ($usage[0]>=200 || $usage[1]+$file['size']>250*1024*1024 || (int)$db->query('SELECT COALESCE(SUM(bytes),0) FROM assets')->fetchColumn()+$file['size']>2*1024*1024*1024) throw new RuntimeException('File quota reached');
        $asset=bin2hex(random_bytes(16));$dir=draftRoot().'/objects/'.$id;
        if (!is_dir($dir) && !mkdir($dir,0700,true)) throw new RuntimeException('Cannot create object directory');
        $path=$dir.'/'.$asset;
        if (!move_uploaded_file($file['tmp_name'],$path)) throw new RuntimeException('Cannot store upload');chmod($path,0600);
        $name=mbSafeCut(basename(str_replace('\\','/',(string)($file['name']??'file'))),180);
        $q=$db->prepare('INSERT INTO assets VALUES (?,?,?,?,?,?,?,?,?)');$q->execute([$asset,$id,$digest,$name,$mime,$file['size'],$kind,$source,gmdate('c')]);
        draftEvent($db,$id,'file_added',$actor,['asset_id'=>$asset,'kind'=>$kind,'mime'=>$mime,'vin_verified'=>false]);
        $db->prepare('UPDATE drafts SET updated_at=? WHERE id=?')->execute([gmdate('c'),$id]);
        $db->exec('COMMIT');return ['asset_id'=>$asset,'duplicate'=>false];
    }catch(Throwable $e){$db->exec('ROLLBACK');if($path && is_file($path))unlink($path);throw $e;}
}
function draftServeAsset(string $asset): never {
    $q=draftDb()->prepare('SELECT * FROM assets WHERE id=? AND NOT EXISTS (SELECT 1 FROM deleted_drafts x WHERE x.draft_id=assets.draft_id)');$q->execute([draftId($asset)]);$row=$q->fetch();
    if (!$row) {http_response_code(404);exit;}
    $path=draftRoot().'/objects/'.$row['draft_id'].'/'.$row['id'];
    if (!is_file($path)) {http_response_code(404);exit;}
    header('Content-Type: '.$row['mime']);header('Content-Length: '.filesize($path));header('X-Content-Type-Options: nosniff');header('Cache-Control: no-store');
    header('Content-Security-Policy: sandbox; default-src \'none\'');
    header('Content-Disposition: '.(str_starts_with($row['mime'],'image/')?'inline':'attachment').'; filename="file.'.(['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','application/pdf'=>'pdf','video/mp4'=>'mp4','video/quicktime'=>'mov','video/webm'=>'webm'][$row['mime']]).'"');
    readfile($path);exit;
}
function draftTelegramReceipt(string $vin,string $requestId,string $status,string $caption,array $ids,string $actor): bool {
    $db=draftDb();$db->exec('BEGIN IMMEDIATE');
    try {
        $q=$db->prepare('SELECT id FROM drafts WHERE vin=?');$q->execute([$vin]);$id=$q->fetchColumn();
        if (!$id) {$db->exec('COMMIT');return false;}
        // A repeated idempotent Telegram request must not add another event.
        $q=$db->prepare('SELECT id FROM events WHERE draft_id=? AND type=? AND json_extract(details_json,\'$.request_id\')=? LIMIT 1');
        $q->execute([$id,'telegram_'.$status,$requestId]);
        if (!$q->fetchColumn()) draftEvent($db,$id,'telegram_'.$status,$actor,['request_id'=>$requestId,'caption'=>$caption,'message_ids'=>$ids]);
        $db->exec('COMMIT');return true;
    }catch(Throwable $e){$db->exec('ROLLBACK');throw $e;}
}
