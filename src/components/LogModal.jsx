import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuthStore, useHabitLogStore } from '../store'
import { format } from 'date-fns'

export default function LogModal({ habit, onClose }) {
  const { user }           = useAuthStore()
  const { habitLogs, addHabitLog, fetchHabitLogs } = useHabitLogStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  
  // Mencari log eksis untuk habit ini yang dicatat pada hari ini
  const existingLog = habitLogs.find(
    (log) => log.habit_id === habit.id && format(new Date(log.logged_at), 'yyyy-MM-dd') === today
  )
  const existing = existingLog ? existingLog.value : 0

  // Step default sesuai tipe habit
  const step = habit.measure_type === 'volume' ? 100
             : habit.measure_type === 'duration' ? 5
             : 1

  const [adding, setAdding] = useState(step)
  const [saving, setSaving] = useState(false)

  const newTotal  = Math.min(existing + adding, habit.target_value * 2)
  const pct       = Math.min(100, Math.round((newTotal / habit.target_value) * 100))
  const remaining = habit.target_value - newTotal
  const isDone    = remaining <= 0

  const adj = (delta) => setAdding((a) => Math.max(step, a + delta))

  const save = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      // Mengirimkan data log baru ke store.js (Target tabel: habit_log)
      await addHabitLog(user.id, {
        habit_id: habit.id,
        value: newTotal,
        logged_at: new Date().toISOString()
      })
      onClose()
    } catch (e) {
      console.error("Gagal menyimpan habit log:", e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', padding: '14px 0 16px',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--txt)' }}>
              {habit.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>
              Target: {habit.target_value} {habit.target_unit}
              {existing > 0 && ` · sudah: ${existing}`}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--txt2)', padding: 4, flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Input angka besar */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 16 }}>
            Tambahkan
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <button
              onClick={() => adj(-step)}
              style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                background: 'var(--bg2)', border: '0.5px solid var(--bdr2)',
                fontSize: 22, color: 'var(--txt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              −
            </button>

            <div style={{ minWidth: 80, textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 500, lineHeight: 1, color: 'var(--txt)' }}>
                {adding}
              </div>
              <div style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 4 }}>
                {habit.target_unit || 'kali'}
              </div>
            </div>

            <button
              onClick={() => adj(step)}
              style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                background: 'var(--bg2)', border: '0.5px solid var(--bdr2)',
                fontSize: 22, color: 'var(--txt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Preview progress */}
        <div style={{
          background: 'var(--bg2)',
          borderRadius: 'var(--r-md)',
          padding: '12px 14px',
          margin: '16px 0',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 7,
          }}>
            <span style={{ fontSize: 12, color: 'var(--txt2)' }}>
              Progress setelah disimpan
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: isDone ? 'var(--acc)' : 'var(--txt)' }}>
              {pct}%
            </span>
          </div>

          <div className="prog-track">
            <div
              className="prog-fill prog-sage"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div style={{
            fontSize: 12,
            color: isDone ? 'var(--acc2)' : 'var(--txt2)',
            marginTop: 8,
          }}>
            {isDone
              ? '🎉 Target tercapai hari ini!'
              : `Masih kurang ${Math.max(0, remaining)} ${habit.target_unit || 'kali'} untuk selesai`}
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Menyimpan...' : 'Simpan progress'}
        </button>
        <button className="btn-ghost" onClick={onClose}>
          Batal
        </button>
      </div>
    </div>
  )
}