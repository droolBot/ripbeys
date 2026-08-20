# Attaches an albedo texture to every listing whose mesh is an OBJ.
# OBJ exports carry no material block, so their colour has to be supplied
# explicitly via the listing's `texture` field. Re-running is safe: existing
# texture fields on OBJ lines are stripped and recomputed.

$dst = 'D:\beyblade\web\public\assets\models'
$assets = 'D:\beyblade\web\src\lib\assets.ts'
$albedoSuffix = '(?i)_(color|atlas|swatch|floor)$'
# Alternate colourways shipped alongside the stock deco.
$variantToken = '(?i)black|red|redeco|premium|^pro_|v2|blue|gold'

function Norm([string]$s) { ($s -replace '[^A-Za-z0-9]', '').ToLowerInvariant() }

$maps = Get-ChildItem $dst -File |
  Where-Object { $_.Extension -match '^\.(png|jpg)$' -and $_.BaseName -match $albedoSuffix }
Write-Output "albedo maps available: $($maps.Count)"

$lines = [System.IO.File]::ReadAllLines($assets)
$wired = 0
$missed = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i] -replace ", texture: ``\`$\{M\}/[^``]+``", ''
  $modelMatch = [regex]::Match($line, "model: ``\`$\{M\}/([^``]+\.obj)``")
  if (-not $modelMatch.Success) { $lines[$i] = $line; continue }
  $file = $modelMatch.Groups[1].Value

  $nameMatch = [regex]::Match($line, "name: '([^']+)'")
  $listingName = if ($nameMatch.Success) { $nameMatch.Groups[1].Value } else { $file }

  $meshBase = [IO.Path]::GetFileNameWithoutExtension($file)
  $base = Norm $meshBase
  $noLayer = Norm ($meshBase -replace '(?i)_?(energylayer|layer)$', '')

  $scored = $maps | ForEach-Object {
    $k = Norm $_.BaseName
    $stem = Norm ($_.BaseName -replace $albedoSuffix, '')
    $rank = if ($k -eq "${base}color") { 0 }
      elseif ($stem -eq $base -or $stem -eq $noLayer) { 1 }
      elseif ($stem -eq "${noLayer}layer") { 2 }
      elseif ($stem.StartsWith($noLayer) -and $noLayer.Length -gt 5) { 3 }
      elseif ($stem.Contains($noLayer) -and $noLayer.Length -gt 5) { 4 }
      else { 99 }
    if ($_.BaseName -match $variantToken) { $rank += 10 }
    [pscustomobject]@{ File = $_; Rank = $rank; Len = $_.Name.Length }
  } | Where-Object { $_.Rank -lt 90 } | Sort-Object Rank, Len

  $hit = ($scored | Select-Object -First 1).File
  if (-not $hit) { $missed.Add("$listingName ($file)"); $lines[$i] = $line; continue }

  $needle = "model: ``$" + "{M}/$file``"
  $lines[$i] = $line.Replace($needle, $needle + ", texture: ``$" + "{M}/$($hit.Name)``")
  $wired++
  Write-Output ("  {0,-26} -> {1}" -f $listingName, $hit.Name)
}

[System.IO.File]::WriteAllLines($assets, $lines)
Write-Output "wired: $wired"
Write-Output "no albedo map: $($missed.Count)"
$missed | ForEach-Object { "  $_" }
