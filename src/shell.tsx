// The Housebets site shell: top bar, left rail, side panel, phone header, tab bar, slip bar, sheets, Scenes, search, toasts.
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  Basketball, CaretDown, CaretUp, ChatCircle, Crown, GameController, House, List, MagnifyingGlass, Broadcast, Receipt, Sidebar, SidebarSimple,
  SoccerBall, Spade, Star, TennisBall, Trophy, X, Play, UserCircle, SlidersHorizontal, ChartLineUp, SignIn, SignOut,
} from '@phosphor-icons/react'
import { create } from 'zustand'
import { Link, useLocation } from 'wouter'
import { reopenMatch, scoreGoal, shorten, suspendMarket, suspendMatch, useBook, fmt, money } from './book'
import { useApp, needsAccept, stakeState, matchName, minuteLabel, isDead } from './store'
import { COMPS, FIXTURES, PLAYERS, TEAMS } from './data'
import { useGo, cx, OddsCell, useIsPhone, useTabBar, Crest, LiveDot, Tideline, Usdt, valueAt } from './ui'
import { MyBets, SlipBody, SlipFooter } from './slip'
import { AccountMenu, BalanceButton } from './account'

// shell layout state: the left menu (icons or icons with labels) and the side panel (open or closed)
export const useShell = create<{ rail: boolean; panel: boolean }>(() => ({ rail: false, panel: true }))
const openPanel = (tab?: 'slip' | 'bets' | 'chat') => { useShell.setState({ panel: true }); if (tab) useApp.getState().set({ panelTab: tab }) }
const initials = (alias: string) => alias.split(/[^a-z]+/i).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
export const Avatar = ({ alias, big }: { alias: string; big?: boolean }) => <i className={cx('av', big && 'big')} aria-hidden>{initials(alias)}</i>

const openBetCount = () => useApp((s) => s.bets.filter((b) => b.status === 'open').length)

// The live pulse in the top bar: the biggest price move of the last ten minutes, one match at a time.
// A suspended match jumps the queue, so the bar never sits on a quiet match while something is happening.
export function TopBar() {
  const { shellToast, set, login, user } = useApp()
  const slipN = useApp((s) => s.slip.length)
  const { rail, panel } = useShell()
  return (
    <header className={cx('top', user && 'in')}>
      <button className="tog" aria-label={rail ? 'Collapse menu' : 'Expand menu'} aria-expanded={rail} onClick={() => useShell.setState({ rail: !rail })}><SidebarSimple size={20} weight={rail ? 'fill' : 'regular'} /></button>
      <Link href="/" className="logo" aria-label="Housebets home"><img src="./brand/logo.svg" alt="Housebets" /></Link>
      {/* signed in, the centre of the bar follows the live Housebets site: balance, Wallet, rewards, prize and position */}
      <div className="prizew">
        {user && <BalanceButton />}
        {user && <button className="btn pri wbtn" onPointerDown={(e) => e.stopPropagation()} onClick={() => set({ wallet: !useApp.getState().wallet })}>Wallet</button>}
        <button className="ib crown" aria-label={user ? 'Rewards, 2 new' : 'Rewards'} onClick={shellToast}><Crown size={20} />{user && <u>2</u>}</button>
        <button className="prize" onClick={shellToast}>
          <Trophy size={22} weight="fill" />
          <span><small>Weekly Prize</small><b className="d">$50,000<i>.00</i></b></span>
          {user && <span className="pos"><small>Position</small><b className="d">1,284<i>th</i></b></span>}
        </button>
      </div>
      <span className="grow" />
      <button className="ib" aria-label="Search" onClick={() => set({ search: true })}><MagnifyingGlass size={20} /></button>
      <button className={cx('ib ptog', panel && 'on')} aria-label={panel ? 'Close side panel' : `Open side panel${slipN ? `, ${slipN} in your slip` : ''}`} aria-expanded={panel} onClick={() => useShell.setState({ panel: !panel })}>
        <Sidebar size={20} weight={panel ? 'fill' : 'regular'} />
        {!panel && slipN > 0 && <u key={slipN} className="bump">{slipN}</u>}
      </button>
      {user ? <AccountMenu /> : (
        <>
          <button className="btn" onClick={login}>Log In</button>
          <button className="btn pri" onClick={login}>Register</button>
        </>
      )}
    </header>
  )
}

