[CmdletBinding()]
param(
    [ValidateRange(60, 86400)]
    [int]$IntervalSeconds = 300
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$autoPublishScript = Join-Path $PSScriptRoot "auto-publish-blog.ps1"
$autoPublisher = $null
$studioExit = 1

try {
    Set-Location -LiteralPath $repoRoot

    $pnpmHome = if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA "pnpm" } else { "" }
    if ($pnpmHome -and (Test-Path -LiteralPath $pnpmHome) -and (($env:PATH -split ";") -notcontains $pnpmHome)) {
        $env:PATH = "$pnpmHome;$env:PATH"
    }

    $pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    if (-not $pnpm) { $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue }
    if (-not $pnpm) {
        throw "Could not find pnpm. Please install the project environment first."
    }
    if (-not (Test-Path -LiteralPath $autoPublishScript)) {
        throw "Could not find the automatic publishing script."
    }

    $autoArguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-WindowStyle", "Hidden",
        "-File", ('"{0}"' -f $autoPublishScript),
        "-ParentPid", $PID,
        "-IntervalSeconds", $IntervalSeconds
    )
    $autoPublisher = Start-Process -FilePath "powershell.exe" -ArgumentList $autoArguments -WindowStyle Hidden -PassThru

    Write-Host ""
    Write-Host "Blog workbench is starting." -ForegroundColor Cyan
    Write-Host "Automatic GitHub publishing is enabled every $([Math]::Round($IntervalSeconds / 60, 1)) minutes." -ForegroundColor Green
    Write-Host "Only saved changes are detected; failed checks will be retried on the next cycle." -ForegroundColor DarkGray
    Write-Host "Closing this window stops the workbench and its background scheduler." -ForegroundColor DarkGray
    Write-Host ""

    & $pnpm.Source studio
    $studioExit = $LASTEXITCODE
}
catch {
    Write-Host "`nFailed to start the blog workbench: $($_.Exception.Message)" -ForegroundColor Red
    $studioExit = 1
}
finally {
    if ($autoPublisher -and -not $autoPublisher.HasExited) {
        Stop-Process -Id $autoPublisher.Id -Force -ErrorAction SilentlyContinue
    }
}

exit $studioExit
