// Sample data only. Football clubs are the ones named in the contest brief; every player is fictional.
export type Sport = 'football' | 'tennis' | 'basketball' | 'esports'
export const SPORTS: { id: Sport; name: string }[] = [
  { id: 'football', name: 'Football' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'esports', name: 'Esports' },
]

export type Team = { id: string; name: string; short: string; c: [string, string] }
const t = (id: string, name: string, short: string, a: string, b: string): Team => ({ id, name, short, c: [a, b] })
export const TEAMS: Record<string, Team> = Object.fromEntries(
  [
    t('ars', 'Arsenal', 'Arsenal', '#e63950', '#f3f3f5'),
    t('bha', 'Brighton & Hove Albion', 'Brighton', '#2f7de1', '#f3f3f5'),
    t('avl', 'Aston Villa', 'Aston Villa', '#7b2d52', '#8fc7ea'),
    t('ful', 'Fulham', 'Fulham', '#eceef1', '#2a2d33'),
    t('new', 'Newcastle United', 'Newcastle', '#e8eaed', '#23262b'),
    t('eve', 'Everton', 'Everton', '#2a55c9', '#e8eaed'),
    t('liv', 'Liverpool', 'Liverpool', '#d5263c', '#f0c94a'),
    t('mun', 'Manchester United', 'Man United', '#e24a2c', '#1d1f24'),
    t('che', 'Chelsea', 'Chelsea', '#2450c8', '#e8eaed'),
    t('tot', 'Tottenham Hotspur', 'Tottenham', '#eef0f2', '#1b2a52'),
    t('mci', 'Manchester City', 'Man City', '#7cc4ee', '#eef0f2'),
    t('whu', 'West Ham United', 'West Ham', '#7b2d42', '#7cc4ee'),
    t('rma', 'Real Madrid', 'Real Madrid', '#f1ecdc', '#c9a44a'),
    t('bay', 'Bayern Munich', 'Bayern', '#d1203f', '#2f58c4'),
    t('int', 'Inter', 'Inter', '#2254c4', '#16181c'),
    t('bar', 'Barcelona', 'Barcelona', '#1f4fb5', '#a8243e'),
    t('psg', 'Paris Saint-Germain', 'PSG', '#1c2f66', '#d1203f'),
    t('sev', 'Sevilla', 'Sevilla', '#eef0f2', '#d1203f'),
    t('atm', 'Atlético Madrid', 'Atlético', '#d1203f', '#eef0f2'),
    t('val', 'Valencia', 'Valencia', '#eef0f2', '#f08a2a'),
    t('juv', 'Juventus', 'Juventus', '#e6e8eb', '#1c1e22'),
    t('rom', 'Roma', 'Roma', '#9d2a26', '#f0a23a'),
    t('mil', 'AC Milan', 'Milan', '#d1203f', '#16181c'),
    t('nap', 'Napoli', 'Napoli', '#3d9be0', '#eef0f2'),
    t('dor', 'Dortmund', 'Dortmund', '#f5d21f', '#1c1e22'),
    t('rbl', 'RB Leipzig', 'Leipzig', '#eef0f2', '#d1203f'),
    t('lev', 'Bayer Leverkusen', 'Leverkusen', '#d1203f', '#16181c'),
    t('fra', 'Eintracht Frankfurt', 'Frankfurt', '#16181c', '#eef0f2'),
    // fictional players and teams for other sports (ids are kept as routes; a few display names were changed
    // away from famous surnames, so an id such as 'keane' no longer matches the name shown)
    t('varga', 'R. Varga', 'R. Varga', '#3ddc97', '#0e3a2a'),
    t('holm', 'T. Holm', 'T. Holm', '#f5b544', '#4a3408'),
    t('ibarra', 'C. Ibarra', 'C. Ibarra', '#ff8a65', '#4a1f10'),
    t('keane', 'D. Kearon', 'D. Kearon', '#7cc4ee', '#10324a'),
    t('lund', 'S. Lund', 'S. Lund', '#c77dff', '#2e1248'),
    t('amadi', 'O. Amadi', 'O. Amadi', '#f0c94a', '#3d3208'),
    t('owls', 'Harbour City Owls', 'Owls', '#2f7de1', '#f5b544'),
    t('pines', 'Northgate Pines', 'Pines', '#2e9b6f', '#eef0f2'),
    t('foxes', 'Redwater Foxes', 'Foxes', '#e24a2c', '#eef0f2'),
    t('kites', 'Saltmarsh Kites', 'Kites', '#7cc4ee', '#16181c'),
    t('nwind', 'Team Northwind', 'Northwind', '#02c8d8', '#16181c'),
    t('ember', 'Ember Collective', 'Ember', '#ff8a65', '#16181c'),
    t('quartz', 'Quartz Five', 'Quartz', '#c77dff', '#eef0f2'),
    t('tidal', 'Tidal Esports', 'Tidal', '#3ddc97', '#16181c'),
    t('petrov', 'M. Ostrin', 'M. Ostrin', '#e24a2c', '#3a120a'),
    t('sato', 'K. Sato', 'K. Sato', '#eef0f2', '#d1203f'),
    t('duarte', 'L. Duarte', 'L. Duarte', '#2e9b6f', '#f5c400'),
    t('nyberg', 'E. Nyberg', 'E. Nyberg', '#2f7de1', '#f5c400'),
    t('okoye', 'A. Udebra', 'A. Udebra', '#1f8a4c', '#eef0f2'),
    t('comets', 'Eastfield Comets', 'Comets', '#c77dff', '#16181c'),
    t('giants', 'Ironbridge Giants', 'Giants', '#8f9aa8', '#e24a2c'),
    t('rays', 'Bayside Rays', 'Rays', '#02c8d8', '#f5b544'),
    t('wolves', 'Greyrock Wolves', 'Wolves', '#56636f', '#eef0f2'),
    t('vanta', 'Vanta Black', 'Vanta', '#16181c', '#c77dff'),
    t('lumen', 'Lumen Gaming', 'Lumen', '#f5c400', '#16181c'),
    t('orbit', 'Orbit Nine', 'Orbit', '#2f7de1', '#eef0f2'),
    t('drift', 'Driftwood', 'Driftwood', '#a87b4f', '#16181c'),
  ].map((x) => [x.id, x]),
)

