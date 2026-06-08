import { useEffect, useState } from 'react'
import { format, getDaysInMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Plus, Trash2 } from 'lucide-react'
import { useAuthStore, useHabitStore, useHabitLogStore } from '../store'
import Topbar from '../components/Topbar'
import LogModal from '../components/LogModal'
import { useToast } from '../components/Toast'
import { SkeletonHabits } from '../components/Skeleton'

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const MONTHS_S = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const DAY_LABELS = ['S','S','R','K','J','S','M']

const todayStr = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

const days7 = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStreak(habitId, logs) {
  const days = new Set(logs.filter(l => l.habit_id === habitId).map(l => l.logged_at))
  let streak = 0
  const d = new Date()
  while (true) {
    const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
    if (days.has(k)) { streak++; d.setDate(d.getDate() - 1) }
    else break
  }
  return streak
}

function getBestStreak(habitId, logs) {
  const days = [...new Set(logs.filter(l => l.habit_id === habitId).map(l => l.logged_at))].sort()
  let best = 0, cur = 0, prev = null
  for (const d of days) {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / (1000 * 86400)
      cur = diff === 1 ? cur + 1 : 1
    } else cur = 1
    if (cur > best) best = cur
    prev = d
  }
  return best
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconChevLeft  = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
const IconChevRight = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
const IconBack      = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
const IconPlus      = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>
const IconTrash     = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IconCheck     = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>

