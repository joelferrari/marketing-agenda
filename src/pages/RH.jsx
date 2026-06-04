import { useState, useEffect } from 'react';
import { getPointage, savePointage, delPointage, getBilan, getVacances, addVacances, deleteVacances } from '../api';
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
  const [vacances,  setVacances] = useState([]);
  const [vacModal,  setVacModal] = useState(false);
  const [vacForm,   setVacForm]  = useState({date_debut:'',date_fin:'',description:''});
  const [vacSaving, setVacSaving]= useState(false);
  const [toast,    setToast]   = useState(null);
  const [form,     setForm]    = useState({heure_arrivee:'09:00',heure_depart:'18:00',notes:''});

  const toast$ = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const loadPointage = async (a=annee, m=mois) => {
    setLoading(true);
    try { const d=await getPointage({annee:a,mois:m}); setEntries(Array.isArray(d)?d:[]); }
    catch { setEntries([]); }
    finally { setLoading(false); }
  };

  const loadVacances = async () => {
    try { const d = await getVacances(); setVacances(Array.isArray(d)?d:[]); } catch{}
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
    else if (tab==='vacances') loadVacances();
  }, [tab, annee, mois]);

  const entriesByDate = Object.fromEntries(entries.map(e => [e.date_jour?.slice(0,10), e]));

  const addVac = async (e) => {
    e.preventDefault();
    if (!vacForm.date_debut || !vacForm.date_fin) return;
    setVacSaving(true);
    try {
      const d = await addVacances(vacForm);
      if (d.erreur) throw new Error(d.erreur);
      toast$(`✓ Vacances enregistrées — ${d.jours} jours bloqués dans l'agenda`);
      setVacModal(false);
      setVacForm({date_debut:'',date_fin:'',description:''});
      loadVacances();
    } catch(e) { toast$(e.message, false); }
    finally { setVacSaving(false); }
  };

  const delVac = async (id) => {
    if (!window.confirm('Supprimer ces vacances ? Les jours seront débloqués dans l\'agenda.')) return;
    const d = await deleteVacances(id);
    if (d.erreur) { toast$(d.erreur, false); return; }
    toast$(`✓ Vacances supprimées — ${d.jours} jours débloqués`);
    loadVacances();
  };

  const openDay = (dateStr) => {
    const e = entriesByDate[dateStr];
    setForm({
      type:          e?.type || 'travail',
      heure_arrivee: e?.heure_arrivee?.slice(0,5) || '10:00',
      heure_depart:  e?.heure_depart?.slice(0,5)  || '19:00',
      notes:         e?.notes || '',
    });
    setModal({ date_jour: dateStr, entry: e });
  };

  const submit = async (e) => {
    e.preventDefault();
    const d = await savePointage({ date_jour: modal.date_jour, ...form, type: form.type || 'travail' });
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
    if (!entry) return 'var(--fond)';
    if (entry.type === 'recup') return '#ede7f6';
    if (!entry.heures) return 'var(--fond)';
    const h = parseFloat(entry.heures);
    if (h >= CIBLE)        return '#e8f4e8';
    if (h >= CIBLE * 0.6)  return '#fff8e1';
    return '#fde8e8';
  };

  const dayTextColor = (entry) => {
    if (!entry) return 'var(--gris-lt)';
    if (entry.type === 'recup') return '#7950f2';
    if (!entry.heures) return 'var(--gris-lt)';
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
        {tab==='vacances' && (<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <p style={{fontSize:'13px',color:'var(--gris)',margin:0}}>
              Les vacances bloquent automatiquement l'agenda du spa et apparaissent dans le calendrier marketing.
            </p>
            <button className={styles.addBtn} style={{marginLeft:'16px',flexShrink:0}} onClick={()=>setVacModal(true)}>
              + Ajouter vacances
            </button>
          </div>

          {/* Carte solde total */}
          {(() => {
            const now = new Date();
            const anneeVac = now.getFullYear();
            const totalJours = vacances
              .filter(v => new Date(v.date_debut).getFullYear() === anneeVac || new Date(v.date_fin).getFullYear() === anneeVac)
              .reduce((s,v) => {
                const debut = new Date(v.date_debut);
                const fin   = new Date(v.date_fin);
                return s + Math.round((fin - debut) / 86400000) + 1;
              }, 0);
            const DROIT = 20; // jours de vacances annuels
            const restant = DROIT - totalJours;
            return (
              <div className={styles.soldeCard} style={{marginBottom:'20px'}}>
                <p className={styles.soldeLabel}>Vacances prises en {anneeVac}</p>
                <p className={styles.soldeVal} style={{color: totalJours > DROIT ? 'var(--rouge)' : 'var(--vert)'}}>
                  {totalJours} <span style={{fontSize:'24px',fontWeight:'normal'}}>/ {DROIT} jours</span>
                </p>
                <div className={styles.soldeMeta}>
                  <span style={{color: restant >= 0 ? 'var(--vert)' : 'var(--rouge)', fontWeight:500}}>
                    {restant >= 0 ? `${restant} jour${restant!==1?'s':''} restants` : `${Math.abs(restant)} jour${Math.abs(restant)!==1?'s':''} de dépassement`}
                  </span>
                </div>
              </div>
            );
          })()}

          {vacances.length === 0 && <p className={styles.empty}>Aucune période de vacances enregistrée</p>}

          <div className={styles.list}>
            {vacances.length > 0 && (
              <div className={rh.vacHeader}>
                <span>Du</span><span>Au</span><span>Jours</span><span>Description</span><span/>
              </div>
            )}
            {vacances.map(v => {
              const debut = new Date(v.date_debut);
              const fin   = new Date(v.date_fin);
              const jours = Math.round((fin - debut) / 86400000) + 1;
              const isPast = fin < new Date();
              return (
                <div key={v.id} className={`${styles.row} ${rh.vacRow}`}
                  style={{opacity: isPast ? 0.6 : 1}}>
                  <span className={styles.rowDate}>{debut.toLocaleDateString('fr-CH')}</span>
                  <span className={styles.rowDate}>{fin.toLocaleDateString('fr-CH')}</span>
                  <span style={{fontWeight:500,color:'var(--gris)'}}>{jours}j</span>
                  <span className={styles.rowAuteur}>{v.description || '—'}</span>
                  <button className={styles.rowDel} onClick={()=>delVac(v.id)}>×</button>
                </div>
              );
            })}
          </div>
        </>)}

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
                    {entry?.type === 'recup' ? (
                      <span className={rh.calHours} style={{color:'#7950f2',fontSize:'12px'}}>Récup</span>
                    ) : entry?.heures ? (
                      <span className={rh.calHours} style={{color: dayTextColor(entry)}}>
                        {fmtH(parseFloat(entry.heures))}
                      </span>
                    ) : null}
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
              {/* Toggle Travail / Récupération */}
              <div className={rh.typeToggle}>
                {[{id:'travail',label:'🕐 Travail',color:'var(--rose)'},{id:'recup',label:'💜 Récupération',color:'#7950f2'}].map(t=>(
                  <button key={t.id} type="button"
                    className={rh.typeBtn}
                    style={form.type===t.id?{background:t.color,borderColor:t.color,color:'#fff'}:{}}
                    onClick={()=>setForm(p=>({...p,type:t.id}))}>
                    {t.label}
                  </button>
                ))}
              </div>

              {form.type==='recup' ? (
                <div className={rh.preview} style={{background:'#ede7f6',color:'#7950f2'}}>
                  <span>Journée de récupération</span>
                  <span style={{fontWeight:600}}>-9h00 du solde heures sup.</span>
                </div>
              ) : (<>
                <div className={rh.timeRow}>
                  <div className={styles.mf}>
                    <label>Arrivée</label>
                    <input type="time" value={form.heure_arrivee} step="300"
                      onChange={e=>setForm(p=>({...p,heure_arrivee:e.target.value}))}/>
                  </div>
                  <div className={rh.timeSep}>→</div>
                  <div className={styles.mf}>
                    <label>Départ</label>
                    <input type="time" value={form.heure_depart} step="300"
                      onChange={e=>setForm(p=>({...p,heure_depart:e.target.value}))}/>
                  </div>
                </div>
                {(() => {
                  const [ha,ma]=(form.heure_arrivee||'10:00').split(':').map(Number);
                  const [hd,md]=(form.heure_depart||'19:00').split(':').map(Number);
                  const total=(hd+md/60)-(ha+ma/60);
                  const delta=total-CIBLE;
                  if(total>0) return (
                    <div className={rh.preview} style={{background:delta>=0?'#e8f4e8':'#fde8e8',color:delta>=0?'var(--vert)':'var(--rouge)'}}>
                      <span>{fmtH(total)} travaillées</span>
                      <span style={{fontWeight:600}}>{fmtH(delta,true)} vs cible {CIBLE}h</span>
                    </div>
                  );
                })()}
              </>)}

              <div className={styles.mf}>
                <label>Notes (optionnel)</label>
                <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                  placeholder={form.type==='recup'?'Journée récup., matin seulement…':'Formation, déplacement…'}/>
              </div>
              <div className={styles.modalFooter}>
                {modal.entry && (
                  <button type="button" className={styles.btnCancel}
                    style={{color:'var(--rouge)',borderColor:'var(--rouge)'}}
                    onClick={()=>del(modal.entry.id)}>Supprimer</button>
                )}
                <div style={{flex:1}}/>
                <button type="button" className={styles.btnCancel} onClick={()=>setModal(null)}>Annuler</button>
                <button type="submit" className={styles.btnSubmit}
                  style={{background:form.type==='recup'?'#7950f2':'var(--rose)'}}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    {/* Modal ajout vacances */}
    {vacModal && (
      <div className={styles.overlay} onClick={()=>setVacModal(false)}>
        <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Nouvelle période de vacances</h2>
            <button className={styles.modalClose} onClick={()=>setVacModal(false)}>✕</button>
          </div>
          <form onSubmit={addVac} className={styles.modalBody}>
            <div className={rh.formRow}>
              <div className={styles.mf}>
                <label>Du</label>
                <input type="date" value={vacForm.date_debut} required
                  onChange={e=>setVacForm(p=>({...p,date_debut:e.target.value,date_fin:p.date_fin||e.target.value}))}/>
              </div>
              <div className={styles.mf}>
                <label>Au</label>
                <input type="date" value={vacForm.date_fin} min={vacForm.date_debut} required
                  onChange={e=>setVacForm(p=>({...p,date_fin:e.target.value}))}/>
              </div>
            </div>
            {vacForm.date_debut && vacForm.date_fin && vacForm.date_fin >= vacForm.date_debut && (
              <div className={rh.preview} style={{background:'#fff8e1',color:'#b08020'}}>
                <span>📅 {Math.round((new Date(vacForm.date_fin)-new Date(vacForm.date_debut))/86400000)+1} jours</span>
                <span style={{fontSize:'12px'}}>Agenda spa bloqué + événement marketing créé</span>
              </div>
            )}
            <div className={styles.mf}>
              <label>Description (optionnel)</label>
              <input value={vacForm.description}
                onChange={e=>setVacForm(p=>({...p,description:e.target.value}))}
                placeholder="Vacances été, Noël…"/>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={()=>setVacModal(false)}>Annuler</button>
              <button type="submit" className={styles.btnSubmit} style={{background:'#fab005'}} disabled={vacSaving}>
                {vacSaving ? '…' : "✓ Enregistrer et bloquer l'agenda"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
}
