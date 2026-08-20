// AssetStudio's FBX export keeps every Beyblade X part's baked AO and its chip
// decal as files next to the mesh, but wires them to FBX texture slots three.js
// drops on load. This resolves mesh -> AO / decal by name once, offline, so the
// viewer can bind the real maps instead of rendering untextured plastic.
//
//   node scripts/build-part-maps.mjs   ->  src/data/partMaps.json
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import fs from 'fs'
import path from 'path'

const MODELS = path.resolve('public/assets/models')
const OUT = path.resolve('src/data/partMaps.json')

globalThis.fetch = async (input) => {
  let file = typeof input === 'string' ? input : input.url
  file = decodeURIComponent(file.replace(/^file:\/\/\/?/, ''))
  if (!path.isAbsolute(file)) file = path.resolve(MODELS, file)
  const buf = fs.readFileSync(file)
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    text: async () => buf.toString('utf8'),
  }
}
// Node has no Image; the loader only needs a handle, not pixels.
THREE.TextureLoader.prototype.load = function (url, onLoad) {
  const tex = new THREE.Texture()
  tex.name = path.basename(url)
  tex.image = { width: 4, height: 4, src: url }
  if (onLoad) onLoad(tex)
  return tex
}

const onDisk = new Map()
for (const f of fs.readdirSync(MODELS)) onDisk.set(f.toLowerCase(), f)
const find = (name) => (name ? onDisk.get(name.toLowerCase()) : undefined)

/** PNG/TGA names the FBX declares, whatever slot they were wired to. */
function referencedTextures(file) {
  const txt = fs.readFileSync(path.join(MODELS, file), 'latin1')
  return [...new Set([...txt.matchAll(/[A-Za-z0-9_\-#.]{3,80}\.(?:png|jpg|jpeg|tga)/g)].map((m) => m[0]))]
}

const isAO = (n) => /_ao\.png$/i.test(n)
// The retail badge art (BX17_DranSword_3-60f.png) is the chip decal.
const isDecal = (n) => /^(bx|cx)[a-z0-9]*_/i.test(n) && !/_ao\.|edgemask|curvature/i.test(n)

/**
 * Blade AO is baked per bey, so it is named after the bey, not the mesh. The
 * per-bey guesses only apply to FBX, whose own texture list scopes them; an OBJ
 * ships no references, so it gets exact name matches only.
 */
function aoForMesh(mesh, aoFiles, exactOnly) {
  // OBJLoader suffixes each group with its index (AuxBlade_B -> AuxBlade_B_0).
  const exact = find(`${mesh}_AO.png`) ?? find(`${mesh.replace(/_\d+$/, '')}_AO.png`)
  if (exact || exactOnly) return exact
  const pick = (re) => aoFiles.find((f) => re.test(f))
  if (/^Head_metal/i.test(mesh) || /^Head_parts01/i.test(mesh)) return pick(/_Blade_AO\.png$/i)
  if (/^Head_parts02/i.test(mesh)) return pick(/_BladeLower_AO\.png$/i) ?? pick(/_Blade_AO\.png$/i)
  if (/^(Head_top|Base_|Aux)/i.test(mesh)) return pick(/SharedAssetsBake_AO\.png$/i)
  return undefined
}

const fbxLoader = new FBXLoader()
const objLoader = new OBJLoader()
const out = {}
let models = 0
let aoWired = 0
let decalWired = 0
let noUv = []

for (const file of fs.readdirSync(MODELS).filter((f) => /\.(fbx|obj)$/i.test(f))) {
  const isObj = file.toLowerCase().endsWith('.obj')
  const refs = isObj ? [] : referencedTextures(file)
  const aoFiles = refs.map(find).filter(Boolean).filter(isAO)
  const decal = refs.map(find).filter(Boolean).find(isDecal)
  if (!isObj && !aoFiles.length && !decal) continue

  let object
  try {
    object = await (isObj ? objLoader : fbxLoader).loadAsync(path.join(MODELS, file))
  } catch {
    continue
  }

  const entry = {}
  object.traverse((node) => {
    if (!node.isMesh) return
    const ao = aoForMesh(node.name, aoFiles, isObj)
    if (!ao) return
    if (!node.geometry.attributes.uv) {
      noUv.push(`${file}:${node.name}`)
      return
    }
    entry[node.name] = ao
    aoWired++
  })

  if (Object.keys(entry).length || decal) {
    out[file] = { ao: entry }
    if (decal) {
      out[file].decal = decal
      decalWired++
    }
    models++
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
console.log(`models: ${models}  meshes with AO: ${aoWired}  chip decals: ${decalWired}`)
if (noUv.length) console.log(`skipped (no UVs): ${noUv.length}`, noUv.slice(0, 8).join(', '))
console.log('->', path.relative(process.cwd(), OUT))
