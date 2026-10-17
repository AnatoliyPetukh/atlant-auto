<?php
declare(strict_types=1);
// Install in the HTTP-denied .atlant-internal directory. Provider cron runs CLI.
if(PHP_SAPI!=='cli'){http_response_code(403);exit;}
umask(0077);
$internal=getenv('ATLANT_BACKUP_INTERNAL')?:__DIR__;
$source=$internal.'/vehicle-drafts';$vault=$internal.'/backups';
foreach([$vault,$vault.'/objects',$vault.'/snapshots'] as $dir)if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Cannot create private backup directory');
$lock=fopen($vault.'/backup.lock','c');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))exit(0);
$latest=is_file($vault.'/last-success.json')?json_decode(file_get_contents($vault.'/last-success.json'),true):null;
$dayLocal=(new DateTimeImmutable('now',new DateTimeZone('Europe/Warsaw')))->format('Y-m-d');
if(($latest['day_local']??'')===$dayLocal&&!in_array('--force',$argv??[],true)){echo "Backup already completed today.\n";exit(0);}
$tag=gmdate('Ymd\THis\Z').'-'.bin2hex(random_bytes(4));$stage=$vault.'/snapshots/.pending-'.$tag;mkdir($stage,0700);
try{
 $db=new SQLite3($source.'/drafts.sqlite',SQLITE3_OPEN_READONLY);$db->busyTimeout(10000);$snapshot=new SQLite3($stage.'/drafts.sqlite');
 if(!$db->backup($snapshot)||$snapshot->querySingle('PRAGMA integrity_check')!=='ok')throw new RuntimeException('Snapshot database verification failed');
 $snapshot->close();$db->close();$check=new SQLite3($stage.'/drafts.sqlite',SQLITE3_OPEN_READONLY);$rows=$check->query('SELECT id,draft_id,digest,bytes FROM assets');$count=0;$copied=0;
 while($row=$rows->fetchArray(SQLITE3_ASSOC)){
  if(!preg_match('/^[a-f0-9]{32}$/D',$row['id'])||!preg_match('/^[a-f0-9]{32}$/D',$row['draft_id'])||!preg_match('/^[a-f0-9]{64}$/D',$row['digest']))throw new RuntimeException('Invalid asset identifier');
  $src=$source.'/objects/'.$row['draft_id'].'/'.$row['id'];$target=$vault.'/objects/'.$row['digest'];
  if(is_link($src)||!is_file($src)||filesize($src)!==(int)$row['bytes']||!hash_equals($row['digest'],hash_file('sha256',$src)))throw new RuntimeException('Source asset verification failed');
  if(!is_file($target)){
   $temp=$target.'.pending';if(!copy($src,$temp)||!hash_equals($row['digest'],hash_file('sha256',$temp)))throw new RuntimeException('Backup asset copy failed');chmod($temp,0600);if(!rename($temp,$target))throw new RuntimeException('Cannot commit asset');$copied++;
  }
  if(is_link($target)||!hash_equals($row['digest'],hash_file('sha256',$target)))throw new RuntimeException('Backup asset verification failed');$count++;
 }
 $check->close();$manifest=['id'=>$tag,'day_local'=>$dayLocal,'timezone'=>'Europe/Warsaw','created_at'=>gmdate('c'),'database_sha256'=>hash_file('sha256',$stage.'/drafts.sqlite'),'assets_verified'=>$count,'new_objects'=>$copied,'retention_snapshots'=>14];
 if(file_put_contents($stage.'/manifest.json',json_encode($manifest,JSON_PRETTY_PRINT))===false||!rename($stage,$vault.'/snapshots/'.$tag))throw new RuntimeException('Cannot commit backup snapshot');
 file_put_contents($vault.'/last-success.json.new',json_encode($manifest,JSON_PRETTY_PRINT));rename($vault.'/last-success.json.new',$vault.'/last-success.json');
 $tags=array_values(array_filter(scandir($vault.'/snapshots'),fn($s)=>preg_match('/^\d{8}T\d{6}Z-[a-f0-9]{8}$/D',$s)));rsort($tags,SORT_STRING);
 foreach(array_slice($tags,14)as$old){$dir=$vault.'/snapshots/'.$old;foreach(['drafts.sqlite','manifest.json']as$file)if(is_file($dir.'/'.$file)&&!is_link($dir.'/'.$file))unlink($dir.'/'.$file);rmdir($dir);}
 // Keep only content-addressed objects referenced by retained snapshots.
 $needed=[];foreach(array_slice($tags,0,14)as$kept){$r=new SQLite3($vault.'/snapshots/'.$kept.'/drafts.sqlite',SQLITE3_OPEN_READONLY);$q=$r->query('SELECT digest FROM assets');while($asset=$q->fetchArray(SQLITE3_ASSOC))$needed[$asset['digest']]=true;$r->close();}
 foreach(scandir($vault.'/objects')as$name)if(preg_match('/^[a-f0-9]{64}$/D',$name)&&!isset($needed[$name])&&!is_link($vault.'/objects/'.$name))unlink($vault.'/objects/'.$name);
 echo json_encode($manifest)."\n";
}catch(Throwable $e){file_put_contents($vault.'/last-error.json',json_encode(['at'=>gmdate('c'),'error'=>$e->getMessage()]));error_log('Atlant backup failed: '.$e->getMessage());throw $e;}
