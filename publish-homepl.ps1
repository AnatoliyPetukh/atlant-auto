param(
  [string]$HostName = "serwer2454127.home.pl",
  [string]$DefaultUser = "serwer2454127",
  [switch]$PrepareOnly
)

$ErrorActionPreference = "Stop"
$siteSource = Join-Path $PSScriptRoot "atlant-auto-draft"
$auctionSource = Join-Path $PSScriptRoot "_publish-homepl\auction-post"
$stage = Join-Path $env:TEMP "atlant-homepl-publish"
$scriptPath = Join-Path $stage "ftp-upload.txt"

if (!(Test-Path -LiteralPath $siteSource)) {
  throw "Site folder not found: $siteSource"
}
if (!(Test-Path -LiteralPath $auctionSource)) {
  throw "Auction Post folder not found: $auctionSource"
}

if (Test-Path -LiteralPath $stage) {
  $resolvedStage = [IO.Path]::GetFullPath($stage)
  $resolvedTemp = [IO.Path]::GetFullPath($env:TEMP)
  if (!$resolvedStage.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clear a staging folder outside TEMP: $resolvedStage"
  }
  Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Path $stage | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "root") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "auction-post") | Out-Null

Copy-Item -Path (Join-Path $siteSource "*") -Destination (Join-Path $stage "root") -Recurse -Force
Remove-Item -LiteralPath (Join-Path $stage "root\data") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $stage "root\README.md") -Force -ErrorAction SilentlyContinue
Get-ChildItem -LiteralPath (Join-Path $stage "root\js") -Filter "*.test.mjs" -File |
  Remove-Item -Force
Get-ChildItem -LiteralPath (Join-Path $stage "root") -Filter "*.pdf" -File -Recurse |
  Remove-Item -Force
Copy-Item -Path (Join-Path $auctionSource "*") -Destination (Join-Path $stage "auction-post") -Force

Write-Host ""
Write-Host "This will publish:"
Write-Host "  Atlant Auto -> https://$HostName/"
Write-Host "  Auction Post -> https://$HostName/auction-post/"
Write-Host ""

if ($PrepareOnly) {
  Write-Host "Prepared production files in: $stage"
  return
}

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

$commands = [Collections.Generic.List[string]]::new()
$commands.AddRange([string[]]@(
  "open $HostName",
  "user $user",
  $password,
  "binary",
  "prompt"
))

function Add-TreeUploadCommands {
  param(
    [Collections.Generic.List[string]]$CommandList,
    [string]$LocalRoot,
    [string]$RemoteRoot
  )

  $directories = @((Get-Item -LiteralPath $LocalRoot)) +
    @(Get-ChildItem -LiteralPath $LocalRoot -Directory -Recurse | Sort-Object FullName)

  foreach ($directory in $directories) {
    $relative = $directory.FullName.Substring($LocalRoot.Length).TrimStart("\")
    $remote = (@($RemoteRoot, ($relative -replace "\\", "/")) |
      Where-Object { ![string]::IsNullOrWhiteSpace($_) }) -join "/"

    $CommandList.Add("cd /")
    foreach ($segment in ($remote -split "/" | Where-Object { $_ })) {
      $CommandList.Add("mkdir $segment")
      $CommandList.Add("cd $segment")
    }
    $CommandList.Add("lcd $($directory.FullName)")
    foreach ($file in (Get-ChildItem -LiteralPath $directory.FullName -File | Sort-Object Name)) {
      $CommandList.Add("put $($file.Name) $($file.Name)")
    }
  }
}

Add-TreeUploadCommands -CommandList $commands -LocalRoot (Join-Path $stage "root") -RemoteRoot ""
Add-TreeUploadCommands -CommandList $commands -LocalRoot (Join-Path $stage "auction-post") -RemoteRoot "auction-post"
$commands.Add("cd /")
$commands.Add("bye")

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
