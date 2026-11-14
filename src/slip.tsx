// Bet slip (cards, footer, receipts) and My bets (open, settled, cash-out).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, CaretDown, Check, Lock, Ticket, WarningCircle, X } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { create } from 'zustand'
import { fmt, money, useBook } from './book'
import { Bet, cashValue, isDead, matchName, minuteLabel, needsAccept, stakeState, useApp } from './store'
import { dayAt } from './data'
import { cx, Elapsed, Empty, EXIT, LiveDot, OddsCell, Price, reduced, Tabs, Tideline, usePresence, Usdt, SearchKey } from './ui'

// Scroll a slip card (or the stake field being typed in) into view inside its own list, vertically only.
// 'near' = the least movement that shows it · 'centre' = middle of the list (phone keyboard open) ·
// 'polite' = like 'near', but never while the player is typing in or pointing at the list.
function bringIn(el: Element | null | undefined, how: 'near' | 'centre' | 'polite' = 'near') {
  const sc = el?.closest('.scroll')
  if (!el || !sc) return
  if (how === 'polite' && (sc.contains(document.activeElement) || sc.matches(':hover'))) return
  const a = el.getBoundingClientRect()
  const b = sc.getBoundingClientRect()
  let d = 0
  if (how === 'centre') d = a.top + a.height / 2 - (b.top + b.height / 2)
  else if (a.bottom > b.bottom - 8) d = Math.min(a.bottom - b.bottom + 12, a.top - b.top - 8)
  else if (a.top < b.top) d = a.top - b.top - 12
  if (Math.abs(d) > 1) sc.scrollBy({ top: d, behavior: reduced() || how === 'centre' ? 'auto' : 'smooth' })
}

// what the player may type or paste into a stake field: digits and one decimal point, two decimals
function cleanStake(raw: string) {
  let v = raw.replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.').replace(/[^\d.]/g, '')
  const dot = v.indexOf('.')
  if (dot < 0) return v.slice(0, 6)
  return v.slice(0, dot).slice(0, 6) + '.' + v.slice(dot + 1).replace(/\./g, '').slice(0, 2)
}

