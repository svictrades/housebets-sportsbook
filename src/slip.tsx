// Bet slip (cards, footer, receipts) and My bets (open, settled, cash-out).
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CaretDown, Check, Lock, Ticket, WarningCircle, X } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { fmt, money, useBook } from './book'
import { Bet, cashValue, isDead, matchName, minuteLabel, needsAccept, stakeState, useApp } from './store'
import { dayAt } from './data'
import { cx, Elapsed, Empty, LiveDot, OddsCell, Price, Tabs, Tideline, Usdt, Wake } from './ui'

function Context({ selId }: { selId: string }) {
  const sel = useBook((s) => s.sels[selId])
  const m = useBook((s) => s.matches[sel.match])
  const mk = useBook((s) => s.mkts[sel.mk])
  const lull = useBook((s) => s.lull)
  return (
    <div className="meta ctx">
      {mk.name} · {matchName(m)}{' '}
      {m.live && !lull ? <span className="lv"><LiveDot still />{m.fx.sport === 'football' ? `${m.score[0]}–${m.score[1]} ` : ''}{minuteLabel(m)}</span> : <span className="lv t">{m.fx.time ?? 'starts soon'}</span>}
    </div>
  )
}

function SlipCard({ selId }: { selId: string }) {
  const item = useApp((s) => s.slip.find((i) => i.selId === selId))!
  const { setStake, remove, accept, clearErr, pref, balance, placing } = useApp()
  const sel = useBook((s) => s.sels[selId])
  const mk = useBook((s) => s.mkts[sel.mk])
  const sus = mk.sus
  const dead = !!sel.settled || !!mk.closed // can never be placed as it stands
  const off = !!sus || dead
  const changed = needsAccept(item, sel, pref) && !dead
  // a market the trader closed has come back: the card is live again
  useEffect(() => { if (item.err?.action === 'remove' && !off) clearErr(selId) }, [off])
  const [took, setTook] = useState<number | null>(null)
  useEffect(() => {
    if (sel.price !== item.price && !changed) {
      if (sel.price > item.price) { setTook(sel.price); setTimeout(() => setTook(null), 4000) }
      accept(selId)
    }
  }, [sel.price, changed])
  const st = stakeState(item, balance)
  const n = parseFloat(item.stake) || 0
  const add = (v: number | 'max') => setStake(selId, fmt(v === 'max' ? Math.min(500, balance) : Math.min(500, n + v)))
  const lastHist = sel.hist.slice(-6)
  return (
    <div className={cx('card', off && 'is-sus')}>
      <div className="t">
        <div>
          <h4>{sel.name}</h4>
          <Context selId={selId} />
        </div>
        <span className="o d"><Price value={sel.price} dir={sel.dir} /></span>
        <button className="rm" aria-label={`Remove ${sel.name}`} onClick={() => remove(selId)}><X size={16} /></button>
      </div>
      {sel.settled ? <div className="line sus"><Lock size={14} /> Settled by the score · remove it to carry on</div>
        : mk.closed ? (!item.err && <div className="line sus"><Lock size={14} /> Market closed · {sus?.reason ?? 'no longer on sale'}</div>)
        : sus && <div className="line sus"><Lock size={14} /> Suspended · {sus.reason} · it will reopen here</div>}
      {changed && !sus && (
        <div className="reveal">
          <div className="chg">
            <i />
            <span>Price changed</span>
            <s className="d">{fmt(item.price)}</s>
            <Tideline className="mini" pts={[[0, item.price], ...lastHist.map((p, i) => [i + 1, p[1]] as [number, number])]} h={18} end={sel.price > item.price ? 1 : -1} draw />
            <b className="d">{fmt(sel.price)}</b>
            <i className={cx('wk on stay', sel.price > item.price ? 'u' : 'dn')} />
          </div>
          {n > 0 && <div className="meta rchg">Returns <s className="d">{money(n * item.price)}</s> <ArrowRight size={11} /> <b className="d">{money(n * sel.price)}</b></div>}
          {!st.ok && <button className="acc" onClick={() => accept(selId)}>Accept new price {fmt(sel.price)}</button>}
        </div>
      )}
      {took && <div className="line ok"><Check size={14} /> Took the better price {fmt(took)}</div>}
      {item.err && (
        <div className="line err" role="alert">
          <WarningCircle size={16} weight="fill" />
          <span>{item.err.text}{item.err.action === 'accept' ? ' Accept the new price below to place it.' : item.err.action === 'retry' ? ' Try again below.' : ' Remove it to carry on.'}</span>
        </div>
      )}
      <div className="stk">
        <label className={cx('inp', st.msg && 'bad')}>
          <Usdt />
          <input
            inputMode="decimal" placeholder="0.00" value={item.stake} disabled={off || !!placing} aria-label={`Stake for ${sel.name} in USDT`}
            onChange={(e) => { const v = e.target.value.replace(',', '.'); if (/^\d{0,4}(\.\d{0,2})?$/.test(v)) setStake(selId, v) }}
          />
          <small>USDT</small>
        </label>
        <div className="ret meta">Returns<b className="d">{n > 0 ? money(n * sel.price) : '—'}</b></div>
      </div>
      {st.msg && <div className="meta bad">{st.msg}</div>}
      <div className="qs">
        {[5, 10, 25, 100].map((v) => <button key={v} disabled={off} onClick={() => add(v)}>+{v}</button>)}
        <button disabled={off} onClick={() => add('max')}>Max</button>
      </div>
    </div>
  )
}

