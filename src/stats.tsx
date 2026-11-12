// Statistics: the signed-in player's own betting record, built from the sample bets in My bets.
// Chart colours were checked with the palette validator against the #041015 surface (up #18a886, down #e0603f);
// direction is also carried by position above or below the baseline, and every value is printed or in the readout.
import { useMemo, useState } from 'react'
import { CaretDown, CaretRight, Receipt, SignOut } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { money } from './book'
import { Bet, useApp } from './store'
import { dayAt } from './data'
import { cx, Empty, useIsPhone, useWidth, Usdt } from './ui'

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const sign = (n: number) => `${n > 0.004 ? '+' : n < -0.004 ? '−' : ''}${money(Math.abs(n))}`
const dm = (d: Date) => `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`
const RANGES = [['7', '7 days', 7], ['14', '14 days', 14], ['30', '30 days', 30]] as const
const BANDS: [string, number, number][] = [['Under 1.60', 0, 1.6], ['1.60 to 1.99', 1.6, 2], ['2.00 to 2.99', 2, 3], ['3.00 and over', 3, 999]]
type Day = { ago: number; date: Date; net: number; cum: number; bets: Bet[] }

function niceTicks(lo: number, hi: number) {
  const span = Math.max(1, hi - lo)
  const step = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000].find((s) => span / s <= 4) ?? 5000
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step
  const out: number[] = []
  for (let v = a; v <= b + 0.001; v += step) out.push(v)
  return out
}