// ─── WeekDots ─────────────────────────────────────────────────────────────────
function WeekDots({ habitId, logs }) {
  const week = days7()
  const today = todayStr()
  return (
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'0.5px solid var(--bdr)' }}>
      {week.map((key, i) => {
        const done = logs.some(l => l.habit_id === habitId && l.logged_at === key)
        const isT = key === today
        const d = new Date(key)
        return (
          <div key={i} style={{
            width:32, height:32, borderRadius:'50%',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            background: done ? 'var(--acc)' : isT ? 'var(--acc-dim)' : 'rgba(255,255,255,0.04)',
            border: isT && !done ? '1.5px solid var(--acc3)' : 'none',
          }}>
            <span style={{ fontSize:10, fontWeight:500, color: done ? '#1A2217' : isT ? 'var(--acc2)' : 'var(--txt3)' }}>
              {DAY_LABELS[i]}
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

// ─── LogModal ─────────────────────────────────────────────────────────────────
function LogModal({ habit, onClose, onSave }) {
  const [val, setVal] = useState('')
  const inputRef = useRef()
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200) }, [])

  const save = () => {
    if (habit.measure_type === 'yesno') {
      onSave(habit, 1); onClose()
    } else {
      const n = parseFloat(val)
      if (!isNaN(n) && n > 0) { onSave(habit, n); onClose() }
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', zIndex:100 }} onClick={onClose}>
      <div style={{ background:'var(--bg2)', borderRadius:'18px 18px 0 0', padding:'20px 16px 40px', width:'100%', maxWidth:430, margin:'0 auto', border:'0.5px solid var(--bdr2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:28, marginBottom:4 }}>{habit.icon}</div>
          <div style={{ fontSize:15, fontWeight:500, color:'var(--txt)' }}>{habit.name}</div>
        </div>
        {habit.measure_type === 'yesno'
          ? <div style={{ color:'var(--txt2)', textAlign:'center', fontSize:13, marginBottom:16 }}>Tandai habit ini selesai hari ini?</div>
          : <div>
              <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:8, textAlign:'center' }}>Masukkan jumlah ({habit.target_unit})</div>
              <input
                ref={inputRef}
                type="number"
                placeholder={`Target: ${habit.target_value}`}
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                style={{ background:'var(--bg3)', border:'0.5px solid var(--bdr2)', borderRadius:'var(--r-md)', color:'var(--txt)', fontSize:20, padding:'10px 14px', width:'100%', outline:'none', textAlign:'center' }}
              />
            </div>
        }
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:10, background:'transparent', border:'0.5px solid var(--bdr2)', borderRadius:'var(--r-md)', color:'var(--txt2)', cursor:'pointer' }}>Batal</button>
          <button onClick={save} style={{ flex:2, padding:10, background:'var(--acc)', border:'none', borderRadius:'var(--r-md)', color:'#1A2217', fontWeight:500, cursor:'pointer' }}>
            {habit.measure_type === 'yesno' ? '✓ Tandai Selesai' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({ habitName, onConfirm, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', zIndex:100 }} onClick={onClose}>
      <div style={{ background:'var(--bg2)', borderRadius:'18px 18px 0 0', padding:'20px 16px 40px', width:'100%', maxWidth:430, margin:'0 auto', border:'0.5px solid var(--bdr2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ fontSize:15, fontWeight:500, color:'var(--txt)' }}>Hapus "{habitName}"?</div>
          <div style={{ fontSize:12, color:'var(--txt2)', marginTop:4 }}>Semua data progress akan hilang</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:10, background:'transparent', border:'0.5px solid var(--bdr2)', borderRadius:'var(--r-md)', color:'var(--txt2)', cursor:'pointer' }}>Batal</button>
          <button onClick={onConfirm} style={{ flex:2, padding:10, background:'var(--red-dim)', border:'0.5px solid var(--red)', borderRadius:'var(--r-md)', color:'var(--red)', cursor:'pointer' }}>Ya, hapus</button>
        </div>
      </div>
    </div>
  )
}

// ─── StatDetail ───────────────────────────────────────────────────────────────
function StatDetail({ habit, logs, onBack }) {
  const [tab, setTab] = useState('stat')
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [chartYear, setChartYear] = useState(new Date().getFullYear())

  const hLogs = logs.filter(l => l.habit_id === habit.id)
  const streak = getStreak(habit.id, logs)
  const best = getBestStreak(habit.id, logs)

  const countInRange = (days) => {
    let c = 0
    const d = new Date()
    for (let i = 0; i < days; i++) {
      const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
      if (hLogs.some(l => l.logged_at === k)) c++
      d.setDate(d.getDate() - 1)
    }
    return c
  }

  const monthData = Array.from({ length: 12 }, (_, m) => {
    const s = new Set(hLogs.filter(l => {
      const ld = new Date(l.logged_at)
      return ld.getFullYear() === chartYear && ld.getMonth() === m
    }).map(l => l.logged_at))
    return s.size
  })
  const maxBar = Math.max(...monthData, 1)

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDay = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
  const daysInMon = getDaysInMonth(calYear, calMonth)
  const todayDay = calYear === new Date().getFullYear() && calMonth === new Date().getMonth() ? new Date().getDate() : null
  const prevCal = () => calMonth === 0 ? (setCalMonth(11), setCalYear(y => y-1)) : setCalMonth(m => m-1)
  const nextCal = () => calMonth === 11 ? (setCalMonth(0), setCalYear(y => y+1)) : setCalMonth(m => m+1)

  return (
    <div className="page-root anim-slide-right">
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <button onClick={onBack} style={{ color:'var(--txt2)', flexShrink:0, background:'none', border:'none', cursor:'pointer' }}>
            <IconBack/>
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:500, color:'var(--txt)' }}>{habit.icon} {habit.name}</div>
            <div style={{ fontSize:12, color:'var(--txt2)', marginTop:1 }}>
              {habit.frequency === 'daily' ? 'Setiap hari' : `${habit.freq_days}x per minggu`}
              {' · '}
              {habit.measure_type === 'yesno' ? 'Ya / Tidak' : `Target ${habit.target_value} ${habit.target_unit}`}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', borderBottom:'0.5px solid var(--bdr)' }}>
          {[{ id:'stat', label:'Statistik' }, { id:'cal', label:'Kalender' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:'9px 0', fontSize:13, textAlign:'center',
              color: tab === t.id ? 'var(--acc)' : 'var(--txt2)',
              fontWeight: tab === t.id ? 500 : 400,
              background:'none', border:'none', cursor:'pointer',
              borderBottom: tab === t.id ? '2px solid var(--acc)' : '2px solid transparent',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-scroll">
        {tab === 'stat' && <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14, marginBottom:10 }}>
            {[
              { num:streak, label:'Streak saat ini', tag:'berjalan', cls:'pill-sage' },
              { num:best,   label:'Streak terbaik',  tag:'rekor',   cls:'pill-gold' },
            ].map(({ num, label, tag, cls }) => (
              <div key={label} className="card" style={{ textAlign:'center', padding:'18px 12px' }}>
                <div style={{ fontSize:36, fontWeight:500, lineHeight:1, marginBottom:6 }}>{num}</div>
                <div style={{ fontSize:11, color:'var(--txt2)', marginBottom:10 }}>{label}</div>
                <span className={`pill ${cls}`}>{tag}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding:'4px 14px', marginBottom:10 }}>
            {[
              { label:'Minggu ini',  val: countInRange(7)   },
              { label:'Bulan ini',   val: countInRange(30)  },
              { label:'Tahun ini',   val: countInRange(365) },
              { label:'Semua waktu', val: new Set(hLogs.map(l => l.logged_at)).size },
            ].map(({ label, val }, i) => (
              <div key={label}>
                {i > 0 && <div className="divider"/>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0' }}>
                  <span style={{ fontSize:13, color:'var(--txt2)' }}>{label}</span>
                  <span style={{ fontSize:20, fontWeight:500 }}>{val}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>Performa per bulan</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => setChartYear(y => y-1)} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}><IconChevLeft/></button>
                <span style={{ fontSize:12, minWidth:36, textAlign:'center' }}>{chartYear}</span>
                <button onClick={() => setChartYear(y => Math.min(y+1, new Date().getFullYear()))} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}><IconChevRight/></button>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:96 }}>
              {monthData.map((val, m) => {
                const isCur = m === new Date().getMonth() && chartYear === new Date().getFullYear()
                const barH = Math.max(3, Math.round((val / maxBar) * 78))
                return (
                  <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ width:'100%', height:barH, background: isCur ? 'var(--acc)' : 'rgba(139,175,124,0.25)', borderRadius:'3px 3px 0 0', position:'relative' }}>
                      {val > 0 && isCur && (
                        <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', fontSize:9, color:'var(--acc)', whiteSpace:'nowrap' }}>{val}</div>
                      )}
                    </div>
                    <span style={{ fontSize:9, color: isCur ? 'var(--acc)' : 'var(--txt3)' }}>{MONTHS_S[m][0]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>}

        {tab === 'cal' && (
          <div className="card" style={{ marginTop:14, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <button onClick={prevCal} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}><IconChevLeft/></button>
              <span style={{ fontSize:14, fontWeight:500 }}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={nextCal} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}><IconChevRight/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`}/>)}
              {Array.from({ length: daysInMon }, (_, i) => {
                const day = i + 1
                const key = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(day).padStart(2,'0')
                const dayLogs = hLogs.filter(l => l.logged_at === key)
                const done = dayLogs.length > 0
                const logVal = dayLogs.reduce((s, l) => s + l.value, 0)
                const partial = done && habit.measure_type !== 'yesno' && logVal < habit.target_value
                const isT = day === todayDay
                const past = !done && day < (todayDay || 999)
                return (
                  <div key={day} style={{
                    aspectRatio:'1', borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
                    background: done && !partial ? 'var(--acc)' : partial ? 'rgba(139,175,124,0.35)' : isT ? 'var(--acc-dim)' : past ? 'rgba(255,255,255,0.03)' : 'transparent',
                    border: isT ? '1.5px solid var(--acc3)' : 'none',
                    color: done && !partial ? '#1A2217' : isT ? 'var(--acc2)' : past ? 'var(--txt3)' : 'var(--txt2)',
                    fontWeight: done ? 500 : 400,
                    opacity: past && !done ? 0.5 : 1,
                  }}>
                    {day}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HabitsPage utama ─────────────────────────────────────────────────────────
export default function HabitsPage({ onAddHabit, user, habits, habitLogs, fetchHabits, fetchHabitLogs, removeHabit, loading }) {
  // Local logs state untuk update reaktif tanpa menunggu refetch
  const [localLogs, setLocalLogs] = useState(habitLogs || [])
  const [selected, setSelected] = useState(null)
  const [logTarget, setLogTarget] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const td = todayStr()

  // Sync ketika habitLogs dari store berubah (saat fetch pertama kali)
  useEffect(() => { setLocalLogs(habitLogs || []) }, [habitLogs])

  useEffect(() => {
    if (user) {
      fetchHabits?.(user.id)
      fetchHabitLogs?.(user.id)
    }
  }, [user])

  // ── Handler: catat progress ──────────────────────────────────────────────
  const handleSave = async (habit, value) => {
    const newLog = {
      id: 'local_' + Date.now(),
      habit_id: habit.id,
      logged_at: td,
      value,
    }
    // Update lokal dulu agar UI langsung responsif
    setLocalLogs(prev => [...prev, newLog])

    // Kemudian simpan ke backend jika ada store
    // Jika kamu punya useHabitLogStore().addLog, panggil di sini:
    // try { await addLog(user.id, habit.id, value) } catch {}
  }

  // ── Handler: hapus habit ─────────────────────────────────────────────────
  const handleDeactivate = async (h) => {
    await removeHabit?.(user.id, h.id)
    setLocalLogs(prev => prev.filter(l => l.habit_id !== h.id))
    setConfirm(null)
  }

  // ── Computed stats ───────────────────────────────────────────────────────
  const todayLogs = localLogs.filter(l => l.logged_at === td)
  const doneToday = habits.filter(h => todayLogs.some(l => l.habit_id === h.id)).length
  const consistency = habits.length ? Math.round((doneToday / habits.length) * 100) : 0
  const maxStreak = habits.length ? Math.max(0, ...habits.map(h => getStreak(h.id, localLogs))) : 0
  const circumf = 2 * Math.PI * 25

  if (selected) return <StatDetail habit={selected} logs={localLogs} onBack={() => setSelected(null)} />

  return (
    <div className="page-root" style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden' }}>
      {/* Topbar */}
      <div className="topbar" style={{ flexShrink:0, padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:11, color:'var(--txt2)', marginBottom:2 }}>
              {new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' })}
            </div>
            <div style={{ fontSize:20, fontWeight:500 }}>Habit Tracker</div>
          </div>
          <button
            onClick={onAddHabit}
            style={{ background:'var(--acc)', border:'none', borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#1A2217' }}
          >
            <IconPlus/>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="page-scroll" style={{ flex:1, overflowY:'auto', padding:'0 16px 80px', WebkitOverflowScrolling:'touch' }}>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14, marginBottom:10 }}>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:16 }}>🔥</span>
              <span className="pill pill-gold">terpanjang</span>
            </div>
            <div style={{ fontSize:28, fontWeight:500 }}>{maxStreak}</div>
            <div style={{ fontSize:11, color:'var(--txt2)', marginTop:2 }}>Streak terpanjang</div>
            <div className="prog-track" style={{ marginTop:10 }}>
              <div className="prog-fill prog-gold" style={{ width:`${Math.min(100, maxStreak * 10)}%`, transition:'width .4s' }}/>
            </div>
          </div>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:16 }}>🎯</span>
              <span className="pill pill-sage">hari ini</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
              <span style={{ fontSize:28, fontWeight:500 }}>{consistency}</span>
              <span style={{ fontSize:14, color:'var(--txt2)' }}>%</span>
            </div>
            <div style={{ fontSize:11, color:'var(--txt2)', marginTop:2 }}>Konsistensi</div>
            <div className="prog-track" style={{ marginTop:10 }}>
              <div className="prog-fill prog-sage" style={{ width:`${consistency}%`, transition:'width .4s' }}/>
            </div>
          </div>
        </div>

        {/* Circle summary */}
        <div className="card" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
          <svg width={68} height={68} viewBox="0 0 68 68" aria-hidden="true">
            <circle cx={34} cy={34} r={25} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}/>
            <circle cx={34} cy={34} r={25} fill="none" stroke="var(--acc)" strokeWidth={6}
              strokeDasharray={`${circumf * consistency / 100} ${circumf * (1 - consistency / 100)}`}
              strokeLinecap="round" transform="rotate(-90 34 34)"
              style={{ transition:'stroke-dasharray .5s ease' }}
            />
            <text x={34} y={31} textAnchor="middle" fontSize={12} fontWeight={500} fill="#A4C794">{consistency}%</text>
            <text x={34} y={43} textAnchor="middle" fontSize={8} fill="#6B6F63">selesai</text>
          </svg>
          <div>
            <div style={{ fontSize:24, fontWeight:500 }}>{doneToday} / {habits.length}</div>
            <div style={{ fontSize:12, color:'var(--txt2)', marginTop:2 }}>Habit selesai hari ini</div>
          </div>
        </div>

        {/* Habit list */}
        {loading && habits.length === 0 ? (
          <div style={{ color:'var(--txt2)', textAlign:'center', padding:32 }}>Memuat...</div>
        ) : (
          habits.map(h => {
            const hTodayLogs = localLogs.filter(l => l.habit_id === h.id && l.logged_at === td)
            const progVal = hTodayLogs.reduce((s, l) => s + l.value, 0)
            const isDone = h.measure_type === 'yesno' ? hTodayLogs.length > 0 : progVal >= h.target_value
            const progPct = h.measure_type !== 'yesno' ? Math.min(100, Math.round((progVal / h.target_value) * 100)) : 0
            const streak = getStreak(h.id, localLogs)

            return (
              <div key={h.id} className="card" style={{ marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:42, height:42, borderRadius:12,
                    background: isDone ? 'var(--acc-dim)' : 'var(--bg2)',
                    border: `0.5px solid ${isDone ? 'var(--acc3)' : 'var(--bdr)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20, flexShrink:0, transition:'background .3s',
                  }}>
                    {h.icon || '🌿'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:500 }}>{h.name}</div>
                    <div style={{ fontSize:11, color:'var(--txt2)' }}>
                      {h.measure_type === 'yesno'
                        ? 'Ya / Tidak'
                        : `${progVal} / ${h.target_value} ${h.target_unit}`}
                      {streak > 0 && <span style={{ marginLeft:6, color:'var(--gold)', fontSize:10 }}>🔥 {streak}</span>}
                    </div>
                  </div>
                  <button onClick={() => setConfirm(h.id)} style={{ color:'var(--txt3)', padding:4, background:'none', border:'none', cursor:'pointer' }}>
                    <IconTrash/>
                  </button>
                </div>

                {h.measure_type !== 'yesno' && (
                  <div style={{ marginTop:10 }}>
                    <div className="prog-track">
                      <div className="prog-fill prog-blue" style={{ width:`${progPct}%`, transition:'width .4s ease' }}/>
                    </div>
                  </div>
                )}

                {isDone
                  ? <div style={{ color:'var(--acc2)', fontSize:12, marginTop:10, display:'flex', alignItems:'center', gap:4 }}><IconCheck/> Selesai hari ini</div>
                  : <button onClick={() => setLogTarget(h)} style={{ marginTop:10, width:'100%', padding:'8px', background:'var(--bg2)', border:'0.5px solid var(--bdr)', borderRadius:'var(--r-md)', color:'var(--txt2)', cursor:'pointer' }}>
                      + Catat progress
                    </button>
                }

                <WeekDots habitId={h.id} logs={localLogs}/>
                <button onClick={() => setSelected(h)} style={{ fontSize:11, color:'var(--acc)', marginTop:8, background:'none', border:'none', cursor:'pointer', display:'block', width:'100%', textAlign:'right' }}>
                  Lihat statistik →
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Modals */}
      {logTarget && <LogModal habit={logTarget} onClose={() => setLogTarget(null)} onSave={handleSave}/>}
      {confirm && (
        <ConfirmModal
          habitName={habits.find(h => h.id === confirm)?.name}
          onConfirm={() => handleDeactivate(habits.find(h => h.id === confirm))}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}