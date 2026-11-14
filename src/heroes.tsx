// Animated sport headers, all drawn in the same glass-and-cyan line style on one 2D canvas.
// Football uses a real motion-capture kick (CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu, subject 10).
import { useEffect, useRef } from 'react'
import kick from './kick.json'
import { useBook } from './book'
import type { Sport } from './data'

type View = (x: number, y: number, z: number) => [number, number, number, number]
type Ctx = { ctx: CanvasRenderingContext2D; w: number; h: number; now: number; t: number; still: boolean; V: View; S: number; cx: number; gy: number; phone: boolean; clear: number }
// one fade for a whole figure, so a scene can put its player away and bring it back
let GA = 1

const RIM = (g: CanvasGradient, flip = false) => {
  g.addColorStop(flip ? 1 : 0, 'rgba(196,244,241,.95)'); g.addColorStop(0.5, 'rgba(2,248,248,.5)'); g.addColorStop(flip ? 0 : 1, 'rgba(8,96,116,.75)')
  return g
}
const GLASS = 'rgba(5,24,31,.9)'
function capsule(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, wd: number, alpha = 1) {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1
  const nx = (-dy / l) * (wd / 2), ny = (dx / l) * (wd / 2)
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const up = ny < 0 ? 1 : -1
  ctx.globalAlpha = alpha * GA; ctx.lineCap = 'round'
  ctx.strokeStyle = RIM(ctx.createLinearGradient(mx - nx, my - ny, mx + nx, my + ny), up > 0); ctx.lineWidth = wd
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.strokeStyle = GLASS; ctx.lineWidth = Math.max(0.5, wd - 2.2)
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.strokeStyle = 'rgba(196,244,241,.16)'; ctx.lineWidth = Math.max(0.6, wd * 0.2)
  const ox = nx * 0.42 * up, oy = ny * 0.42 * up
  ctx.beginPath(); ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy); ctx.stroke()
  ctx.globalAlpha = 1
}
function orb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1) {
  ctx.globalAlpha = alpha * GA
  ctx.fillStyle = GLASS; ctx.strokeStyle = RIM(ctx.createLinearGradient(x, y - r, x, y + r)); ctx.lineWidth = 1.3
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke()
  ctx.strokeStyle = 'rgba(196,244,241,.22)'; ctx.lineWidth = Math.max(0.8, r * 0.2)
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke()
  ctx.globalAlpha = 1
}
function ring(c: Ctx, x: number, z: number, r: number, alpha: number) {
  if (alpha <= 0.01) return
  const [px, py, , s] = c.V(x, 0, z)
  c.ctx.save(); c.ctx.translate(px, py); c.ctx.scale(1, 0.22)
  c.ctx.strokeStyle = `rgba(2,248,248,${alpha})`; c.ctx.lineWidth = 1.2
  c.ctx.beginPath(); c.ctx.arc(0, 0, r * s, 0, 7); c.ctx.stroke(); c.ctx.restore()
}
function shadow(c: Ctx, x: number, z: number, r: number, a = 0.6) {
  const [px, py, , s] = c.V(x, 0, z)
  const g = c.ctx.createRadialGradient(px, py, 0, px, py, r * s)
  g.addColorStop(0, `rgba(0,0,0,${a * GA})`); g.addColorStop(1, 'rgba(0,0,0,0)')
  c.ctx.save(); c.ctx.translate(px, py); c.ctx.scale(1, 0.2); c.ctx.translate(-px, -py); c.ctx.fillStyle = g; c.ctx.beginPath(); c.ctx.arc(px, py, r * s, 0, 7); c.ctx.fill(); c.ctx.restore()
}
function line3(c: Ctx, a: number[], b: number[], style: string, lw = 1.2) {
  const A = c.V(a[0], a[1], a[2]), B = c.V(b[0], b[1], b[2])
  c.ctx.strokeStyle = style; c.ctx.lineWidth = lw; c.ctx.lineCap = 'round'
  c.ctx.beginPath(); c.ctx.moveTo(A[0], A[1]); c.ctx.lineTo(B[0], B[1]); c.ctx.stroke()
}
// the floor every header shares: the Housebets wave, running the full width of the band
function floor(c: Ctx) {
  const { ctx, w, cx, S } = c
  ctx.lineWidth = 1
  const x0 = -cx / S - 6, x1 = (w - cx) / S + 6
  for (let r = 0; r < 8; r++) {
    const z = -22 + r * 6.5
    ctx.beginPath()
    for (let x = x0; x <= x1; x += 4) {
      const y = Math.sin(x * 0.19 + r * 0.9 + (c.still ? 0 : c.now / 1100)) * 0.55
      const [px, py] = c.V(x, y, z)
      x === x0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.strokeStyle = `rgba(2,248,248,${0.028 + r * 0.012})`
    ctx.stroke()
  }
}
function ball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, spin: number, kind: Sport) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(spin)
  ctx.fillStyle = GLASS; ctx.strokeStyle = 'rgba(2,248,248,.9)'; ctx.lineWidth = 1.1
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke()
  ctx.strokeStyle = 'rgba(2,248,248,.55)'; ctx.beginPath()
  if (kind === 'football') {
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; const px = Math.cos(a) * r * 0.42, py = Math.sin(a) * r * 0.42; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py) }
    ctx.closePath()
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; ctx.moveTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) }
  } else if (kind === 'tennis') {
    ctx.arc(-r * 1.25, 0, r * 0.95, -0.9, 0.9); ctx.moveTo(r * 1.25 + Math.cos(Math.PI - 0.9) * r * 0.95, Math.sin(Math.PI - 0.9) * r * 0.95); ctx.arc(r * 1.25, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9)
  } else {
    ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r)
    ctx.moveTo(-r * 0.72, -r * 0.7); ctx.quadraticCurveTo(-r * 0.25, 0, -r * 0.72, r * 0.7); ctx.moveTo(r * 0.72, -r * 0.7); ctx.quadraticCurveTo(r * 0.25, 0, r * 0.72, r * 0.7)
  }
  ctx.stroke(); ctx.restore()
}

