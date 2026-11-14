// The Housebets site shell: top bar, left rail, side panel, phone header, tab bar, slip bar, sheets, Scenes, search, toasts.
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  Basketball, CaretDown, CaretUp, ChatCircle, Check, Crown, GameController, House, List, MagnifyingGlass, Broadcast, Receipt, Sidebar, SidebarSimple,
  SoccerBall, Spade, Star, TennisBall, Trophy, X, Play, UserCircle, SlidersHorizontal, ChartLineUp, SignIn, SignOut, Info,
} from '@phosphor-icons/react'
import { create } from 'zustand'
import { Link, useLocation } from 'wouter'
import { scoreGoal, shorten, suspendMarket, suspendMatch, useBook, fmt, money } from './book'
import { useApp, needsAccept, stakeState, matchName, isDead } from './store'
import { COMPS, FIXTURES, PLAYERS, SPORTS, TEAMS } from './data'
import { useGo, cx, OddsCell, useIsPhone, useTabBar, Crest, LiveDot, usePresence, useCountUp, EXIT, rowSels } from './ui'
import { MyBets, SlipBody, SlipFooter } from './slip'
import { AccountMenu, BalanceButton, Wallet, useOverlay } from './account'

// shell layout state: the left menu (icons or icons with labels), the side panel (open or closed), and whether the phone
// menu should open with the demo controls unfolded (the `.` key and the ?scene=demo link ask for that).
// Under 1200px the panel would squeeze the page, so it starts closed there and opens over the page instead.
export const useShell = create<{ rail: boolean; panel: boolean; demo: boolean }>(() => ({ rail: false, panel: typeof window === 'undefined' || window.innerWidth >= 1200 || window.innerWidth < 1024, demo: false }))
const openPanel = (tab?: 'slip' | 'bets' | 'chat') => { useShell.setState({ panel: true }); if (tab) useApp.getState().set({ panelTab: tab }) }

const openBetCount = () => useApp((s) => s.bets.filter((b) => b.status === 'open').length)
const useIsPhoneNow = () => window.matchMedia('(max-width: 1023px)').matches
// below 1680px the open rail lies over the page instead of pushing it (the page has no room to give at 1440)
const railOverlays = () => window.innerWidth < 1680

