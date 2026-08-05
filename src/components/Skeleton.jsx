/* Skeleton de chargement Retro Spring.
   Usage : remplacer {loading && <p className={styles.loading}>Chargement…</p>}
   par     {loading && <Skeleton rows={4}/>}                                   */
export default function Skeleton({ rows = 3, card = true }) {
  const widths = ['70%', '100%', '55%', '88%', '64%', '92%'];
  const bars = Array.from({ length: rows }, (_, i) => (
    <div key={i} className="skel" style={{ width: widths[i % widths.length], height: '13px' }} />
  ));
  const inner = <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{bars}</div>;
  if (!card) return inner;
  return (
    <div style={{
      background: 'var(--blanc)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '24px', margin: '8px 0',
    }}>
      {inner}
    </div>
  );
}
