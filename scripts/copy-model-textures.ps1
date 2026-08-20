# Copies each ingested model's sibling texture files next to the model in
# public/assets/models. FBXLoader resolves texture references to a basename
# relative to the model URL, so a flat copy is what makes the real colours load.

$dst = 'D:\beyblade\web\public\assets\models'
$sources = @(
  'D:\beyblade\assets\Model Exports (Unsorted FBX Models, Temporary Upload)',
  'D:\beyblade\reference\decoded'
)

$imageExt = @('.png', '.jpg', '.jpeg', '.tga', '.bmp')

Write-Output 'Indexing source models...'
$byLength = @{}
$byNorm = @{}
foreach ($root in $sources) {
  if (-not (Test-Path $root)) { continue }
  Get-ChildItem $root -Recurse -File -EA SilentlyContinue |
    Where-Object { $_.Extension -match '^\.(fbx|obj)$' } |
    ForEach-Object {
      if (-not $byLength.ContainsKey($_.Length)) { $byLength[$_.Length] = @() }
      $byLength[$_.Length] += $_
      $norm = ($_.BaseName -replace '[^A-Za-z0-9]', '').ToLowerInvariant()
      if (-not $byNorm.ContainsKey($norm)) { $byNorm[$norm] = @() }
      $byNorm[$norm] += $_
    }
}
Write-Output "  indexed $($byLength.Count) distinct sizes / $($byNorm.Count) names"

$models = Get-ChildItem $dst -File | Where-Object { $_.Extension -match '^\.(fbx|obj)$' }
Write-Output "Resolving $($models.Count) ingested models..."

$copied = 0
$collisions = New-Object System.Collections.Generic.List[string]
$unmatched = New-Object System.Collections.Generic.List[string]
$seen = @{}

foreach ($m in $models) {
  $match = $null
  # Exact byte length is the strongest key since files were copied verbatim.
  if ($byLength.ContainsKey($m.Length)) { $match = $byLength[$m.Length][0] }
  if (-not $match) {
    $norm = ($m.BaseName -replace '[^A-Za-z0-9]', '').ToLowerInvariant()
    if ($byNorm.ContainsKey($norm)) { $match = $byNorm[$norm][0] }
  }
  if (-not $match) { $unmatched.Add($m.Name); continue }

  Get-ChildItem $match.Directory.FullName -File -EA SilentlyContinue |
    Where-Object { $imageExt -contains $_.Extension.ToLowerInvariant() } |
    ForEach-Object {
      $target = Join-Path $dst $_.Name
      if ($seen.ContainsKey($_.Name) -and $seen[$_.Name] -ne $_.Length) {
        $collisions.Add("$($_.Name) ($($seen[$_.Name]) vs $($_.Length))")
      }
      $seen[$_.Name] = $_.Length
      Copy-Item $_.FullName $target -Force
      $script:copied++
    }
}

Write-Output "textures copied: $copied"

# OBJ exports have no material block, so their colour map has to be found by
# name — it often lives in a different export folder than the mesh.
Write-Output 'Resolving colour maps by name across all sources...'
$allColor = foreach ($root in $sources) {
  if (Test-Path $root) {
    Get-ChildItem $root -Recurse -File -EA SilentlyContinue |
      Where-Object { $_.Extension -match '^\.(png|jpg)$' -and $_.BaseName -match '(?i)_(color|atlas|swatch|floor)$' }
  }
}
function NormKey([string]$s) { ($s -replace '[^A-Za-z0-9]', '').ToLowerInvariant() }
$colorIndex = @{}
foreach ($img in $allColor) {
  $k = NormKey $img.BaseName
  if (-not $colorIndex.ContainsKey($k)) { $colorIndex[$k] = $img }
  elseif ($img.Name.Length -lt $colorIndex[$k].Name.Length) { $colorIndex[$k] = $img }
}

$extra = 0
foreach ($m in $models) {
  $base = NormKey $m.BaseName
  $noLayer = NormKey ($m.BaseName -replace '(?i)_?(energylayer|layer|geo)$', '')
  # Copy every plausible candidate; wire-color-maps.ps1 picks the canonical one.
  $picks = $colorIndex.Keys |
    Where-Object {
      $_ -eq "${base}color" -or $_ -eq "${noLayer}layercolor" -or $_ -eq "${noLayer}color" -or
      ($noLayer.Length -gt 5 -and ($_.StartsWith($noLayer) -or $_.Contains($noLayer)))
    } | ForEach-Object { $colorIndex[$_] }
  foreach ($pick in $picks) {
    Copy-Item $pick.FullName (Join-Path $dst $pick.Name) -Force
    $extra++
  }
}
Write-Output "name-matched colour maps copied: $extra"

# Some FBX reference textures that live outside their own export folder; pull
# any still-missing reference in by exact filename so nothing renders black.
Write-Output 'Resolving leftover FBX texture references...'
$present = @{}
Get-ChildItem $dst -File | Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|tga)$' } |
  ForEach-Object { $present[$_.Name.ToLowerInvariant()] = $true }

$wanted = @{}
foreach ($m in ($models | Where-Object { $_.Extension -eq '.fbx' })) {
  $text = [System.Text.Encoding]::ASCII.GetString([System.IO.File]::ReadAllBytes($m.FullName))
  foreach ($r in [regex]::Matches($text, '[A-Za-z0-9_\-#\.]+\.(?:png|jpg|jpeg|tga)')) {
    $n = $r.Value.ToLowerInvariant()
    if (-not $present.ContainsKey($n)) { $wanted[$n] = $r.Value }
  }
}
Write-Output "  missing references: $($wanted.Count)"

$found = 0
if ($wanted.Count -gt 0) {
  foreach ($root in $sources) {
    if (-not (Test-Path $root)) { continue }
    Get-ChildItem $root -Recurse -File -EA SilentlyContinue |
      Where-Object { $wanted.ContainsKey($_.Name.ToLowerInvariant()) } |
      ForEach-Object {
        Copy-Item $_.FullName (Join-Path $dst $_.Name) -Force
        $wanted.Remove($_.Name.ToLowerInvariant()) | Out-Null
        $found++
      }
  }
}
Write-Output "  recovered: $found / still missing: $($wanted.Count)"
$wanted.Values | Select-Object -First 10 | ForEach-Object { "    $_" }
Write-Output "distinct texture names: $($seen.Count)"
Write-Output "name collisions (different sizes): $($collisions.Count)"
$collisions | Select-Object -First 15 | ForEach-Object { "  $_" }
Write-Output "unmatched models: $($unmatched.Count)"
$unmatched | Select-Object -First 20 | ForEach-Object { "  $_" }