// ---- a jointed figure in the same glass capsules, posed by a few angles ---------------------
// Angles are in radians from "hanging straight down"; positive swings forward. Feet find the floor by themselves.
type Pose = { lean: number; lt: number; lk: number; rt: number; rk: number; la: number; le: number; ra: number; re: number; hx: number; air: number }
const pose = (lean: number, lt: number, lk: number, rt: number, rk: number, la: number, le: number, ra: number, re: number, hx = 0, air = 0): Pose => ({ lean, lt, lk, rt, rk, la, le, ra, re, hx, air })
const LEN = { torso: 8.2, neck: 3.5, head: 1.75, thigh: 6.8, shin: 6.8, foot: 2.1, arm: 5, fore: 4.6, hip: 1.5, sh: 2.5 }
const smooth = (k: number) => { const u = Math.max(0, Math.min(1, k)); return u * u * (3 - 2 * u) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
// Keep-out: `clear` is the right edge of the header text plus 24px. Balls and rings fade to nothing before they reach it,
// so nothing is ever drawn under the title or the counters, at any width.
const keep = (c: Ctx, x: number) => smooth((x - c.clear) / 40)
// every figure plays once, then waits in its ready pose for this long before the next cycle (football already did)
const REST = 8
function between(keys: [number, Pose][], t: number): Pose {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i]
      const k = smooth((t - t0) / (t1 - t0))
      const o = {} as Pose
      for (const key of Object.keys(a) as (keyof Pose)[]) o[key] = lerp(a[key], b[key], k)
      return o
    }
  }
  return keys[keys.length - 1][1]
}
type P3 = [number, number, number]
type Rig = Record<'hip' | 'neck' | 'head' | 'lHip' | 'rHip' | 'lKnee' | 'rKnee' | 'lAnk' | 'rAnk' | 'lToe' | 'rToe' | 'lSh' | 'rSh' | 'lElb' | 'rElb' | 'lHand' | 'rHand', P3>
// world positions of every joint: ox is where the figure stands, face is +1 (looking right) or -1, yaw turns it towards the viewer
function rig(p: Pose, ox: number, face: number, yaw = 0.4): Rig {
  const sn = Math.sin, cs = Math.cos
  const leg = (t: number, k: number) => { const kx = LEN.thigh * sn(t), ky = -LEN.thigh * cs(t); return [kx, ky, kx + LEN.shin * sn(t - k), ky - LEN.shin * cs(t - k)] }
  const l = leg(p.lt, p.lk), r = leg(p.rt, p.rk)
  const hy = -Math.min(l[3], r[3]) + 0.7 + p.air
  const cy = cs(yaw), sy = sn(yaw)
  const W = (x: number, y: number, z: number): P3 => [ox + face * ((p.hx + x) * cy - z * sy), Math.max(0.3, hy + y), (p.hx + x) * sy + z * cy]
  const nx = LEN.torso * sn(p.lean), ny = LEN.torso * cs(p.lean)
  const arm = (a: number, e: number) => { const ex = nx + LEN.arm * sn(a), ey = ny - LEN.arm * cs(a); return [ex, ey, ex + LEN.fore * sn(a + e), ey - LEN.fore * cs(a + e)] }
  const A = arm(p.la, p.le), R = arm(p.ra, p.re)
  const toe = (x: number, y: number, z: number): P3 => { const t = W(x + LEN.foot, y - 0.35, z); return t }
  return {
    hip: W(0, 0, 0), neck: W(nx, ny, 0), head: W(nx + LEN.neck * sn(p.lean * 0.6), ny + LEN.neck * cs(p.lean * 0.6), 0),
    lHip: W(0, 0, -LEN.hip), rHip: W(0, 0, LEN.hip),
    lKnee: W(l[0], l[1], -LEN.hip), rKnee: W(r[0], r[1], LEN.hip), lAnk: W(l[2], l[3], -LEN.hip), rAnk: W(r[2], r[3], LEN.hip),
    lToe: toe(l[2], l[3], -LEN.hip), rToe: toe(r[2], r[3], LEN.hip),
    lSh: W(nx, ny, -LEN.sh), rSh: W(nx, ny, LEN.sh),
    lElb: W(A[0], A[1], -LEN.sh - 0.3), rElb: W(R[0], R[1], LEN.sh + 0.3), lHand: W(A[2], A[3], -LEN.sh), rHand: W(R[2], R[3], LEN.sh),
  }
}
const RIG_BONES: [keyof Rig, keyof Rig, number][] = [
  ['hip', 'neck', 2.7], ['lHip', 'rHip', 2.0], ['lSh', 'rSh', 1.7], ['neck', 'head', 1.0],
  ['lHip', 'lKnee', 1.65], ['lKnee', 'lAnk', 1.2], ['lAnk', 'lToe', 0.85], ['rHip', 'rKnee', 1.65], ['rKnee', 'rAnk', 1.2], ['rAnk', 'rToe', 0.85],
  ['lSh', 'lElb', 1.05], ['lElb', 'lHand', 0.85], ['rSh', 'rElb', 1.05], ['rElb', 'rHand', 0.85],
]
type Part = { z: number; run: () => void }
function rigParts(c: Ctx, g: Rig): Part[] {
  const { ctx } = c
  const pt = {} as Record<keyof Rig, [number, number, number, number]>
  for (const k of Object.keys(g) as (keyof Rig)[]) pt[k] = c.V(g[k][0], g[k][1], g[k][2])
  const parts: Part[] = []
  const hipZ = pt.hip[2]
  for (const [a, b, r] of RIG_BONES) {
    const A = pt[a], B = pt[b], z = (A[2] + B[2]) / 2
    parts.push({ z, run: () => capsule(ctx, A[0], A[1], B[0], B[1], r * 2 * ((A[3] + B[3]) / 2), z < hipZ - 0.6 ? 0.6 : 1) })
  }
  const H = pt.head
  parts.push({ z: H[2] + 0.5, run: () => orb(ctx, H[0], H[1], LEN.head * H[3]) })
  return parts
}
const paint = (parts: Part[]) => parts.sort((p, q) => p.z - q.z).forEach((p) => p.run())
const mid = (a: P3, b: P3, k = 0.5): P3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]

