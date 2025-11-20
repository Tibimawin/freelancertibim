param(
  [int]$IntervalSeconds = 60
)

function Get-CurrentBranch {
  $branch = git rev-parse --abbrev-ref HEAD 2>$null
  if (!$branch) { throw "Git branch not found. Initialize the repo first." }
  return $branch.Trim()
}

function HasChanges {
  $status = git status --porcelain 2>$null
  return -not [string]::IsNullOrWhiteSpace($status)
}

function AutoPushOnce {
  $branch = Get-CurrentBranch
  try {
    git fetch origin $branch 2>$null | Out-Null
    git pull --rebase origin $branch 2>$null | Out-Null
  } catch { Write-Host "Pull failed: $($_.Exception.Message)" -ForegroundColor Yellow }

  if (HasChanges) {
    git add -A
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    git commit -m "chore(auto): sync $ts" 2>$null | Out-Null
    try {
      git push origin $branch
      Write-Host "Auto-pushed to $branch at $ts" -ForegroundColor Green
    } catch {
      Write-Host "Push failed: $($_.Exception.Message)" -ForegroundColor Red
    }
  } else {
    Write-Host "No changes to push." -ForegroundColor DarkGray
  }
}

Write-Host "Starting auto-push watcher (branch: $(Get-CurrentBranch)) every $IntervalSeconds seconds..." -ForegroundColor Cyan
while ($true) {
  AutoPushOnce
  Start-Sleep -Seconds $IntervalSeconds
}