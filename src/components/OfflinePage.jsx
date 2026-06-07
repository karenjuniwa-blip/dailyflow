import { useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const [checking, setChecking] = useState(false)

  const retry = async () => {
    setChecking(true)
    try {
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors', cache: 'no-store',
      })
      window.location.reload()
    } catch {
      setChecking(false)
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 32px',
      background: 'var(--bg0)',
      textAlign: 'center',
      gap: 0,
    }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: 20,
        background: 'var(--bg2)',
        border: '0.5px solid var(--bdr2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <WifiOff size={32} color="var(--txt3)" strokeWidth={1.5} />
      </div>

      <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--txt)', marginBottom: 8 }}>
        Tidak ada koneksi
      </div>
      <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6, marginBottom: 28 }}>
        DayFlow membutuhkan koneksi internet
        <br />untuk menyinkronkan data Anda.
        <br />Periksa Wi-Fi atau data seluler Anda.
      </div>

      <button
        onClick={retry}
        disabled={checking}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 24px',
          background: 'var(--acc)',
          color: '#1A2217',
          borderRadius: 'var(--r-full)',
          fontSize: 14,
          fontWeight: 500,
          opacity: checking ? 0.7 : 1,
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <RefreshCw
          size={15}
          style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }}
        />
        {checking ? 'Memeriksa...' : 'Coba lagi'}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}