// ---- football: the motion-capture strike ------------------------------------------
// He runs in, strikes, the ball crosses the band behind the title; then he settles, a new ball rolls to his feet and he waits.
const J: Record<string, number> = Object.fromEntries(kick.joints.map((n, i) => [n, i]))
const BONES: [string, string, number][] = [
  ['Hips', 'Spine1', 2.5], ['Spine1', 'Neck', 2.9], ['LeftUpLeg', 'RightUpLeg', 2.0], ['LeftArm', 'RightArm', 1.7], ['Neck', 'Head', 1.0],
  ['LeftUpLeg', 'LeftLeg', 1.65], ['LeftLeg', 'LeftFoot', 1.2], ['LeftFoot', 'LeftToeBase', 0.85],
  ['RightUpLeg', 'RightLeg', 1.65], ['RightLeg', 'RightFoot', 1.2], ['RightFoot', 'RightToeBase', 0.85],
  ['LeftArm', 'LeftForeArm', 1.05], ['LeftForeArm', 'LeftHand', 0.85], ['RightArm', 'RightForeArm', 1.05], ['RightForeArm', 'RightHand', 0.85],
]
const N = Math.min(kick.frames.length, kick.strike + 13)
const YAW = -Math.atan2(kick.dir[1], kick.dir[0]) + 0.3
const SPEED = 0.74
const T_KICK = (N - 1) / 30 / SPEED, T_SETTLE = 0.9
export const FOOTBALL_LOOP = T_KICK + T_SETTLE + 9
const frameAt = (f: number, i: number): P3 => {
  const a = kick.frames[Math.min(N - 1, Math.floor(f))], b = kick.frames[Math.min(N - 1, Math.floor(f) + 1)], k = f - Math.floor(f)
  return [lerp(a[i * 3], b[i * 3], k), lerp(a[i * 3 + 1], b[i * 3 + 1], k), lerp(a[i * 3 + 2], b[i * 3 + 2], k)]
}
function football(c: Ctx) {
  const { ctx } = c
  const t = c.still ? T_KICK + T_SETTLE + 4 : c.t
  const f = Math.min(N - 1, t * 30 * SPEED)
  const ca = Math.cos(YAW), sa = Math.sin(YAW)
  // the capture runs left to right; mirrored here so the strike travels towards the title
  const turn = (x: number, z: number): [number, number] => [-(x * ca - z * sa), x * sa + z * ca]
  const P = (p: number[]) => { const [X, Z] = turn(p[0], p[2]); return c.V(X, p[1], Z) }
  const settle = smooth((t - T_KICK) / T_SETTLE)
  const h0 = frameAt(0, 0), hE = frameAt(N - 1, 0)
  const breath = settle >= 1 && !c.still ? Math.sin(c.now / 900) : 0
  const joint = (i: number): P3 => {
    const p = frameAt(f, i)
    if (settle <= 0) return p
    // ease from the follow-through back to the standing pose he started in, where he now stands
    const s0 = frameAt(0, i)
    const q: P3 = [lerp(p[0], s0[0] - h0[0] + hE[0], settle), lerp(p[1], s0[1], settle), lerp(p[2], s0[2] - h0[2] + hE[2], settle)]
    if (breath) q[1] += breath * 0.16 * Math.max(0, (q[1] - 12) / 12)
    return q
  }
  const R = 1.7
  const rest = [kick.ball[0] + kick.dir[0] * 1.2, R, kick.ball[1] + kick.dir[1] * 1.2]
  const fly = Math.max(0, (t * 30 * SPEED - kick.strike) / 30)
  const struck = fly > 0 && !c.still
  const hips = joint(0)
  const [sx, sz] = turn(hips[0], hips[2])
  shadow(c, sx, sz, 9)
  const [rx, rz] = turn(rest[0], rest[2])
  if (struck && fly < 1.3) ring(c, rx, rz, 3 + fly * 12, 0.35 * (1 - fly / 1.3) * GA)
  const pts = kick.joints.map((_, i) => P(joint(i)))
  const parts: Part[] = []
  const hipZ = pts[0][2]
  for (const [a, b, r] of BONES) {
    const A = pts[J[a]], Bn = pts[J[b]]
    const z = (A[2] + Bn[2]) / 2
    parts.push({ z, run: () => capsule(ctx, A[0], A[1], Bn[0], Bn[1], r * 2 * ((A[3] + Bn[3]) / 2), z < hipZ - 0.6 ? 0.55 : 1) })
  }
  const H = pts[J.Head], HE = pts[J.Head_end]
  parts.push({ z: H[2] + 0.5, run: () => orb(ctx, (H[0] + HE[0]) / 2, (H[1] + HE[1]) / 2, 1.75 * H[3]) })
  if (!struck) {
    // the ball waits on its spot
    const B = c.V(rx, R, rz)
    shadow(c, rx, rz, 2.4, 0.45)
    parts.push({ z: B[2], run: () => ball(ctx, B[0], B[1], R * B[3], GA, 0, 'football') })
  } else {
    // struck: one lofted pass that crosses the band and fades behind the title
    const a = Math.max(0, 1 - fly / 2.1)
    if (a > 0.02) {
      const y = Math.max(R, R + 30 * fly - 15 * fly * fly)
      const B = P([rest[0] + kick.dir[0] * 62 * fly, y, rest[2] + kick.dir[1] * 62 * fly])
      const ak = a * GA * keep(c, B[0])
      if (ak > 0.02) parts.push({ z: B[2], run: () => ball(ctx, B[0], B[1], R * B[3], ak, -fly * 7, 'football') })
    }
    // a new ball rolls back to the same spot and stops at his feet
    const k = (t - T_KICK - T_SETTLE - 0.3) / 1.7
    if (k > 0) {
      const e = 1 - Math.pow(1 - Math.min(1, k), 3)
      const x = rx - 30 * (1 - e)
      const B = c.V(x, R, rz)
      const ak = Math.min(1, k * 3) * keep(c, B[0])
      shadow(c, x, rz, 2.4, 0.45 * ak)
      if (ak > 0.02) parts.push({ z: B[2], run: () => ball(ctx, B[0], B[1], R * B[3], ak * GA, (30 * e) / R, 'football') })
    }
  }
  paint(parts)
}

