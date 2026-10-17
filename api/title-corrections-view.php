<?php
declare(strict_types=1);
if(!defined('ATLANT_DRAFT_VIEWER')||!isset($viewerSignedIn)||!$viewerSignedIn){http_response_code(404);exit;}
// Historical snapshots are the source; this view never changes a car or its rules.
$q=draftDb()->query('SELECT s.packet_json,s.actor,s.created_at,s.draft_id FROM snapshots s ORDER BY s.created_at DESC,s.id DESC LIMIT 5000');
$examples=[];$seen=[];
while($r=$q->fetch(PDO::FETCH_ASSOC)){
 $p=json_decode($r['packet_json'],true);$v=$p['vehicle']??[];
 $after=trim((string)($v['title_override']??''));$before=trim((string)($v['title_details']['display_title']??''));$source=trim((string)($v['title']??''));
 if($after===''||$after===$before)continue;
 $key=json_encode([$v['vin']??'',$source,$before,$after]);if(isset($seen[$key]))continue;$seen[$key]=true;
 $examples[]=['vin'=>$v['vin']??'','source'=>$source,'before'=>$before,'after'=>$after,'strategy'=>$v['title_details']['strategy']??'','actor'=>$r['actor'],'date'=>$r['created_at'],'id'=>$r['draft_id']];
 if(count($examples)>=100)break;
}
?>
<span class="tag">Внутренняя работа</span><h1>Названия для робота</h1>
<p class="muted">Примеры ваших правок: исходное название аукциона → автоматическая очистка → исправленный вариант. Новые примеры появляются после сохранения автомобиля из расширения на сервер. Эти правки помогают уточнять правила; сами правила автоматически не меняются.</p>
<p><a href="./">← Реестр автомобилей</a></p>
<section class="panel scroll"><table><thead><tr><th>Автомобиль / VIN</th><th>Исходное название</th><th>После автоматической очистки</th><th>После ручной правки</th><th>Сохранение</th></tr></thead><tbody>
<?php foreach($examples as $example):?><tr><td><a href="?id=<?=e($example['id'])?>"><code><?=e($example['vin'])?></code></a></td><td><?=e($example['source'])?></td><td><?=e($example['before'])?><br><small class="muted"><?=e($example['strategy'])?></small></td><td><b><?=e($example['after'])?></b></td><td><small><?=e(erpDate($example['date']))?><br><?=e($example['actor'])?></small></td></tr><?php endforeach;?>
<?php if(!$examples):?><tr><td colspan="5">Пока нет сохранённых ручных исправлений названия. Исправьте название в расширении и сохраните автомобиль в ERP.</td></tr><?php endif;?>
</tbody></table></section><p class="muted">До 100 последних уникальных примеров из 5 000 последних снимков данных. Повторные сохранения одинаковой правки не дублируются.</p>
