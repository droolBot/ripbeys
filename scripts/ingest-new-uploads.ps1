# Heartbeat ingest: pull every valid named layer / arena not already in BeyVault.

$src = 'D:\beyblade\assets\Model Exports (Unsorted FBX Models, Temporary Upload)'
$dst = 'D:\beyblade\web\public\assets\models'
$assets = 'D:\beyblade\web\src\lib\assets.ts'
$bc = '/assets/game/burst-chrome'
$m = '/assets/models'

function Norm([string]$s) { ($s -replace '[^A-Za-z0-9]', '').ToLowerInvariant() }
function Pretty([string]$file) {
  $n = [IO.Path]::GetFileNameWithoutExtension($file)
  $n = $n -replace '(?i)_?(Geo|EnergyLayer|Layer)$', ''
  $n = $n -replace '(?i)_?V\d+$', ''
  $n = $n -replace '(?i)Premium$', ' Premium'
  $n = $n -replace '(?i)SpeedStorm$', ' SpeedStorm'
  $n = $n -replace '(?i)ReDeco$', ' ReDeco'
  $n = $n -replace '(?i)Black$', ' Black'
  $n = $n -replace '(?i)Red$', ' Red'
  $n = $n -replace '(?i)Green$', ' Green'
  $n = $n -replace '(?i)_', ' '
  # Insert spaces before capitals / digits after letters.
  $n = [regex]::Replace($n, '([a-z])([A-Z0-9])', '$1 $2')
  $n = [regex]::Replace($n, '([A-Z]+)([A-Z][a-z])', '$1 $2')
  $n = [regex]::Replace($n, '\s+', ' ').Trim()

  # Canonical Burst order: Modifier Beast Code
  $map = [ordered]@{
    'Ace Dragon D5 Premium' = 'Ace Dragon D5 (Premium)'
    'Ace Dragon D5' = 'Ace Dragon D5'
    'Achilles A4 Turbo' = 'Turbo Achilles A4'
    'Achilles A5 Sword' = 'Sword Achilles A5'
    'Apocalypse A5 Cosmic' = 'Cosmic Apocalypse A5'
    'Apocalypse A5 Prime' = 'Prime Apocalypse A5'
    'Apocalypse Cosmic Premium' = 'Cosmic Apocalypse (Premium)'
    'Balkesh B5 Zone' = 'Zone Balkesh B5'
    'Command Dragon D5' = 'Command Dragon D5'
    'Cyclops C5 Behemoth' = 'Behemoth Cyclops C5'
    'Dead Phoenix P4' = 'Dead Phoenix P4'
    'Cobra Poison' = 'Poison Cobra'
  }
  if ($map.Contains($n)) { return $map[$n] }
  return $n
}

$byLen = @{}
Get-ChildItem $dst -File | Where-Object { $_.Extension -match '^\.(fbx|obj)$' } |
  ForEach-Object { $byLen[$_.Length] = $_.Name }

$catalogText = Get-Content $assets -Raw
$catalogNorm = Norm $catalogText

$beast = 'Achilles|Valtryek|Valkyrie|Spryzen|Fafnir|Phoenix|Dragon|Driger|Draciel|Dranzer|Roktavor|Helios|Hyperion|Pegasus|Kerbeus|Kraken|Leviathan|Genesis|Apocalypse|Balkesh|Cyclops|Evipero|Ifritor|Minoboros|Satomb|Wyvern|Asura|Ashindra|Anubion|Amaterios|Joker|Balderov|Luinor|Lunior|Diabolos|Belial|Lucifer|Istros|Forneus|Hades|Xcalibur|Longinus|Nightmare|Geist|Dread|Ace|Abyss|Astral|Berserk|Cobra|Bushin|Cho-?Z|Turbo|Brave|Mirage|Kolossal|World|Lord|Requiem|Perfect|Dead|Command|Cosmic|Judgement|Infinite|Origin|Shield|Spear|Sword|Harmony|Poison|Erase|Soul|Royal|Demise|Super|Tact|Prime|Wizard|King|Union|Zone|Behemoth|Ripfire'
$noise = '(?i)Launcher|Cutscene|SpiritAlt|^FX_|_tip|_driver|GeoTip|GeoDriver|FriendReward|Empty|Blank|UI_|Thumb|Poster|Shadow|Outline|Mask|Occlu|SharedAssets|fabric_|glass_|caustic|Spark|Fireball|McDonalds'

