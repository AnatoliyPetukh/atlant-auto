<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS']==='off') {http_response_code(403);exit;}
define('ATLANT_TELEGRAM_SERVER',true);$configPath=getenv('ATLANT_TELEGRAM_CONFIG')?:dirname(__DIR__).'/.atlant-internal/telegram-draft-config.php';
if(!is_file($configPath)){http_response_code(503);exit;}$config=require $configPath;
$secret=$config['webhook_secret']??'';$provided=$_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN']??'';
if(!is_string($secret) || strlen($secret)<32 || !is_string($provided) || !hash_equals($secret,$provided)){http_response_code(403);exit('{"ok":false}');}
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);exit;}
if((int)($_SERVER['CONTENT_LENGTH']??0)>256*1024){http_response_code(413);exit;}
define('ATLANT_DRAFT_STORE',true);require __DIR__.'/telegram-actions.php';
try {
    $update=json_decode(file_get_contents('php://input',false,null,0,256*1024+1),true,512,JSON_THROW_ON_ERROR);
    if(!is_array($update))throw new InvalidArgumentException();
    $status=actionHandle($update,$config,fn($method,$data)=>actionBotCall($config,$method,$data));
    echo json_encode(['ok'=>true,'status'=>$status]);
}catch(JsonException|InvalidArgumentException $e){http_response_code(400);echo '{"ok":false}';}
catch(Throwable $e){error_log('Atlant webhook storage unavailable');http_response_code(503);echo '{"ok":false}';}