export function Rail({ sport }: { sport: string | null }) {
  const [loc, nav] = useLocation()
  const goF = useGo()
  const { shellToast } = useApp()
  const n = openBetCount()
  const liveN = useBook((s) => (s.lull ? 0 : Object.values(s.matches).filter((m) => m.live).length))
  const item = (icon: ReactNode, label: string, on: boolean, go: () => void, badge?: ReactNode) => (
    <button className={cx(on && 'on')} aria-label={label} title={label} aria-current={on ? 'page' : undefined} onClick={go}>{icon}<span className="rlab">{label}</span>{badge}</button>
  )
  const w = (on: boolean) => (on ? 'fill' : 'regular') as 'fill' | 'regular'
  const home = loc === '/'
  const sp = (id: string) => sport === id
  const foot = loc === '/football' || loc.startsWith('/match')
  return (
    <nav className="rail" aria-label="Sportsbook">
      {item(<House size={20} weight={w(home)} />, 'Sports home', home, () => nav('/'))}
      {item(<Broadcast size={20} weight={w(loc === '/live')} />, 'Live', loc === '/live', () => nav('/live'), liveN > 0 && <i className="ld"><b className="d">{liveN}</b></i>)}
      {item(<SoccerBall size={20} weight={w(foot)} />, 'Football', foot, () => nav('/football'))}
      {item(<Basketball size={20} weight={w(sp('basketball'))} />, 'Basketball', sp('basketball'), () => nav('/sport/basketball'))}
      {item(<TennisBall size={20} weight={w(sp('tennis'))} />, 'Tennis', sp('tennis'), () => nav('/sport/tennis'))}
      {item(<GameController size={20} weight={w(sp('esports'))} />, 'Esports', sp('esports'), () => nav('/sport/esports'))}
      <hr />
      {item(<Star size={20} />, 'Following', false, () => goF('/football?tab=following'))}
      {item(<Receipt size={20} weight={w(loc === '/bets')} />, 'My bets', loc === '/bets', () => nav('/bets'), n > 0 && <u>{n}</u>)}
      {item(<ChartLineUp size={20} weight={w(loc === '/stats')} />, 'Statistics', loc === '/stats', () => nav('/stats'))}
      <hr />
      {item(<Spade size={20} />, 'Casino', false, shellToast)}
      {item(<ChatCircle size={20} />, 'Chat', false, () => openPanel('chat'))}
    </nav>
  )
}

function PanelTabs({ tab, onTab, hideBets, onClose }: { tab: string; onTab: (t: 'slip' | 'bets' | 'chat') => void; hideBets?: boolean; onClose?: () => void }) {
  const slipN = useApp((s) => s.slip.length)
  const n = openBetCount()
  const [ref, bar] = useTabBar()
  return (
    <div ref={ref} className="ptabs" role="tablist">
      <button role="tab" aria-selected={tab === 'slip'} className={cx(tab === 'slip' && 'on')} onClick={() => onTab('slip')}><span className="tl">Bet slip</span> <b key={slipN} className={cx('pillc', !slipN && 'q', slipN > 0 && 'bump')}>{slipN}</b></button>
      {!hideBets && <button role="tab" aria-selected={tab === 'bets'} className={cx(tab === 'bets' && 'on')} onClick={() => onTab('bets')}><span className="tl">My bets</span> <b key={n} className="pillc q bump">{n}</b></button>}
      <button role="tab" aria-selected={tab === 'chat'} className={cx(tab === 'chat' && 'on')} onClick={() => onTab('chat')}><span className="tl">Chat</span></button>
      {onClose && <button className="x" aria-label="Close" onClick={onClose}><X size={18} /></button>}
      {bar}
    </div>
  )
}
function PanelBody({ tab }: { tab: string }) {
  const [, nav] = useLocation()
  const set = useApp((s) => s.set)
  if (tab === 'chat') return <div className="pb grow"><div className="empty"><ChatCircle size={28} /><h4>Chat</h4><div className="meta">Chat lives outside this prototype.</div></div></div>
  if (tab === 'bets')
    return (
      <div className="pb scroll">
        <MyBets />
        <button className="lnk all" onClick={() => { set({ sheet: null }); nav('/bets') }}>All bets ›</button>
      </div>
    )
  return <><div className="scroll grow"><SlipBody /></div><SlipFooter /></>
}
export function Panel() {
  const [loc] = useLocation()
  const { panelTab, set, scenes } = useApp()
  const open = useShell((s) => s.panel)
  const slipN = useApp((s) => s.slip.length)
  // a new selection opens the panel, so the slip is never changed out of sight
  const seen = useRef(slipN)
  useEffect(() => { if (slipN > seen.current) useShell.setState({ panel: true }); seen.current = slipN }, [slipN])
  const onBets = loc === '/bets'
  const tab = onBets && panelTab === 'bets' ? 'slip' : panelTab
  return (
    <aside className="panel" aria-label="Bet slip and my bets" aria-hidden={!open} inert={!open}>
      <div className="panel-in">
        <PanelTabs tab={tab} onTab={(t) => set({ panelTab: t })} hideBets={onBets} />
        <PanelBody tab={tab} />
        <div className="pfoot">
          <span>Sample data · no real money</span>
          <button data-scenes aria-expanded={scenes} onClick={() => set({ scenes: !scenes })}><SlidersHorizontal size={13} />Demo controls <kbd>.</kbd></button>
        </div>
      </div>
    </aside>
  )
}

