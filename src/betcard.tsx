// Your bets, live: a strip that rotates through the matches you have open bets on,
// and a ticket-style bet card that opens from any bet (open, settled or just placed).
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CaretRight, Check, Copy, Lock, X } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { bookClock, fmt, money, useBook } from './book'
import { Bet, cashValue, minuteLabel, useApp } from './store'
import { COMPS, dayAt, dayLabel, TEAMS } from './data'
import { Crest, cx, EXIT, LiveDot, Plate, reduced, Tideline, useIsPhone, usePresence, Usdt, WaveMark } from './ui'

const useLiveBets = () => {
  const bets = useApp((s) => s.bets)
  const matches = useBook((s) => s.matches)
  const lull = useBook((s) => s.lull)
  return useMemo(() => bets.filter((b) => b.status === 'open' && b.selId && matches[b.matchId]?.live && !lull), [bets, matches, lull])
}
const valuePts = (bet: Bet, hist: [number, number][]) => {
  const pts = hist.filter((p) => p[0] >= bet.placedX).map((p) => [p[0], cashValue(bet, p[1])] as [number, number])
  if (!pts.length || pts[0][0] > bet.placedX) pts.unshift([bet.placedX, cashValue(bet, bet.odds)])
  return pts
}

export function BetStrip() {
  const live = useLiveBets()
  const sels = useBook((s) => s.sels)
  const matches = useBook((s) => s.matches)
  const mkts = useBook((s) => s.mkts)
  const set = useApp((s) => s.set)
  // anything open over the page holds the strip where it is
  const busy = useApp((s) => !!(s.sheet || s.card || s.menu || s.search))
  const phone = useIsPhone()
  const [i, setI] = useState(0)
  const [hold, setHold] = useState(false)
  const [focus, setFocus] = useState(false)
  const [loc] = useLocation()
  const n = live.length
  const idx = n ? i % n : 0
  const bet = live[idx] as Bet | undefined
  // My bets already lists every bet, so the strip steps aside there and slides back on every other page
  const off = loc === '/bets'
  // it stays on a bet whose match is paused, and on the bet for the match page the player is reading
  const paused = !!bet && !!matches[bet.matchId].pause
  const here = !!bet && loc === `/match/${bet.matchId}`
  const still = hold || focus || busy || off || paused || here
  const held = useRef(false)
  held.current = hold || focus || busy
  useEffect(() => {
    if (still || n < 2 || reduced()) return
    const t = setTimeout(() => setI((idx + 1) % n), 5000)
    return () => clearTimeout(t)
  }, [still, n, idx])
  // Jump once, not continuously: to the bet for the match page just opened, and to a bet whose match has just paused
  // (that is the one the player needs to see). After that the pager is the player's again.
  const jump = (id?: string) => { const k = live.findIndex((b) => b.id === id); if (k >= 0 && !held.current) setI(k) }
  const hereId = live.find((b) => loc === `/match/${b.matchId}`)?.id
  const hotId = live.find((b) => matches[b.matchId].pause)?.id
  useEffect(() => jump(hereId), [hereId])
  useEffect(() => jump(hotId), [hotId])
  if (!bet) return null
  const m = matches[bet.matchId]
  const sel = sels[bet.selId]
  const value = cashValue(bet, sel.price)
  const diff = value - bet.stake
  const sus = mkts[sel.mk].sus
  const run = !still && n > 1 && !reduced()
  return (
    <div className={cx('strip', off && 'off')} inert={off} aria-hidden={off} data-here={here || undefined} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onFocus={(e) => setFocus((e.target as HTMLElement).matches(':focus-visible'))} onBlur={() => setFocus(false)}>
      <div className="sp-lab">
        <span className="micro">Your bets live</span>
        {n > 1 && (phone ? (
          // on the phone the marks are too small to tap one by one: the column is one button that steps to the next bet
          <button className="strip-nx" aria-label={`Next live bet. Showing ${idx + 1} of ${n}`} onClick={() => setI((idx + 1) % n)}>
            {live.map((b, k) => <i key={b.id} className={cx(k === idx && 'on')} />)}
          </button>
        ) : (
          <span className="strip-n" role="group" aria-label="Your live bets">
            {live.map((b, k) => <button key={b.id} aria-current={k === idx ? 'true' : undefined} aria-label={`${b.sel}, ${b.match}`} className={cx(k === idx && 'on', k === idx && run && 'run')} onClick={() => setI(k)}><i /></button>)}
          </span>
        ))}
      </div>
      <button className="strip-b" onClick={() => set({ card: bet.id })} aria-label={`Your bet on ${bet.match}. Open bet card`}>
        <span key={bet.id} className="strip-in">
          <span className="sp-c c-match">
            <small><LiveDot /><span className="d">{minuteLabel(m)}</span><span className="cmp"> · {COMPS[m.fx.comp].name}</span></small>
            <span className="st-t"><Crest id={m.fx.home} size={16} /><b>{TEAMS[m.fx.home].short}</b><Plate m={m} /><b>{TEAMS[m.fx.away].short}</b><Crest id={m.fx.away} size={16} /></span>
          </span>
          <span className="sp-c c-sel"><small>Your bet</small><b>{bet.sel} <span className="d at">@ {fmt(bet.odds)}</span></b></span>
          <span className="sp-c c-stake"><small>Stake</small><b className="d"><Usdt />{money(bet.stake)}</b></span>
          <span className="sp-c c-trend"><small>Value since placed</small><span className="sp-spark"><Tideline pts={valuePts(bet, sel.hist)} h={20} x0={bet.placedX} xNow={m.x} gaps={m.gaps} level={bet.stake} end={-sel.dir} minSpan={bet.stake * 0.08} /></span></span>
          {sus ? <span className="sp-c c-cash sus"><small>Cash out paused</small><b><Lock size={14} /> <span className="sp-why">{sus.reason}</span><span className="sp-short">Paused</span></b></span> : (
            <span className="sp-c c-cash"><small>Cash out now</small><b className="d"><Usdt />{money(value)}<em className={cx('pc', diff >= 0 ? 'u' : 'dn')}>{diff >= 0 ? '+' : '−'}{money(Math.abs(diff))}</em></b></span>
          )}
        </span>
        <CaretRight className="sp-go" size={14} />
      </button>
    </div>
  )
}

