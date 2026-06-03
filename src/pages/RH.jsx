import { useState, useEffect } from 'react';
import { getPointage, savePointage, delPointage, getBilan } from '../api';
import styles from './CreditCard.module.css';
import rh from './RH.module.css';

const CIBLE   = 9.0;
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const NOW     = new Date();

const fmtH = (h, forceSign=false) => {
  if (h === null || h === undefined || isNaN(h)) return '—';
  const sign = h < 0 ? '-' : (forceSign ? '+' : '');
  const abs  = Math.abs(h);
  const hh   = Math.floor(abs);
  const mm   = Math.round((abs - hh) * 60);
  return `${sign}${hh}h${mm.toString().padStart(2,'0')}`;
};

const toHHMM = (dec) => {
  if (!dec) return '';
  const hh = Math.floor(dec);
  const mm = Math.round((dec - hh) * 60);
  return `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  const d = new Date(year, month-1, 1).getDay();
  return d === 0 ? 7 : d; // 1=lun ... 7=dim
};

export default function RH({ user, onBack, onLogout }) {
  const [tab,      setTab]     = useState('pointage');
  const [annee,    setAnnee]   = useState(NOW.getFullYear());
  const [mois,     setMois]    = useState(NOW.getMonth()+1);
  const [entries,  setEntries] = useState([]);
  const [bilan,    setBilan]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [modal,    setModal]   = useState(null); // {date_jour, entry?}
  const [toast,    setToast]   = useState(null);
  const [form,     setForm]    = useState({heure_arrivee:'09:00',heure_depart:'18:00',notes:''});

  const toast$ = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const loadPointage = async (a=annee, m=mois) => {
    setLoading(true);
    try { const d=await getPointage({annee:a,mois:m}); setEntries(Array.isArray(d)?d:[]); }
    catch { setEntries([]); }
    finally { setLoading(false); }
  };

  const loadBilan = async (a=annee) => {
    setLoading(true);
    try { const d=await getBilan({annee:a}); setBilan(Array.isArray(d)?d:[]); }
    catch { setBilan([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab==='pointage') loadPointage();
    else if (tab==='resume') loadBilan();
  }, [tab, annee, mois]);

  const entriesByDate = Object.fromEntries(entries.map(e => [e.date_jour?.slice(0,10), e]));

  const openDay = (dateStr) => {
    const e = entriesByDate[dateStr];
    setForm({
      heure_arrivee: e?.heure_arrivee?.slice(0,5) || '10:00',
      heure_depart:  e?.heure_depart?.slice(0,5)  || '19:00',
      notes:         e?.notes || '',
    });
    setModal({ date_jour: dateStr, entry: e });
  };

  const submit = async (e) => {
    e.preventDefault();
    const d = await savePointage({ date_jour: modal.date_jour, ...form });
    if (d?.erreur) { toast$(d.erreur,false); return; }
    toast$('Pointage enregistré ✓');
    setModal(null);
    loadPointage();
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer ce jour ?')) return;
    await delPointage(id);
    toast$('Supprimé'); loadPointage();
  };

  // Navigation mois
  const prevMois = () => {
    if (mois === 1) { setAnnee(a=>a-1); setMois(12); } else setMois(m=>m-1);
  };
  const nextMois = () => {
    if (mois === 12) { setAnnee(a=>a+1); setMois(1); } else setMois(m=>m+1);
  };

  // Stats mois courant
  const totalH     = entries.reduce((s,e) => s + (parseFloat(e.heures)||0), 0);
  const nbJours    = entries.filter(e => e.heures).length;
  const heuresSup  = entries.reduce((s,e) => s + (e.delta||0), 0);

  // Calendrier
  const nbDays     = getDaysInMonth(annee, mois);
  const firstDay   = getFirstDayOfMonth(annee, mois);
  const cells      = Array.from({length: Math.ceil((nbDays + firstDay - 1) / 7) * 7}, (_,i) => {
    const day = i - firstDay + 2;
    if (day < 1 || day > nbDays) return null;
    return day;
  });

  // Bilan annuel
  const totalSupAnnee = bilan.reduce((s,m) => s + parseFloat(m.heures_sup||0), 0);
  const maxH = bilan.length ? Math.max(...bilan.map(m=>parseFloat(m.total_heures||0))) : 0;

  const dayColor = (entry) => {
    if (!entry || !entry.heures) return 'var(--fond)';
    const h = parseFloat(entry.heures);
    if (h >= CIBLE)       return '#e8f4e8';
    if (h >= CIBLE * 0.6) return '#fff8e1';
    return '#fde8e8';
  };

  const dayTextColor = (entry) => {
    if (!entry || !entry.heures) return 'var(--gris-lt)';
    const h = parseFloat(entry.heures);
    if (h >= CIBLE) return 'var(--vert)';
    if (h >= CIBLE * 0.6) return '#b08020';
    return 'var(--rouge)';
  };

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.3" strokeLinecap="round" style={{flexShrink:0}}>
            <circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0113 0"/>
          </svg>
          <div><p className={styles.headerSub}>Rubis SPA</p><h1 className={styles.headerTitle}>RH — Emilie</h1></div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.navSecondary} onClick={onBack}>← Accueil</button>
          <button className={styles.navSecondary} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Onglets */}
        <div className={rh.tabs}>
          {['pointage','resume','vacances'].map(t => (
            <button key={t} className={`${rh.tab} ${tab===t?rh.tabOn:''}`} onClick={()=>setTab(t)}>
              {t==='pointage'?'Pointage':t==='resume'?'Résumé annuel':'Vacances'}
            </button>
          ))}
        </div>

        {/* ── VACANCES ── */}
        {tab==='vacances' && <p className={styles.empty}>Section vacances — à venir</p>}

        {/* ── POINTAGE ── */}
        {tab==='pointage' && (<>
          {/* Navigation mois */}
          <div className={rh.moisNav}>
            <button className={rh.moisBtn} onClick={prevMois}>‹</button>
            <span className={rh.moisTitle}>{MOIS_FR[mois-1]} {annee}</span>
            <button className={rh.moisBtn} onClick={nextMois}>›</button>
            <div style={{flex:1}}/>
            <div className={rh.statsPills}>
              <span className={rh.pill}>{nbJours} jour{nbJours!==1?'s':''}</span>
              <span className={rh.pill}>{fmtH(totalH)} travaillées</span>
              <span className={rh.pill} style={{color:heuresSup>=0?'var(--vert)':'var(--rouge)',fontWeight:600}}>
                {fmtH(heuresSup,true)} sup.
              </span>
            </div>
          </div>

          {/* Grille calendrier */}
          <div className={rh.calCard}>
            <div className={rh.calHeader}>
              {JOURS.map(j => <div key={j} className={rh.calHeaderCell}>{j}</div>)}
            </div>
            <div className={rh.calGrid}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} className={rh.calEmpty}/>;
                const dateStr = `${annee}-${String(mois).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const entry   = entriesByDate[dateStr];
                const isFuture = new Date(dateStr) > NOW;
                const isSun    = (i % 7) === 6;
                return (
                  <div key={i}
                    className={`${rh.calCell} ${isSun?rh.calSun:''} ${isFuture?rh.calFuture:''}`}
                    style={{background: isSun||isFuture ? '' : dayColor(entry)}}
                    onClick={()=>!isFuture && openDay(dateStr)}>
                    <span className={rh.calDayNum}>{day}</span>
                    {entry?.heures && (
                      <span className={rh.calHours} style={{color: dayTextColor(entry)}}>
                        {fmtH(parseFloat(entry.heures))}
                      </span>
                    )}
                    {entry?.heure_arrivee && (
                      <span className={rh.calTimes}>
                        {entry.heure_arrivee.slice(0,5)}→{entry.heure_depart?.slice(0,5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Légende */}
          <div className={rh.legend}>
            <span className={rh.legendItem} style={{background:'#e8f4e8',color:'var(--vert)'}}>≥ 9h</span>
            <span className={rh.legendItem} style={{background:'#fff8e1',color:'#b08020'}}>5h–9h</span>
            <span className={rh.legendItem} style={{background:'#fde8e8',color:'var(--rouge)'}}>{'< 5h'}</span>
            <span className={rh.legendItem} style={{background:'var(--fond)',color:'var(--gris-lt)'}}>Pas de pointage</span>
          </div>
        </>)}

        {/* ── RÉSUMÉ ANNUEL ── */}
        {tab==='resume' && (<>
          {/* Sélecteur année */}
          <div className={rh.anneeBar}>
            {[NOW.getFullYear()-1, NOW.getFullYear()].map(a=>(
              <button key={a} className={`${rh.anneeBtn} ${annee===a?rh.anneeBtnOn:''}`}
                onClick={()=>setAnnee(a)}>{a}</button>
            ))}
          </div>

          {/* Solde global */}
          <div className={styles.soldeCard}>
            <p className={styles.soldeLabel}>Solde heures supplémentaires {annee}</p>
            <p className={styles.soldeVal} style={{color:totalSupAnnee>=0?'var(--vert)':'var(--rouge)'}}>
              {fmtH(totalSupAnnee, true)}
            </p>
            <div className={styles.soldeMeta}>
              <span>{bilan.reduce((s,m)=>s+parseInt(m.jours_travailles),0)} jours travaillés</span>
              <span style={{color:'var(--gris)'}}>·</span>
              <span>{fmtH(bilan.reduce((s,m)=>s+parseFloat(m.total_heures||0),0))} au total</span>
            </div>
          </div>

          {/* Graphique barres */}
          {bilan.length > 0 && (
            <div className={rh.chartCard}>
              <p className={styles.soldeLabel} style={{marginBottom:'16px'}}>Heures travaillées par mois</p>
              <div className={rh.barChart}>
                {bilan.map(m => {
                  const h   = parseFloat(m.total_heures||0);
                  const pct = maxH > 0 ? (h / maxH) * 100 : 0;
                  const sup = parseFloat(m.heures_sup||0);
                  return (
                    <div key={m.mois} className={rh.barCol}>
                      <span className={rh.barLabel} style={{color:sup>=0?'var(--vert)':'var(--rouge)',fontSize:'10px',marginBottom:'4px'}}>
                        {fmtH(sup,true)}
                      </span>
                      <div className={rh.barTrack}>
                        <div className={rh.barFill} style={{height:`${pct}%`, background:sup>=0?'var(--vert)':'var(--rouge)'}}/>
                      </div>
                      <span className={rh.barHours}>{fmtH(h)}</span>
                      <span className={rh.barMois}>{MOIS_FR[m.mois-1].slice(0,3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tableau mensuel */}
          <div className={styles.list}>
            <div className={rh.bilanHeader}>
              <span>Mois</span>
              <span style={{textAlign:'center'}}>Jours</span>
              <span style={{textAlign:'right'}}>Heures</span>
              <span style={{textAlign:'right'}}>Heures sup.</span>
            </div>
            {!bilan.length && <p className={styles.empty}>Aucune donnée pour {annee}</p>}
            {bilan.map(m => {
              const sup = parseFloat(m.heures_sup||0);
              return (
                <div key={m.mois} className={`${styles.row} ${rh.bilanRow}`}
                  onClick={()=>{ setMois(parseInt(m.mois)); setTab('pointage'); }}>
                  <span className={styles.rowDate}>{MOIS_FR[m.mois-1]} {annee}</span>
                  <span style={{textAlign:'center',color:'var(--gris)'}}>{m.jours_travailles}j</span>
                  <span style={{textAlign:'right',fontWeight:600}}>{fmtH(parseFloat(m.total_heures))}</span>
                  <span style={{textAlign:'right',fontWeight:600,color:sup>=0?'var(--vert)':'var(--rouge)'}}>
                    {fmtH(sup,true)}
                  </span>
                </div>
              );
            })}
          </div>
        </>)}
      </main>

      {/* Modal pointage */}
      {modal && (
        <div className={styles.overlay} onClick={()=>setModal(null)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {new Date(modal.date_jour+'T12:00').toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'})}
              </h2>
              <button className={styles.modalClose} onClick={()=>setModal(null)}>✕</button>
            </div>
            <form onSubmit={submit} className={styles.modalBody}>
              <div className={rh.timeRow}>
                <div className={styles.mf}>
                  <label>Arrivée</label>
                  <input type="time" value={form.heure_arrivee} step="300"
                    onChange={e=>setForm(p=>({...p,heure_arrivee:e.target.value}))} required/>
                </div>
                <div className={rh.timeSep}>→</div>
                <div className={styles.mf}>
                  <label>Départ</label>
                  <input type="time" value={form.heure_depart} step="300"
                    onChange={e=>setForm(p=>({...p,heure_depart:e.target.value}))} required/>
                </div>
              </div>
              {(() => {
                const [ha, ma] = form.heure_arrivee.split(':').map(Number);
                const [hd, md] = form.heure_depart.split(':').map(Number);
                const total = (hd + md/60) - (ha + ma/60);
                const delta = total - CIBLE;
                if (total > 0) return (
                  <div className={rh.preview} style={{background:delta>=0?'#e8f4e8':'#fde8e8',color:delta>=0?'var(--vert)':'var(--rouge)'}}>
                    <span>{fmtH(total)} travaillées</span>
                    <span style={{fontWeight:600}}>{fmtH(delta,true)} vs cible {CIBLE}h</span>
                  </div>
                );
              })()}
              <div className={styles.mf}>
                <label>Notes (optionnel)</label>
                <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                  placeholder="Formation, déplacement…"/>
              </div>
              <div className={styles.modalFooter}>
                {modal.entry && (
                  <button type="button" className={styles.btnCancel}
                    style={{color:'var(--rouge)',borderColor:'var(--rouge)'}}
                    onClick={()=>del(modal.entry.id)}>Supprimer</button>
                )}
                <div style={{flex:1}}/>
                <button type="button" className={styles.btnCancel} onClick={()=>setModal(null)}>Annuler</button>
                <button type="submit" className={styles.btnSubmit} style={{background:'var(--rose)'}}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
