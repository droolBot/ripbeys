# Ensure every marketplace listing has a unique id. Later duplicates get
# reassigned from the next free bb-NNN slot.

$assets = 'D:\beyblade\web\src\lib\assets.ts'
$lines = [IO.File]::ReadAllLines($assets)
$seen = @{}
$maxBb = 0
$renamed = 0

# First pass: find max existing bb number among unique first occurrences.
foreach ($line in $lines) {
  if ($line -match "id: '(bb|bx)-(\d+)'") {
    $n = [int]$Matches[2]
    if ($Matches[1] -eq 'bb' -and $n -gt $maxBb) { $maxBb = $n }
  }
}

$next = $maxBb + 1
$out = New-Object System.Collections.Generic.List[string]
foreach ($line in $lines) {
  if ($line -match "id: '([^']+)'") {
    $id = $Matches[1]
    if ($seen.ContainsKey($id)) {
      $newId = 'bb-{0:D3}' -f $next
      $next++
      $line = $line.Replace("id: '$id'", "id: '$newId'")
      $renamed++
      $seen[$newId] = $true
    } else {
      $seen[$id] = $true
    }
  }
  $out.Add($line)
}

[IO.File]::WriteAllLines($assets, $out)
Write-Output "renumbered duplicate ids: $renamed"
Write-Output "next free bb id: $next"
Write-Output "unique ids now: $($seen.Count)"

# Also bump ingest script startId so future batches don't collide.
$ingest = 'D:\beyblade\web\scripts\ingest-new-uploads.ps1'
$ic = [IO.File]::ReadAllText($ingest)
$ic2 = $ic -replace '\$startId = \d+', "`$startId = $next"
if ($ic2 -ne $ic) {
  [IO.File]::WriteAllText($ingest, $ic2)
  Write-Output "ingest startId -> $next"
}