export function TopBar() {
  const { shellToast, set, login, user } = useApp()
  const slipN = useApp((s) => s.slip.length)
  const { rail, panel } = useShell()
  const k = useCountUp(slipN)
  return (
    <header className={cx('top', user && 'in')}>
      <button className="tog" data-tip={rail ? 'Collapse menu' : 'Expand menu'} aria-label={rail ? 'Collapse menu' : 'Expand menu'} aria-expanded={rail} onClick={() => useShell.setState({ rail: !rail })}><SidebarSimple size={20} weight={rail ? 'fill' : 'regular'} /></button>
      <Link href="/" className="logo" aria-label="Housebets home"><img src="./brand/logo.svg" alt="Housebets" /></Link>
      {/* signed in, the centre of the bar follows the live Housebets site: balance, Wallet, rewards, prize and position */}
      <div className="prizew">
        {user && <span className="balw"><BalanceButton /><Wallet /></span>}
        {user && <button className="btn pri wbtn" onPointerDown={(e) => e.stopPropagation()} onClick={() => set({ wallet: !useApp.getState().wallet })}>Wallet</button>}
        <button className="ib crown" data-tip="Rewards" aria-label={user ? 'Rewards, 2 new' : 'Rewards'} onClick={shellToast}><Crown size={20} />{user && <u>2</u>}</button>
        <button className="prize" onClick={shellToast}>
          <Trophy size={22} weight="fill" />
          <span><small>Weekly Prize</small><b className="d">$50,000<i>.00</i></b></span>
          {user && <span className="pos"><small>Position</small><b className="d">1,284<i>th</i></b></span>}
        </button>
      </div>
      <span className="grow" />
      <button className="ib" data-tip="Search" aria-label="Search" onClick={() => set({ search: true })}><MagnifyingGlass size={20} /></button>
      <button className={cx('ib ptog', panel && 'on')} data-tip={panel ? 'Hide bet slip' : 'Show bet slip'} aria-label={panel ? 'Close side panel' : `Open side panel${slipN ? `, ${slipN} in your slip` : ''}`} aria-expanded={panel} onClick={() => useShell.setState({ panel: !panel })}>
        <Sidebar size={20} weight={panel ? 'fill' : 'regular'} />
        {!panel && slipN > 0 && <u key={k} className={cx(k > 0 && 'count-in')}>{slipN}</u>}
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

const SPORT_ICON = { football: SoccerBall, tennis: TennisBall, basketball: Basketball, esports: GameController } as const
export function Rail({ sport }: { sport: string | null }) {
  const [loc, nav] = useLocation()
  const goF = useGo()
  const { shellToast } = useApp()
  const sf = useApp((s) => s.sf)
  const open = useShell((s) => s.rail)
  const n = openBetCount()
  const liveN = useBook((s) => (s.lull ? 0 : Object.values(s.matches).filter((m) => m.live).length))
  // collapsed, an icon names itself in a small label beside it, on hover and on keyboard focus
  const [tip, setTip] = useState<{ label: string; y: number } | null>(null)
  const show = (label: string, el: HTMLElement) => setTip({ label, y: el.getBoundingClientRect().top - (el.closest('.desk')?.getBoundingClientRect().top ?? 0) + 8 })
  const item = (icon: ReactNode, label: string, on: boolean, go: () => void, badge?: ReactNode) => (
    <button key={label} className={cx(on && 'on')} aria-label={label} aria-current={on ? 'page' : undefined} onClick={go}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(label, e.currentTarget)} onPointerLeave={() => setTip(null)}
      onFocus={(e) => e.currentTarget.matches(':focus-visible') && show(label, e.currentTarget)} onBlur={() => setTip(null)}>{icon}<span className="rlab">{label}</span>{badge}</button>
  )
  const w = (on: boolean) => (on ? 'fill' : 'regular') as 'fill' | 'regular'
  const home = loc === '/'
  // the Following tab of a sport page belongs to "Following", not to the sport
  const listPage = loc === '/football' || loc.startsWith('/sport/')
  const following = listPage && !!sport && sf[sport]?.tab === 'following'
  // as an overlay the open rail steps aside again: on Escape, on a click elsewhere, and once it has taken the player somewhere
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (railOverlays()) useShell.setState({ rail: false })
  }, [loc])
  useEffect(() => {
    if (!open) return
    setTip(null)
    const down = (e: PointerEvent) => { if (railOverlays() && !(e.target as HTMLElement).closest('.rail,.top .tog')) useShell.setState({ rail: false }) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && railOverlays()) useShell.setState({ rail: false }) }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key) }
  }, [open])
  return (
    <>
      {/* where the open rail lies over the page (1024 to 1679 wide) the page dims under it; a press here closes the rail */}
      <div className="rail-scrim" aria-hidden />
      <nav className="rail" aria-label="Sportsbook">
        {item(<House size={20} weight={w(home)} />, 'Sports home', home, () => nav('/'))}
        {item(<Broadcast size={20} weight={w(loc === '/live')} />, 'Live', loc === '/live', () => nav('/live'), liveN > 0 && <i className="ld"><b className="d">{liveN}</b></i>)}
        {SPORTS.map((s) => {
          const Icon = SPORT_ICON[s.id as keyof typeof SPORT_ICON]
          const on = sport === s.id && !following
          const to = s.id === 'football' ? '/football' : `/sport/${s.id}`
          return item(<Icon size={20} weight={w(on)} />, s.name, on, () => { if (following && sport === s.id) useApp.getState().setSF(s.id, { tab: 'now' }); nav(to) })
        })}
        <hr />
        {item(<Star size={20} weight={w(following)} />, 'Following', following, () => goF(`${listPage && sport && sport !== 'football' ? `/sport/${sport}` : '/football'}?tab=following`))}
        {item(<Receipt size={20} weight={w(loc === '/bets')} />, 'My bets', loc === '/bets', () => nav('/bets'), n > 0 && <u>{n}</u>)}
        {item(<ChartLineUp size={20} weight={w(loc === '/stats')} />, 'Your record', loc === '/stats', () => nav('/stats'))}
        <hr />
        {item(<Spade size={20} />, 'Casino', false, shellToast)}
        {item(<ChatCircle size={20} />, 'Chat', false, () => openPanel('chat'))}
      </nav>
      {tip && !open && <span className="rail-tip" style={{ top: tip.y }} aria-hidden>{tip.label}</span>}
    </>
  )
}