// ---- tennis: a forehand, sent back over the net ------------------------------------------
const TN = {
  ready: pose(0.2, 0.45, 0.7, -0.25, 0.45, 0.5, 1.0, 0.35, 1.3),
  back: pose(0.1, 0.55, 0.6, -0.42, 0.5, 0.95, 0.5, -1.05, 0.55, -0.6),
  hit: pose(0.3, 0.62, 0.5, -0.5, 0.3, 0.1, 1.1, 0.95, 0.15, 1.4),
  follow: pose(0.34, 0.6, 0.55, -0.62, 0.75, -0.2, 1.2, 1.35, 1.5, 1.8),
}
const TN_T = 3.4, TN_HIT = 1.2, NET_H = 8.4
function racket(g: Rig): { hand: P3; tip: P3; centre: P3 } {
  const d: P3 = [g.rHand[0] - g.rElb[0], g.rHand[1] - g.rElb[1], g.rHand[2] - g.rElb[2]]
  const l = Math.hypot(d[0], d[1], d[2]) || 1
  const at = (k: number): P3 => [g.rHand[0] + (d[0] / l) * k, g.rHand[1] + (d[1] / l) * k, g.rHand[2] + (d[2] / l) * k]
  return { hand: g.rHand, tip: at(2.6), centre: at(5) }
}
function tennis(c: Ctx) {
  const { ctx } = c
  const raw = c.t % (TN_T + REST)
  const t = c.still ? TN_HIT + 0.16 : Math.min(raw, TN_T)
  const px = 12, net = -26
  // on his toes around the rally; while he waits the bounce settles into slow breathing
  const calm = raw > TN_T ? smooth((raw - TN_T) / 0.5) : 1 - smooth(raw / 0.5)
  const bob = c.still ? 0 : lerp(Math.abs(Math.sin(c.now / 260)) * 0.5, (Math.sin(c.now / 900) + 1) * 0.1, calm)
  const p = between([[0, TN.ready], [0.55, TN.ready], [0.98, TN.back], [TN_HIT, TN.hit], [TN_HIT + 0.32, TN.follow], [2.1, TN.ready], [TN_T, TN.ready]], t)
  const idle = t < 0.55 || t > 2.1
  const g = rig({ ...p, air: idle ? bob : 0 }, px, -1)
  const meet = racket(rig(TN.hit, px, -1)).centre
  // net: posts, tape and a few strings
  const p1 = c.V(net, 0, 9), p2 = c.V(net, NET_H + 0.6, 9)
  const p3 = c.V(net, 0, -9), p4 = c.V(net, NET_H + 0.6, -9)
  // the net stands whole or not at all: it fades out only where the header text would run into it (very narrow screens)
  const nk = smooth((Math.min(p1[0], p3[0]) - (c.clear - 24)) / 24)
  if (nk > 0.02) {
    shadow(c, net, 0, 8, 0.3 * nk)
    for (let i = 0; i <= 6; i++) { const z = -9 + i * 3; line3(c, [net, 0, z], [net, NET_H, z], `rgba(2,248,248,${(0.13 + i * 0.025) * nk})`, 1) }
    for (let j = 1; j <= 5; j++) line3(c, [net, j * 1.4, -9], [net, j * 1.4, 9], `rgba(2,248,248,${0.12 * nk})`, 1)
    const a = c.V(net, NET_H, -9), b = c.V(net, NET_H, 9)
    capsule(ctx, a[0], a[1], b[0], b[1], 0.5 * a[3], nk)
    capsule(ctx, p3[0], p3[1], p4[0], p4[1], 0.62 * p3[3], 0.6 * nk)
    capsule(ctx, p1[0], p1[1], p2[0], p2[1], 0.62 * p1[3], nk)
  }
  // the ball: in over the net, one bounce, met by the racket, and back out behind the title
  const bounceX = meet[0] - 13, T_B = 0.74
  let bx: number, by: number, ba = 1
  if (t < T_B) { const k = t / T_B, u = 0.35 + 0.65 * k; bx = lerp(meet[0] - 76, bounceX, k); by = 0.9 + 14 * 4 * u * (1 - u); ba = Math.min(1, k * 3) }
  else if (t < TN_HIT) { const k = (t - T_B) / (TN_HIT - T_B); bx = lerp(bounceX, meet[0], k); by = 0.9 + (meet[1] - 0.9) * Math.sin((k * Math.PI) / 2) }
  else { const u = (t - TN_HIT) / 1.15; bx = meet[0] - 88 * u; by = Math.max(0.9, meet[1] + 2 * u - 20 * u * u); ba = Math.max(0, 1 - Math.max(0, u - 0.45) / 0.5) }
  ba *= keep(c, c.V(bx, by, meet[2])[0])
  if (!c.still && t >= T_B && t < T_B + 0.7) { const k = (t - T_B) / 0.7; ring(c, bounceX, meet[2], 2 + k * 14, 0.5 * (1 - k) * keep(c, c.V(bounceX, 0, meet[2])[0])) }
  // (the pale ring that used to mark the contact is gone: the ball leaving the strings says it)
  const [gx] = g.hip
  shadow(c, gx, 0, 8.5)
  if (ba > 0.02) shadow(c, bx, meet[2], 2.2, 0.45 * ba)
  const parts = rigParts(c, g)
  const rk = racket(g)
  const h = c.V(...rk.hand), tp = c.V(...rk.tip), ce = c.V(...rk.centre)
  parts.push({ z: ce[2] + 0.2, run: () => {
    capsule(ctx, h[0], h[1], tp[0], tp[1], 0.55 * h[3])
    const ang = Math.atan2(ce[1] - h[1], ce[0] - h[0])
    ctx.save(); ctx.translate(ce[0], ce[1]); ctx.rotate(ang); ctx.globalAlpha = GA
    ctx.fillStyle = 'rgba(2,248,248,.07)'; ctx.strokeStyle = 'rgba(196,244,241,.92)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.ellipse(0, 0, 2.5 * ce[3], 1.85 * ce[3], 0, 0, 7); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = 'rgba(2,248,248,.28)'; ctx.lineWidth = 0.8; ctx.beginPath()
    for (let i = -1; i <= 1; i++) { ctx.moveTo(i * 1.1 * ce[3], -1.6 * ce[3]); ctx.lineTo(i * 1.1 * ce[3], 1.6 * ce[3]); ctx.moveTo(-2.2 * ce[3], i * 0.8 * ce[3]); ctx.lineTo(2.2 * ce[3], i * 0.8 * ce[3]) }
    ctx.stroke(); ctx.restore()
  } })
  if (ba > 0.02) {
    const B = c.V(bx, by, meet[2])
    parts.push({ z: B[2] + 0.1, run: () => ball(ctx, B[0], B[1], 1.15 * B[3], ba, c.t * 9, 'tennis') })
  }
  paint(parts)
}

