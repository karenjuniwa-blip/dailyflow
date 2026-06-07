import { useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CheckCircle, Flame, TrendingUp } from 'lucide-react'
import { useAuthStore, useTaskStore, useHabitStore, useHabitLogStore } from '../store'
import Topbar from '../components/Topbar'

const DAYS_S = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

export default function ReviewPage() {
  const { user } = useAuthStore()
  const { tasks, fetchTasks } = useTaskStore()
  const { habits, fetchHabits } = useHabitStore()
  const { habitLogs, fetchHabitLogs } = useHabitLogStore()

  useEffect(() => {
    if (user) { 
      fetchTasks(user.id)
      fetchHabits(user.id)
      fetchHabitLogs(user.id)
    }
  }, [user])

  // Data 7 hari terakhir
  const last7 = Array.from({ length:7 }, (_, i) => {
    const d       = subDays(new Date(), 6 - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const dayT    = tasks.filter((t) => t.scheduled_at && format(new Date(t.scheduled_at), 'yyyy-MM-dd') === dateStr)
    const doneT   = dayT.filter((t) => t.is_done).length
    
    // Cari jumlah habit unik yang selesai di tanggal ini
    const doneH   = habits.filter((h) => habitLogs.some(log => log.habit_id === h.id && format(new Date(log.logged_at), 'yyyy-MM-dd') === dateStr)).length
    return { d, dateStr, doneT, totalT: dayT.length, doneH }
  })

  const totalDone   = tasks.filter((t) => t.is_done).length
  const totalTasks  = tasks.length
  const compRate    = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0
  const maxBar      = Math.max(...last7.map((d) => d.doneT + d.doneH), 1)
  
  const bestDay = last7.reduce((b, c) => 
    (c.doneT + c.doneH) > (b.doneT + b.doneH) ? c : b, last7[0])
  
  const maxStreak = habits.length ? Math.max(0, ...habits.map((h) => {
    let s = 0; const d = new Date()
    let checkDate = format(d,'yyyy-MM-dd')
    while (habitLogs.some(log => log.habit_id === h.id && format(new Date(log.logged_at), 'yyyy-MM-dd') === checkDate)) { 
      s++
      d.setDate(d.getDate()-1) 
      checkDate = format(d,'yyyy-MM-dd')
    }
    return s
  })) : 0

  // Kategori beban kerja
  const heavy  = tasks.filter((t) => t.category==='heavy'  && t.is_done).length
  const medium = tasks.filter((t) => t.category==='medium' && t.is_done).length
  const light  = tasks.filter((t) => t.category==='light'  && t.is_done).length
  const catTot = heavy + medium + light || 1

  const rangeLabel = 
    format(subDays(new Date(), 6), 'd MMM') + ' — ' + 
    format(new Date(), 'd MMM yyyy')

  return (
    <div className="page-root">
      <Topbar sub={rangeLabel} title="Weekly Review" />
      <div className="page-scroll">
        
        {/* Stat boxes 2×2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14, marginBottom:10 }}>
          {[
            { icon:<CheckCircle size={15} color="var(--acc)"/>,  num:totalDone, lbl:'Task selesai', tag:'minggu ini', cls:'pill-sage' },
            { icon:<TrendingUp  size={15} color="var(--gold)"/>, num:`${compRate}%`, lbl:'Completion rate', tag:'total', cls:'pill-gold' },
            { icon:<span>🏆</span>, num:bestDay ? DAYS_S[bestDay.d.getDay()]:'—', lbl:'Hari terbaik', tag:'minggu ini', cls:'pill-sage' },
            { icon:<Flame size={15} color="var(--gold)"/>, num:maxStreak, lbl:'Streak habit', tag:'hari', cls:'pill-gold' },
          ].map(({ icon, num, lbl, tag, cls }) => (
            <div key={lbl} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                {icon}
                <span className={`pill ${cls}`}>{tag}</span>
              </div>
              <div style={{ fontSize:28, fontWeight:500 }}>{num}</div>
              <div style={{ fontSize:11, color:'var(--txt2)', marginTop:2 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Bar chart 7 hari */}
        <div className="card" style={{ marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--txt)', marginBottom:14 }}>Aktivitas 7 hari terakhir</div>
          <div style={{ display:'flex', gap:6, height:96, alignItems:'flex-end' }}>
            {last7.map(({ d, doneT, doneH }) => {
              const total = doneT + doneH
              const isT   = format(d,'yyyy-MM-dd') === format(new Date(),'yyyy-MM-dd')
              return (
                <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', height:80, justifyContent:'flex-end', gap:1 }}>
                    {doneH > 0 && <div style={{ width:'100%', height:Math.max(3, Math.round((doneH/maxBar)*70)), background:'rgba(139,175,124,0.28)', borderRadius:'3px 3px 0 0' }}/>}
                    {doneT > 0 && <div style={{ width:'100%', height:Math.max(3, Math.round((doneT/maxBar)*70)), background: isT ? 'var(--acc)' : 'rgba(139,175,124,0.6)', borderRadius: doneH>0 ? 0 : '3px 3px 0 0' }}/>}
                    {total===0 && <div style={{ width:'100%', height:3, background:'var(--bg3)', borderRadius:99 }}/>}
                  </div>
                  <span style={{ fontSize:10, color: isT ? 'var(--acc)' : 'var(--txt3)', fontWeight: isT ? 500 : 400 }}>{DAYS_S[d.getDay()]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Distribusi task per kategori */}
        <div className="card" style={{ marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--txt)', marginBottom:12 }}>Distribusi task selesai</div>
          {[
            { label:'Berat',  count:heavy,  color:'var(--red)',  pct:Math.round((heavy/catTot)*100)  },
            { label:'Sedang', count:medium, color:'var(--gold)', pct:Math.round((medium/catTot)*100) },
            { label:'Ringan', count:light,  color:'var(--acc)',  pct:Math.round((light/catTot)*100)  },
          ].map(({ label, count, color, pct }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'var(--txt2)', width:46 }}>{label}</span>
              <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99 }}/>
              </div>
              <span style={{ fontSize:12, color:'var(--txt2)', width:24, textAlign:'right' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}