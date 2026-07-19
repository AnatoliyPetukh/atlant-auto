$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($nodeCommand) {
  $node = $nodeCommand.Source
}
else {
  $runtimeRoot = Join-Path $env:LOCALAPPDATA "OpenAI\Codex\runtimes\cua_node"
  $node = Get-ChildItem -Path $runtimeRoot -Recurse -Filter node.exe -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}

if ([string]::IsNullOrWhiteSpace($node)) {
  Write-Error "Node.js was not found. Install Node.js or run tests from Codex with the bundled runtime."
  exit 1
}

& $node --test atlant-auto-draft/js/customs-calculator.test.mjs atlant-auto-draft/js/car-formatters.test.mjs atlant-auto-draft/js/catalog-data.test.mjs
exit $LASTEXITCODE
