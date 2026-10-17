<?php
declare(strict_types=1);
if(!defined('ATLANT_DRAFT_VIEWER')){http_response_code(404);exit;}
// Pure session binding helpers. Never retain the raw employee key.
function employeeForget(array &$session):void{unset($session['employee_actor'],$session['employee_fingerprint'],$session['employee_auth_at']);}
function employeeVerify(string $key,array $hashes):?array{
 if(!preg_match('/^[A-Za-z0-9_-]{32,128}$/D',$key))return null;
 $digest=hash('sha256',$key);
 foreach($hashes as$actor=>$hash)if(is_string($actor)&&is_string($hash)&&hash_equals($hash,$digest))return ['actor'=>$actor,'fingerprint'=>$hash];
 return null;
}
function employeeBind(array &$session,array $verified,int $now):void{
 employeeForget($session);$session['employee_actor']=$verified['actor'];$session['employee_fingerprint']=$verified['fingerprint'];$session['employee_auth_at']=$now;
}
function employeeResolve(array &$session,array $hashes,bool $signedIn,int $now):?string{
 $actor=$session['employee_actor']??null;$fingerprint=$session['employee_fingerprint']??null;$at=$session['employee_auth_at']??null;
 if(!$signedIn||!is_string($actor)||!is_string($fingerprint)||!is_int($at)||$at>$now||$now-$at>=28800||!is_string($hashes[$actor]??null)||!hash_equals($hashes[$actor],$fingerprint)){employeeForget($session);return null;}
 return $actor;
}
