// The five pages: Sports home, Live, Football, Match, and Bet slip + My bets.
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CaretDown, CaretRight, Info, MagnifyingGlass, SlidersHorizontal, Star, X } from '@phosphor-icons/react'
import { Link, useLocation, useSearch } from 'wouter'
import { fmt, MatchS, minuteOf, useBook } from './book'
import { matchName, useApp } from './store'
import { COMPS, FOOTBALL_COMPS, SPORTS, Sport, TABS, TEAMS } from './data'
import { useGo, Crest, cx, Empty, EventRow, Flag, LiveDot, MarketKey, OddsCell, Plate, rowSels, Status, SusSpan, Tabs, Tideline, useIsPhone, valueAt, Wake } from './ui'
import { MyBets } from './slip'
import { SportHero } from './heroes'

export function useQuery() {
  // the router keeps ?query in the address bar; older deep links may carry it after the hash
  const search = useSearch()
  const [loc] = useLocation()
  return useMemo(() => new URLSearchParams(search || window.location.hash.split('?')[1] || ''), [search, loc])
}
const useMatches = () => {
  const matches = useBook((s) => s.matches)
  const lull = useBook((s) => s.lull)
  return useMemo(() => Object.values(matches).filter((m) => !(lull && m.live)), [matches, lull])
}
const byKick = (a: MatchS, b: MatchS) => (a.fx.inMin ?? 9999) - (b.fx.inMin ?? 9999)

function SearchField({ placeholder }: { placeholder: string }) {
  const set = useApp((s) => s.set)
  return (
    <button className="search" onClick={() => set({ search: true })}>
      <MagnifyingGlass size={20} /><span>{placeholder}</span><kbd>/</kbd>
    </button>
  )
}
function Section({ title, n, right, children, live }: { title: ReactNode; n?: ReactNode; right?: ReactNode; children: ReactNode; live?: boolean }) {
  return (
    <section className="sec">
      <div className="sh">
        <h2 className="h">{live && <LiveDot />}{title}{n != null && <small>{n}</small>}</h2>
        <span className="all">{right}</span>
      </div>
      {children}
    </section>
  )
}
function SportTabs({ active }: { active: string }) {
  const nav = useGo()
  const liveN = useBook((s) => (s.lull ? 0 : Object.values(s.matches).filter((m) => m.live).length))
  const items = [
    { id: 'home', label: 'Home' }, { id: 'live', label: 'Live', n: <em className="lv">{liveN}</em> },
    ...SPORTS.map((s) => ({ id: s.id as string, label: s.name })), { id: 'following', label: <><Star size={14} weight="fill" /> Following</> },
  ]
  return <Tabs className="sports" memo="sports" items={items} value={active} onChange={(id) => nav(id === 'home' ? '/' : id === 'live' ? '/live' : id === 'football' ? '/football' : id === 'following' ? '/football?tab=following' : `/sport/${id}`)} />
}
function NextKick() {
  const matches = useMatches()
  const next = matches.filter((m) => !m.live && m.fx.inMin != null).sort(byKick)[0]
  const started = useBook((s) => s.started)
  const now = useBook((s) => s.now)
  if (!next) return null
  const left = Math.max(0, next.fx.inMin! * 60 - Math.floor((now - started) / 1000))
  return <>Next kick-off: <b>{matchName(next)}</b> · in <span className="d">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span></>
}

