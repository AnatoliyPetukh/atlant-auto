<?php
declare(strict_types=1);

// Deploy only this file to public_html/internal-api/. Config/state use a denied directory
// inside home.pl's PHP filesystem jail; prefer an external private path when available.
function reply(int $code, array $body): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if(defined('ATLANT_ERP_TELEGRAM')){
        header('Content-Type: text/html; charset=utf-8');header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
        $id=(string)($_POST['draft_id']??'');$back='/drafts/'.(preg_match('/^[a-f0-9]{32}$/D',$id)?'?id='.$id.'&section=telegram':'');
        $message=!empty($body['ok'])?(!empty($body['duplicate'])?'Этот черновик уже был отправлен. Повторное сообщение не создавалось.':'Черновик отправлен в закрытый Telegram-чат. Ссылки на материалы находятся в подписи альбома.'):(string)($body['error']??'Отправка не подтверждена. Проверьте чат перед повтором.');
        echo '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Telegram · ATLANT AUTO</title><body style="font:18px/1.6 system-ui;max-width:760px;margin:70px auto;padding:24px"><h1>Telegram</h1><p>'.htmlspecialchars($message,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8').'</p><p><a href="'.htmlspecialchars($back,ENT_QUOTES,'UTF-8').'">Вернуться к автомобилю в ERP</a></p></body></html>';exit;
    }
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') reply(403, ['ok'=>false,'error'=>'HTTPS required']);
$configPath = getenv('ATLANT_TELEGRAM_CONFIG') ?: dirname(__DIR__) . '/.atlant-internal/telegram-draft-config.php';
if (!is_file($configPath)) reply(503, ['ok'=>false,'error'=>'Telegram ещё не подключён.']);
define('ATLANT_TELEGRAM_SERVER', true);
$config = require $configPath;
$erpMode=defined('ATLANT_ERP_TELEGRAM');
if($erpMode){
    define('ATLANT_DRAFT_VIEWER',true);require __DIR__.'/draft-viewer-auth.php';
    if(!$viewerSignedIn||!viewerCsrf())reply(403,['ok'=>false,'error'=>'Сессия или форма устарела. Откройте ERP и повторите после проверки чата.']);
    session_write_close();
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    if (!in_array($origin, $config['allowed_origins'] ?? [], true) && !($erpMode&&$origin==='https://serwer2454127.home.pl')) reply(403, ['ok'=>false,'error'=>'Extension origin denied']);
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['ok'=>false,'error'=>'POST required']);
$auth = $erpMode?'Bearer '.(string)($_POST['employee_key']??''):($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (!preg_match('/^Bearer ([A-Za-z0-9_-]{32,128})$/D', $auth, $m)) reply(401, ['ok'=>false,'error'=>'Нужен ключ сотрудника.']);
$employee = null;
foreach (($config['employee_key_hashes'] ?? []) as $name=>$hash) {
    if (hash_equals($hash, hash('sha256', $m[1]))) $employee = (string)$name;
}
if ($employee === null) reply(401, ['ok'=>false,'error'=>'Ключ сотрудника не принят.']);
$token = $config['bot_token'] ?? '';
$chat = (string)($config['chat_id'] ?? '');
if (!preg_match('/^[0-9]+:[A-Za-z0-9_-]+$/D', $token) || !preg_match('/^-[0-9]+$/D', $chat)) reply(503, ['ok'=>false,'error'=>'Закрытый чат бота не настроен.']);
if (!function_exists('curl_init')) reply(503, ['ok'=>false,'error'=>'На сервере нужен PHP cURL.']);
$storedPhotoFiles=[];$erpRecord=null;
if($erpMode){
    try{
        define('ATLANT_DRAFT_STORE',true);require_once __DIR__.'/erp-store.php';require_once __DIR__.'/product-store.php';
        $erpDraft=draftDetail(draftId((string)($_POST['draft_id']??'')));$erpRecord=productGet($erpDraft['id'])['record']??null;
        if(($erpDraft['packet']['vehicle']['publication_facts']['publication']['ready']??false)!==true)throw new InvalidArgumentException('Проверьте дату и тип двигателя через расширение: исходные данные ещё не готовы для Telegram.');
        if(($erpRecord['state']??'')==='closed')throw new InvalidArgumentException('Лот в архиве без покупки не отправляется как предложение.');
        $photoIds=$_POST['photo_ids']??[];if(!is_array($photoIds))throw new InvalidArgumentException('Проверьте фотографии.');
        $storedPhotoFiles=erpTelegramPhotoFiles($erpDraft['id'],$photoIds);
        $payload=['vin'=>$erpDraft['vin'],'caption'=>(string)($_POST['caption']??''),'photos'=>$photoIds,'buttons_version'=>1,'share_inspection'=>isset($_POST['share_inspection']),'share_partslink'=>isset($_POST['share_partslink']),'share_maintenance'=>isset($_POST['share_maintenance'])];
        $day=(new DateTimeImmutable('now',new DateTimeZone('Europe/Warsaw')))->format('Y-m-d');$payload['request_id']=hash('sha256',json_encode([$payload,$employee,$day],JSON_THROW_ON_ERROR));
    }catch(Throwable $e){reply(400,['ok'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'Не удалось прочитать автомобиль и фотографии. Отправка не выполнялась.']);}
}else $payload = json_decode($_POST['payload'] ?? '', true);
if (!is_array($payload)) reply(400, ['ok'=>false,'error'=>'Некорректные данные.']);
$caption = trim((string)($payload['caption'] ?? ''));
$vin = (string)($payload['vin'] ?? '');
$requestId = (string)($payload['request_id'] ?? '');
if (!preg_match('/^[A-HJ-NPR-Z0-9]{17}$/D', $vin) || !preg_match('/^[a-f0-9]{64}$/D', $requestId)) reply(400, ['ok'=>false,'error'=>'Некорректный VIN или ID запроса.']);
$charCount = preg_match_all('/./us', $caption);
if ($caption === '' || $charCount === false || $charCount > 1024) reply(400, ['ok'=>false,'error'=>'Подпись длиннее 1024 знаков или пуста.']);
// Enforce the private-source boundary even for old extensions or manually edited text.
if (preg_match('/remktg\.arval\.com/i', $caption)) reply(400, ['ok'=>false,'error'=>'Закрытая ссылка Arval не должна попадать в пост. Удалите её из текста.']);
if (!is_array($payload['photos'] ?? null)) reply(400, ['ok'=>false,'error'=>'Некорректный список фотографий.']);
$count = count($payload['photos']);
if ($count < 2 || $count > 10 || (!$erpMode&&count($_FILES) !== $count)) reply(400, ['ok'=>false,'error'=>'Нужно от 2 до 10 фотографий.']);
if(!defined('ATLANT_DRAFT_STORE'))define('ATLANT_DRAFT_STORE',true);
require_once __DIR__.'/telegram-actions.php';
try {
    $q=draftDb()->prepare('SELECT packet_json FROM drafts WHERE vin=?');$q->execute([$vin]);$saved=$q->fetchColumn();
    $presentation=actionPostPresentation($caption,$saved?json_decode($saved,true,512,JSON_THROW_ON_ERROR):[],!$erpMode||($erpRecord['state']??'auction')==='auction');
}catch(Throwable $e){reply(503,['ok'=>false,'error'=>'Не удалось подготовить оформление поста. Альбом не отправлен.']);}
if(preg_match_all('/./us',$presentation['caption'])>1024)reply(400,['ok'=>false,'error'=>'После оформления подпись длиннее 1024 знаков. Сократите описание.']);
$post = ['chat_id'=>$chat, 'disable_notification'=>'true'];
$media = []; $hashes = [];
for ($i=0; $i<$count; $i++) {
    $file = $erpMode?($storedPhotoFiles[$i]??null):($_FILES['photo_'.$i] ?? null);
    if (!$file || is_array($file['error']) || $file['error'] !== UPLOAD_ERR_OK || (!$erpMode&&!is_uploaded_file($file['tmp_name'])) || $file['size'] <= 0 || $file['size'] > 8*1024*1024) reply(400, ['ok'=>false,'error'=>'Фотография не загружена или больше 8 МБ.']);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $size = @getimagesize($file['tmp_name']);
    if (!in_array($mime, ['image/jpeg','image/png'], true) || !$size || $size[0]+$size[1] > 10000 || max($size[0],$size[1])/max(1,min($size[0],$size[1])) > 20) reply(400, ['ok'=>false,'error'=>'Неподдерживаемый формат или размеры фото.']);
    $name = 'file'.$i;
    $post[$name] = new CURLFile($file['tmp_name'], $mime, ($i+1).($mime==='image/png'?'.png':'.jpg'));
    $item = ['type'=>'photo','media'=>'attach://'.$name];
    if ($i===0) {$item['caption']=$presentation['caption'];$item['caption_entities']=$presentation['caption_entities'];}
    $media[]=$item; $hashes[]=hash_file('sha256', $file['tmp_name']);
}
$post['media']=json_encode($media, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$withButtons=($payload['buttons_version']??null)===1;
$shareOptions=['inspection'=>($payload['share_inspection']??false)===true,'parts'=>($payload['share_partslink']??false)===true];
$digestData=[$vin,$caption,$hashes,$employee];if($withButtons)$digestData[]=['buttons_version'=>1]+$shareOptions;
if($withButtons && array_key_exists('share_maintenance',$payload))$digestData[]=['maintenance'=>($payload['share_maintenance']??false)===true];
$shareOptions['maintenance']=($payload['share_maintenance']??false)===true;
$digest=hash('sha256', json_encode($digestData));
$stateDir=$config['state_dir'] ?? '';
if (!is_dir($stateDir) || !is_writable($stateDir)) reply(503, ['ok'=>false,'error'=>'Не настроено хранилище статусов отправки.']);
$lock=fopen($stateDir.'/delivery.lock','c');
if (!$lock || !flock($lock,LOCK_EX|LOCK_NB)) reply(429, ['ok'=>false,'error'=>'Другая отправка ещё выполняется.']);
$statePath=$stateDir.'/delivery.json';
$state=is_file($statePath)?json_decode(file_get_contents($statePath),true):['requests'=>[],'last_attempt'=>0];
if (!is_array($state) || !isset($state['requests'])) reply(503, ['ok'=>false,'error'=>'Повреждено хранилище статусов.']);
function saveState(string $path, array $state): void {
    $temp=$path.'.tmp';
    if (file_put_contents($temp,json_encode($state),LOCK_EX)===false || !rename($temp,$path)) reply(503, ['ok'=>false,'error'=>'Не удалось сохранить статус. Проверьте чат перед повтором.']);
    chmod($path,0600);
}
$existing=$state['requests'][$requestId] ?? null;
if ($existing) {
    if (!hash_equals($existing['digest'],$digest)) reply(409, ['ok'=>false,'error'=>'ID запроса уже используется с другими данными.']);
    if ($existing['status']==='sent') reply(200, ['ok'=>true,'duplicate'=>true,'message_ids'=>$existing['message_ids'],'buttons_status'=>$existing['buttons_status']??null,'buttons_message_id'=>$existing['buttons_message_id']??null]);
    reply(409, ['ok'=>false,'error'=>'Попытка уже зарегистрирована. Проверьте закрытый чат; повтор требует проверки администратором.']);
}
if (time()-($state['last_attempt'] ?? 0)<5) reply(429, ['ok'=>false,'error'=>'Подождите несколько секунд между альбомами.']);
$offer=null;
if($withButtons) {
    try {
        if(!defined('ATLANT_DRAFT_STORE'))define('ATLANT_DRAFT_STORE',true);require_once __DIR__.'/telegram-actions.php';
        if(empty($config['bot_username']) || empty($config['webhook_secret']))throw new RuntimeException('Buttons not configured');
        $offer=actionOffer($vin,$requestId,$shareOptions);
        $presentation=actionPostMaterials($presentation,$offer['token'],$config['bot_username']);
    }catch(Throwable $e){reply(503,['ok'=>false,'error'=>'Кнопки ещё не готовы. Сохраните черновик на сервере и проверьте настройку бота. Альбом не отправлен.']);}
}
if($withButtons) {
    if(preg_match_all('/./us',$presentation['caption'])>1024)reply(400,['ok'=>false,'error'=>'Подпись с оформлением и ссылками на материалы длиннее 1024 знаков. Сократите описание или число опций. Альбом не отправлен.']);
    $media[0]['caption']=$presentation['caption'];$media[0]['caption_entities']=$presentation['caption_entities'];
    $post['media']=json_encode($media,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
}
$state['requests'][$requestId]=['digest'=>$digest,'status'=>'sending','at'=>time(),'employee'=>$employee];
$state['last_attempt']=time();saveState($statePath,$state);
function recordDraftDelivery(string $status,array $ids=[]): bool {
    global $vin,$requestId,$caption,$employee;
    try {
        if (!defined('ATLANT_DRAFT_STORE')) define('ATLANT_DRAFT_STORE',true);
        require_once __DIR__.'/draft-store.php';
        return draftTelegramReceipt($vin,$requestId,$status,$caption,$ids,$employee);
    } catch(Throwable $e) {error_log('Atlant Telegram receipt storage unavailable');return false;}
}
recordDraftDelivery('sending');
$curl=curl_init('https://api.telegram.org/bot'.$token.'/sendMediaGroup');
curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$post,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>15,CURLOPT_TIMEOUT=>95,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
$raw=curl_exec($curl);$response=is_string($raw)?json_decode($raw,true):null;curl_close($curl);
if (!is_array($response) || !isset($response['ok'])) {
    $state['requests'][$requestId]['status']='uncertain';saveState($statePath,$state);
    recordDraftDelivery('uncertain');
    reply(502,['ok'=>false,'error'=>'Telegram не подтвердил результат. Проверьте закрытый чат перед повтором.']);
}
if (!$response['ok']) {
    $state['requests'][$requestId]['status']='rejected';saveState($statePath,$state);
    recordDraftDelivery('rejected');
    reply(502,['ok'=>false,'error'=>'Telegram отклонил альбом. Администратору нужно проверить права бота и фотографии.']);
}
$ids=array_column($response['result'],'message_id');
$state['requests'][$requestId]['status']='sent';$state['requests'][$requestId]['message_ids']=$ids;saveState($statePath,$state);
$historySaved=recordDraftDelivery('sent',$ids);
$buttonsStatus=null;$buttonsId=null;
if($withButtons) {
    // Material links are part of the confirmed album caption; no second message.
    $buttonsStatus='sent';$buttonsId=$ids[0]??null;
    $state['requests'][$requestId]['buttons_status']=$buttonsStatus;$state['requests'][$requestId]['buttons_message_id']=$buttonsId;saveState($statePath,$state);
    recordDraftDelivery('buttons_'.$buttonsStatus,$buttonsId?[$buttonsId]:[]);
}
reply(200,['ok'=>true,'message_ids'=>$ids,'history_saved'=>$historySaved,'buttons_status'=>$buttonsStatus,'buttons_message_id'=>$buttonsId]);
