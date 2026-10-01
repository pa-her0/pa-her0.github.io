[CmdletBinding()]
param(
    [ValidateRange(60, 86400)]
    [int]$IntervalSeconds = 300,

    [int]$ParentPid = 0,

    [switch]$RunImmediately,

    [switch]$Once,

    [switch]$DryRun,

    [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$publishScript = Join-Path $PSScriptRoot "publish-blog.ps1"
$logRoot = if ($env:LOCALAPPDATA) {
    Join-Path $env:LOCALAPPDATA "JielyBlogStudio"
} else {
    Join-Path ([System.IO.Path]::GetTempPath()) "JielyBlogStudio"
}
$logFile = Join-Path $logRoot "auto-publish.log"
$mutex = $null
$hasMutex = $false

function Write-AutoLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [ValidateSet("INFO", "SUCCESS", "WARN", "ERROR", "DETAIL")]
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] [$Level] $Message"
    Add-Content -LiteralPath $logFile -Value $entry -Encoding UTF8

    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        "DETAIL" { "DarkGray" }
        default { "Cyan" }
    }
    Write-Host $entry -ForegroundColor $color
}
function Test-ParentAlive {
    if ($ParentPid -le 0) { return $true }
    try {
        Get-Process -Id $ParentPid -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Get-GitText {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments = @())

    $value = & git @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }
    return ($value | Out-String).Trim()
}

function Test-NeedsPublish {
    if (Get-GitText status --porcelain) { return $true }

    foreach ($remote in @("origin", "blog")) {
        & git show-ref --verify --quiet "refs/remotes/$remote/main"
        if ($LASTEXITCODE -ne 0) { return $true }

        $ahead = Get-GitText rev-list --count "$remote/main..HEAD"
        if ([int]$ahead -gt 0) { return $true }
    }

    return $false
}

function Wait-ForNextCycle {
    $remaining = $IntervalSeconds
    while ($remaining -gt 0) {
        if (-not (Test-ParentAlive)) { return $false }
        $slice = [Math]::Min(5, $remaining)
        Start-Sleep -Seconds $slice
        $remaining -= $slice
    }
    return Test-ParentAlive
}

function Invoke-AutoPublish {
    if (-not (Test-NeedsPublish)) {
        Write-AutoLog "No local changes or pending commits; skipped this cycle."
        return
    }

    if ($DryRun) {
        Write-AutoLog "Dry-run: changes were detected; a normal run would publish them." "WARN"
        return
    }

    $message = "auto: sync blog $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-AutoLog "Changes detected. Starting the protected publish workflow."

    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $publishScript,
        "-MessageParts", $message,
        "-Yes"
    )
    if ($SkipChecks) { $arguments += "-SkipChecks" }

    # Windows PowerShell exposes a native program's stderr as error records when
    # it is redirected with 2>&1. Git writes ordinary fetch progress (for
    # example, "From https://github.com/...") to stderr, so the script-wide
    # Stop preference must not turn that harmless progress into an exception.
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $records = @(& powershell.exe @arguments 2>&1)
        $publishExit = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    $output = (($records | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim()
    if (-not [string]::IsNullOrWhiteSpace($output)) {
        Write-AutoLog $output "DETAIL"
    }
    if ($publishExit -ne 0) {
        throw "Publish workflow exited with code $publishExit. It will be retried next cycle."
    }

    Write-AutoLog "Blog source and deployment repositories were synchronized successfully." "SUCCESS"
}

try {
    New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

    $mutex = [System.Threading.Mutex]::new($false, "Local\JielyBlogAutoPublish")
    try {
        $hasMutex = $mutex.WaitOne(0)
    }
    catch [System.Threading.AbandonedMutexException] {
        $hasMutex = $true
    }

    if (-not $hasMutex) {
        Write-AutoLog "Another automatic publisher is already running; this instance will exit." "WARN"
        exit 0
    }

    Set-Location -LiteralPath $repoRoot
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is not installed or is not available in PATH."
    }
    if (-not (Test-Path -LiteralPath $publishScript)) {
        throw "The protected publish script was not found: $publishScript"
    }

    & git rev-parse --is-inside-work-tree | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "The blog directory is not a Git repository." }

    Write-AutoLog "Automatic publishing started. Interval: $IntervalSeconds seconds. Log: $logFile"

    if (-not $RunImmediately -and -not $Once) {
        Write-AutoLog "The first check will run after one interval."
        if (-not (Wait-ForNextCycle)) { exit 0 }
    }

    while (Test-ParentAlive) {
        try {
            Invoke-AutoPublish
        }
        catch {
            Write-AutoLog $_.Exception.Message "ERROR"
        }

        if ($Once) { break }
        if (-not (Wait-ForNextCycle)) { break }
    }

    if ($Once) {
        Write-AutoLog "One-time automatic publishing check finished."
    }
    elseif ($ParentPid -gt 0) {
        Write-AutoLog "Automatic publishing stopped because the blog workbench was closed."
    }
    else {
        Write-AutoLog "Automatic publishing stopped."
    }
}
catch {
    if (-not (Test-Path -LiteralPath $logRoot)) {
        New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
    }
    Write-AutoLog $_.Exception.Message "ERROR"
    exit 1
}
finally {
    if ($hasMutex -and $mutex) {
        try { $mutex.ReleaseMutex() } catch { }
    }
    if ($mutex) { $mutex.Dispose() }
}
