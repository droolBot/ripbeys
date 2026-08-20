import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import fs from 'fs'
import path from 'path'

const files = [
  'public/assets/models/sword_dran.fbx',
  'public/assets/models/spryzenrequiemv2geo.fbx',
  'public/assets/models/perfectphoenixgeo.fbx',
  'public/assets/models/fx_sphinx_fireslashes.fbx',
]

globalThis.fetch = async (input) => {
  let file = typeof input === 'string' ? input : input.url
  if (file.startsWith('/') && !file.startsWith('file:')) file = path.join(process.cwd(), 'public', file)
  else if (!path.isAbsolute(file)) file = path.resolve(file)
  else file = file.replace(/^file:\/\//, '')
  const buf = fs.readFileSync(file)
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    text: async () => buf.toString('utf8'),
  }
}

// FBXLoader parses material references while inspecting geometry. Node has no
// DOM Image, so provide a metadata-only texture handle; the browser viewer
// still performs the real texture load.
THREE.TextureLoader.prototype.load = function (url, onLoad) {
  const tex = new THREE.Texture()
  tex.name = path.basename(url)
  tex.image = { width: 4, height: 4, src: url }
  onLoad?.(tex)
  return tex
}

const loader = new FBXLoader()
for (const f of files) {
  const abs = path.resolve(f)
  const obj = await loader.loadAsync(abs)
  let meshes = 0
  const mats = []
  obj.traverse((n) => {
    if (!n.isMesh) return
    meshes++
    const list = Array.isArray(n.material) ? n.material : [n.material]
    for (const m of list) {
      if (!m) continue
      mats.push({
        name: n.name,
        type: m.type,
        color: m.color ? `#${m.color.getHexString()}` : null,
        metalness: m.metalness,
        roughness: m.roughness,
        opacity: m.opacity,
        transparent: m.transparent,
        vertexColors: m.vertexColors,
        map: !!m.map,
        verts: n.geometry?.attributes?.position?.count ?? 0,
      })
    }
  })
  const box = new THREE.Box3().setFromObject(obj)
  const size = box.getSize(new THREE.Vector3())
  console.log('===', path.basename(f), 'meshes', meshes, 'size', size.toArray().map((v) => +v.toFixed(3)))
  console.log(JSON.stringify(mats.slice(0, 10)))
}