// ---- phone ------------------------------------------------------------------
export function PhoneHeader() {
  const { login, user, set } = useApp()
  return (
    <header className="pt">
      <Link href="/" className="logo" aria-label="Housebets home"><img src="./brand/logo.svg" alt="Housebets" /></Link>
      <button className="ib" aria-label="Search" onClick={() => set({ search: true, menu: false, sheet: null })}><MagnifyingGlass size={20} /></button>
      {user ? <BalanceButton /> : (
        <>
          <button className="btn" onClick={login}>Log In</button>
          <button className="btn pri" onClick={login}>Register</button>
        </>
      )}
    </header>
  )
}
export function TabBar() {
  const { set, shellToast, menu, login, sheet, user } = useApp()
  const [loc, nav] = useLocation()
  const at = menu ? 'menu' : sheet === 'chat' ? 'chat' : loc === '/stats' ? 'profile' : 'sports'
  const cur = (id: string) => ({ className: cx(at === id && 'on'), 'aria-current': at === id ? ('page' as const) : undefined })
  return (
    <nav className="tb" aria-label="Main">
      <button {...cur('menu')} aria-expanded={menu} onClick={() => set({ menu: !menu, sheet: null })}><List size={22} />Menu</button>
      <button {...cur('sports')} onClick={() => { set({ menu: false, sheet: null }); nav('/') }}><SoccerBall size={22} weight={at === 'sports' ? 'fill' : 'regular'} />Sports</button>
      <button onClick={shellToast}><Spade size={22} />Casino</button>
      <button {...cur('chat')} onClick={() => set({ menu: false, sheet: sheet === 'chat' ? null : 'chat' })}><ChatCircle size={22} weight={at === 'chat' ? 'fill' : 'regular'} />Chat</button>
      <button {...cur('profile')} onClick={() => { set({ menu: false, sheet: null }); if (user) nav('/stats'); else login() }}>{user ? <Avatar alias={user.alias} /> : <UserCircle size={22} />}{user ? 'Stats' : 'Log in'}</button>
    </nav>
  )
}
export function SlipBar() {
  const { slip, pref, balance, receipts, set, sheet, menu } = useApp()
  const sels = useBook((s) => s.sels)
  const mkts = useBook((s) => s.mkts)
  const n = openBetCount()
  const [loc] = useLocation()
  const [placed, setPlaced] = useState(false)
  useEffect(() => {
    if (!receipts.length) return
    setPlaced(true)
    const t = setTimeout(() => setPlaced(false), 8000)
    return () => clearTimeout(t)
  }, [receipts])
  useEffect(() => setPlaced(false), [loc])
  if (sheet || menu) return null
  if (!slip.length) {
    if (placed) return <button className="sbar" onClick={() => set({ sheet: 'slip' })}><span className="c">✓</span><span className="txt"><b>Bet placed</b> · View receipt</span><span className="go">Slip <CaretUp size={14} /></span></button>
    if (!n) return null
    return <button className="sbar slim" onClick={() => set({ sheet: 'bets' })}><span>My bets · <b>{n} open</b></span><span className="go"><CaretUp size={14} /></span></button>
  }
  const first = slip[0]
  const s = sels[first.selId]
  const attn = slip.some((i) => i.err) ? 'Bet not placed · review' : slip.some((i) => isDead(i.selId)) ? 'Selection closed · review' : slip.some((i) => mkts[sels[i.selId].mk].sus) ? 'Selection suspended · review' : slip.some((i) => needsAccept(i, sels[i.selId], pref)) ? 'Price changed · review' : ''
  const ret = slip.reduce((a, i) => a + (stakeState(i, balance).ok ? +i.stake * sels[i.selId].price : 0), 0)
  return (
    <button className="sbar" onClick={() => set({ sheet: 'slip' })}>
      <span key={slip.length} className="c bump">{slip.length}{attn && <i className="attn" />}</span>
      <span className="txt">{attn || <><b>{s.name} @ {fmt(s.price)}</b>{slip.length > 1 ? ` +${slip.length - 1} more` : ''} · {ret ? `Returns ${money(ret)}` : 'tap to add a stake'}</>}</span>
      <span className="go">Slip <CaretUp size={14} /></span>
    </button>
  )
}
export function Sheet() {
  const { sheet, set } = useApp()
  const [loc, nav] = useLocation()
  const close = () => { set({ sheet: null }); if (loc === '/bets') nav('/') }
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sheet) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [sheet, loc])
  // move focus into the sheet when it opens, and hand it back when it closes
  const open = !!sheet
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    box.current?.focus({ preventScroll: true })
    return () => prev?.focus?.({ preventScroll: true })
  }, [open])
  // keep the footer above the on-screen keyboard
  const [vh, setVh] = useState<number | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const f = () => setVh(vv.height < window.innerHeight - 80 ? vv.height : null)
    vv.addEventListener('resize', f)
    return () => vv.removeEventListener('resize', f)
  }, [])
  if (!sheet) return null
  return (
    <>
      <div className="scrim" onClick={close} />
      <div ref={box} tabIndex={-1} className="sheet" role="dialog" aria-modal="true" aria-label="Bet slip and my bets" style={vh ? { height: vh - 8, bottom: 0 } : undefined}>
        <button className="grab" aria-label="Close" onClick={close} />
        <PanelTabs tab={sheet} onTab={(t) => set({ sheet: t })} onClose={close} />
        <PanelBody tab={sheet} />
      </div>
    </>
  )
}
export function MenuSheet() {
  const { menu, set } = useApp()
  const nav = useGo()
  const [loc] = useLocation()
  const [demo, setDemo] = useState(false)
  const n = openBetCount()
  const liveN = useBook((s) => (s.lull ? 0 : Object.values(s.matches).filter((m) => m.live).length))
  useEffect(() => { if (!menu) setDemo(false) }, [menu])
  if (!menu) return null
  const go = (to: string) => () => { set({ menu: false }); nav(to) }
  const mi = (icon: ReactNode, label: string, to: string, extra?: ReactNode) => (
    <button className={cx('mi', loc === to && 'on')} aria-current={loc === to ? 'page' : undefined} onClick={go(to)}>{icon}<span>{label}</span>{extra}</button>
  )
  return (
    <>
      <div className="scrim" onClick={() => set({ menu: false })} />
      <div className="sheet menu" role="dialog" aria-modal="true" aria-label="Menu">
        <button className="grab" aria-label="Close" onClick={() => set({ menu: false })} />
        <div className="scroll">
          <div className="micro sub first">Sportsbook</div>
          {mi(<House size={20} />, 'Sports home', '/')}
          {mi(<Broadcast size={20} />, 'Live', '/live', liveN > 0 && <em className="lvn d"><LiveDot />{liveN}</em>)}
          {mi(<SoccerBall size={20} />, 'Football', '/football')}
          {mi(<TennisBall size={20} />, 'Tennis', '/sport/tennis')}
          {mi(<Basketball size={20} />, 'Basketball', '/sport/basketball')}
          {mi(<GameController size={20} />, 'Esports', '/sport/esports')}
          <div className="micro sub">You</div>
          <button className="mi" onClick={() => { set({ menu: false, sheet: 'bets' }) }}><Receipt size={20} /><span>My bets</span>{n > 0 && <em className="d">{n} open</em>}</button>
          <button className="mi" onClick={go('/football?tab=following')}><Star size={20} /><span>Following</span></button>
          {mi(<ChartLineUp size={20} />, 'Statistics', '/stats')}
          {useApp.getState().user ? <button className="mi" onClick={() => { useApp.getState().logout(); nav('/') }}><SignOut size={20} /><span>Log out</span></button> : <button className="mi" onClick={() => useApp.getState().login()}><SignIn size={20} /><span>Log in</span><em>demo player, no password</em></button>}
          <div className="micro sub">Prototype</div>
          <button className="mi" aria-expanded={demo} onClick={() => setDemo(!demo)}><SlidersHorizontal size={20} /><span>Demo controls</span><em>goals, suspensions, failed bets</em><CaretDown size={14} className={cx("cv", demo && "up")} /></button>
          {demo && <ScenesList onRun={() => set({ menu: false })} />}
          <div className="about meta">
            <b>About this prototype</b><br />
            A design prototype of the Housebets sportsbook. Sample fixtures, prices, players and bets only; no real money. Built with React, Vite, Zustand, wouter, NumberFlow and Phosphor Icons. Fonts: Figtree and Red Hat Display. Motion data for the football figure was obtained from mocap.cs.cmu.edu; the database was created with funding from NSF EIA-0196217.
          </div>
        </div>
      </div>
    </>
  )
}

