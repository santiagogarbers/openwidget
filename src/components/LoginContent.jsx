import { useState, useRef, useEffect } from 'react'

const FONT = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif'

export function SocialButton({ onClick, icon, label, bg, border, color }) {
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

export function BackButton({ onClick, label = 'Volver' }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b', fontFamily: FONT, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {label}
    </button>
  )
}

export function PrimaryButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      style={{ background: disabled ? '#e2e8f0' : '#0f172a', color: disabled ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', fontFamily: FONT, transition: 'background 150ms', width: '100%' }}
    >
      {children}
    </button>
  )
}

const CODE_LENGTH = 6

export function OtpInput({ onComplete }) {
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
    } else if (e.key === 'ArrowLeft' && i > 0) focus(i - 1)
    else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) focus(i + 1)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    focus(Math.min(pasted.length, CODE_LENGTH - 1))
    if (pasted.length === CODE_LENGTH) onComplete(pasted)
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          autoFocus={i === 0}
          type="text" inputMode="numeric" maxLength={1} value={d}
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

export function ResendButton({ onResend }) {
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
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: FONT, padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}
    >
      Reenviar SMS
    </button>
  )
}

export function LoginContent({ client, onLogin }) {
  const { name, logo, primaryColor = '#6366f1' } = client ?? { name: 'OpenWidget' }
  const [step, setStep] = useState('main')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpKey, setOtpKey] = useState(0)

  const sendSms = () => setStep('phone-verify')
  const resendSms = () => setOtpKey(k => k + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', fontFamily: FONT }}>
      {/* Brand header */}
      <div style={{ padding: '32px 24px 20px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
        {logo
          ? <img src={logo} alt={name} style={{ height: 36, width: 'auto', objectFit: 'contain', marginBottom: 16 }} />
          : <div style={{ width: 48, height: 48, borderRadius: 14, background: primaryColor, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{name[0]}</span>
            </div>
        }
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {step === 'phone-verify' ? 'Ingresá el código' : `Bienvenido a la atención al cliente de ${name}`}
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          {step === 'phone-verify'
            ? <>Te enviamos un SMS al <strong style={{ color: '#0f172a' }}>+54 {phone}</strong></>
            : <>Por favor iniciá sesión para conversar con {name}.</>
          }
        </p>
      </div>

      {/* Form */}
      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {step === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SocialButton
              onClick={() => onLogin({ provider: 'google', name: 'Usuario Google' })}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
              label="Continuar con Google"
              bg="#fff" border="#e2e8f0" color="#0f172a"
            />
            <SocialButton
              onClick={() => onLogin({ provider: 'facebook', name: 'Usuario Facebook' })}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>}
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
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 6l-10 7L2 6" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              label="Continuar con Email"
              bg="#f8fafc" border="#e2e8f0" color="#0f172a"
            />
            <SocialButton
              onClick={() => setStep('phone')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
  )
}