function SlipCard({ selId }: { selId: string }) {
  const item = useApp((s) => s.slip.find((i) => i.selId === selId))!
  const others = useApp((s) => s.slip.reduce((a, i) => a + (i.selId === selId ? 0 : parseFloat(i.stake) || 0), 0))
  const { setStake, remove, accept, clearErr, pref, balance, placing } = useApp()
  const sel = useBook((s) => s.sels[selId])
  const mk = useBook((s) => s.mkts[sel.mk])
  const m = useBook((s) => s.matches[sel.match])
  const lull = useBook((s) => s.lull)
  const sus = mk.sus
  const dead = !!sel.settled || !!mk.closed // can never be placed as it stands
  const off = !!sus || dead
  const changed = needsAccept(item, sel, pref) && !dead
  const box = useRef<HTMLDivElement>(null)
  // a market the trader closed has come back: the card is live again
  useEffect(() => { if (item.err?.action === 'remove' && !off) clearErr(selId) }, [off])
  // a price the player's own setting lets through is taken at once, and the card says so for a moment
  const [took, setTook] = useState<null | { now: number; was: number }>(null)
  const tookT = useRef(0)
  useEffect(() => {
    if (sel.price !== item.price && !changed) {
      setTook({ now: sel.price, was: item.price })
      clearTimeout(tookT.current)
      tookT.current = window.setTimeout(() => setTook(null), 4000)
      accept(selId)
    }
  }, [sel.price, changed])
  useEffect(() => () => clearTimeout(tookT.current), [])
  // a card that has just been added, or that now needs its price accepted, is brought into view
  useEffect(() => { if (item.at && Date.now() - item.at < 600) bringIn(box.current) }, [])
  // (not while a receipt is showing: its heading is the top of the list and must stay in view)
  useEffect(() => { if (changed && !sus && !useApp.getState().receipts.length) bringIn(box.current, 'polite') }, [changed])
  const st = stakeState(item, balance)
  const n = parseFloat(item.stake) || 0
  const max = Math.min(500, +(balance - others).toFixed(2))
  const add = (v: number | 'max') => setStake(selId, fmt(v === 'max' ? max : Math.min(500, n + v)))
  const lastHist = sel.hist.slice(-6)
  const locked = off || !!placing
  const errLine = item.err && (
    <div className="line err" role="alert">
      <WarningCircle size={16} weight="fill" />
      <span>{item.err.text}</span>
    </div>
  )
  // one message per card, most pressing first: settled or closed, suspended, price changed, failed, price taken
  const msg = sel.settled ? <div className="line sus" role="status"><Lock size={14} /> Settled · remove to carry on</div>
    : mk.closed ? (errLine || <div className="line sus" role="status"><Lock size={14} /> Market closed · {sus?.reason ?? 'no longer on sale'}</div>)
    : sus ? <div className="line sus" role="status"><Lock size={14} /> <span>Suspended · {sus.reason}<Elapsed until={sus.until} sep /></span></div>
    : changed ? (
      <div className="reveal" role={item.err ? 'alert' : 'status'}>
        <div className="chg">
          <i />
          <span>{item.err ? 'Not placed · price changed' : 'Price changed'}</span>
          <s className="d">{fmt(item.price)}</s>
          {item.err ? <ArrowRight size={12} /> : <Tideline className="mini" pts={[[0, item.price], ...lastHist.map((p, i) => [i + 1, p[1]] as [number, number])]} h={18} end={sel.price > item.price ? 1 : -1} draw />}
          <b className="d">{fmt(sel.price)}</b>
          <i className={cx('wk on stay', sel.price > item.price ? 'u' : 'dn')} />
        </div>
        {n > 0 && !st.msg && <div className="meta rchg">To return <s className="d">{money(n * item.price)}</s> <ArrowRight size={11} /> <b className="d">{money(n * sel.price)}</b></div>}
        {!st.ok && <button className="acc" onClick={() => accept(selId)}>Accept new price {fmt(sel.price)}</button>}
      </div>
    )
    : errLine ? errLine
    : took ? (took.now > took.was
      ? <div className="line ok" role="status"><Check size={14} /> Took the better price {fmt(took.now)}</div>
      : <div className="line sus" role="status"><Check size={14} /> Price now {fmt(took.now)} · was {fmt(took.was)}</div>)
    : null
  return (
    <div ref={box} className={cx('ob slipc', m.live && !lull && 'live', off && 'is-sus')}>
      <div className="ob-h">
        <span className="ob-t"><b>{sel.name}</b></span>
        <span className="ob-hr">
          <span className="ob-live">{m.live && !lull ? <><LiveDot still />{m.fx.sport === 'football' && <b className="d">{m.score[0]}–{m.score[1]}</b>}<span className="d">{minuteLabel(m)}</span></> : <span className="d">{m.fx.time ?? 'Soon'}</span>}</span>
          <button className="rm" aria-label={`Remove ${sel.name}`} onClick={() => remove(selId)}><X size={16} /></button>
        </span>
        <span className="meta ob-m">{mk.name} · {matchName(m)}</span>
      </div>
      <div className="ob-nums">
        <div><span className="meta">Odds</span><b className="d"><Price value={sel.price} dir={sel.dir} /></b></div>
        <div><span className="meta">Stake</span><b className={cx('d', !n && 'zero')}>{n > 0 ? money(n) : '—'}</b></div>
        <div><span className="meta">To return</span><b className={cx('d', (!n || !!st.msg) && 'zero')}>{n > 0 && !st.msg ? money(n * sel.price) : '—'}</b></div>
      </div>
      <div className="ob-tear" aria-hidden />
      {msg}
      <div className="stk">
        <label className={cx('inp', st.msg && 'bad')}>
          <Usdt />
          <input
            inputMode="decimal" enterKeyHint="done" placeholder="0.00" value={item.stake} disabled={locked} aria-label={`Stake for ${sel.name} in USDT`}
            onChange={(e) => setStake(selId, cleanStake(e.target.value))}
            onBlur={() => { if (n > 0 && fmt(n) !== item.stake) setStake(selId, fmt(n)) }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              // Enter finishes the stake and hands over to the one button that acts on it. It never places by itself:
              // the press is swallowed here and focus moves after it, so only a second press reaches the button.
              e.preventDefault()
              const inp = e.currentTarget
              const place = inp.closest('.panel-in, .sheet')?.querySelector<HTMLElement>('.pf .place')
              inp.blur()
              requestAnimationFrame(() => place?.focus())
            }}
          />
          <small>USDT</small>
        </label>
      </div>
      {st.msg && (
        <div className="meta bad slipc-bad">
          <span>{st.msg}</span>
          {st.fix != null && <button onClick={() => setStake(selId, fmt(st.fix!))}>Use {money(st.fix)}</button>}
        </div>
      )}
      <div className="qs">
        {[5, 10, 25, 100].map((v) => <button key={v} disabled={locked} onClick={() => add(v)}>+{v}</button>)}
        <button disabled={locked || max < 0.1} onClick={() => add('max')}>Max</button>
      </div>
    </div>
  )
}

