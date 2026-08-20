$assets = 'D:\beyblade\web\src\lib\assets.ts'
$c = [IO.File]::ReadAllText($assets)
Write-Output "listings before: $(([regex]::Matches($c, "id: '")).Count)"

$fixes = @{
  'Pegasus P5Glyph' = 'Glyph Pegasus P5'
  'Perfect Phoenix P4Pro Series' = 'Perfect Phoenix P4 (Pro Series)'
  'Phoenix P4Perfect' = 'Perfect Phoenix P4'
  'Roktavor R6Brave' = 'Brave Roktavor R6'
  'Roktavor R6Glide' = 'Glide Roktavor R6'
  'Satomb S6Curse' = 'Curse Satomb S6'
  'Satomb S6Demise' = 'Demise Satomb S6'
  'Satomb S6Super' = 'Super Satomb S6'
  'Spryzen S5Dusk' = 'Dusk Spryzen S5'
  'Spryzen S5Lord' = 'Lord Spryzen S5'
  'Arena Slayer' = 'Slayer Arena'
  'Arena Slingshock' = 'Slingshock Arena'
  'Arena Sub Strike' = 'Sub Strike Arena'
  'Arena Triangle' = 'Triangle Arena'
  'Arena Vertical Drop' = 'Vertical Drop Arena'
  'Arena Virtual Championship' = 'Virtual Championship Arena'
  'Arena Volt Knockout' = 'Volt Knockout Arena'
  'Arena Vortex Climb' = 'Vortex Climb Arena'
  'Arena Waterfall' = 'Waterfall Arena'
  'Arena Sky Clash' = 'Sky Clash Arena'
}
$n = 0
foreach ($k in $fixes.Keys) {
  $from = "name: '$k'"; $to = "name: '$($fixes[$k])'"
  if ($from -ne $to -and $c.Contains($from)) { $c = $c.Replace($from, $to); $n++ }
}
[IO.File]::WriteAllText($assets, $c)
Write-Output "renamed: $n"

$lines = [IO.File]::ReadAllLines($assets)
$seen = @{}; $out = New-Object System.Collections.Generic.List[string]; $in = $false; $rm = 0
foreach ($line in $lines) {
  if ($line -match 'export const marketplaceListings') { $in = $true; $out.Add($line); continue }
  if ($in -and $line -match "name: '([^']+)'") {
    if ($seen.ContainsKey($Matches[1])) { $rm++; continue }
    $seen[$Matches[1]] = $true
  }
  if ($in -and $line -match '^\s*\]\s*$') { $in = $false }
  $out.Add($line)
}
[IO.File]::WriteAllLines($assets, $out)
Write-Output "dedup removed: $rm"
Write-Output "listings after: $(([regex]::Matches(([IO.File]::ReadAllText($assets)), "id: '")).Count)"
