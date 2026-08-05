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

const CAT_COLORS = {
  'Vacances':'#fab005','Maladie':'#e03131','Récup. heures sup.':'#7950f2',
  'Marketing':'#3b5bdb','Autre':'#868e96',
};
const CAT_ORDER = ['Vacances','Maladie','Récup. heures sup.','Marketing','Autre'];

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

  const renderMoisSidePanel = () => {
    const monthStart = date.startOf('month').format('YYYY-MM-DD');
    const monthEnd   = date.endOf('month').format('YYYY-MM-DD');
    const moisEvs = events
      .filter(e => e.date_debut?.slice(0,10) <= monthEnd && (e.date_fin?.slice(0,10)||e.date_debut?.slice(0,10)) >= monthStart)
      .sort((a,b) => a.date_debut < b.date_debut ? -1 : 1);
    const byCat = {};
    moisEvs.forEach(ev => {
      const cat = ev.categorie || 'Autre';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(ev);
    });
    const present = CAT_ORDER.filter(c => byCat[c]);
    return (
      <div className={styles.sidePanel}>
        <p className={styles.sidePanelTitle}>{MONTHS[date.month()]}</p>
        {present.length === 0 && <p className={styles.sidePanelEmpty}>Aucun événement ce mois</p>}
        {present.map(cat => (
          <div key={cat} className={styles.sidePanelGroup}>
            <div className={styles.sidePanelCatRow}>
              <span className={styles.sidePanelCatDot} style={{background:CAT_COLORS[cat]||'#868e96'}}/>
              <span className={styles.sidePanelCat}>{cat}</span>
              <span className={styles.sidePanelCatCount}>{byCat[cat].length}</span>
            </div>
            {byCat[cat].map(ev => (
              <div key={ev.id} className={styles.sidePanelEvent}
                style={{borderLeftColor:CAT_COLORS[cat]||'#868e96'}}
                onClick={()=>setModal({event:ev})}>
                <span className={styles.sidePanelDate}>
                  {ev.date_debut?.slice(5,10).replace('-','/')}
                  {ev.date_fin && ev.date_fin !== ev.date_debut ? ' → ' + ev.date_fin.slice(5,10).replace('-','/') : ''}
                </span>
                <span className={styles.sidePanelEvTitle}>{ev.titre}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
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
                    {!!ev.rappel_email&&<span className={styles.rappelBadge}>🔔</span>}
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
              {!!ev.rappel_email&&<span className={styles.rappelBadge}>🔔 Rappel email</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {toast&&<div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <button className={styles.todayBtn} onClick={()=>setDate(dayjs())}>Aujourd'hui</button>
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
          {loading&&<div className={styles.loading}>Chargement…</div>}
          {!loading&&vue==='mois'&&(
            <div className={styles.moisOuter}>
              {renderMois()}
              {renderMoisSidePanel()}
            </div>
          )}
          {!loading&&vue==='semaine'&&renderSemaine()}
          {!loading&&vue==='jour'&&renderJour()}
        </div>
      </main>
      {modal&&<EventModal event={modal.event} defaultDate={modal.defaultDate||date.format('YYYY-MM-DD')} onSave={save} onDelete={remove} onClose={()=>setModal(null)}/>}
    </>
  );
}
