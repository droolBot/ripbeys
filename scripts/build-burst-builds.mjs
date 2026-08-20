// A Burst layer on its own is a part, not a beyblade — the toy is
// Layer + Disk + Driver. The export ships those as separate meshes
// (`<Bey>_<Name>_Disk.obj`, `<Bey>_<Name>_Tip.obj`), so this copies the disk
// and driver pool into public/assets/models and writes the manifest the
// viewer stacks from.
//
//   node scripts/build-burst-builds.mjs [--copy]
import fs from 'fs'
import path from 'path'

const SRC = 'D:/beyblade/reference/decoded/beybladeburst/export/Mesh'
const TEX = 'D:/beyblade/reference/decoded/beybladeburst'
const DST = path.resolve('public/assets/models')
const OUT = path.resolve('src/data/burstParts.json')
const copy = process.argv.includes('--copy')

const files = fs.readdirSync(SRC).filter((f) => /\.obj$/i.test(f) && !/_#\d/.test(f))

const allTex = new Map()
;(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.png$/i.test(e.name) && !allTex.has(e.name)) allTex.set(e.name, p)
  }
})(TEX)
const textureFor = (obj) => {
  const base = obj.replace(/\.obj$/i, '')
  return [`${base}_Color.png`, `${base}.png`].find((c) => allTex.has(c))
}

/** `ChoZValtryekRed_Zenith_Disk.obj` -> { name: 'Zenith', bey: 'ChoZValtryekRed' } */
function parse(file, suffix, label) {
  const m = file.match(new RegExp(`^(.+?)(?:_([A-Za-z0-9]+))?_${suffix}\\.obj$`, 'i'))
  if (!m) return null
  return { file, bey: m[1], name: m[2] || label, texture: textureFor(file) }
}

const disks = files.map((f) => parse(f, 'Dis[kc]', 'Forge')).filter(Boolean)
const drivers = files.map((f) => parse(f, 'Tip', 'Standard')).filter(Boolean)

// Only parts that ship a colour map are worth stacking; an untextured grey
// disk under a painted layer looks broken rather than assembled.
const goodDisks = disks.filter((d) => d.texture)
const goodDrivers = drivers.filter((d) => d.texture)

const manifest = {
  disks: (goodDisks.length ? goodDisks : disks).map(({ file, name, texture }) => ({ file, name, texture })),
  drivers: (goodDrivers.length ? goodDrivers : drivers).map(({ file, name, texture }) => ({ file, name, texture })),
}

if (copy) {
  let n = 0
  for (const p of [...manifest.disks, ...manifest.drivers]) {
    fs.copyFileSync(path.join(SRC, p.file), path.join(DST, p.file))
    n++
    if (p.texture && allTex.has(p.texture)) { fs.copyFileSync(allTex.get(p.texture), path.join(DST, p.texture)); n++ }
  }
  console.log('copied files:', n)
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1))
console.log(`disks ${disks.length} (textured ${goodDisks.length}) | drivers ${drivers.length} (textured ${goodDrivers.length})`)
console.log('disk names  :', manifest.disks.slice(0, 10).map((d) => d.name).join(', '))
console.log('driver names:', manifest.drivers.slice(0, 10).map((d) => d.name).join(', '))
console.log('->', path.relative(process.cwd(), OUT))
