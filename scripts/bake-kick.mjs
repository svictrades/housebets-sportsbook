// Bakes a CMU motion-capture kick (BVH) into joint positions per frame.
// Source: mocap.cs.cmu.edu, subject 10 take 01 (B. Hahne BVH conversion). Usage: node scripts/bake-kick.mjs ../assets/mocap/10_01.bvh src/kick.json
import fs from 'node:fs'
const [, , src, out] = process.argv
const tok = fs.readFileSync(src, 'utf8').split(/\s+/).filter(Boolean)
let i = 0
const joints = []
function parse(parent) {
  const type = tok[i++] // ROOT | JOINT | End
  const name = type === 'End' ? (i++, parent.name + '_end') : tok[i++]
  const j = { name, parent, offset: [0, 0, 0], ch: [], idx: joints.length }
  joints.push(j)
  i++ // {
  while (tok[i] !== '}') {
    if (tok[i] === 'OFFSET') { j.offset = [+tok[i + 1], +tok[i + 2], +tok[i + 3]]; i += 4 }
    else if (tok[i] === 'CHANNELS') { const n = +tok[i + 1]; j.ch = tok.slice(i + 2, i + 2 + n); i += 2 + n }
    else parse(j)
  }
  i++ // }
}
i = tok.indexOf('ROOT'); parse(null)
i = tok.indexOf('Frames:'); const nFrames = +tok[i + 1]
i = tok.indexOf('Time:'); const dt = +tok[i + 1]; i += 2
const nCh = joints.reduce((a, j) => a + j.ch.length, 0)
const data = tok.slice(i).map(Number)
const mul = (a, b) => { const r = new Array(12); for (let c = 0; c < 3; c++) for (let d = 0; d < 4; d++) r[c * 4 + d] = a[c * 4] * b[d] + a[c * 4 + 1] * b[4 + d] + a[c * 4 + 2] * b[8 + d] + (d === 3 ? a[c * 4 + 3] : 0); return r }
const T = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]
const R = (ax, deg) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return ax === 'X' ? [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0] : ax === 'Y' ? [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0] : [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0] }
function pose(f) {
  let p = f * nCh
  const world = []
  const pos = {}
  for (const j of joints) {
    let m = T(...j.offset)
    for (const c of j.ch) { const v = data[p++]; m = mul(m, c.endsWith('position') ? T(c[0] === 'X' ? v : 0, c[0] === 'Y' ? v : 0, c[0] === 'Z' ? v : 0) : R(c[0], v)) }
    const w = j.parent ? mul(world[j.parent.idx], m) : m
    world[j.idx] = w
    pos[j.name] = [w[3], w[7], w[11]]
  }
  return pos
}
const KEEP = ['Hips', 'Spine1', 'Neck', 'Head', 'Head_end', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand']
const step = Math.round(1 / 30 / dt)
const all = []
for (let f = 0; f < nFrames; f += step) all.push(pose(f))
// find the strike: the frame where a toe moves fastest
let best = 0, bf = 0, foot = 'RightToeBase'
for (let f = 1; f < all.length; f++) for (const k of ['LeftToeBase', 'RightToeBase']) { const a = all[f][k], b = all[f - 1][k]; const v = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (v > best) { best = v; bf = f; foot = k } }
const a = Math.max(0, bf - 48), b = Math.min(all.length - 1, bf + 34)
const floor = Math.min(...all.slice(a, b).flatMap((p) => [p.LeftToeBase[1], p.RightToeBase[1], p.LeftFoot[1], p.RightFoot[1]]))
const hipAt = all[bf].Hips
const r1 = (n) => Math.round(n * 10) / 10
const frames = all.slice(a, b + 1).map((p) => KEEP.flatMap((k) => [r1(p[k][0] - hipAt[0]), r1(p[k][1] - floor), r1(p[k][2] - hipAt[2])]))
// direction the ball leaves in: toe velocity at the strike, flattened to the floor
const t0 = all[bf - 1][foot], t1 = all[bf][foot]
const dir = [t1[0] - t0[0], t1[2] - t0[2]]; const dl = Math.hypot(...dir)
const json = { joints: KEEP, fps: 30, strike: bf - a, foot, dir: [r1(dir[0] / dl * 10) / 10, r1(dir[1] / dl * 10) / 10], ball: [r1(t1[0] - hipAt[0]), r1(t1[2] - hipAt[2])], frames }
fs.writeFileSync(out, JSON.stringify(json))
console.log('joints', joints.length, 'frames', nFrames, 'dt', dt, 'strike@', bf, 'of', all.length, foot, 'kept', frames.length, 'bytes', JSON.stringify(json).length, 'hipH', r1(hipAt[1] - floor), 'names', joints.map((j) => j.name).slice(0, 40).join(','))
