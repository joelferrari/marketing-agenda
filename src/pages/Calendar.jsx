import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import isoWeek from 'dayjs/plugin/isoWeek';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../api';
import EventModal from '../components/EventModal';
import styles from './Calendar.module.css';

dayjs.extend(isoWeek);
dayjs.locale('fr');

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const IcoBell = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'-1.5px'}}>
    <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>
  </svg>
);

export default function Calendar({ user }) {
  const [date, setDate] = useState(dayjs());
  const [vue, setVue] = useState('mois');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const toast$ = (txt, ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    let dateDebut, dateFin;
    if (vue==='jour') { dateDebut=date.format('YYYY-MM-DD'); dateFin=dateDebut; }
    else if (vue==='semaine') { dateDebut=date.isoWeekday(1).format('YYYY-MM-DD'); dateFin=date.isoWeekday(7).format('YYYY-MM-DD'); }
    else { dateDebut=date.startOf('month').subtract(7,'day').format('YYYY-MM-DD'); dateFin=date.endOf('month').add(7,'day').format('YYYY-MM-DD'); }
    const data = await getEvents({ dateDebut, dateFin });
    setEvents(Array.isArray(data)?data:[]);
    setLoading(false);
  }, [date, vue]);

  useEffect(()=>{ load(); },[load]);

  const evForDate = (d) => events.filter(e => e.date_debut?.slice(0,10) <= d && (e.date_fin?.slice(0,10) || e.date_debut?.slice(0,10)) >= d);
  const nav = (dir) => {
    if(vue==='jour') setDate(d=>d.add(dir,'day'));
    if(vue==='semaine') setDate(d=>d.add(dir,'week'));
    if(vue==='mois') setDate(d=>d.add(dir,'month'));
  };

  const save = async (form) => {
    if(form.id) { await updateEvent(form.id,form); toast$('Événement modifié ✓'); }
    else { await createEvent(form); toast$('Événement créé ✓'); }
    setModal(null); load();
  };

  const remove = async (id) => {
    if(!window.confirm('Supprimer ?')) return;
    await deleteEvent(id); toast$('Supprimé'); setModal(null); load();
  };

  const dateTitle = () => {
    if(vue==='jour') return date.format('dddd D MMMM YYYY');
    if(vue==='semaine') return `${date.isoWeekday(1).format('D MMM')} — ${date.isoWeekday(7).format('D MMM YYYY')}`;
    return `${MONTHS[date.month()]} ${date.year()}`;
  };

  const renderMois = () => {
    const start = date.startOf('month');
    const days = date.daysInMonth();
    const pad = start.isoWeekday()-1;
    return (
      <div className={styles.moisWrap}>
        <div className={styles.moisHeader}>{DAYS.map(d=><div key={d} className={styles.moisDayName}>{d}</div>)}</div>
        <div className={styles.moisGrid}>
          {Array.from({length:pad}).map((_,i)=><div key={`e${i}`} className={styles.moisCell}/>)}
          {Array.from({length:days}).map((_,i)=>{
            const d=date.date(i+1), ds=d.format('YYYY-MM-DD'), evs=evForDate(ds), isToday=d.isSame(dayjs(),'day');
            return (
              <div key={ds} className={`${styles.moisCell} ${styles.moisCellActive} ${isToday?styles.moisToday:''}`} onClick={()=>setModal({defaultDate:ds})}>
                <span className={styles.moisNum}>{i+1}</span>
                {evs.slice(0,6).map(ev=>(
                  <div key={ev.id} className={styles.moisEvent} style={{background:ev.couleur+'22',borderLeftColor:ev.couleur}} onClick={e=>{e.stopPropagation();setModal({event:ev})}}>
                    {!ev.toute_la_journee&&ev.heure_debut&&<span className={styles.moisTime}>{ev.heure_debut.slice(0,5)} </span>}{ev.titre}
                    {ev.description&&<span className={styles.moisDesc}> — {ev.description}</span>}
                  </div>
                ))}
                {evs.length>6&&<span className={styles.moisMore}>+{evs.length-6}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSemaine = () => {
    const days = Array.from({length:7},(_,i)=>date.isoWeekday(i+1));
    return (
      <div className={styles.semaineWrap}>
        {days.map(d=>{
          const ds=d.format('YYYY-MM-DD'), evs=evForDate(ds), isToday=d.isSame(dayjs(),'day');
          return (
            <div key={ds} className={`${styles.semaineCol} ${isToday?styles.semaineToday:''}`} onClick={()=>setModal({defaultDate:ds})}>
              <div className={styles.semaineDayHeader}>
                <span className={styles.semaineDayName}>{DAYS[d.isoWeekday()-1]}</span>
                <span className={`${styles.semaineDayNum} ${isToday?styles.semaineTodayNum:''}`}>{d.format('D')}</span>
              </div>
              <div className={styles.semaineEvents}>
                {evs.map(ev=>(
                  <div key={ev.id} className={styles.semaineEvent} style={{background:ev.couleur+'22',borderLeftColor:ev.couleur}} onClick={e=>{e.stopPropagation();setModal({event:ev})}}>
                    <p className={styles.semaineEvTitle}>{ev.titre}</p>
                    {!ev.toute_la_journee&&ev.heure_debut&&<p className={styles.semaineEvTime}>{ev.heure_debut.slice(0,5)}{ev.heure_fin?` → ${ev.heure_fin.slice(0,5)}`:''}</p>}
                    {ev.description&&<p className={styles.semaineEvDesc}>{ev.description}</p>}
                    {!!ev.rappel_email&&<span className={styles.rappelBadge}><IcoBell/></span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderJour = () => {
    const ds=date.format('YYYY-MM-DD'), evs=evForDate(ds);
    return (
      <div className={styles.jourWrap}>
        <button className={styles.addBtn} onClick={()=>setModal({defaultDate:ds})}>+ Ajouter un événement</button>
        {evs.length===0&&!loading&&<p className={styles.empty}>Aucun événement ce jour.</p>}
        {evs.map(ev=>(
          <div key={ev.id} className={styles.jourEvent} style={{borderLeftColor:ev.couleur}} onClick={()=>setModal({event:ev})}>
            <div className={styles.jourEvLeft} style={{background:ev.couleur+'18'}}>
              {ev.toute_la_journee?<span className={styles.jourEvTime}>Toute la journée</span>:<><span className={styles.jourEvTime}>{ev.heure_debut?.slice(0,5)}</span><span className={styles.jourEvTimeTo}>{ev.heure_fin?.slice(0,5)}</span></>}
            </div>
            <div className={styles.jourEvBody}>
              <p className={styles.jourEvTitle}>{ev.titre}</p>
              {ev.description&&<p className={styles.jourEvDesc}>{ev.description}</p>}
              {!!ev.rappel_email&&<span className={styles.rappelBadge}><IcoBell/> Rappel email</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const periodEvents = () => {
    let start, end;
    if (vue==='jour') { start=date; end=date; }
    else if (vue==='semaine') { start=date.isoWeekday(1); end=date.isoWeekday(7); }
    else { start=date.startOf('month'); end=date.endOf('month'); }
    const s=start.format('YYYY-MM-DD'), f=end.format('YYYY-MM-DD');
    return events
      .filter(e => { const es=e.date_debut?.slice(0,10); const ef=(e.date_fin?.slice(0,10)||es); return es && ef>=s && es<=f; })
      .sort((a,b)=>(a.date_debut||'').localeCompare(b.date_debut||'') || (a.heure_debut||'').localeCompare(b.heure_debut||''));
  };

  const renderSummary = () => {
    const evs = periodEvents();
    const label = vue==='jour' ? 'Ce jour' : vue==='semaine' ? 'Cette semaine' : 'Ce mois';
    const grouped = {};
    evs.forEach(e => { const k=e.date_debut?.slice(0,10)||'?'; (grouped[k]=grouped[k]||[]).push(e); });
    const days = Object.keys(grouped).sort();
    return (
      <aside className={styles.summary}>
        <div className={styles.sumHead}>
          <span className={styles.sumTitle}>{label}</span>
          <span className={styles.sumCount}>{evs.length} événement{evs.length>1?'s':''}</span>
        </div>
        <div className={styles.sumSub}>{dateTitle()}</div>
        {evs.length===0 && <div className={styles.sumEmpty}>Aucun événement sur la période.</div>}
        {days.map(k => (
          <div key={k}>
            <div className={styles.sumDay}>{dayjs(k).format('dddd D MMM')}</div>
            {grouped[k].map(ev => (
              <div key={ev.id} className={styles.sumItem} onClick={()=>setModal({event:ev})}>
                <span className={styles.sumBar} style={{background:ev.couleur}}/>
                <div className={styles.sumBody}>
                  <div className={styles.sumEvTitle}>{ev.titre}</div>
                  <div className={styles.sumEvMeta}>
                    {ev.toute_la_journee ? 'Toute la journée' : (ev.heure_debut ? ev.heure_debut.slice(0,5) + (ev.heure_fin?` – ${ev.heure_fin.slice(0,5)}`:'') : '—')}
                    {ev.description ? ` · ${ev.description}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </aside>
    );
  };

  return (
    <>
      {toast&&<div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <button className={styles.todayBtn} onClick={()=>setDate(dayjs())}>Aujourd&apos;hui</button>
            <button className={styles.navBtn} onClick={()=>nav(-1)}>‹</button>
            <span className={styles.dateTitle} style={{textTransform:'capitalize'}}>{dateTitle()}</span>
            <button className={styles.navBtn} onClick={()=>nav(1)}>›</button>
          </div>
          <div className={styles.toolbarGroup}>
            <div className={styles.vueTabs}>
              {['jour','semaine','mois'].map(v=>(
                <button key={v} className={`${styles.vueTab} ${vue===v?styles.vueTabOn:''}`} onClick={()=>setVue(v)}>{v[0].toUpperCase()+v.slice(1)}</button>
              ))}
            </div>
            <button className={styles.newBtn} onClick={()=>setModal({defaultDate:date.format('YYYY-MM-DD')})}>+ Événement</button>
          </div>
        </div>
        <div className={styles.calBody}>
          <div className={styles.calMain}>
            {loading&&<div className={styles.loading}>Chargement…</div>}
            {!loading&&vue==='mois'&&renderMois()}
            {!loading&&vue==='semaine'&&renderSemaine()}
            {!loading&&vue==='jour'&&renderJour()}
          </div>
          {!loading && renderSummary()}
        </div>
      </main>
      {modal&&<EventModal event={modal.event} defaultDate={modal.defaultDate||date.format('YYYY-MM-DD')} onSave={save} onDelete={remove} onClose={()=>setModal(null)}/>}
    </>
  );
}
