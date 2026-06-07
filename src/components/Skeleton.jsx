// Skeleton bar tunggal — sesuaikan width dan height sesuai kebutuhan
export function SkeletonBar({ width = '100%', height = 14, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

// Skeleton untuk satu baris task
export function SkeletonTaskRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0' }}>
      <div className="skeleton" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBar width="70%" height={13} />
        <SkeletonBar width="40%" height={10} />
      </div>
      <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0 }} />
    </div>
  )
}

// Skeleton untuk satu card task group
export function SkeletonTaskCard({ rows = 2 }) {
  return (
    <div className="card" style={{ padding: '4px 14px', marginBottom: 8 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i}>
          {i > 0 && <div className="divider" />}
          <SkeletonTaskRow />
        </div>
      ))}
    </div>
  )
}

// Skeleton untuk satu baris habit
export function SkeletonHabitRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
      <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBar width="55%" height={13} />
        <SkeletonBar width="35%" height={10} />
      </div>
      <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
    </div>
  )
}

// Skeleton halaman Today lengkap
export function SkeletonToday() {
  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <SkeletonBar width={120} height={13} />
          <SkeletonBar width={32} height={13} />
        </div>
        <SkeletonBar height={6} radius={99} />
      </div>

      {/* Task section label */}
      <SkeletonBar width={80} height={10} style={{ marginBottom: 8 }} />
      <SkeletonTaskCard rows={2} />

      <SkeletonBar width={80} height={10} style={{ marginBottom: 8, marginTop: 14 }} />
      <SkeletonTaskCard rows={3} />

      {/* Habit section */}
      <SkeletonBar width={100} height={10} style={{ marginBottom: 8, marginTop: 14 }} />
      <div className="card" style={{ padding: '4px 14px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i}>
            {i > 1 && <div className="divider" />}
            <SkeletonHabitRow />
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton halaman Habits
export function SkeletonHabits() {
  return (
    <div style={{ padding: '12px 16px' }}>
      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {[1, 2].map((i) => (
          <div key={i} className="card">
            <SkeletonBar width={80} height={28} style={{ marginBottom: 6 }} />
            <SkeletonBar width={100} height={11} />
            <SkeletonBar height={4} radius={99} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      {/* Habit cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <SkeletonBar width="50%" height={14} />
              <SkeletonBar width="70%" height={11} />
            </div>
          </div>
          <SkeletonBar height={6} radius={99} />
        </div>
      ))}
    </div>
  )
}