// ---- basketball: a jump shot, and the ball coming back --------------------------------------
const BK = {
  hold: pose(0.12, 0.35, 0.6, -0.2, 0.4, 0.75, 1.5, 0.9, 1.5),
  dip: pose(0.26, 0.72, 1.2, 0.12, 0.9, 0.6, 1.6, 0.72, 1.65),
  release: pose(0.04, 0.12, 0.18, -0.1, 0.22, 1.85, 0.75, 2.1, 0.55, 0.4, 1.6),
  follow: pose(0.08, 0.32, 0.55, -0.15, 0.38, 1.3, 0.7, 2.05, 1.15, 0.6),
  stand: pose(0.05, 0.16, 0.2, -0.1, 0.16, 0.1, 0.3, 0.16, 0.3, 0.4),
  reach: pose(0.24, 0.5, 0.8, -0.1, 0.5, 0.85, 0.95, 0.95, 0.9, 0.2),
}
const BK_T = 4.8, BK_REL = 0.98, BK_FLY = 1.0, BK_CATCH = 3.6
function basketball(c: Ctx) {
  const { ctx } = c
  const t = c.still ? BK_REL + 0.42 : Math.min(c.t % (BK_T + REST), BK_T)
  const px = -14, hx = 20, hy = 25, R = 1.9
  const p = between([[0, BK.hold], [0.3, BK.hold], [0.66, BK.dip], [BK_REL, BK.release], [1.36, BK.follow], [2.1, BK.stand], [3.05, BK.stand], [BK_CATCH, BK.reach], [4.2, BK.hold], [BK_T, BK.hold]], t)
  const g = rig(p, px, 1)
  const hands = (r: Rig): P3 => { const m = mid(r.lHand, r.rHand); return [m[0] + 1.2, m[1] + 0.6, m[2]] }
  const from = hands(rig(BK.release, px, 1)), to = hands(rig(BK.reach, px, 1))
  // hoop: post, board, rim and net
  const post1 = c.V(hx + 4.6, 0, 0), post2 = c.V(hx + 4.6, hy - 1.5, 0)
  shadow(c, hx + 4.6, 0, 5, 0.4)
  capsule(ctx, post1[0], post1[1], post2[0], post2[1], 0.62 * post1[3])
  const bb = [[hx + 3.4, hy - 1.5, -4.2], [hx + 3.4, hy + 5, -4.2], [hx + 3.4, hy + 5, 4.2], [hx + 3.4, hy - 1.5, 4.2]].map((q) => c.V(q[0], q[1], q[2]))
  ctx.beginPath(); bb.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath()
  ctx.fillStyle = 'rgba(5,24,31,.75)'; ctx.fill(); ctx.strokeStyle = 'rgba(196,244,241,.75)'; ctx.lineWidth = 1.3; ctx.stroke()
  const tIn = BK_REL + BK_FLY
  const swish = t > tIn - 0.04 && t < tIn + 0.6 ? Math.sin(((t - tIn + 0.04) / 0.64) * Math.PI) : 0
  const rimPts: P3[] = []
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; rimPts.push([hx + Math.cos(a) * 2.5, hy, Math.sin(a) * 2.5]) }
  const drawRim = (i0: number, i1: number) => { ctx.beginPath(); for (let i = i0; i <= i1; i++) { const q = c.V(...rimPts[i % 16]); i === i0 ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]) } ctx.strokeStyle = 'rgba(2,248,248,.95)'; ctx.lineWidth = 1.8; ctx.stroke() }
  const netLines = () => { for (let i = 0; i < 16; i += 2) { const q = rimPts[i]; line3(c, q, [hx + (q[0] - hx) * (0.55 + swish * 0.25), hy - 3.6 - swish * 0.9, q[2] * (0.55 + swish * 0.25)], 'rgba(2,248,248,.3)', 1) } }
  // the ball: held, shot, through the net, two bounces back into his hands
  let b: P3, spin = 0
  const T_NET = tIn + 0.24
  if (t < BK_REL) b = hands(g)
  else if (t < tIn) { const k = (t - BK_REL) / BK_FLY; b = [lerp(from[0], hx, k), lerp(from[1], hy + 0.3, k) + 5.6 * 4 * k * (1 - k), lerp(from[2], 0, k)]; spin = -k * 9 }
  else if (t < T_NET) { const k = (t - tIn) / 0.24; b = [hx - 0.4 * k, hy + 0.3 - 5 * k * k, 0]; spin = -9 }
  else if (t < BK_CATCH) {
    const u = (t - T_NET) / (BK_CATCH - T_NET)
    const x = lerp(hx - 0.4, to[0], u)
    let y: number
    if (u < 0.2) y = lerp(hy - 4.7, R, (u / 0.2) ** 2)
    else if (u < 0.68) { const v = (u - 0.2) / 0.48; y = R + 11 * 4 * v * (1 - v) }
    else y = R + (to[1] - R) * Math.sin((((u - 0.68) / 0.32) * Math.PI) / 2)
    b = [x, y, lerp(0, to[2], u)]; spin = -9 + u * 14
    if (!c.still) for (const [u0, bx0] of [[0.2, lerp(hx - 0.4, to[0], 0.2)], [0.68, lerp(hx - 0.4, to[0], 0.68)]]) if (u >= u0 && u < u0 + 0.22) { const k = (u - u0) / 0.22; ring(c, bx0, 0, 2 + k * 14, 0.45 * (1 - k)) }
  } else b = hands(g)
  drawRim(8, 16) // far half of the rim
  netLines()
  shadow(c, g.hip[0], 0, 8.5)
  shadow(c, b[0], b[2], 2.6 * (1 - Math.min(0.6, b[1] / 40)), 0.45)
  const parts = rigParts(c, g)
  const B = c.V(...b)
  const held = t < BK_REL || t >= BK_CATCH
  const nearRim = !held && b[0] > hx - 4
  if (!nearRim) parts.push({ z: held ? B[2] + 0.4 : B[2], run: () => ball(ctx, B[0], B[1], R * B[3], 1, spin, 'basketball') })
  paint(parts)
  if (nearRim) ball(ctx, B[0], B[1], R * B[3], 1, spin, 'basketball')
  drawRim(0, 8) // near half, in front of the ball
}

