<?php
declare(strict_types=1);

/**
 * Auction Post API
 *
 * Upload this file to the PHP hosting, for example:
 *   https://serwer2454127.home.pl/parse-auction.php
 * or later:
 *   https://api.atlantauto.pl/parse-auction.php
 *
 * The browser sends extracted PDF text here. The OpenAI API key stays on the server,
 * not inside the public Tilda page.
 */

const OPENAI_API_KEY = 'PASTE_OPENAI_API_KEY_HERE';
const OPENAI_MODEL = 'gpt-4.1-mini';

const ALLOWED_ORIGINS = [
    'https://atlantauto.pl',
    'https://www.atlantauto.pl',
    'https://project151170693.tilda.ws',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
];

function respond(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function setCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Auction-Post-Token');
    header('Access-Control-Max-Age: 86400');
}

setCorsHeaders();

if (isset($_GET['health'])) {
    respond(200, [
        'ok' => true,
        'php' => PHP_VERSION,
        'curl' => function_exists('curl_init'),
        'https_wrappers' => in_array('https', stream_get_wrappers(), true),
        'key_configured' => OPENAI_API_KEY !== 'PASTE_OPENAI_API_KEY_HERE' && OPENAI_API_KEY !== '',
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

if (OPENAI_API_KEY === 'PASTE_OPENAI_API_KEY_HERE' || OPENAI_API_KEY === '') {
    respond(500, [
        'ok' => false,
        'error' => 'OpenAI API key is not configured on the server.',
    ]);
}

$rawBody = file_get_contents('php://input');
$request = json_decode($rawBody ?: '', true);

if (!is_array($request)) {
    respond(400, ['ok' => false, 'error' => 'Invalid JSON body']);
}

$auction = trim((string)($request['auction'] ?? 'unknown'));
$pdfText = trim((string)($request['text'] ?? ''));
$language = trim((string)($request['language'] ?? 'ru'));

if ($pdfText === '') {
    respond(400, ['ok' => false, 'error' => 'PDF text is empty']);
}

if (strlen($pdfText) > 45000) {
    $pdfText = substr($pdfText, 0, 45000);
}

$schema = [
    'type' => 'object',
    'additionalProperties' => false,
    'required' => [
        'auction',
        'make',
        'model',
        'version',
        'year',
        'first_registration',
        'mileage_km',
        'fuel',
        'power_kw',
        'power_hp',
        'transmission',
        'drive',
        'color',
        'keys_count',
        'vin',
        'equipment',
        'service_history',
        'timing_belt',
        'auction_date',
        'price',
        'warnings',
        'telegram_text',
    ],
    'properties' => [
        'auction' => ['type' => 'string'],
        'make' => ['type' => 'string'],
        'model' => ['type' => 'string'],
        'version' => ['type' => 'string'],
        'year' => ['type' => 'string'],
        'first_registration' => ['type' => 'string'],
        'mileage_km' => ['type' => 'string'],
        'fuel' => ['type' => 'string'],
        'power_kw' => ['type' => 'string'],
        'power_hp' => ['type' => 'string'],
        'transmission' => ['type' => 'string'],
        'drive' => ['type' => 'string'],
        'color' => ['type' => 'string'],
        'keys_count' => ['type' => 'string'],
        'vin' => ['type' => 'string'],
        'equipment' => ['type' => 'string'],
        'service_history' => ['type' => 'string'],
        'timing_belt' => ['type' => 'string'],
        'auction_date' => ['type' => 'string'],
        'price' => ['type' => 'string'],
        'warnings' => [
            'type' => 'array',
            'items' => ['type' => 'string'],
        ],
        'telegram_text' => ['type' => 'string'],
    ],
];

$instructions = <<<TXT
You extract car auction listing data from raw PDF text and prepare a Telegram post in Russian.

Rules:
- Use only facts present in the source text.
- If a field is missing, write "уточняется".
- Translate equipment and service notes into natural Russian.
- Keep the Telegram text compact and sales-ready, but do not hide important maintenance facts.
- Do not invent price, auction date, mileage, registration date, service history, keys, VIN, or equipment.
- If the text is inconsistent, keep the safest value and add a warning.
- Format mileage with spaces and "км".
- For fuel/transmission/drive use concise Russian terms.
- For service_history, preserve useful maintenance details from the PDF:
  dates, mileage, performed work, replaced filters, oil, brakes, tires, battery, spark plugs,
  timing belt/chain, brake fluid and other расходники. Prefer a newline-separated list.
  Do not collapse service history into one vague phrase if the PDF has multiple records.
- For timing_belt, mention replacement date and mileage if present. If absent, write "уточняется".
- Telegram text should follow this style:
🔥 СКОРО НА АУКЦИОНЕ
🚘 Make Model Version
🗓 year год · первая регистрация ...
🏁 Пробег: ...
⛽ ...
💪 Мощность: ... кВт / ≈... л.с.
⚙️ ...
🎨 ...
🔑 Ключей: ...
В комплектации: ...

✅ ...
📅 Дата аукциона: ...
💰 Цена: ...
Для расчёта итоговой стоимости и участия в торгах — пишите менеджеру.
TXT;

$payload = [
    'model' => OPENAI_MODEL,
    'input' => [
        [
            'role' => 'system',
            'content' => $instructions,
        ],
        [
            'role' => 'user',
            'content' => "Auction: {$auction}\nOutput language: {$language}\n\nPDF text:\n{$pdfText}",
        ],
    ],
    'text' => [
        'format' => [
            'type' => 'json_schema',
            'name' => 'auction_vehicle_post',
            'strict' => true,
            'schema' => $schema,
        ],
    ],
    'max_output_tokens' => 1800,
];

$requestBody = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$responseBody = false;
$statusCode = 0;
$transportError = '';

if (function_exists('curl_init')) {
    $ch = curl_init('https://api.openai.com/v1/responses');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . OPENAI_API_KEY,
        ],
        CURLOPT_POSTFIELDS => $requestBody,
        CURLOPT_TIMEOUT => 45,
    ]);

    $responseBody = curl_exec($ch);
    $transportError = curl_error($ch);
    $statusCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
} else {
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\nAuthorization: Bearer " . OPENAI_API_KEY . "\r\n",
            'content' => $requestBody,
            'timeout' => 45,
            'ignore_errors' => true,
        ],
    ]);
    $responseBody = file_get_contents('https://api.openai.com/v1/responses', false, $context);
    $transportError = error_get_last()['message'] ?? '';

    foreach (($http_response_header ?? []) as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches)) {
            $statusCode = (int)$matches[1];
            break;
        }
    }
}

if ($responseBody === false) {
    respond(502, ['ok' => false, 'error' => 'OpenAI request failed', 'details' => $transportError]);
}

$openai = json_decode($responseBody, true);

if ($statusCode < 200 || $statusCode >= 300) {
    respond($statusCode, [
        'ok' => false,
        'error' => 'OpenAI API error',
        'details' => $openai ?: $responseBody,
    ]);
}

$outputText = null;
foreach (($openai['output'] ?? []) as $item) {
    foreach (($item['content'] ?? []) as $content) {
        if (($content['type'] ?? '') === 'output_text' && isset($content['text'])) {
            $outputText = $content['text'];
            break 2;
        }
    }
}

if (!is_string($outputText) || trim($outputText) === '') {
    respond(502, [
        'ok' => false,
        'error' => 'OpenAI returned no structured text',
        'details' => $openai,
    ]);
}

$data = json_decode($outputText, true);
if (!is_array($data)) {
    respond(502, [
        'ok' => false,
        'error' => 'OpenAI returned invalid JSON',
        'raw' => $outputText,
    ]);
}

respond(200, [
    'ok' => true,
    'data' => $data,
    'usage' => $openai['usage'] ?? null,
]);
