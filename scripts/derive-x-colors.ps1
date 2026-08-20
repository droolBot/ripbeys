# Beyblade X meshes ship only AO/edge masks: Unity tinted the parts in-shader,
# so the export has no colour at all. Each release does ship its retail product
# photo, so the body colour is sampled from that and written back to the listing
# as `tint`, along with the photo itself as the card art.

Add-Type -AssemblyName System.Drawing

$dst = 'D:\beyblade\web\public\assets\models'
$beys = 'D:\beyblade\web\public\assets\game\beys'
$assets = 'D:\beyblade\web\src\lib\assets.ts'
New-Item -ItemType Directory -Force -Path $beys | Out-Null

function Get-DominantColor([string]$path) {
  $bmp = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $stepX = [Math]::Max(1, [int]($bmp.Width / 96))
    $stepY = [Math]::Max(1, [int]($bmp.Height / 96))
    $buckets = @{}
    for ($y = 0; $y -lt $bmp.Height; $y += $stepY) {
      for ($x = 0; $x -lt $bmp.Width; $x += $stepX) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -lt 200) { continue }
        $s = $p.GetSaturation(); $b = $p.GetBrightness()
        # Drop the photo backdrop and near-black shadow, keep painted plastic.
        if ($s -lt 0.28 -or $b -lt 0.14 -or $b -gt 0.95) { continue }
        $hue = [int][Math]::Floor($p.GetHue() / 15) # 24 hue buckets
        $w = $s * $b
        if (-not $buckets.ContainsKey($hue)) {
          $buckets[$hue] = [pscustomobject]@{ W = 0.0; R = 0.0; G = 0.0; B = 0.0 }
        }
        $bk = $buckets[$hue]
        $bk.W += $w; $bk.R += $p.R * $w; $bk.G += $p.G * $w; $bk.B += $p.B * $w
      }
    }
    if ($buckets.Count -eq 0) { return $null }
    $best = $buckets.Values | Sort-Object W -Descending | Select-Object -First 1
    $r = [int]($best.R / $best.W); $g = [int]($best.G / $best.W); $bl = [int]($best.B / $best.W)

    # Keep the tint readable under studio lighting.
    $col = [System.Drawing.Color]::FromArgb($r, $g, $bl)
    $h = $col.GetHue(); $sat = [Math]::Max(0.55, [Math]::Min(0.95, $col.GetSaturation()))
    $lum = [Math]::Max(0.42, [Math]::Min(0.62, $col.GetBrightness()))
    # HSL -> RGB
    $c = (1 - [Math]::Abs(2 * $lum - 1)) * $sat
    $hp = $h / 60.0
    $x2 = $c * (1 - [Math]::Abs(($hp % 2) - 1))
    $m = $lum - $c / 2
    switch ([int][Math]::Floor($hp)) {
      0 { $rr = $c; $gg = $x2; $bb = 0 }
      1 { $rr = $x2; $gg = $c; $bb = 0 }
      2 { $rr = 0; $gg = $c; $bb = $x2 }
      3 { $rr = 0; $gg = $x2; $bb = $c }
      4 { $rr = $x2; $gg = 0; $bb = $c }
      default { $rr = $c; $gg = 0; $bb = $x2 }
    }
    return '#{0:x2}{1:x2}{2:x2}' -f [int](255 * ($rr + $m)), [int](255 * ($gg + $m)), [int](255 * ($bb + $m))
  } finally { $bmp.Dispose() }
}

# Product photo referenced by each mask-only FBX (BX01_DranSword_3-60f.png etc).
$photoOf = @{}
foreach ($m in Get-ChildItem $dst -Filter *.fbx) {
  $text = [System.Text.Encoding]::ASCII.GetString([System.IO.File]::ReadAllBytes($m.FullName))
  $refs = [regex]::Matches($text, '[A-Za-z0-9_\-#\.]+\.png') | ForEach-Object { $_.Value } | Sort-Object -Unique
  $candidates = $refs | Where-Object {
    $_ -match '(?i)^(bx|cx)' -and $_ -notmatch '(?i)_ao\.|edgemask|curvature'
  }
  # Several FBX reference a shared badge, so prefer the one whose name shares
  # the most words with the mesh (arc_wizard -> CX02_WizardArcR_4-55lo).
  $tokens = ($m.BaseName -split '[_\-]' | Where-Object { $_.Length -gt 2 })
  $photo = $candidates | ForEach-Object {
    $flat = ($_ -replace '[^A-Za-z0-9]', '').ToLowerInvariant()
    $score = 0
    foreach ($t in $tokens) { if ($flat.Contains($t.ToLowerInvariant())) { $score++ } }
    [pscustomobject]@{ Name = $_; Score = $score; Len = $_.Length }
  } | Sort-Object -Property @{Expression = 'Score'; Descending = $true }, Len |
    Select-Object -First 1 -ExpandProperty Name
  if ($photo -and (Test-Path (Join-Path $dst $photo))) { $photoOf[$m.Name] = $photo }
}
Write-Output "models with product art: $($photoOf.Count)"

$lines = [System.IO.File]::ReadAllLines($assets)
$tinted = 0
$art = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  $mm = [regex]::Match($line, "model: ``\`$\{M\}/([^``]+\.fbx)``")
  if (-not $mm.Success) { continue }
  $model = $mm.Groups[1].Value
  if (-not $photoOf.ContainsKey($model)) { continue }
  if ($line -match 'texture: ') { continue } # already has a real albedo map

  $photo = $photoOf[$model]
  $hex = Get-DominantColor (Join-Path $dst $photo)
  if (-not $hex) { continue }

  Copy-Item (Join-Path $dst $photo) (Join-Path $beys $photo) -Force
  $art++

  $line = $line -replace ", tint: '#[0-9a-fA-F]{6}'", ''
  $line = $line -replace "image: ``\`$\{BEY\}/[^``]+``", ("image: ``$" + "{BEY}/$photo``")
  $line = $line -replace "accent: '#[0-9a-fA-F]{6}'", "accent: '$hex'"
  $needle = "model: ``$" + "{M}/$model``"
  $line = $line.Replace($needle, $needle + ", tint: '$hex'")
  $lines[$i] = $line
  $tinted++
  $nameMatch = [regex]::Match($line, "name: '([^']+)'")
  Write-Output ("  {0,-26} {1}  <- {2}" -f $nameMatch.Groups[1].Value, $hex, $photo)
}

[System.IO.File]::WriteAllLines($assets, $lines)
Write-Output "listings tinted: $tinted"
Write-Output "product photos installed: $art"
