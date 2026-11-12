// The signed-in part of the top bar: balance, wallet, account menu. Demo money only; deposits and withdrawals are not part of this prototype.
import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CaretDown, ChartLineUp, Check, Receipt, SignOut, X } from '@phosphor-icons/react'
import { useLocation } from 'wouter'
import { money } from './book'
import { useApp } from './store'
import { cx, Price, Usdt, useIsPhone } from './ui'

const COINS: { id: string; name: string; bg: string; fg: string; glyph: string }[] = [
  { id: 'USDT', name: 'Tether', bg: '#26a17b', fg: '#fff', glyph: '₮' },
  { id: 'USDC', name: 'USD Coin', bg: '#2f6fd0', fg: '#fff', glyph: '$' },
  { id: 'SOL', name: 'Solana', bg: '#16181c', fg: '#b58cff', glyph: 'S' },
  { id: 'ETH', name: 'Ethereum', bg: '#6f7ce0', fg: '#fff', glyph: 'Ξ' },
  { id: 'BTC', name: 'Bitcoin', bg: '#f0932b', fg: '#fff', glyph: '₿' },
]

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('pointerdown', down); window.removeEventListener('keydown', key) }
  }, [open])
  return ref
}

export function Wallet() {
  const { wallet, set, balance, bets, shellToast } = useApp()
  const phone = useIsPhone()
  const close = () => set({ wallet: false })
  const ref = useDismiss(wallet, close)
  if (!wallet) return null
  const open = bets.filter((b) => b.status === 'open')
  const inPlay = open.reduce((a, b) => a + b.stake, 0)
  return (
    <>
      {phone && <div className="scrim" />}
      <div ref={ref} className={cx('wallet', phone && 'sheet')} role="dialog" aria-label="Wallet">
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
  if (!user) return null
  const initials = user.alias.split(/[^a-z]+/i).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const go = (to: string) => () => { setOpen(false); nav(to) }
  return (
    <div className="acctw" ref={ref}>
      <button className={cx('avb', open && 'on')} aria-expanded={open} aria-label={`Account menu for ${user.alias}`} onClick={() => setOpen(!open)}><i className="av" aria-hidden>{initials}</i><CaretDown size={12} /></button>
      {open && (
        <div className="acct-m" role="menu">
          <div className="am-h"><b>{user.alias}</b><span className="meta">Demo player</span></div>
          <button role="menuitem" onClick={go('/stats')}><ChartLineUp size={18} /> Statistics</button>
          <button role="menuitem" onClick={go('/bets')}><Receipt size={18} /> My bets</button>
          <button role="menuitem" onClick={() => { setOpen(false); set({ wallet: true }) }}><i className="tether" aria-hidden>₮</i> Wallet</button>
          <hr />
          <button role="menuitem" onClick={() => { setOpen(false); logout(); nav('/') }}><SignOut size={18} /> Log out</button>
        </div>
      )}
    </div>
  )
}
