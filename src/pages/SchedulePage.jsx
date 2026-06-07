import { useEffect, useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Trash2, Link } from 'lucide-react'
import { useAuthStore, useScheduleStore, useTaskStore } from '../store'
import Topbar from '../components/Topbar'
import AddModal from '../components/AddModal' // Impor AddModal di sini

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5)
const BLOCK_COLOR = {
  sage: { bg:'rgba(139,175,124,0.18)', border:'rgba(139,175,124,0.5)', text:'var(--acc2)' },
  teal: { bg:'rgba(93,202,165,0.15)',  border:'rgba(93,202,165,0.5)',  text:'var(--teal)' },
  gold: { bg:'rgba(201,169,110,0.15)', border:'rgba(201,169,110,0.5)', text:'var(--gold)' },
  red:  { bg:'rgba(212,115,106,0.15)', border:'rgba(212,115,106,0.5)', text:'var(--red)'  },
  blue: { bg:'rgba(122,172,204,0.15)', border:'rgba(122,172,204,0.5)', text:'var(--blue)' },
}

export default function SchedulePage() {
  const { user } = useAuthStore()
  const { schedules, fetchSchedules, removeSchedule } = useScheduleStore()
  const { tasks, toggleTask } = useTaskStore()
  
  const [date, setDate] = useState(new Date())
  // State baru untuk kontrol modal mandiri dari timeline jam
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState('09:00')
  
  const dateStr = format(date, 'yyyy-MM-dd')
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
  const dateLabel = format(date, 'EEEE, d MMM', { locale: localeId })

  useEffect(() => {
    if (user) fetchSchedules(user.id)
  }, [user, dateStr])

  const daySchedules = schedules.filter(b => b.date === dateStr)

  // Fungsi saat baris jam kosong diklik
  const handleHourClick = (hourNum) => {
    const formattedHour = String(hourNum).padStart(2, '0') + ':00'
    setSelectedHour(formattedHour)
    setIsAddModalOpen(true)
  }

  return (
    <div className="page-root">
      <Topbar 
        sub="Timeline & Sinkronisasi Task" 
        title={dateLabel} 
        right={
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={() => setDate((d) => subDays(d, 1))} style={{ color:'var(--txt2)', padding:6, background:'none', border:'none', cursor:'pointer' }}>
              <ChevronLeft size={20}/>
            </button>
            {!isToday && (
              <button
                onClick={() => setDate(new Date())}
                style={{
                  fontSize:11, color:'var(--acc)', padding:'4px 10px',
                  background:'var(--acc-dim)', borderRadius:99, border:'none', cursor:'pointer'
                }}
              >
                Hari ini
              </button>
            )}
            <button onClick={() => setDate((d) => addDays(d, 1))} style={{ color:'var(--txt2)', padding:6, background:'none', border:'none', cursor:'pointer' }}>
              <ChevronRight size={20}/>
            </button>
          </div>
        }
      />
      <div className="page-scroll">
        <div style={{ paddingTop: 8, paddingBottom: 20 }}>
          {HOURS.map((h) => {
            const hBlocks = daySchedules.filter((b) => {
              const [sh] = b.start_time.split(':').map(Number)
              return sh === h
            })

            return (
              <div key={h} style={{ display: 'flex', gap: 10, minHeight: 64 }}>
                {/* Label jam kiri */}
                <div style={{ width: 42, fontSize: 11, color: 'var(--txt3)', paddingTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {String(h).padStart(2,'0')}:00
                </div>
                
                {/* Area konten timeline kanan */}
                <div 
                  onClick={() => hBlocks.length === 0 && handleHourClick(h)} // Hanya buka modal jika slot jam kosong
                  style={{ 
                    flex: 1, 
                    position: 'relative', 
                    cursor: hBlocks.length === 0 ? 'pointer' : 'default',
                    transition: 'background-color 0.2s'
                  }}
                  className={hBlocks.length === 0 ? "timeline-slot-empty" : ""}
                >
                  <div style={{ height: '0.5px', background: 'var(--bdr)', marginBottom: 6 }} />
                  
                  {hBlocks.map((b) => {
                    const c = BLOCK_COLOR[b.color] || BLOCK_COLOR.sage
                    const linkedTask = tasks.find(t => t.id === b.task_id);

                    return (
                      <div 
                        key={b.id} 
                        onClick={(e) => e.stopPropagation()} // Mencegah modal terbuka saat mengklik isi jadwal eksis
                        style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--r-md)', padding: 10, marginBottom: 6 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{b.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--txt2)' }}>{b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}</div>
                          </div>
                          <button onClick={() => removeSchedule(user.id, b.id)} style={{ background:'none', border:'none', color:'var(--txt3)', cursor:'pointer' }}><Trash2 size={13}/></button>
                        </div>

                        {linkedTask && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 6, borderTop: '0.5px dashed var(--bdr)', fontSize: 12 }}>
                            <input 
                              type="checkbox" 
                              checked={linkedTask.is_done} 
                              onChange={() => toggleTask(user.id, linkedTask.id, !linkedTask.is_done)} 
                              style={{ cursor:'pointer' }}
                            />
                            <span style={{ color: linkedTask.is_done ? 'var(--txt3)' : 'var(--txt)', textDecoration: linkedTask.is_done ? 'line-through' : 'none' }}>
                              🎯 Terikat Task: {linkedTask.title}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* TAMPILKAN MODAL SECARA DINAMIS DENGAN SETTING JAM AWAL */}
      {isAddModalOpen && (
        <AddModal 
          onClose={() => setIsAddModalOpen(false)} 
          defaultTab="block" 
          initialHour={selectedHour} // Lempar jam yang diklik ke AddModal
          initialDate={dateStr}      // Lempar tanggal aktif ke AddModal
        />
      )}

      {/* Tambahan style CSS opsional untuk efek hover baris kosong */}
      <style>{`
        .timeline-slot-empty:hover {
          background-color: rgba(255, 255, 255, 0.02);
          border-radius: var(--r-md);
        }
      `}</style>
    </div>
  )
}