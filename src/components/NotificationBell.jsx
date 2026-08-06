import { useState, useEffect, useRef, useCallback } from 'react';
import { IconBell } from '../nav';
import { getTodayEvents, getRecentApprovals } from '../notifications';
import styles from './NotificationBell.module.css';

const fmtH = (t) => t ? t.slice(0, 5) : '';

const SEEN_KEY = 'mkt_notif_seen';
const loadSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); } catch { return new Set(); } };
const saveSeen = (ids) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...ids])); } catch {} };

export default function NotificationBell({ user, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [facturesPayees, setFacturesPayees] = useState([]);
  const [demandesValidees, setDemandesValidees] = useState([]);
  const [seenIds, setSeenIds] = useState(loadSeen);
  const ref = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [ev, approvals] = await Promise.all([getTodayEvents(), getRecentApprovals(user)]);
    setEvents(ev);
    setFacturesPayees(approvals.facturesPayees);
    setDemandesValidees(approvals.demandesValidees);
    setLoading(false);
    // Ne garder en mémoire que les ids encore présents, pour ne pas grossir indéfiniment.
    const currentIds = new Set([...ev.map(e => `event-${e.id}`), ...approvals.facturesPayees.map(f => f.id), ...approvals.demandesValidees.map(d => d.id)]);
    setSeenIds(prev => { const next = new Set([...prev].filter(id => currentIds.has(id))); saveSeen(next); return next; });
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const allIds = [...events.map(e => `event-${e.id}`), ...facturesPayees.map(f => f.id), ...demandesValidees.map(d => d.id)];
  const total = events.length + facturesPayees.length + demandesValidees.length;
  const unseen = allIds.filter(id => !seenIds.has(id)).length;

  useEffect(() => {
    if (!open || loading) return;
    setSeenIds(prev => {
      if (allIds.every(id => prev.has(id))) return prev;
      const next = new Set([...prev, ...allIds]);
      saveSeen(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, events, facturesPayees, demandesValidees]);

  const go = (page) => { setOpen(false); onNavigate(page); };

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.bell} aria-label="Notifications" onClick={() => { setOpen(o => !o); if (!open) load(); }}>
        <IconBell/>
        {unseen > 0 && <span className={styles.badge}>{unseen > 9 ? '9+' : unseen}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Notifications</div>

          {loading ? (
            <div className={styles.empty}>Chargement…</div>
          ) : total === 0 ? (
            <div className={styles.empty}>Rien de nouveau</div>
          ) : (
            <div className={styles.sections}>
              {events.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Aujourd'hui</div>
                  {events.map(ev => (
                    <button key={ev.id} className={styles.item} onClick={() => go('agenda')}>
                      <span className={styles.itemDot} style={{ background: ev.couleur || 'var(--acc)' }}/>
                      <span className={styles.itemBody}>
                        <span className={styles.itemTitle}>{ev.titre}</span>
                        <span className={styles.itemSub}>
                          {ev.toute_la_journee ? 'Toute la journée' : (fmtH(ev.heure_debut) || '—')}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {facturesPayees.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Factures payées</div>
                  {facturesPayees.map(f => (
                    <button key={f.id} className={styles.item} onClick={() => go(f.page)}>
                      <span className={styles.itemDot} style={{ background: 'var(--vert)' }}/>
                      <span className={styles.itemBody}>
                        <span className={styles.itemTitle}>{f.titre}</span>
                        <span className={styles.itemSub}>{f.sousTitre}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {demandesValidees.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Demandes approuvées</div>
                  {demandesValidees.map(d => (
                    <button key={d.id} className={styles.item} onClick={() => go(d.page)}>
                      <span className={styles.itemDot} style={{ background: 'var(--vert)' }}/>
                      <span className={styles.itemBody}>
                        <span className={styles.itemTitle}>{d.titre}</span>
                        <span className={styles.itemSub}>{d.sousTitre}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
