export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#02060f',
      }}
    >
      <div className="canvas-loader">
        <span className="canvas-loader__ring" />
        <span className="canvas-loader__label">Loading atlas</span>
      </div>
    </div>
  );
}