const closeReceipt = (toBets: boolean, loc: string, nav: (to: string) => void) => {
  const { set, sheet, slip } = useApp.getState()
  if (!toBets) {
    // phone: Done also puts the sheet away, unless a selection that was not placed is still waiting in it
    if (!sheet || slip.length) return set({ receipts: [] })
    set({ receipts: [], sheet: null })
    if (loc === '/bets') nav('/') // as the sheet's own close does
    return
  }
  set({ receipts: [], panelTab: 'bets' })
  if (sheet) set({ sheet: 'bets' }); else nav('/bets')
}
function ReceiptActions() {
  const [loc, nav] = useLocation()
  return (
    <div className="racts">
      <button className="btn" onClick={() => closeReceipt(false, loc, nav)}>Done</button>
      {/* on the My bets page the bet is already in view beside the receipt */}
      {loc !== '/bets' && <button className="btn" onClick={() => closeReceipt(true, loc, nav)}>View in My bets</button>}
    </div>
  )
}
// One heading for everything placed by one tap, then a compact row per bet. Singles are separate bets, so some can be
// placed while one is not: the heading says so and the failed card stays below with its stake.
function ReceiptView() {
  const receipts = useApp((s) => s.receipts)
  const failed = useApp((s) => s.slip.filter((i) => i.err).length)
  const more = useApp((s) => s.slip.length > 0)
  const set = useApp((s) => s.set)
  if (!receipts.length) return null
  const n = receipts.length
  return (
    <div className="receipts" role="status">
      <div className="rcp-h">
        <svg className="ck" width="22" height="22" viewBox="0 0 22 22" aria-hidden><circle cx="11" cy="11" r="10" /><path d="M6.500 11.500l3 3 6-6.500" pathLength={1} /></svg>
        <b>{failed ? `${n} placed · ${failed} not placed` : n === 1 ? 'Bet placed' : `${n} bets placed`}</b>
        <span className="meta d">{receipts[0].time}</span>
        <span className="ripple" aria-hidden />
      </div>
      {receipts.map((r) => (
        <div className="rcp-r" key={r.id}>
          <div className="rcp-a">
            <b>{r.sel}</b>
            <span className="meta">{r.market}</span>
            <button className="lnk rcp-id d" aria-label={`Open bet card ${r.id}`} onClick={() => set({ card: r.id })}><Ticket size={14} /> {r.id}</button>
          </div>
          <div className="rcp-b">
            <b className="d"><Usdt />{money(r.stake)} at {fmt(r.odds)}</b>
            <span className="meta">To return <span className="d">{money(r.stake * r.odds)}</span></span>
          </div>
        </div>
      ))}
      {more && <ReceiptActions />}
    </div>
  )
}

const POPULAR = ['ars-bha:main:h', 'bar-sev:tg:o2.5', 'liv-mun:main:d']
const NEXT_UP = ['liv-mun:main:h', 'lund-amadi:main:h', 'atm-val:main:h'] // shown when nothing is in play
export function SlipBody() {
  const slip = useApp((s) => s.slip)
  const receipts = useApp((s) => s.receipts)
  const clearAll = useApp((s) => s.clearAll)
  const lull = useBook((s) => s.lull)
  const pop = lull ? NEXT_UP : POPULAR
  const sels = useBook((s) => pop.map((id) => s.sels[id].name).join('|'))
  const matches = useBook((s) => s.matches)
  const body = useRef<HTMLDivElement>(null)
  // "Bet placed" is the one moment of this flow: it must land where the player is looking, not above a scrolled list
  useLayoutEffect(() => {
    const sc = body.current?.closest('.scroll')
    if (receipts.length && sc) sc.scrollTop = 0
  }, [receipts])
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
    <div className="pb" ref={body}>
      <ReceiptView />
      {slip.length > 0 && (
        <div className="ph meta">
          <span><b>Singles</b> · {slip.length} selection{slip.length > 1 ? 's' : ''}</span>
          <button onClick={clearAll}>Clear all</button>
        </div>
      )}
      {slip.map((i) => <SlipCard key={i.selId} selId={i.selId} />)}
    </div>
  )
}

// "When prices move": a row of the footer table. The menu opens upward from its own row, so it never covers the button.
const PREFS = { ask: 'Ask me', better: 'Accept better prices', any: 'Accept any price' } as const
function PrefRow() {
  const pref = useApp((s) => s.pref)
  const set = useApp((s) => s.set)
  const placing = useApp((s) => !!s.placing)
  const [open, setOpen] = useState(false)
  const { mounted, closing } = usePresence(open, EXIT.pop)
  const wrap = useRef<HTMLSpanElement>(null)
  const trig = useRef<HTMLButtonElement>(null)
  const close = () => { setOpen(false); trig.current?.focus() }
  useEffect(() => { if (placing) setOpen(false) }, [placing])
  useEffect(() => {
    if (!open) return
    wrap.current?.querySelector<HTMLElement>('[aria-checked=true]')?.focus()
    const down = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', down)
    return () => document.removeEventListener('pointerdown', down)
  }, [open])
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'Escape') { e.stopPropagation(); close(); return }
    if (e.key === 'Tab') { setOpen(false); return }
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const items = Array.from(wrap.current?.querySelectorAll<HTMLElement>('[role=menuitemradio]') ?? [])
    const at = items.indexOf(document.activeElement as HTMLElement)
    items[(at + step + items.length) % items.length]?.focus()
  }
  return (
    <div className="tot pf-pref">
      <span id="pf-pref-l">When prices move</span>
      <span className="prefw" ref={wrap} onKeyDown={onKey}>
        <button ref={trig} onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-describedby="pf-pref-l">{PREFS[pref]} <CaretDown size={11} /></button>
        {mounted && (
          <span className={cx('popv', closing && 'is-closing')} role="menu" aria-label="When prices move">
            {(Object.keys(PREFS) as (keyof typeof PREFS)[]).map((k) => (
              <button key={k} role="menuitemradio" aria-checked={k === pref} onClick={() => { set({ pref: k }); close() }}>
                {PREFS[k]} {k === pref && <Check size={14} />}
              </button>
            ))}
          </span>
        )}
      </span>
    </div>
  )
}

