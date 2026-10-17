<?php
declare(strict_types=1);
if(empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off'){http_response_code(403);exit;}
header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');header('Cache-Control: no-store');
$origin=$_SERVER['HTTP_ORIGIN']??'';
if(in_array($origin,['https://atlantauto.pl','https://www.atlantauto.pl'],true)){header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin');}
if($_SERVER['REQUEST_METHOD']!=='GET'){http_response_code(405);exit;}
define('ATLANT_DRAFT_STORE',true);require dirname(__DIR__).'/internal-api/product-store.php';
try{
 if(isset($_GET['asset'])){
  $cars=productPublicList((string)($_GET['id']??''));$car=$cars[0]??null;$aid=draftId((string)$_GET['asset']);
  if(!$car||!in_array($aid,array_merge($car['photo_ids'],$car['document_ids']),true)){http_response_code(404);exit;}
  $q=productDb()->prepare('SELECT a.* FROM assets a JOIN vehicle_products p ON p.draft_id=a.draft_id WHERE a.id=? AND p.public_id=?');$q->execute([$aid,$car['id']]);$a=$q->fetch();
  $photo=in_array($aid,$car['photo_ids'],true);if(!$a||($photo?($a['kind']!=='vehicle'||!in_array($a['mime'],['image/jpeg','image/png','image/webp'],true)):(!in_array($a['kind'],['inspection','partslink'],true)||$a['mime']!=='application/pdf'))){http_response_code(404);exit;}
  $path=draftRoot().'/objects/'.$a['draft_id'].'/'.$aid;if(!is_file($path)){http_response_code(404);exit;}
  header('Content-Type: '.$a['mime']);header('Content-Length: '.filesize($path));header('Content-Disposition: inline; filename="'.($photo?'vehicle-photo.':($a['kind']==='inspection'?'inspection.':'equipment.')).($photo?['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$a['mime']]:'pdf').'"');readfile($path);exit;
 }
 if(($_GET['format']??'')==='json'){
  header('Content-Type: application/json; charset=utf-8');echo json_encode(['cars'=>productPublicList(isset($_GET['id'])?(string)$_GET['id']:null)],JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;
 }
 header('Content-Type: text/html; charset=utf-8');readfile(__DIR__.'/catalog.html');
}catch(InvalidArgumentException $e){http_response_code(404);}
catch(Throwable $e){error_log('Atlant public catalog unavailable');http_response_code(503);header('Content-Type: application/json; charset=utf-8');echo '{"error":"Catalog temporarily unavailable"}';}