export type Comp = { id: string; name: string; sport: Sport; country: string; flag: string[]; color: string }
export const COMPS: Record<string, Comp> = Object.fromEntries(
  (
    [
      { id: 'pl', name: 'Premier League', sport: 'football', country: 'England', flag: ['#f3f3f5', '#d1203f', '#f3f3f5'], color: '#a06bff' },
      { id: 'ucl', name: 'Champions League', sport: 'football', country: 'Europe', flag: ['#1b3fa0', '#3d7bff', '#1b3fa0'], color: '#3d7bff' },
      { id: 'laliga', name: 'LaLiga', sport: 'football', country: 'Spain', flag: ['#c8102e', '#f5c400', '#c8102e'], color: '#ff5a4d' },
      { id: 'seriea', name: 'Serie A', sport: 'football', country: 'Italy', flag: ['#1f8a4c', '#f3f3f5', '#d1203f'], color: '#27b6a1' },
      { id: 'bundes', name: 'Bundesliga', sport: 'football', country: 'Germany', flag: ['#16181c', '#d1203f', '#f5c400'], color: '#e84a5f' },
      { id: 'lisbon', name: 'Lisbon Indoor', sport: 'tennis', country: 'Sample tour', flag: ['#1f8a4c', '#d1203f', '#d1203f'], color: '#3ddc97' },
      { id: 'coastal', name: 'Shoreline League', sport: 'basketball', country: 'Sample league', flag: ['#2f7de1', '#f5b544', '#2f7de1'], color: '#f5b544' },
      { id: 'harbour', name: 'Harbour Open', sport: 'tennis', country: 'Sample tour', flag: ['#2f7de1', '#eef0f2', '#2f7de1'], color: '#7cc4ee' },
      { id: 'summit', name: 'Summit Conference', sport: 'basketball', country: 'Sample league', flag: ['#c77dff', '#16181c', '#c77dff'], color: '#c77dff' },
      { id: 'circuit', name: 'Circuit Finals', sport: 'esports', country: 'Sample cup', flag: ['#f5c400', '#16181c', '#f5c400'], color: '#f5c400' },
      { id: 'northcup', name: 'Northern Cup', sport: 'esports', country: 'Sample cup', flag: ['#02c8d8', '#16181c', '#c77dff'], color: '#02c8d8' },
    ] as Comp[]
  ).map((c) => [c.id, c]),
)
export const FOOTBALL_COMPS = ['pl', 'ucl', 'laliga', 'seriea', 'bundes']

export type Fixture = {
  id: string
  comp: string
  sport: Sport
  home: string
  away: string
  live?: { sec: number; period: string; score: [number, number]; sets?: string; pts?: [number, number]; srv?: 0 | 1 } // tennis: games per set, points in the current game (0-4 = 0,15,30,40,Ad), who serves
  time?: string
  day?: string
  inMin?: number
  odds: number[] // main market: 1 X 2, or 1 2 for two-way sports
  n: number // number of markets on the match page, shown as "+n" (set from the real market list at load)
  ou?: [number, number]
  btts?: [number, number]
}
const f = (comp: string, home: string, away: string, odds: number[], n: number, x: Partial<Fixture> = {}): Fixture => ({
  id: `${home}-${away}`,
  comp,
  sport: COMPS[comp].sport,
  home,
  away,
  odds,
  n,
  ...x,
})
// Day labels are worked out from today's date when the page loads, so the sample week never goes stale.
const NOW0 = new Date()
export const dayAt = (off: number) => new Date(NOW0.getFullYear(), NOW0.getMonth(), NOW0.getDate() + off)
export const dayLabel = (off: number) => { const d = dayAt(off); return off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : `${d.toLocaleString('en-GB', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}` }
const D = dayLabel
export const FIXTURES: Fixture[] = [
  f('pl', 'ars', 'bha', [1.3, 4.6, 11], 27, { live: { sec: 52 * 60 + 14, period: '2nd half', score: [1, 0] }, ou: [2.73, 1.44], btts: [2.1, 1.68] }),
  f('pl', 'avl', 'ful', [2.25, 2.9, 3.6], 74, { live: { sec: 45 * 60, period: 'HT', score: [0, 0] }, ou: [2.4, 1.55], btts: [1.95, 1.8] }),
  f('pl', 'new', 'eve', [1.36, 4.8, 8.5], 68, { live: { sec: 58 * 60 + 2, period: '2nd half', score: [2, 1] }, ou: [1.22, 4.1], btts: [1.01, 15] }),
  f('pl', 'liv', 'mun', [1.65, 4.0, 4.33], 98, { time: '16:30', day: 'Today', inMin: 14, ou: [1.62, 2.25], btts: [1.57, 2.3] }),
  f('pl', 'che', 'tot', [2.05, 3.6, 3.4], 90, { time: '15:00', day: D(1), ou: [1.7, 2.1], btts: [1.6, 2.25] }),
  f('pl', 'mci', 'whu', [1.28, 5.75, 10], 94, { time: '17:30', day: D(1), ou: [1.5, 2.55], btts: [1.9, 1.85] }),
  f('ucl', 'rma', 'bay', [2.2, 3.7, 2.9], 92, { time: '20:00', day: 'Today', inMin: 224, ou: [1.55, 2.4], btts: [1.5, 2.5] }),
  f('ucl', 'ars', 'int', [1.95, 3.5, 4.0], 90, { time: '20:00', day: D(4), ou: [1.9, 1.9], btts: [1.8, 1.95] }),
  f('ucl', 'bar', 'psg', [2.05, 3.8, 3.3], 88, { time: '20:00', day: D(5), ou: [1.5, 2.55], btts: [1.5, 2.5] }),
  f('ucl', 'juv', 'atm', [2.6, 3.1, 2.9], 84, { time: '20:00', day: D(5), ou: [2.25, 1.62], btts: [2.0, 1.75] }),
  f('laliga', 'bar', 'sev', [1.48, 4.1, 6.5], 102, { live: { sec: 23 * 60 + 40, period: '1st half', score: [0, 0] }, ou: [2.05, 1.75], btts: [2.0, 1.75] }),
  f('laliga', 'atm', 'val', [1.6, 3.9, 5.5], 86, { time: '18:15', day: 'Today', inMin: 119, ou: [1.95, 1.85], btts: [2.05, 1.72] }),
  f('laliga', 'rma', 'sev', [1.36, 5.0, 7.5], 90, { time: '20:00', day: D(2), ou: [1.57, 2.35], btts: [1.85, 1.9] }),
  f('seriea', 'juv', 'rom', [2.4, 3.1, 3.2], 61, { time: '20:45', day: 'Today', inMin: 269, ou: [2.2, 1.65], btts: [1.95, 1.8] }),
  f('seriea', 'mil', 'nap', [2.5, 3.2, 2.9], 72, { time: '19:45', day: D(1), ou: [2.0, 1.8], btts: [1.75, 2.0] }),
  f('seriea', 'int', 'rom', [1.62, 3.9, 5.25], 70, { time: '17:00', day: D(2), ou: [1.8, 2.0], btts: [1.9, 1.85] }),
  f('bundes', 'dor', 'rbl', [2.62, 3.1, 2.95], 88, { live: { sec: 71 * 60 + 30, period: '2nd half', score: [1, 1] }, ou: [1.4, 2.85], btts: [1.01, 15] }),
  f('bundes', 'bay', 'lev', [1.75, 4.0, 4.2], 96, { time: '17:30', day: D(1), ou: [1.44, 2.7], btts: [1.5, 2.5] }),
  f('bundes', 'fra', 'rbl', [2.7, 3.5, 2.5], 80, { time: '14:30', day: D(2), ou: [1.6, 2.3], btts: [1.55, 2.35] }),
  f('lisbon', 'varga', 'holm', [1.36, 3.05], 24, { live: { sec: 0, period: 'Set 2', score: [1, 0], sets: '6-4 3-2', pts: [3, 2], srv: 0 } }),
  f('lisbon', 'ibarra', 'keane', [2.1, 1.72], 22, { live: { sec: 0, period: 'Set 1', score: [0, 0], sets: '4-5', pts: [1, 2], srv: 1 } }),
  f('lisbon', 'lund', 'amadi', [1.8, 2.0], 20, { time: '17:00', day: 'Today', inMin: 44 }),
  f('coastal', 'owls', 'pines', [1.55, 2.45], 41, { live: { sec: 0, period: 'Q3 4:12', score: [61, 54] } }),
  f('coastal', 'foxes', 'kites', [1.9, 1.9], 38, { time: '19:00', day: 'Today', inMin: 164 }),
  f('northcup', 'nwind', 'ember', [1.66, 2.2], 16, { live: { sec: 0, period: 'Map 2', score: [1, 0] } }),
  f('northcup', 'quartz', 'tidal', [2.3, 1.6], 14, { time: '18:30', day: 'Today', inMin: 134 }),
  f('northcup', 'ember', 'tidal', [1.9, 1.9], 12, { time: '16:00', day: D(1) }),
  f('circuit', 'vanta', 'lumen', [1.5, 2.55], 18, { live: { sec: 0, period: 'Map 1', score: [0, 0] } }),
  f('circuit', 'orbit', 'drift', [2.05, 1.75], 15, { time: '21:00', day: 'Today', inMin: 284 }),
  f('circuit', 'nwind', 'vanta', [2.2, 1.66], 15, { time: '19:00', day: D(2) }),
  f('harbour', 'petrov', 'sato', [1.72, 2.1], 26, { live: { sec: 0, period: 'Set 3', score: [1, 1], sets: '6-3 4-6 2-1', pts: [2, 2], srv: 0 } }),
  f('harbour', 'duarte', 'nyberg', [1.44, 2.75], 22, { time: '18:00', day: 'Today', inMin: 104 }),
  f('harbour', 'okoye', 'holm', [2.4, 1.57], 21, { time: '11:00', day: D(1) }),
  f('lisbon', 'keane', 'amadi', [1.66, 2.2], 20, { time: '13:30', day: D(1) }),
  f('summit', 'comets', 'giants', [2.3, 1.62], 44, { live: { sec: 0, period: 'Q2 7:40', score: [38, 41] } }),
  f('summit', 'rays', 'wolves', [1.5, 2.6], 40, { time: '20:30', day: 'Today', inMin: 254 }),
  f('coastal', 'owls', 'kites', [1.4, 2.95], 39, { time: '18:00', day: D(1) }),
  f('summit', 'giants', 'wolves', [1.8, 2.0], 40, { time: '20:00', day: D(2) }),
]

