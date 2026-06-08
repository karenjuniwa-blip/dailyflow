import { useState } from 'react'
import { LayoutDashboard, Shield, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store'

export default function Authpage() {
  const { signIn, signUp } = useAuthStore()
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password); // Memanggil fungsi
    } catch (err) {
      console.error("Login error:", err.message);
    }
  };

  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState(null)       // { type: 'error'|'success', text }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setMsg({ type: 'error', text: 'Email dan password wajib diisi.' })
      return
    }
    if (password.length < 6) {
      setMsg({ type: 'error', text: 'Password minimal 6 karakter.' })
      return
    }

    setLoading(true)
    setMsg(null)

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        // AuthGuard di App.jsx akan otomatis redirect ke /today
      } else {
        await signUp(email.trim(), password)
        setMsg({
          type: 'success',
          text: 'Akun berhasil dibuat! Silakan masuk dengan email dan password Anda.',
        })
        setMode('login')
      }
    } catch (err) {
      const map = {
        'Invalid login credentials': 'Email atau password salah.',
        'Email not confirmed':        'Cek email Anda untuk konfirmasi akun.',
        'User already registered':    'Email sudah terdaftar. Silakan masuk.',
      }
      setMsg({ type: 'error', text: map[err.message] || err.message })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setMsg(null)
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 24px',
      background: 'var(--bg0)',
      overflowY: 'auto',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'var(--acc-dim)', border: '0.5px solid var(--acc3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LayoutDashboard size={22} color="var(--acc)" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--txt)' }}>DayFlow</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)' }}>Daily Planner</div>
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--txt)', marginBottom: 6 }}>
          {mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6 }}>
          {mode === 'login'
            ? 'Masuk untuk melanjutkan perencanaan hari Anda'
            : 'Daftarkan akun pribadi Anda secara gratis'}
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Email */}
        <label className="field-label">Email</label>
        <input
          className="field-input"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoComplete="email"
          inputMode="email"
        />

        {/* Password */}
        <label className="field-label">Password</label>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            className="field-input"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={{ marginBottom: 0, paddingRight: 44 }}
          />
          <button
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--txt3)', padding: 4,
            }}
            type="button"
            aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            padding: '9px 12px',
            background: msg.type === 'error' ? 'var(--red-dim)' : 'var(--acc-dim)',
            border: `0.5px solid ${msg.type === 'error' ? 'var(--red)' : 'var(--acc3)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: 13,
            color: msg.type === 'error' ? 'var(--red)' : 'var(--acc2)',
            marginBottom: 12,
            lineHeight: 1.5,
          }}>
            {msg.text}
          </div>
        )}

        {/* Submit button */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginBottom: 14 }}
        >
          {loading
            ? 'Memproses...'
            : mode === 'login' ? 'Masuk' : 'Daftar'}
        </button>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--txt2)' }}>
          {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            onClick={switchMode}
            style={{ color: 'var(--acc)', fontWeight: 500 }}
          >
            {mode === 'login' ? 'Daftar gratis' : 'Masuk'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginTop: 48, fontSize: 11, color: 'var(--txt3)',
      }}>
        <Shield size={11} />
        Aman dengan Supabase Auth
      </div>
    </div>
  )
}