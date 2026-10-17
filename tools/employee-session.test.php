<?php
declare(strict_types=1);
define('ATLANT_DRAFT_VIEWER',true);require $argv[1]??dirname(__DIR__).'/api/employee-session.php';
function employeeCheck(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
$key=str_repeat('a',48);$other=str_repeat('b',48);$hashes=['owner'=>hash('sha256',$key),'employee-2'=>hash('sha256',$other)];$session=['viewer'=>'presentation'];$at=100000;
$verified=employeeVerify($key,$hashes);employeeCheck($verified['actor']==='owner','Valid key resolves owner');employeeBind($session,$verified,$at);
employeeCheck(!str_contains(json_encode($session),$key),'Raw key never enters session');employeeCheck(employeeResolve($session,$hashes,true,$at+100)==='owner','Next request retains verified actor');
employeeCheck(employeeResolve($session,$hashes,false,$at+100)===null&&!isset($session['employee_actor']),'Viewer logout or expiry clears employee');
employeeBind($session,$verified,$at);employeeCheck(employeeResolve($session,$hashes,true,$at+28800)===null,'Absolute employee session bound');employeeBind($session,$verified,$at);employeeCheck(employeeResolve($session,[],true,$at+1)===null,'Revoked key clears session');
employeeBind($session,$verified,$at);$rotated=$hashes;$rotated['owner']=hash('sha256','replacement');employeeCheck(employeeResolve($session,$rotated,true,$at+1)===null,'Rotated key invalidates session');
employeeBind($session,employeeVerify($other,$hashes),$at);employeeCheck(employeeResolve($session,$hashes,true,$at+1)==='employee-2','Switch does not retain owner');employeeForget($session);employeeCheck(employeeResolve($session,$hashes,true,$at+1)===null,'Explicit disconnect clears privilege');
employeeCheck(employeeVerify('owner',$hashes)===null&&employeeVerify(str_repeat('z',48),$hashes)===null,'Actor name and invalid key not accepted as credentials');
employeeBind($session,$verified,$at+10);employeeCheck(employeeResolve($session,$hashes,true,$at)===null,'Future binding rejected');
echo "PASS employee sessions: raw key exclusion, role binding, expiry, logout, disconnect, rotation, revocation, invalid keys.\n";
