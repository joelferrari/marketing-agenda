import { useState, useEffect } from 'react';
import { getTransactions, addTransaction, deleteTransaction, addInvoiceJSON } from '../api';
import styles from './CreditCard.module.css';

const fmt = (n) => new Intl.NumberFormat('fr-CH',{style:'currency',currency:'CHF'}).format(n);
const today = () => new Date().toISOString().slice(0,10);

export default function CreditCard({ user, onBack, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [toast, setToast]       = useState(null);
  const [form, setForm]         = useState({ date_transaction:today(), description:'', type:'depense', montant:'' });

  const toast$ = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true);
    const data = await getTransactions();
    setTransactions(Array.isArray(data)?data:[]);
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const solde = transactions.reduce((acc,t) => t.type==='virement' ? acc+parseFloat(t.montant) : acc-parseFloat(t.montant), 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description||!form.montant) return;
    await addTransaction({ ...form, montant: parseFloat(form.montant) });
    // Créer automatiquement une facture frais pour les dépenses
    if (form.type === 'depense') {
      await addInvoiceJSON({
        description: form.description,
        montant: parseFloat(form.montant),
        date_facture: form.date_transaction,
        categorie: 'Carte de crédit',
        source: 'carte_credit',
        user_id: user?.id || null,
      }).catch(()=>{}); // silencieux si erreur
    }
    toast$(`${form.type==='virement'?'Virement':'Dépense'} ajouté·e ✓`);
    setModal(false);
    setForm({ date_transaction:today(), description:'', type:'depense', montant:'' });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cette ligne ?')) return;
    await deleteTransaction(id);
    toast$('Supprimé');
    load();
  };

  const soldeColor = solde >= 0 ? 'var(--vert)' : 'var(--rouge)';

  return (
    <div className={styles.page}>
      {toast&&<div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.3" strokeLinecap="round" style={{flexShrink:0}}>
            <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h4"/>
          </svg>
          <div>
            <p className={styles.headerSub}>Rubis SPA</p>
            <h1 className={styles.headerTitle}>Carte de crédit</h1>
          </div>
        </div>
        <div className={styles.headerCenter}/>
        <div className={styles.headerRight}>
          <button className={styles.addBtn} onClick={()=>setModal(true)}>+ Ajouter</button>
          <button className={styles.navSecondary} onClick={onBack}>← Accueil</button>
          <button className={styles.navSecondary} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.soldeCard}>
          <p className={styles.soldeLabel}>Solde actuel</p>
          <p className={styles.soldeVal} style={{color:soldeColor}}>{fmt(solde)}</p>
          <div className={styles.soldeMeta}>
            <span className={styles.soldeDebit}>
              ↓ {fmt(transactions.filter(t=>t.type==='depense').reduce((a,t)=>a+parseFloat(t.montant),0))} dépenses
            </span>
            <span className={styles.soldeCredit}>
              ↑ {fmt(transactions.filter(t=>t.type==='virement').reduce((a,t)=>a+parseFloat(t.montant),0))} virements
            </span>
          </div>
        </div>

        {loading && <p className={styles.loading}>Chargement…</p>}
        {!loading && transactions.length===0 && <p className={styles.empty}>Aucune transaction pour l'instant.</p>}
        {!loading && transactions.length>0 && (
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <span>Date</span><span>Description</span><span>Ajouté par</span><span style={{textAlign:'right'}}>Montant</span><span/>
            </div>
            {transactions.map(t=>(
              <div key={t.id} className={`${styles.row} ${t.type==='virement'?styles.rowVirement:styles.rowDepense}`}>
                <span className={styles.rowDate}>{new Date(t.date_transaction).toLocaleDateString('fr-CH')}</span>
                <span className={styles.rowDesc}>{t.description}</span>
                <span className={styles.rowAuteur}>{t.auteur_prenom||'—'}</span>
                <span className={styles.rowMontant} style={{color:t.type==='virement'?'var(--vert)':'var(--rouge)'}}>
                  {t.type==='virement'?'+':'-'}{fmt(t.montant)}
                </span>
                <button className={styles.rowDel} onClick={()=>remove(t.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {modal&&(
        <div className={styles.overlay} onClick={()=>setModal(false)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nouvelle transaction</h2>
              <button className={styles.modalClose} onClick={()=>setModal(false)}>✕</button>
            </div>
            <form onSubmit={submit} className={styles.modalBody}>
              <div className={styles.typeToggle}>
                <button type="button" className={`${styles.typeBtn} ${form.type==='depense'?styles.typeBtnDepense:''}`} onClick={()=>setForm(p=>({...p,type:'depense'}))}>
                  💳 Dépense
                </button>
                <button type="button" className={`${styles.typeBtn} ${form.type==='virement'?styles.typeBtnVirement:''}`} onClick={()=>setForm(p=>({...p,type:'virement'}))}>
                  ↑ Virement
                </button>
              </div>
              <div className={styles.mf}>
                <label>Date</label>
                <input type="date" value={form.date_transaction} onChange={e=>setForm(p=>({...p,date_transaction:e.target.value}))} required/>
              </div>
              <div className={styles.mf}>
                <label>Description</label>
                <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder={form.type==='depense'?'Ex: Produits Thalgo, Fleurs…':'Ex: Virement mensuel'} required/>
              </div>
              <div className={styles.mf}>
                <label>Montant (CHF)</label>
                <input type="number" min="0" step="0.01" value={form.montant} onChange={e=>setForm(p=>({...p,montant:e.target.value}))} placeholder="0.00" required/>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={()=>setModal(false)}>Annuler</button>
                <button type="submit" className={styles.btnSubmit} style={{background:form.type==='depense'?'var(--rouge)':'var(--vert)'}}>
                  {form.type==='depense'?'Enregistrer la dépense':'Enregistrer le virement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