type PTab = 'slip' | 'bets' | 'chat'
// One tab stop for the three tabs (Left / Right / Home / End move and select, as in Tabs); the close button sits outside the tab list.
function PanelTabs({ tab, onTab, hideBets, onClose }: { tab: string; onTab: (t: PTab) => void; hideBets?: boolean; onClose?: () => void }) {
  const slipN = useApp((s) => s.slip.length)
  const n = openBetCount()
  const kS = useCountUp(slipN), kB = useCountUp(n)
  const [ref, bar] = useTabBar()
  const ids = (hideBets ? ['slip', 'chat'] : ['slip', 'bets', 'chat']) as PTab[]
  const at = ids.indexOf(tab as PTab)
  const onKey = (e: React.KeyboardEvent) => {
    const c = ids.length
    const to = e.key === 'ArrowRight' ? (at + 1) % c : e.key === 'ArrowLeft' ? (at < 0 ? c - 1 : (at - 1 + c) % c) : e.key === 'Home' ? 0 : e.key === 'End' ? c - 1 : -1
    if (to < 0) return
    e.preventDefault()
    if (to !== at) onTab(ids[to])
    ref.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus()
  }
  const t = (id: PTab, label: string, badge?: ReactNode) => (
    <button key={id} role="tab" aria-selected={tab === id} tabIndex={id === ids[Math.max(0, at)] ? 0 : -1} className={cx(tab === id && 'on')} onClick={() => onTab(id)}><span className="tl">{label}</span>{badge}</button>
  )
  return (
    <div ref={ref} className="ptabs">
      <div className="ptabs-l" role="tablist" aria-label="Bet slip, my bets and chat" onKeyDown={onKey}>
        {t('slip', 'Bet slip', slipN > 0 && <b key={kS} className={cx('pillc', kS > 0 && 'count-in')}>{slipN}</b>)}
        {!hideBets && t('bets', 'My bets', <b key={kB} className={cx('pillc q', kB > 0 && 'count-in')}>{n}</b>)}
        {t('chat', 'Chat')}
      </div>
      {onClose && <button className="x" aria-label="Close" onClick={onClose}><X size={18} /></button>}
      {bar}
    </div>
  )
}
function PanelBody({ tab, inSheet }: { tab: string; inSheet?: boolean }) {
  const [, nav] = useLocation()
  if (tab === 'chat') return <div className="pb grow"><div className="empty"><ChatCircle size={28} /><h3>Chat</h3><div className="meta">Chat lives outside this prototype.</div></div></div>
  if (tab === 'bets')
    return (
      <div className="pb scroll">
        <MyBets />
        {!inSheet && <button className="btn pan-all" onClick={() => nav('/bets')}>All bets</button>}
      </div>
    )
  return <><div className="scroll grow"><SlipBody /></div><SlipFooter /></>
}
export function Panel() {
  const [loc] = useLocation()
  const { panelTab, set, scenes } = useApp()
  const open = useShell((s) => s.panel)
  const slipN = useApp((s) => s.slip.length)
  // a new selection opens the panel, so the slip is never changed out of sight (where the panel lies over the page,
  // under 1200px, the count on its button says it instead)
  const seen = useRef(slipN)
  useEffect(() => { if (slipN > seen.current && window.innerWidth >= 1200) useShell.setState({ panel: true }); seen.current = slipN }, [slipN])
  // the demo controls are a layer of the panel: asking for them opens the panel, closing the panel puts them away
  useEffect(() => { if (scenes) useShell.setState({ panel: true }) }, [scenes])
  useEffect(() => { if (!open && useApp.getState().scenes) set({ scenes: false }) }, [open])
  const onBets = loc === '/bets'
  const tab = onBets && panelTab === 'bets' ? 'slip' : panelTab
  return (
    <aside className="panel" aria-label="Bet slip and my bets" aria-hidden={!open} inert={!open}>
      <div className="panel-in">
        <h2 className="sh-vh">Bet slip and my bets</h2>
        <PanelTabs tab={tab} onTab={(t) => set({ panelTab: t })} hideBets={onBets} />
        <PanelBody tab={tab} />
        <ScenesLayer />
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
      <button {...cur('profile')} onClick={() => { set({ menu: false, sheet: null }); if (user) nav('/stats'); else login() }}><UserCircle size={22} weight={at === 'profile' ? 'fill' : 'regular'} />{user ? 'Record' : 'Log in'}</button>
    </nav>
  )
}
export function SlipBar() {
  const { slip, pref, balance, receipts, set, sheet, menu } = useApp()
  const sels = useBook((s) => s.sels)
  const mkts = useBook((s) => s.mkts)
  const n = openBetCount()
  const k = useCountUp(slip.length)
  // the bar comes back only once a closing sheet has left the screen
  const sheetOut = usePresence(!!sheet, EXIT.sheet).mounted
  const menuOut = usePresence(menu, EXIT.sheet).mounted
  if (sheetOut || menuOut) return null
  if (!slip.length) {
    if (receipts.length) return <button className="sbar" onClick={() => set({ sheet: 'slip' })}><span className="c"><Check size={14} weight="bold" /></span><span className="txt"><b>Bet placed</b><span className="sbar-ret">View receipt</span></span><span className="go">Slip <CaretUp size={14} /></span></button>
    if (!n) return null
    return <button className="sbar slim" onClick={() => set({ sheet: 'bets' })}><span>My bets · <b>{n} open</b></span><span className="go"><CaretUp size={14} /></span></button>
  }
  const s = sels[slip[0].selId]
  const attn = slip.some((i) => i.err) ? 'Bet not placed · review' : slip.some((i) => isDead(i.selId)) ? 'Selection closed · review' : slip.some((i) => mkts[sels[i.selId].mk].sus) ? 'Selection suspended · review' : slip.some((i) => needsAccept(i, sels[i.selId], pref)) ? 'Price changed · review' : ''
  const ret = slip.reduce((a, i) => a + (stakeState(i, balance).ok ? +i.stake * sels[i.selId].price : 0), 0)
  return (
    <button className="sbar" onClick={() => set({ sheet: 'slip' })}>
      <span key={k} className={cx('c', k > 0 && 'count-in')}>{slip.length}{attn && <i className="attn" />}</span>
      <span className="txt">{attn || <><b>{slip.length > 1 ? `${slip.length} selections` : <>{s.name} <span className="d">{fmt(s.price)}</span></>}</b>{ret > 0 && <span className="sbar-ret">To return {money(ret)}</span>}</>}</span>
      <span className="go">Slip <CaretUp size={14} /></span>
    </button>
  )
}
export function Sheet() {
  const { sheet, set } = useApp()
  const [loc, nav] = useLocation()
  const open = !!sheet
  const { mounted, closing } = usePresence(open, EXIT.sheet)
  // the body keeps showing the tab it had while the sheet slides away
  const last = useRef<PTab>('slip')
  if (sheet) last.current = sheet
  const close = () => { set({ sheet: null }); if (loc === '/bets') nav('/') }
  const box = useRef<HTMLDivElement>(null)
  useOverlay(open, box, close, { lock: true })
  // keep the whole sheet inside what the on-screen keyboard leaves visible
  const [vv, setVv] = useState<{ top: number; h: number } | null>(null)
  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const f = () => setVv(v.height < window.innerHeight - 80 ? { top: v.offsetTop, h: v.height } : null)
    v.addEventListener('resize', f)
    v.addEventListener('scroll', f)
    return () => { v.removeEventListener('resize', f); v.removeEventListener('scroll', f) }
  }, [])
  if (!mounted) return null
  const tab = sheet ?? last.current
  return (
    <>
      <div className={cx('scrim', closing && 'is-closing')} onClick={close} />
      <div ref={box} tabIndex={-1} className={cx('sheet', closing && 'is-closing')} role="dialog" aria-modal="true" aria-label="Bet slip and my bets" style={vv ? { top: vv.top + 8, height: vv.h - 8, bottom: 'auto' } : undefined}>
        <button className="grab" aria-hidden tabIndex={-1} onClick={close} />
        <PanelTabs tab={tab} onTab={(t) => set({ sheet: t })} onClose={close} />
        <PanelBody tab={tab} inSheet />
      </div>
    </>
  )
}
export function MenuSheet() {
  const { menu, set, user, login, logout } = useApp()
  const nav = useGo()
  const [loc] = useLocation()
  const [demo, setDemo] = useState(false)
  const [credits, setCredits] = useState(false)
  const want = useShell((s) => s.demo)
  const n = openBetCount()
  const liveN = useBook((s) => (s.lull ? 0 : Object.values(s.matches).filter((m) => m.live).length))
  const { mounted, closing } = usePresence(menu, EXIT.sheet)
  const box = useRef<HTMLDivElement>(null)
  const sc = useRef<HTMLDivElement>(null)
  const demoBtn = useRef<HTMLButtonElement>(null)
  const close = () => set({ menu: false })
  useOverlay(menu, box, close, { lock: true })
  useEffect(() => {
    if (menu) { if (want) setDemo(true); return }
    setDemo(false); setCredits(false)
    if (want) useShell.setState({ demo: false })
  }, [menu, want])
  // unfolding the demo controls brings them to the top of the sheet
  useEffect(() => {
    if (!demo || !sc.current || !demoBtn.current) return
    sc.current.scrollTop += demoBtn.current.getBoundingClientRect().top - sc.current.getBoundingClientRect().top - 8
  }, [demo, mounted])
  if (!mounted) return null
  const go = (to: string) => () => { close(); nav(to) }
  const mi = (icon: ReactNode, label: string, to: string, extra?: ReactNode) => (
    <button className={cx('mi', loc === to && 'on')} aria-current={loc === to ? 'page' : undefined} onClick={go(to)}>{icon}<span>{label}</span>{extra}</button>
  )
  return (
    <>
      <div className={cx('scrim', closing && 'is-closing')} onClick={close} />
      <div ref={box} tabIndex={-1} className={cx('sheet menu', closing && 'is-closing')} role="dialog" aria-modal="true" aria-label="Menu">
        <button className="grab" aria-hidden tabIndex={-1} onClick={close} />
        <div className="menu-h"><h2>Menu</h2><button aria-label="Close menu" onClick={close}><X size={18} /></button></div>
        <div ref={sc} className="scroll">
          {mi(<House size={20} />, 'Sports home', '/')}
          {mi(<Broadcast size={20} />, 'Live', '/live', liveN > 0 && <em className="lvn d"><LiveDot />{liveN}</em>)}
          {mi(<SoccerBall size={20} />, 'Football', '/football')}
          {mi(<TennisBall size={20} />, 'Tennis', '/sport/tennis')}
          {mi(<Basketball size={20} />, 'Basketball', '/sport/basketball')}
          {mi(<GameController size={20} />, 'Esports', '/sport/esports')}
          <div className="micro sub">You</div>
          <button className="mi" onClick={() => { set({ menu: false, sheet: 'bets' }) }}><Receipt size={20} /><span>My bets</span>{n > 0 && <em className="d">{n} open</em>}</button>
          <button className="mi" onClick={go('/football?tab=following')}><Star size={20} /><span>Following</span></button>
          {mi(<ChartLineUp size={20} />, 'Your record', '/stats')}
          {user ? <button className="mi" onClick={() => { logout(); nav('/') }}><SignOut size={20} /><span>Log out</span></button> : <button className="mi" onClick={() => login()}><SignIn size={20} /><span>Log in</span><em>demo player, no password</em></button>}
          <div className="micro sub">Prototype</div>
          <button ref={demoBtn} className="mi" aria-expanded={demo} onClick={() => setDemo(!demo)}><SlidersHorizontal size={20} /><span>Demo controls</span><em>goals, suspensions, failed bets</em><CaretDown size={14} className={cx('cv', demo && 'up')} /></button>
          {demo && <ScenesList onRun={close} />}
          <button className="mi" aria-expanded={credits} onClick={() => setCredits(!credits)}><Info size={20} /><span>Credits</span><CaretDown size={14} className={cx('cv', credits && 'up')} /></button>
          {credits && (
            <div className="about meta">
              A design prototype of the Housebets sportsbook. Sample fixtures, prices, players and bets only; no real money. Built with React, Vite, Zustand, wouter, NumberFlow and Phosphor Icons. Fonts: Figtree and Red Hat Display. Motion data for the football figure was obtained from mocap.cs.cmu.edu; the database was created with funding from NSF EIA-0196217.
            </div>
          )}
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
      <Row t="Your next bet fails" d="bet failed · stake kept" on={failNext} onClick={() => { set({ failNext: !failNext }); if (!failNext) toast('Your next bet will fail. Place one to see it.') }} />
      <div className="micro sub">My bets</div>
      <Row t="Next cash-out is declined" d="declined · your bet stays open" on={declineCash} onClick={() => { set({ declineCash: !declineCash }); if (!declineCash) toast('Your next cash-out will be declined.') }} />
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
// Keys for the demo controls, on both layouts: `.` opens them (in the side panel on desktop, unfolded in the Menu on the
// phone). It renders nothing itself: the desktop controls are a layer of the side panel (ScenesLayer).
export function ScenesPop() {
  const { scenes, set } = useApp()
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key !== '.' || tag === 'INPUT' || tag === 'SELECT') return
      if (useIsPhoneNow()) { useShell.setState({ demo: true }); set({ menu: true, sheet: null }) } else set({ scenes: !useApp.getState().scenes })
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
  return null
}
// Desktop: the controls cover the panel from its tab row to its footer, and the footer button is their toggle.
function ScenesLayer() {
  const { scenes, set } = useApp()
  const { mounted, closing } = usePresence(scenes, EXIT.pop)
  const box = useRef<HTMLDivElement>(null)
  const close = () => set({ scenes: false })
  useOverlay(scenes, box, close, { first: true })
  if (!mounted) return null
  return (
    <div ref={box} tabIndex={-1} className={cx('scenes-pop', closing && 'is-closing')} role="dialog" aria-label="Demo controls">
      <div className="sp-h"><b>Demo controls</b><button aria-label="Close demo controls" onClick={close}><X size={16} /></button></div>
      <ScenesList onRun={close} />
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
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const ALIAS: Record<string, string> = { btts: 'both teams to score', ou: 'total', 'o/u': 'total', winner: 'match', '1x2': 'match result', goalscorer: 'goalscorer', scorer: 'goalscorer' }
type Found = { fx: typeof FIXTURES; teams: (typeof TEAMS)[string][]; players: typeof PLAYERS; comps: (typeof COMPS)[string][]; mk: { mkt: string; sel: string; name: string; tab: string }[]; empty: boolean; shown?: string }
// A word that starts with the query beats one that only contains it: "ars" finds Arsenal, not Saltmarsh. Three rows a group.
function find(raw: string): Found | null {
  const s = raw.trim().toLowerCase()
  if (!s) return null
  const s2 = ALIAS[s] ?? s
  const B = useBook.getState()
  const start = new RegExp(`(^|[^a-z0-9])${reEsc(s)}`, 'i'), start2 = new RegExp(`(^|[^a-z0-9])${reEsc(s2)}`, 'i')
  const mkts = Object.values(B.mkts)
  const strict = s.length < 2 || [...Object.values(TEAMS), ...PLAYERS, ...Object.values(COMPS)].some((x) => start.test(x.name)) || mkts.some((m) => start2.test(m.name) || m.selIds.some((id) => start2.test(B.sels[id].name)))
  const has = (t: string) => (strict ? start.test(t) : t.toLowerCase().includes(s))
  const has2 = (t: string) => (strict ? start2.test(t) : t.toLowerCase().includes(s2))
  const fx = FIXTURES.filter((f) => has(TEAMS[f.home].name) || has(TEAMS[f.away].name) || has(COMPS[f.comp].name)).sort((a, b) => +B.matches[b.id].live - +B.matches[a.id].live).slice(0, 3)
  const teams = Object.values(TEAMS).filter((t) => has(t.name) && FIXTURES.some((f) => f.home === t.id || f.away === t.id)).slice(0, 3)
  const players = PLAYERS.filter((p) => has(p.name)).slice(0, 3)
  const comps = Object.values(COMPS).filter((c) => has(c.name)).slice(0, 3)
  // markets come from the book itself: every open market of every match, live ones first. A team or player name is
  // answered by the groups above, so it does not list that name again market by market.
  const named = Object.values(TEAMS).some((t) => has(t.name)) || players.length > 0
  const mk: Found['mk'] = []
  const perMatch: Record<string, number> = {}
  for (const m of named ? [] : mkts.sort((x, y) => +B.matches[y.match].live - +B.matches[x.match].live)) {
    if (mk.length >= 3) break
    const hitSel = m.selIds.find((id) => has2(B.sels[id].name))
    if (!has2(m.name) && !hitSel) continue
    if ((perMatch[m.match] = (perMatch[m.match] ?? 0) + 1) > 2) continue
    const sel = hitSel ?? m.selIds.find((id) => !m.defLine || B.sels[id].line === m.defLine) ?? m.selIds[0]
    mk.push({ mkt: m.id, sel, name: m.name, tab: m.tabs[m.tabs.length - 1] })
  }
  return { fx, teams, players, comps, mk, empty: !fx.length && !teams.length && !players.length && !comps.length && !mk.length }
}
export function SearchOverlay() {
  const { search, set } = useApp()
  const [q, setQ] = useState('')
  const [act, setAct] = useState(-1)
  const nav = useGo()
  const phone = useIsPhone()
  const ref = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const matches = useBook((s) => s.matches)
  const { mounted, closing } = usePresence(search, EXIT.pop)
  const close = () => set({ search: false })
  useOverlay(search, box, close, { lock: phone, first: true })
  useEffect(() => { if (search) { setQ(''); setAct(-1) } }, [search])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT') { e.preventDefault(); set({ search: true }) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const res = useMemo(() => {
    const r = find(q)
    if (!r || !r.empty) return r
    // a near miss ("arsnal") is answered straight away with the name it most likely meant
    const s = q.trim().toLowerCase()
    const near = Object.values(TEAMS).map((t) => t.name).find((n) => n.toLowerCase().slice(0, 2) === s.slice(0, 2) && Math.abs(n.length - s.length) < 4)
    const r2 = near ? find(near) : null
    return r2 && !r2.empty ? { ...r2, shown: near } : r
  }, [q])
  if (!mounted) return null
  const go = (to: string) => () => { close(); nav(to) }
  const type = (v: string) => { setQ(v); setAct(-1); ref.current?.focus() }
  // every result is one row in one list, so the arrow keys walk them in the order they are shown
  const opens: (() => void)[] = []
  const row = (open: () => void, extra?: string) => { const i = opens.push(open) - 1; return { id: `so-r-${i}`, className: cx('so-row', extra, act === i && 'act'), onClick: open } }
  const link = (open: () => void) => ({ role: 'link', tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open() } } })
  const move = (i: number) => { setAct(i); requestAnimationFrame(() => document.getElementById(`so-r-${i}`)?.scrollIntoView({ block: 'nearest' })) }
  const onKey = (e: React.KeyboardEvent) => {
    const n = opens.length
    if (e.key === 'ArrowDown') { e.preventDefault(); if (n) move(Math.min(n - 1, act + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(Math.max(-1, act - 1)) }
    else if (e.key === 'Enter' && n) { e.preventDefault(); opens[Math.max(0, act)]() }
  }
  // on desktop the search field opens exactly where the sports bar is, so the bar appears to become the field
  const bar = document.querySelector('.page > .snav')?.getBoundingClientRect()
  const at = bar && bar.width > 500 && bar.top >= 64 ? { top: bar.top, left: bar.left, width: bar.width, transform: 'none' } : null
  const sels = useBook.getState().sels
  return (
    <div className={cx('search-ov', closing && 'is-closing')} role="dialog" aria-modal="true" aria-label="Search">
      <div className={cx('scrim', closing && 'is-closing')} onClick={close} />
      <div ref={box} tabIndex={-1} className={cx('so-box', at && 'anch', closing && 'is-closing')} style={at ?? undefined}>
        <label className="search big"><MagnifyingGlass size={20} /><input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setAct(-1) }} onKeyDown={onKey} placeholder={phone ? 'Teams, players, markets' : 'Search teams, players, competitions or markets'} aria-controls="so-list" aria-activedescendant={act >= 0 ? `so-r-${act}` : undefined} autoComplete="off" /><kbd>Esc</kbd><button type="button" className="so-x" aria-label="Close search" onClick={close}>Cancel</button></label>
        <div id="so-list" className="so-res scroll">
          {!res && <div className="so-try"><span className="micro">Try</span>{['Arsenal', 'Okonkaro', 'LaLiga', 'corners', 'over 2.5'].map((w) => <button key={w} className="chip" onClick={() => type(w)}>{w}</button>)}</div>}
          {res?.empty && <><div className="so-note">No results for “{q.trim()}”.</div><div className="so-try"><span className="micro">Try</span>{['Arsenal', 'Okonkaro', 'LaLiga', 'corners', 'over 2.5'].map((w) => <button key={w} className="chip" onClick={() => type(w)}>{w}</button>)}</div></>}
          {res?.shown && <div className="so-note meta">Showing results for <b>{res.shown}</b></div>}
          {res && res.teams.length > 0 && <><div className="micro sub">Teams</div>{res.teams.map((t) => { const f = FIXTURES.find((x) => x.home === t.id || x.away === t.id)!; return <button key={t.id} {...row(go(`/match/${f.id}`))}><Crest id={t.id} /><b>{t.name}</b><span className="meta">Next: {matchName(matches[f.id])}</span></button> })}</>}
          {res && res.players.length > 0 && <><div className="micro sub">Players</div>{res.players.map((p) => <button key={p.name} {...row(go('/match/ars-bha?tab=Goalscorers'))}><Crest id={p.team} /><b>{p.name}</b><span className="meta">{TEAMS[p.team].short} · Anytime goalscorer {fmt(p.any)}</span></button>)}</>}
          {res && res.comps.length > 0 && <><div className="micro sub">Competitions</div>{res.comps.map((c) => <button key={c.id} {...row(go(c.sport === 'football' ? `/football?comp=${c.id}` : `/sport/${c.sport}?comp=${c.id}`))}><b>{c.name}</b><span className="meta">{c.country}</span></button>)}</>}
          {res && res.fx.length > 0 && <><div className="micro sub">Matches</div>{res.fx.map((f) => {
            const m = matches[f.id], open = go(`/match/${f.id}`)
            const { ids, heads } = rowSels(m, 'main')
            const vs = `${TEAMS[f.home].name} v ${TEAMS[f.away].name}`
            // each price carries its outcome in words, as in every list: never a bare number
            return <div key={f.id} {...row(open, 'm')} {...link(open)}><span><b>{matchName(m)}</b><span className="meta">{COMPS[f.comp].name} · {m.live ? 'Live' : `${f.day} ${f.time}`}</span></span><span className={cx('px', ids.length === 2 && 'two')}>{ids.map((id, i) => <OddsCell key={id} id={id} label={heads[i]} match={vs} />)}</span></div>
          })}</>}
          {res && res.mk.length > 0 && <><div className="micro sub">Markets</div>{(() => {
            // decided once for the group: when any two rows are the same market and line, the match is what tells them
            // apart, so the match leads on every row; otherwise the market leads on every row
            const keys = res.mk.map((x) => `${x.name}|${sels[x.sel].name}`)
            const same = new Set(keys).size < keys.length
            return res.mk.map((k) => {
            const sel = sels[k.sel], m = matches[sel.match], open = go(`/match/${sel.match}?tab=${k.tab}`)
            const what = `${k.name} · ${sel.name}`, where = `${matchName(m)}${m.live ? ' · Live' : ''}`
            return <div key={k.mkt} {...row(open, 'm')} {...link(open)}><span><b>{same ? where : what}</b><span className="meta">{same ? what : where}</span></span><span className="px one"><OddsCell id={k.sel} match={`${TEAMS[m.fx.home].name} v ${TEAMS[m.fx.away].name}`} /></span></div>
            })
          })()}</>}
        </div>
      </div>
    </div>
  )
}
