<?php
declare(strict_types=1);
// Stable ERP entry point; reuse the protected registry and its narrowly scoped cookie.
header('Cache-Control: no-store');
$params=[];
foreach(['id','q','state','offset'] as $key)if(isset($_GET[$key])&&is_string($_GET[$key]))$params[$key]=substr($_GET[$key],0,150);
header('Location: /drafts/'.($params?'?'.http_build_query($params):''),true,302);
exit;
