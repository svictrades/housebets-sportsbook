// The sample odds engine: seeded prices, a random walk on live markets, suspensions and scripted match events.
import { create } from 'zustand'
import { dcPrice, dnbPrice, FB_END, fitLam, FIXTURES, Fixture, footballMarkets, ladder, marketsFor, seedState, SEED_GAPS, SEED_GOALS, SEED_HIST, TEAMS } from './data'
export { ladder }

export type Sel = {
  id: string; mk: string; match: string; key: string; name: string; line?: string
  price: number; open: number; dir: -1 | 0 | 1; movedAt: number; hist: [number, number][]
  settled?: 'won' | 'lost' // decided by the score: shown with a pill, no longer on sale
}
export type Mkt = {
  id: string; match: string; key: string; name: string; tabs: string[]; kind: 'row' | 'list' | 'line'
  selIds: string[]; lines?: string[]; defLine?: string; note?: string; cashout?: boolean
  sus?: { reason: string; since: number; until?: number }
  closed?: boolean // closed rather than paused: full time, or a market pulled by the trader
}
export type MatchS = {
  id: string; fx: Fixture; live: boolean; sec: number; period: string; score: [number, number]; sets?: string
  pts?: [number, number]; srv?: 0 | 1 // tennis: points in the current game and who serves
  x: number; goals: { m: number; side: 0 | 1 }[]; gaps: [number, number][]; gapStart?: number
  pause?: { reason: string; since: number }; note?: { text: string; until: number }
  lam?: [number, number]; lamAt?: number // football goal model: expected goals still to come, and the minute they were fitted at
  htUntil?: number
}
type Book = {
  sels: Record<string, Sel>; mkts: Record<string, Mkt>; matches: Record<string, MatchS>
  now: number; started: number; speed: number; calm: boolean; lull: boolean
  set: (p: Partial<Book>) => void
}

// seeded PRNG so every visitor sees the same opening story
function mulberry(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r() + 1e-9)) * Math.cos(2 * Math.PI * r())
export const minuteOf = (m: MatchS) => Math.floor(m.sec / 60)
export const isFootballClock = (m: MatchS) => m.fx.sport === 'football' && m.live

function seed(): Pick<Book, 'sels' | 'mkts' | 'matches'> {
  const sels: Record<string, Sel> = {}
  const mkts: Record<string, Mkt> = {}
  const matches: Record<string, MatchS> = {}
  const now = Date.now()
  FIXTURES.forEach((fx, fi) => {
    const rnd = mulberry(1000 + fi * 77)
    const live = !!fx.live
    const x = live && fx.sport === 'football' ? fx.live!.sec / 60 : 30
    matches[fx.id] = {
      id: fx.id, fx, live, sec: fx.live?.sec ?? 0, period: fx.live?.period ?? '', score: fx.live?.score ?? [0, 0], sets: fx.live?.sets, pts: fx.live?.pts, srv: fx.live?.srv,
      x, goals: SEED_GOALS[fx.id] ?? [], gaps: SEED_GAPS[fx.id] ?? [],
    }
    if (fx.sport === 'football') { const st = seedState(fx); matches[fx.id].lam = fitLam(fx, st); matches[fx.id].lamAt = st.min }
    for (const d of marketsFor(fx)) {
      const mid = `${fx.id}:${d.key}`
      mkts[mid] = { id: mid, match: fx.id, key: d.key, name: d.name, tabs: d.tabs, kind: d.kind, selIds: d.sels.map((s) => `${mid}:${s.key}`), lines: d.lines, defLine: d.defLine, note: d.note, cashout: d.cashout }
      for (const s of d.sels) {
        const id = `${mid}:${s.key}`
        let hist: [number, number][] = SEED_HIST[id] ?? []
        if (!hist.length) {
          // walk backwards from the current price to make a plausible past
          const n = d.key === 'main' ? 12 : 3
          let p = s.price
          const pts: [number, number][] = [[x, p]]
          for (let i = 1; i <= n; i++) {
            p = ladder(p * (1 + gauss(rnd) * (live ? 0.035 : 0.012)))
            pts.unshift([x - (x * i) / n, p])
          }
          hist = pts
        }
        sels[id] = { id, mk: mid, match: fx.id, key: s.key, name: s.name, line: s.line, price: s.price, open: hist[0][1], dir: 0, movedAt: 0, hist }
      }
    }
  })
  // one row is suspended when the page loads, so the state is visible without any setup
  for (const k of Object.keys(mkts)) if (mkts[k].match === 'new-eve') mkts[k] = { ...mkts[k], sus: { reason: 'Goal check', since: now - 4000, until: now + 22000 } }
  matches['new-eve'] = { ...matches['new-eve'], pause: { reason: 'Goal check', since: now - 4000 }, gapStart: matches['new-eve'].x }
  // a couple of prices show a recent move on first paint
  const mark = (id: string, dir: -1 | 1) => (sels[id] = { ...sels[id], dir, movedAt: now - 1500 })
  mark('ars-bha:main:d', 1); mark('avl-ful:main:h', -1); mark('dor-rbl:main:h', 1)
  return { sels, mkts, matches }
}

