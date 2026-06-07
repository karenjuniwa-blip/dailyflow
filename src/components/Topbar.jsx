export default function Topbar({ sub, title, right }) {
  return (
    <div className="topbar">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          {sub   && <div className="topbar-sub">{sub}</div>}
          {title && <div className="topbar-title">{title}</div>}
        </div>
        {right && <div>{right}</div>}
      </div>
    </div>
  )
}