function Slate({ id, featured }: { id: string; featured?: boolean }) {
  const m = useBook((s) => s.matches[id])
  const sels = useBook((s) => s.sels)
  const sus = useBook((s) => s.mkts[`${id}:main`]?.sus?.reason)
  const [, nav] = useLocation()
  const { ids, heads } = rowSels(m, 'main')
  let mover = null as null | { name: string; from: number; to: number; pts: [number, number][] }
  if (featured) {
    for (const sid of ids) {
      const s = sels[sid]
      const from = valueAt(s.hist, m.x - 10)
      if (!mover || Math.abs(s.price / from - 1) > Math.abs(mover.to / mover.from - 1)) mover = { name: s.name, from, to: s.price, pts: s.hist }
    }
  }
  return (
    <div className={cx('slate', featured && 'ft')} role="link" tabIndex={0} onClick={() => nav(`/match/${id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/match/${id}`)}>
      <div className="k"><span className="meta">{COMPS[m.fx.comp].name}</span><Status m={m} /></div>
      <div className="sl-t">
        <div><div className="tm"><Crest id={m.fx.home} /><span>{TEAMS[m.fx.home].name}</span></div><div className="tm"><Crest id={m.fx.away} /><span>{TEAMS[m.fx.away].name}</span></div></div>
        {m.live && <Plate m={m} />}
      </div>
      {mover && (
        <div className="mv">
          <div className="mv-t">
            <span className="mv-n">{mover.name}</span>
            <span className="d mv-p">{fmt(mover.from)} <ArrowRight size={11} /> <b>{fmt(mover.to)}</b></span>
            <em className={cx('pc', mover.to >= mover.from ? 'u' : 'dn')}>{mover.to >= mover.from ? '+' : '−'}{Math.abs((mover.to / mover.from - 1) * 100).toFixed(1)}%</em>
          </div>
          <Tideline pts={mover.pts} h={30} x0={m.x - 14} xNow={m.x} end={mover.to >= mover.from ? 1 : -1} />
        </div>
      )}
      <div className={cx('px', ids.length === 2 && 'two')}>{sus ? <SusSpan reason={sus} /> : ids.map((sid, i) => <OddsCell key={sid} id={sid} label={heads[i]} />)}</div>
    </div>
  )
}

export function Home() {
  const q = useQuery()
  const sport = q.get('sport') as Sport | null
  const go = useGo()
  const all = useMatches()
  const follow = useApp((s) => s.follow)
  const toggleFollow = useApp((s) => s.toggleFollow)
  const sels = useBook((s) => s.sels)
  const list = sport ? all.filter((m) => m.fx.sport === sport) : all
  const isMine = (m: MatchS) => follow.includes(`c:${m.fx.comp}`) || follow.includes(`t:${m.fx.home}`) || follow.includes(`t:${m.fx.away}`) || follow.includes(`m:${m.id}`)
  const yoursAll = sport ? [] : all.filter(isMine).sort((a, b) => +b.live - +a.live || byKick(a, b))
  const [more, setMore] = useState(false)
  const yours = more ? yoursAll : yoursAll.slice(0, 3)
  const live = list.filter((m) => m.live && !yours.includes(m))
  const liveTotal = list.filter((m) => m.live).length
  const soon = list.filter((m) => !m.live && m.fx.inMin != null && !yours.includes(m)).sort(byKick).slice(0, 5)
  const featured = useMemo(() => {
    const score = (m: MatchS) => Math.max(...rowSels(m, 'main').ids.map((id) => Math.abs(sels[id].price / valueAt(sels[id].hist, m.x - 10) - 1)))
    // matches already pinned under Your matches are not repeated here
    return all.filter((m) => m.fx.sport === 'football' && (m.live || m.fx.inMin != null) && !yoursAll.slice(0, 3).includes(m)).sort((a, b) => score(b) - score(a)).slice(0, 4).map((m) => m.id)
    // re-rank on a slow beat so slates do not shuffle on every tick
  }, [all.length, Math.floor(Date.now() / 30000)])
  const name = (id: string) => (id[0] === 'c' ? COMPS[id.slice(2)]?.name : id[0] === 't' ? TEAMS[id.slice(2)]?.name : null)
  return (
    <div className="page">
      <SearchField placeholder="Search teams, players, competitions or markets" />
      <SportTabs active={sport ?? 'home'} />
      {sport && <h1 className="title">{SPORTS.find((s) => s.id === sport)!.name} <small>{liveTotal} live</small></h1>}
      {!sport && (
        <div className="fchips">
          <span className="meta">Following</span>
          {follow.filter(name).map((id) => (
            <span className="chip" key={id}>{id[0] === 't' ? <Crest id={id.slice(2)} size={14} /> : <Flag comp={id.slice(2)} />}{name(id)}<button aria-label={`Unfollow ${name(id)}`} onClick={() => toggleFollow(id, name(id)!)}><X size={12} /></button></span>
          ))}
          <button className="lnk" onClick={() => go('/football?tab=following')}>+ Follow more</button>
        </div>
      )}
      {!sport && (
        <Section title="Featured matches" n={<span className="tip">ranked by price moves · last 10 min <Info size={13} /><span className="tt">The four matches whose sample prices moved most.</span></span>}>
          <div className="slates feat">{featured.map((id) => <Slate key={id} id={id} featured />)}</div>
        </Section>
      )}
      {!sport && (
        <Section title="Your matches" n={yoursAll.length} right={yoursAll.length > 3 && <button onClick={() => setMore(!more)}>{more ? 'Show less' : `Show all ${yoursAll.length}`}</button>}>
          {yoursAll.length ? (
            <>
              <div className="only-d">{yours.map((m) => <EventRow key={m.id} id={m.id} />)}</div>
              <div className="only-p slates">{yoursAll.slice(0, 6).map((m) => <Slate key={m.id} id={m.id} />)}</div>
            </>
          ) : <div className="hint meta">Follow a team or competition with ☆ to pin its matches here.</div>}
        </Section>
      )}
      <Section title="Live now" n={liveTotal} live={liveTotal > 0} right={liveTotal > 0 && <Link href="/live">View all <CaretRight size={11} /></Link>}>
        {live.length ? live.slice(0, 4).map((m) => <EventRow key={m.id} id={m.id} showComp />) : liveTotal ? <div className="hint meta">Your live matches are pinned above.</div> : <div className="hint"><b>Nothing in play right now.</b> <span className="meta"><NextKick /></span></div>}
      </Section>
      {!sport && (
        <Section title="Top competitions" right={<Link href="/football">All football <CaretRight size={11} /></Link>}>
          <div className="comps">
            {FOOTBALL_COMPS.map((c) => {
              const ms = all.filter((m) => m.fx.comp === c)
              const lv = ms.filter((m) => m.live).length
              return <button key={c} onClick={() => go(`/football?comp=${c}`)} className="comp"><Flag comp={c} /><span><b>{COMPS[c].name}</b><small>{ms.length} matches{lv ? ` · ${lv} live` : ''}</small></span></button>
            })}
          </div>
        </Section>
      )}
      <Section title="Starting soon">
        {soon.length ? soon.map((m) => <EventRow key={m.id} id={m.id} showComp />) : <div className="hint meta">No more matches today.</div>}
      </Section>
    </div>
  )
}

