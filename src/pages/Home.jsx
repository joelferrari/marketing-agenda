import { useState, useEffect } from 'react';
import { getModules, Arrow } from '../nav';
import { getTodayEvents } from '../notifications';
import styles from './Home.module.css';

const fmtH = (t) => t ? t.slice(0, 5) : '';

/* Tableau de bord affiché DANS la coquille (AppShell fournit nav + header).
   NB : les 3 chiffres de KPI sont des placeholders — à brancher sur les
   endpoints réels (events du mois, factures en attente, solde vacances). */
const KPIS = [
  { label: 'Événements ce mois', value: '12', hint: '+3',        hintColor: 'var(--vert)' },
  { label: 'Factures en attente', value: '3',  hint: 'à traiter', hintColor: 'var(--orange)' },
  { label: 'Vacances Émilie',     value: '14', hint: '/ 20 jours', hintColor: 'var(--gris-lt)' },
];

export default function Home({ user, onNavigate }) {
  const prenom = user?.prenom || 'Émilie';
  const MODULES = getModules(user);
  const [todayEvents, setTodayEvents] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);

  useEffect(() => {
    getTodayEvents().then(ev => { setTodayEvents(ev); setLoadingToday(false); });
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.greet}>Bonjour, {prenom}</p>
        <h2 className={styles.title}>Que souhaitez-vous faire&nbsp;?</h2>
      </div>

      <div className={styles.kpis}>
        {KPIS.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValRow}>
              <span className={styles.kpiVal}>{k.value}</span>
              <span className={styles.kpiHint} style={{ color: k.hintColor }}>{k.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.heading}>Aujourd'hui</div>
      <div className={styles.todayCard}>
        {loadingToday ? (
          <p className={styles.todayEmpty}>Chargement…</p>
        ) : todayEvents.length === 0 ? (
          <p className={styles.todayEmpty}>Aucun événement aujourd'hui</p>
        ) : (
          <div className={styles.todayList}>
            {todayEvents.map(ev => (
              <button key={ev.id} className={styles.todayItem} onClick={() => onNavigate('agenda')}>
                <span className={styles.todayBar} style={{ background: ev.couleur || 'var(--acc)' }}/>
                <span className={styles.todayTime}>
                  {ev.toute_la_journee ? 'Journée' : (fmtH(ev.heure_debut) || '—')}
                </span>
                <span className={styles.todayBody}>
                  <span className={styles.todayTitle}>{ev.titre}</span>
                  {ev.description && <span className={styles.todayDesc}>{ev.description}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.heading}>Modules</div>
      <div className={styles.grid}>
        {MODULES.map(m => (
          <button key={m.id} className={styles.card} onClick={() => onNavigate(m.id)}>
            <span className={styles.cardIcon} style={{ background: m.soft, color: m.color }}><m.Icon/></span>
            <span className={styles.cardBody}>
              <span className={styles.cardTitle}>{m.label}</span>
              <span className={styles.cardDesc}>{m.desc}</span>
            </span>
            <span className={styles.cardArrow}><Arrow/></span>
          </button>
        ))}
      </div>
    </div>
  );
}
