import fs from 'fs'
import path from 'path'

const root = process.cwd()
const out = path.join(root, `.railway-deploy-${Date.now()}`)
fs.writeFileSync(path.join(root, '.railway-deploy-path.txt'), out)

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true })
}
function copyFile(src, dest) {
  mkdirp(path.dirname(dest))
  fs.copyFileSync(src, dest)
}
function copyDir(src, dest, filter) {
  if (!fs.existsSync(src)) return
  mkdirp(dest)
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to, filter)
    else if (!filter || filter(from, entry.name)) copyFile(from, to)
  }
}
function dirSize(dir) {
  let n = 0
  if (!fs.existsSync(dir)) return 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    n += e.isDirectory() ? dirSize(p) : fs.statSync(p).size
  }
  return n
}

const keepModels = [
  'dagger_dran.fbx',
  'scythe_incendio.fbx',
  'horn_rhino.fbx',
  'helm_knight.fbx',
  'tail_viper.fbx',
  'yell_kong.fbx',
  'x_sword_dran_3_60_f.fbx',
  'x_soar_phoenix_9_60gf_st.fbx',
  'x_scythe_incendio_3_80_b.fbx',
  'x_bx20_dagger_dran_4_60r.fbx',
]

for (const f of [
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'railway.toml',
]) {
  copyFile(path.join(root, f), path.join(out, f))
}
copyDir(path.join(root, 'src'), path.join(out, 'src'))

const publicSrc = path.join(root, 'public')
for (const entry of fs.readdirSync(publicSrc, { withFileTypes: true })) {
  if (entry.name === 'assets') continue
  const from = path.join(publicSrc, entry.name)
  const to = path.join(out, 'public', entry.name)
  if (entry.isDirectory()) copyDir(from, to)
  else copyFile(from, to)
}

const assetsSrc = path.join(publicSrc, 'assets')
const assetsOut = path.join(out, 'public', 'assets')
mkdirp(assetsOut)
for (const name of ['partners', 'official']) {
  copyDir(path.join(assetsSrc, name), path.join(assetsOut, name))
}
for (const entry of fs.readdirSync(assetsSrc, { withFileTypes: true })) {
  if (entry.isFile()) copyFile(path.join(assetsSrc, entry.name), path.join(assetsOut, entry.name))
}

// Only x-sprites + floors from game
const gameKeep = ['x-sprites', 'floors']
for (const name of gameKeep) {
  const from = path.join(assetsSrc, 'game', name)
  if (fs.existsSync(from)) copyDir(from, path.join(assetsOut, 'game', name))
}

mkdirp(path.join(assetsOut, 'models'))
let packed = 0
for (const file of keepModels) {
  const from = path.join(assetsSrc, 'models', file)
  if (!fs.existsSync(from)) continue
  copyFile(from, path.join(assetsOut, 'models', file))
  packed++
}

const sizeMB = Math.round(dirSize(out) / 1e6)
console.log(JSON.stringify({ out, modelsPacked: packed, sizeMB }, null, 2))
if (sizeMB > 95) {
  console.error('Package still too large for Railway CLI upload')
  process.exit(1)
}
