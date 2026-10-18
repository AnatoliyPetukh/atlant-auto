<?php
declare(strict_types=1);
// Shared library; direct HTTP access is denied by internal-api/.htaccess.
if (!defined('ATLANT_DRAFT_VIEWER')) {http_response_code(404);exit;}
umask(0077);
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS']==='off') {http_response_code(403);exit;}
header('Cache-Control: private, no-store');header('Pragma: no-cache');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
$viewerPrivate=dirname(__DIR__).'/.atlant-internal';
$sessionDir=$viewerPrivate.'/draft-sessions';
if (!is_dir($sessionDir) && !mkdir($sessionDir,0700,true)) {http_response_code(503);exit('Не удалось открыть защищённую сессию.');}
ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');ini_set('session.gc_maxlifetime','1800');ini_set('session.gc_probability','1');ini_set('session.gc_divisor','100');
session_save_path($sessionDir);session_name('__Secure-atlant_drafts');
session_set_cookie_params(['lifetime'=>0,'path'=>'/drafts/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);
if (!session_start()) {http_response_code(503);exit('Не удалось открыть защищённую сессию.');}
require_once __DIR__.'/erp-accounts.php';
try{$viewerAccounts=erpAccountsLoad();}catch(Throwable $e){http_response_code(503);exit('Вход временно не настроен.');}
$viewerAccount=erpAccountSession($viewerAccounts,$_SESSION,time());
$viewerSignedIn=$viewerAccount!==null;
$viewerName=$viewerAccount['username']??'';
if (!$viewerSignedIn && isset($_SESSION['viewer'])) {$_SESSION=[];session_regenerate_id(true);}
if ($viewerSignedIn) $_SESSION['last_seen']=time();
if (!isset($_SESSION['csrf'])) $_SESSION['csrf']=bin2hex(random_bytes(32));
function viewerNext(string $value): string {
    return preg_match('#^/drafts/(?:index\.php)?(?:\?[^\r\n]*)?$#D',$value)?$value:'/drafts/';
}
function viewerCsrf(): bool {
    return is_string($_POST['csrf']??null) && hash_equals((string)$_SESSION['csrf'],$_POST['csrf']);
}
function viewerRate(bool $failed=false,bool $clear=false,string $scope='login'): bool {
    global $viewerPrivate;
    $dir=$viewerPrivate.'/draft-auth-rates';if(!is_dir($dir) && !mkdir($dir,0700,true))throw new RuntimeException('Rate storage unavailable');
    $path=$dir.'/'.hash('sha256',($scope==='employee'?'employee:':'').(string)($_SERVER['REMOTE_ADDR']??'unknown')).'.json';
    $file=fopen($path,'c+');if(!$file || !flock($file,LOCK_EX))throw new RuntimeException('Rate lock unavailable');
    try {
        $state=json_decode(stream_get_contents($file),true)?:['start'=>time(),'failures'=>0];
        if(time()-(int)$state['start']>=900 || $clear)$state=['start'=>time(),'failures'=>0];
        $allowed=(int)$state['failures']<8;if($failed)$state['failures']++;
        rewind($file);ftruncate($file,0);fwrite($file,json_encode($state));fflush($file);return $allowed;
    }finally{flock($file,LOCK_UN);fclose($file);}
}

// Personal ERP identity and permissions are established at sign-in.
$viewerEmployee=$viewerSignedIn?$viewerAccount['username']:null;
function viewerConfirmEmployee(string $key):string{
 global $viewerSignedIn,$viewerEmployee;
 if(!$viewerSignedIn||!viewerCsrf()||$viewerEmployee===null)throw new InvalidArgumentException('Сессия или форма устарела. Войдите заново.');
 return $viewerEmployee;
}
function viewerEmployeeField():void{}
