// Shared building blocks: crest, price, odds cell, price-history line, event rows.
import { ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import NumberFlow from '@number-flow/react'
import { CaretRight, Check, Lock, Star, MagnifyingGlass } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { useBook, MatchS } from './book'
import { useApp, minuteLabel } from './store'
import { COMPS, TEAMS, TENNIS_PTS } from './data'

// navigate, carrying any ?tab= / ?comp= filter into app state (the address bar stays a clean route)
export function useGo() {
  const [, nav] = useLocation()
  return (url: string) => {
    const [path, qs] = url.split('?')
    if (qs) {
      const q = new URLSearchParams(qs)
      const sport = path === '/football' ? 'football' : path.startsWith('/sport/') ? path.slice(7) : null
      if (sport) useApp.getState().setSF(sport, { tab: q.get('tab') ?? 'now', comp: q.get('comp') ?? 'all' })
      if (path.startsWith('/match/') && q.get('tab')) useApp.getState().set({ matchTab: q.get('tab') })
    }
    nav(path)
  }
}
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

export function useIsPhone() {
  const q = '(max-width: 1023px)'
  const [p, setP] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setP(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return p
}
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}
export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Crest({ id, size = 18 }: { id: string; size?: number }) {
  const c = TEAMS[id]?.c ?? ['#888', '#444']
  return (
    <svg className="crest" width={(size * 16) / 18} height={size} viewBox="0 0 16 18" aria-hidden>
      <path d="M1 1h7v16C4 15.500 1 13 1 8.500z" fill={c[0]} />
      <path d="M8 1h7v7.500c0 4.500-3 7-7 8.500z" fill={c[1]} />
      <path d="M1 1h14v7.500c0 4.500-3 7-7 8.500C4 15.500 1 13 1 8.500z" fill="none" stroke="rgba(255,255,255,.22)" />
    </svg>
  )
}
// league identity: a small tile in the competition colour with a two-letter monogram
const MONO: Record<string, string> = { pl: 'PL', ucl: 'CL', laliga: 'LL', seriea: 'SA', bundes: 'BL' }
export function Flag({ comp }: { comp: string }) {
  const c = COMPS[comp]
  const mono = MONO[comp] ?? c.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return <span className="lg-tile" style={{ ['--c' as string]: c.color }} aria-hidden>{mono}</span>
}
export const LiveDot = ({ still }: { still?: boolean }) => <i className={cx('dot', still && 'still')} aria-hidden />
export const Usdt = () => <i className="tether" aria-hidden>₮</i>

export function Price({ value, dir = 0, plain }: { value: number; dir?: number; plain?: boolean }) {
  const calm = useBook((s) => s.calm)
  if (plain || calm || reduced()) return <>{value.toFixed(2)}</>
  return <NumberFlow value={value} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} trend={dir >= 0 ? 1 : -1} />
}
export function Wake({ dir, at }: { dir: number; at: number }) {
  const age = Date.now() - at
  if (!dir || age > 6000) return <i className="wk" />
  return <i key={at} className={cx('wk', dir > 0 ? 'u' : 'dn', 'on')} style={{ animationDelay: `-${age}ms` }} aria-label={dir > 0 ? 'price up' : 'price down'} />
}