// Running result as a line, with the result of each day as columns underneath on the same time axis.
function ResultChart({ days }: { days: Day[] }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [at, setAt] = useState<number | null>(null)
  const L = 46, R = 14, H1 = 208, H2 = 76
  const iw = Math.max(10, w - L - R)
  const n = days.length
  const x = (i: number) => L + (n > 1 ? (i / (n - 1)) * iw : iw / 2)
  const ticks = niceTicks(Math.min(0, ...days.map((d) => d.cum)), Math.max(0, ...days.map((d) => d.cum)))
  const lo = ticks[0], hi = ticks[ticks.length - 1]
  const y = (v: number) => 10 + (1 - (v - lo) / (hi - lo || 1)) * (H1 - 20)
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.cum).toFixed(1)}`).join('')
  const area = `${line}L${x(n - 1).toFixed(1)} ${y(0)}L${x(0).toFixed(1)} ${y(0)}Z`
  const maxNet = Math.max(1, ...days.map((d) => Math.abs(d.net)))
  const mid = H2 / 2
  const bw = Math.max(3, Math.min(24, iw / n - 2))
  const bar = (d: Day, i: number) => {
    if (Math.abs(d.net) < 0.005) return null
    const h = Math.max(2, (Math.abs(d.net) / maxNet) * (mid - 6))
    const x0 = x(i) - bw / 2, x1 = x(i) + bw / 2, r = Math.min(4, bw / 2, h)
    const up = d.net > 0
    const tip = up ? mid - h : mid + h, k = up ? 1 : -1
    // rounded at the data end, square at the baseline
    return <path key={d.ago} className={cx('sx-bar', up ? 'u' : 'dn', at === i && 'hi')} d={`M${x0} ${mid}V${tip + k * r}Q${x0} ${tip} ${x0 + r} ${tip}H${x1 - r}Q${x1} ${tip} ${x1} ${tip + k * r}V${mid}Z`} />
  }
  const move = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    setAt(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left - L) / iw) * (n - 1)))))
  }
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setAt((a) => Math.max(0, (a ?? n - 1) - 1))
    if (e.key === 'ArrowRight') setAt((a) => Math.min(n - 1, (a ?? n - 1) + 1))
    if (e.key === 'Escape') setAt(null)
  }
  const every = Math.max(1, Math.ceil(58 / (iw / Math.max(1, n - 1)))) // as many date labels as fit without touching
  const cur = at != null ? days[at] : null
  const last = days[n - 1]
  const tipLeft = cur ? Math.max(4, Math.min(w - 196, x(at!) + (x(at!) > w * 0.62 ? -200 : 14))) : 0
  return (
    <div ref={ref} className="sx-chart" tabIndex={0} role="img" aria-label={`Running result over ${n - 1} days, ending at ${sign(last.cum)} USDT. Use the arrow keys to read each day.`}
      onPointerMove={move} onPointerLeave={() => setAt(null)} onKeyDown={key} onBlur={() => setAt(null)}>
      {w > 0 && (
        <>
          <svg width={w} height={H1} className="sx-line">
            {ticks.map((t) => <g key={t}><line x1={L} x2={w - R} y1={y(t)} y2={y(t)} className={cx('sx-grid', t === 0 && 'zero')} /><text x={L - 10} y={y(t) + 4} textAnchor="end" className="sx-tick">{t > 0 ? '+' : t < 0 ? '−' : ''}{Math.abs(t)}</text></g>)}
            <path d={area} className="sx-area" />
            <path d={line} className="sx-path" pathLength={1} />
            {cur && <line x1={x(at!)} x2={x(at!)} y1={4} y2={H1} className="sx-cross" />}
            {cur && <circle cx={x(at!)} cy={y(cur.cum)} r={4} className="sx-dot" />}
            <circle cx={x(n - 1)} cy={y(last.cum)} r={4.5} className="sx-dot end" />
            {!cur && <text x={x(n - 1) - 10} y={y(last.cum) - 12 < 14 ? y(last.cum) + 20 : y(last.cum) - 12} textAnchor="end" className="sx-endl">{sign(last.cum)}</text>}
          </svg>
          <div className="micro sx-sub" style={{ paddingLeft: L }}>Result of each day</div>
          <svg width={w} height={H2} className="sx-bars">
            <line x1={L} x2={w - R} y1={mid} y2={mid} className="sx-grid zero" />
            {cur && <line x1={x(at!)} x2={x(at!)} y1={0} y2={H2} className="sx-cross" />}
            {days.map(bar)}
          </svg>
          <div className="sx-x micro" aria-hidden>
            {days.map((d, i) => ((n - 1 - i) % every === 0 ? <span key={d.ago} style={{ left: x(i) }} className={cx(i === n - 1 && 'r', i === 0 && 'l')}>{i === n - 1 ? 'Today' : dm(d.date)}</span> : null))}
          </div>
          {cur && (
            <div className="sx-tip" style={{ left: tipLeft }} role="status">
              <span className="meta">{cur.ago === 0 ? 'Today' : dm(cur.date)}</span>
              <div><b className="d">{sign(cur.cum)}</b><span className="meta"><i className="k line" />Running result</span></div>
              <div><b className="d">{sign(cur.net)}</b><span className="meta"><i className={cx('k', cur.net >= 0 ? 'u' : 'dn')} />That day · {cur.bets.length} bet{cur.bets.length === 1 ? '' : 's'}</span></div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return <div className="sx-tile"><span className="meta">{label}</span><b className="d">{value}</b>{sub && <span className="meta sub">{sub}</span>}</div>
}
function BarRow({ name, share, a, b, title }: { name: string; share: number; a: React.ReactNode; b: React.ReactNode; title: string }) {
  return (
    <div className="sx-row" title={title}>
      <span className="nm">{name}</span>
      <i className="trk"><u style={{ width: `${Math.max(2, share * 100)}%` }} /></i>
      <b className="d">{a}</b>
      <span className="meta d">{b}</span>
    </div>
  )
}

export function Stats() {
  const { user, bets, balance, login, logout, set } = useApp()
  const [, nav] = useLocation()
  const phone = useIsPhone()
  const [range, setRange] = useState<string>('30')
  const [sport, setSport] = useState('all')
  const span = RANGES.find((r) => r[0] === range)![2]
  const st = useMemo(() => {
    const done = bets.filter((b) => b.status !== 'open' && b.daysAgo <= span && (sport === 'all' || b.sport === sport)).sort((a, b) => b.daysAgo - a.daysAgo) // oldest first
    const staked = done.reduce((a, b) => a + b.stake, 0)
    const returned = done.reduce((a, b) => a + b.returns, 0)
    const decided = done.filter((b) => b.status === 'won' || b.status === 'lost')
    const won = decided.filter((b) => b.status === 'won')
    let run = 0
    const days: Day[] = []
    for (let ago = span; ago >= 0; ago--) {
      const list = done.filter((b) => b.daysAgo === ago)
      const net = list.reduce((a, b) => a + b.returns - b.stake, 0)
      run += net
      days.push({ ago, date: dayAt(-ago), net, cum: +run.toFixed(2), bets: list })
    }
    const group = (key: (b: Bet) => string) => {
      const m: Record<string, { n: number; staked: number; net: number }> = {}
      for (const b of done) { const k = key(b); (m[k] ??= { n: 0, staked: 0, net: 0 }); m[k].n++; m[k].staked += b.stake; m[k].net += b.returns - b.stake }
      return Object.entries(m).sort((a, b) => b[1].n - a[1].n)
    }
    const bands = BANDS.map(([label, a, b]) => { const l = decided.filter((x) => x.odds >= a && x.odds < b); return { label, n: l.length, won: l.filter((x) => x.status === 'won').length } })
    const byNet = [...done].filter((b) => b.returns !== b.stake).sort((a, b) => b.returns - b.stake - (a.returns - a.stake))
    let streak = 0, best = 0, curRun = 0
    for (const b of decided) { if (b.status === 'won') { curRun++; best = Math.max(best, curRun) } else curRun = 0 }
    for (let i = decided.length - 1; i >= 0 && decided[i].status === decided[decided.length - 1].status; i--) streak++
    return {
      n: done.length, staked, returned, net: returned - staked, rate: decided.length ? won.length / decided.length : 0, wonN: won.length, decidedN: decided.length,
      avgStake: done.length ? staked / done.length : 0, avgOdds: done.length ? done.reduce((a, b) => a + b.odds, 0) / done.length : 0,
      days, sports: group((b) => b.sport), markets: group((b) => b.market).slice(0, 5), bands, form: done.slice(-14),
      wins: byNet.filter((b) => b.returns > b.stake).slice(0, 3), losses: byNet.filter((b) => b.returns < b.stake).slice(-3).reverse(),
      streak, streakKind: decided.length ? decided[decided.length - 1].status : null, bestRun: best,
      activeDays: days.filter((d) => d.bets.length).length,
    }
  }, [bets, span, sport])
  if (!user)
    return (
      <div className="page stats">
        <h1 className="title">Statistics</h1>
        <Empty title="Log in to see your statistics">Your results, your sports and your best bets, all in one place.<br /><button className="btn pri sx-login" onClick={login}>Log in as the demo player</button></Empty>
      </div>
    )
  const open = bets.filter((b) => b.status === 'open')
  const atRisk = open.reduce((a, b) => a + b.stake, 0)
  const roi = st.staked ? (st.net / st.staked) * 100 : 0
  const initials = user.alias.split(/[^a-zA-Z]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'DP'
  const openCard = (id: string) => set({ card: id })
  const betRow = (b: Bet) => (
    <button className="sx-bet" key={b.id} onClick={() => openCard(b.id)} aria-label={`Open bet card for ${b.sel}`}>
      <span><b>{b.sel}</b> <span className="meta">· {b.market}</span><span className="meta blk">{b.match} · at {b.odds.toFixed(2)}</span></span>
      <b className="d">{sign(b.returns - b.stake)}</b>
      <CaretRight size={13} />
    </button>
  )
  return (
    <div className="page stats">
      <header className="sx-head">
        <i className="sx-av" aria-hidden>{initials}</i>
        <div className="sx-who"><h1 className="title">Statistics</h1><span className="meta">{user.alias} · demo player · sample data, no real money</span></div>
        <div className="sx-acts">
          <button className="btn" onClick={() => { if (phone) set({ sheet: 'bets' }); else nav('/bets') }}><Receipt size={16} /> My bets · {open.length} open</button>
          <button className="btn" onClick={() => { logout(); nav('/') }}><SignOut size={16} /> Log out</button>
        </div>
      </header>
      <div className="filters sx-filters">
        {RANGES.map(([id, label]) => <button key={id} className={cx('chip', range === id && 'on')} aria-pressed={range === id} onClick={() => setRange(id)}>{label}</button>)}
        <label className="chip sel push"><select value={sport} onChange={(e) => setSport(e.target.value)} aria-label="Sport"><option value="all">All sports</option><option value="football">Football</option><option value="tennis">Tennis</option><option value="basketball">Basketball</option><option value="esports">Esports</option></select><CaretDown size={12} /></label>
      </div>

      {st.n === 0 ? (
        <Empty title="No settled bets in this range"><button className="lnk" onClick={() => { setRange('30'); setSport('all') }}>Show 30 days, all sports</button></Empty>
      ) : (
        <>
          <section className="sx-top">
            <div className="sx-hero">
              <span className="meta">Net result · last {span} days</span>
              <b className="d">{sign(st.net)}<small>USDT</small></b>
              <span className="sx-delta"><em className={cx('pc', roi >= 0 ? 'u' : 'dn')}>{roi >= 0 ? '+' : '−'}{Math.abs(roi).toFixed(1)}%</em><span className="meta">return on {money(st.staked)} staked</span></span>
            </div>
            <div className="sx-tiles">
              <Tile label="Settled bets" value={st.n} sub={`on ${st.activeDays} of ${span + 1} days`} />
              <Tile label="Win rate" value={`${Math.round(st.rate * 100)}%`} sub={`${st.wonN} of ${st.decidedN} decided`} />
              <Tile label="Average stake" value={<><Usdt />{money(st.avgStake)}</>} />
              <Tile label="Average odds" value={st.avgOdds.toFixed(2)} />
              <Tile label="Returned" value={<><Usdt />{money(st.returned)}</>} />
              <Tile label="Balance" value={<><Usdt />{money(balance)}</>} sub={open.length ? `${money(atRisk)} in ${open.length} open bet${open.length > 1 ? 's' : ''}` : 'no open bets'} />
            </div>
          </section>

          <section className="sx-sec">
            <div className="sx-h"><h2 className="h">Running result</h2><span className="meta">Profit or loss added up bet by bet, in USDT. Hover or use the arrow keys to read a day.</span></div>
            <ResultChart days={st.days} />
          </section>

          <div className="sx-grid2">
            <section className="sx-sec">
              <div className="sx-h"><h2 className="h">Most-bet sports</h2><span className="meta cols"><span>Bets</span><span>Result</span></span></div>
              {st.sports.map(([k, v]) => <BarRow key={k} name={cap(k)} share={v.n / st.sports[0][1].n} a={v.n} b={sign(v.net)} title={`${cap(k)}: ${v.n} bets, ${money(v.staked)} staked, result ${sign(v.net)}`} />)}
            </section>
            <section className="sx-sec">
              <div className="sx-h"><h2 className="h">Most-bet markets</h2><span className="meta cols"><span>Bets</span><span>Result</span></span></div>
              {st.markets.map(([k, v]) => <BarRow key={k} name={k} share={v.n / st.markets[0][1].n} a={v.n} b={sign(v.net)} title={`${k}: ${v.n} bets, ${money(v.staked)} staked, result ${sign(v.net)}`} />)}
            </section>
            <section className="sx-sec">
              <div className="sx-h"><h2 className="h">Win rate by odds</h2><span className="meta cols"><span>Won</span><span>Rate</span></span></div>
              {st.bands.map((b) => (
                <div className={cx('sx-row meter', !b.n && 'none')} key={b.label} title={`${b.label}: won ${b.won} of ${b.n}`}>
                  <span className="nm">{b.label}</span>
                  <i className="trk"><u style={{ width: `${b.n ? Math.max(2, (b.won / b.n) * 100) : 0}%` }} /></i>
                  <b className="d">{b.n ? `${b.won}/${b.n}` : '—'}</b>
                  <span className="meta d">{b.n ? `${Math.round((b.won / b.n) * 100)}%` : ''}</span>
                </div>
              ))}
            </section>
            <section className="sx-sec">
              <div className="sx-h"><h2 className="h">Recent form</h2><span className="meta">oldest to newest</span></div>
              <div className="sx-form">
                {st.form.map((b) => <button key={b.id} className={b.status} onClick={() => openCard(b.id)} aria-label={`${b.sel}, ${b.match}, ${b.status}. Open bet card`} title={`${b.sel} · ${b.match}`}>{b.status === 'won' ? 'W' : b.status === 'lost' ? 'L' : b.status === 'cashed' ? 'C' : 'V'}</button>)}
              </div>
              <div className="meta sx-key">W won · L lost · C cashed out · V void</div>
              <div className="sx-mini">
                <div><span className="meta">Current run</span><b className="d">{st.streak} {st.streakKind === 'won' ? (st.streak === 1 ? 'win' : 'wins') : st.streak === 1 ? 'loss' : 'losses'}</b></div>
                <div><span className="meta">Longest winning run</span><b className="d">{st.bestRun}</b></div>
              </div>
            </section>
            <section className="sx-sec">
              <div className="sx-h"><h2 className="h">Best results</h2></div>
              {st.wins.length ? st.wins.map(betRow) : <div className="hint meta">No winning bets in this range.</div>}
            </section>
            <section className="sx-sec">
              <div className="sx-h"><h2 className="h">Toughest results</h2></div>
              {st.losses.length ? st.losses.map(betRow) : <div className="hint meta">No losing bets in this range.</div>}
            </section>
          </div>
          <p className="fine sx-foot">Built from the settled bets in My bets, where every bet is listed. Sample data · no real money.</p>
        </>
      )}
    </div>
  )
}