// ---- Demo controls: scripted match events for reviewers ---------------------------------
function ScenesList({ onRun }: { onRun?: () => void }) {
  const [, nav] = useLocation()
  const { failNext, declineCash, set, toast } = useApp()
  const { speed, calm, lull } = useBook()
  const B = useBook.getState().set
  const run = (to: string | null, fn: () => void) => () => { onRun?.(); if (to) nav(to); setTimeout(fn, 450) }
  const ensureSel = () => {
    const a = useApp.getState()
    if (!a.slip.length) a.toggle('liv-mun:main:d')
    if (useIsPhoneNow()) a.set({ sheet: 'slip' }); else openPanel('slip')
    const s = useApp.getState().slip
    return s[s.length - 1].selId
  }
  const Row = ({ t, d, onClick, on }: { t: string; d: string; onClick: () => void; on?: boolean }) => (
    <button className="sc-row" onClick={onClick} aria-pressed={on}>
      <span><b>{t}</b><span className="meta">{d}</span></span>
      {on == null ? <Play size={16} weight="fill" /> : <i className={cx('sw', on && 'on')} />}
    </button>
  )
  return (
    <div className="scenes-list">
      <div className="micro sub">Match page</div>
      <Row t="Arsenal score" d="suspend → goal → reprice" onClick={run('/match/ars-bha', () => scoreGoal('ars-bha', 0))} />
      <Row t="Penalty check, play on" d="suspended, then reopens" onClick={run('/match/ars-bha', () => { if (!useBook.getState().matches['ars-bha'].pause) suspendMatch('ars-bha', 'Penalty check', 6000) })} />
      <div className="micro sub">Bet slip</div>
      <Row t="Trader shortens your price" d="odds changed · you must accept" onClick={run(null, () => shorten(ensureSel()))} />
      <Row t="Your selection is suspended" d="suspended · reopens after a 12 s count" onClick={run(null, () => { const id = ensureSel(); suspendMarket(useBook.getState().sels[id].mk, 'Trading pause', 12000) })} />
      <Row t="Trader turns down your next bet" d="bet failed · stake kept" on={failNext} onClick={() => { set({ failNext: !failNext }); if (!failNext) toast('Your next bet will fail. Place one to see it.') }} />
      <div className="micro sub">My bets</div>
      <Row t="Next cash-out is declined" d="value changed · get a new quote" on={declineCash} onClick={() => { set({ declineCash: !declineCash }); if (!declineCash) toast('Your next cash-out will be declined.') }} />
      <div className="micro sub">Live</div>
      <Row t="Midweek lull" d="nothing live → Starting soon" on={lull} onClick={() => { B({ lull: !lull }); if (!lull) { onRun?.(); nav('/live') } }} />
      <div className="sc-foot">
        <span className="meta">Match clock</span>
        <span className="seg">{[1, 10].map((v) => <button key={v} className={cx(speed === v && 'on')} aria-pressed={speed === v} onClick={() => B({ speed: v })}>{v}×</button>)}</span>
        <button className="sc-calm" aria-pressed={calm} onClick={() => B({ calm: !calm })}>Calm prices <i className={cx('sw', calm && 'on')} /></button>
      </div>
      <button className="lnk" onClick={() => { location.hash = '#/'; location.reload() }}>Start again from 52'</button>
    </div>
  )
}
const useIsPhoneNow = () => window.matchMedia('(max-width: 1023px)').matches
export function ScenesPop() {
  const { scenes, set } = useApp()
  const phone = useIsPhone()
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '.' && tag !== 'INPUT' && tag !== 'SELECT') {
        if (useIsPhoneNow()) set({ menu: true, sheet: null }); else set({ scenes: !useApp.getState().scenes })
      }
      if (e.key === 'Escape') set({ scenes: false })
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  // a click anywhere else puts the controls away
  useEffect(() => {
    if (!scenes) return
    const out = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.scenes-pop,[data-scenes]')) set({ scenes: false }) }
    document.addEventListener('pointerdown', out)
    return () => document.removeEventListener('pointerdown', out)
  }, [scenes])
  if (!scenes || phone) return null
  return (
    <div className="scenes-pop" role="dialog" aria-label="Demo controls">
      <div className="sp-h"><b>Demo controls</b><span className="meta">Match events on demand</span><button aria-label="Close" onClick={() => set({ scenes: false })}><X size={16} /></button></div>
      <ScenesList onRun={() => set({ scenes: false })} />
    </div>
  )
}

