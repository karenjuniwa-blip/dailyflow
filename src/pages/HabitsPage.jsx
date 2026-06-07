import { useEffect, useState } from 'react'
import { format, getDaysInMonth } from 'date-fns'
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

// ─── WeekDots ─────────────────────────────────────────────────────────────────
function WeekDots({ habitId }) {
  const { habitLogs } = useHabitLogStore()
  const days  = ['S','S','R','K','J','S','M']

  return (
    <div style={{
      display:'flex', justifyContent:'space-between',
      marginTop:10, paddingTop:10, borderTop:'0.5px solid var(--bdr)',
    }}>
      {Array.from({ length:7 }, (_, i) => {
        const d   = new Date(); d.setDate(d.getDate() - (6 - i))
        const key = format(d, 'yyyy-MM-dd')
        const isT = key === todayStr()
        
        // Cari apakah ada log untuk habit ini di tanggal tersebut
        const done = habitLogs.some(
          (log) => log.habit_id === habitId && format(new Date(log.logged_at), 'yyyy-MM-dd') === key
        )

        return (
          <div key={i} style={{
            width:32, height:32, borderRadius:'50%',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            background: done ? 'var(--acc)' : isT ? 'var(--acc-dim)' : 'rgba(255,255,255,0.05)',
            border: isT && !done ? '1.5px solid var(--acc3)' : 'none',
          }}>
            <span style={{ fontSize:10, fontWeight:500, color: done ? '#1A2217' : isT ? 'var(--acc2)' : 'var(--txt3)' }}>
              {days[i]}
            </span>
            <span style={{ fontSize:8, color: done ? '#1A2217' : 'var(--txt3)', opacity:0.7 }}>
              {d.getDate()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── StatDetail ───────────────────────────────────────────────────────────────
function StatDetail({ habit, onBack }) {
  const { getStreak, getBestStreak } = useHabitStore()
  const { habitLogs } = useHabitLogStore()
  const [tab,       setTab]       = useState('stat')
  const [calYear,   setCalYear]   = useState(new Date().getFullYear())
  const [calMonth,  setCalMonth]  = useState(new Date().getMonth())
  const [chartYear, setChartYear] = useState(new Date().getFullYear())

  const streak   = getStreak ? getStreak(habit.id) : 0
  const best     = getBestStreak ? getBestStreak(habit.id) : 0

  // Filter log khusus untuk habit ini
  const currentHabitLogs = habitLogs.filter(log => log.habit_id === habit.id)

  const countInRange = (days) => {
    let c = 0, d = new Date()
    for (let i = 0; i < days; i++) {
      const targetDate = format(d, 'yyyy-MM-dd')
      const hasLog = currentHabitLogs.some(log => format(new Date(log.logged_at), 'yyyy-MM-dd') === targetDate)
      if (hasLog) c++
      d.setDate(d.getDate() - 1)
    }
    return c
  }

  // Menghitung jumlah hari unik yang terisi per bulan
  const monthData = Array.from({ length:12 }, (_, m) => {
    const filtered = currentHabitLogs.filter(log => {
      const logDate = new Date(log.logged_at)
      return logDate.getFullYear() === chartYear && logDate.getMonth() === m
    })
    const uniqueDays = new Set(filtered.map(log => format(new Date(log.logged_at), 'yyyy-MM-dd')))
    return uniqueDays.size
  })
  const maxBar = Math.max(...monthData, 1)

  // Ambil log untuk kalender bulan aktif
  const firstDay  = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
  const daysInMon = getDaysInMonth(new Date(calYear, calMonth))
  const todayDay  = calYear === new Date().getFullYear() && calMonth === new Date().getMonth()
    ? new Date().getDate() : null

  const prevCal = () => calMonth === 0  ? (setCalMonth(11), setCalYear(y=>y-1)) : setCalMonth(m=>m-1)
  const nextCal = () => calMonth === 11 ? (setCalMonth(0),  setCalYear(y=>y+1)) : setCalMonth(m=>m+1)

  return (
    <div className="page-root anim-slide-right">
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <button onClick={onBack} style={{ color:'var(--txt2)', flexShrink:0, background:'none', border:'none', cursor:'pointer' }}>
            <ArrowLeft size={22}/>
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:500, color:'var(--txt)' }}>
              {habit.icon} {habit.name}
            </div>
            <div style={{ fontSize:12, color:'var(--txt2)', marginTop:1 }}>
              {habit.frequency === 'daily' ? 'Setiap hari' : `${habit.freq_days}x per minggu`}
              {' · '}
              {habit.measure_type === 'yesno'
                ? 'Ya / Tidak'
                : `Target ${habit.target_value} ${habit.target_unit}`}
            </div>
          </div>
        </div>
        <div style={{ display:'flex' }}>
          {[
            { id:'stat', label:'Statistik' },
            { id:'cal',  label:'Kalender'  },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:'9px 0', fontSize:13, textAlign:'center',
              color:       tab === t.id ? 'var(--acc)' : 'var(--txt2)',
              fontWeight:  tab === t.id ? 500 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t.id ? '2px solid var(--acc)' : '2px solid transparent',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-scroll">
        {tab === 'stat' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14, marginBottom:10 }}>
              {[
                { num:streak, label:'Streak saat ini', tag:'sedang berjalan', cls:'pill-sage' },
                { num:best,   label:'Streak terbaik',  tag:'rekor',           cls:'pill-gold' },
              ].map(({ num, label, tag, cls }) => (
                <div key={label} className="card" style={{ textAlign:'center', padding:'18px 12px' }}>
                  <div style={{ fontSize:36, fontWeight:500, color:'var(--txt)', lineHeight:1, marginBottom:6 }}>
                    {num}
                  </div>
                  <div style={{ fontSize:11, color:'var(--txt2)', marginBottom:10 }}>{label}</div>
                  <span className={`pill ${cls}`}>{tag}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding:'4px 14px', marginBottom:10 }}>
              {[
                { label:'Minggu ini',   val: countInRange(7)   },
                { label:'Bulan ini',    val: countInRange(30)  },
                { label:'Tahun ini',    val: countInRange(365) },
                { label:'Semua waktu',  val: new Set(currentHabitLogs.map(l => format(new Date(l.logged_at), 'yyyy-MM-dd'))).size },
              ].map(({ label, val }, i) => (
                <div key={label}>
                  {i > 0 && <div className="divider"/>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0' }}>
                    <span style={{ fontSize:13, color:'var(--txt2)' }}>{label}</span>
                    <span style={{ fontSize:20, fontWeight:500, color:'var(--txt)' }}>{val}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--txt)' }}>Performa per bulan</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={() => setChartYear(y=>y-1)} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}>
                    <ChevronLeft size={16}/>
                  </button>
                  <span style={{ fontSize:12, color:'var(--txt)', minWidth:36, textAlign:'center' }}>{chartYear}</span>
                  <button onClick={() => setChartYear(y => Math.min(y+1, new Date().getFullYear()))} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}>
                    <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:96 }}>
                {monthData.map((val, m) => {
                  const isCur = m === new Date().getMonth() && chartYear === new Date().getFullYear()
                  const h = Math.max(3, Math.round((val / maxBar) * 78))
                  return (
                    <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ width:'100%', height:h, background: isCur ? 'var(--acc)' : 'rgba(139,175,124,0.3)', borderRadius:'3px 3px 0 0', position:'relative' }}>
                        {val > 0 && isCur && (
                          <div style={{ position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)', fontSize:9, color:'var(--acc)', whiteSpace:'nowrap' }}>{val}</div>
                        )}
                      </div>
                      <span style={{ fontSize:9, color: isCur ? 'var(--acc)' : 'var(--txt3)' }}>{MONTHS_S[m].slice(0,1)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'cal' && (
          <>
            <div className="card" style={{ marginTop:14, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <button onClick={prevCal} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}>
                  <ChevronLeft size={18}/>
                </button>
                <span style={{ fontSize:14, fontWeight:500, color:'var(--txt)' }}>{MONTHS[calMonth]} {calYear}</span>
                <button onClick={nextCal} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}>
                  <ChevronRight size={18}/>
                </button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                {Array.from({ length:firstDay }, (_,i) => <div key={`e${i}`}/>)}
                {Array.from({ length:daysInMon }, (_, i) => {
                  const day = i + 1
                  const checkDate = format(new Date(calYear, calMonth, day), 'yyyy-MM-dd')
                  const dayLogs = currentHabitLogs.filter(log => format(new Date(log.logged_at), 'yyyy-MM-dd') === checkDate)
                  
                  const done = dayLogs.length > 0
                  const logValue = dayLogs.reduce((sum, current) => sum + current.value, 0)
                  const partial = done && habit.measure_type !== 'yesno' && logValue < habit.target_value
                  const isT = day === todayDay
                  const past = !done && day < (todayDay || 999)

                  return (
                    <div key={day} style={{
                      aspectRatio:'1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
                      background: done && !partial ? 'var(--acc)' : partial ? 'rgba(139,175,124,0.35)' : isT ? 'var(--acc-dim)' : past ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: isT ? '1.5px solid var(--acc3)' : 'none',
                      color: done && !partial ? '#1A2217' : isT ? 'var(--acc2)' : past ? 'var(--txt3)' : 'var(--txt2)',
                      fontWeight: done ? 500 : 400, opacity: past && !done ? 0.5 : 1,
                    }}>
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── HabitsPage utama ─────────────────────────────────────────────────────────
export default function HabitsPage({ onAddHabit }) {
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

  const maxStreak   = habits.length ? Math.max(0, ...habits.map((h) => getStreak ? getStreak(h.id) : 0)) : 0
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
    <div className="page-root">
      <Topbar sub={format(new Date(), 'EEEE, d MMMM', { locale: localeId })} title="Habit tracker" />

      {loading && habits.length === 0 ? (
        <div className="page-scroll" style={{ padding:0 }}><SkeletonHabits /></div>
      ) : (
        <div className="page-scroll">
          {/* Stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14, marginBottom:10 }}>
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <Flame size={16} color="var(--gold)"/><span className="pill pill-gold">terpanjang</span>
              </div>
              <div style={{ fontSize:28, fontWeight:500 }}>{maxStreak}</div>
              <div style={{ fontSize:11, color:'var(--txt2)', marginTop:2 }}>Streak terpanjang</div>
              <div className="prog-track" style={{ marginTop:10 }}>
                <div className="prog-fill prog-gold" style={{ width:`${Math.min(100, maxStreak*8)}%` }}/>
              </div>
            </div>
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:15 }}>🎯</span><span className="pill pill-sage">hari ini</span>
              </div>
              <div style={{ fontSize:28, fontWeight:500 }}>{consistency}<span style={{ fontSize:16, color:'var(--txt2)' }}>%</span></div>
              <div style={{ fontSize:11, color:'var(--txt2)', marginTop:2 }}>Konsistensi</div>
              <div className="prog-track" style={{ marginTop:10 }}>
                <div className="prog-fill prog-sage" style={{ width:`${consistency}%` }}/>
              </div>
            </div>
          </div>

          {/* Circle Summary */}
          <div className="card" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
            <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
              <circle cx="34" cy="34" r="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
              <circle cx="34" cy="34" r="25" fill="none" stroke="var(--acc)" strokeWidth="6"
                strokeDasharray={`${circumf * consistency / 100} ${circumf * (1 - consistency/100)}`}
                strokeLinecap="round" transform="rotate(-90 34 34)"/>
              <text x="34" y="31" textAnchor="middle" fontSize="12" fontWeight="500" fill="#A4C794">{consistency}%</text>
              <text x="34" y="43" textAnchor="middle" fontSize="8" fill="#6B6F63">selesai</text>
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
            const streak = getStreak ? getStreak(h.id) : 0

            return (
              <div key={h.id} className="card" style={{ marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:40, height:40, borderRadius:12, background: isDone ? 'var(--acc-dim)' : 'var(--bg2)',
                    border: isDone ? '0.5px solid var(--acc3)' : '0.5px solid var(--bdr)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
                  }}>{h.icon || '🌿'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:500, color:'var(--txt)' }}>{h.name}</div>
                    <div style={{ fontSize:11, color:'var(--txt2)' }}>target {h.target_value} {h.target_unit}</div>
                  </div>
                  <button onClick={() => setConfirm(h.id)} style={{ color:'var(--txt3)', padding:4, background:'none', border:'none', cursor:'pointer' }}>
                    <Trash2 size={14}/>
                  </button>
                </div>

                {h.measure_type !== 'yesno' && (
                  <div style={{ marginTop:10 }}>
                    <div className="prog-track">
                      <div className="prog-fill prog-blue" style={{ width:`${progPct}%` }} />
                    </div>
                  </div>
                )}

                {isDone ? (
                  <div style={{ marginTop:10, color:'var(--acc2)', fontSize:12 }}>✓ Selesai hari ini</div>
                ) : (
                  <button onClick={() => setLogTarget(h)} style={{ marginTop:10, width:'100%', padding:'8px', background:'var(--bg2)', border:'0.5px solid var(--bdr)', borderRadius:'var(--r-md)', color:'var(--txt2)', cursor:'pointer' }}>
                    + Catat progress
                  </button>
                )}
                <WeekDots habitId={h.id}/>
                <button onClick={() => setSelected(h)} style={{ fontSize:11, color:'var(--acc)', marginTop:8, background:'none', border:'none', cursor:'pointer', display:'block', width:'100%', textAlign:'right' }}>
                  Lihat statistik →
                </button>
              </div>
            )
          })}
        </div>
      )}

      {logTarget && <LogModal habit={logTarget} onClose={() => setLogTarget(null)}/>}

      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:15, fontWeight:500, color:'var(--txt)' }}>Hapus habit ini?</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-outline" onClick={() => setConfirm(null)} style={{ flex:1 }}>Batal</button>
              <button onClick={() => handleDeactivate(habits.find(h => h.id === confirm))} style={{ flex:2, background:'var(--red-dim)', color:'var(--red)', border:'0.5px solid var(--red)', borderRadius:'var(--r-md)', cursor:'pointer' }}>Ya, hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}