// true while the phone's on-screen keyboard is up; it also keeps the stake field being typed in at the middle of the list
function useKeyboardOpen() {
  const [kb, setKb] = useState(false)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !window.matchMedia('(max-width: 1023px)').matches) return
    let base = vv.height
    const f = () => {
      base = Math.max(base, vv.height)
      const up = vv.height < base - 120
      setKb(up)
      const el = document.activeElement
      // after the sheet and the footer have taken their keyboard-open size
      if (up && el?.matches('.inp input')) setTimeout(() => bringIn(el.closest('.inp'), 'centre'), 120)
    }
    vv.addEventListener('resize', f)
    document.addEventListener('focusin', f)
    return () => { vv.removeEventListener('resize', f); document.removeEventListener('focusin', f) }
  }, [])
  return kb
}

export function SlipFooter() {
  const { slip, balance, pref, placing, place, removeDead, receipts, user, login } = useApp()
  const sels = useBook((s) => s.sels)
  const mkts = useBook((s) => s.mkts)
  const kb = useKeyboardOpen()
  let total = 0, ret = 0, ready = 0, sus = 0, dead = 0, held = 0, invalid = ''
  const moved: { now: number }[] = []
  for (const i of slip) {
    const sel = sels[i.selId]
    const s = stakeState(i, balance)
    if (isDead(i.selId)) { dead++; continue }
    if (s.msg) invalid = s.n > 500 ? 'Stake is over the maximum' : s.n > balance ? 'Stake is over your balance' : 'Stake is under the minimum'
    if (mkts[sel.mk].sus) { sus++; if (s.ok) held += s.n; continue }
    if (s.ok) { ready++; total += s.n; ret += s.n * sel.price; if (needsAccept(i, sel, pref)) moved.push({ now: sel.price }) }
  }
  // the whole slip has to fit the balance, not just each stake on its own
  if (!invalid && total + held > balance + 0.001) invalid = 'Total stake is over your balance'
  const retry = slip.some((i) => i.err?.action === 'retry')
  // one button, one job: it always names the single thing that will happen next
  let label = 'Enter a stake'
  let dis = true
  let run: () => void = place
  if (placing) label = placing.inplay ? 'Confirming price…' : 'Placing…'
  else if (invalid) label = invalid
  else if (ready) {
    dis = false
    const amt = `${money(total)} USDT`
    const count = ready === 1 ? 'bet' : `${ready} bets`
    label = moved.length ? `Accept ${moved.length === 1 ? fmt(moved[0].now) : 'new prices'} & place · ${amt}` : retry ? `Try again · ${amt}` : ready < slip.length ? `Place ${ready} of ${slip.length} bets · ${amt}` : `Place ${count} · ${amt}`
  } else if (dead) { dis = false; run = removeDead; label = dead > 1 ? `Remove ${dead} closed selections` : 'Remove closed selection' }
  else if (slip.length && sus === slip.length) label = 'Waiting for the market to reopen'
  // bets belong to an account: logged out, the one button offers the way back in (quietly: the footer itself changes)
  if (!user && slip.length) { label = 'Log in to place bets'; dis = false; run = () => login(true) }
  const off = dis || !!placing
  const after = !!user && !invalid && total > 0 // a valid stake: show what the balance will be once it is placed
  return (
    <div className={cx('pf', kb && 'kb')}>
      {slip.length > 0 && (
        <>
          <div className="tot"><span>Total stake</span><b className="d"><Usdt />{money(total)}</b></div>
          <div className="tot"><span>Total to return</span><b className="d"><Usdt />{money(ret)}</b></div>
        </>
      )}
      <div className="tot pf-bal"><span>{after ? 'Balance after' : 'Balance'}</span>{user ? <b className="d"><Usdt /><Price value={after ? +(balance - total).toFixed(2) : balance} /></b> : <b className="pf-out">Logged out</b>}</div>
      {!receipts.length && <PrefRow />}
      {held > 0 && <div className="meta hold"><span>On hold while suspended</span><span className="d"><Usdt />{money(held)}</span></div>}
      {dead > 0 && ready > 0 && <div className="meta hold"><span>{dead} closed selection{dead > 1 ? 's' : ''} won’t be placed</span><button onClick={removeDead}>Remove</button></div>}
      {/* one moved price is already said by its card and by the button; several get one line here */}
      {!placing && moved.length > 1 && <div className="meta hold"><span>{moved.length} prices moved</span></div>}
      {slip.length > 0 ? (
        <button className={cx('place', run === removeDead && 'alt')} aria-disabled={off || undefined} aria-busy={!!placing || undefined} onClick={() => { if (!off) run() }} onKeyDown={(e) => { if (e.repeat) e.preventDefault() }}>
          {label}
          {placing && <i className="bar" style={{ animationDuration: `${placing.ms}ms` }} />}
        </button>
      ) : receipts.length > 0 && <ReceiptActions />}
      <div className="fine">Sample data · no real money</div>
    </div>
  )
}

