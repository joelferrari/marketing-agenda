import { useState, useEffect, useRef, useCallback } from 'react';
import { IconBell } from '../nav';
import { getTodayEvents, getRecentApprovals } from '../notifications';
import styles from './NotificationBell.module.css';

const fmtH = (t) => t ? t.slice(0, 5) : '';

export default function NotificationBell({ user, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [facturesPayees, setFacturesPayees] = useState([]);
  const [demandesValidees, setDemandesValidees] = useState([]);
  const ref = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [ev, approvals] = await Promise.all([getTodayEvents(), getRecentApprovals(user)]);
    setEvents(ev);
    setFacturesPayees(approvals.facturesPayees);
    setDemandesValidees(approvals.demandesValidees);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const total = events.length + facturesPayees.length + demandesValidees.length;

  const go = (page) => { setOpen(false); onNavigate(page); };

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.bell} aria-label="Notifications" onClick={() => { setOpen(o => !o); if (!open) load(); }}>
        <IconBell/>
        {total > 0 && <span className={styles.badge}>{total > 9 ? '9+' : total}</span>}
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
