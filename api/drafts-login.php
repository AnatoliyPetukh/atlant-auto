<?php
declare(strict_types=1);
define('ATLANT_DRAFT_VIEWER',true);require dirname(__DIR__).'/internal-api/draft-viewer-auth.php';
$error='';$next=viewerNext((string)($_POST['next']??$_GET['next']??'/drafts/'));
if ($_SERVER['REQUEST_METHOD']==='POST') {
    if (!viewerCsrf()) {http_response_code(400);$error='Форма устарела. Обновите страницу и повторите вход.';}
    elseif (($_POST['action']??'')==='logout') {
        $_SESSION=[];session_destroy();setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/drafts/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);header('Location: /drafts/login.php',true,303);exit;
    } else {
        try {
            if (!viewerRate()) {http_response_code(429);header('Retry-After: 900');$error='Слишком много попыток входа. Повторите через 15 минут.';}
            else {
                $password=$_POST['password']??'';$username=$_POST['username']??'';
                $account=erpAccountAuthenticate($viewerAccounts,$username,$password);
                if ($account!==null) {
                    viewerRate(false,true);session_regenerate_id(true);
                    $_SESSION=['viewer'=>$account['username'],'last_seen'=>time(),'auth_at'=>time(),'hash_version'=>erpAccountVersion($account),'csrf'=>bin2hex(random_bytes(32))];
                    session_write_close();header('Location: '.$next,true,303);exit;
                }
                viewerRate(true);http_response_code(200);$error='Неверный логин или пароль.';
            }
        }catch(Throwable $e){http_response_code(503);$error='Вход временно недоступен. Попробуйте позже.';}
    }
}
if ($viewerSignedIn && !$error) {header('Location: '.$next,true,302);exit;}
function loginEscape(string $value): string {return htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
?><!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Вход · ATLANT AUTO</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2f5f7;color:#172934;font:16px/1.5 system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}main{background:white;border:1px solid #dce5e9;border-radius:18px;width:min(100%,440px);padding:36px}b{letter-spacing:2px;color:#087987}h1{font-size:28px;line-height:1.2;margin:28px 0 12px}p{color:#617783}label{display:block;margin-top:20px;font-weight:600}input{display:block;width:100%;font:inherit;border:1px solid #bacbd2;border-radius:8px;padding:12px;margin-top:7px}button{display:block;width:100%;font:inherit;font-weight:600;background:#0b7c87;color:white;border:0;border-radius:8px;padding:13px;margin-top:26px;cursor:pointer}.error{background:#fff0ed;color:#9e3324;border-radius:8px;padding:12px}small{color:#617783}</style></head><body><main><b>ATLANT AUTO</b><h1>Вход в ERP</h1><p>Закрытое хранилище автомобилей, фотографий и документов.</p>
<?php if($error): ?><p class="error" role="alert"><?=loginEscape($error)?></p><?php endif; ?>
<form method="post" action="/drafts/login.php"><input type="hidden" name="csrf" value="<?=loginEscape($_SESSION['csrf'])?>"><input type="hidden" name="next" value="<?=loginEscape($next)?>"><label>Логин<input name="username" autocomplete="username" required maxlength="100"></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required maxlength="1024"></label><button type="submit">Войти</button></form><p><small>Используйте отдельные логин и пароль ERP. Сессия завершается после 30 минут бездействия.</small></p></main></body></html>
