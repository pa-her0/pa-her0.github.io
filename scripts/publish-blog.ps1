[CmdletBinding()]
param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$MessageParts = @(),

    [switch]$Yes,
    [switch]$SkipChecks,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments = @()
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
    }
}

function Get-GitValue {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments = @())

    $value = & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }
    return ($value | Out-String).Trim()
}

function Assert-Remote {
    param(
        [string]$Name,
        [string]$ExpectedUrl
    )

    $actualUrl = Get-GitValue remote get-url $Name
    if ($actualUrl -ne $ExpectedUrl) {
        throw "Remote '$Name' is incorrect.`nExpected: $ExpectedUrl`nActual:   $actualUrl"
    }
}

function Assert-FastForwardable {
    param([string]$RemoteRef)

    & git merge-base --is-ancestor $RemoteRef HEAD
    if ($LASTEXITCODE -ne 0) {
        throw "$RemoteRef contains commits that are not in the local branch. Pull and resolve them before publishing."
    }
}

try {
    $Message = (($MessageParts | Where-Object { $_ -ne "--" }) -join " ").Trim()
    $repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
    Set-Location -LiteralPath $repoRoot

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is not installed or is not available in PATH."
    }
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        throw "pnpm is not installed or is not available in PATH."
    }

    Invoke-Native git rev-parse --is-inside-work-tree | Out-Null
    $branch = Get-GitValue branch --show-current
    if ($branch -ne "main") {
        throw "Current branch is '$branch'. Switch to main before publishing."
    }

    Assert-Remote "origin" "https://github.com/pa-her0/whalefall-blog-source.git"
    Assert-Remote "blog" "https://github.com/pa-her0/pa-her0.github.io.git"

    Write-Host "Fetching both GitHub repositories..." -ForegroundColor Cyan
    Invoke-Native git fetch origin main
    Invoke-Native git fetch blog main
    Assert-FastForwardable "origin/main"
    Assert-FastForwardable "blog/main"

    $changes = Get-GitValue status --porcelain
    if ($changes) {
        Write-Host "`nChanges to publish:" -ForegroundColor Cyan
        & git status --short
    }
    else {
        Write-Host "No uncommitted changes. Existing local commits will be synchronized." -ForegroundColor Yellow
    }

    if ($DryRun) {
        Write-Host "`nValidation completed. Dry-run mode did not stage, commit, or push anything." -ForegroundColor Green
        exit 0
    }

    if ($changes) {
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $Message = Read-Host "Commit message (default: content: update blog)"
        }
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $Message = "content: update blog"
        }

        if (-not $Yes) {
            $answer = Read-Host "Run checks, commit all listed changes, and push both repositories? [y/N]"
            if ($answer -notmatch "^(y|yes)$") {
                Write-Host "Publish cancelled. No files were staged or pushed." -ForegroundColor Yellow
                exit 0
            }
        }

        if (-not $SkipChecks) {
            Write-Host "`nRunning pnpm check..." -ForegroundColor Cyan
            Invoke-Native pnpm check
            Write-Host "`nRunning pnpm build..." -ForegroundColor Cyan
            Invoke-Native pnpm build
        }

        Invoke-Native git add -A
        Invoke-Native git diff --cached --check

        & git diff --cached --quiet
        if ($LASTEXITCODE -ne 0) {
            Invoke-Native git commit -m $Message
        }
    }
    # Re-check immediately before pushing so neither remote is overwritten.
    Invoke-Native git fetch origin main
    Invoke-Native git fetch blog main
    Assert-FastForwardable "origin/main"
    Assert-FastForwardable "blog/main"

    Write-Host "`nPushing source repository..." -ForegroundColor Cyan
    Invoke-Native git push origin HEAD:main

    Write-Host "`nPushing blog deployment repository..." -ForegroundColor Cyan
    Invoke-Native git push blog HEAD:main

    $commit = Get-GitValue rev-parse --short HEAD
    Write-Host "`nPublish completed successfully: $commit" -ForegroundColor Green
    Write-Host "Source: https://github.com/pa-her0/whalefall-blog-source"
    Write-Host "Blog:   https://github.com/pa-her0/pa-her0.github.io"
    Write-Host "GitHub Pages deployment has been triggered."
}
catch {
    Write-Host "`nPublish failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "No force push was used. Read the error above before trying again." -ForegroundColor Yellow
    exit 1
}
