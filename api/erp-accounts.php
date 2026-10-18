<?php
declare(strict_types=1);
if(!defined('ATLANT_DRAFT_VIEWER')&&!defined('ATLANT_DRAFT_STORE')){http_response_code(404);exit;}
function erpAccountsLoad():array{
 $path=getenv('ATLANT_ERP_ACCOUNTS')?:dirname(__DIR__).'/.atlant-internal/erp-viewer-auth.json';
 $config=is_file($path)?json_decode((string)file_get_contents($path),true):null;
 if(!is_array($config)||!is_array($config['users']??null)||!$config['users'])throw new RuntimeException('ERP accounts unavailable');
 $users=[];
 foreach($config['users'] as $name=>$user){
  if(!is_string($name)||!preg_match('/^[A-Za-z0-9._-]{3,100}$/D',$name)||!is_array($user)||!is_string($user['password_hash']??null)||!str_starts_with($user['password_hash'],'$2')||!in_array($user['role']??null,['owner','publisher','staff'],true)||!is_bool($user['enabled']??null))throw new RuntimeException('Invalid ERP account');
  $users[$name]=['username'=>$name,'password_hash'=>$user['password_hash'],'role'=>$user['role'],'enabled'=>$user['enabled']];
 }
 return $users;
}
function erpAccountVersion(array $user):string{return hash('sha256',json_encode($user,JSON_THROW_ON_ERROR));}
function erpAccountAuthenticate(array $users,mixed $name,mixed $password):?array{
 if(!is_string($name)||!is_string($password)||strlen($name)>100||strlen($password)>1024)return null;
 $user=$users[$name]??null;$hash=$user['password_hash']??reset($users)['password_hash'];
 return password_verify($password,$hash)&&$user&&$user['enabled']?$user:null;
}
function erpAccountSession(array $users,array $session,int $now):?array{
 $name=$session['viewer']??null;$user=is_string($name)?($users[$name]??null):null;
 if(!$user||!$user['enabled']||!is_string($session['hash_version']??null)||!hash_equals(erpAccountVersion($user),$session['hash_version']))return null;
 foreach(['last_seen'=>1800,'auth_at'=>28800] as $key=>$limit)if(!is_int($session[$key]??null)||$session[$key]>$now||$now-$session[$key]>=$limit)return null;
 return $user;
}
function erpCanPublish(string $actor):bool{
 // The legacy owner actor is used by trusted CLI/extension workflows.
 if($actor==='owner')return true;
 try{$user=erpAccountsLoad()[$actor]??null;return $user&&$user['enabled']&&in_array($user['role'],['owner','publisher'],true);}catch(Throwable $e){return false;}
}
