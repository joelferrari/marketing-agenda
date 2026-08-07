import { useState, useEffect } from 'react';
import { getModules, Arrow } from '../nav';
import { getTodayEvents, getTomorrowEvents, getVacationBalance, getEventsThisMonthCount, getPendingInvoicesCount, getOvertimeBalance } from '../notifications';
import styles from './Home.module.css';

const fmtH = (t) => t ? t.slice(0, 5) : '';

const fmtHeures = (h) => {
  if (h === null || h === undefined || isNaN(h)) return '—';
  const sign = h < 0 ? '-' : '+';
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  return `${sign}${hh}h${mm.toString().padStart(2, '0')}`;
};

function DayEvents({ loading, events, empty, onNavigate }) {
  if (loading) return <p className={styles.todayEmpty}>Chargement…</p>;
  if (events.length === 0) return <p className={styles.todayEmpty}>{empty}</p>;
  return (
    <div className={styles.todayList}>
      {events.map(ev => (
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
  );
}

/* Tableau de bord affiché DANS la coquille (AppShell fournit nav + header).
   Les 4 KPI sont branchés sur les vraies données et suivent l'utilisateur
   connecté (vacances, heures sup.). */
export default function Home({ user, onNavigate }) {
  const prenom = user?.prenom || 'Émilie';
  const MODULES = getModules(user);
  const [todayEvents, setTodayEvents] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [tomorrowEvents, setTomorrowEvents] = useState([]);
  const [loadingTomorrow, setLoadingTomorrow] = useState(true);
  const [vacances, setVacances] = useState(null);
  const [eventsCount, setEventsCount] = useState(null);
  const [pendingInvoices, setPendingInvoices] = useState(null);
  const [overtime, setOvertime] = useState(null);

  useEffect(() => {
    getTodayEvents().then(ev => { setTodayEvents(ev); setLoadingToday(false); });
    getTomorrowEvents().then(ev => { setTomorrowEvents(ev); setLoadingTomorrow(false); });
    getVacationBalance(user).then(setVacances);
    getEventsThisMonthCount().then(setEventsCount);
    getPendingInvoicesCount().then(setPendingInvoices);
    getOvertimeBalance(user).then(setOvertime);
  }, [user]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.greet}>Bonjour, {prenom}</p>
        <h2 className={styles.title}>Que souhaitez-vous faire&nbsp;?</h2>
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Événements ce mois</div>
          <div className={styles.kpiValRow}>
            <span className={styles.kpiVal}>{eventsCount ?? '—'}</span>
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Factures en attente</div>
          <div className={styles.kpiValRow}>
            <span className={styles.kpiVal}>{pendingInvoices ?? '—'}</span>
            {pendingInvoices > 0 && <span className={styles.kpiHint} style={{ color: 'var(--orange)' }}>à traiter</span>}
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Heures sup. {vacances?.prenom || prenom}</div>
          <div className={styles.kpiValRow}>
            <span className={styles.kpiVal} style={{ color: overtime == null ? 'var(--noir)' : overtime >= 0 ? 'var(--vert)' : 'var(--rouge)' }}>
              {overtime == null ? '—' : fmtHeures(overtime)}
            </span>
            <span className={styles.kpiHint} style={{ color: 'var(--gris-lt)' }}>depuis janvier</span>
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Vacances {vacances?.prenom || prenom}</div>
          <div className={styles.kpiValRow}>
            <span className={styles.kpiVal}>{vacances ? vacances.pris : '—'}</span>
            <span className={styles.kpiHint} style={{ color: 'var(--gris-lt)' }}>
              {vacances ? `/ ${vacances.droit} jours` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.todayCols}>
        <div>
          <div className={styles.heading}>Aujourd'hui</div>
          <div className={styles.todayCard}>
            <DayEvents loading={loadingToday} events={todayEvents} empty="Aucun événement aujourd'hui" onNavigate={onNavigate}/>
          </div>
        </div>
        <div>
          <div className={styles.heading}>Demain</div>
          <div className={styles.todayCard}>
            <DayEvents loading={loadingTomorrow} events={tomorrowEvents} empty="Aucun événement demain" onNavigate={onNavigate}/>
          </div>
        </div>
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
