<?php if(!defined('ATLANT_DRAFT_STORE'))exit;
$record=productGet($detail['id'])['record']??null;
$data=['packet'=>$detail['packet'],'record'=>$record];
$photos=array_values(array_filter($detail['assets'],fn($a)=>in_array($a['kind'],['vehicle','on_site'],true)&&in_array($a['mime'],['image/jpeg','image/png'],true)&&$a['bytes']<=8*1024*1024));
$preferYard=in_array($record['state']??'auction',['on_site','sold'],true)&&array_filter($photos,fn($a)=>$a['kind']==='on_site');$defaults=array_slice(array_column(array_filter($photos,fn($a)=>!$preferYard||$a['kind']==='on_site'),'id'),0,5);
?>
<section class="panel"><h2>Telegram · черновик объявления</h2><p class="muted">Текст собирается по нашей логике из сохранённых данных, PartsLink и состояния ERP. Фотографии берутся с сервера: открывать Arval повторно не нужно. Отправка — в настроенный закрытый чат бота.</p>
<script id="erp-post-data" type="application/json"><?=json_encode($data,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_UNESCAPED_UNICODE)?></script>
<form id="erp-telegram-form" method="post" action="/drafts/telegram.php"><input type="hidden" name="csrf" value="<?=e($viewerCsrfToken)?>"><input type="hidden" name="draft_id" value="<?=e($detail['id'])?>">
<label>Текст поста<textarea id="erp-caption" name="caption" rows="18" required maxlength="1024"></textarea></label>
<fieldset><legend>Материалы по ссылкам в посте</legend><label><input id="share-inspection" type="checkbox" name="share_inspection" value="1"> Инспекция</label><label><input id="share-parts" type="checkbox" name="share_partslink" value="1"> PartsLink</label><label><input id="share-maintenance" type="checkbox" name="share_maintenance" value="1"> Сервисная история</label></fieldset>
<p class="muted">Фото повреждений выдаются читателю через бота. Инвойсы, транспортные документы, видео и внутренние комментарии не включаются. Отметьте только проверенные материалы, которые готовы выдавать читателям.</p>
<details><summary>Выбрать комплектацию для текста</summary><div id="erp-equipment" class="option-list"></div><p class="muted">«Пересобрать текст» заменит ручные правки. Комплектация самой машины при этом не меняется.</p></details><button type="button" id="erp-rebuild">Пересобрать текст</button>
<h3>Фотографии · от 2 до 10</h3><div class="photos"><?php foreach($photos as $photo):?><label><img loading="lazy" src="?asset=<?=e($photo['id'])?>" alt=""><input type="checkbox" name="photo_ids[]" value="<?=e($photo['id'])?>" <?=in_array($photo['id'],$defaults,true)?'checked':''?>> <?=e($photo['name'])?> · <?=$photo['kind']==='on_site'?'площадка':'аукцион'?></label><?php endforeach;?></div>
<?php viewerEmployeeField();?><p id="erp-post-status" role="status"></p><button id="erp-send" disabled>Отправить черновик в закрытый Telegram-чат</button>
</form><p class="muted">После отправки результат и текст сохраняются в истории автомобиля. При неопределённом результате сначала проверьте чат; автоматических повторов нет.</p></section><script type="module" src="/drafts/assets/erp-telegram.js?v=20261018-3"></script>