// a row of bars drawn from the bet id, so every ticket has its own mark
function Mark({ id }: { id: string }) {
  let h = 7
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const bars = Array.from({ length: 34 }, (_, k) => { h = (h * 1103515245 + 12345) >>> 0; return 1 + ((h >>> 16) % 3) + (k % 7 === 0 ? 1 : 0) })
  let x = 0
  return (
    <svg className="mark" width="132" height="22" viewBox="0 0 132 22" aria-hidden>
      {bars.map((w, k) => { const r = <rect key={k} x={x} y={k % 5 === 2 ? 4 : 0} width={w} height={k % 5 === 2 ? 18 : 22} rx={0.5} />; x += w + 2; return x < 132 ? r : null })}
    </svg>
  )
}

const STATUS = { open: 'Open', won: 'Won', lost: 'Lost', cashed: 'Cashed out', void: 'Void' } as const
// The card is made to be screenshotted, so its dates are absolute: "Today 14:52" is wrong tomorrow.
const dmy = (d: Date) => `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`
const placedOn = (bet: Bet) => `${dmy(dayAt(-bet.daysAgo))}, ${bet.placed.split(' ').pop()}`
const kickOff = (day = '', time = '') => { let off = 0; while (off < 15 && dayLabel(off) !== day) off++; return `${off < 15 ? dmy(dayAt(off)) : day}, ${time}` }
export function BetCard() {
  const cur = useApp((s) => s.bets.find((b) => b.id === s.card))
  const set = useApp((s) => s.set)
  const toast = useApp((s) => s.toast)
  // the last bet shown stays in hand while the card leaves, so it does not empty on the way out
  const last = useRef<Bet | undefined>(undefined)
  if (cur) last.current = cur
  const bet = cur ?? last.current
  const shown = !!cur
  const { mounted, closing } = usePresence(shown, EXIT.dialog)
  const sel = useBook((s) => (bet?.selId ? s.sels[bet.selId] : undefined))
  const m = useBook((s) => (bet?.matchId ? s.matches[bet.matchId] : undefined))
  const lull = useBook((s) => s.lull)
  const [, nav] = useLocation()
  const box = useRef<HTMLDivElement>(null)
  // Focus moves into the card when it opens, stays inside it, and goes back where it was on close. Escape closes the
  // card only: the listener runs first and stops there, so the sheet under it on the phone stays open.
  useEffect(() => {
    if (!shown) return
    const prev = document.activeElement as HTMLElement | null
    box.current?.focus({ preventScroll: true })
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); set({ card: null }); return }
      if (e.key !== 'Tab' || !box.current) return
      const f = box.current.querySelectorAll<HTMLElement>('button')
      const a = document.activeElement
      const [first, end] = [f[0], f[f.length - 1]]
      if (!first) return
      if (!box.current.contains(a) || a === (e.shiftKey ? first : end) || (e.shiftKey && a === box.current)) { e.preventDefault(); (e.shiftKey ? end : first).focus() }
    }
    window.addEventListener('keydown', k, true)
    return () => { window.removeEventListener('keydown', k, true); prev?.focus?.({ preventScroll: true }) }
  }, [shown])
  if (!mounted || !bet) return null
  const open = bet.status === 'open'
  const live = !!m && m.live && !lull && open
  const value = sel && open ? cashValue(bet, sel.price) : 0
  const toReturn = bet.stake * bet.odds
  const net = (open ? toReturn : bet.returns) - bet.stake
  const [home, away] = bet.match.split(' v ')
  const close = () => set({ card: null })
  // what decided a settled bet, in one line: "Won · FT 2–1", "Cashed out · 67'", "Void · Match abandoned"
  const why = bet.result ?? (bet.cashedAt ? bookClock(false, bet.cashedAt) : m && m.period === 'FT' ? `FT ${m.score[0]}–${m.score[1]}` : '')
  return (
    <div className={cx('card-ov', closing && 'is-closing')} role="dialog" aria-modal="true" aria-label={`Bet ${bet.id}`}>
      <div className={cx('scrim', closing && 'is-closing')} onClick={close} />
      <div ref={box} tabIndex={-1} className={cx('card-w', closing && 'is-closing')}>
        <div className="card-top"><button className="card-x" onClick={close} aria-label="Close bet card"><X size={18} /></button></div>
        <article className={cx('ticket', bet.status)}>
          <header>
            <img src="./brand/logo.svg" alt="Housebets" />
            <span className={cx('stamp', bet.status, live && 'live')}>{live && <LiveDot />}{bet.status === 'won' && <Check size={13} weight="bold" />}{live ? 'Live' : STATUS[bet.status]}</span>
          </header>
          <div className="tk-main">
            <div className="micro">Single · {bet.market}</div>
            <h3>{bet.sel}</h3>
            <div className="tk-odds d"><span>@</span>{fmt(bet.odds)}</div>
            <div className="tk-match">
              {m ? (
                <>
                  <span><Crest id={m.fx.home} size={20} /><b>{TEAMS[m.fx.home].short}</b></span>
                  {m.live && !lull ? <Plate m={m} /> : <i className="vs">v</i>}
                  <span><b>{TEAMS[m.fx.away].short}</b><Crest id={m.fx.away} size={20} /></span>
                </>
              ) : (
                <><span><b>{home}</b></span><i className="vs">v</i><span><b>{away}</b></span></>
              )}
            </div>
            <div className="meta tk-when">{live ? <><LiveDot still />{minuteLabel(m!)} · in play</> : !open ? `${STATUS[bet.status]}${why && ' · '}${why}` : m?.fx.time ? `Kick-off ${kickOff(m.fx.day, m.fx.time)}` : 'Starting soon'}</div>
          </div>
          {sel && m && live ? (
            <div className="tk-chart">
              <div className="tk-ch"><span className="micro">Cash-out value</span><b className="d"><Usdt />{money(value)}<em className={cx('pc', value >= bet.stake ? 'u' : 'dn')}>{value >= bet.stake ? '+' : '−'}{money(Math.abs(value - bet.stake))}</em></b></div>
              <Tideline pts={valuePts(bet, sel.hist)} h={56} x0={bet.placedX} xNow={m.x} gaps={m.gaps} marks={m.goals.map((g) => g.m).filter((x) => x > bet.placedX)} level={bet.stake} end={-sel.dir} minSpan={bet.stake * 0.08} draw />
              <div className="tk-key"><i aria-hidden />Stake {money(bet.stake)}</div>
            </div>
          ) : (
            // settled, or not kicked off yet: one figure and what it is. A price line with nothing to draw is left out.
            <div className={cx('tk-result', bet.status)}>
              <WaveMark />
              <b className="d">{bet.status === 'void' ? '' : bet.status === 'lost' || net < 0 ? '−' : '+'}{money(bet.status === 'lost' || bet.status === 'void' ? bet.stake : Math.abs(net))}</b>
              <span className="meta">{bet.status === 'won' ? 'profit' : bet.status === 'lost' ? 'stake lost' : bet.status === 'void' ? 'stake returned' : open ? 'profit if it wins' : 'vs stake'}</span>
            </div>
          )}
          <div className="tear" aria-hidden />
          <div className="tk-nums">
            <div><span className="meta">Stake</span><b className="d"><Usdt />{money(bet.stake)}</b></div>
            <ArrowRight size={14} />
            <div><span className="meta">{open ? 'To return' : 'Returned'}</span><b className={cx('d', !open && !bet.returns && 'zero')}><Usdt />{money(open ? toReturn : bet.returns)}</b></div>
          </div>
          <footer>
            <div><b className="d">{bet.id}</b><span className="meta">Placed {placedOn(bet)}</span><span className="meta">Sample bet · no real money</span></div>
            <Mark id={bet.id} />
          </footer>
        </article>
        <div className="card-acts">
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(bet.id).then(() => toast(`Copied ${bet.id}`), () => toast(bet.id)) }}><Copy size={16} /> Copy bet ID</button>
          {m && <button className="btn" onClick={() => { close(); useApp.getState().set({ sheet: null }); nav(`/match/${m.id}`) }}>Open match</button>}
        </div>
      </div>
    </div>
  )
}