export const PLAYERS: { name: string; team: string; any: number; next: number; two: number }[] = ([
  ['T. Okonkaro', 'ars', 2.1, 4.5, 7.5],
  ['L. Brandvik', 'ars', 2.6, 5.5, 10],
  ['M. Sevrin', 'ars', 3.1, 7, 13],
  ['K. Pendry', 'bha', 4.2, 9, 21],
  ['D. Abelard', 'ars', 4.5, 9.5, 23],
  ['E. Lindqvist', 'bha', 5, 11, 26],
  ['R. Calloway', 'ars', 5.5, 12, 29],
  ['P. Nwosika', 'bha', 6, 13, 31],
  ['J. Valdero', 'ars', 6.5, 14, 34],
  ['S. Ferrandi', 'bha', 7, 15, 36],
  ['A. Whitlock', 'ars', 8, 17, 41],
  ['N. Castellan', 'bha', 8.5, 18, 46],
  ['B. Odenwa', 'ars', 9, 19, 51],
  ['H. Drummond', 'bha', 10, 21, 56],
  ['C. Aalto', 'ars', 12, 26, 67],
  ['F. Moreau', 'bha', 13, 29, 71],
  ['G. Hoshiba', 'ars', 15, 34, 81],
  ['I. Arroyal', 'bha', 17, 36, 91],
] as [string, string, number, number, number][]).map(([name, team, any, next, two]) => ({ name, team, any, next, two }))

// ---- markets -------------------------------------------------------------
export type SelDef = { key: string; name: string; price: number; line?: string; settled?: 'won' | 'lost' }
export type MarketDef = {
  key: string
  name: string
  tabs: string[]
  kind: 'row' | 'list' | 'line'
  sels: SelDef[]
  lines?: string[]
  defLine?: string
  note?: string
  cashout?: boolean
}
export const TABS = ['Popular', 'Goals', 'Halves', 'Handicaps', 'Goalscorers', 'Corners & cards'] as const

export function ladder(p: number) {
  const step = p < 2 ? 0.01 : p < 3 ? 0.02 : p < 4 ? 0.05 : p < 6 ? 0.1 : p < 10 ? 0.2 : p < 20 ? 0.5 : p < 50 ? 1 : 5
  return Math.min(101, Math.max(1.01, +(Math.round(p / step) * step).toFixed(2)))
}
const ouLines = (lines: [string, number, number][], over = 'Over', under = 'Under') =>
  lines.flatMap(([l, o, u]) => [
    { key: `o${l}`, name: `${over} ${l}`, price: o, line: l },
    { key: `u${l}`, name: `${under} ${l}`, price: u, line: l },
  ])
// one minus glyph everywhere a handicap is shown
// (whole and half lines only, one decimal: −1.0, −1.5)
const hdec = (l: number) => Math.abs(l).toFixed((l * 4) % 2 ? 2 : 1)
const hcap = (l: number) => (l > 0 ? '+' : '−') + hdec(l)
const hkey = (l: number) => (l > 0 ? '+' : '-') + hdec(l)

