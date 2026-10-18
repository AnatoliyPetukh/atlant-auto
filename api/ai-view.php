<?php
if(!defined('ATLANT_DRAFT_VIEWER')||!$viewerSignedIn){http_response_code(404);exit;}
$jobs=aiJobs($detail['id']);$aiLabels=['queued'=>'В очереди','running'=>'Обрабатывается','needs_review'=>'Готово · проверьте результат','ready'=>'Готово','error'=>'Ошибка · можно повторить вручную','uncertain'=>'Результат запроса неизвестен · проверьте перед повтором'];
?>
<section class="panel"><h2>Описание и переводы</h2>
<?php if(!empty($productError)):?><p role="alert" style="color:#a52b2b"><?=e($productError)?></p><?php endif;?>
<?php $latestJob=$jobs[0]??null;$generationMessage=match($latestJob['state']??''){
 'queued'=>'✓ Задача принята и поставлена в очередь. Ожидайте: сервер проверяет очередь каждые 5 минут. Можно закрыть страницу — задача сохранена.',
 'running'=>'✓ Задача обрабатывается. Подождите, затем обновите страницу — результат появится ниже.',
 'needs_review','ready'=>'✓ Описание готово. Результат ниже — проверьте его перед сохранением в карточку.',
 default=>null};if($generationMessage):?>
