$assets = 'D:\beyblade\web\src\lib\assets.ts'
$lines = [System.IO.File]::ReadAllLines($assets)

$modelExtras = New-Object System.Collections.Generic.List[string]
$listLines = New-Object System.Collections.Generic.List[string]
$before = New-Object System.Collections.Generic.List[string]
$after = New-Object System.Collections.Generic.List[string]
$phase = 'before'

foreach ($line in $lines) {
  if ($line -match 'export const marketplaceListings') { $phase = 'list'; $listLines.Add($line); continue }
  if ($phase -eq 'list' -and $line -match '^\s*\]\s*$') { $phase = 'after'; $after.Add($line); continue }
  if ($phase -eq 'before') { $before.Add($line); continue }
  if ($phase -eq 'after') { $after.Add($line); continue }
  if ($line -match "^\s*'[^']+\.(fbx|obj)',?\s*$") {
    $modelExtras.Add(($line.Trim().TrimEnd(',')))
  } else {
    $listLines.Add($line)
  }
}

$out = New-Object System.Collections.Generic.List[string]
$insertedModels = $false
foreach ($line in $before) {
  if (-not $insertedModels -and $line -match '^\s*\] as const') {
    if ($out.Count -gt 0 -and $out[$out.Count - 1] -notmatch ',$') {
      $out[$out.Count - 1] = $out[$out.Count - 1] + ','
    }
    foreach ($m in $modelExtras) { $out.Add("  $m,") }
    $insertedModels = $true
  }
  $out.Add($line)
}
foreach ($line in $listLines) { $out.Add($line) }
foreach ($line in $after) { $out.Add($line) }

$text = ($out -join "`n") + "`n"
$fixes = @{
  'Genesis G5Eclipse' = 'Eclipse Genesis G5'
  'Helios H6Evo Blazebringer' = 'Evo Helios H6 (Blazebringer)'
  'Golden Judgement Dragon D5Geo Virtual Championship' = 'Golden Judgement Dragon D5 (Virtual Championship)'
}
foreach ($k in $fixes.Keys) {
  $text = $text.Replace("name: '$k'", "name: '$($fixes[$k])'")
}

[System.IO.File]::WriteAllText($assets, $text)
Write-Output "moved $($modelExtras.Count) model files into modelFiles"
$idCount = ([regex]::Matches($text, "id: '")).Count
Write-Output "listings now: $idCount"