export const useBook = create<Book>((set) => ({ ...seed(), now: Date.now(), started: Date.now(), speed: 1, calm: false, lull: false, set: (p) => set(p) }))
const G = useBook.getState
const S = useBook.setState

function walkInto(sels: Record<string, Sel>, mk: Mkt, m: MatchS, sigma: number, now: number, bias?: (s: Sel) => number) {
  const groups: Record<string, Sel[]> = {}
  for (const id of mk.selIds) if (!sels[id].settled) (groups[sels[id].line ?? '_'] ??= []).push(sels[id])
  for (const g of Object.values(groups)) {
    if (g.length < 2) continue
    const inv = g.map((s) => 1 / s.price)
    const sum = inv.reduce((a, b) => a + b, 0)
    const lg = inv.map((p, i) => Math.log(p / Math.max(1e-6, sum - p)) + gauss(Math.random) * sigma + (bias ? bias(g[i]) : 0))
    const np = lg.map((l) => 1 / (1 + Math.exp(-l)))
    const ns = np.reduce((a, b) => a + b, 0)
    g.forEach((s, i) => {
      const price = ladder(1 / ((np[i] / ns) * sum))
      if (price !== s.price) sels[s.id] = { ...s, price, dir: price > s.price ? 1 : -1, movedAt: now, hist: [...s.hist.slice(-90), [m.x, price]] }
    })
  }
}

// Double chance and Draw no bet are read off the Match result prices, so they are derived, never walked
const DERIVED = new Set(['dc', 'dnb'])
function derive(sels: Record<string, Sel>, m: MatchS, now: number) {
  if (m.fx.sport !== 'football') return
  const o = ['h', 'd', 'a'].map((k) => sels[`${m.id}:main:${k}`]?.price)
  if (o.some((x) => !x)) return
  const put = (id: string, price: number) => {
    const s = sels[id]
    if (s && !s.settled && s.price !== price) sels[id] = { ...s, price, dir: price > s.price ? 1 : -1, movedAt: now, hist: [...s.hist.slice(-90), [m.x, price]] }
  }
  put(`${m.id}:dc:hd`, dcPrice(o[0], o[1], o[2])); put(`${m.id}:dc:ha`, dcPrice(o[0], o[2], o[1])); put(`${m.id}:dc:da`, dcPrice(o[1], o[2], o[0]))
  put(`${m.id}:dnb:h`, dnbPrice(o[0], o[2])); put(`${m.id}:dnb:a`, dnbPrice(o[2], o[0]))
}
// Run the goal model again for one football match. Decided selections are marked settled; with `prices` the
// open ones also step to their new price and fresh lines are added. Returns the ids that settled.
function remodel(sels: Record<string, Sel>, mkts: Record<string, Mkt>, m: MatchS, now: number, prices: boolean): string[] {
  if (m.fx.sport !== 'football' || !m.lam) return []
  const min = Math.min(FB_END, m.sec / 60)
  const k = m.period === 'FT' ? 0 : Math.max(0, FB_END - min) / Math.max(1, FB_END - (m.lamAt ?? 0))
  const prev: Record<string, string[]> = {}
  for (const id of Object.keys(mkts)) if (mkts[id].match === m.id) prev[mkts[id].key] = mkts[id].selIds.map((s) => sels[s].key)
  const done: string[] = []
  for (const d of footballMarkets(m.fx, { score: m.score, min, goals: m.goals }, [m.lam[0] * k, m.lam[1] * k], prev)) {
    const mid = `${m.id}:${d.key}`
    const mk = mkts[mid]
    if (!mk) continue
    const ids = [...mk.selIds]
    for (const s of d.sels) {
      const id = `${mid}:${s.key}`
      const old = sels[id]
      if (!old || !ids.includes(id)) {
        if (prices && !s.settled) { sels[id] = { id, mk: mid, match: m.id, key: s.key, name: s.name, line: s.line, price: s.price, open: s.price, dir: 0, movedAt: 0, hist: [[m.x, s.price]] }; ids.push(id) }
      } else if (old.settled) continue
      else if (s.settled) { sels[id] = { ...old, settled: s.settled, dir: 0 }; done.push(id) }
      else if (prices && s.price !== old.price) sels[id] = { ...old, price: s.price, dir: s.price > old.price ? 1 : -1, movedAt: now, hist: [...old.hist.slice(-90), [m.x, s.price]] }
    }
    const lines = d.lines?.filter((l) => ids.some((id) => sels[id].line === l))
    const open = (l?: string) => !!l && ids.some((id) => sels[id].line === l && !sels[id].settled)
    const defLine = prices ? (open(d.defLine) ? d.defLine : mk.defLine) : open(mk.defLine) ? mk.defLine : open(d.defLine) ? d.defLine : mk.defLine
    mkts[mid] = { ...mk, selIds: ids, lines: lines ?? mk.lines, defLine, note: d.note ?? mk.note }
  }
  return done
}
const settledEvent = (ids: string[]) => ids.length && window.dispatchEvent(new CustomEvent('hb-settled', { detail: { ids } }))
const HT_MS = 30000