<p role="status" style="padding:14px 16px;background:#e7f5eb;color:#216b3a;border:1px solid #b7dfc3;border-radius:8px;font-weight:600"><?=e($generationMessage)?></p>
<?php elseif($latestJob&&in_array($latestJob['state'],['error','uncertain'],true)):?>
<p role="alert" style="padding:14px 16px;background:#fff3de;color:#80540b;border:1px solid #e9ce98;border-radius:8px">Задача требует внимания. Проверьте сообщение ниже перед повторным запуском.</p>
<?php endif;?><p>Сервер подготовит польское и русское описание, перевод сервисной истории и замечаний. Задача продолжит выполняться после закрытия браузера. Обработчик проверяет очередь каждые 5 минут.</p>
<?php if(!aiConfigured()):?><p class="tag">Генератор пока не подключён: ожидается настройка API-ключа.</p><?php endif;?>
<p>Характеристики и сервисная история из карточки аукциона используются как основа. Дополнительные источники включайте отдельно: PartsLink, инспекции и выбранные фотографии. Инвойсы, транспортные и регистрационные документы, внутренние комментарии не передаются. Проверьте PDF и фото перед выбором: они могут содержать персональные данные.</p>
<form id="ai-materials-form" method="post" action="?id=<?=e($detail['id'])?>&amp;section=generator"><input type="hidden" name="csrf" value="<?=e($viewerCsrfToken)?>"><input type="hidden" name="product_action" value="generate">
<?php foreach(['partslink'=>'PartsLink','inspection'=>'Инспекция']as$kind=>$label):?>
<fieldset data-ai-group="<?=e($kind)?>"><legend><label><input type="checkbox" name="ai_use_<?=e($kind)?>" value="1" data-ai-toggle> Использовать <?=e($label)?></label></legend>
<?php $pdfs=array_values(array_filter($detail['assets'],fn($a)=>$a['kind']===$kind&&$a['mime']==='application/pdf'));foreach($pdfs as$a):?><label><input type="checkbox" name="ai_pdf_ids[]" value="<?=e($a['id'])?>" data-ai-material> <a href="?asset=<?=e($a['id'])?>" target="_blank" rel="noopener"><?=e($a['name'])?></a></label><?php endforeach;?>
<?php if(!$pdfs):?><p class="muted">PDF не загружены.<?php if($kind==='partslink'):?> Если PartsLink уже распознан, используются его сохранённые данные.<?php endif;?></p><?php endif;?></fieldset>
<?php endforeach;?>
<fieldset data-ai-group="photos"><legend><label><input type="checkbox" name="ai_use_photos" value="1" data-ai-toggle> Использовать фотографии</label></legend>
<p class="muted">Отметьте до 10 фото: перед, зад, оба бока, салон и нужные повреждения. Фото — до 20 МБ; PDF — до 6 файлов и 20 МБ; все материалы вместе — до 30 МБ. Фотографии увеличивают стоимость API-запроса.</p>
<div class="photos"><?php $photoCount=0;foreach($detail['assets']as$a):if(!in_array($a['kind'],['vehicle','damage'],true)||!in_array($a['mime'],['image/jpeg','image/png','image/webp'],true))continue;$photoCount++;?><label><img loading="lazy" src="?asset=<?=e($a['id'])?>" alt="<?=e($a['kind']==='damage'?'Фото повреждения':'Фото автомобиля')?>"><input type="checkbox" name="ai_photo_ids[]" value="<?=e($a['id'])?>" data-ai-material> <?=e($a['kind']==='damage'?'Повреждение · ':'Аукцион · ')?><?=e($a['name'])?></label><?php endforeach;?></div>
<?php if(!$photoCount):?><p class="muted">Фотографии ещё не загружены.</p><?php endif;?></fieldset>
<label><input type="checkbox" name="ai_consent" value="1" required> Разрешаю передать выбранные материалы и характеристики автомобиля в OpenAI для подготовки текста. Я проверил PDF и фотографии.</label><?php viewerEmployeeField();?><button <?=aiConfigured()?'':'disabled'?>>Подготовить описание и переводы</button></form>
<script type="module" src="/drafts/assets/ai-materials.js?v=20261018-1"></script>
<p class="muted">Это платный API-запрос. Повторное нажатие с теми же материалами использует уже созданную задачу. Тексты сохраняются отдельно и сами не публикуются. Оценка состояния требует проверки человеком.</p></section>
<?php foreach($jobs as$job):$result=$job['result_json']?json_decode($job['result_json'],true):null;?>
<section class="panel"><h2><?=e($aiLabels[$job['state']]??$job['state'])?></h2><p class="muted"><?=e(erpDate($job['created_at']))?> · <?=e($job['model'])?></p>
<?php $jobInput=json_decode($job['input_json'],true);if(isset($jobInput['selection'])):?><p class="muted">Источники: карточка аукциона<?php foreach(['partslink'=>'PartsLink','inspection'=>'инспекция','photos'=>'фотографии ('.count($jobInput['photos']??[]).')']as$key=>$label)if($jobInput['selection'][$key]??false)echo ' · '.e($label);?>. PDF: <?=count($jobInput['files']??[])?></p><?php endif;?>
<?php if($job['error_code']):?><p role="alert">Код: <?=e($job['error_code'])?>. Автоматического повторного платного запроса нет.</p><?php endif;?>
<?php if($result):?>
<p class="tag">Черновик · факты и выводы нужно проверить</p>
<?php foreach(['description'=>'Описание','condition'=>'Состояние по источникам','maintenance'=>'Сервисная история']as$key=>$label):?><h3><?=e($label)?> · PL</h3><p style="white-space:pre-wrap"><?=e($result[$key.'_pl']?:'Недостаточно данных')?></p><h3><?=e($label)?> · RU</h3><p style="white-space:pre-wrap"><?=e($result[$key.'_ru']?:'Недостаточно данных')?></p><?php endforeach;?>
<h3>Комплектация</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><?php foreach(['pl','ru']as$lang):?><div><b><?=strtoupper($lang)?></b><ul><?php foreach($result['equipment_'.$lang]as$option):?><li><?=e($option)?></li><?php endforeach;?></ul></div><?php endforeach;?></div>
<h3>Что проверить</h3><ul><?php foreach($result['checks_ru']as$check):?><li><?=e($check)?></li><?php endforeach;?></ul>
<details><summary>Источники утверждений</summary><p class="muted">vehicle — карточка аукциона; condition — сохранённые замечания и сервисная история; partslink — распознанная комплектация. Для PDF и фотографий указан ID выбранного файла.</p><?php foreach($result['evidence']as$evidence):?><p><?=e($evidence['section'])?>: <?=e(implode(', ',$evidence['sources']))?></p><?php endforeach;?></details>
<?php if(productGet($detail['id'])):?><p><a class="button" href="?id=<?=e($detail['id'])?>&amp;section=website&amp;generation=<?=e($job['id'])?>#product-editor">Перенести польский текст в форму карточки</a></p><p class="muted">Откроется форма для проверки. Сохранение и публикация выполняются отдельно.</p><?php endif;?>
<?php endif;?></section><?php endforeach;?>
<?php if(!$jobs):?><p class="muted">Для этого VIN ещё нет задач генерации.</p><?php endif;?>
