// The signed-in part of the top bar: balance, wallet, account menu. Demo money only; deposits and withdrawals are not part of this prototype.
import { RefObject, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CaretDown, ChartLineUp, Check, Receipt, SignOut, SlidersHorizontal, X } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { money } from './book'
import { useApp } from './store'
import { cx, EXIT, Price, Usdt, useIsPhone, usePresence } from './ui'

const COINS: { id: string; name: string; bg: string; fg: string; glyph: string }[] = [
  { id: 'USDT', name: 'Tether', bg: '#26a17b', fg: '#fff', glyph: '₮' },
  { id: 'USDC', name: 'USD Coin', bg: '#2f6fd0', fg: '#fff', glyph: '$' },
  { id: 'SOL', name: 'Solana', bg: '#16181c', fg: '#b58cff', glyph: 'S' },
  { id: 'ETH', name: 'Ethereum', bg: '#6f7ce0', fg: '#fff', glyph: 'Ξ' },
  { id: 'BTC', name: 'Bitcoin', bg: '#f0932b', fg: '#fff', glyph: '₿' },
]

// ---- one behaviour for every overlay in the shell ------------------------------------
// Focus moves in when it opens, Tab stays inside, Escape closes it, the page behind does not scroll (phone), and focus
// goes back to the control that opened it when it was closed from the keyboard.
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
const shown = (e: HTMLElement) => e.getClientRects().length > 0
let byKey = false
let locks = 0
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', () => { byKey = true }, true)
  window.addEventListener('pointerdown', () => { byKey = false }, true)
}
export function useOverlay(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void, o: { lock?: boolean; first?: boolean } = {}) {
  const fn = useRef(close)
  fn.current = close
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const box = ref.current
    if (box && !box.contains(document.activeElement)) ((o.first && [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].find(shown)) || box).focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return fn.current()
      const el = ref.current
      if (e.key !== 'Tab' || !el) return
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(shown)
      if (!items.length) return e.preventDefault()
      const at = document.activeElement as HTMLElement
      const first = items[0], last = items[items.length - 1]
      if (!el.contains(at)) { e.preventDefault(); first.focus() }
      else if (e.shiftKey && (at === first || at === el)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', key)
    const lock = !!o.lock
    if (lock && ++locks === 1) document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', key)
      if (lock && --locks === 0) document.documentElement.style.overflow = ''
      if (byKey && prev?.isConnected) prev.focus({ preventScroll: true })
    }
  }, [open])
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    window.addEventListener('pointerdown', down)
    return () => window.removeEventListener('pointerdown', down)
  }, [open])
  return ref
}

// Desktop: a popover hung from the balance button (it is rendered inside that button's wrapper in the top bar).
// Phone: a bottom sheet over the page.
export function Wallet() {
  const { wallet, set, balance, bets, shellToast } = useApp()
  const phone = useIsPhone()
  const close = () => set({ wallet: false })
  const ref = useDismiss(wallet, close)
  const { mounted, closing } = usePresence(wallet, phone ? EXIT.sheet : EXIT.pop)
  useOverlay(wallet, ref, close, { lock: phone, first: true })
  if (!mounted) return null
  const open = bets.filter((b) => b.status === 'open')
  const inPlay = open.reduce((a, b) => a + b.stake, 0)
  return (
    <>
      {phone && <div className={cx('scrim', closing && 'is-closing')} />}
      <div ref={ref} tabIndex={-1} className={cx('wallet', phone && 'sheet', closing && 'is-closing')} role="dialog" aria-modal={phone || undefined} aria-label="Wallet">
        <div className="wl-h"><b>Wallet</b><button className="ib" aria-label="Close wallet" onClick={close}><X size={18} /></button></div>
        <div className="wl-total">
          <span className="meta">Total balance</span>
          <b className="d"><Usdt />{money(balance)}</b>
          <span className="meta">{open.length ? <>plus <b className="d">{money(inPlay)}</b> staked on {open.length} open bet{open.length > 1 ? 's' : ''}</> : 'Nothing staked right now'}</span>
        </div>
        <div className="micro sub">Currencies</div>
        {COINS.map((c, i) => (
          <div className={cx('wl-row', i === 0 && 'on')} key={c.id}>
            <i className="coin" style={{ background: c.bg, color: c.fg }} aria-hidden>{c.glyph}</i>
            <span><b>{c.id}</b><span className="meta">{c.name}</span></span>
            {i === 0 && <span className="wl-tag"><Check size={12} weight="bold" /> Sportsbook</span>}
            <b className="d amt">{money(i === 0 ? balance : 0)}</b>
          </div>
        ))}
        <p className="meta wl-note">Sportsbook stakes and returns are in USDT. This is a demo balance: no real money moves.</p>
        <div className="wl-acts">
          <button className="btn pri" onClick={shellToast}><ArrowDown size={16} /> Deposit</button>
          <button className="btn" onClick={shellToast}><ArrowUp size={16} /> Withdraw</button>
        </div>
      </div>
    </>
  )
}

