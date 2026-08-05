import { useState, useEffect } from 'react';
import { getCaisse, addCaisse, deleteCaisse } from '../api';
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
    await addCaisse({ ...form, montant: parseFloat(form.montant) });
    toast$(`${form.type === 'entree' ? 'Entrée' : 'Sortie'} enregistrée ✓`);
    setModal(false);
    setForm({ date_transaction:today(), description:'', type:'sortie', montant:'' });
    load();
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

        <div className={styles.soldeCard}>
          <p className={styles.soldeLabel}>Solde en caisse</p>
          <p className={styles.soldeVal} style={{color: solde >= 0 ? 'var(--vert)' : 'var(--rouge)'}}>
            {fmt(solde)}
          </p>
          <div className={styles.soldeMeta}>
            <span className={styles.soldeCredit}>↑ {fmt(entrees)} entrées</span>
            <span className={styles.soldeDebit}>↓ {fmt(sorties)} sorties</span>
          </div>
        </div>

        {loading && <Skeleton rows={4}/>}
        {!loading && transactions.length === 0 && (
          <p className={styles.empty}>Aucune transaction. Les paiements cash du POS apparaîtront ici automatiquement.</p>
        )}

        {!loading && transactions.length > 0 && (
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <span>Date</span><span>Description</span><span>Source</span><span style={{textAlign:'right'}}>Montant</span><span/>
            </div>
            {transactions.map(t => (
              <div key={t.id} className={`${styles.row} ${t.type === 'entree' ? styles.rowVirement : styles.rowDepense}`}>
                <span className={styles.rowDate}>{fmtDate(t.date_transaction)}</span>
                <span className={styles.rowDesc}>{t.description}</span>
                <span className={styles.rowAuteur}>
                  {t.source === 'pos'
                    ? <span style={{fontSize:'11px',background:'var(--vert-lt)',color:'var(--vert)',padding:'2px 6px',borderRadius:'4px',fontWeight:500}}>POS</span>
                    : t.auteur_prenom || '—'
                  }
                </span>
                <span className={styles.rowMontant} style={{color: t.type === 'entree' ? 'var(--vert)' : 'var(--rouge)'}}>
                  {t.type === 'entree' ? '+' : '-'}{fmt(t.montant)}
                </span>
                <button className={styles.rowDel} onClick={()=>remove(t.id)}
                  style={{opacity: t.source === 'pos' ? 0.25 : 1, cursor: t.source === 'pos' ? 'default' : 'pointer'}}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
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
