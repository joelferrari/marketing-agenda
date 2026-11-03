import { useState, useEffect } from 'react';
import { getCaisse, addCaisse, deleteCaisse, uploadCaisseFichier, getCaisseFichier, deleteCaisseFichier } from '../api';
import Skeleton from '../components/Skeleton';
import styles from './CreditCard.module.css';

const fmt  = (n) => new Intl.NumberFormat('fr-CH',{style:'currency',currency:'CHF'}).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-CH');
const today = () => new Date().toISOString().slice(0,10);

export default function Caisse({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ date_transaction:today(), description:'', type:'sortie', montant:'' });
  const [fichier, setFichier] = useState(null);   // justificatif choisi dans le formulaire
  const [envoi,   setEnvoi]   = useState(null);   // id de la ligne dont le fichier est en cours d'envoi

  const toast$ = (txt, ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    const data = await getCaisse();
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const entrees = transactions.filter(t => t.type === 'entree').reduce((a,t) => a + parseFloat(t.montant), 0);
  const sorties = transactions.filter(t => t.type === 'sortie').reduce((a,t) => a + parseFloat(t.montant), 0);
  const solde   = entrees - sorties;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.montant) return;
    const res = await addCaisse({ ...form, montant: parseFloat(form.montant) });
    if (fichier && res?.id) {
      const up = await uploadCaisseFichier(res.id, fichier).catch(() => null);
      if (!up?.ok) toast$(up?.erreur || 'Ligne enregistrée, mais le fichier n\'a pas pu être joint', false);
    }
    toast$(`${form.type === 'entree' ? 'Entrée' : 'Sortie'} enregistrée ✓`);
    setModal(false);
    setForm({ date_transaction:today(), description:'', type:'sortie', montant:'' });
    setFichier(null);
    load();
  };

  const joindre = async (id, file) => {
    if (!file) return;
    setEnvoi(id);
    const res = await uploadCaisseFichier(id, file).catch(() => null);
    setEnvoi(null);
    if (res?.ok) { toast$('Fichier joint ✓'); load(); }
    else toast$(res?.erreur || 'Envoi impossible', false);
  };

  // Ouvre la fenêtre tout de suite (sinon bloquée comme pop-up), puis y charge le fichier
  const ouvrir = async (id) => {
    const w = window.open('', '_blank');
    try {
      const blob = await getCaisseFichier(id);
      const url = URL.createObjectURL(blob);
      if (w) w.location.href = url; else window.location.href = url;
    } catch (e) { if (w) w.close(); toast$(e.message, false); }
  };

  const retirer = async (id) => {
    if (!window.confirm('Retirer le fichier joint ?')) return;
    await deleteCaisseFichier(id);
    toast$('Fichier retiré'); load();
  };

  const remove = async (id) => {
    if (id === null || id === undefined) { toast$('Les entrées POS sont importées automatiquement', false); return; }
    if (!window.confirm('Supprimer cette ligne ?')) return;
    await deleteCaisse(id);
    toast$('Supprimé'); load();
  };

  return (
    <>
      {toast && <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>{toast.txt}</div>}
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div/>
          <div className={styles.toolbarGroup}>
            <button className={styles.addBtn} onClick={()=>setModal(true)}>+ Ajouter</button>
            <button className={styles.navSecondary} onClick={load} title="Actualiser">↻ Actualiser</button>
          </div>
        </div>

        <div className={styles.dcSummary}>
          <div className={styles.dcPill}>
            <div className={styles.dcPillLabel}>Solde en caisse</div>
            <div className={styles.dcPillVal} style={{color: solde >= 0 ? 'var(--vert)' : 'var(--rouge)'}}>{fmt(solde)}</div>
            <div className={styles.dcPillMeta}>
              <span style={{color:'var(--vert)'}}>↑ {fmt(entrees)} entrées</span>
              <span style={{color:'var(--rouge)'}}>↓ {fmt(sorties)} sorties</span>
            </div>
          </div>
          <div className={styles.dcInfo}>
            <div className={styles.dcInfoText}>Les encaissements <strong>POS</strong> (part espèces des RDV) sont importés automatiquement et non modifiables.</div>
          </div>
        </div>

        {loading && <Skeleton rows={4}/>}
        {!loading && transactions.length === 0 && (
          <p className={styles.empty}>Aucune transaction. Les paiements cash du POS apparaîtront ici automatiquement.</p>
        )}

        {!loading && transactions.length > 0 && (() => {
          const cols = '110px 1fr 130px 170px 130px 40px';
          return (
          <div className={styles.dcTable}>
            <div className={styles.dcHead} style={{gridTemplateColumns:cols}}>
              <span>Date</span><span>Libellé</span><span>Source</span><span>Justificatif</span><span style={{textAlign:'right'}}>Montant</span><span/>
            </div>
            {transactions.map(t => (
              <div key={t.id} className={styles.dcRow} style={{gridTemplateColumns:cols}}>
                <span className={styles.dcDate}>{fmtDate(t.date_transaction)}</span>
                <span className={styles.dcName}>{t.description}</span>
                <span>
                  {t.source === 'pos'
                    ? <span className={styles.dcCat} style={{background:'var(--vert-lt)',color:'var(--vert)'}}>POS · auto</span>
                    : <span className={styles.dcCat}>{t.auteur_prenom || 'Manuel'}</span>
                  }
                </span>
                <span style={{display:'flex',alignItems:'center',gap:'6px',minWidth:0}}>
                  {t.source === 'pos' ? null : t.fichier_nom ? (
                    <>
                      <button type="button" onClick={()=>ouvrir(t.id)} title={t.fichier_nom}
                        style={{background:'none',border:'none',padding:0,cursor:'pointer',color:'var(--accent, #7694ae)',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'left'}}>
                        📎 {t.fichier_nom}
                      </button>
                      <button type="button" onClick={()=>retirer(t.id)} title="Retirer le fichier"
                        style={{background:'none',border:'none',padding:0,cursor:'pointer',color:'var(--gris, #999)',fontSize:'13px'}}>×</button>
                    </>
                  ) : (
                    <label style={{cursor:'pointer',fontSize:'12px',color:'var(--gris, #888)',whiteSpace:'nowrap'}}>
                      {envoi === t.id ? 'Envoi…' : '+ Joindre un fichier'}
                      <input type="file" accept=".pdf,image/*" style={{display:'none'}}
                        onChange={e=>{ joindre(t.id, e.target.files?.[0]); e.target.value=''; }}/>
                    </label>
                  )}
                </span>
                <span className={styles.dcAmount} style={{color: t.type === 'entree' ? 'var(--vert)' : 'var(--rouge)'}}>
                  {t.type === 'entree' ? '+' : '-'}{fmt(t.montant)}
                </span>
                <button className={styles.rowDel} onClick={()=>remove(t.id)}
                  style={{opacity: t.source === 'pos' ? 0.25 : 1, cursor: t.source === 'pos' ? 'default' : 'pointer', textAlign:'right'}}>
                  ×
                </button>
              </div>
            ))}
          </div>
          );
        })()}
      </main>

      {modal && (
        <div className={styles.overlay} onClick={()=>setModal(false)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nouvelle transaction</h2>
              <button className={styles.modalClose} onClick={()=>setModal(false)}>✕</button>
            </div>
            <form onSubmit={submit} className={styles.modalBody}>
              <div className={styles.typeToggle}>
                <button type="button"
                  className={`${styles.typeBtn} ${form.type==='sortie' ? styles.typeBtnDepense : ''}`}
                  onClick={()=>setForm(p=>({...p, type:'sortie'}))}>
                  ↓ Sortie caisse
                </button>
                <button type="button"
                  className={`${styles.typeBtn} ${form.type==='entree' ? styles.typeBtnVirement : ''}`}
                  onClick={()=>setForm(p=>({...p, type:'entree'}))}>
                  ↑ Entrée caisse
                </button>
              </div>
              <div className={styles.mf}>
                <label>Date</label>
                <input type="date" value={form.date_transaction}
                  onChange={e=>setForm(p=>({...p, date_transaction:e.target.value}))} required/>
              </div>
              <div className={styles.mf}>
                <label>Description</label>
                <input value={form.description}
                  onChange={e=>setForm(p=>({...p, description:e.target.value}))}
                  placeholder={form.type==='sortie' ? 'Ex: Monnaie, achat espèces…' : 'Ex: Dépôt banque, fond de caisse…'}
                  required/>
              </div>
              <div className={styles.mf}>
                <label>Montant (CHF)</label>
                <input type="number" min="0" step="0.05" value={form.montant}
                  onChange={e=>setForm(p=>({...p, montant:e.target.value}))}
                  placeholder="0.00" required/>
              </div>
              <div className={styles.mf}>
                <label>Justificatif <span style={{fontWeight:'normal',opacity:.6}}>(facultatif · PDF ou photo)</span></label>
                <input type="file" accept=".pdf,image/*" onChange={e=>setFichier(e.target.files?.[0] || null)}/>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={()=>setModal(false)}>Annuler</button>
                <button type="submit" className={styles.btnSubmit}
                  style={{background: form.type==='sortie' ? 'var(--rouge)' : 'var(--vert)'}}>
                  {form.type==='sortie' ? 'Enregistrer la sortie' : 'Enregistrer l\'entrée'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
