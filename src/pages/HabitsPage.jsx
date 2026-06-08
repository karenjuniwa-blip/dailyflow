import { useEffect, useState } from 'react'
import { format, getDaysInMonth, startOfWeek, endOfWeek } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Plus, Trash2 } from 'lucide-react'
import { useAuthStore, useHabitStore, useHabitLogStore } from '../store'
import Topbar from '../components/Topbar'
import LogModal from '../components/LogModal'
import { useToast } from '../components/Toast'
import { SkeletonHabits } from '../components/Skeleton'

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const MONTHS_S = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const todayStr = () => format(new Date(), 'yyyy-MM-dd')

function WeekDots({ habitId }) {
  const { habitLogs } = useHabitLogStore()
  const days  = ['S','S','R','K','J','S','M']

  return (
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'0.5px solid var(--bdr)' }}>
      {Array.from({ length:7 }, (_, i) => {
        const d   = new Date(); d.setDate(d.getDate() - (6 - i))
        const key = format(d, 'yyyy-MM-dd')
        const isT = key === todayStr()
        const done = habitLogs.some((log) => log.habit_id === habitId && format(new Date(log.logged_at), 'yyyy-MM-dd') === key)

        return (
          <div key={i} style={{ width:32, height:32, borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: done ? 'var(--acc)' : isT ? 'var(--acc-dim)' : 'rgba(255,255,255,0.05)', border: isT && !done ? '1.5px solid var(--acc3)' : 'none' }}>
            <span style={{ fontSize:10, fontWeight:500, color: done ? '#1A2217' : isT ? 'var(--acc2)' : 'var(--txt3)' }}>{days[i]}</span>
            <span style={{ fontSize:8, color: done ? '#1A2217' : 'var(--txt3)', opacity:0.7 }}>{d.getDate()}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatDetail({ habit, onBack }) {
  const { getStreak, getBestStreak } = useHabitStore()
  const { habitLogs } = useHabitLogStore()
  const [tab,       setTab]       = useState('stat')
  const [calYear,   setCalYear]   = useState(new Date().getFullYear())
  const [calMonth,  setCalMonth]  = useState(new Date().getMonth())
  const [chartYear, setChartYear] = useState(new Date().getFullYear())

  const streak   = getStreak ? getStreak(habit.id, habitLogs) : 0
  const best     = getBestStreak ? getBestStreak(habit.id) : 0
  const currentHabitLogs = habitLogs.filter(log => log.habit_id === habit.id)

  const countInRange = (days) => {
    let c = 0, d = new Date()
    for (let i = 0; i < days; i++) {
      const targetDate = format(d, 'yyyy-MM-dd')
      if (currentHabitLogs.some(log => format(new Date(log.logged_at), 'yyyy-MM-dd') === targetDate)) c++
      d.setDate(d.getDate() - 1)
    }
    return c
  }

  const monthData = Array.from({ length:12 }, (_, m) => {
    const filtered = currentHabitLogs.filter(log => {
      const logDate = new Date(log.logged_at)
      return logDate.getFullYear() === chartYear && logDate.getMonth() === m
    })
    return new Set(filtered.map(log => format(new Date(log.logged_at), 'yyyy-MM-dd'))).size
  })
  const maxBar = Math.max(...monthData, 1)

  const firstDay  = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
  const daysInMon = getDaysInMonth(new Date(calYear, calMonth))
  const todayDay  = calYear === new Date().getFullYear() && calMonth === new Date().getMonth() ? new Date().getDate() : null

  const prevCal = () => calMonth === 0  ? (setCalMonth(11), setCalYear(y=>y-1)) : setCalMonth(m=>m-1)
  const nextCal = () => calMonth === 11 ? (setCalMonth(0),  setCalYear(y=>y+1)) : setCalMonth(m=>m+1)

  return (
    <div className="page-root anim-slide-right" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <button onClick={onBack} style={{ color:'var(--txt2)', background:'none', border:'none', cursor:'pointer' }}><ArrowLeft size={22}/></button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:500, color:'var(--txt)' }}>{habit.icon} {habit.name}</div>
            <div style={{ fontSize:12, color:'var(--txt2)', marginTop:1 }}>{habit.frequency === 'daily' ? 'Setiap hari' : `${habit.freq_days}x per minggu`}</div>
          </div>
        </div>
      </div>

      <div className="page-scroll">
        {tab === 'stat' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14 }}>
              <div className="card" style={{ textAlign:'center', padding:'18px 12px' }}>
                <div style={{ fontSize:36, fontWeight:500, color:'var(--txt)' }}>{streak}</div>
                <div style={{ fontSize:11, color:'var(--txt2)' }}>Streak Saat Ini</div>
              </div>
              <div className="card" style={{ textAlign:'center', padding:'18px 12px' }}>
                <div style={{ fontSize:36, fontWeight:500, color:'var(--txt)' }}>{best}</div>
                <div style={{ fontSize:11, color:'var(--txt2)' }}>Streak Terbaik</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function HabitsPage({ onAddAddHabit }) {
  const { user } = useAuthStore()
  const { habits, loading, fetchHabits, getStreak, removeHabit } = useHabitStore()
  const { habitLogs, fetchHabitLogs } = useHabitLogStore()
  const toast = useToast()
  const [selected,  setSelected]  = useState(null)
  const [logTarget, setLogTarget] = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const td = todayStr()

  useEffect(() => {
    if (user) {
      fetchHabits(user.id)
      fetchHabitLogs(user.id)
    }
  }, [user])

  // FIX: Sinkronisasi data atas (Hero Section) dengan database log asli
  const maxStreak   = habits.length ? Math.max(0, ...habits.map((h) => getStreak ? getStreak(h.id, habitLogs) : 0)) : 0
  const doneToday   = habits.filter((h) => habitLogs.some(log => log.habit_id === h.id && format(new Date(log.logged_at), 'yyyy-MM-dd') === td)).length
  const consistency = habits.length ? Math.round((doneToday / habits.length) * 100) : 0
  const circumf     = 2 * Math.PI * 25

  const handleDeactivate = async (h) => {
    if(!user?.id) return
    await removeHabit(user.id, h.id)
    toast(`Habit "${h.name}" dihapus`, 'info')
    setConfirm(null)
  }

  if (selected) return <StatDetail habit={selected} onBack={() => setSelected(null)} />

  return (
    // FIX: Styling layout diatur menggunakan fleksibilitas persentase 100% agar responsif di tablet/HP
    <div className="page-root" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <Topbar sub={format(new Date(), 'EEEE, d MMMM', { locale: localeId })} title="Habit tracker" />

      {loading && habits.length === 0 ? (
        <div className="page-scroll" style={{ padding:0 }}><SkeletonHabits /></div>
      ) : (
        <div className="page-scroll" style={{ width: '100%' }}>
          {/* Stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14, marginBottom:10 }}>
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <Flame size={16} color="var(--gold)"/><span className="pill pill-gold">terpanjang</span>
              </div>
              <div style={{ fontSize:28, fontWeight:500 }}>{maxStreak}</div>
              <div style={{ fontSize:11, color:'var(--txt2)', marginTop:2 }}>Streak terpanjang</div>
            </div>
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span>🎯</span><span className="pill pill-sage">hari ini</span>
              </div>
              <div style={{ fontSize:28, fontWeight:500 }}>{consistency}%</div>
              <div style={{ fontSize:11, color:'var(--txt2)', marginTop:2 }}>Konsistensi</div>
            </div>
          </div>

          {/* Circle Summary */}
          <div className="card" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
              <circle cx="34" cy="34" r="25" fill="none" stroke="var(--acc)" strokeWidth="6"
                strokeDasharray={`${circumf * consistency / 100} ${circumf * (1 - consistency/100)}`}
                strokeLinecap="round" transform="rotate(-90 34 34)"/>
              <text x="34" y="38" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--acc)">{consistency}%</text>
            </svg>
            <div>
              <div style={{ fontSize:24, fontWeight:500 }}>{doneToday} / {habits.length}</div>
              <div style={{ fontSize:12, color:'var(--txt2)', marginTop:2 }}>Habit selesai hari ini</div>
            </div>
          </div>

          {/* List Habits */}
          {habits.map((h) => {
            const todayLogs = habitLogs.filter(log => log.habit_id === h.id && format(new Date(log.logged_at), 'yyyy-MM-dd') === td)
            const progVal = todayLogs.reduce((sum, curr) => sum + curr.value, 0)
            const isDone = h.measure_type === 'yesno' ? todayLogs.length > 0 : progVal >= h.target_value
            const progPct = h.measure_type !== 'yesno' ? Math.min(100, Math.round((progVal / h.target_value) * 100)) : 0
            const streak = getStreak ? getStreak(h.id, habitLogs) : 0

            return (
              <div key={h.id} className="card" style={{ marginBottom:8, width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background: isDone ? 'var(--acc-dim)' : 'var(--bg2)', border: isDone ? '0.5px solid var(--acc3)' : '0.5px solid var(--bdr)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {h.icon || '🌿'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:500, color:'var(--txt)' }}>{h.name}</div>
                    <div style={{ fontSize:11, color:'var(--txt2)' }}>target {h.target_value} {h.target_unit}</div>
                  </div>
                  <button onClick={() => setConfirm(h.id)} style={{ color:'var(--txt3)', padding:4, background:'none', border:'none', cursor:'pointer' }}><Trash2 size={14}/></button>
                </div>

                {h.measure_type !== 'yesno' && (
                  <div style={{ marginTop:10 }}>
                    <div className="prog-track"><div className="prog-fill prog-blue" style={{ width:`${progPct}%` }} /></div>
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setLogTarget(h)} style={{ width:'100%', padding:'8px', background:'var(--bg2)', border:'0.5px solid var(--bdr)', borderRadius:'var(--r-md)', color:'var(--txt2)', cursor:'pointer' }}>
                    {isDone ? '✓ Edit Progress' : '+ Catat progress'}
                  </button>
                </div>
                <WeekDots habitId={h.id}/>
                <button onClick={() => setSelected(h)} style={{ fontSize:11, color:'var(--acc)', marginTop:8, background:'none', border:'none', cursor:'pointer', display:'block', width:'100%', textAlign:'right' }}>Lihat statistik →</button>
              </div>
            )
          })}
        </div>
      )}

      {logTarget && <LogModal habit={logTarget} onClose={() => { setLogTarget(null); fetchHabitLogs(user.id); }}/>}
    </div>
  )
}