let listMain: string[] = []
let listAll: string[] = []
let listPre: string[] = []
function index() {
  const { mkts, matches } = G()
  listMain = []; listAll = []; listPre = []
  for (const k of Object.keys(mkts)) {
    const live = matches[mkts[k].match].live
    if (DERIVED.has(mkts[k].key) && matches[mkts[k].match].fx.sport === 'football') continue
    if (live) { listAll.push(k); if (mkts[k].key === 'main') listMain.push(k) } else if (mkts[k].key === 'main') listPre.push(k)
  }
}
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

// One tennis point. Games and sets follow the real rules; a point that would end the match goes the other way,
// so a sample match never finishes under a reviewer, and the rally stops at 6-6 in a set nobody is allowed to close.
function tennisPoint(m: MatchS, sels: Record<string, Sel>): MatchS {
  const sets = m.sets!.split(' ').map((x) => x.split('-').map(Number))
  const cur = sets[sets.length - 1]
  const ph = 1 / (sels[`${m.id}:main:h`]?.price ?? 2), pa = 1 / (sels[`${m.id}:main:a`]?.price ?? 2)
  let w: 0 | 1 = Math.random() < ph / (ph + pa) + (m.srv === 0 ? 0.08 : -0.08) ? 0 : 1
  const wouldWinGame = (k: 0 | 1, p: number[]) => (p[k] === 3 && p[1 - k] < 3) || p[k] === 4
  const wouldWinSet = (k: 0 | 1) => cur[k] + 1 >= 6 && cur[k] + 1 - cur[1 - k] >= 2
  const p = [...m.pts!] as [number, number]
  if (wouldWinGame(w, p) && wouldWinSet(w) && m.score[w] + 1 >= 2) {
    if (cur[0] >= 6 && cur[1] >= 6) return m
    w = (1 - w) as 0 | 1
  }
  const l = (1 - w) as 0 | 1
  if (!wouldWinGame(w, p)) {
    if (p[w] < 3) p[w]++
    else if (p[l] === 4) p[l] = 3
    else p[w] = 4
    return { ...m, pts: p }
  }
  cur[w]++
  const score: [number, number] = [...m.score]
  let period = m.period
  if (cur[w] >= 6 && cur[w] - cur[l] >= 2) { score[w]++; sets.push([0, 0]); period = `Set ${sets.length}` }
  return { ...m, pts: [0, 0], srv: ((m.srv ?? 0) === 0 ? 1 : 0), sets: sets.map((x) => x.join('-')).join(' '), score, period }
}