// ---- esports: a player at the desk, keys lifting off as they are pressed ---------------------
const ES = pose(0.2, 1.45, 1.42, 1.38, 1.36, 0.5, 1.02, 0.58, 0.98)
const KEYS = ['W', 'A', 'S', 'D', 'Q', 'E']
const KEY_ORDER = [0, 3, 2, 1, 0, 4, 3, 2, 5, 1]
function esports(c: Ctx) {
  const { ctx } = c
  // eight unhurried presses, then the hands rest for a few seconds
  const beat = 0.9, PRESSES = 8, cyc = PRESSES * beat + 6
  const t = c.still ? 1.3 : c.t
  const tc = t % cyc, round = Math.floor(t / cyc)
  const typing = !c.still && tc < PRESSES * beat
  const n = Math.min(PRESSES - 1, Math.floor(tc / beat)), k = typing ? (tc / beat) % 1 : 1
  const tap = typing ? Math.sin(Math.min(1, k * 2.2) * Math.PI) : 0
  const left = n % 2 === 0
  const p = { ...ES, lean: ES.lean + (c.still ? 0 : Math.sin(c.now / 1300) * 0.025), le: ES.le - (left ? tap * 0.1 : 0), re: ES.re - (left ? 0 : tap * 0.1) }
  const px = -7, yaw = -0.5
  const g = rig(p, px, 1, yaw)
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const at = (x: number, y: number, z: number): P3 => [px + x * cy - z * sy, y, x * sy + z * cy]
  const seatY = g.hip[1] - 1.5, deskY = Math.min(g.lHand[1], g.rHand[1]) - 1.1
  const cap = (a: P3, b: P3, wd: number, alpha = 1) => { const A = c.V(...a), B = c.V(...b); capsule(ctx, A[0], A[1], B[0], B[1], wd * ((A[3] + B[3]) / 2), alpha) }
  const quad = (pts: P3[], fill: string, stroke: string) => { ctx.beginPath(); pts.forEach((q, j) => { const v = c.V(...q); j ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]) }); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.stroke() }
  shadow(c, px + 5, 0, 15, 0.45)
  // chair
  cap(at(-0.2, 0.4, 0), at(-0.2, seatY, 0), 1.1, 0.8)
  cap(at(-2.6, 0.4, 0), at(2.2, 0.4, 0), 0.9, 0.8)
  cap(at(-2.8, seatY, 0), at(3.4, seatY, 0), 1.5)
  cap(at(-3.1, seatY + 1.4, 0), at(-4.2, seatY + 11, 0), 1.5)
  // monitor, turned a little towards us, with the price line running across it
  const mx = 18.5, mz = 5.4, m0 = deskY + 2.6, m1 = deskY + 11.2
  cap(at(mx + 0.4, deskY, 0), at(mx + 0.4, m0, 0), 1)
  const pulse = c.still ? 0.4 : typing ? 1 - k : 0
  quad([at(mx, m0, -mz), at(mx + 0.9, m1, -mz), at(mx + 0.9, m1, mz), at(mx, m0, mz)], `rgba(2,248,248,${0.05 + pulse * 0.05})`, 'rgba(196,244,241,.8)')
  ctx.beginPath()
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, yy = 0.5 + Math.sin(u * 7 + t * 2.4) * 0.16 + Math.sin(u * 17 - t * 3.1) * 0.07
    const v = c.V(...at(mx + 0.9 * yy, lerp(m0, m1, yy), lerp(-mz + 0.7, mz - 0.7, u)))
    i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])
  }
  ctx.strokeStyle = 'rgba(2,248,248,.85)'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.stroke()
  paint(rigParts(c, g))
  // desk and keyboard, in front of the knees
  cap(at(4.5, deskY, 0), at(21, deskY, 0), 0.9)
  cap(at(19.6, deskY, 0), at(19.6, 0.4, 0), 0.9, 0.8)
  cap(at(8.2, deskY + 0.7, 0), at(12.6, deskY + 0.7, 0), 0.7)
  // keys lift off the keyboard on each press and drift up
  if (!c.still) {
    for (let i = 0; i < 2; i++) {
      const j = n - i, age = tc - j * beat, life = 1.5
      if (j < 0 || age < 0 || age > life) continue
      const u = age / life, idx = KEY_ORDER[(round * PRESSES + j) % KEY_ORDER.length]
      const kx = 9 + ((idx * 37) % 9) * 0.45 + Math.sin(u * 3 + idx) * 0.8, ky = deskY + 2 + u * 9.5
      const v = c.V(...at(kx, ky, 0))
      const sz = (1.5 + 0.5 * smooth(u * 4)) * v[3], al = (1 - u) * (1 - u)
      ctx.save(); ctx.translate(v[0], v[1]); ctx.rotate((idx - 2) * 0.06 + u * 0.2 * (idx % 2 ? 1 : -1)); ctx.globalAlpha = al
      ctx.fillStyle = i === 0 ? 'rgba(2,248,248,.16)' : GLASS; ctx.strokeStyle = i === 0 ? 'rgba(196,244,241,.95)' : 'rgba(2,248,248,.7)'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.roundRect(-sz, -sz, sz * 2, sz * 2, sz * 0.36); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#c4f4f1'; ctx.font = `700 ${Math.round(sz * 1.15)}px 'Red Hat Display Variable', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(KEYS[idx], 0, sz * 0.06); ctx.restore()
    }
    if (typing) { const hand = left ? g.lHand : g.rHand; ring(c, hand[0], hand[2], 2 + k * 9, 0.4 * (1 - k)) }
  }
}