export function OddsCell({ id, label, team, variant = 'list' }: { id: string; label?: string; team?: string; variant?: 'list' | 'wide' | 'stack' }) {
  const sel = useBook((s) => s.sels[id])
  const sus = useBook((s) => !!s.mkts[s.sels[id]?.mk]?.sus)
  const on = useApp((s) => s.slip.some((i) => i.selId === id))
  const toggle = useApp((s) => s.toggle)
  if (!sel) return <span className="cell none">—</span>
  // decided by the score: no longer on sale anywhere
  if (sel.settled) return <span className={cx('cell done', variant)}>{label && <span className="l">{label}</span>}<span className="pill">{sel.settled === 'won' ? 'Won' : 'Lost'}</span></span>
  const age = Date.now() - sel.movedAt
  return (
    <button
      className={cx('cell', variant, on && 'sel', sus && 'dim')}
      aria-pressed={on}
      aria-disabled={sus}
      aria-label={`${sel.name}, ${sus ? 'suspended' : sel.price.toFixed(2)}${!sus && sel.dir && age < 6000 ? (sel.dir > 0 ? ', price up' : ', price down') : ''}`}
      onClick={(e) => { e.stopPropagation(); if (!sus) toggle(id) }}
    >
      {label && <span className="l">{team && <Crest id={team} size={11} />}<span>{label}</span></span>}
      <span className="p"><Price value={sel.price} dir={sel.dir} /></span>
      {on && <Check className="ok" size={10} weight="bold" aria-hidden />}
      {!sus && <Wake dir={sel.dir} at={sel.movedAt} />}
      {!sus && sel.dir !== 0 && age < 700 && <i key={sel.movedAt} className={cx('tint', sel.dir > 0 ? 'u' : 'dn')} />}
    </button>
  )
}

// ---- price-history line ---------------------------------------------------
export const valueAt = (pts: [number, number][], x: number) => {
  let v = pts[0][1]
  for (const p of pts) { if (p[0] <= x) v = p[1]; else break }
  return v
}
type TideProps = {
  pts: [number, number][]; h: number; xNow?: number; x0?: number; gaps?: [number, number][]; marks?: number[]
  level?: number | null; levelSolid?: boolean; end?: number; minSpan?: number; cursor?: number | null
  onScrub?: (x: number | null) => void; draw?: boolean; className?: string
}
export function Tideline({ pts, h, xNow, x0, gaps = [], marks = [], level, levelSolid, end = 0, minSpan = 0, cursor, onScrub, draw, className }: TideProps) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const uid = useId().replace(/:/g, '')
  const range = useRef<[number, number] | null>(null)
  let body: ReactNode = null
  if (w > 10 && pts.length) {
    const last = pts[pts.length - 1]
    const all = xNow != null && xNow > last[0] ? [...pts, [xNow, last[1]] as [number, number]] : pts
    const xa = x0 ?? all[0][0]
    const xb = Math.max(xNow ?? last[0], xa + 0.001)
    let lo = Math.min(...all.map((p) => p[1]), level ?? Infinity)
    let hi = Math.max(...all.map((p) => p[1]), level ?? -Infinity)
    if (hi - lo < minSpan) { const mid = (hi + lo) / 2; lo = mid - minSpan / 2; hi = mid + minSpan / 2 }
    const pad = (hi - lo) * 0.16 || 0.01
    lo -= pad; hi += pad
    // the range only widens while the line is mounted, so it never jumps on a tick
    if (range.current) { lo = Math.min(lo, range.current[0]); hi = Math.max(hi, range.current[1]) }
    range.current = [lo, hi]
    const X = (x: number) => 2 + ((Math.max(xa, x) - xa) / (xb - xa)) * (w - 10)
    const Y = (y: number) => h - 2 - ((y - lo) / (hi - lo)) * (h - 4)
    const vis = all.filter((p) => p[0] >= xa)
    if (vis.length < all.length) vis.unshift([xa, valueAt(all, xa)])
    let d = `M${X(vis[0][0]).toFixed(1)} ${Y(vis[0][1]).toFixed(1)}`
    for (let i = 1; i < vis.length; i++) {
      const [x1, y1] = [X(vis[i - 1][0]), Y(vis[i - 1][1])]
      const [x2, y2] = [X(vis[i][0]), Y(vis[i][1])]
      const mx = (x1 + x2) / 2
      d += `C${mx.toFixed(1)} ${y1.toFixed(1)} ${mx.toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
    }
    const ex = X(xb)
    const ey = Y(vis[vis.length - 1][1])
    const col = end > 0 ? 'var(--up)' : end < 0 ? 'var(--down)' : 'var(--cyan)'
    const g = gaps.filter((q) => q[1] > xa)
    body = (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={cx(draw && 'draw')}>
        <defs>
          <linearGradient id={`f${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#02f8f8" stopOpacity=".14" />
            <stop offset="1" stopColor="#02f8f8" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`g${uid}`}>{g.map((q, i) => <rect key={i} x={X(q[0])} y={-4} width={Math.max(2, X(q[1]) - X(q[0]))} height={h + 8} />)}</clipPath>
          <mask id={`m${uid}`}>
            <rect x="-4" y="-4" width={w + 8} height={h + 8} fill="#fff" />
            {g.map((q, i) => <rect key={i} x={X(q[0])} y={-4} width={Math.max(2, X(q[1]) - X(q[0]))} height={h + 8} fill="#000" />)}
          </mask>
        </defs>
        {marks.filter((m) => m > xa).map((m, i) => <line key={i} x1={X(m)} x2={X(m)} y1={0} y2={h} className="tl-mark" />)}
        <g mask={`url(#m${uid})`}>
          <path d={`${d}L${ex} ${h}L${X(vis[0][0])} ${h}Z`} fill={`url(#f${uid})`} className="tl-area" />
          <path d={d} className="tl-line" pathLength={1} />
        </g>
        {g.length > 0 && <path d={d} className="tl-gap" clipPath={`url(#g${uid})`} />}
        {level != null && <line x1={0} x2={w} y1={Y(level)} y2={Y(level)} className={cx('tl-level', levelSolid && 'solid')} />}
        {cursor != null && cursor >= xa && <line x1={X(cursor)} x2={X(cursor)} y1={-6} y2={h + 6} className="tl-cursor" />}
        <circle cx={ex} cy={ey} r={6} fill={col} opacity={0.2} />
        <circle cx={ex} cy={ey} r={2.8} fill={col} />
      </svg>
    )
    if (onScrub) {
      const at = (e: React.PointerEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        onScrub(Math.min(xb, Math.max(xa, xa + ((e.clientX - r.left - 2) / (w - 10)) * (xb - xa))))
      }
      return (
        <div ref={ref} className={cx('tide scrub', className)} style={{ height: h }} onPointerMove={at} onPointerDown={at} onPointerLeave={() => onScrub(null)}>
          {body}
        </div>
      )
    }
  }
  return <div ref={ref} className={cx('tide', className)} style={{ height: h }}>{body}</div>
}

