/**
 * ModeIndicator.jsx
 * Small badge showing Online (green) or Offline (amber) status.
 */

export default function ModeIndicator({ isOnline }) {
  return (
    <div className={`mode-indicator ${isOnline ? 'online' : 'offline'}`}>
      <span className="mode-dot" />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  )
}
