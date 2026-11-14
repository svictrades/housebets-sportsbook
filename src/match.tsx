// The Match page: scoreboard, your bets on the match, market tabs, market groups and the price-history watchlist.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CaretDown, CaretLeft, CaretUp, Check, Lock, MagnifyingGlass, SoccerBall, X } from '@phosphor-icons/react'
import { Link } from 'wouter'
import { fmt, MatchS, Mkt, money, Sel, useBook } from './book'
import { Bet, cashValue, matchName, minuteLabel, useApp } from './store'
import { COMPS, PLAYERS, SPORTS, TABS, TEAMS } from './data'
import { useGo, Crest, cx, Digit, Elapsed, Empty, LiveDot, OddsCell, reduced, StarIcon, Tabs, Tideline, useIsPhone, Usdt, valueAt, Serve, TennisPlate } from './ui'
import { OpenBet } from './slip'

import { useQuery } from './pages'

// ---- Match page -------------------------------------------------------------
function Watchlist({ mk, m }: { mk: Mkt; m: MatchS }) {
  const sels = useBook((s) => s.sels)
  const bets = useApp((s) => s.bets)
  const [cur, setCur] = useState<number | null>(null)
  const phone = useIsPhone()
  const live = m.live && m.fx.sport === 'football'
  const x0 = live ? 0 : m.x - 30
  const span = Math.max(0.001, m.x - x0)
  const marks = live ? m.goals.map((g) => g.m) : []
  const gaps = m.gapStart != null ? [...m.gaps, [m.gapStart, m.x] as [number, number]] : m.gaps
  const list = mk.selIds.map((id) => sels[id])
  // where a minute sits across the line: the same mapping the line uses (2px lead-in, 8px kept for the end dot)
  const at = (x: number) => `calc(2px + (100% - 10px) * ${Math.min(1, Math.max(0, (x - x0) / span)).toFixed(4)})`
  // the line, with a small mark at the minute the player placed an open bet on this outcome
  const line = (s: Sel, h: number) => (
    <div className="mt-line" key={s.id}>
      <Tideline pts={s.hist} h={h} x0={x0} xNow={m.x} gaps={gaps} marks={marks} minSpan={s.open * 0.08} cursor={cur} onScrub={setCur} />
      {bets.filter((b) => b.status === 'open' && b.selId === s.id && b.placedX >= x0 && b.placedX <= m.x).map((b) => (
        <i key={b.id} className="mt-entry" style={{ left: at(b.placedX) }} role="img" aria-label={`Your bet, placed at ${fmt(b.odds)}`} />
      ))}
    </div>
  )
  const when = cur == null ? null : live ? `at ${Math.floor(cur)}'` : m.x - cur < 1 ? 'now' : `${Math.round(m.x - cur)} min ago`
  const hint = live ? 'Price history since kick-off' : 'Price history, last 30 minutes'
  if (phone)
    return (
      <div className="wl-p">
        <div className={cx('mr', list.length === 2 && 'two')}>{list.map((s) => <OddsCell key={s.id} id={s.id} label={s.name} variant="stack" />)}</div>
        <div className={cx('mr hist', list.length === 2 && 'two')}>{list.map((s) => line(s, 28))}</div>
        <div className="meta hintline">{cur != null ? <span className="readout d">{live ? `${Math.floor(cur)}'` : when} · {list.map((s) => `${s.name} ${fmt(valueAt(s.hist, cur))}`).join(' · ')}</span> : hint}</div>
      </div>
    )
  return (
    <div className="wl-d">
      <div className="wl-top meta">{hint}</div>
      {list.map((s) => (
        <div className="wl" key={s.id}>
          <b>{s.name}</b>
          <span className="meta">{when ?? 'opened'} <span className="d">{fmt(cur != null ? valueAt(s.hist, cur) : s.open)}</span></span>
          {line(s, 38)}
          <OddsCell id={s.id} />
        </div>
      ))}
      <div className="wl axr"><i /><i />
        <div className="ax micro">
          <span style={{ left: 0 }}>{live ? 'KO' : '30 min ago'}</span>
          {marks.filter((g) => g > 6 && g < m.x - 6).map((g, i) => <span key={i} style={{ left: at(g), transform: 'translateX(-50%)' }}>Goal {Math.floor(g)}'</span>)}
          <span style={{ right: 0 }}>{live ? minuteLabel(m) : 'Now'}</span>
        </div>
        <i />
      </div>
    </div>
  )
}
// a selection the score has already decided: it stays on the page with its result, but is no longer on sale
function Done({ sel, label }: { sel: Sel; label?: boolean }) {
  return (
    <span className={cx('cell done', label && 'wide', sel.settled)} role="status" aria-label={`${sel.name}, settled, ${sel.settled}`}>
      {label && <span className="l">{sel.name}</span>}
      <span className="pill">{sel.settled === 'won' ? <><Check size={12} weight="bold" /> Won</> : 'Lost'}</span>
    </span>
  )
}
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']
// which team a goalscorer outcome belongs to (0 home, 1 away, -1 not a player). The key carries it: p0… / p1… on
// generated squads; Arsenal v Brighton uses the hand-written PLAYERS table, keyed by its index (see data.ts).
const sideOf = (s: Sel, m: MatchS) => {
  const k = /^p(\d+)$/.exec(s.key)
  if (!k) return -1
  if (m.id === 'ars-bha') { const p = PLAYERS[+k[1]]; return !p ? -1 : p.team === m.fx.home ? 0 : 1 }
  return k[1].length === 2 && k[1][0] < '2' ? +k[1][0] : -1
}
// the short note beside a market name: how the bet settles, never a count of keys the player can see
function noteOf(mk: Mkt, players: number) {
  if (mk.note === 'Over / Under') return ''
  if (mk.note === 'Handicap line') return mk.lines?.some((l) => l.endsWith('.0')) ? 'Whole lines: stake back on a tie' : ''
  const g = mk.note?.match(/^Goal (\d)$/)
  if (g) return `${ORD[+g[1]]} goal of the match`
  if (mk.note) return mk.note
  return players ? `${players} players` : ''
}
function MarketGroup({ mk, m, q, startOpen }: { mk: Mkt; m: MatchS; q: string; startOpen: boolean }) {
  const sels = useBook((s) => s.sels)
  const slip = useApp((s) => s.slip)
  // the player's slip selections in this market
  const picked = slip.map((i) => sels[i.selId]).filter((s) => s && s.mk === mk.id)
  const [open, setOpen] = useState(startOpen)
  // a line market opens on the line that holds the player's selection
  const [line, setLine] = useState(() => { const l = picked.find((s) => s.line)?.line; return l && mk.lines?.includes(l) ? l : mk.defLine })
  const [more, setMore] = useState(false)
  useEffect(() => { if (q) setOpen(true) }, [q])
  // after a goal the line on offer moves with the score
  const def = useRef(mk.defLine)
  useEffect(() => { if (def.current !== mk.defLine) { def.current = mk.defLine; setLine(mk.defLine) } }, [mk.defLine])
  const allDone = mk.selIds.every((id) => sels[id].settled)
  const over = m.period === 'FT'
  const hl = (t: string) => {
    if (!q) return t
    const i = t.toLowerCase().indexOf(q.toLowerCase())
    return i < 0 ? t : <>{t.slice(0, i)}<mark>{t.slice(i, i + q.length)}</mark>{t.slice(i + q.length)}</>
  }
  let ids = mk.selIds
  if (mk.kind === 'line') ids = ids.filter((id) => sels[id].line === line)
  if (mk.kind === 'list' && q) { const f = ids.filter((id) => sels[id].name.toLowerCase().includes(q.toLowerCase())); if (f.length) ids = f }
  if (mk.kind === 'list') ids = [...ids.filter((id) => !sels[id].settled), ...ids.filter((id) => sels[id].settled)]
  // goalscorer lists are grouped by team; short lists are shown whole
  const players = mk.kind === 'list' && mk.selIds.some((id) => sideOf(sels[id], m) >= 0)
  const fold = mk.kind === 'list' && !more && !q && ids.length > (players ? 6 : 12)
  const teams = ([0, 1] as const).map((k) => ids.filter((id) => sideOf(sels[id], m) === k)).map((t) => (fold ? t.slice(0, 3) : t))
  const rest = ids.filter((id) => sideOf(sels[id], m) < 0)
  const shown = players ? [...teams[0], ...teams[1], ...rest] : fold ? ids.slice(0, 6) : ids
  const lineDone = (l: string) => mk.selIds.every((id) => sels[id].line !== l || sels[id].settled)
  const row = (id: string) => <div className="pl" key={id}><span>{hl(sels[id].name)}</span>{sels[id].settled ? <Done sel={sels[id]} /> : <OddsCell id={id} />}</div>
  const note = noteOf(mk, players ? mk.selIds.filter((id) => sideOf(sels[id], m) >= 0).length : 0)
  return (
    <section className={cx('mk', open && 'open', mk.sus && 'sus', allDone && 'alldone')}>
      <h2 className="mt-h">
        <button className="mh" aria-expanded={open} onClick={() => setOpen(!open)}>
          <b>{hl(mk.name)}</b>
          {mk.closed ? <span className="meta susr">{!over && <><Lock size={14} /><span>Closed · {mk.sus?.reason}</span></>}</span>
            // a match-wide pause gives its reason and timer once, on the board; a single market gives its own here
            : mk.sus ? <span className="meta susr"><Lock size={14} /><span>{m.pause ? 'Suspended' : <>Suspended · {mk.sus.reason}<Elapsed until={mk.sus.until} sep /></>}</span></span>
            : !open && picked.length ? <span className="meta"><span className="mt-inslip">In slip<span className="only-d"> · {picked.map((s) => s.name).join(', ')}</span></span></span>
            : <span className="meta">{allDone ? 'Settled' : note}</span>}
          <CaretUp className="chev" size={16} />
        </button>
      </h2>
      <div className="mb" inert={!open}><div>
        {mk.key === 'main' ? <Watchlist mk={mk} m={m} /> : (
          <>
            {mk.kind === 'line' && (
              <div className="lines">{mk.lines!.map((l) => (
                <button key={l} className={cx('chip', l === line && 'on', lineDone(l) && 'dn')} aria-pressed={l === line} onClick={() => setLine(l)}>
                  {l}{picked.some((s) => s.line === l) && <i className="mt-dot" role="img" aria-label="in your slip" />}{lineDone(l) && !mk.closed && <small>settled</small>}
                </button>
              ))}</div>
            )}
            {mk.kind === 'list' ? (
              <div className={cx('plist', players && 'mt-teams')}>
                {players ? (
                  <>
                    {teams.map((t, k) => t.length > 0 && (
                      <div className="mt-team" key={k}>
                        <div className="mt-th micro"><Crest id={k ? m.fx.away : m.fx.home} size={16} />{TEAMS[k ? m.fx.away : m.fx.home].short}</div>
                        {t.map(row)}
                      </div>
                    ))}
                    {rest.map(row)}
                  </>
                ) : shown.map(row)}
                {fold && <button className="showmore" onClick={() => setMore(true)}>Show {ids.length - shown.length} more</button>}
              </div>
            ) : (
              <div className={cx('grid', ids.length === 2 ? 'two' : 'three')}>{ids.map((id) => sels[id].settled ? <Done key={id} sel={sels[id]} label /> : <OddsCell key={id} id={id} label={sels[id].name} variant="wide" />)}</div>
            )}
          </>
        )}
      </div></div>
    </section>
  )
}

// Your open bets on this match, kept small so the markets stay near the top of the page.
// The tickets are always in the page and open with the same collapse as a market, so nothing below jumps.
function YourBets({ bets, phone }: { bets: Bet[]; phone: boolean }) {
  const [open, setOpen] = useState(false)
  const sels = useBook((s) => s.sels)
  const mkts = useBook((s) => s.mkts)
  const m = useBook((s) => s.matches[bets[0].matchId])
  const lull = useBook((s) => s.lull)
  const live = bets.filter((b) => b.status === 'open')
  // cash out exists only in play, on markets that offer it; before kick-off the bar says what the bets return
  const offered = m.live && !lull ? live.filter((b) => mkts[sels[b.selId].mk].cashout && !mkts[sels[b.selId].mk].closed) : []
  const free = offered.filter((b) => !mkts[sels[b.selId].mk].sus)
  const paused = offered.length > 0 && (!!m.pause || !free.length)
  const value = free.reduce((a, b) => a + cashValue(b, sels[b.selId].price), 0)
  const back = live.reduce((a, b) => a + b.stake * b.odds, 0)
  const n = `${bets.length} open bet${bets.length > 1 ? 's' : ''}`
  return (
    <div className={cx('yours', open && 'open')}>
      <button className="yr" aria-expanded={open} onClick={() => setOpen(!open)}>
        <b>{n}</b>
        {paused ? <span className="meta mt-yrp"><Lock size={14} /> Cash out paused</span> : (
          <>
            <span className="meta">{offered.length ? 'cash-out value' : 'to return'}</span>
            <b className="d"><Usdt />{money(offered.length ? value : back)}</b>
          </>
        )}
        <CaretDown size={14} className="chev" />
      </button>
      <div className="mt-ybw" inert={!open}><div className="yb">{bets.map((b) => <OpenBet key={b.id} bet={b} wide={!phone} />)}</div></div>
    </div>
  )
}

// short forms players type into market search
const ALIAS: [RegExp, string][] = [[/^corners$/, 'corner'], [/^cards$/, 'card'], [/^btts$/, 'both teams'], [/^o ?(\d.*)$/, 'over $1'], [/^u ?(\d.*)$/, 'under $1'], [/^o\/?u$/, 'over'], [/^dnb$/, 'draw no bet'], [/^ht\/?ft$/, 'half time']]
const alias = (t: string) => { for (const [re, to] of ALIAS) if (re.test(t)) return t.replace(re, to); return t }
// the element that scrolls the page: the main column on desktop, the document on the phone
const scrollerOf = (el: HTMLElement) => {
  let p = el.parentElement
  while (p && p !== document.body && !/(auto|scroll)/.test(getComputedStyle(p).overflowY)) p = p.parentElement
  return p && p !== document.body ? p : null
}

export function Match({ id }: { id: string }) {
  const m = useBook((s) => s.matches[id])
  const mkts = useBook((s) => s.mkts)
  const sels = useBook((s) => s.sels)
  const now = useBook((s) => s.now)
  const started = useBook((s) => s.started)
  const q0 = useQuery()
  const bets = useApp((s) => s.bets)
  const follow = useApp((s) => s.follow)
  const toggleFollow = useApp((s) => s.toggleFollow)
  const phone = useIsPhone()
  const go = useGo()
  const [tab, setTab] = useState<string>(() => useApp.getState().matchTab ?? q0.get('tab') ?? 'Popular')
  useEffect(() => { if (useApp.getState().matchTab) useApp.getState().set({ matchTab: null }) }, [])
  const [q, setQ] = useState('')
  const [find, setFind] = useState(false)
  const [stuck, setStuck] = useState(false)
  const board = useRef<HTMLDivElement>(null)
  const pin = useRef<HTMLDivElement>(null) // where the tab row rests in the page
  const stick = useRef<HTMLDivElement>(null)
  const findBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!board.current) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 0 })
    io.observe(board.current)
    return () => io.disconnect()
  }, [id])
  // the browser tab names the match
  const title = m ? `${TEAMS[m.fx.home].name} v ${TEAMS[m.fx.away].name}` : ''
  useEffect(() => {
    if (!title) return
    const was = document.title
    document.title = `${title} · Housebets`
    return () => { document.title = was }
  }, [title])
  // changing tab while the tab row is pinned: bring the new list up to the row instead of leaving the player mid-page
  const lastTab = useRef(tab)
  useLayoutEffect(() => {
    if (lastTab.current === tab) return
    lastTab.current = tab
    const a = pin.current, s = stick.current
    if (!a || !s) return
    const sc = scrollerOf(a)
    const d = a.getBoundingClientRect().top - (sc ? sc.getBoundingClientRect().top : 0) - (parseFloat(getComputedStyle(s).top) || 0)
    if (d < -1) (sc ?? window).scrollBy({ top: d, behavior: 'auto' })
  }, [tab])
  // closing market search hands focus back to the button that opened it
  const hadFind = useRef(false)
  useEffect(() => {
    if (hadFind.current && !find) findBtn.current?.focus()
    hadFind.current = find
  }, [find])
  const list = useMemo(() => Object.values(mkts).filter((k) => k.match === id), [mkts, id])
  if (!m) return <div className="page"><Empty title="Match not found"><Link href="/" className="lnk">Back to Sports home</Link></Empty></div>
  // a tab row only when the match has more than one group of markets; search only when there is enough to search
  const cats = TABS.filter((t) => list.some((k) => k.tabs.includes(t)))
  const showTabs = cats.length > 1
  const showFind = list.length >= 8
  const tabs = [...cats.map((t) => ({ id: t as string, label: t as string, n: list.filter((k) => k.tabs.includes(t)).length })), { id: 'All markets', label: 'All markets', n: list.length }]
  const ql = alias(q.trim().toLowerCase())
  const searching = ql.length > 1
  const shown = searching ? list.filter((k) => k.name.toLowerCase().includes(ql) || k.selIds.some((s) => sels[s].name.toLowerCase().includes(ql))) : !showTabs || tab === 'All markets' ? list : list.filter((k) => k.tabs.includes(tab))
  const mine = bets.filter((b) => b.matchId === id && (b.status === 'open' || (b.cashedAt && Date.now() - b.cashedAt < 4500)))
  const c = COMPS[m.fx.comp]
  const fb = m.fx.sport === 'football'
  const running = m.live && fb && m.period !== 'HT' && m.period !== 'FT'
  const clock = running ? `${String(Math.floor(m.sec / 60)).padStart(2, '0')}:${String(Math.floor(m.sec % 60)).padStart(2, '0')}` : ''
  const over = m.period === 'FT'
  const side = (t: string, i: 0 | 1) => {
    const on = follow.includes(`t:${t}`)
    const goals = fb ? m.goals.filter((g) => g.side === i) : []
    return (
      <div className={cx('sb-team', i ? 'away' : 'home')}>
        <Crest id={t} size={phone ? 34 : 46} />
        <div className="sb-n">
          <span className="mt-nm">
            <span className="n">{phone ? TEAMS[t].short : <><span className="nf">{TEAMS[t].name}</span><span className="ns">{TEAMS[t].short}</span></>}</span>
            <Serve m={m} side={i} />
            <button className={cx('sb-star', on && 'on')} aria-pressed={on} aria-label={`${on ? 'Unfollow' : 'Follow'} ${TEAMS[t].name}`} title={on ? 'Following' : 'Follow team'} onClick={() => toggleFollow(`t:${t}`, TEAMS[t].name)}><StarIcon on={on} size={16} /></button>
          </span>
          {fb && m.live && <span className="sb-g d">{goals.length > 0 && <SoccerBall size={12} weight="fill" />}{goals.map((g, k) => <i key={k}>{Math.max(1, Math.floor(g.m))}'</i>)}</span>}
        </div>
      </div>
    )
  }
  const left = m.fx.inMin != null ? m.fx.inMin - Math.floor((now - started) / 60000) : null
  const mf = follow.includes(`m:${id}`)
  const back = fb ? '/football' : `/sport/${m.fx.sport}`
  const sport = SPORTS.find((s) => s.id === m.fx.sport)!.name
  const toComp = () => go(`${back}?comp=${c.id}`)
  const closeFind = () => { setQ(''); setFind(false) }
  // a goal check, a penalty check or the goal itself: said once, in the row the board already has, so nothing below moves
  const goalMsg = m.pause?.reason.startsWith('Goal ·') ? m.pause.reason.replace(' · repricing', '') : ''
  // the pause itself carries no end time: its markets do, and the board counts down to the last of them
  const pauseUntil = m.pause ? Math.max(0, ...list.map((k) => (k.sus && !k.closed && k.sus.until) || 0)) : 0
  const field = (
    <label className="search field">
      <MagnifyingGlass size={20} />
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); closeFind() } }} placeholder="Search markets or players" aria-label="Search markets or players" />
      {searching && <em className="tag mt-count" aria-live="polite">{shown.length} market{shown.length === 1 ? '' : 's'}</em>}
      <button aria-label="Close search" onClick={closeFind}><X size={16} /></button>
    </label>
  )
  const mini = (
    <div className="mt-mini" inert={!stuck}><div>
      <button className="mini-score" onClick={() => board.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'end' })}><b>{TEAMS[m.fx.home].short}{m.live ? ` ${m.score[0]}–${m.score[1]} ` : ' v '}{TEAMS[m.fx.away].short}</b>{m.live && <span><LiveDot still /> <span className="d">{minuteLabel(m)}</span></span>}</button>
    </div></div>
  )
  return (
    <div className="page match">
      <h1 className="mt-vh">{title}</h1>
      <div className="crumbs">
        <Link href={back} className="ib" aria-label={`Back to ${sport}`}><CaretLeft size={18} /></Link>
        <span className="only-d"><Link href={back}>{sport}</Link> › {!c.country.startsWith('Sample') && <>{c.country} › </>}<button onClick={toComp}>{c.name}</button> › <b>{matchName(m)}</b></span>
        <button className="only-p mt-comp" onClick={toComp}>{c.name}</button>
        <span className="cr-r">
          {phone && showFind && <button ref={findBtn} className={cx('ib', find && 'on')} aria-label="Search markets or players" aria-pressed={find} onClick={() => { setFind(!find); setQ('') }}><MagnifyingGlass size={18} /></button>}
          <button className={cx('fm', mf && 'on')} aria-pressed={mf} aria-label={mf ? 'Unfollow match' : 'Follow match'} onClick={() => toggleFollow(`m:${id}`, matchName(m))}><StarIcon on={mf} size={16} /><span className="only-d">{mf ? 'Following match' : 'Follow match'}</span></button>
        </span>
      </div>
      <div className={cx('board', m.live && !over && 'live', !!m.note && 'goal')} ref={board}>
        <div className="sb-k micro only-d">{c.name}</div>
        <div className="sb">
          {side(m.fx.home, 0)}
          <div className="sb-mid">
            {m.live && m.sets && m.pts ? <TennisPlate m={m} full /> : m.live ? (
              <div className="sb-score d" aria-label={`${TEAMS[m.fx.home].short} ${m.score[0]}, ${TEAMS[m.fx.away].short} ${m.score[1]}`}>
                <span className={cx(m.score[0] < m.score[1] && 'lo')}><Digit v={m.score[0]} /></span>
                <span className={cx(m.score[1] < m.score[0] && 'lo')}><Digit v={m.score[1]} /></span>
              </div>
            ) : (
              <div className="sb-ko d">{m.fx.time}</div>
            )}
            {m.pause && goalMsg ? (
              <div className="sb-live mt-goal"><b>{goalMsg}</b></div>
            ) : m.pause ? (
              <div className="sb-live mt-sus"><Lock size={14} /><b><span className="only-d">Suspended · </span>{m.pause.reason}</b><Elapsed until={pauseUntil || undefined} /></div>
            ) : m.live ? (
              <div className={cx('sb-live', (m.period === 'HT' || over) && 'idle')}>
                {over ? <b>Full time</b> : m.period === 'HT' ? <><LiveDot still /><b>Half time</b></> : <><span className="lv"><LiveDot />Live</span><b className="d">{clock || m.period}</b></>}
              </div>
            ) : (
              <div className="sb-live idle"><b>{m.fx.day}</b>{left != null && left < 60 && <em>{left > 0 ? `in ${left} min` : 'kicking off'}</em>}</div>
            )}
          </div>
          {side(m.fx.away, 1)}
        </div>
        <span className="mt-vh" role="status">{m.pause ? goalMsg || `Suspended, ${m.pause.reason}` : ''}</span>
      </div>
      {over && <div className="banner" role="status"><Lock size={16} /> <span>Full time · every market on this match is closed and bets are settled</span></div>}
      {mine.length > 0 && <YourBets bets={mine} phone={phone} />}
      {phone && find && showFind && field}
      <div ref={pin} />
      <div ref={stick} className={cx('stick', stuck && 'on', !showTabs && !showFind && 'bare')}>
        {phone && mini}
        {!phone && find && showFind ? field : showTabs ? <Tabs label="Markets" items={tabs} value={searching ? '' : tab} onChange={(t) => { setTab(t); setQ('') }} /> : !phone && showFind && <i className="mt-fill" />}
        {!phone && mini}
        {!phone && showFind && !find && <button ref={findBtn} className="ib mt-find" aria-label="Search markets or players" onClick={() => setFind(true)}><MagnifyingGlass size={18} /></button>}
      </div>
      <div role={showTabs && !searching ? 'tabpanel' : undefined} aria-label={showTabs && !searching ? tab : undefined}>
        {shown.length ? shown.map((k, i) => <MarketGroup key={k.id + tab} mk={k} m={m} q={searching ? ql : ''} startOpen={!showTabs || tab !== 'All markets' ? i < 5 : i < 1} />) : (
          <Empty title={`No markets match “${q}”`}>Try <button className="lnk" onClick={() => setQ('corners')}>corners</button> · <button className="lnk" onClick={closeFind}>Close search</button></Empty>
        )}
      </div>
    </div>
  )
}