// `tall` is how many units of height the scene needs; `at` is where its origin sits across the band (desktop, phone)
const SCENES: Record<Sport, { draw: (c: Ctx) => void; label: string; tall: number; at: [number, number] }> = {
  football: { draw: football, label: 'A footballer running in and striking a ball', tall: 27.5, at: [0.7, 0.7] },
  tennis: { draw: tennis, label: 'A tennis player returning a ball over the net', tall: 33, at: [0.7, 0.7] },
  basketball: { draw: basketball, label: 'A basketball player making a jump shot', tall: 36.5, at: [0.7, 0.64] },
  esports: { draw: esports, label: 'A player at a desk, keys lifting off as they are pressed', tall: 23.5, at: [0.66, 0.62] },
}
const heroT = () => { const v = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('ht'); return v == null ? null : +v }

export function SportHero({ sport }: { sport: Sport }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const replay = useRef<() => void>(() => {})
  const calm = useBook((s) => s.calm)
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    const sc = SCENES[sport]
    const fixed = heroT() // ?ht=1.2 holds the scene at one moment, for review screenshots
    const still = fixed == null && (calm || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const text = cv.closest('.hero')?.querySelector<HTMLElement>('.hero-t') ?? null
    let w = 0, h = 0, raf = 0, start = performance.now(), seen = true, out = 0, clear = 0
    const frame = (now: number) => {
      const phone = w < 520
      const gy = Math.round(h * 0.82)
      const S = (gy - (phone ? 8 : 12)) / sc.tall
      const cx = w * sc.at[phone ? 1 : 0]
      const ct = Math.cos(0.2), st = Math.sin(0.2)
      const V: View = (x, y, z) => { const y2 = y * ct - z * st, z2 = y * st + z * ct; const s = 150 / (150 - z2); return [cx + x * S * s, gy - y2 * S * s, z2, s * S] }
      // football plays once and waits; a replay fades him out and starts the run again
      if (out && now - out > 260) { start = now; out = 0 }
      const t = fixed ?? Math.max(0, (now - start) / 1000)
      if (sport === 'football' && fixed == null && !still) {
        if (!out && t > FOOTBALL_LOOP) out = now
        GA = out ? Math.max(0, 1 - (now - out) / 240) : Math.min(1, t / 0.3)
      } else GA = 1
      const c: Ctx = { ctx, w, h, now, t, still, V, S, cx, gy, phone, clear }
      ctx.clearRect(0, 0, w, h)
      floor(c)
      sc.draw(c)
      GA = 1
      if (!still && fixed == null && seen) raf = requestAnimationFrame(frame)
    }
    const size = () => {
      const r = cv.parentElement!.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width; h = r.height
      clear = text ? text.getBoundingClientRect().right - r.left + 24 : 0
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (still || fixed != null) frame(performance.now())
    }
    const go = () => { if (still) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame) }
    const ro = new ResizeObserver(size); ro.observe(cv.parentElement!); if (text) ro.observe(text)
    const io = new IntersectionObserver(([e]) => { const was = seen; seen = e.isIntersecting; if (seen && !was) go() }); io.observe(cv)
    const vis = () => { if (!document.hidden && seen) go() }
    document.addEventListener('visibilitychange', vis)
    replay.current = () => { if (sport === 'football' && !out && (performance.now() - start) / 1000 > T_KICK) out = performance.now(); go() }
    const goal = () => replay.current()
    window.addEventListener('hb-goal', goal)
    size(); go()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', vis); window.removeEventListener('hb-goal', goal) }
  }, [calm, sport])
  return (
    <div className="strike" role="img" aria-label={SCENES[sport].label} onClick={() => replay.current()}>
      <canvas ref={ref} />
    </div>
  )
}
