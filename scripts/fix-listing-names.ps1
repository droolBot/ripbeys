# Names generated from mesh filenames read backwards ("Fafnir F6 Mirage").
# Burst releases are named "<Modifier> <Beast> <Code>", so restore that order
# and keep deco variants in parentheses.

$assets = 'D:\beyblade\web\src\lib\assets.ts'

$rename = [ordered]@{
  'Achilles A5 Union Premium'   = 'Union Achilles A5 (Premium)'
  'Achilles A6 Infinite'        = 'Infinite Achilles A6'
  'Achilles A6 Origin'          = 'Origin Achilles A6'
  'Achilles Cho-Z'              = 'Cho-Z Achilles (Black)'
  'Achilles Infinite'           = 'Infinite Achilles (Pro)'
  'Achilles Union Pro'          = 'Union Achilles (Pro)'
  'Apocalypse A5 Prime'         = 'Prime Apocalypse A5'
  'Balkesh B5 Erase'            = 'Erase Balkesh B5'
  'Balkesh Soul'                = 'Soul Balkesh (Pro)'
  'Cyclops C5 Poison'           = 'Poison Cyclops C5'
  'Fafnir F5 Wizard'            = 'Wizard Fafnir F5'
  'Fafnir F6 Kolossal'          = 'Kolossal Fafnir F6'
  'Fafnir F6 Mirage Speedstorm' = 'Mirage Fafnir F6 (SpeedStorm)'
  'Fafnir Mirage'               = 'Mirage Fafnir (Pro)'
  'Fafnir Wizard'               = 'Wizard Fafnir (Pro)'
  'Genesis G5 Royal'            = 'Royal Genesis G5 (Premium)'
  'Helios H6 Kolossal'          = 'King Helios H6'
  'Helios H6 Mirage'            = 'Mirage Helios H6'
  'Hyperion H6 Demise'          = 'Demise Hyperion H6'
  'Hyperion H6 Spear'           = 'Spear Hyperion H6'
  'Hyperion H6 Super'           = 'Super Hyperion H6'
  'Kerbeus K5 Shield'           = 'Shield Kerbeus K5'
  'Kraken K5 Shield'            = 'Shield Kraken K5'
  'Leviathan L5 Tact'           = 'Tact Leviathan L5'
  'Pegasus P5 Harmony'          = 'Harmony Pegasus P5'
  'Satomb S6 Brave'             = 'Brave Satomb S6'
  'Spryzen Lord'                = 'Lord Spryzen'
  'Spryzen S6 World'            = 'World Spryzen S6'
  'Valtryek Brave'              = 'Brave Valtryek'
  'Valtryek Cho-Z Red'          = 'Cho-Z Valtryek (Red)'
  'Valtryek Sword'              = 'Sword Valtryek'
  'Valtryek V5 Union'           = 'Union Valtryek V5'
  'Valtryek V6 Spear'           = 'Spear Valtryek V6'
  'Bushin Ashindra A5'          = 'Bushin Ashindra A5 (ReDeco)'
  'Spryzen S5'                  = 'Spryzen Requiem S5'
  'Achilles A5 Layer'           = 'Achilles A5'
  'Fafnir F4 Layer'             = 'Fafnir F4'
  'Ace Dragon Layer'            = 'Ace Dragon'
}

$lines = [System.IO.File]::ReadAllLines($assets)
$renamed = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
  foreach ($old in $rename.Keys) {
    if ($lines[$i].Contains("name: '$old'")) {
      $lines[$i] = $lines[$i].Replace("name: '$old'", "name: '$($rename[$old])'")
      $renamed++
      Write-Output "  $old -> $($rename[$old])"
      break
    }
  }
}

# Full beys and bare energy layers can now collide; the OBJ exports are layers.
$seen = @{}
for ($i = 0; $i -lt $lines.Count; $i++) {
  $m = [regex]::Match($lines[$i], "name: '([^']+)'")
  if (-not $m.Success -or $lines[$i] -notmatch 'marketplaceListings|id: ') { continue }
  $name = $m.Groups[1].Value
  if (-not $seen.ContainsKey($name)) { $seen[$name] = $i; continue }
  $target = if ($lines[$i] -match '\.obj``') { $i } else { $seen[$name] }
  if ($lines[$target] -match '\.obj``') {
    $lines[$target] = $lines[$target].Replace("name: '$name'", "name: '$name Layer'")
    Write-Output "  dedup: $name -> $name Layer"
  }
}

[System.IO.File]::WriteAllLines($assets, $lines)
Write-Output "renamed: $renamed"