// Double chance and Draw no bet are always read off the Match result prices, so the three never disagree.
// dcPrice(a, b, c): the price of "a or b" in a three-way market whose third outcome is c; never longer than a or b alone
export const dcPrice = (a: number, b: number, c: number) => Math.min(a, b, ladder((1 / a + 1 / b + 1 / c) / (1 / a + 1 / b) / 1.04))
// dnbPrice(a, b): the price of a with the draw taken out and the stake returned
export const dnbPrice = (a: number, b: number) => Math.min(a, ladder((1 / a + 1 / b) / (1 / a) / 1.04))

// ---- football pricing model ------------------------------------------------
// Every football market is priced from one small goal model (two Poisson rates for the goals still to come),
// fitted to the fixture's own Match result and Total goals prices. After a goal the same model reprices the
// whole page and marks decided selections as settled.
export type FbState = { score: [number, number]; min: number; goals: { m: number; side: 0 | 1 }[] }
export const FB_END = 93
const pois = (l: number, n: number) => {
  const a: number[] = []
  let p = Math.exp(-l), s = 0
  for (let k = 0; k < n; k++) { a.push(p); s += p; p = (p * l) / (k + 1) }
  a.push(Math.max(0, 1 - s))
  return a
}
function outcome(score: [number, number], rh: number, ra: number) {
  const a = pois(rh, 9), b = pois(ra, 9)
  let H = 0, A = 0
  const tot: number[] = Array(20).fill(0)
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) {
    const p = a[i] * b[j], d = score[0] + i - score[1] - j
    if (d > 0) H += p; else if (d < 0) A += p
    tot[i + j] += p
  }
  return { H, A, tot }
}
export const seedState = (fx: Fixture): FbState => ({ score: fx.live?.score ?? [0, 0], min: fx.live ? Math.min(FB_END, fx.live.sec / 60) : 0, goals: SEED_GOALS[fx.id] ?? [] })
// expected goals still to come for each side, fitted to the fixture's seeded prices
export function fitLam(fx: Fixture, st: FbState): [number, number] {
  const inv = fx.odds.map((o) => 1 / o)
  const share = inv[0] / (inv[0] + inv[2])
  const need = 3 - st.score[0] - st.score[1]
  let T = 2.7 * Math.max(0.02, (FB_END - st.min) / FB_END)
  if (fx.ou && need > 0) {
    const target = 1 / fx.ou[0] / (1 / fx.ou[0] + 1 / fx.ou[1])
    let lo = 0.02, hi = 7
    for (let k = 0; k < 24; k++) {
      T = (lo + hi) / 2
      const o = outcome(st.score, T / 2, T / 2)
      let over = 0
      for (let n = need; n < 20; n++) over += o.tot[n]
      if (over < target) lo = T; else hi = T
    }
  }
  let s = 0.5, lo = 0.03, hi = 0.97
  for (let k = 0; k < 24; k++) {
    s = (lo + hi) / 2
    const o = outcome(st.score, T * s, T * (1 - s))
    if (o.H / (o.H + o.A || 1) < share) lo = s; else hi = s
  }
  // a side that the book favours is never modelled as the weaker attack
  const tilt = 0.5 + 0.28 * (share - 0.5)
  s = share >= 0.5 ? Math.max(s, tilt) : Math.min(s, tilt)
  return [T * s, T * (1 - s)]
}
// every way the rest of the match can go: [probability, 1st-half home, 1st-half away, 2nd-half home, 2nd-half away]
function states(st: FbState, lam: [number, number]) {
  const f1 = st.min >= 45 ? 0 : (45 - st.min) / (FB_END - st.min)
  const g1 = [0, 0], g2 = [0, 0]
  for (const g of st.goals) (g.m <= 45 ? g1 : g2)[g.side]++
  for (const i of [0, 1]) { const miss = st.score[i] - g1[i] - g2[i]; if (miss) (st.min >= 45 ? g2 : g1)[i] += miss }
  const d = (l: number) => (l < 1e-9 ? [1] : pois(l, 5))
  const h1 = d(lam[0] * f1), a1 = d(lam[1] * f1), h2 = d(lam[0] * (1 - f1)), a2 = d(lam[1] * (1 - f1))
  const out: number[][] = []
  h1.forEach((p1, i) => a1.forEach((p2, j) => h2.forEach((p3, k) => a2.forEach((p4, l) => out.push([p1 * p2 * p3 * p4, g1[0] + i, g1[1] + j, g2[0] + k, g2[1] + l])))))
  return out
}

// Invented surnames for the goalscorer lists. No real players anywhere in the book: every name here was chosen to be
// unlike any well-known footballer (famous surnames avoided entirely), with a mix of origins. Keep it that way.
const NAMES = ('Ashcombe Fairlow Pendrell Wrenfold Kestrell Harrowby Solvberg Fjellsen Holmvik Eskdahl Ruskelund Ostgaard Brandvoort Kessling Hollweide Ternhoven Vossmann Ackerlin Dumarais Rocheval Beaulard Vaillanet Lacombier Arrendo Belmira Castrejo Olivano Sedrano Vilaroca Quinterro Vescari Montarsi Bellosi Carvezzi Rezanko Pelinski Morvatek Dravenko Odunmbe Achuzie Nwabaro Mbatoli Osagwe Oyelaran Yalvaran Tasoglan Okumiya Nazemi' +
  ' Brackwell Dunholt Gorsedge Hethersall Pellowe Quarley Rookwood Thackwell Wrayburn Sandvold Fossnes Tveitan Myrstad Vikholm Overdijk Brinkhorst Stellmann Dornacher Heyligen Kranzbach Wittenau Chasseral Desmarel Lavergnac Monteray Peyrolle Rivolet Aldarete Barrocal Cerezal Escarra Montijano Pardinho Valcorba Fioravelli Lombrini Pezzolato Strambini Brezanek Kovarny Lesnovic Radomirov Vukmerov Abiodane Chukwemba Ekwuaro Nkemdiri Tchakoume Ozbaran Haddari Rahimzad Morisawa Yonekawa').split(' ')
const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }
// Each club takes its own block of six surnames from the pool, so a surname turns up at two clubs at most, and a
// club that has a hand-written squad (Arsenal, Brighton) uses those same players in every match it plays.
const TEAM_IX = Object.keys(TEAMS)
const squad = (team: string, taken: string[] = []) => {
  const own = PLAYERS.filter((p) => p.team === team).map((p) => p.name)
  if (own.length >= 6) return own.filter((n) => !taken.includes(n)).slice(0, 6)
  const start = TEAM_IX.indexOf(team) * 6
  const out: string[] = []
  for (let i = 0; out.length < 6; i++) {
    const sur = NAMES[((start + i) * 17) % NAMES.length] // ×17 spreads a block across the pool, so squads mix origins
    if (!taken.some((t) => t.endsWith(sur)) && !out.some((t) => t.endsWith(sur))) out.push(`${'ABCDEFGHJKLMNOPRST'[hash(team + sur) % 18]}. ${sur}`)
  }
  return out
}
const SHARE = [0.25, 0.19, 0.15, 0.11, 0.09, 0.07]
let tableShare: number[] | null = null