function ReceiptView() {
  const receipts = useApp((s) => s.receipts)
  const set = useApp((s) => s.set)
  const [, nav] = useLocation()
  if (!receipts.length) return null
  return (
    <div className="receipts">
      {receipts.map((r) => (
        <div className="rc" key={r.id}>
          <svg className="ck" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" /><path d="M6.500 11.500l3 3 6-6.500" pathLength={1} /></svg>
          <div>
            <b>Bet placed</b>
            <div className="meta">{r.id} · {r.time}</div>
            <div className="rl"><span>{r.sel} <span className="meta">· {r.market}</span></span><b className="d">{fmt(r.odds)}</b></div>
            <div className="d rm2"><Usdt />{money(r.stake)} <ArrowRight size={12} /> <Usdt />{money(r.stake * r.odds)}</div>
            <button className="lnk tk-open" onClick={() => set({ card: r.id })}><Ticket size={14} /> View bet card</button>
          </div>
          <span className="ripple" aria-hidden />
        </div>
      ))}
      <div className="racts">
        <button className="btn" onClick={() => set({ receipts: [] })}>Done</button>
        <button className="btn" onClick={() => { set({ receipts: [], panelTab: 'bets' }); if (useApp.getState().sheet) set({ sheet: 'bets' }); else nav('/bets') }}>View in My bets</button>
      </div>
    </div>
  )
}

const POPULAR = ['ars-bha:main:h', 'bar-sev:tg:o2.5', 'liv-mun:main:d']
const NEXT_UP = ['liv-mun:main:h', 'lund-amadi:main:h', 'atm-val:main:h'] // shown when nothing is in play
export function SlipBody() {
  const slip = useApp((s) => s.slip)
  const receipts = useApp((s) => s.receipts)
  const set = useApp((s) => s.set)
  const lull = useBook((s) => s.lull)
  const pop = lull ? NEXT_UP : POPULAR
  const sels = useBook((s) => pop.map((id) => s.sels[id].name).join('|'))
  const matches = useBook((s) => s.matches)
  if (!slip.length && !receipts.length)
    return (
      <div className="pb">
        <Empty title="Your slip is empty">Tap any price to add a single.</Empty>
        <div className="micro sub">{lull ? 'Next kick-offs' : 'Popular right now'}</div>
        {pop.map((id, i) => {
          const m = matches[id.split(':')[0]]
          return (
            <div className="pop" key={id}>
              <div><b>{sels.split('|')[i]}</b><div className="meta">{matchName(m)} · {lull ? `${m.fx.day} ${m.fx.time}` : useBook.getState().mkts[id.split(':').slice(0, 2).join(':')].name}</div></div>
              <OddsCell id={id} />
            </div>
          )
        })}
      </div>
    )
  return (
    <div className="pb">
      <ReceiptView />
      {slip.length > 0 && (
        <div className="ph meta">
          <span><b>Singles</b> · {slip.length} selection{slip.length > 1 ? 's' : ''}</span>
          <button onClick={() => set({ slip: [] })}>Clear all</button>
        </div>
      )}
      {slip.map((i) => <SlipCard key={i.selId} selId={i.selId} />)}
    </div>
  )
}