export function tick() {
  const st = G()
  if (document.hidden) return
  if (!listAll.length) index()
  const now = Date.now()
  const matches = { ...st.matches }
  const ended: string[] = []
  const halves: string[] = []
  for (const id of Object.keys(matches)) {
    const m = matches[id]
    let n = m
    if (m.live && m.fx.sport === 'football' && m.period === 'HT') {
      // half time is a short break, then the second half kicks off
      if (!m.htUntil) n = { ...m, htUntil: now + HT_MS }
      else if (now >= m.htUntil) n = { ...m, period: '2nd half', htUntil: undefined }
    } else if (m.live && m.fx.sport === 'football' && m.period !== 'FT') {
      let sec = m.sec + st.speed
      let period = m.period
      if (sec >= FB_END * 60) { sec = FB_END * 60; period = 'FT'; ended.push(id) }
      else if (m.period === '1st half' && sec >= 45 * 60) { sec = 45 * 60; period = 'HT'; halves.push(id) }
      n = { ...m, sec, period, x: sec / 60 }
    } else if (!(m.live && m.fx.sport === 'football')) n = { ...m, x: 30 + (now - st.started) / 60000 }
    if (n.live && n.pts && n.sets && !n.pause && Math.random() < 0.07 * st.speed) n = tennisPoint(n, st.sels)
    if (n.note && n.note.until < now) n = { ...n, note: undefined }
    matches[id] = n
  }
  let mkts = st.mkts
  const sels = { ...st.sels }
  // half time settles the first-half markets; full time settles everything and closes the book on that match
  let done: string[] = []
  if (halves.length || ended.length) {
    mkts = { ...mkts }
    for (const id of [...halves, ...ended]) done = done.concat(remodel(sels, mkts, matches[id], now, false))
    for (const id of ended) {
      for (const k of Object.keys(mkts)) if (mkts[k].match === id) mkts[k] = { ...mkts[k], closed: true, sus: { reason: 'Full time', since: now } }
      const m = matches[id]
      matches[id] = { ...m, pause: undefined, gaps: m.gapStart != null ? [...m.gaps, [m.gapStart, m.x]] : m.gaps, gapStart: undefined }
    }
  }
  // timed suspensions end
  const reopen: Record<string, 1> = {}
  for (const k of Object.keys(mkts)) {
    const u = mkts[k].sus?.until
    if (u && u <= now) {
      if (mkts === st.mkts) mkts = { ...mkts }
      mkts[k] = { ...mkts[k], sus: undefined, closed: undefined }
      if (!DERIVED.has(mkts[k].key)) walkInto(sels, mkts[k], matches[mkts[k].match], 0.06, now)
      if (mkts[k].key === 'main') derive(sels, matches[mkts[k].match], now)
      reopen[mkts[k].match] = 1
    }
  }
  for (const id of Object.keys(reopen)) {
    const m = matches[id]
    if (m.pause && !Object.values(mkts).some((k) => k.match === id && k.sus)) matches[id] = { ...m, pause: undefined, gaps: m.gapStart != null ? [...m.gaps, [m.gapStart, m.x]] : m.gaps, gapStart: undefined }
  }
  // ordinary price movement
  const move = (id: string | undefined, sigma: number) => {
    if (!id) return
    const mk = mkts[id]
    const m = matches[mk.match]
    if (mk.sus || mk.closed || m.period === 'FT' || now - sels[mk.selIds[0]].movedAt < 3000) return
    walkInto(sels, mk, m, sigma, now)
    if (mk.key === 'main') derive(sels, m, now)
  }
  if (Math.random() < 0.42) move(pick(Math.random() < 0.45 ? listMain : listAll), 0.05)
  if (Math.random() < 0.15) move(pick(listAll), 0.05)
  if (Math.random() < 0.12) move(pick(listPre), 0.025)
  S({ matches, mkts, sels, now })
  settledEvent(done)
}