type Prev = Record<string, string[]>
export function footballMarkets(fx: Fixture, st: FbState, lam: [number, number], prev?: Prev): MarketDef[] {
  const H = TEAMS[fx.home].short, A = TEAMS[fx.away].short
  const seed = !prev
  const all = states(st, lam)
  const P = (fn: (h1: number, a1: number, h2: number, a2: number) => boolean) => { let s = 0; for (const x of all) if (fn(x[1], x[2], x[3], x[4])) s += x[0]; return s }
  const [sh, sa] = st.score
  const cur = sh + sa
  const px = (p: number, m = 1.06) => ladder(1 / Math.max(p * m, 1e-6))
  const S = (key: string, name: string, p: number, m = 1.06, line?: string, price?: number): SelDef => ({ key, name, price: price ?? px(p, m), line, ...(p < 1e-9 ? { settled: 'lost' as const } : p > 1 - 1e-7 ? { settled: 'won' as const } : {}) })
  const lines = (k: string, fresh: number[]) => [...new Set([...fresh, ...(prev?.[k] ?? []).map((x) => parseFloat(x.slice(1))).filter((n) => !isNaN(n))])].sort((a, b) => a - b)
  const ou = (key: string, name: string, tabs: string[], fresh: number[], over: (l: number) => number, x: Partial<MarketDef> = {}): MarketDef => {
    const ls = lines(key, fresh)
    return { key, name, tabs, kind: 'line', lines: ls.map((l) => l.toFixed(1)), note: 'Over / Under', sels: ls.flatMap((l) => { const p = over(l), t = l.toFixed(1); return [S(`o${t}`, `Over ${t}`, p, 1.06, t), S(`u${t}`, `Under ${t}`, 1 - p, 1.06, t)] }), ...x }
  }
  // Asian handicap on a goal margin. A whole line (−1) gives the stake back on a tie; a quarter line (−0.75) is half
  // the stake on each neighbour (−0.5 and −1). `ahP` returns the chance each side wins with pushes taken out.
  const ahP = (margin: (a: number, b: number, c: number, d: number) => number) => (l: number): [number, number] => {
    const parts = (l * 4) % 2 ? [l - 0.25, l + 0.25] : [l]
    let W = 0, L = 0
    for (const x of parts) { W += P((a, b, c, d) => margin(a, b, c, d) + x > 0) / parts.length; L += P((a, b, c, d) => margin(a, b, c, d) + x < 0) / parts.length }
    return W + L < 1e-9 ? [0.5, 0.5] : [W / (W + L), L / (W + L)]
  }
  const hc = (key: string, name: string, tabs: string[], fresh: number[], cover: (l: number) => [number, number]): MarketDef => {
    const ls = lines(key, fresh)
    return { key, name, tabs, kind: 'line', lines: ls.map(hcap), note: 'Handicap line', sels: ls.flatMap((l) => { const [p, q] = cover(l); return [S(`h${hkey(l)}`, `${H} ${hcap(l)}`, p, 1.06, hcap(l)), S(`a${hkey(l)}`, `${A} ${hcap(-l)}`, q, 1.06, hcap(l))] }) }
  }
  const pH = P((a, b, c, d) => a + c > b + d), pD = P((a, b, c, d) => a + c === b + d), pA = 1 - pH - pD
  // Match result after a goal: the margin shrinks as a price shortens (implied = p·(1 + 2·(m−1)·(1−p))), so a side
  // at 95% reads about 1.05 rather than sitting on the 1.01 floor (match-page-19). Never above 100% implied.
  const pxr = (p: number) => ladder(1 / Math.max(p * (1 + 0.12 * (1 - p)), 1e-6))
  const mo = seed ? fx.odds : [pxr(pH), pxr(pD), pxr(pA)]
  const T = lam[0] + lam[1]
  const none = Math.exp(-T)
  // players
  const table = fx.id === 'ars-bha'
  if (table) tableShare ??= PLAYERS.map((p) => 0.92 / p.any / PLAYERS.filter((q) => q.team === p.team).reduce((a, q) => a + 1 / q.any, 0))
  const home = squad(fx.home)
  const roster = table
    ? PLAYERS.map((p, i) => ({ key: `p${i}`, name: p.name, side: p.team === fx.home ? 0 : 1, share: tableShare![i] }))
    : [...home.map((name, j) => ({ key: `p0${j}`, name, side: 0, share: SHARE[j] })), ...squad(fx.away, home).map((name, j) => ({ key: `p1${j}`, name, side: 1, share: SHARE[j] }))]
  const mu = (r: { side: number; share: number }) => lam[r.side] * r.share
  const order = seed ? [...roster].sort((a, b) => mu(b) - mu(a)) : roster
  const pl = (f: (m: number) => number) => order.map((r) => ({ key: r.key, name: r.name, price: px(f(mu(r)), 1.12) }))
  // lines on offer move with the score; lines already on the page stay and settle
  const tgFresh = cur <= 1 ? [1.5, 2.5, 3.5, 4.5] : [cur + 0.5, cur + 1.5, cur + 2.5]
  const tg = ou('tg', 'Total goals', ['Popular', 'Goals'], tgFresh, (l) => P((a, b, c, d) => a + b + c + d > l), { cashout: true })
  if (seed && fx.ou && cur < 3) tg.sels = tg.sels.map((s) => (s.key === 'o2.5' ? { ...s, price: fx.ou![0] } : s.key === 'u2.5' ? { ...s, price: fx.ou![1] } : s))
  const pBtts = P((a, b, c, d) => a + c > 0 && b + d > 0)
  const bt = seed && fx.btts && sh * sa === 0 ? fx.btts : [px(pBtts), px(1 - pBtts)]
  // Asian handicap lines. ±0.5 is never offered (−0.5 is the Match result and +0.5 is Double chance under another
  // name, match-page-19), nor 0 (Draw no bet). Whole and half lines only: quarter lines (−0.25, −0.75) split the stake
  // in two and need explaining, which a player should never have to ask for. The three on offer sit around the most even one.
  const ahFull = ahP((a, b, c, d) => a + c - b - d)
  const AHL = [-3.5, -3, -2.5, -2, -1.5, -1, 1, 1.5, 2, 2.5, 3, 3.5]
  let ci = 5, best = 9
  AHL.forEach((l, i) => { const p = Math.abs(ahFull(l)[0] - 0.5); if (p < best) { best = p; ci = i } })
  ci = Math.min(AHL.length - 2, Math.max(1, ci))
  const ahFresh = [AHL[ci - 1], AHL[ci], AHL[ci + 1]]
  const fav = pH >= pA ? 0 : 1
  const egNs = [...new Set([...Array.from({ length: Math.max(0, 6 - cur) }, (_, i) => cur + i), ...(prev?.eg ?? []).filter((k) => !k.endsWith('p')).map((k) => parseInt(k.slice(1)))])].sort((a, b) => a - b)
  const csSet = new Map<string, [number, number]>()
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) csSet.set(`c${sh + i}-${sa + j}`, [sh + i, sa + j])
  for (const k of prev?.cs ?? []) { const m = /^c(\d+)-(\d+)$/.exec(k); if (m) csSet.set(k, [+m[1], +m[2]]) }
  const cs = [...csSet].map(([key, [h, a]]) => ({ key, name: `${h}–${a}`, p: P((x, y, z, w) => x + z === h && y + w === a) })).sort((x, y) => y.p - x.p)
  const res: [string, string, (a: number, b: number) => boolean][] = [['h', H, (a, b) => a > b], ['d', 'Draw', (a, b) => a === b], ['a', A, (a, b) => a < b]]
  const htft = res.flatMap(([k1, n1, f1]) => res.map(([k2, n2, f2]) => S(k1 + k2, `${n1} / ${n2}`, P((a, b, c, d) => f1(a, b) && f2(a + c, b + d)), 1.1)))
  const g1 = all[0][1] + all[0][2], g2 = all[0][3] + all[0][4] // goals so far in each half (first state has no further goals)
  const h1 = all[0][1], a1 = all[0][2]
  const defs: MarketDef[] = [
    { key: 'main', name: 'Match result', tabs: ['Popular'], kind: 'row', cashout: true, sels: [S('h', H, pH, 1.06, undefined, mo[0]), S('d', 'Draw', pD, 1.06, undefined, mo[1]), S('a', A, pA, 1.06, undefined, mo[2])] },
    { key: 'dc', name: 'Double chance', tabs: ['Popular'], kind: 'row', sels: [S('hd', `${H} or draw`, pH + pD, 1, undefined, dcPrice(mo[0], mo[1], mo[2])), S('ha', `${H} or ${A}`, pH + pA, 1, undefined, dcPrice(mo[0], mo[2], mo[1])), S('da', `Draw or ${A}`, pD + pA, 1, undefined, dcPrice(mo[1], mo[2], mo[0]))] },
    tg,
    { key: 'btts', name: 'Both teams to score', tabs: ['Popular', 'Goals'], kind: 'row', sels: [S('y', 'Yes', pBtts, 1.06, undefined, bt[0]), S('n', 'No', 1 - pBtts, 1.06, undefined, bt[1])] },
    { key: 'ng', name: 'Next goal', tabs: ['Popular', 'Goals'], kind: 'row', note: `Goal ${cur + 1}`, sels: [S('h', H, (lam[0] / (T || 1)) * (1 - none)), S('n', 'No goal', none), S('a', A, (lam[1] / (T || 1)) * (1 - none))] },
    { key: 'ags', name: 'Anytime goalscorer', tabs: ['Popular', 'Goalscorers'], kind: 'list', sels: pl((m) => 1 - Math.exp(-m)) },
    ou('htg', `${H} total goals`, ['Goals'], [sh + 0.5, sh + 1.5], (l) => P((a, _b, c) => a + c > l)),
    ou('atg', `${A} total goals`, ['Goals'], [sa + 0.5, sa + 1.5], (l) => P((_a, b, _c, d) => b + d > l)),
    { key: 'eg', name: 'Exact goals', tabs: ['Goals'], kind: 'list', sels: [...egNs.map((n) => S(`e${n}`, n === 0 ? 'No goals' : n === 1 ? '1 goal' : `${n} goals`, P((a, b, c, d) => a + b + c + d === n), 1.1)), S('e6p', '6 or more', P((a, b, c, d) => a + b + c + d >= 6), 1.1)] },
    { key: 'cs', name: 'Correct score', tabs: ['Goals'], kind: 'list', sels: cs.map((c) => S(c.key, c.name, c.p, 1.12)) },
    { key: 'h1r', name: '1st half result', tabs: ['Halves'], kind: 'row', sels: res.map(([k, n, f]) => S(k, n, P((a, b) => f(a, b)))) },
    ou('h1g', '1st half total goals', ['Halves'], [g1 + 0.5, g1 + 1.5], (l) => P((a, b) => a + b > l)),
    { key: 'h2r', name: '2nd half result', tabs: ['Halves'], kind: 'row', sels: res.map(([k, n, f]) => S(k, n, P((_a, _b, c, d) => f(c, d)))) },
    ou('h2g', '2nd half total goals', ['Halves'], [g2 + 0.5, g2 + 1.5], (l) => P((_a, _b, c, d) => c + d > l)),
    { key: 'h2b', name: '2nd half both teams to score', tabs: ['Halves'], kind: 'row', sels: (() => { const p = P((_a, _b, c, d) => c > 0 && d > 0); return [S('y', 'Yes', p), S('n', 'No', 1 - p)] })() },
    { key: 'htft', name: 'Half time / full time', tabs: ['Halves'], kind: htft.filter((s) => !s.settled).length > 3 ? 'list' : 'row', note: st.min >= 45 ? `HT: ${h1 > a1 ? H : h1 < a1 ? A : 'Draw'}` : undefined, sels: htft },
    { key: 'hsh', name: 'Highest scoring half', tabs: ['Halves'], kind: 'row', sels: [S('1', '1st half', P((a, b, c, d) => a + b > c + d)), S('t', 'Tie', P((a, b, c, d) => a + b === c + d)), S('2', '2nd half', P((a, b, c, d) => a + b < c + d))] },
    hc('ah', 'Asian handicap', ['Handicaps'], ahFresh, ahFull),
    { key: 'h3', name: 'Handicap (3-way)', tabs: ['Handicaps'], kind: 'row', note: `${fav ? A : H} start one goal down`, sels: fav === 0
      ? [S('h', `${H} −1`, P((a, b, c, d) => a + c - b - d >= 2)), S('d', `Draw (${H} −1)`, P((a, b, c, d) => a + c - b - d === 1)), S('a', `${A} +1`, P((a, b, c, d) => a + c - b - d <= 0))]
      : [S('h', `${H} +1`, P((a, b, c, d) => b + d - a - c <= 0)), S('d', `Draw (${A} −1)`, P((a, b, c, d) => b + d - a - c === 1)), S('a', `${A} −1`, P((a, b, c, d) => b + d - a - c >= 2))] },
    { key: 'dnb', name: 'Draw no bet', tabs: ['Handicaps'], kind: 'row', note: 'Stake back on a draw', sels: [S('h', H, pH, 1, undefined, dnbPrice(mo[0], mo[2])), S('a', A, pA, 1, undefined, dnbPrice(mo[2], mo[0]))] },
    hc('ah2', '2nd half Asian handicap', ['Handicaps'], [-1, 1], ahP((_a, _b, c, d) => c - d)), // not ±0.5: that is the 2nd half result again
    { key: 'ngs', name: 'Next goalscorer', tabs: ['Goalscorers'], kind: 'list', sels: [...pl((m) => (m / (T || 1)) * (1 - none)), S('none', 'No goalscorer', none)] },
    { key: 'two', name: 'To score 2 or more', tabs: ['Goalscorers'], kind: 'list', sels: pl((m) => 1 - Math.exp(-m) * (1 + m)).filter((x) => !seed || x.price < 101) },
  ]
  if (seed) {
    // corners and cards do not depend on the score; each fixture gets its own slightly different prices
    const h = hash(fx.id)
    const j = (p: number, i: number) => ladder(1 + (p - 1) * (1 + ((((h >> i) + i * 7) % 13) - 6) / 50))
    const pair = (a: number, i: number): [number, number] => { const o = j(a, i); return [o, ladder(1 / (1.06 - 1 / o))] }
    const F = fav ? A : H, U = fav ? H : A
    const ch = pair(1.85, 5)
    defs.push(
      { key: 'tc', name: 'Total corners', tabs: ['Corners & cards'], kind: 'line', lines: ['8.5', '9.5', '10.5'], note: 'Over / Under', sels: ouLines([['8.5', ...pair(1.5, 1)], ['9.5', ...pair(1.95, 2)], ['10.5', ...pair(2.7, 3)]]) },
      { key: 'ch', name: 'Corner handicap', tabs: ['Corners & cards'], kind: 'row', sels: fav ? [{ key: 'h', name: `${U} +1.5`, price: ch[1] }, { key: 'a', name: `${F} −1.5`, price: ch[0] }] : [{ key: 'h', name: `${F} −1.5`, price: ch[0] }, { key: 'a', name: `${U} +1.5`, price: ch[1] }] },
      { key: 'nc', name: 'Next corner', tabs: ['Corners & cards'], kind: 'row', sels: (() => { const o = pair(fav ? 2.2 : 1.66, 7); return [{ key: 'h', name: H, price: o[0] }, { key: 'a', name: A, price: o[1] }] })() },
      { key: 'tk', name: 'Total cards', tabs: ['Corners & cards'], kind: 'line', lines: ['3.5', '4.5'], note: 'Over / Under', sels: ouLines([['3.5', ...pair(1.72, 9)], ['4.5', ...pair(2.7, 11)]]) },
      { key: 'btb', name: 'Both teams booked', tabs: ['Corners & cards'], kind: 'row', sels: (() => { const o = pair(1.4, 13); return [{ key: 'y', name: 'Yes', price: o[0] }, { key: 'n', name: 'No', price: o[1] }] })() },
      { key: 'rc', name: 'Red card shown', tabs: ['Corners & cards'], kind: 'row', sels: (() => { const o = pair(7.5, 15); return [{ key: 'y', name: 'Yes', price: o[0] }, { key: 'n', name: 'No', price: o[1] }] })() },
    )
  }
  // Draw no bet settles only once the match cannot end level
  const dnb = defs.find((d) => d.key === 'dnb')!
  dnb.sels = dnb.sels.map((s) => ({ ...s, settled: pD > 1e-9 ? undefined : s.settled }))
  for (const d of defs) {
    if (seed) { d.sels = d.sels.filter((s) => !s.settled); if (d.lines) d.lines = d.lines.filter((l) => d.sels.some((s) => s.line === l)) }
    if (d.kind === 'line') {
      // open on the line closest to an even contest
      const live = d.lines!.filter((l) => d.sels.some((s) => s.line === l && !s.settled))
      const even = (l: string) => { const [a, b] = d.sels.filter((s) => s.line === l); return Math.abs(1 / a.price - 1 / b.price) }
      d.defLine = seed && d.key === 'tg' && live.includes('2.5') ? '2.5' : [...live].sort((a, b) => even(a) - even(b))[0] ?? d.lines![d.lines!.length - 1]
    }
  }
  return seed ? defs.filter((d) => d.sels.length >= 2) : defs
}

