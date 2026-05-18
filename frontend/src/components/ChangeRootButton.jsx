export default function ChangeRootButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 180,
        left: 20,
        zIndex: 90,
        width: 26, height: 26,
        borderRadius: '50%',
        background: 'rgba(10,10,28,0.88)',
        border: '1px solid rgba(124,157,245,0.45)',
        color: '#a0a8d0',
        fontSize: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,157,245,0.8)'
        e.currentTarget.style.color = '#e2e2f2'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(124,157,245,0.45)'
        e.currentTarget.style.color = '#a0a8d0'
      }}
      aria-label="Change root directory"
      title="Change directory (O)"
    >⌂</button>
  )
}
