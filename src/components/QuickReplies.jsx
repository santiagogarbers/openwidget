export function QuickReplies({ options, onSelect }) {
  return (
    <>
      <style>{`
        .cw-qr-btn {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #374151;
          font-family: var(--cw-font-family);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 150ms, background 150ms, color 150ms;
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .cw-qr-btn:hover {
          border-color: var(--cw-primary);
          color: var(--cw-primary);
          background: #fff;
        }
      `}</style>
      <div style={wrapStyle}>
        {options.map((opt) => (
          <button
            key={opt.value}
            className="cw-qr-btn"
            onClick={() => onSelect(opt)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  )
}

const wrapStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 6,
  padding: '6px 0 14px',
}