export function SlipFooter() {
  const { slip, balance, pref, placing, place, removeDead, set, receipts, user, login } = useApp()
  const sels = useBook((s) => s.sels)
  const mkts = useBook((s) => s.mkts)
  const [open, setOpen] = useState(false)
  let total = 0, ret = 0, ready = 0, sus = 0, dead = 0, held = 0, invalid = ''
  const moved: number[] = []
  for (const i of slip) {
    const sel = sels[i.selId]
    const s = stakeState(i, balance)
    if (isDead(i.selId)) { dead++; continue }
    if (s.msg) invalid = s.n > 500 ? 'Stake is over the 500 limit' : s.n > balance ? 'Stake is over your balance' : 'Stake is under the 0.10 minimum'
    if (mkts[sel.mk].sus) { sus++; if (s.ok) held += s.n; continue }
    if (s.ok) { ready++; total += s.n; ret += s.n * sel.price; if (needsAccept(i, sel, pref)) moved.push(sel.price) }
  }
  // the whole slip has to fit the balance, not just each stake on its own
  if (!invalid && total + held > balance + 0.001) invalid = 'Total stake is over your balance'
  const retry = slip.some((i) => i.err?.action === 'retry')
  // one button, one job: it always names the single thing that will happen next
  let label = 'Enter a stake'
  let dis = true
  let run = place
  if (placing) label = 'Placing…'
  else if (invalid) label = invalid
  else if (ready) {
    dis = false
    const amt = `${money(total)} USDT`
    const count = ready === 1 ? 'bet' : `${ready} bets`
    label = moved.length ? `Accept ${moved.length === 1 ? fmt(moved[0]) : 'new prices'} & place · ${amt}` : retry ? `Try again · ${amt}` : ready < slip.length ? `Place ${ready} of ${slip.length} bets · ${amt}` : `Place ${count} · ${amt}`
  } else if (dead) { dis = false; run = removeDead; label = dead > 1 ? `Remove ${dead} closed selections` : 'Remove closed selection' }
  else if (slip.length && sus === slip.length) label = 'Waiting for the market to reopen'
  if (!slip.length && receipts.length) label = 'Bet placed'
  // bets belong to an account: logged out, the one button offers the way back in
  if (!user && slip.length) { label = 'Log in to place bets'; dis = false; run = login }
  const prefs = { ask: 'Ask me', better: 'Accept better prices', any: 'Accept any' } as const
  return (
    <div className="pf">
      <div className="tot"><span>Total stake</span><b className="d sm"><Usdt />{money(total)}</b></div>
      <div className="tot"><span>Potential return</span><b className="d"><Usdt />{money(ret)}</b></div>
      {held > 0 && <div className="meta hold"><span>On hold while suspended</span><span className="d"><Usdt />{money(held)}</span></div>}
      {dead > 0 && ready > 0 && <div className="meta hold"><span>{dead} closed selection{dead > 1 ? 's' : ''} won’t be placed</span><button onClick={removeDead}>Remove</button></div>}
      <button className={cx('place', run === removeDead && 'alt')} disabled={dis || !!placing} onClick={run}>
        {label}
        {placing && <i className="bar" style={{ animationDuration: `${placing.ms}ms` }} />}
      </button>
      {placing?.inplay && <div className="meta ctr">Confirming in-play price</div>}
      <div className="setl">
        <span className="prefw">
          When prices move:{' '}
          <button onClick={() => setOpen(!open)} aria-expanded={open}>{prefs[pref]} <CaretDown size={11} /></button>
          {open && (
            <span className="popv" role="menu">
              {(Object.keys(prefs) as (keyof typeof prefs)[]).map((k) => (
                <button key={k} role="menuitemradio" aria-checked={k === pref} onClick={() => { set({ pref: k }); setOpen(false) }}>
                  {prefs[k]} {k === pref && <Check size={14} />}
                </button>
              ))}
            </span>
          )}
        </span>
        {user ? <span>Demo balance <b className="d"><Price value={balance} /></b></span> : <span>Logged out</span>}
      </div>
      <div className="fine">Sample data · no real money</div>
    </div>
  )
}