// ---- My bets ----------------------------------------------------------------
const HOLD = 5 // seconds a cash-out price is held between the two taps
// One button in one place for every state (offer, held, cashing out, paused, closed) and one note line under it,
// so the second tap always lands where the first one did and the ticket never changes height.
function CashOut({ bet, onLock }: { bet: Bet; onLock: (v: number | null, solid?: boolean) => void }) {
  const sel = useBook((s) => s.sels[bet.selId])
  const m = useBook((s) => s.matches[bet.matchId])
  const mk = useBook((s) => s.mkts[sel.mk])
  const sus = mk.sus
  const lull = useBook((s) => s.lull)
  const value = cashValue(bet, sel.price)
  const [lock, setLock] = useState<null | { v: number; at: number }>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [left, setLeft] = useState(HOLD)
  const cut = useRef<number | null>(null) // the price that was being held when the market paused
  const timer = useRef<number>(0)
  const release = (msg: string) => { clearTimeout(timer.current); setLock(null); onLock(null); setNote(msg) }
  useEffect(() => {
    if (sus && lock) { cut.current = lock.v; release('') }
    else if (!sus && cut.current != null) {
      const now = cashValue(bet, useBook.getState().sels[bet.selId].price)
      setNote(now === cut.current ? `Market reopened · value is still ${money(now)}` : `Market reopened · new value ${money(now)}`)
      cut.current = null
    }
  }, [!!sus])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!lock) return
    setLeft(HOLD)
    const t = setInterval(() => setLeft(Math.max(1, HOLD - Math.floor((Date.now() - lock.at) / 1000))), 250)
    // Escape lets go of the held price and nothing else (it must not also close the sheet the ticket sits in)
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); release('') } }
    document.addEventListener('keydown', k, true)
    return () => { clearInterval(t); document.removeEventListener('keydown', k, true) }
  }, [lock])
  const closed = !!sel.settled || !!mk.closed
  if (!m.live || lull) return <div className="co-wrap co-off"><span className="meta">Cash out opens at kick-off</span></div>
  if (!mk.cashout) return <div className="co-wrap co-off"><span className="meta">{closed ? 'Cash out is closed · this bet is being settled' : 'Cash out isn’t offered on this market'}</span></div>
  const off = busy || !!sus || closed
  const armed = !!lock && !off
  const tap = () => {
    if (off) return
    if (!lock) {
      setNote('')
      setLock({ v: value, at: Date.now() })
      onLock(value)
      timer.current = window.setTimeout(() => release('Held price expired'), HOLD * 1000)
      return
    }
    if (Date.now() - lock.at < 300) return // ignore a double tap
    clearTimeout(timer.current)
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      const app = useApp.getState()
      if (app.declineCash) { app.set({ declineCash: false }); setLock(null); onLock(null); setNote('Not cashed out · bet still running'); return }
      onLock(lock.v, true)
      try { navigator.vibrate?.(10) } catch {}
      app.cashOut(bet.id, lock.v)
    }, 600)
  }
  const diff = value - bet.stake
  return (
    <div className="co-wrap">
      {/* a held key would repeat Enter and confirm by itself: only a fresh press counts */}
      <button className={cx('co', armed && 'go')} aria-disabled={off || undefined} onClick={tap} onKeyDown={(e) => { if (e.repeat) e.preventDefault() }}>
        {busy ? 'Cashing out…'
          : closed ? <><Lock size={14} /> Cash out closed</>
          : sus ? <><Lock size={14} /> Cash out paused</>
          : lock ? <><Lock size={14} weight="fill" /> Confirm <span className="d co-v"><Usdt />{money(lock.v)}</span><i className="co-drain" aria-hidden /></>
          : <><span>Cash out</span><span className="d co-v"><Usdt /><Price value={value} dir={-sel.dir} /></span></>}
      </button>
      <span className={cx('meta co-note', !off && !lock && note && 'note')}>
        <span role="status">
          {busy ? 'Price held'
            : closed ? 'This bet is being settled'
            : sus ? (cut.current != null ? `Held price released · ${sus.reason}` : <>{sus.reason}<Elapsed until={sus.until} sep /></>)
            : lock ? <>Price held · <span className="d" aria-hidden>{left} s</span></>
            : note || <><em className={diff >= 0 ? 'u' : 'dn'}>{diff >= 0 ? '+' : '−'}{money(Math.abs(diff))}</em> vs stake</>}
        </span>
        {armed && <> · <button className="co-rel" onClick={() => release('')}>Release</button></>}
      </span>
    </div>
  )
}

