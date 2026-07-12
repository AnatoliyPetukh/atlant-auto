param(
  [string]$HostName = "serwer2454127.home.pl",
  [string]$DefaultUser = "serwer2454127"
)

$ErrorActionPreference = "Stop"
$base = Join-Path $PSScriptRoot "_publish-homepl"
$stage = Join-Path $env:TEMP "atlant-homepl-publish"
$scriptPath = Join-Path $stage "ftp-upload.txt"

if (!(Test-Path -LiteralPath $base)) {
  throw "Publish folder not found: $base"
}

if (Test-Path -LiteralPath $stage) {
  Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Path $stage | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "root") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "root\assets") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "root\assets\cars") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "auction-post") | Out-Null

Copy-Item -LiteralPath (Join-Path $base "root\index.html") -Destination (Join-Path $stage "root\index.html") -Force
Copy-Item -LiteralPath (Join-Path $base "root\styles.css") -Destination (Join-Path $stage "root\styles.css") -Force
Copy-Item -LiteralPath (Join-Path $base "root\app.js") -Destination (Join-Path $stage "root\app.js") -Force
if (Test-Path -LiteralPath (Join-Path $base "root\assets\cars")) {
  Copy-Item -Path (Join-Path $base "root\assets\cars\*") -Destination (Join-Path $stage "root\assets\cars") -Force
}
Copy-Item -LiteralPath (Join-Path $base "auction-post\index.html") -Destination (Join-Path $stage "auction-post\index.html") -Force
Copy-Item -LiteralPath (Join-Path $base "auction-post\styles.css") -Destination (Join-Path $stage "auction-post\styles.css") -Force
Copy-Item -LiteralPath (Join-Path $base "auction-post\app.js") -Destination (Join-Path $stage "auction-post\app.js") -Force
Copy-Item -LiteralPath (Join-Path $base "auction-post\parse-auction.php") -Destination (Join-Path $stage "auction-post\parse-auction.php") -Force

Write-Host ""
Write-Host "This will publish:"
Write-Host "  Atlant Auto -> https://$HostName/"
Write-Host "  Auction Post -> https://$HostName/auction-post/"
Write-Host ""

$user = $env:HOMEPL_FTP_LOGIN
if ([string]::IsNullOrWhiteSpace($user)) {
  $user = Read-Host "FTP login [$DefaultUser]"
  if ([string]::IsNullOrWhiteSpace($user)) {
    $user = $DefaultUser
  }
}

$password = $env:HOMEPL_FTP_PASSWORD
if ([string]::IsNullOrWhiteSpace($password)) {
  $securePass = Read-Host "FTP password" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
  try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

$commands = @(
  "open $HostName",
  "user $user",
  $password,
  "binary",
  "prompt",
  "mkdir auction-post",
  "cd auction-post",
  ("lcd " + (Join-Path $stage "auction-post")),
  "put index.html index.html",
  "put styles.css styles.css",
  "put app.js app.js",
  "put parse-auction.php parse-auction.php",
  "cd /",
  ("lcd " + (Join-Path $stage "root")),
  "put index.html index.html",
  "put styles.css styles.css",
  "put app.js app.js",
  "mkdir assets",
  "cd assets",
  "mkdir cars",
  "cd cars",
  ("lcd " + (Join-Path $stage "root\assets\cars")),
  "mput *",
  "cd /",
  "bye"
)

try {
  Set-Content -LiteralPath $scriptPath -Value $commands -Encoding ASCII
  Write-Host ""
  Write-Host "Uploading..."
  $output = & ftp.exe -n -s:$scriptPath
  $output | ForEach-Object { Write-Host $_ }
  $joined = $output -join "`n"
  if ($LASTEXITCODE -ne 0 -or $joined -match "Login failed|530 |not found|denied|failed|closed by remote") {
    throw "FTP upload did not complete cleanly."
  }
  Write-Host ""
  Write-Host "Done."
  Write-Host "Atlant Auto: https://$HostName/"
  Write-Host "Auction Post: https://$HostName/auction-post/"
}
finally {
  $password = $null
  Remove-Item -LiteralPath $scriptPath -Force -ErrorAction SilentlyContinue
}
