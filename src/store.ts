// Slip, bets, follows, toasts and view state.
import { create } from 'zustand'
import { bookClock, closeMarket, useBook, MatchS, Sel, minuteOf, shorten } from './book'
import { dayAt, TEAMS } from './data'

export type SlipItem = { selId: string; stake: string; price: number; err?: { text: string; action: 'retry' | 'accept' | 'remove' } }
export type Bet = {
  id: string; selId: string; sel: string; market: string; matchId: string; match: string; sport: string
  odds: number; stake: number; placed: string; placedX: number; daysAgo: number
  status: 'open' | 'won' | 'lost' | 'cashed' | 'void'; returns: number; cashedAt?: number; isNew?: number
}
export type Receipt = { id: string; sel: string; market: string; odds: number; stake: number; time: string }
export type Toast = { id: number; text: string; action?: { label: string; run: () => void } }
type Pref = 'ask' | 'better' | 'any'

const pad = (n: number) => String(n).padStart(2, '0')
// settled dates are counted back from today, so the sample history never goes stale
export const dateAgo = (daysAgo: number) => { const d = dayAt(-daysAgo); return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}` }
const rid = () => 'HB-' + Array.from({ length: 5 }, () => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 32)]).join('')
export const matchName = (m: MatchS) => `${TEAMS[m.fx.home].short} v ${TEAMS[m.fx.away].short}`

// stable, realistic-looking ids for the sample history
function code(n: number) { let h = (n + 11) * 2654435761 >>> 0; let o = 'HB-'; for (let k = 0; k < 5; k++) { o += '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[h % 32]; h = Math.floor(h / 32) + (k + 1) * 977 } return o }
const seedBets: Bet[] = [
  { id: 'HB-4T8KD', selId: 'ars-bha:main:h', sel: 'Arsenal', market: 'Match result', matchId: 'ars-bha', match: 'Arsenal v Brighton', sport: 'football', odds: 1.62, stake: 25, placed: 'Today 14:52', placedX: 0, daysAgo: 0, status: 'open', returns: 40.5 },
  { id: 'HB-9MQ2W', selId: 'bar-sev:tg:o2.5', sel: 'Over 2.5', market: 'Total goals', matchId: 'bar-sev', match: 'Barcelona v Sevilla', sport: 'football', odds: 1.72, stake: 10, placed: 'Today 15:20', placedX: 0, daysAgo: 0, status: 'open', returns: 17.2 },
  ...(
    [
      ['Real Madrid', 'Match result', 'Real Madrid v Bayern', 'football', 2.1, 20, 'won', 42, '20:04', 1],
      ['Under 2.5', 'Total goals', 'Juventus v Roma', 'football', 1.8, 15, 'lost', 0, '18:31', 2],
      ['Dortmund', 'Match result', 'Dortmund v Leipzig', 'football', 2.4, 25, 'cashed', 31.2, '16:10', 3],
      ['R. Varga', 'Match winner', 'R. Varga v D. Keane', 'tennis', 1.55, 30, 'won', 46.5, '13:42', 5],
      ['Draw', 'Match result', 'Inter v PSG', 'football', 3.4, 10, 'lost', 0, '21:15', 8],
      ['Owls', 'Match winner', 'Owls v Foxes', 'basketball', 1.9, 20, 'lost', 0, '19:05', 13],
      ['Liverpool', 'Match result', 'Liverpool v Chelsea', 'football', 1.75, 20, 'void', 20, '17:30', 21],
    ] as const
  ).map(([sel, market, match, sport, odds, stake, status, returns, time, daysAgo], i): Bet => ({ id: code(i), selId: '', sel, market, matchId: '', match, sport, odds, stake, placed: `${dateAgo(daysAgo)} ${time}`, placedX: 0, daysAgo, status, returns })),
  ...older(),
]
// a month of sample history, so the profile statistics have something to say
function older(): Bet[] {
  const T = [
    ['Arsenal', 'Match result', 'Arsenal v Fulham', 'football'], ['Over 2.5', 'Total goals', 'Barcelona v Valencia', 'football'], ['Yes', 'Both teams to score', 'Dortmund v Bayern', 'football'],
    ['K. Sato', 'Match winner', 'K. Sato v T. Holm', 'tennis'], ['Draw', 'Match result', 'Roma v Napoli', 'football'], ['Comets', 'Match winner', 'Comets v Rays', 'basketball'],
    ['Liverpool', 'Match result', 'Liverpool v Everton', 'football'], ['Under 2.5', 'Total goals', 'Juventus v Inter', 'football'], ['Northwind', 'Match winner', 'Northwind v Lumen', 'esports'],
    ['Real Madrid', 'Match result', 'Real Madrid v Atlético', 'football'], ['L. Duarte', 'Match winner', 'L. Duarte v M. Petrov', 'tennis'], ['Over 160.5', 'Total points', 'Owls v Giants', 'basketball'],
  ]
  const stakes = [5, 10, 15, 20, 25, 30, 40, 50]
  const out: Bet[] = []
  for (let i = 0; i < 22; i++) {
    const [sel, market, match, sport] = T[i % T.length]
    const odds = +(1.45 + ((i * 37) % 19) / 10).toFixed(2)
    const stake = stakes[(i * 5 + 3) % 8]
    const r = (i * 7 + 2) % 10
    const status: Bet['status'] = r < 5 ? 'won' : r < 8 ? 'lost' : r === 8 ? 'cashed' : 'void'
    const returns = status === 'won' ? +(stake * odds).toFixed(2) : status === 'lost' ? 0 : status === 'void' ? stake : +(stake * (0.7 + (i % 5) * 0.15)).toFixed(2)
    const daysAgo = 4 + Math.floor((i * 26) / 22)
    const placed = `${dateAgo(daysAgo)} ${pad(12 + (i % 9))}:${pad((i * 13) % 60)}`
    out.push({ id: code(40 + i), selId: '', sel, market, matchId: '', match, sport, odds, stake, placed, placedX: 0, daysAgo, status, returns })
  }
  return out.sort((a, b) => a.daysAgo - b.daysAgo)
}

type App = {
  slip: SlipItem[]; receipts: Receipt[]; placing: null | { until: number; ms: number; inplay: boolean }
  pref: Pref; balance: number; bets: Bet[]; follow: string[]
  toasts: Toast[]; panelTab: 'slip' | 'bets' | 'chat'; sheet: null | 'slip' | 'bets' | 'chat'; menu: boolean; scenes: boolean; search: boolean
  failNext: boolean; declineCash: boolean; failIdx: number
  user: null | { alias: string }; profile: boolean; card: string | null; wallet: boolean
  stash: null | { bets: Bet[]; balance: number }
  logout: () => void
  sf: Record<string, { tab: string; comp: string }>; matchTab: string | null
  setSF: (sport: string, p: Partial<{ tab: string; comp: string }>) => void
  login: () => void
  set: (p: Partial<App>) => void
  toggle: (selId: string) => void
  remove: (selId: string) => void
  setStake: (selId: string, v: string) => void
  accept: (selId?: string) => void
  place: () => void
  clearErr: (selId: string) => void
  removeDead: () => void
  cashOut: (betId: string, value: number) => void
  toast: (text: string, action?: Toast['action']) => void
  toggleFollow: (id: string, name: string) => void
  shellToast: () => void
}
let tid = 1
export const useApp = create<App>((set, get) => ({
  slip: [], receipts: [], placing: null, pref: 'better', balance: 1000, bets: seedBets, follow: ['c:pl', 't:ars'],
  toasts: [], panelTab: 'slip', sheet: null, menu: false, scenes: false, search: false,
  failNext: false, declineCash: false, failIdx: 0,
  user: { alias: 'wave_rider_52' }, profile: false, card: null, wallet: false, stash: null,
  sf: {}, matchTab: null,
  setSF: (sport, p) => set({ sf: { ...get().sf, [sport]: { ...(get().sf[sport] ?? { tab: 'now', comp: 'all' }), ...p } } }),
  // the demo player: no password. Logging out puts the account's bets and balance away; logging in brings them back.
  login: () => {
    const st = get()
    if (st.user) return
    set({ user: { alias: 'wave_rider_52' }, bets: st.stash?.bets ?? st.bets, balance: st.stash?.balance ?? st.balance, stash: null, menu: false })
    get().toast('Signed in as wave_rider_52, the demo player. No password needed in this prototype.')
  },
  logout: () => {
    const st = get()
    if (!st.user) return
    set({ user: null, stash: { bets: st.bets, balance: st.balance }, bets: [], slip: st.slip.map((i) => ({ ...i, err: undefined })), receipts: [], wallet: false, card: null, profile: false, sheet: null, menu: false })
    get().toast('Logged out. Your demo bets and balance are kept for when you log back in.')
  },
  set: (p) => set(p),
  toast: (text, action) => {
    const id = tid++
    set({ toasts: [...get().toasts.slice(-1), { id, text, action }] })
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 4200)
  },
  shellToast: () => get().toast('This part of Housebets is outside this prototype. You’re playing with a demo balance.'),
  toggle: (selId) => {
    const { slip } = get()
    const sel = useBook.getState().sels[selId]
    if (slip.some((i) => i.selId === selId)) return get().remove(selId)
    if (!sel || sel.settled) return get().toast('That selection has already been settled.')
    if (useBook.getState().mkts[sel.mk].closed) return get().toast('That market is closed.')
    set({ slip: [...slip, { selId, stake: '', price: sel.price }], receipts: [], panelTab: 'slip' })
  },
  remove: (selId) => {
    const item = get().slip.find((i) => i.selId === selId)
    if (!item) return
    set({ slip: get().slip.filter((i) => i.selId !== selId) })
    get().toast('Removed from your slip', { label: 'Undo', run: () => set({ slip: [...get().slip.filter((i) => i.selId !== selId), item] }) })
  },
  setStake: (selId, v) => set({ slip: get().slip.map((i) => (i.selId === selId ? { ...i, stake: v, err: undefined } : i)) }),
  clearErr: (selId) => set({ slip: get().slip.map((i) => (i.selId === selId ? { ...i, err: undefined } : i)) }),
  // drop everything that can no longer be bet on: closed markets and settled selections
  removeDead: () => {
    const b = useBook.getState()
    const dead = get().slip.filter((i) => isDead(i.selId, b))
    if (!dead.length) return
    set({ slip: get().slip.filter((i) => !dead.includes(i)) })
    get().toast(dead.length > 1 ? `Removed ${dead.length} closed selections` : 'Removed the closed selection', { label: 'Undo', run: () => set({ slip: [...get().slip, ...dead.filter((d) => !get().slip.some((i) => i.selId === d.selId))] }) })
  },
  accept: (selId) => {
    const sels = useBook.getState().sels
    set({ slip: get().slip.map((i) => (!selId || i.selId === selId ? { ...i, price: sels[i.selId].price, err: undefined } : i)) })
  },
  place: () => {
    const st = get()
    if (st.placing) return
    const book = useBook.getState()
    const ready = st.slip.filter((i) => stakeState(i, st.balance).ok && !book.mkts[book.sels[i.selId].mk].sus && !book.sels[i.selId].settled)
    if (ready.reduce((a, i) => a + +i.stake, 0) > st.balance + 0.001) return get().toast('Total stake is more than your demo balance.')
    if (!ready.length) return
    st.accept()
    // the price is fixed at the moment of the tap, so the bet lands at the number the player saw
    const taken: Record<string, number> = Object.fromEntries(ready.map((i) => [i.selId, book.sels[i.selId].price]))
    const inplay = ready.some((i) => book.matches[book.sels[i.selId].match].live)
    const ms = inplay ? 1600 : 700
    set({ placing: { until: Date.now() + ms, ms, inplay } })
    setTimeout(() => {
      const s2 = get()
      const b2 = useBook.getState()
      if (s2.failNext) {
        const reasons: SlipItem['err'][] = [
          { text: 'Not placed. The price moved before your bet was accepted.', action: 'accept' },
          { text: 'Not placed. The connection dropped, and your stake was not taken.', action: 'retry' },
          { text: 'Not placed. This market closed before your bet was accepted.', action: 'remove' },
        ]
        const err = reasons[s2.failIdx % reasons.length]!
        if (err.action === 'accept') ready.forEach((i) => shorten(i.selId, 0.04))
        // "market closed" is real: the market shuts, takes no stake, and comes back a little later
        if (err.action === 'remove') ready.forEach((i) => closeMarket(b2.sels[i.selId].mk, 'Closed by the trader', 25000))
        set({ placing: null, failNext: false, failIdx: s2.failIdx + 1, slip: s2.slip.map((i) => (ready.some((r) => r.selId === i.selId) ? { ...i, err } : i)) })
        return
      }
      const placedIds = new Set(ready.map((r) => r.selId))
      const newBets: Bet[] = []
      const receipts: Receipt[] = []
      let spent = 0
      for (const i of s2.slip) {
        if (!placedIds.has(i.selId)) continue
        const sel = b2.sels[i.selId]
        const m = b2.matches[sel.match]
        const stake = +(+i.stake).toFixed(2)
        const id = rid()
        spent += stake
        const mk = b2.mkts[sel.mk]
        newBets.push({ id, selId: sel.id, sel: sel.name, market: mk.name, matchId: m.id, match: matchName(m), sport: m.fx.sport, odds: taken[i.selId], stake, placed: `Today ${bookClock()}`, placedX: m.x, daysAgo: 0, status: 'open', returns: +(stake * taken[i.selId]).toFixed(2), isNew: Date.now() })
        receipts.push({ id, sel: sel.name, market: `${mk.name} · ${matchName(m)}`, odds: taken[i.selId], stake, time: bookClock(true) })
      }
      set({ placing: null, slip: s2.slip.filter((i) => !placedIds.has(i.selId)), receipts, bets: [...newBets, ...s2.bets], balance: +(s2.balance - spent).toFixed(2) })
      // the receipt steps aside by itself; the bet stays in My bets
      setTimeout(() => { if (get().receipts === receipts) set({ receipts: [] }) }, 10000)
    }, ms)
  },
  cashOut: (betId, value) => {
    const st = get()
    set({ bets: st.bets.map((b) => (b.id === betId ? { ...b, status: 'cashed', returns: value, cashedAt: Date.now() } : b)), balance: +(st.balance + value).toFixed(2) })
  },
  toggleFollow: (id, name) => {
    const { follow } = get()
    const on = follow.includes(id)
    set({ follow: on ? follow.filter((x) => x !== id) : [...follow, id] })
    get().toast(on ? `Unfollowed ${name}` : `Following ${name} · it now appears in Following`)
  },
}))

// a slip item that can never be placed as it stands: its market is closed or its selection is settled
export function isDead(selId: string, b = useBook.getState()) {
  const sel = b.sels[selId]
  return !sel || !!sel.settled || !!b.mkts[sel.mk].closed
}
// when the score decides a selection, open bets on it are paid or lost straight away
window.addEventListener('hb-settled', (e) => {
  const ids: string[] = (e as CustomEvent).detail.ids
  const st = useApp.getState()
  const sels = useBook.getState().sels
  let credit = 0
  const notes: string[] = []
  const bets = st.bets.map((b): Bet => {
    if (b.status !== 'open' || !ids.includes(b.selId)) return b
    const won = sels[b.selId].settled === 'won'
    const returns = won ? +(b.stake * b.odds).toFixed(2) : 0
    credit += returns
    notes.push(won ? `Bet won · ${b.sel} · ${returns.toFixed(2)} USDT returned` : `Bet lost · ${b.sel} · ${b.match}`)
    return { ...b, status: won ? 'won' : 'lost', returns }
  })
  if (!notes.length) return
  useApp.setState({ bets, balance: +(st.balance + credit).toFixed(2) })
  st.toast(notes.length > 1 ? `${notes.length} bets settled · ${credit.toFixed(2)} USDT returned` : notes[0])
})

export function stakeState(i: SlipItem, balance: number): { ok: boolean; msg?: string; n: number } {
  const n = parseFloat(i.stake)
  if (!i.stake || isNaN(n) || n === 0) return { ok: false, n: 0 }
  if (n < 0.1) return { ok: false, n, msg: 'Minimum stake 0.10 USDT' }
  if (n > 500) return { ok: false, n, msg: 'Maximum stake is 500 USDT on this market' }
  if (n > balance) return { ok: false, n, msg: `More than your demo balance (${balance.toFixed(2)} USDT)` }
  return { ok: true, n }
}
// does this slip item need the player to accept a new price?
export function needsAccept(i: SlipItem, sel: Sel, pref: Pref) {
  if (sel.price === i.price) return false
  if (pref === 'any') return false
  if (pref === 'better' && sel.price > i.price) return false
  return true
}
export const cashValue = (b: Bet, price: number) => +((b.stake * b.odds) / price * 0.95).toFixed(2)
export const minuteLabel = (m: MatchS) => (m.fx.sport !== 'football' ? m.period : m.period === 'HT' || m.period === 'FT' ? m.period : minuteOf(m) >= 90 ? `90+${minuteOf(m) - 89}'` : `${minuteOf(m)}'`)