// tickets that have already played their "just placed" outline once
const shownNew = new Set<string>()
export function OpenBet({ bet, wide, onSettled }: { bet: Bet; wide?: boolean; onSettled?: () => void }) {
  const sel = useBook((s) => s.sels[bet.selId])
  const m = useBook((s) => s.matches[bet.matchId])
  const [level, setLevel] = useState<{ v: number; solid?: boolean } | null>(null)
  const lull = useBook((s) => s.lull)
  const [fresh] = useState(() => !!bet.isNew && !shownNew.has(bet.id))
  useEffect(() => { shownNew.add(bet.id) }, [])
  const cashed = bet.status === 'cashed'
  const val = (p: number) => cashValue(bet, p)
  const pts = sel.hist.filter((p) => p[0] >= bet.placedX).map((p) => [p[0], val(p[1])] as [number, number])
  if (!pts.length || pts[0][0] > bet.placedX) pts.unshift([bet.placedX, val(bet.odds)])
  const marks = m.goals.map((g) => g.m).filter((x) => x > bet.placedX)
  const line = (
    <Tideline pts={pts} h={wide ? 40 : 30} x0={bet.placedX} xNow={m.x} gaps={m.gaps} marks={marks} level={level?.v} levelSolid={level?.solid} end={-sel.dir} minSpan={bet.stake * 0.08} />
  )
  const offered = m.live && !lull && useBook.getState().mkts[sel.mk].cashout
  const gain = bet.returns - bet.stake
  const action = cashed ? (
    <div className="co-wrap done">
      <b role="status"><Check size={16} /> Cashed out <Usdt />{money(bet.returns)}</b>
      <span className="meta co-note">
        <span><em className={gain >= 0 ? 'u' : 'dn'}>{gain >= 0 ? '+' : '−'}{money(Math.abs(gain))}</em> vs stake</span>
        {onSettled && <> · <button className="co-rel" onClick={onSettled}>View in Settled</button></>}
      </span>
      {gain > 0 && <span className="ripple" aria-hidden />}
    </div>
  ) : (
    <CashOut bet={bet} onLock={(v, solid) => setLevel(v == null ? null : { v, solid })} />
  )
  const stubWhen = (placed: string) => { const i = placed.lastIndexOf(' '); return [placed.slice(0, i), placed.slice(i + 1)] }
  const liveChip = <span className="ob-live">{m.live && !lull ? <><LiveDot still />{m.fx.sport === 'football' && <b className="d">{m.score[0]}–{m.score[1]}</b>}<span className="d">{minuteLabel(m)}</span></> : <span className="d">{m.fx.time ?? 'Soon'}</span>}</span>
  const caption = <div className="ob-v"><span className="micro">{cashed ? 'Value when cashed out' : level ? 'Value held' : 'Cash-out value'}</span></div>
  // full-width layout (My bets page, match page): a ticket. The stub carries when and which; the body carries the bet; the tear-off part is the cash-out.
  if (wide) {
    const [day, time] = stubWhen(bet.placed)
    return (
      <article className={cx('tkt', m.live && !lull && 'live', cashed && 'cashed', fresh && 'new')}>
        <button className="tkt-stub" onClick={() => openCard(bet.id)} aria-label={`Open bet card for ${bet.sel}`}>
          <span className="micro">{day}</span>
          <b className="d">{time}</b>
          <span className="tkt-id d">{bet.id}</span>
          <span className="tkt-open"><Ticket size={14} /> Bet card</span>
        </button>
        <div className="tkt-body">
          <div className="tkt-top">
            <div className="tkt-sel"><b>{bet.sel}</b><span className="meta">{bet.market} · {bet.match}</span></div>
            {liveChip}
            <div className="tkt-nums">
              <div><span className="meta">Odds</span><b className="d">{fmt(bet.odds)}</b></div>
              <div><span className="meta">Stake</span><b className="d"><Usdt />{money(bet.stake)}</b></div>
              <div><span className="meta">To return</span><b className="d"><Usdt />{money(bet.stake * bet.odds)}</b></div>
            </div>
          </div>
          <div className={cx('tkt-cash', !(offered || cashed) && 'none')}>
            {(offered || cashed) && <div className="tkt-line">{caption}{line}</div>}
            {action}
          </div>
        </div>
      </article>
    )
  }
  // compact layout (side panel, phone sheet): three groups with air between them, one coin per bet
  return (
    <div className={cx('ob', m.live && !lull && 'live')}>
      <button className="ob-h" onClick={() => openCard(bet.id)} aria-label={`Open bet card for ${bet.sel}`}>
        <span className="ob-t"><b>{bet.sel}</b><Ticket className="tk-i" size={15} /></span>
        {liveChip}
        <span className="meta ob-m">{bet.market} · {bet.match}</span>
      </button>
      <div className="ob-nums">
        <div><span className="meta">Odds</span><b className="d">{fmt(bet.odds)}</b></div>
        <div><span className="meta">Stake</span><b className="d">{money(bet.stake)}</b></div>
        <div><span className="meta">To return</span><b className="d">{money(bet.stake * bet.odds)}</b></div>
      </div>
      <div className="ob-tear" aria-hidden />
      {(offered || cashed) && <div className="ob-cash">{caption}{line}</div>}
      {action}
    </div>
  )
}

