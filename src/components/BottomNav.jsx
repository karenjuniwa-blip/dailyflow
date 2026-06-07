import { CalendarDays, Clock, Plus, Flame, BarChart2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/today',    Icon: CalendarDays, label: 'Today'  },
  { path: '/schedule', Icon: Clock,        label: 'Jadwal' },
  { path: null,        Icon: Plus,         label: 'fab'    }, // FAB tengah
  { path: '/habits',   Icon: Flame,        label: 'Habits' },
  { path: '/review',   Icon: BarChart2,    label: 'Review' },
]

export default function BottomNav({ onFab }) {
  const { pathname } = useLocation()
  const navigate     = useNavigate()

  return (
    <nav
      aria-label="Navigasi utama"
      style={{
        height: 62,
        background: 'var(--bg1)',
        borderTop: '0.5px solid var(--bdr)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 4px 6px',
        flexShrink: 0,
      }}
    >
      {TABS.map(({ path, Icon, label }) => {
        // FAB tombol tengah
        if (label === 'fab') {
          return (
            <button
              key="fab"
              onClick={onFab}
              aria-label="Tambah task, habit, atau jadwal"
              style={{
                width: 50, height: 50,
                borderRadius: '50%',
                background: 'var(--acc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
                boxShadow: '0 2px 12px rgba(139,175,124,0.35)',
                transition: 'transform 0.15s, opacity 0.15s',
                flexShrink: 0,
              }}
              onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.93)')}
              onTouchEnd={(e)   => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Icon size={22} color="#1A2217" strokeWidth={2.5} />
            </button>
          )
        }

        const active = pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 10px',
              color: active ? 'var(--acc)' : 'var(--txt3)',
              fontSize: 10,
              minWidth: 52,
              transition: 'color 0.15s',
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {/* Active dot indicator */}
            {active && (
              <div style={{
                position: 'absolute',
                top: 2,
                width: 4, height: 4,
                borderRadius: '50%',
                background: 'var(--acc)',
              }} />
            )}
            <Icon
              size={22}
              strokeWidth={active ? 2 : 1.5}
              aria-hidden="true"
            />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}