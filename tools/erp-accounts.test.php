<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
define('ATLANT_DRAFT_VIEWER',true);require $argv[1]??dirname(__DIR__).'/api/erp-accounts.php';
function expect(bool $value,string $message):void{if(!$value)throw new RuntimeException($message);}
$path=sys_get_temp_dir().'/erp-account-test-'.bin2hex(random_bytes(8)).'.json';putenv('ATLANT_ERP_ACCOUNTS='.$path);
try{
 $hash=password_hash('fixture-password',PASSWORD_BCRYPT);$config=['users'=>['admin-test'=>['password_hash'=>$hash,'role'=>'owner','enabled'=>true],'editor-test'=>['password_hash'=>$hash,'role'=>'publisher','enabled'=>true],'staff-test'=>['password_hash'=>$hash,'role'=>'staff','enabled'=>true],'disabled-test'=>['password_hash'=>$hash,'role'=>'publisher','enabled'=>false]]];file_put_contents($path,json_encode($config));
 $users=erpAccountsLoad();$editor=erpAccountAuthenticate($users,'editor-test','fixture-password');expect($editor!==null&&$editor['username']==='editor-test','Personal identity is retained');
 expect(erpAccountAuthenticate($users,'editor-test','wrong')===null&&erpAccountAuthenticate($users,'unknown','fixture-password')===null&&erpAccountAuthenticate($users,'disabled-test','fixture-password')===null,'Wrong, absent and disabled credentials rejected');
 expect(erpAccountAuthenticate($users,[],[])===null,'Malformed credentials rejected');
 $session=['viewer'=>'editor-test','auth_at'=>1000,'last_seen'=>1100,'hash_version'=>erpAccountVersion($editor)];expect(erpAccountSession($users,$session,1200)!==null,'Session resolves personal account');
 expect(erpAccountSession($users,$session,2900)===null&&erpAccountSession($users,$session,900)===null,'Idle/future sessions rejected');
 $absolute=$session;$absolute['last_seen']=29799;expect(erpAccountSession($users,$absolute,29800)===null,'Absolute expiry enforced');
 foreach(['password_hash'=>password_hash('rotated',PASSWORD_BCRYPT),'role'=>'staff','enabled'=>false]as$key=>$value){$changed=$users;$changed['editor-test'][$key]=$value;expect(erpAccountSession($changed,$session,1200)===null,'Account change revokes session: '.$key);}
 $removed=$users;unset($removed['editor-test']);expect(erpAccountSession($removed,$session,1200)===null,'Removal revokes session');
 expect(erpCanPublish('admin-test')&&erpCanPublish('editor-test')&&!erpCanPublish('staff-test')&&!erpCanPublish('disabled-test')&&!erpCanPublish('unknown'),'Publisher rights are distinct from staff and audit identity');
 file_put_contents($path,'{}');expect(!erpCanPublish('editor-test'),'Malformed configuration fails closed');
 echo "PASS personal ERP accounts: authentication, role permissions, identity, disabled accounts, expiry, rotation and revocation.\n";
}finally{@unlink($path);}
