import { StrictMode, useState, useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import { DesktopWidget } from './components/DesktopWidget'
import { ChatWidget } from './components/ChatWidget'
import { LandingPage } from './components/LandingPage'
import { CLIENTS } from './config/clients'

const FONT = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif'

const CODE_LENGTH = 6

function OtpInput({ onComplete }) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
  const refs = useRef([])

  const focus = (i) => refs.current[i]?.focus()

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = digit
    setDigits(next)
    if (digit && i < CODE_LENGTH - 1) focus(i + 1)
    if (next.every(d => d !== '')) onComplete(next.join(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; setDigits(next)
      } else if (i > 0) {
        focus(i - 1)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1)
    } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
      focus(i + 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    const lastFilled = Math.min(pasted.length, CODE_LENGTH - 1)
    focus(lastFilled)
    if (pasted.length === CODE_LENGTH) onComplete(pasted)
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          autoFocus={i === 0}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          style={{
            width: 44, height: 52, textAlign: 'center',
            fontSize: 22, fontWeight: 700, fontFamily: FONT,
            border: `2px solid ${d ? '#0f172a' : '#e2e8f0'}`,
            borderRadius: 12, outline: 'none', color: '#0f172a',
            background: d ? '#f8fafc' : '#fff',
            transition: 'border-color 120ms, background 120ms',
            caretColor: 'transparent',
          }}
          onFocusCapture={e => { e.target.style.borderColor = '#3b82f6' }}
          onBlurCapture={e => { e.target.style.borderColor = d ? '#0f172a' : '#e2e8f0' }}
        />
      ))}
    </div>
  )
}

function ResendButton({ onResend }) {
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const handleResend = () => {
    setSeconds(30)
    onResend()
  }

  if (seconds > 0) {
    return (
      <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
        Reenviar código en <span style={{ fontWeight: 600, color: '#64748b' }}>{seconds}s</span>
      </p>
    )
  }

  return (
    <button
      onClick={handleResend}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: '#0f172a',
        fontFamily: FONT, padding: 0, textDecoration: 'underline',
        textUnderlineOffset: 3,
      }}
    >
      Reenviar SMS
    </button>
  )
}

function LoginModal({ client: clientProp, onLogin, onClose }) {
  const client = clientProp ?? { name: 'OpenCentral', logo: null, primaryColor: '#6366f1' }
  const [step, setStep] = useState('main') // 'main' | 'email' | 'phone' | 'phone-verify'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpKey, setOtpKey] = useState(0) // resetea el OtpInput en reenvío

  const sendSms = () => {
    setStep('phone-verify')
  }

  const resendSms = () => {
    setOtpKey(k => k + 1)
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        fontFamily: FONT,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20,
          width: '100%', maxWidth: 400,
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header con logo del cliente */}
        <div style={{ padding: '28px 28px 20px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
          {client.logo
            ? <img src={client.logo} alt={client.name} style={{ height: 32, width: 'auto', objectFit: 'contain', marginBottom: 14 }} />
            : <div style={{ width: 40, height: 40, borderRadius: 12, background: client.primaryColor, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{client.name[0]}</span>
              </div>
          }
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {step === 'phone-verify' ? 'Ingresá el código' : 'Identificate para continuar'}
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {step === 'phone-verify'
              ? <>Te enviamos un SMS al <strong style={{ color: '#0f172a' }}>+54 {phone}</strong></>
              : <>Para chatear con {client.name} necesitamos saber quién sos.</>
            }
          </p>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {step === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SocialButton
                onClick={() => onLogin({ provider: 'google', name: 'Usuario Google' })}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                }
                label="Continuar con Google"
                bg="#fff" border="#e2e8f0" color="#0f172a"
              />
              <SocialButton
                onClick={() => onLogin({ provider: 'facebook', name: 'Usuario Facebook' })}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                }
                label="Continuar con Facebook"
                bg="#fff" border="#e2e8f0" color="#0f172a"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>o continuá con</span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              </div>
              <SocialButton
                onClick={() => setStep('email')}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6l-10 7L2 6" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                label="Continuar con Email"
                bg="#f8fafc" border="#e2e8f0" color="#0f172a"
              />
              <SocialButton
                onClick={() => setStep('phone')}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                label="Continuar con Teléfono"
                bg="#f8fafc" border="#e2e8f0" color="#0f172a"
              />
            </div>
          )}

          {step === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <BackButton onClick={() => setStep('main')} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tu email</label>
                <input
                  autoFocus type="email" placeholder="nombre@ejemplo.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && email && onLogin({ provider: 'email', name: email, email })}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <PrimaryButton disabled={!email} onClick={() => email && onLogin({ provider: 'email', name: email, email })}>
                Continuar
              </PrimaryButton>
            </div>
          )}

          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <BackButton onClick={() => setStep('main')} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tu número de teléfono</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#475569', background: '#f8fafc', whiteSpace: 'nowrap' }}>🇦🇷 +54</div>
                  <input
                    autoFocus type="tel" placeholder="11 1234-5678"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && phone && sendSms()}
                    style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
              <PrimaryButton disabled={!phone} onClick={() => phone && sendSms()}>
                Enviar código por SMS
              </PrimaryButton>
            </div>
          )}

          {step === 'phone-verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <BackButton onClick={() => setStep('phone')} label="Cambiar número" />
              <OtpInput key={otpKey} onComplete={code => onLogin({ provider: 'phone', name: `+54 ${phone}`, phone, code })} />
              <div style={{ textAlign: 'center' }}>
                <ResendButton onResend={resendSms} />
              </div>
            </div>
          )}

          {step !== 'phone-verify' && (
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5 }}>
              Al continuar aceptás los <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Términos de uso</span> y la <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Política de privacidad</span>.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function BackButton({ onClick, label = 'Volver' }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b', fontFamily: FONT, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {label}
    </button>
  )
}

function PrimaryButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      style={{ background: disabled ? '#e2e8f0' : '#0f172a', color: disabled ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', fontFamily: FONT, transition: 'background 150ms', width: '100%' }}
    >
      {children}
    </button>
  )
}

function SocialButton({ onClick, icon, label, bg, border, color }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '11px 16px',
        background: hovered ? '#f8fafc' : bg,
        border: `1.5px solid ${hovered ? '#cbd5e1' : border}`,
        borderRadius: 10, cursor: 'pointer',
        fontFamily: FONT, fontSize: 14, fontWeight: 600, color,
        transition: 'all 120ms',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const HEADER_H = 60

function AppHeader({ loggedInUser, onLogout }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: HEADER_H, zIndex: 10001,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px',
      fontFamily: FONT,
    }}>
      <img src="/opencentral-logo.png" alt="OpenCentral" style={{ height: 26, width: 'auto', flexShrink: 0 }} />
      <div style={{ flex: 1 }} />

      {loggedInUser && (
        <div style={{ position: 'relative' }}>
          {/* Pill button */}
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: 999, padding: '3px 10px 3px 3px',
              cursor: 'pointer', fontFamily: FONT,
              transition: 'border-color 150ms, background 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>S</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Santiago</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 2, color: '#94a3b8', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Backdrop */}
          {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />}

          {/* Dropdown */}
          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: '#fff', borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
              width: 220, zIndex: 1, overflow: 'hidden',
              animation: 'dw-spinner-in 150ms ease both',
            }}>
              {/* Profile header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>S</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Santiago</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Conectado</div>
                </div>
              </div>
              {/* Actions */}
              <div style={{ padding: '6px' }}>
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', background: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: '#374151', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Datos del perfil
                </button>
                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 6px' }} />
                <button
                  onClick={onLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', background: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: '#ef4444', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileModal({ onClose }) {
  const FONT = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif'
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [form, setForm] = useState({
    nombre: 'Santiago', apellido: 'Garbers',
    email: 'santiago.garbers@botmaker.io', telefono: '+54 9 11 1234-5678',
  })

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const Field = ({ id, label, type = 'text' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: FONT, letterSpacing: '0.01em' }}>{label}</label>
      <input
        type={type}
        value={form[id]}
        onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
        style={{ padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, color: '#111827', fontFamily: FONT, outline: 'none', transition: 'border-color 150ms', width: '100%', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#6366f1'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  )

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}
    >
      <div style={{
        background: '#fff',
        borderRadius: isMobile ? '24px 24px 0 0' : 20,
        width: '100%', maxWidth: isMobile ? '100%' : 460,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        fontFamily: FONT,
        animation: isMobile ? 'prof-sheet 0.32s cubic-bezier(0.16,1,0.3,1) both' : 'prof-in 0.28s cubic-bezier(0.16,1,0.3,1) both',
        display: 'flex', flexDirection: 'column',
        maxHeight: isMobile ? '92dvh' : 'auto',
      }}>
        <style>{`
          @keyframes prof-in { from { opacity:0; transform:translateY(16px) scale(0.97) } to { opacity:1; transform:none } }
          @keyframes prof-sheet { from { transform:translateY(100%) } to { transform:translateY(0) } }
        `}</style>

        {/* Drag handle — mobile */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ padding: isMobile ? '14px 20px' : '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>Perfil</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Avatar */}
          <div style={{ padding: isMobile ? '20px 20px' : '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 16, justifyContent: isMobile ? 'center' : 'flex-start', flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src="/avatar-santiago.jpg" alt="Santiago" style={{ width: isMobile ? 80 : 68, height: isMobile ? 80 : 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f3f4f6', display: 'block' }} />
              <button title="Cambiar foto" style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: '#111827', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Santiago Garbers</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 3 }}>santiago.garbers@botmaker.io</div>
            </div>
          </div>

          {/* Form */}
          <div style={{ padding: isMobile ? '20px 20px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field id="nombre" label="Nombre" />
              <Field id="apellido" label="Apellido" />
            </div>
            <Field id="email" label="Email" type="email" />
            <Field id="telefono" label="Teléfono" type="tel" />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: isMobile ? '12px 20px 32px' : '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          {isMobile ? (
            <>
              <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#111827', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: FONT }}>Guardar cambios</button>
              <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#374151', fontFamily: FONT }}>Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: FONT }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>Cancelar</button>
              <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#111827', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: FONT }} onMouseEnter={e => e.currentTarget.style.background = '#1f2937'} onMouseLeave={e => e.currentTarget.style.background = '#111827'}>Guardar cambios</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function App() {
  const [view, setView] = useState('landing')
  const [activeClient, setActiveClient] = useState(null)
  const [pendingClient, setPendingClient] = useState(null)
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [widgetClient, setWidgetClient] = useState(null)
  const [widgetKey, setWidgetKey] = useState(0)

  const handleSelectClient = (client) => {
    setPendingClient(client)
  }

  const handleLogin = (user) => {
    const client = pendingClient
    setLoggedInUser(user)
    setPendingClient(null)
    setActiveClient(client)
    setView('loading')
    setTimeout(() => {
      setView('transitioning')
      setTimeout(() => setView('desktop'), 380)
    }, 750)
  }

  const handleLogout = () => {
    setLoggedInUser(null)
  }

  const handleHeaderLogin = (user) => {
    setLoggedInUser(user)
    setLoginOpen(false)
  }

  const handleClose = () => {
    setView('landing')
    setActiveClient(null)
  }

  const showSpinner = view === 'loading' || view === 'transitioning'
  const showDesktop = view === 'transitioning' || view === 'desktop'

  const widgetConfig = widgetClient
    ? { ...widgetClient.config, user: { nombre: 'Santiago' } }
    : {}

  const clientSelector = {
    clients: CLIENTS,
    activeId: widgetClient?.id ?? null,
    onChange: setWidgetClient,
  }

  return (
    <>
      {view === 'landing' && (
        <>
          <LandingPage onSelectClient={handleSelectClient} loggedInUser={loggedInUser} onLogout={handleLogout} onOpenProfile={() => setProfileOpen(true)} onOpenLogin={() => setLoginOpen(true)} />
          <ChatWidget
            key={widgetKey}
            config={widgetConfig}
            clientSelector={clientSelector}
          />
        </>
      )}
      {showDesktop && (
        <DesktopWidget
          config={{ ...activeClient.config, user: { nombre: 'Santiago' } }}
          onClose={handleClose}
          loggedInUser={loggedInUser}
          onLogout={handleLogout}
          onOpenProfile={() => setProfileOpen(true)}
        />
      )}
      {showSpinner && <DesktopSpinner fading={view === 'transitioning'} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {loginOpen && <LoginModal client={null} onLogin={handleHeaderLogin} onClose={() => setLoginOpen(false)} />}
      {pendingClient && (
        <LoginModal
          client={pendingClient}
          onLogin={handleLogin}
          onClose={() => setPendingClient(null)}
        />
      )}
    </>
  )
}

function DesktopSpinner({ fading = false }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: fading ? 'dw-spinner-out 350ms ease forwards' : 'dw-spinner-in 150ms ease forwards',
    }}>
      <style>{`
        @keyframes dw-spin        { to   { transform: rotate(360deg); } }
        @keyframes dw-spinner-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dw-spinner-out { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#6b7280', animation: 'dw-spin 0.65s linear infinite' }} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
