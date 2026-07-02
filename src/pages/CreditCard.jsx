import { useState, useEffect } from 'react';
import { getTransactions, addTransaction, deleteTransaction, addInvoiceJSON,
         getAbonnements, addAbonnement, toggleAbonnement, deleteAbonnement } from '../api';
import styles from './CreditCard.module.css';

const fmt = (n) => new Intl.NumberFormat('fr-CH',{style:'currency',currency:'CHF'}).format(n);
const today = () => new Date().toISOString().slice(0,10);

const CATS_PRINC = ["Mine d'or", 'Rubis Spa'];
const SOUS_CATS  = ['Produits soins','Consommables','Matériel','Marketing'];

const makeForm = () => ({ date_transaction:today(), description:'', type:'depense', montant:'',
  categorie_principale:'', sous_categorie:'', est_abonnement:false, date_debut_abo:'' });

export default function CreditCard({ user, onBack, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [abonnements,  setAbonnements]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [toast,    setToast]    = useState(null);
  const [form,     setForm]     = useState(makeForm());
  const [saving,   setSaving]   = useState(false);

  const toast$ = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([getTransactions(), getAbonnements()]);
    setTransactions(Array.isArray(t)?t:[]);
    setAbonnements(Array.isArray(a)?a:[]);
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const solde = transactions.reduce((acc,t) => t.type==='virement' ? acc+parseFloat(t.montant) : acc-parseFloat(t.montant), 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description||!form.montant) return;
    setSaving(true);
    try {
      if (form.est_abonnement && form.sous_categorie === 'Marketing') {
        await addAbonnement({
          description: form.description,
          montant: parseFloat(form.montant),
          categorie_principale: form.categorie_principale || null,
          sous_categorie: form.sous_categorie,
          date_debut: form.date_debut_abo || form.date_transaction,
        });
        await addInvoiceJSON({
          description: '[Abo] ' + form.description,
          montant: parseFloat(form.montant),
          date_facture: form.date_debut_abo || form.date_transaction,
          categorie: 'Carte de crédit',
          source: 'carte_credit',
          user_id: user?.id || null,
        }).catch(()=>{});
        toast$('Abonnement créé ✓');
      } else {
        await addTransaction({
          date_transaction: form.date_transaction,
          description: form.description,
          type: form.type,
          montant: parseFloat(form.montant),
          categorie_principale: form.categorie_principale || null,
          sous_categorie: form.sous_categorie || null,
        });
        if (form.type === 'depense') {
          await addInvoiceJSON({
            description: form.description,
            montant: parseFloat(form.montant),
            date_facture: form.date_transaction,
            categorie: 'Carte de crédit',
            source: 'carte_credit',
            user_id: user?.id || null,
          }).catch(()=>{});
        }
        toast$(`${form.type==='virement'?'Virement':'Dépense'} ajouté·e ✓`);
      }
      setModal(false);
      setForm(makeForm());
      load();
    } catch(err) { toast$(err.message||'Erreur', false); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cette ligne ?')) return;
    await deleteTransaction(id);
    toast$('Supprimé');
    load();
  };

  const toggleAbo = async (id) => {
    await toggleAbonnement(id);
    load();
  };

  const delAbo = async (id) => {
    if (!window.confirm('Supprimer cet abonnement ? Les transactions passées restent.')) return;
    await deleteAbonnement(id);
    toast$('Abonnement supprimé');
    load();
  };

  const soldeColor = solde >= 0 ? 'var(--vert)' : 'var(--rouge)';

  const catTag = (t) => {
    if (!t.categorie_principale && !t.sous_categorie) return null;
    return [t.categorie_principale, t.sous_categorie].filter(Boolean).join(' › ');
  };

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

        {/* Abonnements actifs */}
        {abonnements.length > 0 && (
          <div style={{marginBottom:'24px'}}>
            <p className={styles.soldeLabel} style={{textAlign:'left',marginBottom:'8px',fontSize:'11px'}}>
              Abonnements récurrents
            </p>
            <div className={styles.list}>
              <div className={styles.listHeader} style={{gridTemplateColumns:'110px 1fr 70px 150px 56px'}}>
                <span>Depuis</span><span>Description</span>
                <span style={{textAlign:'center'}}>Statut</span>
                <span style={{textAlign:'right'}}>Mensuel</span>
                <span/>
              </div>
              {abonnements.map(a => (
                <div key={a.id} className={styles.row}
                  style={{gridTemplateColumns:'110px 1fr 70px 150px 56px',opacity:a.actif?1:.55}}>
                  <span className={styles.rowDate}>
                    {new Date(a.date_debut+'T12:00').toLocaleDateString('fr-CH',{month:'short',year:'numeric'})}
                  </span>
                  <div>
                    <p className={styles.rowDesc} style={{margin:0}}>{a.description}</p>
                    {(a.categorie_principale||a.sous_categorie) && (
                      <p style={{fontSize:'10px',color:'var(--gris-lt)',margin:0}}>
                        {[a.categorie_principale,a.sous_categorie].filter(Boolean).join(' › ')}
                      </p>
                    )}
                  </div>
                  <span style={{fontSize:'11px',fontWeight:600,color:a.actif?'var(--vert)':'var(--gris-lt)',textAlign:'center'}}>
                    {a.actif ? '● Actif' : '○ Pausé'}
                  </span>
                  <span className={styles.rowMontant} style={{color:'var(--rouge)'}}>
                    -{fmt(a.montant)}/mois
                  </span>
                  <div style={{display:'flex',gap:'4px',justifyContent:'flex-end',alignItems:'center'}}>
                    <button className={styles.rowDel} title={a.actif?'Pause':'Reprendre'}
                      style={{fontSize:'13px'}} onClick={()=>toggleAbo(a.id)}>
                      {a.actif ? '⏸' : '▶'}
                    </button>
                    <button className={styles.rowDel} onClick={()=>delAbo(a.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <div>
                  <p className={styles.rowDesc} style={{margin:0}}>{t.description}</p>
                  {catTag(t) && <p style={{fontSize:'10px',color:'var(--gris-lt)',margin:0}}>{catTag(t)}</p>}
                </div>
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
        <div className={styles.overlay} onClick={()=>{ setModal(false); setForm(makeForm()); }}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nouvelle transaction</h2>
              <button className={styles.modalClose} onClick={()=>{ setModal(false); setForm(makeForm()); }}>✕</button>
            </div>
            <form onSubmit={submit} className={styles.modalBody}>
              <div className={styles.typeToggle}>
                <button type="button" className={`${styles.typeBtn} ${form.type==='depense'?styles.typeBtnDepense:''}`}
                  onClick={()=>setForm(p=>({...p,type:'depense'}))}>
                  💳 Dépense
                </button>
                <button type="button" className={`${styles.typeBtn} ${form.type==='virement'?styles.typeBtnVirement:''}`}
                  onClick={()=>setForm(p=>({...p,type:'virement',categorie_principale:'',sous_categorie:'',est_abonnement:false,date_debut_abo:''}))}>
                  ↑ Virement
                </button>
              </div>

              {/* Catégories — uniquement pour dépenses */}
              {form.type === 'depense' && (
                <div className={styles.mf}>
                  <label>Catégorie</label>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'2px'}}>
                    {CATS_PRINC.map(c=>(
                      <button key={c} type="button"
                        style={{padding:'6px 14px',border:'1.5px solid '+(form.categorie_principale===c?'var(--rose)':'var(--border)'),borderRadius:'6px',background:form.categorie_principale===c?'var(--rouge-lt)':'#fff',color:form.categorie_principale===c?'var(--rouge)':'var(--gris)',cursor:'pointer',fontSize:'13px',transition:'.15s',fontFamily:'inherit'}}
                        onClick={()=>setForm(p=>({...p,categorie_principale:p.categorie_principale===c?'':c,sous_categorie:'',est_abonnement:false,date_debut_abo:''}))}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === 'depense' && form.categorie_principale && (
                <div className={styles.mf}>
                  <label>Sous-catégorie</label>
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'2px'}}>
                    {SOUS_CATS.map(s=>(
                      <button key={s} type="button"
                        style={{padding:'5px 10px',border:'1.5px solid '+(form.sous_categorie===s?'var(--rose)':'var(--border)'),borderRadius:'4px',background:form.sous_categorie===s?'var(--rouge-lt)':'#fff',color:form.sous_categorie===s?'var(--rouge)':'var(--gris)',cursor:'pointer',fontSize:'12px',transition:'.15s',fontFamily:'inherit'}}
                        onClick={()=>setForm(p=>({...p,sous_categorie:p.sous_categorie===s?'':s,est_abonnement:false,date_debut_abo:''}))}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === 'depense' && form.sous_categorie === 'Marketing' && (
                <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'13px',color:'var(--gris)',userSelect:'none'}}>
                  <input type="checkbox" checked={form.est_abonnement}
                    onChange={e=>setForm(p=>({...p,est_abonnement:e.target.checked,date_debut_abo:p.date_debut_abo||today()}))}
                    style={{width:'16px',height:'16px',cursor:'pointer'}}/>
                  Abonnement récurrent (mensuel)
                </label>
              )}

              {form.est_abonnement ? (
                <div className={styles.mf}>
                  <label>Date de début</label>
                  <input type="date" value={form.date_debut_abo}
                    onChange={e=>setForm(p=>({...p,date_debut_abo:e.target.value}))} required/>
                  <span style={{fontSize:'11px',color:'var(--gris-lt)',marginTop:'4px',display:'block'}}>
                    Le montant sera débité automatiquement chaque mois dès cette date
                  </span>
                </div>
              ) : (
                <div className={styles.mf}>
                  <label>Date</label>
                  <input type="date" value={form.date_transaction}
                    onChange={e=>setForm(p=>({...p,date_transaction:e.target.value}))} required/>
                </div>
              )}

              <div className={styles.mf}>
                <label>Description</label>
                <input value={form.description}
                  onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                  placeholder={form.est_abonnement ? 'Ex: Adobe, Netflix, Spotify…' : form.type==='depense'?'Ex: Produits Thalgo, Fleurs…':'Ex: Virement mensuel'}
                  required/>
              </div>
              <div className={styles.mf}>
                <label>Montant (CHF)</label>
                <input type="number" min="0" step="0.01" value={form.montant}
                  onChange={e=>setForm(p=>({...p,montant:e.target.value}))} placeholder="0.00" required/>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={()=>{ setModal(false); setForm(makeForm()); }}>Annuler</button>
                <button type="submit" className={styles.btnSubmit} disabled={saving}
                  style={{background:form.est_abonnement?'var(--indigo)':form.type==='depense'?'var(--rouge)':'var(--vert)'}}>
                  {saving ? '…' : form.est_abonnement ? 'Créer abonnement' : form.type==='depense'?'Enregistrer la dépense':'Enregistrer le virement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
