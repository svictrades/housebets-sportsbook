import { useEffect, useRef } from 'react'
import { Route, Router, Switch, useLocation } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { suspendMarket, suspendMatch, tick, useBook, scoreGoal, shorten } from './book'
import { useApp } from './store'
import { Bets, SportPage, Home, Live } from './pages'
import { Match } from './match'
import { Stats } from './stats'
import { Wallet } from './account'
import { BetCard, BetStrip } from './betcard'
import { FIXTURES } from './data'
import type { Sport } from './data'
import { MenuSheet, Panel, PhoneHeader, Rail, ScenesPop, SearchOverlay, Sheet, SlipBar, TabBar, Toasts, TopBar, useShell } from './shell'
import { cx, useIsPhone } from './ui'

// hash routes, with the query string kept out of route matching
const useHashPath = (): ReturnType<typeof useHashLocation> => {
  const [loc, nav] = useHashLocation()
  return [loc.split('?')[0], nav]
}

function Frame() {
  const phone = useIsPhone()
  const [loc] = useLocation()
  const main = useRef<HTMLElement>(null)
  const shell = useShell()
  useEffect(() => { main.current?.scrollTo(0, 0); window.scrollTo(0, 0) }, [loc])
  // which sport the rail lights: the sport page itself, or the sport of the match being looked at
  const railSport = loc === '/football' ? 'football' : loc.startsWith('/sport/') ? loc.slice(7) : loc.startsWith('/match/') ? FIXTURES.find((f) => f.id === loc.slice(7))?.sport ?? null : null
  const skip = <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus() }}>Skip to content</a>
  const routes = (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/live" component={Live} />
      <Route path="/football"><SportPage sport="football" /></Route>
      <Route path="/sport/:id">{(p) => (['tennis', 'basketball', 'esports'].includes(p.id) ? <SportPage key={p.id} sport={p.id as Sport} /> : <SportPage sport="football" />)}</Route>
      <Route path="/match/:id">{(p) => <Match key={p.id} id={p.id} />}</Route>
      <Route path="/bets" component={Bets} />
      <Route path="/stats" component={Stats} />
      <Route><Home /></Route>
    </Switch>
  )
  if (phone)
    return (
      <div className="phone">
        {skip}
        <PhoneHeader />
        <BetStrip />
        <main ref={main} key={loc} id="main" tabIndex={-1} className="main fade">{routes}</main>
        <SlipBar />
        <Sheet />
        <MenuSheet />
        <TabBar />
        <Wallet />
        <BetCard />
        <SearchOverlay />
        <ScenesPop />
        <Toasts />
      </div>
    )
  return (
    <div className={cx('desk', shell.rail && 'rail-open', !shell.panel && 'panel-closed')}>
      {skip}
      <TopBar />
      <Rail sport={railSport} />
      <div className="maincol"><BetStrip /><main ref={main} id="main" tabIndex={-1} className="main"><div key={loc} className="fade">{routes}</div></main></div>
      <Panel />
      <ScenesPop />
      <BetCard />
      <SearchOverlay />
      <Toasts />
    </div>
  )
}

export function App() {
  useEffect(() => {
    // deep links for reviewers, e.g. #/match/ars-bha?scene=goal
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
    // ?freeze=1 holds the book still (no price moves, no scripted events), so two screenshots of one page can be compared
    const frozen = params.get('freeze') === '1'
    const t = frozen ? 0 : window.setInterval(tick, 1000)
    // a little story plays by itself, so the states show without any setup
    const timers = frozen ? [] : [
      setTimeout(() => suspendMarket('ars-bha:tc', 'Corner check', 6000), 20000),
      setTimeout(() => { if (!useBook.getState().matches['ars-bha'].pause) suspendMatch('ars-bha', 'Penalty check', 7000) }, 75000),
    ]
    const scene = params.get('scene')
    if (params.get('rail') === 'open') useShell.setState({ rail: true })
    if (params.get('panel') === 'closed') useShell.setState({ panel: false })
    if (params.get('panel') === 'bets') useApp.getState().set(window.matchMedia('(max-width: 1023px)').matches ? { sheet: 'bets' } : { panelTab: 'bets' })
    // on the phone the demo controls live in the Menu: the link opens it with them unfolded
    if (scene === 'demo') timers.push(setTimeout(() => { const ph = window.matchMedia('(max-width: 1023px)').matches; if (ph) useShell.setState({ demo: true }); useApp.getState().set(ph ? { menu: true } : { scenes: true }) }, 400))
    if (scene === 'search') timers.push(setTimeout(() => useApp.getState().set({ search: true }), 400))
    if (scene === 'goal') timers.push(setTimeout(() => scoreGoal('ars-bha', 0), 1500))
    if (scene === 'lull') useBook.getState().set({ lull: true })
    if (scene === 'fail') useApp.getState().set({ failNext: true })
    if (scene === 'card') timers.push(setTimeout(() => useApp.getState().set({ card: 'HB-4T8KD' }), 400))
    if (scene === 'cardwon') timers.push(setTimeout(() => useApp.getState().set({ card: useApp.getState().bets.find((b) => b.status === 'won')?.id ?? null }), 400))
    if (scene === 'cardlost') timers.push(setTimeout(() => useApp.getState().set({ card: useApp.getState().bets.find((b) => b.status === 'lost')?.id ?? null }), 400))
    if (scene === 'profile' || scene === 'stats') window.location.hash = '#/stats'
    if (scene === 'wallet') timers.push(setTimeout(() => useApp.getState().set({ wallet: true }), 400))
    if (scene === 'loggedout') useApp.getState().logout()
    if (scene === 'slip') timers.push(setTimeout(() => {
      const a = useApp.getState()
      a.toggle('ars-bha:main:h'); a.toggle('liv-mun:main:d')
      a.setStake('ars-bha:main:h', '25.00'); a.setStake('liv-mun:main:d', '10.00')
      shorten('liv-mun:main:d')
      if (window.matchMedia('(max-width: 1023px)').matches) a.set({ sheet: 'slip' })
    }, 400))
    return () => { clearInterval(t); timers.forEach(clearTimeout) }
  }, [])
  return <Router hook={useHashPath}><Frame /></Router>
}
