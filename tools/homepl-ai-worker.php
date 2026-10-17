<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(403);exit;}
umask(0077);@set_time_limit(120);
$webroot=dirname(__DIR__);define('ATLANT_DRAFT_STORE',true);require $webroot.'/internal-api/ai-store.php';
$lock=fopen($webroot.'/.atlant-internal/ai-worker.lock','c');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))exit;
try{$state=aiRunOne();file_put_contents($webroot.'/.atlant-internal/ai-worker-status.json',json_encode(['checked_at'=>gmdate('c'),'state'=>$state],JSON_THROW_ON_ERROR));echo 'AI worker: '.$state."\n";}catch(Throwable $e){file_put_contents($webroot.'/.atlant-internal/ai-worker-status.json',json_encode(['checked_at'=>gmdate('c'),'state'=>'worker_error']));exit(1);}finally{flock($lock,LOCK_UN);fclose($lock);}
