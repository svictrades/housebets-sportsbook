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
        <PhoneHeader />
        <BetStrip />
        <main ref={main} key={loc} className="main fade">{routes}</main>
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
      <TopBar />
      <Rail sport={loc.startsWith('/sport/') ? loc.slice(7) : null} />
      <div className="maincol"><BetStrip /><main ref={main} className="main"><div key={loc} className="fade">{routes}</div></main></div>
      <Panel />
      <ScenesPop />
      <Wallet />
      <BetCard />
      <SearchOverlay />
      <Toasts />
    </div>
  )
}

export function App() {
  useEffect(() => {
    const t = setInterval(tick, 1000)
    // a little story plays by itself, so the states show without any setup
    const timers = [
      setTimeout(() => suspendMarket('ars-bha:tc', 'Corner check', 6000), 20000),
      setTimeout(() => { if (!useBook.getState().matches['ars-bha'].pause) suspendMatch('ars-bha', 'Penalty check', 7000) }, 75000),
    ]
    // deep links for reviewers, e.g. #/match/ars-bha?scene=goal
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
    const scene = params.get('scene')
    if (params.get('rail') === 'open') useShell.setState({ rail: true })
    if (params.get('panel') === 'closed') useShell.setState({ panel: false })
    if (scene === 'demo') timers.push(setTimeout(() => useApp.getState().set(window.matchMedia('(max-width: 1023px)').matches ? { menu: true } : { scenes: true }), 400))
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