// ---- My bets ----------------------------------------------------------------
function CashOut({ bet, onLock }: { bet: Bet; onLock: (v: number | null, solid?: boolean) => void }) {
  const sel = useBook((s) => s.sels[bet.selId])
  const m = useBook((s) => s.matches[bet.matchId])
  const mk = useBook((s) => s.mkts[sel.mk])
  const sus = mk.sus
  const { cashOut, declineCash, set } = useApp()
  const lull = useBook((s) => s.lull)
  const fresh = (was: number) => { const v = cashValue(bet, useBook.getState().sels[bet.selId].price); return v === was ? `value is still ${money(v)}` : `new value ${money(v)}` }
  const value = cashValue(bet, sel.price)
  const [lock, setLock] = useState<null | { v: number; at: number }>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const timer = useRef<number>(0)
  const release = (msg: string) => { clearTimeout(timer.current); setLock(null); onLock(null); setNote(msg) }
  useEffect(() => { if (lock && sus) release('Quote released · market paused') }, [sus])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!lock) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && release('')
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [lock])
  if (!m.live || lull) return <div className="co-wrap"><span className="meta">Cash out opens at kick-off</span></div>
  if (sel.settled || mk.closed) return <div className="co-wrap"><span className="meta">Cash out is closed · this bet is being settled</span></div>
  if (!mk.cashout) return <div className="co-wrap"><span className="meta">Cash out isn’t offered on this market</span></div>
  if (sus) return <div className="co-wrap"><button className="co" disabled><Lock size={14} /> Cash out paused</button><span className="meta">{sus.reason} · <Elapsed since={sus.since} /></span></div>
  if (busy) return <div className="co-wrap"><button className="co" disabled>Cashing out…</button></div>
  if (lock) {
    const confirm = () => {
      if (Date.now() - lock.at < 300) return // ignore a double tap
      clearTimeout(timer.current)
      setBusy(true)
      setTimeout(() => {
        setBusy(false)
        if (declineCash) { set({ declineCash: false }); setLock(null); onLock(null); setNote(`Cash out declined · ${fresh(lock.v)}`); return }
        onLock(lock.v, true)
        try { navigator.vibrate?.(10) } catch {}
        cashOut(bet.id, lock.v)
      }, 600)
    }
    return (
      <div className="co-wrap locked">
        <div className="co-row">
          <button className="co go" onClick={confirm}><Lock size={14} weight="fill" /> Confirm <span className="d co-v"><Usdt />{money(lock.v)}</span></button>
          <button className="co x" aria-label="Release the held price" onClick={() => release('')}><X size={16} /></button>
        </div>
        <div className="drain"><i /></div>
        <span className="meta">Price held for 5 s · Confirm to take it</span>
      </div>
    )
  }
  const diff = value - bet.stake
  return (
    <div className="co-wrap">
      <button
        className="co"
        onClick={() => {
          setNote('')
          setLock({ v: value, at: Date.now() })
          onLock(value)
          timer.current = window.setTimeout(() => release(`Quote expired · ${fresh(value)}`), 5000)
        }}
      >
        <span>Cash out</span><span className="d co-v"><Usdt /><Price value={value} dir={-sel.dir} /></span>
      </button>
      <span className={cx('meta', note && 'note')}>{note || `${diff >= 0 ? '+' : '−'}${money(Math.abs(diff))} vs stake`}</span>
    </div>
  )
}

