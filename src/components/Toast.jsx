import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((text, type = 'success', duration = 2800) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const ICON = {
    success: <CheckCircle size={15} color="var(--acc2)"  strokeWidth={2} />,
    error:   <XCircle     size={15} color="var(--red)"   strokeWidth={2} />,
    info:    <Info        size={15} color="var(--blue)"  strokeWidth={2} />,
  }

  const BG = {
    success: 'var(--acc-dim)',
    error:   'var(--red-dim)',
    info:    'var(--blue-dim)',
  }

  const BORDER = {
    success: 'var(--acc3)',
    error:   'var(--red)',
    info:    'var(--blue)',
  }

  return (
    <ToastCtx.Provider value={show}>
      {children}

      <div style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 0',
        width: '100%',
        maxWidth: 430,
        pointerEvents: 'none',
        alignItems: 'center',
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: BG[t.type],
              border: `0.5px solid ${BORDER[t.type]}`,
              borderRadius: 'var(--r-full)',
              fontSize: 13,
              color: 'var(--txt)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              pointerEvents: 'all',
              animation: 'toastIn 0.2s ease',
              maxWidth: '90%',
            }}
          >
            {ICON[t.type]}
            <span style={{ flex: 1 }}>{t.text}</span>
            <button
              onClick={() => dismiss(t.id)}
              style={{ color: 'var(--txt3)', padding: 2, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastCtx.Provider>
  )
}