const seeded = new Map<string, MarketDef[]>()
export function marketsFor(fx: Fixture): MarketDef[] {
  let d = seeded.get(fx.id)
  if (!d) seeded.set(fx.id, (d = build(fx)))
  return d
}
function build(fx: Fixture): MarketDef[] {
  const H = TEAMS[fx.home].short
  const A = TEAMS[fx.away].short
  if (fx.sport === 'football') { const st = seedState(fx); return footballMarkets(fx, st, fitLam(fx, st)) }
  // Every match offers a winner, a handicap and a total, each in the units of its sport.
  // All three are priced from the same win chance, so they never disagree with each other.
  const main: MarketDef = { key: 'main', name: 'Match winner', tabs: ['Popular'], kind: 'row', cashout: true, sels: [{ key: 'h', name: H, price: fx.odds[0] }, { key: 'a', name: A, price: fx.odds[1] }] }
  const p = 1 / fx.odds[0] / (1 / fx.odds[0] + 1 / fx.odds[1]) // home win chance with the margin taken out
  const px2 = (q: number) => Math.max(1.01, +(1 / (Math.min(0.985, Math.max(0.015, q)) * 1.06)).toFixed(2))
  const pair = (l: number, q: number) => [{ key: `h${hkey(l)}`, name: `${H} ${hcap(l)}`, price: px2(q), line: hcap(l) }, { key: `a${hkey(l)}`, name: `${A} ${hcap(-l)}`, price: px2(1 - q), line: hcap(l) }]
  // a handicap on a continuous margin (games, points): three lines around the fair one, in ascending order.
  // ±0.5 is never offered: in basketball it is the Match winner again, and in tennis it reads as one (sport-pages-11).
  const HL = [-9.5, -8.5, -7.5, -6.5, -5.5, -4.5, -3.5, -2.5, -1.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5]
  const spread = (name: string, note: string, margin: number, scale: number): MarketDef => {
    let ci = 0
    HL.forEach((l, i) => { if (Math.abs(margin + l) < Math.abs(margin + HL[ci])) ci = i })
    const c = HL[ci]
    ci = Math.min(HL.length - 2, Math.max(1, ci))
    const ls = [HL[ci - 1], HL[ci], HL[ci + 1]]
    return { key: 'hc', name, tabs: ['Popular'], kind: 'line', note, lines: ls.map(hcap), defLine: hcap(c), sels: ls.flatMap((l) => pair(l, 1 / (1 + Math.exp(-(margin + l) / scale)))) }
  }
  // a total on a continuous count (games, points): the main line sits on this match's own expected total, so every
  // match reads differently (sport-pages-12); lines ascending, priced from the same curve
  const jit = ((hash(fx.id) % 1000) / 1000 - 0.5) // the same small per-match offset on every load, −0.5…0.5
  const total = (key: string, name: string, expect: number, scale: number): MarketDef => {
    const c = Math.round(expect - 0.5) + 0.5
    const ls = [c - 1, c, c + 1]
    const ov = (l: number) => 1 / (1 + Math.exp(-(expect - l) / scale))
    return { key, name, tabs: ['Popular'], kind: 'line', lines: ls.map((l) => l.toFixed(1)), defLine: c.toFixed(1), sels: ouLines(ls.map((l): [string, number, number] => [l.toFixed(1), px2(ov(l)), px2(1 - ov(l))])) }
  }
  const near = (x: number) => +(1.9 + (x - 1.9) * 0.35).toFixed(2)
  const two = (key: string, name: string): MarketDef => ({ key, name, tabs: ['Popular'], kind: 'row', sels: [{ key: 'h', name: H, price: near(fx.odds[0]) }, { key: 'a', name: A, price: near(fx.odds[1]) }] })
  if (fx.sport === 'tennis') return [main,
    spread('Games handicap', 'Games won across the match', (p - 0.5) * 12, 2.6),
    total('games', 'Total games', (() => {
      // best of three sets: closer matches run longer; a live match counts the games already played
      const full = 22.6 - 14 * Math.abs(p - 0.5) + jit * 1.6
      const played = (fx.live?.sets ?? '').split(' ').filter(Boolean).reduce((a, x) => a + x.split('-').reduce((b, n) => b + +n, 0), 0)
      return fx.live ? Math.max(full, played + 7) : full
    })(), 2.2),
    two('set', 'Current set winner')]
  if (fx.sport === 'basketball') return [main,
    spread('Handicap', 'Points, including overtime', (p - 0.5) * 30, 6.5),
    total('pts', 'Total points', (() => {
      // four 10-minute quarters; each match has its own pace, and a live game blends the pace it is actually running at
      const base = 161 + jit * 18
      const q = /^Q(\d) (\d+):(\d+)/.exec(fx.live?.period ?? '')
      if (!q || !fx.live) return base
      const gone = Math.min(39, (+q[1] - 1) * 10 + 10 - (+q[2] + +q[3] / 60))
      const pts = fx.live.score[0] + fx.live.score[1]
      return pts + (40 - gone) * (0.35 * (pts / Math.max(1, gone)) + 0.65 * (base / 40))
    })(), 7)]
  // esports, best of three maps: find the chance of winning one map that gives this chance of winning the match
  let lo = 0, hi = 1
  for (let i = 0; i < 30; i++) { const q = (lo + hi) / 2; if (q * q * (3 - 2 * q) < p) lo = q; else hi = q }
  const q = (lo + hi) / 2
  return [main,
    { key: 'hc', name: 'Map handicap', tabs: ['Popular'], kind: 'line', note: 'Best of three maps', lines: [hcap(-1.5), hcap(1.5)], defLine: hcap(p >= 0.5 ? -1.5 : 1.5), sels: [...pair(-1.5, q * q), ...pair(1.5, 1 - (1 - q) * (1 - q))] },
    { key: 'maps', name: 'Total maps', tabs: ['Popular'], kind: 'row', note: 'Best of three maps', sels: [{ key: 'o', name: 'Over 2.5', price: px2(2 * q * (1 - q)) }, { key: 'u', name: 'Under 2.5', price: px2(1 - 2 * q * (1 - q)) }] },
    two('map', 'Current map winner')]
}