export function OpenBet({ bet, wide }: { bet: Bet; wide?: boolean }) {
  const sel = useBook((s) => s.sels[bet.selId])
  const m = useBook((s) => s.matches[bet.matchId])
  const [level, setLevel] = useState<{ v: number; solid?: boolean } | null>(null)
  const lull = useBook((s) => s.lull)
  const cashed = bet.status === 'cashed'
  const val = (p: number) => cashValue(bet, p)
  const pts = sel.hist.filter((p) => p[0] >= bet.placedX).map((p) => [p[0], val(p[1])] as [number, number])
  if (!pts.length || pts[0][0] > bet.placedX) pts.unshift([bet.placedX, val(bet.odds)])
  const value = val(sel.price)
  const marks = m.goals.map((g) => g.m).filter((x) => x > bet.placedX)
  const line = (
    <Tideline pts={pts} h={wide ? 40 : 30} x0={bet.placedX} xNow={m.x} gaps={m.gaps} marks={marks} level={level?.v} levelSolid={level?.solid} end={-sel.dir} minSpan={bet.stake * 0.08} />
  )
  const ctx = (
    <div className="meta ctx">
      {bet.match}{' '}{m.live && !lull ? <span className="lv"><LiveDot still />{m.fx.sport === 'football' ? `${m.score[0]}–${m.score[1]} ` : ''}{minuteLabel(m)}</span> : <span className="lv t">{m.fx.time ?? 'starts soon'}</span>}
    </div>
  )
  const offered = m.live && !lull && useBook.getState().mkts[sel.mk].cashout
  const valueBox = !offered && !cashed ? (
    <div className="val"><b className="d">{fmt(bet.odds)}</b><div className="meta">odds taken</div></div>
  ) : cashed ? (
    <div className="val"><b className="d"><Usdt />{money(bet.returns)}</b><div className="meta up">Cashed out</div></div>
  ) : (
    <div className="val">
      <b className="d">{level ? <Lock size={14} weight="fill" className="lk" /> : <Wake dir={-sel.dir} at={sel.movedAt} />}<Usdt />{level ? money(level.v) : <Price value={value} dir={-sel.dir} />}</b>
      <div className="meta">cash-out value</div>
    </div>
  )
  const action = cashed ? (
    <div className="co-wrap done" role="status">
      <b><Check size={16} /> Cashed out <Usdt />{money(bet.returns)}</b>
      <span className="meta">{minuteLabel(m)} · {bet.returns >= bet.stake ? '+' : '−'}{money(Math.abs(bet.returns - bet.stake))} vs stake</span>
      {bet.returns >= bet.stake && <span className="ripple" aria-hidden />}
    </div>
  ) : (
    <CashOut bet={bet} onLock={(v, solid) => setLevel(v == null ? null : { v, solid })} />
  )
  if (wide)
    return (
      <div className={cx('bet-w', !!bet.isNew && Date.now() - bet.isNew < 3000 && 'new')}>
        <div className="bet">
          <span className="meta">{bet.placed.split(' ')[0]}<br />{bet.placed.split(' ')[1]}</span>
          <button className="tk-btn" onClick={() => openCard(bet.id)} aria-label={`Open bet card for ${bet.sel}`}><span><b>{bet.sel}</b> <span className="meta">· {bet.market}</span></span>{ctx}<Ticket className="tk-i" size={15} /></button>
          <span className="n d">{fmt(bet.odds)}</span>
          <span className="n d"><Usdt />{money(bet.stake)}</span>
          <span className="n d"><Usdt />{money(bet.stake * bet.odds)}</span>
          {valueBox}
        </div>
        <div className="betx">
          <div className="lw">
            {line}
            <div className="micro ax"><span>Placed</span>{level && !cashed && <span>Now {money(value)} · held at {money(level.v)}</span>}<span>Now</span></div>
          </div>
          {action}
        </div>
      </div>
    )
  return (
    <div className="bet-s">
      <div className="t"><button className="tk-btn" onClick={() => openCard(bet.id)} aria-label={`Open bet card for ${bet.sel}`}><span><b>{bet.sel}</b> <span className="meta">· {bet.market}</span></span>{ctx}<Ticket className="tk-i" size={15} /></button>{valueBox}</div>
      <div className="d sums">{fmt(bet.odds)} · <Usdt />{money(bet.stake)} <ArrowRight size={12} /> <Usdt />{money(bet.stake * bet.odds)}</div>
      {line}
      {action}
    </div>
  )
}