function Group({ comp, list, market, max = 4 }: { comp: string; list: MatchS[]; market: MarketKey; max?: number }) {
  const [open, setOpen] = useState(false)
  const follow = useApp((s) => s.follow)
  const toggleFollow = useApp((s) => s.toggleFollow)
  const on = follow.includes(`c:${comp}`)
  const lv = list.filter((m) => m.live).length
  const shown = open ? list : list.slice(0, max)
  return (
    <section className="sec grp">
      <div className="sh">
        <h2 className="h"><Flag comp={comp} />{COMPS[comp].name}<small>{list.length}{lv ? ` · ${lv} live` : ''}</small>
          <button className={cx('star', on && 'on')} aria-pressed={on} aria-label={`Follow ${COMPS[comp].name}`} onClick={() => toggleFollow(`c:${comp}`, COMPS[comp].name)}><Star key={+on} size={16} weight={on ? 'fill' : 'regular'} /></button>
        </h2>
        <span className="all">{list.length > max && <button aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Show less' : `View all ${list.length}`}<CaretDown size={11} className={cx("cv", open && "up")} /></button>}</span>
      </div>
      {shown.map((m) => <EventRow key={m.id} id={m.id} market={market} />)}
    </section>
  )
}
const groupBy = (list: MatchS[]) => {
  const g: Record<string, MatchS[]> = {}
  for (const m of list) (g[m.fx.comp] ??= []).push(m)
  return Object.entries(g)
}

export function Live() {
  const all = useMatches()
  const lull = useBook((s) => s.lull)
  const [sport, setSport] = useState<string>('all')
  const [comp, setComp] = useState('all')
  const live = all.filter((m) => m.live)
  const list = live.filter((m) => (sport === 'all' || m.fx.sport === sport) && (comp === 'all' || m.fx.comp === comp))
  const soon = all.filter((m) => !m.live && m.fx.inMin != null && (sport === 'all' || m.fx.sport === sport)).sort(byKick)
  const comps = [...new Set(live.filter((m) => sport === 'all' || m.fx.sport === sport).map((m) => m.fx.comp))]
  return (
    <div className="page">
      <SportTabs active="live" />
      <h1 className="title">Live <small>{live.length} in play</small></h1>
      <div className="filters">
        <button className={cx('chip', sport === 'all' && 'on')} aria-pressed={sport === 'all'} onClick={() => { setSport('all'); setComp('all') }}>All <small>{live.length}</small></button>
        {SPORTS.map((s) => {
          const n = live.filter((m) => m.fx.sport === s.id).length
          const nx = all.filter((m) => !m.live && m.fx.sport === s.id && m.fx.inMin != null).sort(byKick)[0]
          return <button key={s.id} className={cx('chip', sport === s.id && 'on')} aria-pressed={sport === s.id} onClick={() => { setSport(s.id); setComp('all') }}>{s.name} <small>{n || (nx ? `next ${nx.fx.time}` : 0)}</small></button>
        })}
        <label className="chip sel push"><select value={comp} onChange={(e) => setComp(e.target.value)} aria-label="Competition"><option value="all">All competitions</option>{comps.map((c) => <option key={c} value={c}>{COMPS[c].name}</option>)}</select><CaretDown size={12} /></label>
      </div>
      {list.length ? groupBy(list).map(([c, ms]) => <Group key={c} comp={c} list={ms} market="main" max={8} />) : (
        <>
          <Empty title={lull || !live.length ? 'Nothing in play right now' : `No live ${SPORTS.find((s) => s.id === sport)?.name.toLowerCase() ?? 'matches'}`}><NextKick /></Empty>
          <Section title="Starting soon">{soon.slice(0, 8).map((m) => <EventRow key={m.id} id={m.id} showComp />)}</Section>
        </>
      )}
    </div>
  )
}

export function SportPage({ sport = 'football' }: { sport?: Sport }) {
  const all = useMatches().filter((m) => m.fx.sport === sport)
  const sf = useApp((s) => s.sf[sport])
  const setSF = useApp((s) => s.setSF)
  const follow = useApp((s) => s.follow)
  const toggleFollow = useApp((s) => s.toggleFollow)
  const name = SPORTS.find((s) => s.id === sport)!.name
  const comps = Object.values(COMPS).filter((c) => c.sport === sport).map((c) => c.id)
  const tab = (sf?.tab as 'now' | 'all' | 'following') ?? 'now'
  const comp = comps.includes(sf?.comp ?? '') ? sf!.comp : 'all'
  const [market, setMarket] = useState<MarketKey>('main')
  const [sheet, setSheet] = useState(false)
  const go = (p: Record<string, string>) => setSF(sport, p)
  const liveN = all.filter((m) => m.live).length
  const next = all.filter((m) => !m.live && m.fx.inMin != null).sort(byKick)[0]
  const isMine = (m: MatchS) => follow.includes(`c:${m.fx.comp}`) || follow.includes(`t:${m.fx.home}`) || follow.includes(`t:${m.fx.away}`) || follow.includes(`m:${m.id}`)
  const now = all.filter((m) => m.live || m.fx.day === 'Today')
  let list = tab === 'now' ? now : tab === 'following' ? all.filter(isMine) : all
  if (comp !== 'all') list = (tab === 'following' ? list : all).filter((m) => m.fx.comp === comp)
  const groups = groupBy(list).sort((a, b) => comps.indexOf(a[0]) - comps.indexOf(b[0]))
  const clubs = [...new Set(all.flatMap((m) => [m.fx.home, m.fx.away]))]
  const marketSel = sport === 'football' && (
    <label className="chip sel"><span className="meta">Market</span><select value={market} onChange={(e) => setMarket(e.target.value as MarketKey)} aria-label="Market"><option value="main">Match result</option><option value="tg">Total goals 2.5</option><option value="btts">Both teams to score</option></select><CaretDown size={12} /></label>
  )
  const compChips = (
    <div className="filters comps-f">
      <button className={cx('chip', comp === 'all' && 'on')} aria-pressed={comp === 'all'} onClick={() => go({ comp: 'all' })}>All</button>
      {comps.map((c) => <button key={c} className={cx('chip lg', comp === c && 'on')} style={{ ['--c' as string]: COMPS[c].color }} aria-pressed={comp === c} onClick={() => go({ comp: c })}><Flag comp={c} />{COMPS[c].name}</button>)}
    </div>
  )
  return (
    <div className="page football">
      <header className="hero">
        <SportHero sport={sport} />
        <div className="hero-t">
          <h1>{name}</h1>
          <p className="hero-s">
            <span><b className="d">{liveN}</b>{liveN > 0 && <LiveDot />}live now</span>
            <span><b className="d">{now.length - liveN}</b>later today</span>
            {next && <span className="nx"><b className="d">{next.fx.time}</b>{TEAMS[next.fx.home].short} v {TEAMS[next.fx.away].short}</span>}
          </p>
          <GoalCaption />
        </div>
      </header>
      <div className="ctrl">
        <Tabs items={[{ id: 'now', label: 'Live & upcoming', n: now.length }, { id: 'all', label: `All ${name.toLowerCase()}`, n: all.length }, { id: 'following', label: 'Following', n: all.filter(isMine).length }]} value={tab} onChange={(t) => go({ tab: t })} />
        {marketSel && <span className="only-d">{marketSel}</span>}
        <button className="ib only-p" aria-label="Filters" onClick={() => setSheet(true)}><SlidersHorizontal size={20} /></button>
      </div>
      {compChips}
      {groups.length ? groups.map(([c, ms]) => <Group key={c} comp={c} list={ms} market={market} max={comp === 'all' ? 4 : 12} />) : (
        <Empty title={tab === 'following' ? `You’re not following any ${name.toLowerCase()} yet` : 'No matches here'}>{tab === 'following' ? 'Follow a team or competition with ☆ and it will show here.' : <button className="lnk" onClick={() => go({ tab: 'all', comp: 'all' })}>Show all {name.toLowerCase()}</button>}</Empty>
      )}
      {tab === 'following' && (
        <Section title="Follow competitions">
          <div className="clubs">
            {comps.map((c) => { const on = follow.includes(`c:${c}`); return <button key={c} className={cx('club', on && 'on')} aria-pressed={on} onClick={() => toggleFollow(`c:${c}`, COMPS[c].name)}><Flag comp={c} /><span>{COMPS[c].name}</span><Star key={+on} size={16} weight={on ? 'fill' : 'regular'} /></button> })}
          </div>
        </Section>
      )}
      {tab === 'following' && (
        <Section title={sport === 'tennis' ? 'Follow players' : 'Follow teams'}>
          <div className="clubs">
            {clubs.map((t) => { const on = follow.includes(`t:${t}`); return <button key={t} className={cx('club', on && 'on')} aria-pressed={on} onClick={() => toggleFollow(`t:${t}`, TEAMS[t].name)}><Crest id={t} /><span>{TEAMS[t].name}</span><Star key={+on} size={16} weight={on ? 'fill' : 'regular'} /></button> })}
          </div>
        </Section>
      )}
      {sheet && (
        <>
          <div className="scrim" onClick={() => setSheet(false)} />
          <div className="sheet menu" role="dialog" aria-modal="true" aria-label="Filters">
            <button className="grab" aria-label="Close" onClick={() => setSheet(false)} />
            <div className="scroll fsheet">{marketSel && <><div className="micro sub first">Market</div><div className="filters">{marketSel}</div></>}<div className="micro sub">Competition</div>{compChips}<button className="place" onClick={() => setSheet(false)}>Show {list.length} matches</button></div>
          </div>
        </>
      )}
    </div>
  )
}
function GoalCaption() {
  const [t, setT] = useState('')
  useEffect(() => {
    let h = 0
    const f = (e: Event) => { setT((e as CustomEvent).detail.text); clearTimeout(h); h = window.setTimeout(() => setT(''), 6000) }
    window.addEventListener('hb-goal', f)
    return () => { window.removeEventListener('hb-goal', f); clearTimeout(h) }
  }, [])
  return t ? <p className="goalcap">{t}</p> : null
}

export { Section }
export function Bets() {
  const phone = useIsPhone()
  const set = useApp((s) => s.set)
  const n = useApp((s) => s.bets.filter((b) => b.status === 'open').length)
  const total = useApp((s) => s.bets.length)
  useEffect(() => { if (phone) set({ sheet: 'bets' }) }, [phone])
  if (phone) return <Home />
  return (
    <div className="page">
      <h1 className="title">My bets <small>{n} open · {total - n} settled</small></h1>
      <MyBets wide />
    </div>
  )
}
export { minuteOf, Wake }
