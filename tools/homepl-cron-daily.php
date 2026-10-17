<?php
declare(strict_types=1);
// Install as public_html/cron-daily.php: home.pl's native daily scheduler.
if(PHP_SAPI!=='cli'){http_response_code(403);exit;}
require __DIR__.'/.atlant-internal/backup-job.php';
