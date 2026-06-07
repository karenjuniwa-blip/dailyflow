import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store'
import { ToastProvider } from './components/Toast'
import LoadingScreen from './components/LoadingScreen'
import BottomNav     from './components/BottomNav'
import AddModal      from './components/AddModal'
import OfflinePage   from './components/OfflinePage'
import AuthPage     from './pages/AuthPage'
import TodayPage    from './pages/TodayPage'
import SchedulePage from './pages/SchedulePage'
import HabitsPage   from './pages/HabitsPage'
import ReviewPage   from './pages/ReviewPage'

// ─── Deteksi online/offline ───────────────────────────────────────────────────
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const [showAdd, setShowAdd] = useState(false)
  const [addTab,  setAddTab]  = useState('task')
  const isOnline = useOnlineStatus()

  const openFab   = () => { setAddTab('task');  setShowAdd(true) }
  const openHabit = () => { setAddTab('habit'); setShowAdd(true) }
  const openBlock = () => { setAddTab('block'); setShowAdd(true) }

  if (!isOnline) return <OfflinePage />

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative', maxWidth: 430, margin: '0 auto',
      background: 'var(--bg0)',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/today"    element={<TodayPage />} />
          <Route path="/schedule" element={<SchedulePage onAdd={openBlock} />} />
          <Route path="/habits"   element={<HabitsPage onAddHabit={openHabit} />} />
          <Route path="/review"   element={<ReviewPage />} />
          <Route path="*"         element={<Navigate to="/today" replace />} />
        </Routes>
      </div>
      <BottomNav onFab={openFab} />
      {showAdd && <AddModal defaultTab={addTab} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

// ─── AuthGuard ────────────────────────────────────────────────────────────────
function AuthGuard({ children }) {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />
  if (!user)   return <AuthPage />
  return children
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthGuard>
          <AppShell />
        </AuthGuard>
      </ToastProvider>
    </BrowserRouter>
  )
}
