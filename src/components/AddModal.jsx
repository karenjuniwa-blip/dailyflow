import { useState } from 'react'
import { X, ChevronLeft, Link } from 'lucide-react'
import { useAuthStore, useTaskStore, useHabitStore, useScheduleStore } from '../store'
import { useToast } from './Toast'
import { format } from 'date-fns'

const ICONS = ['🏃','📚','💧','🌙','🏋️','🍎','🧠','✍️','🎵','🧘','💊','🚶','🌿','☕','🎯','🧹']
const UNITS = {
  count:    ['halaman','kali','langkah','set'],
  duration: ['menit','jam'],
  volume:   ['ml','liter','gelas'],
}

export default function AddModal({ onClose, defaultTab = 'task', initialHour = null, initialDate = null }) {
  const { user }                  = useAuthStore()
  const { tasks, addTask }        = useTaskStore()
  const { addHabit }              = useHabitStore()
  const { addSchedule: addBlock } = useScheduleStore() // Di-alias menjadi addBlock agar tidak merubah kode UI di bawah
  const toast                     = useToast()

  const [tab,    setTab]    = useState(defaultTab)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // ── Task States
  const [taskTitle, setTaskTitle] = useState('')
  const [taskCat,   setTaskCat]   = useState('medium')
  const [taskDate,  setTaskDate]  = useState(format(new Date(), 'yyyy-MM-dd'))

  // ── Habit wizard States
  const [hStep,     setHStep]     = useState(1)
  const [hName,     setHName]     = useState('')
  const [hIcon,     setHIcon]     = useState('🌿')
  const [hType,     setHType]     = useState('yesno')
  const [hTarget,   setHTarget]   = useState(20)
  const [hUnit,     setHUnit]     = useState('halaman')
  const [hFreq,     setHFreq]     = useState('daily')
  const [hFreqDays, setHFreqDays] = useState(5)

  // ── Jadwal / Block States (Mendukung Lemparan Jam Dinamis & Sinkronisasi ke Task)
  const [bTitle, setBTitle] = useState('')
  const [bDate,  setBDate]  = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
  const [bStart, setBStart] = useState(initialHour ? initialHour.slice(0, 5) : '09:00')
  
  // Menghitung otomatis waktu selesai +1 jam dari baris waktu yang diklik
  const calculateEndTime = (startTime) => {
    if (!startTime) return '10:00'
    const [h, m] = startTime.split(':').map(Number)
    const nextHour = String(h === 23 ? 23 : h + 1).padStart(2, '0')
    const minutes = String(m).padStart(2, '0')
    return `${nextHour}:${minutes}`
  }
  const [bEnd,   setBEnd]   = useState(initialHour ? calculateEndTime(initialHour) : '10:00')
  const [bColor, setBColor] = useState('sage')
  const [linkedTaskId, setLinkedTaskId] = useState('') // Menampung relasi ID Task yang dipilih

  // ─────────────── HELPERS ────────────────────────────────────────────────────
  const selectType = (t) => {
    setHType(t)
    if (t === 'volume')        { setHTarget(2000); setHUnit('ml') }
    else if (t === 'duration') { setHTarget(30);   setHUnit('menit') }
    else if (t === 'count')    { setHTarget(20);   setHUnit('halaman') }
  }

  const changeTab = (t) => { setTab(t); setError(''); setHStep(1) }

  // ─────────────── SAVE HANDLERS ──────────────────────────────────────────────
  const saveTask = async () => {
    if (!taskTitle.trim()) { setError('Nama task tidak boleh kosong.'); return }
    if (!user?.id) { setError('User tidak terautentikasi.'); return }
    setSaving(true); setError('')
    try {
      await addTask(user.id, {
        title:        taskTitle.trim(),
        category:     taskCat,
        scheduled_at: taskDate ? `${taskDate}T00:00:00` : null,
      })
      toast('Task berhasil ditambahkan ✓', 'success')
      onClose()
    } catch (e) {
      setError(e.message || 'Gagal menyimpan, coba lagi.')
    } finally { setSaving(false) }
  }

  const saveHabit = async () => {
    if (!hName.trim()) { setError('Nama habit tidak boleh kosong.'); return }
    if (!user?.id) { setError('User tidak terautentikasi.'); return }
    setSaving(true); setError('')
    try {
      await addHabit(user.id, {
        name:         hName.trim(),
        icon:         hIcon,
        measure_type: hType,
        target_value: hType !== 'yesno' ? hTarget : 1,
        target_unit:  hType !== 'yesno' ? hUnit   : '',
        frequency:    hFreq,
        freq_days:    hFreq === 'weekly' ? hFreqDays : 7,
      })
      toast(`Habit "${hName.trim()}" berhasil ditambahkan ✓`, 'success')
      onClose()
    } catch (e) {
      setError(e.message || 'Gagal menyimpan, coba lagi.')
    } finally { setSaving(false) }
  }

  const saveBlock = async () => {
    if (!bTitle.trim())  { setError('Nama kegiatan tidak boleh kosong.'); return }
    if (bStart >= bEnd)  { setError('Waktu selesai harus setelah waktu mulai.'); return }
    if (!user?.id) { setError('User tidak terautentikasi.'); return }
    setSaving(true); setError('')
    try {
      await addBlock(user.id, {
        title:      bTitle.trim(),
        date:       bDate,
        start_time: `${bStart}:00`,
        end_time:   `${bEnd}:00`,
        color:      bColor,
        task_id:    linkedTaskId || null // Menyimpan relasi ID Task ke database Supabase
      })
      toast('Jadwal berhasil ditambahkan ✓', 'success')
      onClose()
    } catch (e) {
      setError(e.message || 'Gagal menyimpan, coba lagi.')
    } finally { setSaving(false) }
  }

  // ─────────────── RENDER ─────────────────────────────────────────────────────
  const TABS = [
    { id: 'task',  label: 'Task'   },
    { id: 'habit', label: 'Habit'  },
    { id: 'block', label: 'Jadwal' },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0 0' }}>
          <span style={{ fontSize:16, fontWeight:500, color:'var(--txt)' }}>Tambah baru</span>
          <button onClick={onClose} style={{ color:'var(--txt2)', padding:4, background:'none', border:'none', cursor:'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', borderBottom:'0.5px solid var(--bdr)', margin:'10px 0 0' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTab(t.id)}
              style={{
                flex:1, padding:'9px 0', fontSize:13, textAlign:'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color:       tab === t.id ? 'var(--acc)' : 'var(--txt2)',
                fontWeight:  tab === t.id ? 500 : 400,
                borderBottom: tab === t.id ? '2px solid var(--acc)' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="scroll-y" style={{ flex:1, paddingTop:16, paddingBottom:8 }}>

          {/* Error banner */}
          {error && (
            <div style={{
              padding:'8px 12px', marginBottom:12,
              background:'var(--red-dim)', border:'0.5px solid var(--red)',
              borderRadius:'var(--r-md)', fontSize:13, color:'var(--red)',
            }}>
              {error}
            </div>
          )}

          {/* ══════════════ TAB TASK ══════════════ */}
          {tab === 'task' && (
            <div>
              <label className="field-label">Nama task</label>
              <input
                className="field-input"
                placeholder="Apa yang perlu dilakukan?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveTask()}
                autoFocus
              />

              <label className="field-label">Kategori beban kerja</label>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {[
                  { v:'heavy',  l:'🔴 Berat',  c:'var(--red)',  d:'var(--red-dim)'  },
                  { v:'medium', l:'🟡 Sedang', c:'var(--gold)', d:'var(--gold-dim)' },
                  { v:'light',  l:'🟢 Ringan', c:'var(--acc)',  d:'var(--acc-dim)'  },
                ].map(({ v, l, c, d }) => (
                  <button
                    key={v}
                    onClick={() => setTaskCat(v)}
                    style={{
                      flex:1, padding:'9px 0', borderRadius:'var(--r-full)',
                      fontSize:12, fontWeight:500, cursor: 'pointer',
                      background: taskCat === v ? d  : 'var(--bg2)',
                      color:      taskCat === v ? c  : 'var(--txt2)',
                      border:     taskCat === v ? `0.5px solid ${c}` : '0.5px solid var(--bdr)',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <label className="field-label">Tanggal jadwal (opsional)</label>
              <input
                className="field-input"
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
              />

              <button className="btn-primary" onClick={saveTask} disabled={saving}>
                {saving ? 'Menyimpan...' : '+ Simpan task'}
              </button>
            </div>
          )}

          {/* ══════════════ TAB HABIT (wizard 3 step) ══════════════ */}
          {tab === 'habit' && (
            <div>
              {/* Step progress */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ flex:1, height:3, background:'var(--bg3)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'var(--acc)', borderRadius:99, width:`${(hStep/3)*100}%`, transition:'width .3s' }} />
                </div>
                <span style={{ fontSize:11, color:'var(--txt3)', flexShrink:0 }}>
                  {hStep} / 3
                </span>
              </div>

              {/* ── STEP 1: Nama & Ikon ── */}
              {hStep === 1 && (
                <>
                  <div style={{ fontSize:15, fontWeight:500, color:'var(--txt)', marginBottom:3 }}>
                    Apa habitnya?
                  </div>
                  <div style={{ fontSize:13, color:'var(--txt2)', marginBottom:14 }}>
                    Beri nama dan pilih ikon yang mewakili habit ini
                  </div>

                  <label className="field-label">Nama habit</label>
                  <input
                    className="field-input"
                    placeholder="mis. Baca buku, Olahraga pagi, Minum air..."
                    value={hName}
                    onChange={(e) => setHName(e.target.value)}
                    autoFocus
                  />

                  <label className="field-label">Pilih ikon</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:8, marginBottom:20 }}>
                    {ICONS.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setHIcon(ic)}
                        style={{
                          aspectRatio:'1', borderRadius:10, fontSize:20, cursor: 'pointer',
                          background: hIcon === ic ? 'var(--acc-dim)' : 'var(--bg2)',
                          border:     hIcon === ic ? '1.5px solid var(--acc3)' : '0.5px solid var(--bdr)',
                        }}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => { setError(''); setHStep(2) }}
                    disabled={!hName.trim()}
                  >
                    Lanjut →
                  </button>
                </>
              )}

              {/* ── STEP 2: Frekuensi ── */}
              {hStep === 2 && (
                <>
                  <div style={{ fontSize:15, fontWeight:500, color:'var(--txt)', marginBottom:3 }}>
                    Seberapa sering?
                  </div>
                  <div style={{ fontSize:13, color:'var(--txt2)', marginBottom:14 }}>
                    Atur frekuensi habit ini per minggu
                  </div>

                  <label className="field-label">Frekuensi</label>
                  <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                    {[
                      { v:'daily',  l:'Setiap hari' },
                      { v:'weekly', l:'Per minggu'  },
                    ].map(({ v, l }) => (
                      <button
                        key={v}
                        onClick={() => setHFreq(v)}
                        style={{
                          flex:1, padding:'10px 0', borderRadius:'var(--r-full)',
                          fontSize:13, fontWeight:500, cursor: 'pointer',
                          background: hFreq === v ? 'var(--acc-dim)' : 'var(--bg2)',
                          color:      hFreq === v ? 'var(--acc2)'    : 'var(--txt2)',
                          border:     hFreq === v ? '0.5px solid var(--acc3)' : '0.5px solid var(--bdr)',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  {hFreq === 'weekly' && (
                    <>
                      <label className="field-label">Berapa hari per minggu?</label>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginBottom:20 }}>
                        <button
                          onClick={() => setHFreqDays((d) => Math.max(1, d - 1))}
                          style={{ width:40, height:40, borderRadius:'var(--r-md)', background:'var(--bg2)', border:'0.5px solid var(--bdr)', fontSize:22, color:'var(--txt)', cursor: 'pointer' }}
                        >−</button>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:36, fontWeight:500 }}>{hFreqDays}</div>
                          <div style={{ fontSize:11, color:'var(--txt2)' }}>hari / minggu</div>
                        </div>
                        <button
                          onClick={() => setHFreqDays((d) => Math.min(7, d + 1))}
                          style={{ width:40, height:40, borderRadius:'var(--r-md)', background:'var(--bg2)', border:'0.5px solid var(--bdr)', fontSize:22, color:'var(--txt)', cursor: 'pointer' }}
                        >+</button>
                      </div>
                    </>
                  )}

                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      className="btn-outline"
                      onClick={() => setHStep(1)}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}
                    >
                      <ChevronLeft size={15} /> Kembali
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => { setError(''); setHStep(3) }}
                      style={{ flex:2 }}
                    >
                      Lanjut →
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 3: Tipe Pengukuran ── */}
              {hStep === 3 && (
                <>
                  <div style={{ fontSize:15, fontWeight:500, color:'var(--txt)', marginBottom:3 }}>
                    Bagaimana mengukurnya?
                  </div>
                  <div style={{ fontSize:13, color:'var(--txt2)', marginBottom:14 }}>
                    Pilih cara melacak pencapaian habit ini setiap hari
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                    {[
                      { v:'yesno',    icon:'✓',  label:'Ya / Tidak',  sub:'Selesai atau belum' },
                      { v:'count',    icon:'🔢', label:'Jumlah',       sub:'Halaman, kali, set' },
                      { v:'duration', icon:'⏱',  label:'Durasi',       sub:'Menit atau jam'     },
                      { v:'volume',   icon:'💧', label:'Volume',       sub:'ml, liter, gelas'   },
                    ].map(({ v, icon, label, sub }) => (
                      <button
                        key={v}
                        onClick={() => selectType(v)}
                        style={{
                          padding:'12px 10px', borderRadius:'var(--r-lg)', textAlign:'center', cursor: 'pointer',
                          background: hType === v ? 'var(--acc-dim)' : 'var(--bg2)',
                          border:     hType === v ? '1.5px solid var(--acc3)' : '0.5px solid var(--bdr)',
                        }}
                      >
                        <div style={{ fontSize:24, marginBottom:5 }}>{icon}</div>
                        <div style={{ fontSize:13, fontWeight:500, color: hType === v ? 'var(--acc2)' : 'var(--txt)' }}>
                          {label}
                        </div>
                        <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>{sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Target angka — hanya muncul jika bukan yesno */}
                  {hType !== 'yesno' && (
                    <div style={{ background:'var(--bg2)', borderRadius:'var(--r-md)', padding:'14px', marginBottom:14 }}>
                      <div style={{ fontSize:12, color: 'var(--txt2)', marginBottom:12 }}>
                        Target harian
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginBottom:12 }}>
                        <button
                          onClick={() => setHTarget((t) => Math.max(1, t - (hType === 'volume' ? 100 : 1)))}
                          style={{ width:40, height:40, borderRadius:'var(--r-md)', background:'var(--bg3)', border:'0.5px solid var(--bdr)', fontSize:22, color:'var(--txt)', cursor: 'pointer' }}
                        >−</button>
                        <span style={{ fontSize:36, fontWeight:500, minWidth:70, textAlign:'center' }}>
                          {hTarget}
                        </span>
                        <button
                          onClick={() => setHTarget((t) => t + (hType === 'volume' ? 100 : 1))}
                          style={{ width:40, height:40, borderRadius:'var(--r-md)', background:'var(--bg3)', border:'0.5px solid var(--bdr)', fontSize:22, color:'var(--txt)', cursor: 'pointer' }}
                        >+</button>
                      </div>
                      <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                        {(UNITS[hType] || []).map((u) => (
                          <button
                            key={u}
                            onClick={() => setHUnit(u)}
                            style={{
                              padding:'6px 14px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:500, cursor: 'pointer',
                              background: hUnit === u ? 'var(--acc-dim)' : 'var(--bg3)',
                              color:      hUnit === u ? 'var(--acc2)'    : 'var(--txt2)',
                              border:     hUnit === u ? '0.5px solid var(--acc3)' : '0.5px solid var(--bdr)',
                            }}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview ringkasan habit */}
                  <div style={{ background:'var(--acc-dim)', border:'0.5px solid var(--acc3)', borderRadius:'var(--r-md)', padding:'10px 14px', marginBottom:16 }}>
                    <div style={{ fontSize:11, color:'var(--acc2)', marginBottom:4 }}>Ringkasan habit</div>
                    <div style={{ fontSize:13, color:'var(--txt)', fontWeight:500 }}>
                      {hIcon} {hName}
                    </div>
                    <div style={{ fontSize:12, color:'var(--txt2)', marginTop:3 }}>
                      {hFreq === 'daily' ? 'Setiap hari' : `${hFreqDays}x per minggu`}
                      {' · '}
                      {hType === 'yesno' ? 'ya/tidak' : `target ${hTarget} ${hUnit}`}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      className="btn-outline"
                      onClick={() => setHStep(2)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, flex:1 }}
                    >
                      <ChevronLeft size={15} /> Kembali
                    </button>
                    <button
                      className="btn-primary"
                      onClick={saveHabit}
                      disabled={saving}
                      style={{ flex:2 }}
                    >
                      {saving ? 'Menyimpan...' : '+ Simpan habit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════ TAB JADWAL ══════════════ */}
          {tab === 'block' && (
            <div>
              <label className="field-label">Nama kegiatan</label>
              <input
                className="field-input"
                placeholder="mis. Rapat tim, Olahraga, Belajar..."
                value={bTitle}
                onChange={(e) => setBTitle(e.target.value)}
                autoFocus
              />

              <label className="field-label">Tanggal</label>
              <input
                className="field-input"
                type="date"
                value={bDate}
                onChange={(e) => setBDate(e.target.value)}
              />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label className="field-label">Mulai</label>
                  <input
                    className="field-input"
                    type="time"
                    value={bStart}
                    onChange={(e) => setBStart(e.target.value)}
                    style={{ marginBottom:0 }}
                  />
                </div>
                <div>
                  <label className="field-label">Selesai</label>
                  <input
                    className="field-input"
                    type="time"
                    value={bEnd}
                    onChange={(e) => setBEnd(e.target.value)}
                    style={{ marginBottom:0 }}
                  />
                </div>
              </div>

              {/* SINKRONISASI TASK & JADWAL */}
              <label className="field-label" style={{ display:'flex', alignItems:'center', gap:6, marginTop:14 }}>
                <Link size={13}/> Hubungkan ke Task Hari Ini (Opsional)
              </label>
              <select 
                className="field-input" 
                value={linkedTaskId} 
                onChange={(e) => setLinkedTaskId(e.target.value)}
                style={{ background:'var(--bg2)', color:'var(--txt)', cursor: 'pointer' }}
              >
                <option value="">-- Selesaikan task apa di jam ini? --</option>
                {tasks.filter(t => !t.is_done).map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>

              <label className="field-label" style={{ marginTop:14 }}>Warna blok</label>
              <div style={{ display:'flex', gap:12, marginBottom:20 }}>
                {[
                  { v:'sage', c:'#8BAF7C', l:'Sage'  },
                  { v:'teal', c:'#5DCAA5', l:'Teal'  },
                  { v:'blue', c:'#7AACCC', l:'Biru'  },
                  { v:'gold', c:'#C9A96E', l:'Emas'  },
                  { v:'red',  c:'#D4736A', l:'Merah' },
                ].map(({ v, c, l }) => (
                  <div
                    key={v}
                    onClick={() => setBColor(v)}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer' }}
                  >
                    <div style={{
                      width:32, height:32, borderRadius:'50%', background:c,
                      border: bColor === v ? '3px solid var(--txt)' : '2px solid transparent',
                      transition:'border .15s',
                    }} />
                    <span style={{ fontSize:10, color: bColor === v ? 'var(--txt)' : 'var(--txt3)' }}>{l}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                onClick={saveBlock}
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : '+ Simpan jadwal & Sinkronkan'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}