const openCard = (id: string) => useApp.getState().set({ card: id })
// Enter and Space both open a ticket that acts as a button
const openOnKey = (id: string) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(id) } }
const RANGES = [['all', 'All time', 9999], ['today', 'Today', 0], ['7', '7 days', 7], ['30', '30 days', 30], ['custom', 'Custom', 9999]] as const
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// Which tab and filters My bets is showing. Shared so the page header's totals follow the tab.
type View = { tab: 'open' | 'settled'; range: string; sport: string; from: string; to: string }
const useView = create<View>(() => ({ tab: 'open', range: 'all', sport: 'all', from: iso(dayAt(-14)), to: iso(dayAt(0)) }))
const settledOf = (bets: Bet[], v: View) => {
  const days = RANGES.find((r) => r[0] === v.range)![2]
  const inRange = (b: Bet) => { const d = iso(dayAt(-b.daysAgo)); return d >= v.from && d <= v.to }
  return bets.filter((b) => b.status !== 'open' && (v.range === 'custom' ? inRange(b) : b.daysAgo <= days) && (v.sport === 'all' || b.sport === v.sport)).sort((a, b) => a.daysAgo - b.daysAgo) // newest first
}
// Settled totals: what went in, what came back, and the difference with its sign
function SettledSum({ list }: { list: Bet[] }) {
  const staked = list.reduce((a, b) => a + b.stake, 0)
  const returned = list.reduce((a, b) => a + b.returns, 0)
  const net = +(returned - staked).toFixed(2)
  return (
    <div className="mb-sum" aria-label="Settled bets in total">
      <div><span className="meta">Bets</span><b className="d">{list.length}</b></div>
      <div><span className="meta">Staked</span><b className="d"><Usdt />{money(staked)}</b></div>
      <div><span className="meta">Returned</span><b className="d"><Usdt />{money(returned)}</b></div>
      <div><span className="meta">Net</span><b className={cx('d', net > 0 ? 'u' : net < 0 && 'dn')}><Usdt />{net > 0 ? '+' : net < 0 ? '−' : ''}{money(Math.abs(net))}</b></div>
    </div>
  )
}
// Open totals: how many, what is staked, what they return, and what they are worth now. "Value now" counts only the
// bets that can be cashed out (in play, on a market that offers it); with none it shows a dash.
function OpenSum({ open }: { open: Bet[] }) {
  const sels = useBook((s) => s.sels)
  const mkts = useBook((s) => s.mkts)
  const matches = useBook((s) => s.matches)
  const lull = useBook((s) => s.lull)
  const staked = open.reduce((a, b) => a + b.stake, 0)
  const back = open.reduce((a, b) => a + b.stake * b.odds, 0)
  const cashable = open.filter((b) => { const sel = sels[b.selId], mk = sel && mkts[sel.mk]; return !!mk && !lull && !!matches[b.matchId]?.live && !!mk.cashout && !mk.closed && !sel.settled })
  const value = cashable.reduce((a, b) => a + cashValue(b, sels[b.selId].price), 0)
  return (
    <div className="mb-sum" aria-label="Your open bets in total">
      <div><span className="meta">Open bets</span><b className="d">{open.length}</b></div>
      <div><span className="meta">Staked</span><b className="d"><Usdt />{money(staked)}</b></div>
      <div><span className="meta">To return</span><b className="d"><Usdt />{money(back)}</b></div>
      <div><span className="meta">Value now</span>{cashable.length ? <b className="d"><Usdt /><Price value={+value.toFixed(2)} /></b> : <b className="d zero">—</b>}</div>
    </div>
  )
}
const RES = { won: 'Won', lost: 'Lost', void: 'Void', cashed: 'Cashed out', open: 'Open' } as const
// the result of a settled bet, in the same chip slot the live score has on an open ticket: "Won · FT 2–1"
const resChip = (b: Bet) => <span className={cx('res', b.status)}>{b.status === 'won' && <Check size={14} />}<span>{RES[b.status]}</span>{b.result && <span className="d">· {b.result}</span>}</span>

