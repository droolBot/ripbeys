# Reports which texture filenames each ingested FBX references, so we can tell
# whether the embedded material slots point at real colour maps or only masks.

$dst = 'D:\beyblade\web\public\assets\models'
$models = Get-ChildItem $dst -Filter *.fbx
$present = @{}
Get-ChildItem $dst -File | Where-Object { $_.Extension -match '^\.(png|jpg|tga)$' } |
  ForEach-Object { $present[$_.Name.ToLowerInvariant()] = $true }

$withColor = 0; $maskOnly = 0; $none = 0; $missingFiles = @{}
foreach ($m in $models) {
  $bytes = [System.IO.File]::ReadAllBytes($m.FullName)
  $text = [System.Text.Encoding]::ASCII.GetString($bytes)
  $refs = [regex]::Matches($text, '[A-Za-z0-9_\-#\.]+\.(?:png|jpg|jpeg|tga)') |
    ForEach-Object { $_.Value } | Sort-Object -Unique
  $hasColor = $refs | Where-Object { $_ -match '(?i)_(color|atlas|swatch|floor|tile)\.' }
  foreach ($r in $refs) { if (-not $present.ContainsKey($r.ToLowerInvariant())) { $missingFiles[$r] = $m.Name } }
  if ($refs.Count -eq 0) { $none++; $tag = 'NO-REFS' }
  elseif ($hasColor) { $withColor++; $tag = 'COLOR  ' }
  else { $maskOnly++; $tag = 'MASKS  ' }
  '{0} {1,-34} {2}' -f $tag, $m.Name, ($refs -join ', ')
}

Write-Output ''
Write-Output "fbx with colour/tile refs: $withColor"
Write-Output "fbx with mask-only refs:   $maskOnly"
Write-Output "fbx with no texture refs:  $none"
Write-Output "referenced files still missing: $($missingFiles.Count)"
$missingFiles.Keys | Select-Object -First 25 | ForEach-Object { "  $_  (from $($missingFiles[$_]))" }
