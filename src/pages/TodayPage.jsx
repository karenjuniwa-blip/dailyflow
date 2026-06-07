import { useEffect } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Check, Flame, Trash2 } from 'lucide-react'
import { useAuthStore, useTaskStore, useHabitStore, useHabitLogStore } from '../store'
import Topbar from '../components/Topbar'
import { SkeletonToday } from '../components/Skeleton'
import { useToast } from '../components/Toast'

const CAT = {
  heavy:  { label:'Berat',  dot:'var(--red)',  dim:'var(--red-dim)',  text:'var(--red)'  },
  medium: { label:'Sedang', dot:'var(--gold)', dim:'var(--gold-dim)', text:'var(--gold)' },
  light:  { label:'Ringan', dot: 'var(--acc)',  dim:'var(--acc-dim)',  text:'var(--acc)'  },
}

export default function TodayPage() {
  const toast = useToast()
  const { user, signOut } = useAuthStore()
  const { tasks, loading: tLoading, fetchTasks, toggleTask, removeTask } = useTaskStore()
  const { habits, loading: hLoading, fetchHabits, gardenScore, getStreak } = useHabitStore()
  const { habitLogs, fetchHabitLogs, addHabitLog } = useHabitLogStore()

  const today     = format(new Date(), 'yyyy-MM-dd')
  const dateLabel = format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId })

  const greeting  = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Selamat pagi' : h < 17 ? 'Selamat siang' : 'Selamat malam'
  }

  useEffect(() => {
    if (user) { 
      fetchTasks(user.id)
      fetchHabits(user.id)
      fetchHabitLogs(user.id)
    }
  }, [user])

  // Menentukan tahap evolusi tanaman kebun berdasarkan poin gardenScore dari store
  const getGardenEvolution = (score) => {
    if (score < 30)  return { status: 'Benih Baru 🌱', icon: '🌱', desc: 'Kebun Anda baru saja ditanam, siram dengan menyelesaikan task!' };
    if (score < 70)  return { status: 'Tunas Sage 🌿', icon: '🌿', desc: 'Tanaman tumbuh subur berkat produktivitas konsisten Anda.' };
    if (score < 150) return { status: 'Kebun Rindang 🌳', icon: '🌳', desc: 'Luar biasa! Struktur fokus Anda membentuk hutan mini yang asri.' };
    return { status: 'Surga DayFlow 🌸', icon: '🌸', desc: 'Dewa Produktivitas! Kebun digital Anda kini berbunga penuh!' };
  }

  const garden = getGardenEvolution(gardenScore || 0);
  const todayTasks = tasks.filter((t) =>
    !t.scheduled_at || format(new Date(t.scheduled_at), 'yyyy-MM-dd') === today
  )

  const grouped = { heavy: [], medium: [], light: [] }
  todayTasks.forEach((t) => { if (grouped[t.category]) grouped[t.category].push(t) })

  const doneCount = todayTasks.filter((t) => t.is_done).length
  const pct       = todayTasks.length ? Math.round((doneCount / todayTasks.length) * 100) : 0
  const initials  = user?.email?.slice(0, 2).toUpperCase() || 'AN'

  const handleToggle = async (t) => {
    if(!user?.id) return
    await toggleTask(user.id, t.id, !t.is_done)
    if (!t.is_done) toast('Task selesai ✓', 'success')
  }

  const handleRemove = async (t) => {
    if(!user?.id) return
    await removeTask(user.id, t.id)
    toast('Task dihapus', 'info')
  }

  const handleLogHabit = async (h) => {
    if(!user?.id) return
    await addHabitLog(user.id, {
      habit_id: h.id,
      value: 1,
      logged_at: new Date().toISOString()
    })
    toast(`${h.name} ✓`, 'success')
  }

  return (
    <div className="page-root">
      <Topbar
        sub={dateLabel}
        title={`${greeting()} 👋`}
        right={
          <button onClick={signOut} title="Keluar" style={{
            width:36, height:36, borderRadius:'50%',
            background:'var(--acc-dim)', border:'0.5px solid var(--acc3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:500, color:'var(--acc2)', cursor:'pointer'
          }}>
            {initials}
          </button>
        }
      />
      
      {(tLoading || hLoading) && todayTasks.length === 0 ? (
        <div className="page-scroll" style={{ padding: 0 }}>
          <SkeletonToday />
        </div>
      ) : (
        <div className="page-scroll">

          {/* 🌿 KARTU INTEGRASI VISUAL GAMIFIKASI: GARDEN GROWTH */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, var(--bg2) 0%, var(--acc-dim) 100%)', 
            border: '1px solid var(--acc3)', 
            padding: 16, 
            marginTop: 14,
            marginBottom: 14, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16 
          }}>
            <div style={{ 
              fontSize: 36, 
              background: 'var(--bg1)', 
              width: 60, 
              height: 60, 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}>
              {garden.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--acc2)', letterSpacing: '0.5px' }}>LEVEL KEBUN DIGITAL</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt)', marginTop: 1 }}>{garden.status}</div>
              <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2, lineHeight: 1.3 }}>{garden.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--acc)', marginTop: 6 }}>Skor Kebun: {gardenScore || 0} XP</div>
            </div>
          </div>

          {/* PROGRESS TASK BAR */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'var(--txt2)' }}>
                <span style={{ color:'var(--acc2)', fontWeight:500 }}>{doneCount}</span> / {todayTasks.length} task selesai
              </span>
              <span style={{ fontSize:12, fontWeight:500, color:'var(--acc)' }}>{pct}%</span>
            </div>
            <div className="prog-track">
              <div className="prog-fill prog-sage" style={{ width: `${pct}%` }}/>
            </div>
          </div>

          {/* GRUP BEBAN KERJA TASK */}
          {['heavy','medium','light'].map((cat) => {
            const items = grouped[cat]
            if (!items.length) return null
            const { label, dot, dim, text } = CAT[cat]
            return (
              <div key={cat}>
                <div className="sec-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:dot, display:'inline-block' }}/>
                  Task {label}
                  <span style={{ background:dim, color:text, padding:'1px 7px', borderRadius:99, fontSize:11, fontWeight:500 }}>
                    {items.length}
                  </span>
                </div>
                <div className="card" style={{ padding:'4px 14px', marginBottom:8 }}>
                  {items.map((t, i) => (
                    <div key={t.id}>
                      {i > 0 && <div className="divider"/>}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0' }}>
                        <button
                          onClick={() => handleToggle(t)}
                          className={`check-btn ${t.is_done ? 'checked' : ''}`}
                          aria-label={t.is_done ? 'Batalkan' : 'Selesaikan'}
                          style={{ background:'none', cursor:'pointer' }}
                        >
                          {t.is_done && <Check size={13} color="#1A2217" strokeWidth={3}/>}
                        </button>
                        <span style={{
                          flex:1, fontSize:13, lineHeight:1.4,
                          color: t.is_done ? 'var(--txt3)' : 'var(--txt)',
                          textDecoration: t.is_done ? 'line-through' : 'none',
                        }}>
                          {t.title}
                        </span>
                        <button onClick={() => handleRemove(t)} style={{ color:'var(--txt3)', padding:4, flexShrink:0, background:'none', border:'none', cursor:'pointer' }}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {todayTasks.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0 20px', color:'var(--txt3)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🌿</div>
              <div style={{ fontSize:14, color:'var(--txt2)', marginBottom:4 }}>Belum ada task hari ini</div>
              <div style={{ fontSize:12 }}>Tap tombol + untuk menambahkan task</div>
            </div>
          )}

          {habits.length > 0 && (
            <>
              <div className="sec-label">Habit hari ini</div>
              <div className="card" style={{ padding:'4px 14px', marginBottom:8 }}>
                {habits.map((h, i) => {
                  const todayLogs = habitLogs.filter(log => log.habit_id === h.id && format(new Date(log.logged_at), 'yyyy-MM-dd') === today)
                  const progVal = todayLogs.reduce((sum, curr) => sum + curr.value, 0)
                  const isDone = h.measure_type === 'yesno' ? todayLogs.length > 0 : progVal >= h.target_value
                  const streak = getStreak ? getStreak(h.id) : 0
                  
                  return (
                    <div key={h.id}>
                      {i > 0 && <div className="divider"/>}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0' }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:'var(--acc-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
                          {h.icon || '🌿'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--txt)' }}>{h.name}</div>
                          {h.measure_type !== 'yesno' && (
                            <div style={{ fontSize:11, color:'var(--txt2)', marginTop:1 }}>
                              {progVal > 0 ? `${progVal} / ${h.target_value} ${h.target_unit}` : `Target: ${h.target_value} ${h.target_unit}`}
                            </div>
                          )}
                        </div>
                        {streak > 0 && (
                          <span style={{ display:'flex', alignItems:'center', gap:3, color:'var(--gold)', fontSize:11, fontWeight:500, background:'var(--gold-dim)', padding:'2px 7px', borderRadius:99, flexShrink:0 }}>
                            <Flame size={11}/>{streak}
                          </span>
                        )}
                        <button
                          onClick={() => h.measure_type === 'yesno' && !isDone && handleLogHabit(h)}
                          className={`check-btn circle ${isDone ? 'checked' : ''}`}
                          style={{ background:'none', cursor: isDone ? 'default' : 'pointer' }}
                          disabled={isDone}
                        >
                          {isDone && <Check size={14} color="#1A2217" strokeWidth={3}/>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}