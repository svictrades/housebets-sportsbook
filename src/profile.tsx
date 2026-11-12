// Player profile: opens from Log In or the account chip. A compact record of the player's own sample bets.
import { useEffect, useMemo } from 'react'
import { SignOut, X } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { money } from './book'
import { Bet, useApp } from './store'
import { Tideline, Usdt } from './ui'

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const SHORT: Record<string, string> = { 'Both teams to score': 'BTTS' }
const SPAN = 31
export function Profile() {
  const { profile, user, set, bets, balance } = useApp()
  const [, nav] = useLocation()
  useEffect(() => {
    if (!profile) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && set({ profile: false })
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [profile])
  const st = useMemo(() => {
    const done = bets.filter((b) => b.status !== 'open' && b.daysAgo < SPAN).sort((a, b) => b.daysAgo - a.daysAgo) // oldest first
    const staked = done.reduce((a, b) => a + b.stake, 0)
    const returned = done.reduce((a, b) => a + b.returns, 0)
    const decided = done.filter((b) => b.status === 'won' || b.status === 'lost')
    const won = decided.filter((b) => b.status === 'won')
    let run = 0
    const curve: [number, number][] = [[-SPAN, 0]]
    for (const b of done) { run += b.returns - b.stake; curve.push([-b.daysAgo, +run.toFixed(2)]) }
    const count = (key: (b: Bet) => string) => {
      const m: Record<string, { n: number; staked: number }> = {}
      for (const b of done) { const k = key(b); (m[k] ??= { n: 0, staked: 0 }); m[k].n++; m[k].staked += b.stake }
      return Object.entries(m).sort((a, b) => b[1].n - a[1].n)
    }
    const byNet = [...done].sort((a, b) => b.returns - b.stake - (a.returns - a.stake))
    return {
      n: done.length, staked, returned, net: returned - staked, rate: decided.length ? won.length / decided.length : 0,
      avgStake: done.length ? staked / done.length : 0, avgOdds: done.length ? done.reduce((a, b) => a + b.odds, 0) / done.length : 0,
      curve, sports: count((b) => b.sport), markets: count((b) => b.market).slice(0, 4), form: done.slice(-12), best: byNet[0], worst: byNet[byNet.length - 1],
    }
  }, [bets])
  if (!profile) return null
  const open = bets.filter((b) => b.status === 'open').length
  const sign = (n: number) => `${n >= 0 ? '+' : '−'}${money(Math.abs(n))}`
  const alias = user?.alias ?? 'Demo player'
  const initials = alias.split(/[^a-zA-Z]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'DP'
  const marks = [st.best, st.worst].filter((b): b is Bet => !!b && b.returns !== b.stake)
  return (
    <>
      <div className="scrim" onClick={() => set({ profile: false })} />
      <aside className="profile" role="dialog" aria-modal="true" aria-label="Your profile">
        <div className="pr-h">
          <i className="pav" aria-hidden>{initials}</i>
          <div><b>{alias}</b><div className="meta">Demo player · sample data, no real money</div></div>
          <button className="ib" aria-label="Close profile" onClick={() => set({ profile: false })}><X size={18} /></button>
        </div>
        <div className="scroll pr-b">
          <div className="pr-bal">
            <div><span className="meta">Demo balance</span><b className="d"><Usdt />{money(balance)}</b></div>
            <button className="btn" onClick={() => { set({ profile: false, sheet: window.matchMedia('(max-width: 1023px)').matches ? 'bets' : null }); nav('/bets') }}>My bets · {open} open</button>
          </div>

          <div className="micro sub first">Your betting record · last 30 days</div>
          <div className="kpis">
            <div><span className="meta">Net result</span><b className="d">{sign(st.net)}</b></div>
            <div><span className="meta">Settled bets</span><b className="d">{st.n}</b></div>
            <div><span className="meta">Win rate</span><b className="d">{Math.round(st.rate * 100)}%</b></div>
            <div><span className="meta">Average stake</span><b className="d">{money(st.avgStake)}</b></div>
            <div><span className="meta">Average odds</span><b className="d">{st.avgOdds.toFixed(2)}</b></div>
            <div><span className="meta">Staked</span><b className="d">{money(st.staked)}</b></div>
          </div>

          <div className="micro sub">Running result</div>
          <div className="pr-chart">
            <Tideline pts={st.curve} h={96} x0={-SPAN} xNow={0} level={0} marks={marks.map((b) => -b.daysAgo)} minSpan={40} draw />
            <div className="micro pr-ax">
              <span style={{ left: 0 }}>30 days ago</span>
              <span style={{ right: 0 }}>Today</span>
            </div>
            <div className="meta pr-note"><span>The dashed line is break-even.</span>{st.best && <span>Best <b className="d">{sign(st.best.returns - st.best.stake)}</b> · Worst <b className="d">{sign(st.worst.returns - st.worst.stake)}</b></span>}</div>
          </div>

          <div className="micro sub">Most-bet sports</div>
          <div className="bars">
            {st.sports.map(([k, v]) => (
              <div className="brow" key={k}><span>{cap(k)}</span><i><u style={{ width: `${(v.n / st.n) * 100}%` }} /></i><b className="d">{v.n}</b><span className="meta d">{Math.round((v.n / st.n) * 100)}%</span></div>
            ))}
          </div>

          <div className="micro sub">Most-bet markets</div>
          <div className="bars">
            {st.markets.map(([k, v]) => (
              <div className="brow" key={k}><span title={k}>{SHORT[k] ?? k}</span><i><u style={{ width: `${(v.n / st.markets[0][1].n) * 100}%` }} /></i><b className="d">{v.n}</b><span className="meta d">{money(v.staked)}</span></div>
            ))}
          </div>

          <div className="micro sub">Recent form</div>
          <div className="form">
            {st.form.map((b) => <i key={b.id} className={b.status} title={`${b.sel} · ${b.match} · ${b.status}`}>{b.status === 'won' ? 'W' : b.status === 'lost' ? 'L' : b.status === 'cashed' ? 'C' : 'V'}</i>)}
            <span className="meta">Oldest to newest · W won · L lost · C cashed out · V void</span>
          </div>
          {st.best && <div className="pr-best"><span className="meta">Best result</span><span><b>{st.best.sel}</b> <span className="meta">· {st.best.match} at {st.best.odds.toFixed(2)}</span></span><b className="d">{sign(st.best.returns - st.best.stake)}</b></div>}

          <button className="btn out" onClick={() => { set({ user: null, profile: false }); useApp.getState().toast('Signed out of the demo player.') }}><SignOut size={16} /> Log out</button>
          <div className="fine">Your own betting record, built from the sample bets in My bets. No real money.</div>
        </div>
      </aside>
    </>
  )
}