// ---- event rows -----------------------------------------------------------
export type MarketKey = 'main' | 'hc' | 'tot' | 'btts'
// which market on a match answers "handicap" and "total" in each sport
const ROW_MK: Record<string, Record<string, string>> = {
  hc: { football: 'ah', tennis: 'hc', basketball: 'hc', esports: 'hc' },
  tot: { football: 'tg', tennis: 'games', basketball: 'pts', esports: 'maps' },
  btts: { football: 'btts' },
}
export const MARKET_NAMES: Record<string, [MarketKey, string][]> = {
  football: [['main', 'Match result'], ['hc', 'Handicap'], ['tot', 'Total goals'], ['btts', 'Both teams to score']],
  tennis: [['main', 'Match winner'], ['hc', 'Games handicap'], ['tot', 'Total games']],
  basketball: [['main', 'Winner'], ['hc', 'Handicap'], ['tot', 'Total points']],
  esports: [['main', 'Match winner'], ['hc', 'Map handicap'], ['tot', 'Total maps']],
}
// What a row's odds keys say. A key names its outcome in words: the team (with its crest) or "Draw",
// never a bare 1 / X / 2. `codes` is the three-letter form for narrow cards.
export type RowSels = { ids: string[]; heads: string[]; teams: (string | undefined)[]; codes: string[] }
export function rowSels(m: MatchS, key: MarketKey): RowSels {
  const H = m.fx.home, A = m.fx.away
  const code = (t: string) => (m.fx.sport === 'football' ? t.toUpperCase() : TEAMS[t].short)
  const main: RowSels = m.fx.sport !== 'football'
    ? { ids: [`${m.id}:main:h`, `${m.id}:main:a`], heads: [TEAMS[H].short, TEAMS[A].short], teams: [H, A], codes: [code(H), code(A)] }
    : { ids: [`${m.id}:main:h`, `${m.id}:main:d`, `${m.id}:main:a`], heads: [TEAMS[H].short, 'Draw', TEAMS[A].short], teams: [H, undefined, A], codes: [code(H), 'Draw', code(A)] }
  if (key === 'main') return main
  const { mkts, sels } = useBook.getState()
  const mk = mkts[`${m.id}:${ROW_MK[key]?.[m.fx.sport]}`]
  if (!mk) return main
  // a line market shows its main line; the row falls back to the winner market if that line is not a clean pair
  const ids = mk.selIds.filter((id) => sels[id] && (mk.kind !== 'line' || sels[id].line === mk.defLine))
  if (ids.length !== 2) return main
  if (key === 'hc') {
    const line = ids.map((id) => sels[id].name.split(' ').pop()!)
    return { ids, heads: [`${TEAMS[H].short} ${line[0]}`, `${TEAMS[A].short} ${line[1]}`], teams: [H, A], codes: [`${code(H)} ${line[0]}`, `${code(A)} ${line[1]}`] }
  }
  const heads = ids.map((id) => sels[id].name)
  return { ids, heads, teams: [undefined, undefined], codes: heads }
}
export function Heads({ heads }: { heads: string[] }) {
  return <div className={cx('cols micro', heads.length === 2 && 'two')}>{heads.map((h) => <span key={h}>{h}</span>)}</div>
}
export function SusSpan({ reason, until }: { reason: string; until?: number }) {
  const now = useBook((s) => s.now)
  const left = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
  return <div className="cell sus" role="status"><Lock size={14} /> <span>{reason === 'Full time' ? 'Closed · Full time' : `Suspended · ${reason}`}</span>{left > 0 && <span className="d cd">{left}s</span>}</div>
}
export function Status({ m }: { m: MatchS }) {
  const gone = useBook((s) => Math.floor((s.now - s.started) / 60000)) // minutes since the page opened, so kick-offs count down
  const [goal, setGoal] = useState(false)
  const total = m.score[0] + m.score[1]
  const first = useRef(total)
  useEffect(() => {
    if (total === first.current) return
    first.current = total
    setGoal(true)
    const t = setTimeout(() => setGoal(false), 8000)
    return () => clearTimeout(t)
  }, [total])
  if (m.live)
    return (
      <div className="st lv">
        <span className="d min">{goal ? <b className="goal">Goal</b> : minuteLabel(m)}</span>
        <span className="livetag"><LiveDot still={m.period === 'HT' || m.period === 'FT'} />Live</span>
      </div>
    )
  return <div className="st"><b className="d">{m.fx.time}</b><small>{m.fx.inMin != null && m.fx.inMin - gone < 60 ? (m.fx.inMin - gone > 0 ? `in ${m.fx.inMin - gone} min` : 'starting') : m.fx.day}</small></div>
}
// the score, as a small two-line plate: the side in front reads brighter
// Tennis: sets won, games in the current set, points in the current game. `full` adds every set and column heads.
export function TennisPlate({ m, full }: { m: MatchS; full?: boolean }) {
  const sets = m.sets!.split(' ').map((x) => x.split('-').map(Number))
  const cur = sets.length - 1
  const pts = m.pts ?? [0, 0]
  const shown = full ? sets.map((_, i) => i) : [cur]
  const n = 1 + shown.length + 1
  const row = (k: 0 | 1) => (
    <>
      <span className={cx('s', k === 1 && 'r2', m.score[k] > m.score[1 - k] && 'hi')}>{m.score[k]}</span>
      {shown.map((i) => <span key={i} className={cx('g', k === 1 && 'r2', i === cur && 'cur', i !== cur && sets[i][k] < sets[i][1 - k] && 'lo')}>{sets[i][k]}</span>)}
      <span className={cx('p', k === 1 && 'r2')}><b key={pts[k]} className="land">{TENNIS_PTS[pts[k]]}</b></span>
    </>
  )
  return (
    <span className={cx('plate tn d', full && 'full')} style={{ gridTemplateColumns: `repeat(${n}, auto)` }} role="img"
      aria-label={`Sets ${m.score[0]} to ${m.score[1]}, games ${sets[cur][0]} to ${sets[cur][1]}, points ${TENNIS_PTS[pts[0]]} to ${TENNIS_PTS[pts[1]]}`}>
      {full && <><i className="hd">Sets</i>{shown.map((i) => <i key={i} className="hd">{i + 1}</i>)}<i className="hd">Pts</i></>}
      {row(0)}{row(1)}
    </span>
  )
}
export const Serve = ({ m, side }: { m: MatchS; side: 0 | 1 }) => (m.live && m.pts && m.srv === side ? <i className="srv" title="Serving" aria-label="serving" /> : null)
export function Plate({ m }: { m: MatchS }) {
  if (m.sets && m.pts) return <TennisPlate m={m} />
  if (m.sets) return <span className="plate sets d">{m.sets.split(' ').map((s, i) => <span key={i}>{s}</span>)}</span>
  const [a, b] = m.score
  return (
    <span className="plate d" role="img" aria-label={`Score ${a} to ${b}`}>
      <span className={cx(a < b && 'lo', a > b && 'hi')}><b key={a} className="land">{a}</b></span>
      <span className={cx(b < a && 'lo', b > a && 'hi')}><b key={b} className="land">{b}</b></span>
    </span>
  )
}
export function EventRow({ id, market = 'main', showComp }: { id: string; market?: MarketKey; showComp?: boolean }) {
  const m = useBook((s) => s.matches[id])
  const susS = useBook((s) => s.mkts[rowSels(s.matches[id], market).ids[0].split(':').slice(0, 2).join(':')]?.sus)
  const sus = susS?.reason
  const [, nav] = useLocation()
  const follow = useApp((s) => s.follow)
  const toggleFollow = useApp((s) => s.toggleFollow)
  const { ids, heads } = rowSels(m, market)
  const fid = `m:${id}`
  return (
    <div className={cx('row', ids.length === 2 && 'two')} role="link" tabIndex={0} onClick={() => nav(`/match/${id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/match/${id}`)}>
      <Status m={m} />
      <div className="tms">
        {showComp && <div className="meta cmp">{COMPS[m.fx.comp].name}</div>}
        {[m.fx.home, m.fx.away].map((t, ti) => { const on = follow.includes(`t:${t}`); return (
          <div className="tm" key={t}><Crest id={t} /><span>{TEAMS[t].name}</span><Serve m={m} side={ti as 0 | 1} />
            <button className={cx('tstar', on && 'on')} aria-pressed={on} aria-label={`${on ? 'Unfollow' : 'Follow'} ${TEAMS[t].name}`} onClick={(e) => { e.stopPropagation(); toggleFollow(`t:${t}`, TEAMS[t].name) }}><Star key={+on} size={13} weight={on ? 'fill' : 'regular'} /></button>
          </div>) })}
      </div>
      <div className="scs">{m.live && <Plate m={m} />}</div>
      <div className="px">
        {sus ? <SusSpan reason={sus} until={susS?.until} /> : ids.map((sid, i) => <OddsCell key={sid} id={sid} label={heads[i]} />)}
      </div>
      <div className="more">
        <button className="star" aria-label="Follow match" aria-pressed={follow.includes(fid)} onClick={(e) => { e.stopPropagation(); toggleFollow(fid, `${TEAMS[m.fx.home].short} v ${TEAMS[m.fx.away].short}`) }}>
          <Star size={16} weight={follow.includes(fid) ? 'fill' : 'regular'} />
        </button>
        <span className="d" aria-label={`${m.fx.n} more markets`}>+{m.fx.n}</span><CaretRight size={12} />
      </div>
    </div>
  )
}

