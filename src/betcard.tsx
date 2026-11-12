// Your bets, live: a strip that rotates through the matches you have open bets on,
// and a ticket-style bet card that opens from any bet (open, settled or just placed).
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Copy, Lock, X } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { fmt, money, useBook } from './book'
import { Bet, cashValue, minuteLabel, useApp } from './store'
import { TEAMS } from './data'
import { Crest, cx, LiveDot, Plate, Tideline, Usdt, WaveMark } from './ui'

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
  const [i, setI] = useState(0)
  const [hold, setHold] = useState(false)
  useEffect(() => {
    if (hold || live.length < 2) return
    const t = setInterval(() => setI((x) => x + 1), 5000)
    return () => clearInterval(t)
  }, [hold, live.length])
  if (!live.length) return null
  // a bet whose match is paused jumps the queue: that is the one the player needs to see
  const hot = live.findIndex((b) => matches[b.matchId].pause)
  const idx = hot >= 0 ? hot : i % live.length
  const bet = live[idx]
  const m = matches[bet.matchId]
  const sel = sels[bet.selId]
  const value = cashValue(bet, sel.price)
  const diff = value - bet.stake
  const sus = mkts[sel.mk].sus
  return (
    <div className="strip" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <button className="strip-b" onClick={() => set({ card: bet.id })} aria-label={`Your bet on ${bet.match}. Open bet card`}>
        <span className="micro lab">Your bets live</span>
        <span key={bet.id} className="strip-in">
          <span className="st-m"><LiveDot /><span className="d">{minuteLabel(m)}</span></span>
          <span className="st-t"><Crest id={m.fx.home} size={16} /><b>{TEAMS[m.fx.home].short}</b><Plate m={m} /><b>{TEAMS[m.fx.away].short}</b><Crest id={m.fx.away} size={16} /></span>
          <span className="st-s"><span className="meta">Your bet</span><b>{bet.sel}</b><span className="d meta">@ {fmt(bet.odds)}</span></span>
          <span className="st-l"><Tideline pts={valuePts(bet, sel.hist)} h={22} x0={bet.placedX} xNow={m.x} gaps={m.gaps} end={-sel.dir} minSpan={bet.stake * 0.08} /></span>
          {sus ? <span className="st-v sus"><Lock size={14} /> {sus.reason}</span> : (
            <span className="st-v"><span className="meta">Cash out</span><b className="d"><Usdt />{money(value)}</b><em className={cx('pc', diff >= 0 ? 'u' : 'dn')}>{diff >= 0 ? '+' : '−'}{money(Math.abs(diff))}</em></span>
          )}
        </span>
      </button>
      {live.length > 1 && (
        <span className="strip-n" role="tablist" aria-label="Your live bets">
          {live.map((b, k) => <button key={b.id} role="tab" aria-selected={k === idx} aria-label={`${b.sel}, ${b.match}`} className={cx(k === idx && 'on', k === idx && !hold && hot < 0 && 'run')} onClick={() => setI(k)}><i /></button>)}
        </span>
      )}
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
export function BetCard() {
  const id = useApp((s) => s.card)
  const bet = useApp((s) => s.bets.find((b) => b.id === s.card))
  const set = useApp((s) => s.set)
  const toast = useApp((s) => s.toast)
  const sel = useBook((s) => (bet?.selId ? s.sels[bet.selId] : undefined))
  const m = useBook((s) => (bet?.matchId ? s.matches[bet.matchId] : undefined))
  const lull = useBook((s) => s.lull)
  const [, nav] = useLocation()
  useEffect(() => {
    if (!id) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && set({ card: null })
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [id])
  if (!id || !bet) return null
  const open = bet.status === 'open'
  const live = !!m && m.live && !lull && open
  const value = sel && open ? cashValue(bet, sel.price) : 0
  const toReturn = bet.stake * bet.odds
  const result = bet.returns - bet.stake
  const [home, away] = bet.match.split(' v ')
  const close = () => set({ card: null })
  return (
    <div className="card-ov" role="dialog" aria-label={`Bet ${bet.id}`}>
      <div className="scrim" onClick={close} />
      <div className="card-w">
        <article className={cx('ticket', bet.status)}>
          <header>
            <img src="./brand/logo.svg" alt="Housebets" />
            <span className={cx('stamp', bet.status)}>{live && <LiveDot />}{bet.status === 'won' && <Check size={13} weight="bold" />}{live ? 'Live' : STATUS[bet.status]}</span>
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
            <div className="meta tk-when">{live ? <><LiveDot still />{minuteLabel(m!)} · in play</> : m && open ? `Kick-off ${m.fx.day ?? ''} ${m.fx.time ?? ''}` : `Placed ${bet.placed}`}</div>
          </div>
          {sel && m && open ? (
            <div className="tk-chart">
              <div className="tk-ch"><span className="micro">{live ? 'Cash-out value' : 'Price since you bet'}</span>{live && <b className="d"><Usdt />{money(value)}<em className={cx('pc', value >= bet.stake ? 'u' : 'dn')}>{value >= bet.stake ? '+' : '−'}{money(Math.abs(value - bet.stake))}</em></b>}</div>
              <Tideline pts={live ? valuePts(bet, sel.hist) : sel.hist.filter((p) => p[0] >= bet.placedX).concat([[m.x, sel.price]])} h={56} x0={bet.placedX} xNow={m.x} gaps={m.gaps} marks={m.goals.map((g) => g.m).filter((x) => x > bet.placedX)} level={live ? bet.stake : undefined} end={live ? -sel.dir : sel.dir} minSpan={live ? bet.stake * 0.08 : sel.open * 0.08} draw />
              {live && <div className="micro ax"><span>Placed</span><span>Dashed line is your stake</span><span>Now</span></div>}
            </div>
          ) : (
            <div className={cx('tk-result', bet.status)}>
              <WaveMark />
              <b className="d">{bet.status === 'lost' ? '−' : result >= 0 ? '+' : '−'}{money(Math.abs(bet.status === 'lost' ? bet.stake : result))}</b>
              <span className="meta">{bet.status === 'won' ? 'profit' : bet.status === 'lost' ? 'stake lost' : bet.status === 'void' ? 'stake returned' : open ? 'awaiting kick-off' : 'against your stake'}</span>
            </div>
          )}
          <div className="tear" aria-hidden />
          <div className="tk-nums">
            <div><span className="meta">Stake</span><b className="d"><Usdt />{money(bet.stake)}</b></div>
            <ArrowRight size={14} />
            <div><span className="meta">{open ? 'To return' : 'Returned'}</span><b className={cx('d', !open && !bet.returns && 'zero')}><Usdt />{money(open ? toReturn : bet.returns)}</b></div>
          </div>
          <footer>
            <div><b className="d">{bet.id}</b><span className="meta">Placed {bet.placed}</span><span className="meta">Sample bet · no real money</span></div>
            <Mark id={bet.id} />
          </footer>
        </article>
        <div className="card-acts">
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(bet.id).then(() => toast(`Copied ${bet.id}`), () => toast(bet.id)) }}><Copy size={16} /> Copy bet ID</button>
          {m && <button className="btn" onClick={() => { close(); useApp.getState().set({ sheet: null }); nav(`/match/${m.id}`) }}>Open match</button>}
          <button className="btn pri" onClick={close}><X size={16} /> Close</button>
        </div>
      </div>
    </div>
  )
}
