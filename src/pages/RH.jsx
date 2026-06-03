import { useState, useEffect } from 'react';
import { getHeures, saveHeures, deleteHeures } from '../api';
import styles from './CreditCard.module.css';
import rhStyles from './RH.module.css';

const CIBLE = 42.5;
const ANNEE_COURANTE = new Date().getFullYear();

const fmtH = (h) => {
  const abs  = Math.abs(h);
  const hh   = Math.floor(abs);
  const mm   = Math.round((abs - hh) * 60);
  const sign = h < 0 ? '-' : '+';
  return `${sign}${hh}h${mm.toString().padStart(2,'0')}`;
};

const fmtHabs = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h${mm.toString().padStart(2,'0')}`;
};

// Calcule la plage de dates d'une semaine ISO
const weekRange = (year, week) => {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('fr-CH', {day:'2-digit',month:'2-digit'});
  return `${fmt(mon)} → ${fmt(sun)}`;
};

// Semaine ISO courante
const currentISOWeek = () => {
  const d  = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
};

export default function RH({ user, onBack, onLogout }) {
  const [tab,     setTab]     = useState('heures');
  const [heures,  setHeures]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null); // ligne en cours d'édition
  const [toast,   setToast]   = useState(null);
  const [annee,   setAnnee]   = useState(ANNEE_COURANTE);
  const [form,    setForm]    = useState({ annee: ANNEE_COURANTE, semaine: currentISOWeek(), heures: '', notes: '' });

  const toast$ = (txt, ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const load = async (a=annee) => {
    setLoading(true);
    try {
      const d = await getHeures({ annee: a });
      setHeures(Array.isArray(d) ? d : []);
    } catch { setHeures([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ annee, semaine: currentISOWeek(), heures: '', notes: '' });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ annee: row.annee, semaine: row.semaine, heures: row.heures, notes: row.notes || '' });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.heures) return;
    // Convertir "HH:MM" ou "HH.MM" ou nombre décimal
    let h = form.heures.toString().trim();
    if (h.includes(':')) {
      const [hh, mm] = h.split(':').map(Number);
      h = hh + mm / 60;
    } else {
      h = parseFloat(h.replace(',','.'));
    }
    const d = await saveHeures({ ...form, heures: h });
    if (d.erreur) { toast$(d.erreur, false); return; }
    toast$('Semaine enregistrée ✓');
    setModal(false);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer cette semaine ?')) return;
    await deleteHeures(id);
    toast$('Supprimé'); load();
  };

  // Stats globales
  const totalH      = heures.reduce((s,r) => s + r.heures, 0);
  const totalDelta  = heures.reduce((s,r) => s + r.delta, 0);
  const soldeFinal  = heures.length ? heures[0].solde : 0; // desc → premier = le plus récent
  const nbSemaines  = heures.length;

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.3" strokeLinecap="round" style={{flexShrink:0}}>
            <circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0113 0"/>
            <path d="M17 11l2 2 4-4" stroke="var(--vert)" strokeWidth="2"/>
          </svg>
          <div>
            <p className={styles.headerSub}>Rubis SPA</p>
            <h1 className={styles.headerTitle}>RH — Emilie</h1>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addBtn} onClick={openAdd}>+ Ajouter semaine</button>
          <button className={styles.navSecondary} onClick={onBack}>← Accueil</button>
          <button className={styles.navSecondary} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>

        {/* Onglets */}
        <div className={rhStyles.tabs}>
          <button className={`${rhStyles.tab} ${tab==='heures'?rhStyles.tabOn:''}`} onClick={()=>setTab('heures')}>Heures</button>
          <button className={`${rhStyles.tab} ${tab==='vacances'?rhStyles.tabOn:''}`} onClick={()=>setTab('vacances')}>Vacances</button>
        </div>

        {tab === 'vacances' && (
          <div className={styles.empty}>Section vacances — à venir</div>
        )}

        {tab === 'heures' && (<>

          {/* Solde */}
          <div className={styles.soldeCard}>
            <p className={styles.soldeLabel}>Solde heures supplémentaires</p>
            <p className={styles.soldeVal} style={{color: soldeFinal >= 0 ? 'var(--vert)' : 'var(--rouge)'}}>
              {fmtH(soldeFinal)}
            </p>
            <div className={styles.soldeMeta}>
              <span className={styles.soldeCredit}>{fmtHabs(totalH)} heures travaillées</span>
              <span style={{fontSize:'13px',color:'var(--gris)'}}>·</span>
              <span className={styles.soldeDebit}>{nbSemaines} semaines · cible {CIBLE}h/sem.</span>
            </div>
          </div>

          {/* Filtre année */}
          <div className={rhStyles.anneeBar}>
            {[ANNEE_COURANTE-1, ANNEE_COURANTE].map(a => (
              <button key={a} className={`${rhStyles.anneeBtn} ${annee===a?rhStyles.anneeBtnOn:''}`}
                onClick={()=>{ setAnnee(a); load(a); }}>{a}</button>
            ))}
          </div>

          {/* Liste */}
          {loading ? <p className={styles.loading}>Chargement…</p> : (
            <div className={styles.list}>
              <div className={rhStyles.listHeader}>
                <span>Semaine</span>
                <span>Période</span>
                <span style={{textAlign:'right'}}>Heures</span>
                <span style={{textAlign:'right'}}>vs cible</span>
                <span style={{textAlign:'right'}}>Solde cumulé</span>
                <span>Notes</span>
                <span/>
              </div>
              {!heures.length && <p className={styles.empty}>Aucune semaine enregistrée</p>}
              {heures.map(r => (
                <div key={r.id} className={`${styles.row} ${rhStyles.row}`} onClick={()=>openEdit(r)} style={{cursor:'pointer'}}>
                  <span className={rhStyles.semNum}>S{r.semaine}</span>
                  <span className={styles.rowDate} style={{fontSize:'12px'}}>{weekRange(r.annee, r.semaine)}</span>
                  <span style={{textAlign:'right',fontWeight:600,fontSize:'14px'}}>{fmtHabs(r.heures)}</span>
                  <span style={{textAlign:'right',fontWeight:600,fontSize:'13px',color: r.delta >= 0 ? 'var(--vert)' : 'var(--rouge)'}}>
                    {fmtH(r.delta)}
                  </span>
                  <span style={{textAlign:'right',fontWeight:600,fontSize:'13px',color: r.solde >= 0 ? 'var(--vert)' : 'var(--rouge)'}}>
                    {fmtH(r.solde)}
                  </span>
                  <span className={styles.rowAuteur} style={{fontSize:'11px',fontStyle: r.source==='import'?'italic':'normal',color:'var(--gris-lt)'}}>
                    {r.notes || (r.source==='import'?'Import Clockify':'—')}
                  </span>
                  <button className={styles.rowDel} onClick={e=>{e.stopPropagation();del(r.id);}}>×</button>
                </div>
              ))}
            </div>
          )}
        </>)}
      </main>

      {/* Modal saisie */}
      {modal && (
        <div className={styles.overlay} onClick={()=>setModal(false)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Modifier la semaine' : 'Ajouter une semaine'}</h2>
              <button className={styles.modalClose} onClick={()=>setModal(false)}>✕</button>
            </div>
            <form onSubmit={submit} className={styles.modalBody}>
              <div className={rhStyles.formRow}>
                <div className={styles.mf}>
                  <label>Année</label>
                  <select value={form.annee} onChange={e=>setForm(p=>({...p,annee:parseInt(e.target.value)}))}>
                    <option value={ANNEE_COURANTE-1}>{ANNEE_COURANTE-1}</option>
                    <option value={ANNEE_COURANTE}>{ANNEE_COURANTE}</option>
                  </select>
                </div>
                <div className={styles.mf}>
                  <label>Semaine ISO</label>
                  <select value={form.semaine} onChange={e=>setForm(p=>({...p,semaine:parseInt(e.target.value)}))}>
                    {Array.from({length:53},(_,i)=>i+1).map(s=>(
                      <option key={s} value={s}>S{s} — {weekRange(form.annee, s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.mf}>
                <label>Heures travaillées</label>
                <input value={form.heures} onChange={e=>setForm(p=>({...p,heures:e.target.value}))}
                  placeholder="ex: 40:30 ou 40.5" required autoFocus/>
                <span style={{fontSize:'11px',color:'var(--gris-lt)',marginTop:'4px',display:'block'}}>
                  Format HH:MM (ex: 38:30) ou décimal (ex: 38.5). Cible : 42h30.
                </span>
              </div>
              {form.heures && (() => {
                let h = form.heures.toString().trim();
                if (h.includes(':')) { const [hh,mm] = h.split(':').map(Number); h = hh + mm/60; } else h = parseFloat(h.replace(',','.'));
                if (!isNaN(h)) {
                  const d = h - CIBLE;
                  return <div style={{padding:'8px 12px',background: d>=0?'#e8f4e8':'#fde8e8',borderRadius:'6px',fontSize:'13px',color:d>=0?'var(--vert)':'var(--rouge)',fontWeight:500}}>
                    {d >= 0 ? `+${fmtH(d).replace('+','')} heures supplémentaires` : `${fmtH(d)} (déficit)`}
                  </div>;
                }
              })()}
              <div className={styles.mf}>
                <label>Notes (optionnel)</label>
                <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Vacances, maladie, formation…"/>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={()=>setModal(false)}>Annuler</button>
                <button type="submit" className={styles.btnSubmit} style={{background:'var(--rose)'}}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