$all = Get-ChildItem $src -Recurse -File -EA SilentlyContinue |
  Where-Object {
    $_.Extension -match '^\.(fbx|obj)$' -and
    $_.Length -gt 120KB -and $_.Length -lt 7MB -and
    -not $byLen.ContainsKey($_.Length) -and
    $_.Name -notmatch $noise -and
    $_.Directory.Name -notmatch $noise
  }

# Keep one best variant per base key (prefer Premium, then largest).
$picked = @{}
function Consider($file, $kind) {
  $base = [IO.Path]::GetFileNameWithoutExtension($file.Name)
  $key = Norm ($base -replace '(?i)_?(Geo|EnergyLayer|Layer|Premium|V\d+|Black|Red|Green|SpeedStorm|ReDeco)$','' )
  # Skip cryptic short keys (Chain, Bite, Berserk without beast code)
  if ($key.Length -lt 8 -and $kind -eq 'layer') { return }
  if ($key -match '^(dagger|chain|bite|berserk|astral|guard)') { return }
  if ($picked.ContainsKey($key)) {
    $cur = $picked[$key]
    $preferNew = ($file.Name -match '(?i)Premium' -and $cur.Name -notmatch '(?i)Premium') -or
                 ($file.Length -gt $cur.Length -and -not ($cur.Name -match '(?i)Premium' -and $file.Name -notmatch '(?i)Premium'))
    if (-not $preferNew) { return }
  }
  $picked[$key] = $file
}

$all | Where-Object {
  $_.Name -match "(?i)($beast)" -and
  $_.Name -match '(?i)(Layer|EnergyLayer|Geo)' -and
  $_.Name -notmatch '(?i)^Arena'
} | ForEach-Object { Consider $_ 'layer' }

$all | Where-Object { $_.Name -match '(?i)^Arena_' } |
  ForEach-Object { Consider $_ 'arena' }

# Drop ones whose pretty name is already in the catalog.
$toAdd = @()
foreach ($f in ($picked.Values | Sort-Object Name)) {
  $pretty = Pretty $f.Name
  $pn = Norm $pretty
  $fn = Norm ([IO.Path]::GetFileNameWithoutExtension($f.Name))
  if ($catalogNorm.Contains($pn) -or $catalogNorm.Contains($fn)) { continue }
  # Also skip if a same-named mesh already lives in public (different size)
  $exists = Get-ChildItem $dst -File -EA SilentlyContinue | Where-Object {
    (Norm $_.BaseName) -eq $fn -or (Norm ($_.BaseName -replace '(?i)_?(geo|layer)$','')) -eq (Norm ($f.BaseName -replace '(?i)_?(geo|layer)$',''))
  } | Select-Object -First 1
  if ($exists) { continue }
  $toAdd += [pscustomobject]@{ File = $f; Pretty = $pretty; Kind = if ($f.Name -match '(?i)^Arena') { 'Arena' } else { 'Layer' } }
}

Write-Output "unique new assets: $($toAdd.Count)"
$toAdd | Select-Object -First 80 | ForEach-Object { '  [{0}] {1}  <- {2}' -f $_.Kind, $_.Pretty, $_.File.Name }

# Cap arenas + layers to keep the drop manageable.
$layers = $toAdd | Where-Object Kind -eq 'Layer' | Select-Object -First 60
$arenas = $toAdd | Where-Object Kind -eq 'Arena' | Select-Object -First 20
$batch = @($layers) + @($arenas)
Write-Output "batch size: $($batch.Count) ($($layers.Count) layers + $($arenas.Count) arenas)"

# Copy meshes
$copied = 0
foreach ($item in $batch) {
  $destName = $item.File.Name.ToLowerInvariant()
  Copy-Item $item.File.FullName (Join-Path $dst $destName) -Force
  $item | Add-Member -NotePropertyName DestName -NotePropertyValue $destName -Force
  $copied++
}
Write-Output "copied meshes: $copied"