export function MyBets({ wide }: { wide?: boolean }) {
  const bets = useApp((s) => s.bets)
  const user = useApp((s) => s.user)
  const login = useApp((s) => s.login)
  const [, nav] = useLocation()
  const view = useView()
  const { tab, range, sport, from, to } = view
  // a bet cashed out while the player is looking at Open stays where it is, marked, until they change tab or leave
  const since = useRef(Date.now())
  const setTab = (t: View['tab']) => { since.current = Date.now(); useView.setState({ tab: t }) }
  useEffect(() => () => useView.setState({ tab: 'open' }), [])
  const root = useRef<HTMLDivElement>(null)
  // from a ticket's "View in Settled": switch the list and start it from the top
  const toSettled = () => { setTab('settled'); const sc = root.current?.closest('.scroll, .main'); if (sc) sc.scrollTop = 0 }
  if (!user)
    return (
      <div className={cx('mybets', wide && 'wide')}>
        <Empty title="Log in to see your bets"><button className="btn pri" onClick={() => login()}>Log in</button></Empty>
      </div>
    )
  const live = bets.filter((b) => b.status === 'open')
  const shown = bets.filter((b) => b.status === 'open' || (b.status === 'cashed' && !!b.cashedAt && b.cashedAt >= since.current))
  const manySports = new Set(shown.map((b) => b.sport)).size > 1
  const settledAll = bets.filter((b) => b.status !== 'open')
  const list = tab === 'open' ? shown.filter((b) => !manySports || sport === 'all' || b.sport === sport) : settledOf(bets, view)
  const showAll = () => useView.setState({ range: 'all', sport: 'all' })
  const dates = (
    <>
      <input type="date" className="chip" value={from} max={to} onChange={(e) => e.target.value && useView.setState({ from: e.target.value })} aria-label="From date" />
      <span className="meta">to</span>
      <input type="date" className="chip" value={to} min={from} max={iso(dayAt(0))} onChange={(e) => e.target.value && useView.setState({ to: e.target.value })} aria-label="To date" />
    </>
  )
  const settledTab = tab === 'settled'
  return (
    <div ref={root} className={cx('mybets', wide && 'wide')}>
      <div className="mb-head">
        <Tabs label="My bets" items={[{ id: 'open', label: 'Open', n: live.length }, { id: 'settled', label: 'Settled', n: settledAll.length }]} value={tab} onChange={setTab} />
        {(settledTab || manySports || wide) && (
          <div className="filters">
            {settledTab && RANGES.map(([id, label]) => <button key={id} className={cx('chip', range === id && 'on')} aria-pressed={range === id} onClick={() => useView.setState({ range: id })}>{label}</button>)}
            {settledTab && range === 'custom' && wide && <span className="dates">{dates}</span>}
            {(settledTab || manySports) && <label className="chip sel"><select value={sport} onChange={(e) => useView.setState({ sport: e.target.value })} aria-label="Sport"><option value="all">All sports</option><option value="football">Football</option><option value="tennis">Tennis</option><option value="basketball">Basketball</option><option value="esports">Esports</option></select><CaretDown size={12} /></label>}
            {wide && <SearchKey />}
          </div>
        )}
      </div>
      {settledTab && range === 'custom' && !wide && <div className="dates row">{dates}</div>}
      {!settledTab ? (
        list.length ? (
          <>
            {!wide && live.length > 0 && <OpenSum open={live} />}
            {list.map((b) => <OpenBet key={b.id} bet={b} wide={wide} onSettled={toSettled} />)}
          </>
        ) : shown.length ? (
          <Empty title="No open bets on this sport"><button className="lnk" onClick={showAll}>Show all</button></Empty>
        ) : (
          <Empty title="No open bets"><button className="btn" onClick={() => { useApp.getState().set({ sheet: null }); nav('/live') }}>See live matches</button></Empty>
        )
      ) : list.length ? (
        <>
          {!wide && <SettledSum list={list} />}
          {list.map((b) => wide ? (
            <article className={cx('tkt settled click', b.status)} key={b.id} role="button" tabIndex={0} aria-label={`Open bet card for ${b.sel}`} onClick={() => openCard(b.id)} onKeyDown={openOnKey(b.id)}>
              <div className="tkt-stub"><span className="micro">{b.placed.slice(0, b.placed.lastIndexOf(' '))}</span><b className="d">{b.placed.slice(b.placed.lastIndexOf(' ') + 1)}</b><span className="tkt-id d">{b.id}</span></div>
              <div className="tkt-body">
                <div className="tkt-top">
                  <div className="tkt-sel"><b>{b.sel}</b><span className="meta">{b.market} · {b.match}</span></div>
                  {resChip(b)}
                  <div className="tkt-nums">
                    <div><span className="meta">Odds</span><b className="d">{fmt(b.odds)}</b></div>
                    <div><span className="meta">Stake</span><b className="d"><Usdt />{money(b.stake)}</b></div>
                    <div><span className="meta">Returned</span><b className={cx('d', !b.returns && 'zero')}><Usdt />{money(b.returns)}</b></div>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <div className="ob settled click" key={b.id} role="button" tabIndex={0} aria-label={`Open bet card for ${b.sel}`} onClick={() => openCard(b.id)} onKeyDown={openOnKey(b.id)}>
              <div className="ob-h">
                <span className="ob-t"><b>{b.sel}</b><Ticket className="tk-i" size={15} /></span>
                {resChip(b)}
                <span className="meta ob-m">{b.market} · {b.match}</span>
              </div>
              <div className="ob-nums">
                <div><span className="meta">Odds</span><b className="d">{fmt(b.odds)}</b></div>
                <div><span className="meta">Stake</span><b className="d">{money(b.stake)}</b></div>
                <div><span className="meta">Returned</span><b className={cx('d', !b.returns && 'zero')}>{money(b.returns)}</b></div>
              </div>
              <div className="meta ob-when">Placed {b.placed}</div>
            </div>
          ))}
        </>
      ) : (
        <Empty title={range === 'today' ? 'Nothing settled today yet' : 'Nothing settled in this range'}><button className="lnk" onClick={showAll}>Show all time</button></Empty>
      )}
    </div>
  )
}

// My bets page header: the title, and one row of totals that follows the tab (open bets now, or the settled list shown)
export function BetsHead() {
  const bets = useApp((s) => s.bets)
  const user = useApp((s) => s.user)
  const view = useView()
  const open = bets.filter((b) => b.status === 'open')
  const settled = view.tab === 'settled' ? settledOf(bets, view) : []
  return (
    <header className="mb-top">
      <h1 className="title">My bets</h1>
      {!user ? null : view.tab === 'settled' ? (settled.length > 0 && <SettledSum list={settled} />) : open.length > 0 && <OpenSum open={open} />}
    </header>
  )
}
