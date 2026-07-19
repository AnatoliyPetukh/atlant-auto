param([int]$Port = 4173)

$root = $PSScriptRoot
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
  $listener.Start()
}
catch {
  Write-Host ""
  Write-Host "Не удалось запустить приложение:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  Write-Host ""
  Read-Host "Нажмите Enter, чтобы закрыть окно"
  exit 1
}
Write-Host "Auction Post: http://127.0.0.1:$Port/"
Write-Host "Не закрывайте это окно, пока работаете с приложением."
Start-Process "http://127.0.0.1:$Port/"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".mjs"  = "text/javascript; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "index.html" }
    $path = [IO.Path]::GetFullPath((Join-Path $root $relative))

    if (-not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or
        -not [IO.File]::Exists($path)) {
      $context.Response.StatusCode = 404
      $context.Response.Close()
      continue
    }

    $bytes = [IO.File]::ReadAllBytes($path)
    $extension = [IO.Path]::GetExtension($path).ToLowerInvariant()
    $contentType = $mime[$extension]
    if ([string]::IsNullOrWhiteSpace($contentType)) {
      $contentType = "application/octet-stream"
    }
    $context.Response.ContentType = $contentType
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
