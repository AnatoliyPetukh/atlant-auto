<?php
if(!defined('ATLANT_DRAFT_VIEWER')||!$viewerSignedIn){http_response_code(404);exit;}
$jobs=aiJobs($detail['id']);$aiLabels=['queued'=>'В очереди','running'=>'Обрабатывается','needs_review'=>'Готово · проверьте результат','ready'=>'Готово','error'=>'Ошибка · можно повторить вручную','uncertain'=>'Результат запроса неизвестен · проверьте перед повтором'];
?>
<section class="panel"><h2>Описание и переводы</h2><p>Сервер подготовит польское и русское описание, перевод сервисной истории и замечаний. Задача продолжит выполняться после закрытия браузера. Обработчик проверяет очередь каждые 5 минут.</p>
<?php if(!aiConfigured()):?><p class="tag">Генератор пока не подключён: ожидается настройка API-ключа.</p><?php endif;?>
<p>Выберите только документы этого автомобиля, которые можно передать в OpenAI. Инвойсы, транспортные документы, внутренние комментарии и фотографии в генератор не включаются. Ссылки на аукцион и учётные данные не передаются. Оригинальные PDF могут содержать персональные данные — проверьте их перед выбором.</p>
<form method="post" action="?id=<?=e($detail['id'])?>&amp;section=generator"><input type="hidden" name="csrf" value="<?=e($viewerCsrfToken)?>"><input type="hidden" name="product_action" value="generate">
<fieldset><legend>PDF для анализа · до 6 файлов, всего до 20 МБ</legend><?php $pdfCount=0;foreach($detail['assets']as$a):if(!in_array($a['kind'],['inspection','partslink'],true)||$a['mime']!=='application/pdf')continue;$pdfCount++;?><label><input type="checkbox" name="ai_pdf_ids[]" value="<?=e($a['id'])?>"> <?=e($a['kind']==='inspection'?'Инспекция':'PartsLink')?> · <a href="?asset=<?=e($a['id'])?>" target="_blank" rel="noopener"><?=e($a['name'])?></a></label><?php endforeach;?><?php if(!$pdfCount):?><p class="muted">PDF не загружены. Можно подготовить текст по сохранённым данным или сначала добавить документы.</p><?php endif;?></fieldset>
<label><input type="checkbox" name="ai_consent" value="1" required> Разрешаю передать выбранные PDF и характеристики автомобиля в OpenAI для подготовки текста. Я проверил документы.</label><?php viewerEmployeeField();?><button <?=aiConfigured()?'':'disabled'?>>Подготовить описание и переводы</button></form>
<p class="muted">Это платный API-запрос. Повторное нажатие с теми же материалами использует уже созданную задачу. Тексты сохраняются отдельно и сами не публикуются. Оценка состояния требует проверки человеком.</p></section>
<?php foreach($jobs as$job):$result=$job['result_json']?json_decode($job['result_json'],true):null;?>
<section class="panel"><h2><?=e($aiLabels[$job['state']]??$job['state'])?></h2><p class="muted"><?=e(erpDate($job['created_at']))?> · <?=e($job['model'])?></p>
<?php if($job['error_code']):?><p role="alert">Код: <?=e($job['error_code'])?>. Автоматического повторного платного запроса нет.</p><?php endif;?>
<?php if($result):?>
<p class="tag">Черновик · факты и выводы нужно проверить</p>
<?php foreach(['description'=>'Описание','condition'=>'Состояние по источникам','maintenance'=>'Сервисная история']as$key=>$label):?><h3><?=e($label)?> · PL</h3><p style="white-space:pre-wrap"><?=e($result[$key.'_pl']?:'Недостаточно данных')?></p><h3><?=e($label)?> · RU</h3><p style="white-space:pre-wrap"><?=e($result[$key.'_ru']?:'Недостаточно данных')?></p><?php endforeach;?>
<h3>Комплектация</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><?php foreach(['pl','ru']as$lang):?><div><b><?=strtoupper($lang)?></b><ul><?php foreach($result['equipment_'.$lang]as$option):?><li><?=e($option)?></li><?php endforeach;?></ul></div><?php endforeach;?></div>
<h3>Что проверить</h3><ul><?php foreach($result['checks_ru']as$check):?><li><?=e($check)?></li><?php endforeach;?></ul>
<details><summary>Источники утверждений</summary><p class="muted">vehicle — карточка аукциона; condition — сохранённые замечания и сервисная история; partslink — распознанная комплектация. Для PDF указан ID выбранного файла.</p><?php foreach($result['evidence']as$evidence):?><p><?=e($evidence['section'])?>: <?=e(implode(', ',$evidence['sources']))?></p><?php endforeach;?></details>
<?php if(productGet($detail['id'])):?><p><a class="button" href="?id=<?=e($detail['id'])?>&amp;section=website&amp;generation=<?=e($job['id'])?>#product-editor">Перенести польский текст в форму карточки</a></p><p class="muted">Откроется форма для проверки. Сохранение и публикация выполняются отдельно.</p><?php endif;?>
<?php endif;?></section><?php endforeach;?>
<?php if(!$jobs):?><p class="muted">Для этого VIN ещё нет задач генерации.</p><?php endif;?>