const openCard = (id: string) => useApp.getState().set({ card: id })
const RANGES = [['all', 'All time', 9999], ['today', 'Today', 0], ['7', '7 days', 7], ['30', '30 days', 30], ['custom', 'Custom', 9999]] as const
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function MyBets({ wide }: { wide?: boolean }) {
  const bets = useApp((s) => s.bets)
  const now = useBook((s) => s.now)
  const [tab, setTab] = useState<'open' | 'settled'>('open')
  const [range, setRange] = useState<string>('all')
  const [sport, setSport] = useState('all')
  const days = RANGES.find((r) => r[0] === range)![2]
  const [from, setFrom] = useState(() => iso(dayAt(-14)))
  const [to, setTo] = useState(() => iso(dayAt(0)))
  const inRange = (b: Bet) => { const d = iso(dayAt(-b.daysAgo)); return d >= from && d <= to }
  const pass = (b: Bet) => (range === 'custom' ? inRange(b) : b.daysAgo <= days) && (sport === 'all' || b.sport === sport)
  const isOpen = (b: Bet) => b.status === 'open' || (b.status === 'cashed' && !!b.cashedAt && now - b.cashedAt < 4500)
  const open = bets.filter(isOpen)
  const settled = bets.filter((b) => !isOpen(b)).sort((a, b) => a.daysAgo - b.daysAgo) // newest first
  const list = (tab === 'open' ? open : settled).filter(pass)
  const staked = list.reduce((a, b) => a + b.stake, 0)
  const returned = list.reduce((a, b) => a + b.returns, 0)
  const bySport = ['football', 'tennis', 'basketball', 'esports'].map((s) => [s, list.filter((b) => b.sport === s).length] as const).filter((x) => x[1])
  const tag = (b: Bet) => (b.status === 'won' ? <span className="res won"><Check size={14} /> Won</span> : b.status === 'lost' ? <span className="res lost">Lost</span> : b.status === 'void' ? <span className="res lost">Void</span> : <span className="res">Cashed out</span>)
  return (
    <div className={cx('mybets', wide && 'wide')}>
      <div className="mb-head">
        <Tabs items={[{ id: 'open', label: 'Open', n: open.length }, { id: 'settled', label: 'Settled', n: settled.length }]} value={tab} onChange={setTab} />
        <div className="filters">
          {RANGES.map(([id, label]) => <button key={id} className={cx('chip', range === id && 'on')} aria-pressed={range === id} onClick={() => setRange(id)}>{label}</button>)}
          {range === 'custom' && wide && <span className="dates"><input type="date" className="chip" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label="From date" /><span className="meta">to</span><input type="date" className="chip" value={to} min={from} max={iso(dayAt(0))} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label="To date" /></span>}
          <label className="chip sel"><select value={sport} onChange={(e) => setSport(e.target.value)} aria-label="Sport"><option value="all">All sports</option><option value="football">Football</option><option value="tennis">Tennis</option><option value="basketball">Basketball</option><option value="esports">Esports</option></select><CaretDown size={12} /></label>
        </div>
      </div>
      {range === 'custom' && !wide && <div className="dates row"><input type="date" className="chip" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label="From date" /><span className="meta">to</span><input type="date" className="chip" value={to} min={from} max={iso(dayAt(0))} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label="To date" /></div>}
      {tab === 'open' ? (
        list.length ? (
          <>
            {wide && <div className="th micro open"><span>Placed</span><span>Bet</span><span className="n">Odds</span><span className="n">Stake</span><span className="n">To return</span><span className="n">Value</span></div>}
            {list.map((b) => <OpenBet key={b.id} bet={b} wide={wide} />)}
          </>
        ) : (
          <Empty title={open.length ? 'No open bets match these filters' : 'No open bets'}>
            {open.length ? <button className="lnk" onClick={() => { setRange('all'); setSport('all') }}>Show all</button> : 'Live prices are moving now. Tap any price to add a single.'}
          </Empty>
        )
      ) : list.length ? (
        <>
          <div className="sum">
            <div><span className="meta">Bets</span><b className="d">{list.length}</b></div>
            <div><span className="meta">Average stake</span><b className="d"><Usdt />{money(staked / list.length)}</b></div>
            <div><span className="meta">Staked</span><b className="d"><Usdt />{money(staked)}</b></div>
            <div><span className="meta">Returned</span><b className="d"><Usdt />{money(returned)}</b></div>
            <div className="bar"><i>{bySport.map(([s, n]) => <u key={s} style={{ flex: n }} />)}</i><span className="meta">{bySport.map(([s, n]) => `${s[0].toUpperCase() + s.slice(1)} ${n}`).join(' · ')}</span></div>
          </div>
          {wide && <div className="th micro"><span>Placed</span><span>Bet</span><span className="n">Odds</span><span className="n">Stake</span><span className="n">Returns</span><span className="n">Result</span></div>}
          {list.map((b) => wide ? (
            <div className="tr click" key={b.id} role="button" tabIndex={0} aria-label={`Open bet card for ${b.sel}`} onClick={() => openCard(b.id)} onKeyDown={(e) => e.key === 'Enter' && openCard(b.id)}>
              <span className="meta">{b.placed.replace(/ (\d\d:)/, '\n$1').split('\n').map((x, i) => <span key={i}>{x}<br /></span>)}</span>
              <div><b>{b.sel}</b> <span className="meta">· {b.market} · {b.match}</span></div>
              <span className="n d">{fmt(b.odds)}</span><span className="n d"><Usdt />{money(b.stake)}</span>
              <span className={cx('n d', !b.returns && 'zero')}><Usdt />{money(b.returns)}</span><span className="n">{tag(b)}</span>
            </div>
          ) : (
            <div className="bet-s settled click" key={b.id} role="button" tabIndex={0} aria-label={`Open bet card for ${b.sel}`} onClick={() => openCard(b.id)} onKeyDown={(e) => e.key === 'Enter' && openCard(b.id)}>
              <div className="t"><div><b>{b.sel}</b> <span className="meta">· {b.market}</span><div className="meta">{b.match} · {b.placed}</div></div>{tag(b)}</div>
              <div className="d sums">{fmt(b.odds)} · <Usdt />{money(b.stake)} <ArrowRight size={12} /> <span className={cx(!b.returns && 'zero')}><Usdt />{money(b.returns)}</span></div>
            </div>
          ))}
        </>
      ) : (
        <Empty title={range === 'today' ? 'Nothing settled today yet' : 'Nothing settled in this range'}><button className="lnk" onClick={() => { setRange('all'); setSport('all') }}>Show all time</button></Empty>
      )}
    </div>
  )
}