// The tab highlight: one cyan bar that sits under the active label and slides to the next one.
// `memo` keeps the last position of a named tab set, so the bar also slides when the page changes under it.
const lastBar = new Map<string, { x: number; w: number }>()
export function useTabBar(memo?: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState<{ x: number; w: number } | null>(() => (memo ? lastBar.get(memo) ?? null : null))
  const measure = useRef(() => {})
  measure.current = () => {
    const el = ref.current
    if (!el) return
    const on = el.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!on) return setBar(null)
    const t = on.querySelector<HTMLElement>('.tl') ?? on
    const a = el.getBoundingClientRect(), b = t.getBoundingClientRect()
    const next = { x: Math.round(b.left - a.left + el.scrollLeft), w: Math.round(b.width) }
    if (bar && bar.x === next.x && bar.w === next.w) return
    if (memo) lastBar.set(memo, next)
    setBar(next)
    // keep the active tab inside a scrolling tab row
    const l = on.offsetLeft - 16, r = on.offsetLeft + on.offsetWidth + 16
    if (l < el.scrollLeft) el.scrollLeft = l
    else if (r > el.scrollLeft + el.clientWidth) el.scrollLeft = r - el.clientWidth
  }
  useLayoutEffect(() => measure.current())
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => measure.current())
    if (ref.current) ro.observe(ref.current)
    document.fonts?.ready.then(() => measure.current()).catch(() => {})
    return () => ro.disconnect()
  }, [])
  const node = bar && <i className="tabbar" style={{ width: bar.w, transform: `translateX(${bar.x}px)` }} aria-hidden />
  return [ref, node] as const
}
export function Tabs<T extends string>({ items, value, onChange, className, memo }: { items: { id: T; label: ReactNode; n?: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string; memo?: string }) {
  const [ref, bar] = useTabBar(memo)
  return (
    <div ref={ref} className={cx('tabs', className)} role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === value} className={cx(t.id === value && 'on')} onClick={() => onChange(t.id)}>
          <span className="tl">{t.label}</span>{t.n != null && <small>{t.n}</small>}
        </button>
      ))}
      {bar}
    </div>
  )
}
export const WaveMark = () => (
  <svg className="wavemark" width="48" height="22" viewBox="0 0 48 22" fill="none" aria-hidden>
    <path d="M2 6c6 0 6-4 11-4s6 4 11 4 6-4 11-4 6 4 11 4" pathLength={1} />
    <path d="M2 12c6 0 6-4 11-4s6 4 11 4 6-4 11-4 6 4 11 4" pathLength={1} />
    <path d="M2 18c6 0 6-4 11-4s6 4 11 4 6-4 11-4 6 4 11 4" pathLength={1} />
  </svg>
)
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><WaveMark /><h4>{title}</h4>{children && <div className="meta">{children}</div>}</div>
}
export function Elapsed({ since }: { since: number }) {
  const now = useBook((s) => s.now)
  const s = Math.max(0, Math.floor((now - since) / 1000))
  return <span className="d">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>
}

// Search key: one icon button that opens search, placed in each page's own row of controls.
export function SearchKey() {
  const set = useApp((s) => s.set)
  return <button className="ib skey-i" aria-label="Search teams, players, competitions or markets" title="Search ( / )" onClick={() => set({ search: true, menu: false, sheet: null })}><MagnifyingGlass size={18} /></button>
}
