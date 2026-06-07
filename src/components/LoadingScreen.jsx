export default function LoadingScreen() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background: 'var(--bg0)',
    }}>
      {/* Logo */}
      <div style={{
        width: 52, height: 52,
        borderRadius: 16,
        background: 'var(--acc-dim)',
        border: '0.5px solid var(--acc3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        animation: 'pulse 1.8s ease-in-out infinite',
      }}>
        🌿
      </div>

      <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--txt)' }}>
        DayFlow
      </div>

      {/* Dots loader */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'var(--acc)',
              opacity: 0.4,
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}