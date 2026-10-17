<?php
// Prefer a private external path. On the home.pl PHP filesystem jail, install in
// .atlant-internal with HTTP access denied by .htaccess; chmod 0600.
// Never put a real bot token in this tracked example.
if (!defined('ATLANT_TELEGRAM_SERVER')) { http_response_code(404); exit; }
return [
    'bot_token' => 'REPLACE_ON_SERVER',
    'chat_id' => '-1000000000000', // One fixed private group; clients cannot change it.
    'employee_key_hashes' => ['colleague' => 'SHA256_OF_SEPARATE_RANDOM_EMPLOYEE_KEY'],
    'allowed_origins' => ['chrome-extension://REPLACE_WITH_INSTALLED_EXTENSION_ID'],
    'state_dir' => '/ABSOLUTE/PRIVATE/PATH/telegram-state',
    'bot_username' => 'REPLACE_WITH_BOT_USERNAME',
    'webhook_secret' => 'REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_CHARS',
    'manager_chat_id' => null, // Until connected, damage requests remain queued.
];
