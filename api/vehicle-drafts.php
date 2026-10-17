<?php
declare(strict_types=1);
function storeReply(int $status,array $body): never {
    http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
    echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;
}
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS']==='off') storeReply(403,['ok'=>false,'error'=>'HTTPS required']);
define('ATLANT_TELEGRAM_SERVER',true);
$configPath=getenv('ATLANT_TELEGRAM_CONFIG')?:dirname(__DIR__).'/.atlant-internal/telegram-draft-config.php';
if (!is_file($configPath)) storeReply(503,['ok'=>false,'error'=>'Access not configured']);
$config=require $configPath;$origin=$_SERVER['HTTP_ORIGIN']??'';
if ($origin!=='') {
    if (!in_array($origin,$config['allowed_origins']??[],true)) storeReply(403,['ok'=>false,'error'=>'Origin denied']);
    header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin');header('Access-Control-Allow-Methods: GET, POST, OPTIONS');header('Access-Control-Allow-Headers: Authorization, Content-Type');
}
if ($_SERVER['REQUEST_METHOD']==='OPTIONS') {http_response_code(204);exit;}
if (!in_array($_SERVER['REQUEST_METHOD'],['GET','POST'],true)) storeReply(405,['ok'=>false,'error'=>'Method not allowed']);
$auth=$_SERVER['HTTP_AUTHORIZATION']??'';$actor=null;
if (preg_match('/^Bearer ([A-Za-z0-9_-]{32,128})$/D',$auth,$m)) foreach (($config['employee_key_hashes']??[]) as $name=>$hash) if(hash_equals($hash,hash('sha256',$m[1])))$actor=(string)$name;
if ($actor===null) storeReply(401,['ok'=>false,'error'=>'Нужен действующий ключ сотрудника.']);
if($_SERVER['REQUEST_METHOD']==='GET' && ($_GET['action']??'')==='identity')storeReply(200,['ok'=>true,'employee'=>$actor]);
define('ATLANT_DRAFT_STORE',true);require __DIR__.'/draft-store.php';require __DIR__.'/product-store.php';
try {
    if ($_SERVER['REQUEST_METHOD']==='GET') {
        if (isset($_GET['asset'])) draftServeAsset((string)$_GET['asset']);
        storeReply(200,['ok'=>true,'data'=>isset($_GET['id'])?draftDetail((string)$_GET['id']):draftList((string)($_GET['q']??''),(int)($_GET['offset']??0))]);
    }
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>22*1024*1024) storeReply(413,['ok'=>false,'error'=>'Запрос больше 22 МБ.']);
    $action=$_GET['action']??'capture';
    if ($action==='asset') {
        if (count($_FILES)!==1) throw new InvalidArgumentException('Нужен один файл.');
        $result=draftUpload((string)($_POST['id']??''),$_FILES['file']??[],(string)($_POST['kind']??'document'),(string)($_POST['source_url']??''),$actor);
    } elseif (in_array($action,['product_create','product_save','product_publish','product_unpublish'],true)) {
        $body=json_decode(file_get_contents('php://input',false,null,0,2*1024*1024+1),true,512,JSON_THROW_ON_ERROR);
        if(!is_array($body))throw new InvalidArgumentException('Нужны данные карточки.');$id=draftId((string)($body['id']??''));
        if($action==='product_create')$product=productCreate($id,$actor);
        elseif($action==='product_save')$product=productSave($id,(int)($body['revision']??0),$body['changes']??[],$actor);
        elseif($action==='product_publish')$product=productPublish($id,(int)($body['revision']??0),$actor);
        else{productUnpublish($id,$actor);$product=productGet($id);}
        $result=['id'=>$id,'product'=>$product];
    } elseif ($action==='capture') {
        if ((int)($_SERVER['CONTENT_LENGTH']??0)>2*1024*1024) storeReply(413,['ok'=>false,'error'=>'Данные больше 2 МБ.']);
        $packet=json_decode(file_get_contents('php://input',false,null,0,2*1024*1024+1),true,512,JSON_THROW_ON_ERROR);
        if (!is_array($packet)) throw new InvalidArgumentException('Нужны данные автомобиля.');
        $result=draftCapture($packet,$actor);
    } else throw new InvalidArgumentException('Неизвестное действие.');
    storeReply(200,['ok'=>true]+$result);
}catch(DomainException $e){storeReply(409,['ok'=>false,'error'=>$e->getMessage()]);}
catch(InvalidArgumentException|JsonException|TypeError $e){storeReply(400,['ok'=>false,'error'=>'Некорректный запрос. Проверьте VIN, ID, формат и размер файла.']);}
catch(OutOfBoundsException $e){storeReply(404,['ok'=>false,'error'=>'Черновик не найден.']);}
catch(Throwable $e){error_log('Atlant draft storage: '.get_class($e));storeReply(503,['ok'=>false,'error'=>'Хранилище недоступно или достигнут лимит. Черновик может быть сохранён частично; перечитайте его перед повтором.']);}