// Opening price curves for the showcase match (minute, price), from kick-off to 52'.
export const SEED_HIST: Record<string, [number, number][]> = {
  'ars-bha:main:h': [[0, 1.62], [6, 1.6], [12, 1.64], [18, 1.66], [24, 1.63], [30, 1.6], [33, 1.58], [36, 1.44], [40, 1.42], [44, 1.4], [46, 1.38], [49, 1.34], [52, 1.3]],
  'ars-bha:main:d': [[0, 3.9], [8, 3.85], [16, 3.8], [24, 3.7], [30, 3.65], [33, 3.6], [36, 4.1], [40, 4.2], [44, 4.33], [46, 4.4], [49, 4.5], [52, 4.6]],
  'ars-bha:main:a': [[0, 5.8], [8, 5.9], [16, 5.7], [24, 5.8], [30, 6.0], [33, 6.1], [36, 8.5], [40, 9.0], [44, 9.5], [46, 10], [49, 10.5], [52, 11]],
  'bar-sev:tg:o2.5': [[0, 1.72], [5, 1.75], [10, 1.83], [14, 1.9], [18, 1.95], [23, 2.05]],
}
export const SEED_GAPS: Record<string, [number, number][]> = { 'ars-bha': [[33.4, 35.6]] }
export const SEED_GOALS: Record<string, { m: number; side: 0 | 1 }[]> = {
  'ars-bha': [{ m: 34, side: 0 }],
  'new-eve': [{ m: 12, side: 0 }, { m: 31, side: 1 }, { m: 49, side: 0 }],
  'dor-rbl': [{ m: 22, side: 1 }, { m: 64, side: 0 }],
}

