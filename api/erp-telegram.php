<?php
declare(strict_types=1);
// Install as /drafts/telegram.php; data and bot token stay on the server.
define('ATLANT_ERP_TELEGRAM',true);
@set_time_limit(120);
require dirname(__DIR__).'/internal-api/telegram-draft.php';