# Append to modelFiles and marketplaceListings
$lines = [System.IO.File]::ReadAllLines($assets)
$modelEnd = -1; $listEnd = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
  # modelFiles closes with "] as const" — never the bare "]" of listings.
  if ($modelEnd -lt 0 -and $lines[$i] -match '^\s*\]\s*as const') { $modelEnd = $i }
}
for ($i = $lines.Count - 1; $i -ge 0; $i--) {
  if ($lines[$i] -match '^\s*\]\s*$') { $listEnd = $i; break }
}
if ($modelEnd -lt 0 -or $listEnd -lt 0 -or $modelEnd -eq $listEnd) {
  throw "ingest refused to write: modelEnd=$modelEnd listEnd=$listEnd (refusing to corrupt catalog)"
}

$accents = @('#ff4f6a','#35d4ff','#ffa23a','#ffd84f','#8b65ff','#caff00','#ff583d','#2a8cff','#00c8ff','#ff3d61','#5dff7a','#f0aa21')
$classCycle = @('Attack','Defense','Stamina','Balance')
$creators = @('Burst Vault','WBBA Works','X Archive','Rare Bey Club','Phoenix Lab','Beylocker')

$modelInsert = @()
$listInsert = @()
# Always continue past the highest existing bb-NNN so batches never collide.
$startId = 1
foreach ($m in [regex]::Matches($catalogText, "id: 'bb-(\d+)'")) {
  $n = [int]$m.Groups[1].Value
  if ($n -ge $startId) { $startId = $n + 1 }
}
Write-Output "next listing id: bb-$('{0:D3}' -f $startId)"
for ($i = 0; $i -lt $batch.Count; $i++) {
  $item = $batch[$i]
  $modelInsert += "  '$($item.DestName)',"
  $series = if ($item.Kind -eq 'Arena') { 'Burst' } elseif ($item.DestName -match '^(sword_|dagger_|blade_|dran|cobalt|helm|keel)') { 'X' } else { 'Burst' }
  $cls = if ($item.Kind -eq 'Arena') { 'Arena' } else { $classCycle[$i % $classCycle.Count] }
  $price = if ($item.Kind -eq 'Arena') { [math]::Round(2.5 + ($i % 7) * 0.35, 2) } else { [math]::Round(1.1 + ($i % 11) * 0.18, 2) }
  $accent = $accents[$i % $accents.Count]
  $creator = $creators[$i % $creators.Count]
  $edition = '{0:D2} / {1}' -f (($i % 40) + 1), (60 + ($i % 9) * 20)
  $id = 'bb-{0:D3}' -f ($startId + $i)
  $imgPath = if ($item.Kind -eq 'Arena') { 'ArenaThumb_HyperSphere.png' } else { 'battle_menu_quick_battle_imagery.png' }
  $img = "image: ``$" + "{BC}/$imgPath``"
  $model = "model: ``$" + "{M}/$($item.DestName)``"
  $safeName = $item.Pretty -replace "'", "\'"
  $listInsert += "  { id: '$id', name: '$safeName', series: '$series', class: '$cls', price: $price, $img, $model, creator: '$creator', edition: '$edition', accent: '$accent' },"
}

# Insert before closing brackets
$newLines = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($i -eq $modelEnd) {
    # ensure previous line ends with comma
    if ($newLines.Count -gt 0 -and $newLines[$newLines.Count-1] -notmatch ',$') {
      $newLines[$newLines.Count-1] = $newLines[$newLines.Count-1] + ','
    }
    foreach ($l in $modelInsert) { $newLines.Add($l) }
  }
  if ($i -eq $listEnd) {
    if ($newLines.Count -gt 0 -and $newLines[$newLines.Count-1] -notmatch ',$') {
      $newLines[$newLines.Count-1] = $newLines[$newLines.Count-1] + ','
    }
    foreach ($l in $listInsert) { $newLines.Add($l) }
  }
  $newLines.Add($lines[$i])
}
[System.IO.File]::WriteAllLines($assets, $newLines)
Write-Output "catalog appended: $($batch.Count) listings"
$batch | ForEach-Object { $_.DestName } | Set-Content 'D:\beyblade\web\scripts\_last-ingest.txt'
Write-Output 'done'