// balance button: the currency and amount the sportsbook stakes in, opening the wallet
export function BalanceButton() {
  const { balance, wallet, set } = useApp()
  return (
    <button className={cx('bal', wallet && 'on')} aria-expanded={wallet} aria-label={`Balance ${money(balance)} USDT. Open wallet`} onPointerDown={(e) => e.stopPropagation()} onClick={() => set({ wallet: !wallet })}>
      <Usdt /><b className="d"><Price value={balance} /></b><CaretDown size={13} />
    </button>
  )
}

export function AccountMenu() {
  const { user, logout, set } = useApp()
  const [open, setOpen] = useState(false)
  const [, nav] = useLocation()
  const ref = useDismiss(open, () => setOpen(false))
  const menu = useRef<HTMLDivElement>(null)
  const { mounted, closing } = usePresence(open, EXIT.pop)
  useOverlay(open, menu, () => setOpen(false), { first: true })
  if (!user) return null
  const initials = user.alias.split(/[^a-z]+/i).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const go = (to: string) => () => { setOpen(false); nav(to) }
  // Up, Down, Home and End walk the items, as a menu should
  const onKey = (e: React.KeyboardEvent) => {
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const at = items.indexOf(document.activeElement as HTMLElement)
    const to = e.key === 'ArrowDown' ? (at + 1) % items.length : e.key === 'ArrowUp' ? (at - 1 + items.length) % items.length : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -1
    if (to < 0) return
    e.preventDefault()
    items[to]?.focus()
  }
  return (
    <div className="acctw" ref={ref}>
      <button className={cx('avb', open && 'on')} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${user.alias}`} onClick={() => setOpen(!open)}><i className="av" aria-hidden>{initials}</i><CaretDown size={12} /></button>
      {mounted && (
        <div ref={menu} tabIndex={-1} className={cx('acct-m', closing && 'is-closing')} role="menu" aria-label="Account" onKeyDown={onKey}>
          <div className="am-h"><b>{user.alias}</b><span className="meta">Demo player</span></div>
          <button role="menuitem" onClick={go('/stats')}><ChartLineUp size={18} /> Your record</button>
          <button role="menuitem" onClick={go('/bets')}><Receipt size={18} /> My bets</button>
          <button role="menuitem" onClick={() => { setOpen(false); set({ wallet: true }) }}><i className="tether" aria-hidden>₮</i> Wallet</button>
          <hr />
          <button role="menuitem" data-scenes onClick={() => { setOpen(false); set({ scenes: true }) }}><SlidersHorizontal size={18} /> Demo controls</button>
          <button role="menuitem" onClick={() => { setOpen(false); logout(); nav('/') }}><SignOut size={18} /> Log out</button>
        </div>
      )}
    </div>
  )
}