// "+N" on every row is the real number of markets on that match page
for (const fx of FIXTURES) fx.n = marketsFor(fx).length
// the search index quotes the same goalscorer prices as the match page
{
  const m = marketsFor(FIXTURES[0])
  const at = (k: string, i: number) => m.find((d) => d.key === k)?.sels.find((s) => s.key === `p${i}`)?.price
  PLAYERS.forEach((p, i) => { p.any = at('ags', i) ?? p.any; p.next = at('ngs', i) ?? p.next; p.two = at('two', i) ?? p.two })
}

// Sample popularity: how many bets each match has taken. Home ranks its Popular matches by this.
const POP: Record<string, number> = { 'ars-bha': 4820, 'liv-mun': 4390, 'rma-bay': 3760, 'bar-sev': 2940, 'che-tot': 2680, 'bar-psg': 2380, 'mci-whu': 2210, 'ars-int': 2050, 'dor-rbl': 1870, 'new-eve': 1640, 'juv-rom': 1480, 'avl-ful': 1320, 'atm-val': 1150 }
export const popOf = (id: string) => POP[id] ?? 240 + ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 520)
export const popLabel = (id: string) => { const n = popOf(id); return n >= 1000 ? `${(n / 1000).toFixed(1)}k bets` : `${n} bets` }
export const TENNIS_PTS = ['0', '15', '30', '40', 'Ad']