export function Toasts() {
  const toasts = useApp((s) => s.toasts)
  // while a sheet, the menu or the profile is open, toasts move to the top so they never cover its buttons
  const over = useApp((s) => !!s.sheet || s.menu || s.wallet)
  return (
    <div className={cx('toasts', over && 'top')} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}><span>{t.text}</span>{t.action && <button onClick={t.action.run}>{t.action.label}</button>}</div>
      ))}
    </div>
  )
}

// ---- search: teams, players, competitions, matches, markets --------------------------
export function SearchOverlay() {
  const { search, set } = useApp()
  const [q, setQ] = useState('')
  const nav = useGo()
  const ref = useRef<HTMLInputElement>(null)
  const matches = useBook((s) => s.matches)
  useEffect(() => { if (search) { setQ(''); setTimeout(() => ref.current?.focus(), 30) } }, [search])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT') { e.preventDefault(); set({ search: true }) }
      if (e.key === 'Escape') set({ search: false })
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const res = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return null
    const has = (t: string) => t.toLowerCase().includes(s)
    const fx = FIXTURES.filter((f) => has(TEAMS[f.home].name) || has(TEAMS[f.away].name) || has(COMPS[f.comp].name))
    const teams = Object.values(TEAMS).filter((t) => has(t.name) && FIXTURES.some((f) => f.home === t.id || f.away === t.id)).slice(0, 4)
    const players = PLAYERS.filter((p) => has(p.name)).slice(0, 4)
    const comps = Object.values(COMPS).filter((c) => has(c.name)).slice(0, 3)
    // markets come from the book itself: every open market of every match, live ones first
    const alias: Record<string, string> = { btts: 'both teams to score', ou: 'total', 'o/u': 'total', winner: 'match', '1x2': 'match result', goalscorer: 'goalscorer', scorer: 'goalscorer' }
    const s2 = alias[s] ?? s
    const B = useBook.getState()
    const mk: { mkt: string; sel: string; name: string; tab: string }[] = []
    const perMatch: Record<string, number> = {}
    for (const m of Object.values(B.mkts).sort((x, y) => +B.matches[y.match].live - +B.matches[x.match].live)) {
      if (mk.length >= 5) break
      const hitSel = m.selIds.find((id) => B.sels[id].name.toLowerCase().includes(s2))
      if (!m.name.toLowerCase().includes(s2) && !hitSel) continue
      if ((perMatch[m.match] = (perMatch[m.match] ?? 0) + 1) > 2) continue
      const sel = hitSel ?? m.selIds.find((id) => !m.defLine || B.sels[id].line === m.defLine) ?? m.selIds[0]
      mk.push({ mkt: m.id, sel, name: m.name, tab: m.tabs[m.tabs.length - 1] })
    }
    const all = Object.values(TEAMS).map((t) => t.name)
    const near = all.find((n) => n.toLowerCase().slice(0, 2) === s.slice(0, 2) && Math.abs(n.length - s.length) < 4)
    return { fx: fx.slice(0, 5), teams, players, comps, mk, near, empty: !fx.length && !teams.length && !players.length && !comps.length && !mk.length }
  }, [q])
  if (!search) return null
  const go = (to: string) => () => { set({ search: false }); nav(to) }
  return (
    <div className="search-ov" role="dialog" aria-modal="true" aria-label="Search">
      <div className="scrim" onClick={() => set({ search: false })} />
      <div className="so-box">
        <label className="search big"><MagnifyingGlass size={20} /><input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teams, players, competitions or markets" /><kbd>Esc</kbd></label>
        <div className="so-res scroll">
          {!res && <div className="meta pad">Try {['Arsenal', 'Okafor', 'LaLiga', 'corners', 'over 2.5'].map((w, i) => <span key={w}>{i > 0 && ' · '}<button className="lnk" onClick={() => setQ(w)}>{w}</button></span>)}</div>}
          {res?.empty && <div className="pad">No results for “{q}”.{res.near && <> Did you mean <button className="lnk" onClick={() => setQ(res.near!)}>{res.near}</button>?</>}</div>}
          {res && res.teams.length > 0 && <><div className="micro sub">Teams</div>{res.teams.map((t) => { const f = FIXTURES.find((x) => x.home === t.id || x.away === t.id)!; return <button className="so-row" key={t.id} onClick={go(`/match/${f.id}`)}><Crest id={t.id} /><b>{t.name}</b><span className="meta">Next: {matchName(matches[f.id])}</span></button> })}</>}
          {res && res.players.length > 0 && <><div className="micro sub">Players</div>{res.players.map((p) => <button className="so-row" key={p.name} onClick={go('/match/ars-bha?tab=Goalscorers')}><Crest id={p.team} /><b>{p.name}</b><span className="meta">{TEAMS[p.team].short} · Anytime goalscorer {fmt(p.any)}</span></button>)}</>}
          {res && res.comps.length > 0 && <><div className="micro sub">Competitions</div>{res.comps.map((c) => <button className="so-row" key={c.id} onClick={go(c.sport === 'football' ? `/football?comp=${c.id}` : `/sport/${c.sport}?comp=${c.id}`)}><b>{c.name}</b><span className="meta">{c.country}</span></button>)}</>}
          {res && res.fx.length > 0 && <><div className="micro sub">Matches</div>{res.fx.map((f) => <div className="so-row m" key={f.id} role="link" tabIndex={0} onClick={go(`/match/${f.id}`)}><span><b>{matchName(matches[f.id])}</b><span className="meta">{COMPS[f.comp].name} · {matches[f.id].live ? 'Live' : `${f.day} ${f.time}`}</span></span><span className="px">{(f.sport === 'football' ? ['h', 'd', 'a'] : ['h', 'a']).map((k) => <OddsCell key={k} id={`${f.id}:main:${k}`} />)}</span></div>)}</>}
          {res && res.mk.length > 0 && <><div className="micro sub">Markets</div>{res.mk.map((k) => { const sel = useBook.getState().sels[k.sel]; return <div className="so-row m" key={k.mkt} role="link" tabIndex={0} onClick={go(`/match/${sel.match}?tab=${k.tab}`)}><span><b>{k.name} · {sel.name}</b><span className="meta">{matchName(matches[sel.match])}{matches[sel.match].live ? ' · Live' : ''}</span></span><span className="px one"><OddsCell id={k.sel} /></span></div> })}</>}
        </div>
      </div>
    </div>
  )
}