export function suspendMarket(id: string, reason: string, ms?: number) {
  const now = Date.now()
  const mk = G().mkts[id]
  if (!mk || mk.sus) return
  S({ mkts: { ...G().mkts, [id]: { ...mk, sus: { reason, since: now, until: ms ? now + ms : undefined } } } })
}
// the trader pulls one market: it reads Closed, takes no stakes, and comes back after `ms`
export function closeMarket(id: string, reason: string, ms: number) {
  const now = Date.now()
  const mk = G().mkts[id]
  if (!mk || mk.closed) return
  S({ mkts: { ...G().mkts, [id]: { ...mk, closed: true, sus: { reason, since: now, until: now + ms } } } })
}
export function suspendMatch(matchId: string, reason: string, ms?: number) {
  const now = Date.now()
  const st = G()
  const mkts = { ...st.mkts }
  const m = st.matches[matchId]
  if (!m || m.period === 'FT') return
  for (const k of Object.keys(mkts)) if (mkts[k].match === matchId && !mkts[k].closed) mkts[k] = { ...mkts[k], sus: { reason, since: now, until: ms ? now + ms : undefined } }
  S({ mkts, matches: { ...st.matches, [matchId]: { ...m, pause: { reason, since: now }, gapStart: m.gapStart ?? m.x } } })
}
export function reopenMatch(matchId: string, sigma = 0.07, bias?: (s: Sel) => number) {
  const now = Date.now()
  const st = G()
  const mkts = { ...st.mkts }
  const sels = { ...st.sels }
  const m = st.matches[matchId]
  if (m.period === 'FT') return
  for (const k of Object.keys(mkts)) if (mkts[k].match === matchId && !mkts[k].closed) { mkts[k] = { ...mkts[k], sus: undefined }; if (!DERIVED.has(mkts[k].key) || m.fx.sport !== 'football') walkInto(sels, mkts[k], m, sigma, now, mkts[k].key === 'main' ? bias : undefined) }
  derive(sels, m, now)
  S({ mkts, sels, matches: { ...st.matches, [matchId]: { ...m, pause: undefined, gaps: m.gapStart != null ? [...m.gaps, [m.gapStart, m.x]] : m.gaps, gapStart: undefined } } })
}
// A goal: the match pauses, the score lands, then the whole page reprices from the goal model in one step.
// Match result moves first; Double chance, Draw no bet, the goal lines and the scorer lists all follow from it,
// and anything the new score has decided is settled instead of staying on sale.
export function scoreGoal(matchId: string, side: 0 | 1) {
  const m0 = G().matches[matchId]
  if (!m0 || m0.pause || !m0.live || m0.period === 'FT') return
  suspendMatch(matchId, 'Possible goal')
  setTimeout(() => {
    const st = G()
    const m = st.matches[matchId]
    const score: [number, number] = [m.score[0] + (side === 0 ? 1 : 0), m.score[1] + (side === 1 ? 1 : 0)]
    const team = TEAMS[side === 0 ? m.fx.home : m.fx.away].short
    const min = m.period === 'HT' ? 45 : minuteOf(m)
    const text = `Goal · ${team} · ${min}'`
    S({ matches: { ...st.matches, [matchId]: { ...m, score, goals: [...m.goals, { m: m.x, side }], pause: { reason: `${text} · repricing`, since: m.pause?.since ?? Date.now() }, note: { text, until: Date.now() + 12000 } } } })
    window.dispatchEvent(new CustomEvent('hb-goal', { detail: { matchId, text: `Goal · ${TEAMS[m.fx.home].short} ${score[0]}–${score[1]} ${TEAMS[m.fx.away].short} · ${min}'` } }))
    setTimeout(() => {
      const now = Date.now()
      const s2 = G()
      const mm = s2.matches[matchId]
      if (mm.period === 'FT') return
      const mkts = { ...s2.mkts }
      const sels = { ...s2.sels }
      const done = remodel(sels, mkts, mm, now, true)
      for (const k of Object.keys(mkts)) if (mkts[k].match === matchId && !mkts[k].closed) mkts[k] = { ...mkts[k], sus: undefined }
      S({ mkts, sels, matches: { ...s2.matches, [matchId]: { ...mm, pause: undefined, gaps: mm.gapStart != null ? [...mm.gaps, [mm.gapStart, mm.x]] : mm.gaps, gapStart: undefined } } })
      settledEvent(done)
    }, 2000)
  }, 1500)
}
export function shorten(selId: string, pct = 0.07) {
  const st = G()
  const s = st.sels[selId]
  if (!s) return
  let price = ladder(s.price * (1 - pct))
  if (price === s.price) price = ladder(s.price - 0.02)
  const m = st.matches[s.match]
  const sels = { ...st.sels, [selId]: { ...s, price, dir: -1 as const, movedAt: Date.now(), hist: [...s.hist, [m.x, price] as [number, number]] } }
  if (s.key && s.mk.endsWith(':main')) derive(sels, m, Date.now())
  S({ sels })
}
// One clock for the whole book: it reads 16:16 when the page loads and runs on from there, so kick-off times,
// "in 14 min" and the Placed time on a new bet always agree with each other.
export function bookClock(withSec = false, at = Date.now()) {
  const t = (16 * 3600 + 16 * 60 + Math.max(0, Math.floor((at - G().started) / 1000))) % 86400
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(t / 3600))}:${p(Math.floor(t / 60) % 60)}${withSec ? ':' + p(t % 60) : ''}`
}
export const fmt = (n: number) => n.toFixed(2)
export const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
