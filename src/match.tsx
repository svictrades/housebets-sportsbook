// The Match page: scoreboard, your bets on the match, market tabs, market groups and the price-history watchlist.
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { CaretDown, CaretLeft, CaretUp, Check, Lock, MagnifyingGlass, SoccerBall, Star, X } from '@phosphor-icons/react'
import { Link } from 'wouter'
import { fmt, MatchS, Mkt, money, Sel, useBook } from './book'
import { Bet, cashValue, matchName, minuteLabel, useApp } from './store'
import { COMPS, SPORTS, TABS, TEAMS } from './data'
import { useGo, Crest, cx, Elapsed, Empty, LiveDot, OddsCell, Tabs, Tideline, useIsPhone, Usdt, valueAt, Serve, TennisPlate } from './ui'
import { OpenBet } from './slip'

import { useQuery } from './pages'

// ---- Match page -------------------------------------------------------------
function Watchlist({ mk, m }: { mk: Mkt; m: MatchS }) {
  const sels = useBook((s) => s.sels)
  const [cur, setCur] = useState<number | null>(null)
  const phone = useIsPhone()
  const live = m.live && m.fx.sport === 'football'
  const x0 = live ? 0 : m.x - 30
  const marks = live ? m.goals.map((g) => g.m) : []
  const gaps = m.gapStart != null ? [...m.gaps, [m.gapStart, m.x] as [number, number]] : m.gaps
  const list = mk.selIds.map((id) => sels[id])
  const line = (id: string, h: number) => {
    const s = sels[id]
    return <Tideline pts={s.hist} h={h} x0={x0} xNow={m.x} gaps={gaps} marks={marks} end={s.dir} minSpan={s.open * 0.08} cursor={cur} onScrub={setCur} />
  }
  const pct = (x: number) => `${Math.min(100, Math.max(0, ((x - x0) / (m.x - x0)) * 100))}%`
  const axis = (
    <div className="ax micro">
      <span style={{ left: 0 }}>{live ? 'KO' : '30 min ago'}</span>
      {marks.filter((g) => g > 6 && g < m.x - 6).map((g, i) => <span key={i} style={{ left: pct(g), transform: 'translateX(-50%)' }}>Goal {Math.floor(g)}'</span>)}
      <span style={{ right: 0 }}>{live ? minuteLabel(m) : 'Now'}</span>
    </div>
  )
  const readout = cur != null && (
    <div className="readout d" aria-live="off">{live ? `${Math.floor(cur)}'` : 'Then'} · {list.map((s) => `${s.name} ${fmt(valueAt(s.hist, cur))}`).join(' · ')}</div>
  )
  if (phone)
    return (
      <div className="wl-p">
        <div className={cx('mr', list.length === 2 && 'two')}>{list.map((s) => <OddsCell key={s.id} id={s.id} label={s.name} variant="stack" />)}</div>
        <div className={cx('mr hist', list.length === 2 && 'two')}>{list.map((s) => <div key={s.id}>{line(s.id, 20)}</div>)}</div>
        {axis}
        <div className="meta hintline">{readout || 'Price history since ' + (live ? 'kick-off' : '30 minutes ago') + ' · drag to read'}</div>
      </div>
    )
  return (
    <div className="wl-d">
      <div className="wl-top meta">{readout || <>Price history since {live ? 'kick-off' : '30 minutes ago'} · hover to read a past minute</>}</div>
      {list.map((s) => (
        <div className="wl" key={s.id}>
          <b>{s.name}</b>
          <span className="meta">opened <span className="d">{fmt(s.open)}</span></span>
          {line(s.id, 38)}
          <OddsCell id={s.id} />
        </div>
      ))}
      <div className="wl axr"><i /><i />{axis}<i /></div>
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
function MarketGroup({ mk, m, q, startOpen }: { mk: Mkt; m: MatchS; q: string; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen)
  const [line, setLine] = useState(mk.defLine)
  const [more, setMore] = useState(false)
  const sels = useBook((s) => s.sels)
  useEffect(() => { if (q) setOpen(true) }, [q])
  // after a goal the line on offer moves with the score
  useEffect(() => { setLine(mk.defLine) }, [mk.defLine])
  const allDone = mk.selIds.every((id) => sels[id].settled)
  const hl = (t: string) => {
    if (!q) return t
    const i = t.toLowerCase().indexOf(q.toLowerCase())
    return i < 0 ? t : <>{t.slice(0, i)}<mark>{t.slice(i, i + q.length)}</mark>{t.slice(i + q.length)}</>
  }
  let ids = mk.selIds
  if (mk.kind === 'line') ids = ids.filter((id) => sels[id].line === line)
  if (mk.kind === 'list' && q) { const f = ids.filter((id) => sels[id].name.toLowerCase().includes(q.toLowerCase())); if (f.length) ids = f }
  if (mk.kind === 'list') ids = [...ids.filter((id) => !sels[id].settled), ...ids.filter((id) => sels[id].settled)]
  const shown = mk.kind === 'list' && !more && !q ? ids.slice(0, 6) : ids
  const lineDone = (l: string) => mk.selIds.every((id) => sels[id].line !== l || sels[id].settled)
  return (
    <section className={cx('mk', open && 'open', mk.sus && 'sus', allDone && 'alldone')}>
      <button className="mh" aria-expanded={open} onClick={() => setOpen(!open)}>
        <b>{hl(mk.name)}</b>
        {mk.closed ? <span className="meta susr"><Lock size={14} /> Closed · {mk.sus?.reason}</span>
          : mk.sus ? <span className="meta susr"><Lock size={14} /> Suspended · {mk.sus.reason} · <Elapsed since={mk.sus.since} /></span>
          : allDone ? <span className="meta">Settled</span>
          : <span className="meta">{mk.note ?? (mk.kind === 'line' ? 'Over / Under' : `${mk.kind === 'list' ? mk.selIds.length : ids.length} outcomes`)}</span>}
        <CaretUp className="chev" size={16} />
      </button>
      <div className="mb"><div>
        {mk.key === 'main' ? <Watchlist mk={mk} m={m} /> : (
          <>
            {mk.kind === 'line' && <div className="lines">{mk.lines!.map((l) => <button key={l} className={cx('chip', l === line && 'on', lineDone(l) && 'dn')} aria-pressed={l === line} onClick={() => setLine(l)}>{l}{lineDone(l) && <small>settled</small>}</button>)}</div>}
            {mk.kind === 'list' ? (
              <div className="plist">{shown.map((id) => <div className="pl" key={id}><span>{hl(sels[id].name)}</span>{sels[id].settled ? <Done sel={sels[id]} /> : <OddsCell id={id} />}</div>)}
                {!more && !q && ids.length > 6 && <button className="showmore" onClick={() => setMore(true)}>Show {ids.length - 6} more</button>}</div>
            ) : (
              <div className={cx('grid', ids.length === 2 ? 'two' : 'three')}>{ids.map((id) => sels[id].settled ? <Done key={id} sel={sels[id]} label /> : <OddsCell key={id} id={id} label={sels[id].name} variant="wide" />)}</div>
            )}
          </>
        )}
      </div></div>
    </section>
  )
}

// Your open bets on this match, kept small so the markets stay near the top of the page
function YourBets({ bets, phone }: { bets: Bet[]; phone: boolean }) {
  const [open, setOpen] = useState(false)
  const sels = useBook((s) => s.sels)
  const mkts = useBook((s) => s.mkts)
  const live = bets.filter((b) => b.status === 'open')
  const offered = live.filter((b) => mkts[sels[b.selId].mk].cashout && !mkts[sels[b.selId].mk].closed)
  const value = offered.reduce((a, b) => a + cashValue(b, sels[b.selId].price), 0)
  const back = live.reduce((a, b) => a + b.stake * b.odds, 0)
  const n = `${bets.length} open bet${bets.length > 1 ? 's' : ''}`
  if (phone || !phone)
    return (
      <div className={cx('yours', open && 'open')}>
        <button className="yr" aria-expanded={open} onClick={() => setOpen(!open)}>
          <b>{n}</b>
          <span className="meta">{offered.length ? 'cash-out value' : 'to return'}</span>
          <b className="d"><Usdt />{money(offered.length ? value : back)}</b>
          <CaretDown size={14} className="chev" />
        </button>
        {open && <div className="yb">{bets.map((b) => <OpenBet key={b.id} bet={b} wide={!phone} />)}</div>}
      </div>
    )
  return (
    <div className="yours">
      <div className="micro sub yh"><span>Your bets on this match</span>{bets.length > 1 && <button onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Show one' : `+${bets.length - 1} more`}</button>}</div>
      {(open ? bets : bets.slice(0, 1)).map((b) => <OpenBet key={b.id} bet={b} wide />)}
    </div>
  )
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
  useEffect(() => {
    if (!board.current) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 0 })
    io.observe(board.current)
    return () => io.disconnect()
  }, [id])
  const list = useMemo(() => Object.values(mkts).filter((k) => k.match === id), [mkts, id])
  if (!m) return <div className="page"><Empty title="Match not found"><Link href="/" className="lnk">Back to Sports home</Link></Empty></div>
  const tabs = [...TABS.filter((t) => list.some((k) => k.tabs.includes(t))).map((t) => ({ id: t as string, label: t as string, n: list.filter((k) => k.tabs.includes(t)).length })), { id: 'All markets', label: 'All markets', n: list.length }]
  const ql = q.trim().toLowerCase()
  const shown = ql.length > 1 ? list.filter((k) => k.name.toLowerCase().includes(ql) || k.selIds.some((s) => sels[s].name.toLowerCase().includes(ql))) : tab === 'All markets' ? list : list.filter((k) => k.tabs.includes(tab))
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
          <span className="n">{phone ? TEAMS[t].short : <><span className="nf">{TEAMS[t].name}</span><span className="ns">{TEAMS[t].short}</span></>}</span>
          <Serve m={m} side={i} />
          <button className={cx('sb-star', on && 'on')} aria-pressed={on} aria-label={`${on ? 'Unfollow' : 'Follow'} ${TEAMS[t].name}`} title={on ? 'Following' : 'Follow team'} onClick={() => toggleFollow(`t:${t}`, TEAMS[t].name)}><Star key={+on} size={16} weight={on ? 'fill' : 'regular'} /></button>
          {fb && m.live && <span className="sb-g d">{goals.length > 0 && <SoccerBall size={12} weight="fill" />}{goals.map((g, k) => <i key={k}>{Math.max(1, Math.floor(g.m))}'</i>)}</span>}
        </div>
      </div>
    )
  }
  const left = m.fx.inMin != null ? m.fx.inMin - Math.floor((now - started) / 60000) : null
  const mf = follow.includes(`m:${id}`)
  const back = fb ? '/football' : `/sport/${m.fx.sport}`
  const field = (
    <label className="search field"><MagnifyingGlass size={20} /><input autoFocus={phone} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search markets or players" aria-label="Search markets or players" />{(q || phone) && <button aria-label="Clear search" onClick={() => { setQ(''); setFind(false) }}><X size={16} /></button>}</label>
  )
  return (
    <div className="page match">
      <div className="crumbs">
        <Link href={back} className="ib" aria-label="Back"><CaretLeft size={18} /></Link>
        <span className="only-d"><Link href={back}>{SPORTS.find((s) => s.id === m.fx.sport)!.name}</Link> › {c.country} › <button onClick={() => go(`${back}?comp=${c.id}`)}>{c.name}</button> › <b>{matchName(m)}</b></span>
        <span className="only-p chip big">{TEAMS[m.fx.home].short} – {TEAMS[m.fx.away].short}</span>
        <span className="cr-r">
          <button className={cx('ib only-p', find && 'on')} aria-label="Search markets or players" aria-pressed={find} onClick={() => { setFind(!find); setQ('') }}><MagnifyingGlass size={18} /></button>
          <button className={cx('fm', mf && 'on')} aria-pressed={mf} aria-label={mf ? 'Unfollow match' : 'Follow match'} onClick={() => toggleFollow(`m:${id}`, matchName(m))}><Star key={+mf} size={16} weight={mf ? 'fill' : 'regular'} /><span className="only-d">{mf ? 'Following match' : 'Follow match'}</span></button>
        </span>
      </div>
      <div className={cx('board', m.live && !over && 'live', !!m.note && 'goal')} ref={board}>
        <div className="sb-k micro">{c.name}{fb && ' · Matchday 12'}</div>
        <div className="sb">
          {side(m.fx.home, 0)}
          <div className="sb-mid">
            {m.live && m.sets && m.pts ? <TennisPlate m={m} full /> : m.live ? (
              <div className="sb-score d" aria-label={`${TEAMS[m.fx.home].short} ${m.score[0]}, ${TEAMS[m.fx.away].short} ${m.score[1]}`}>
                <span className={cx(m.score[0] < m.score[1] && 'lo')}><b key={m.score[0]} className="land">{m.score[0]}</b></span>
                <span className={cx(m.score[1] < m.score[0] && 'lo')}><b key={m.score[1]} className="land">{m.score[1]}</b></span>
              </div>
            ) : (
              <div className="sb-ko d">{m.fx.time}</div>
            )}
            {m.live ? (
              <div className={cx('sb-live', (m.period === 'HT' || over) && 'idle')}>
                {over ? <b>Full time</b> : m.period === 'HT' ? <><LiveDot still /><b>Half time</b></> : <><span className="lv"><LiveDot />Live</span><b className="d">{clock || m.period}</b>{clock && <em className="per">{m.period}</em>}</>}
              </div>
            ) : (
              <div className="sb-live idle"><b>{m.fx.day}</b>{left != null && left < 60 && <em>{left > 0 ? `in ${left} min` : 'kicking off'}</em>}</div>
            )}
          </div>
          {side(m.fx.away, 1)}
        </div>
      </div>
      {m.pause && <div className={cx('banner', m.pause.reason.startsWith('Goal ·') && 'goal')} role="status"><Lock size={16} /> <span>{m.pause.reason.startsWith('Goal ·') ? m.pause.reason : `Suspended · ${m.pause.reason}`}</span><Elapsed since={m.pause.since} /></div>}
      {over && <div className="banner" role="status"><Lock size={16} /> <span>Full time · every market on this match is closed and bets are settled</span></div>}
      {mine.length > 0 && <YourBets bets={mine} phone={phone} />}
      {(!phone || find) && field}
      <div className={cx('stick', stuck && 'on')}>
        {stuck && <button className="mini-score" onClick={() => board.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}><b>{TEAMS[m.fx.home].short}{m.live ? ` ${m.score[0]}–${m.score[1]} ` : ' v '}{TEAMS[m.fx.away].short}</b>{m.live && <span><LiveDot still /> <span className="d">{minuteLabel(m)}</span></span>}</button>}
        <Tabs items={tabs} value={ql.length > 1 ? '' : tab} onChange={(t) => { setTab(t); setQ('') }} />
      </div>
      {shown.length ? shown.map((k, i) => <MarketGroup key={k.id + tab} mk={k} m={m} q={ql.length > 1 ? ql : ''} startOpen={tab !== 'All markets' ? i < 5 : i < 1} />) : (
        <Empty title={`No markets match “${q}”`}>Try <button className="lnk" onClick={() => setQ('corners')}>corners</button> · <button className="lnk" onClick={() => setQ('')}>Clear search</button></Empty>
      )}
    </div>
  )
}
