import { useState, useEffect } from 'react';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, addInvoiceJSON,
         getAbonnements, addAbonnement, toggleAbonnement, deleteAbonnement,
         getInvCats, addInvCat, delInvCat } from '../api';
import Skeleton from '../components/Skeleton';
import styles from './CreditCard.module.css';

const fmt = (n) => new Intl.NumberFormat('fr-CH',{style:'currency',currency:'CHF'}).format(n);
const today = () => new Date().toISOString().slice(0,10);

const ENTITES = ["Mined'or", 'Rubis Spa'];

const makeForm = () => ({
  date_transaction: today(), description: '', type: 'depense', montant: '',
  categorie_principale: '', sous_categorie: '', entite: '', est_abonnement: false, date_debut_abo: '',
});

export default function CreditCard({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [abonnements,  setAbonnements]  = useState([]);
  const [cats,         setCats]         = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [showCats, setShowCats] = useState(false);
  const [newCat,   setNewCat]   = useState('');
  const [toast,    setToast]    = useState(null);
  const [form,     setForm]     = useState(makeForm());
  const [saving,   setSaving]   = useState(false);

  const toast$ = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const loadCats = async () => {
    try { const d = await getInvCats(); setCats(Array.isArray(d)?d:[]); } catch{}
  };

  const load = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([getTransactions(), getAbonnements()]);
    setTransactions(Array.isArray(t)?t:[]);
    setAbonnements(Array.isArray(a)?a:[]);
    setLoading(false);
  };

  useEffect(()=>{ load(); loadCats(); },[]);

  const solde = transactions.reduce((acc,t) => t.type==='virement' ? acc+parseFloat(t.montant) : acc-parseFloat(t.montant), 0);

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      date_transaction: t.date_transaction?.slice(0,10) || today(),
      description: t.description || '',
      type: t.type || 'depense',
      montant: t.montant ? String(t.montant) : '',
      categorie_principale: t.categorie_principale || '',
      sous_categorie: t.sous_categorie || '',
      entite: t.entite || '',
      est_abonnement: false,
      date_debut_abo: '',
    });
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setForm(makeForm()); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description||!form.montant) return;
    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, {
          date_transaction: form.date_transaction,
          description: form.description,
          type: editing.type,
          montant: parseFloat(form.montant),
          categorie_principale: form.categorie_principale || null,
          sous_categorie: form.sous_categorie || null,
          entite: form.entite || null,
        });
        toast$('Transaction modifiée ✓');
      } else if (form.est_abonnement) {
        await addAbonnement({
          description: form.description,
          montant: parseFloat(form.montant),
          categorie_principale: form.categorie_principale || null,
          sous_categorie: form.sous_categorie || null,
          date_debut: form.date_debut_abo || form.date_transaction,
        });
        await addInvoiceJSON({
          description: '[Abo] ' + form.description,
          montant: parseFloat(form.montant),
          date_facture: form.date_debut_abo || form.date_transaction,
          categorie: form.categorie_principale || null,
          entite: form.entite || null,
          source: 'carte_credit',
          user_id: user?.id || null,
        }).catch(()=>{});
        toast$('Abonnement créé ✓');
      } else {
        const tx = await addTransaction({
          date_transaction: form.date_transaction,
          description: form.description,
          type: form.type,
          montant: parseFloat(form.montant),
          categorie_principale: form.categorie_principale || null,
          sous_categorie: form.sous_categorie || null,
          entite: form.entite || null,
        });
        if (form.type === 'depense') {
          await addInvoiceJSON({
            description: form.description,
            montant: parseFloat(form.montant),
            date_facture: form.date_transaction,
            categorie: form.categorie_principale || null,
            entite: form.entite || null,
            transaction_id: tx?.id || null,
            source: 'carte_credit',
            user_id: user?.id || null,
          }).catch(()=>{});
        }
        toast$(`${form.type==='virement'?'Virement':'Dépense'} ajouté·e ✓`);
      }
      closeModal();
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

  const toggleAbo = async (id) => { await toggleAbonnement(id); load(); };

  const delAbo = async (id) => {
    if (!window.confirm('Supprimer cet abonnement ? Les transactions passées restent.')) return;
    await deleteAbonnement(id);
    toast$('Abonnement supprimé');
    load();
  };

  const doAddCat = async () => {
    if (!newCat.trim()) return;
    try { await addInvCat(newCat.trim()); setNewCat(''); await loadCats(); toast$('Catégorie ajoutée'); }
    catch(e) { toast$(e.message||'Erreur',false); }
  };

  const doDelCat = async (id) => { await delInvCat(id); await loadCats(); };

  const soldeColor = solde >= 0 ? 'var(--vert)' : 'var(--rouge)';

  const catTag = (t) => [t.categorie_principale, t.sous_categorie].filter(Boolean).join(' › ');

  return (
    <>
      {toast&&<div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}

      <main className={styles.main}>

        <div className={styles.toolbar}>
          <div/>
          <div className={styles.toolbarGroup}>
            <button className={styles.navSecondary} onClick={()=>setShowCats(s=>!s)}>{"⚙ Catégories"}</button>
            <button className={styles.addBtn} onClick={()=>{ setEditing(null); setForm(makeForm()); setModal(true); }}>{"+ Ajouter"}</button>
          </div>
        </div>

        {showCats && (
          <div className={styles.catsPanel}>
            <p className={styles.catsTitle}>{"Catégories partagées (Carte de crédit & Factures)"}</p>
            <div className={styles.catsList}>
              {cats.map(c => (
                <div key={c.id} className={styles.catItem}>
                  <span>{c.nom}</span>
                  <button className={styles.catDel} onClick={()=>doDelCat(c.id)}>{"✕"}</button>
                </div>
              ))}
              {cats.length===0 && <span className={styles.catsEmpty}>{"Aucune catégorie"}</span>}
            </div>
            <div className={styles.catAdd}>
              <input className={styles.catInput} value={newCat} onChange={e=>setNewCat(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&doAddCat()} placeholder={"Nouvelle catégorie…"}/>
              <button className={styles.catAddBtn} onClick={doAddCat}>{"+ Ajouter"}</button>
            </div>
          </div>
        )}

        <div className={styles.dcSummary}>
          <div className={styles.dcPill}>
            <div className={styles.dcPillLabel}>{"Solde actuel"}</div>
            <div className={styles.dcPillVal} style={{color:soldeColor}}>{fmt(solde)}</div>
            <div className={styles.dcPillMeta}>
              <span style={{color:'var(--rouge)'}}>
                {"↓ "}{fmt(transactions.filter(t=>t.type==='depense').reduce((a,t)=>a+parseFloat(t.montant),0))}{" dépenses"}
              </span>
              <span style={{color:'var(--vert)'}}>
                {"↑ "}{fmt(transactions.filter(t=>t.type==='virement').reduce((a,t)=>a+parseFloat(t.montant),0))}{" virements"}
              </span>
            </div>
          </div>
          <div className={styles.dcInfo}>
            <div className={styles.dcInfoText}>{"Chaque dépense crée automatiquement une facture dans "}<strong>{"Factures frais"}</strong>{" (catégorie « Carte de crédit »)."}</div>
            <button className={styles.dcBtn} onClick={()=>{ setEditing(null); setForm(makeForm()); setModal(true); }}>{"+ Ajouter"}</button>
          </div>
        </div>

        {abonnements.length > 0 && (
          <div style={{marginBottom:'24px'}}>
            <p className={styles.dcSectionLabel}>{"Abonnements récurrents"}</p>
            <div className={styles.dcTable}>
              <div className={styles.dcHead} style={{gridTemplateColumns:'95px 1fr 90px 110px 70px'}}>
                <span>{"Depuis"}</span><span>{"Description"}</span>
                <span style={{textAlign:'center'}}>{"Statut"}</span>
                <span style={{textAlign:'right'}}>{"Mensuel"}</span>
                <span/>
              </div>
              {abonnements.map(a => (
                <div key={a.id} className={styles.dcRow}
                  style={{gridTemplateColumns:'95px 1fr 90px 110px 70px',opacity:a.actif?1:.55}}>
                  <span className={styles.dcDate}>
                    {new Date(a.date_debut+'T12:00').toLocaleDateString('fr-CH',{month:'short',year:'numeric'})}
                  </span>
                  <div>
                    <p className={styles.dcName} style={{margin:0}}>{a.description}</p>
                    {catTag(a) && <span className={styles.dcCat} style={{marginTop:'4px'}}>{catTag(a)}</span>}
                  </div>
                  <span style={{fontSize:'11px',fontWeight:600,color:a.actif?'var(--vert)':'var(--gris-lt)',textAlign:'center'}}>
                    {a.actif ? '● Actif' : '○ Pausé'}
                  </span>
                  <span className={styles.dcAmount} style={{color:'var(--rouge)'}}>
                    {"-"}{fmt(a.montant)}{"/mois"}
                  </span>
                  <div className={styles.dcActions}>
                    <button className={styles.dcActionBtn} title={a.actif?'Pause':'Reprendre'} onClick={()=>toggleAbo(a.id)}>
                      {a.actif ? '⏸' : '▶'}
                    </button>
                    <button className={`${styles.dcActionBtn} ${styles.dcActionBtnDel}`} onClick={()=>delAbo(a.id)}>{"×"}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <Skeleton rows={4}/>}
        {!loading && transactions.length===0 && <p className={styles.empty}>{"Aucune transaction pour l'instant."}</p>}
        {!loading && transactions.length>0 && (
          <div className={styles.dcTable}>
            <div className={styles.dcHead} style={{gridTemplateColumns:'85px 1fr 85px 100px 90px 90px 60px'}}>
              <span>{"Date"}</span><span>{"Description"}</span>
              <span>{"Entité"}</span><span>{"Catégorie"}</span>
              <span>{"Ajouté par"}</span>
              <span style={{textAlign:'right'}}>{"Montant"}</span><span/>
            </div>
            {transactions.map(t=>(
              <div key={t.id} className={styles.dcRow} style={{gridTemplateColumns:'85px 1fr 85px 100px 90px 90px 60px'}}>
                <span className={styles.dcDate}>{new Date(t.date_transaction).toLocaleDateString('fr-CH')}</span>
                <span className={styles.dcName}>{t.description}</span>
                <span style={{fontSize:'12px',color:'var(--gris)'}}>{t.entite||'—'}</span>
                <span>{catTag(t) ? <span className={styles.dcCat}>{catTag(t)}</span> : <span style={{fontSize:'12px',color:'var(--gris-lt)'}}>{"—"}</span>}</span>
                <span style={{fontSize:'12px',color:'var(--gris-lt)'}}>{t.auteur_prenom||'—'}</span>
                <span className={styles.dcAmount} style={{color:t.type==='virement'?'var(--vert)':'var(--rouge)'}}>
                  {t.type==='virement'?'+':'-'}{fmt(t.montant)}
                </span>
                <div className={styles.dcActions}>
                  <button className={styles.dcActionBtn} onClick={()=>openEdit(t)}>{"✎"}</button>
                  <button className={`${styles.dcActionBtn} ${styles.dcActionBtnDel}`} onClick={()=>remove(t.id)}>{"×"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modal&&(
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Modifier la transaction' : 'Nouvelle transaction'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>{"✕"}</button>
            </div>
            <form onSubmit={submit} className={styles.modalBody}>

              {!editing && (
                <div className={styles.typeToggle}>
                  <button type="button" className={`${styles.typeBtn} ${form.type==='depense'?styles.typeBtnDepense:''}`}
                    onClick={()=>setForm(p=>({...p,type:'depense'}))}>
                    {"💳 Dépense"}
                  </button>
                  <button type="button" className={`${styles.typeBtn} ${form.type==='virement'?styles.typeBtnVirement:''}`}
                    onClick={()=>setForm(p=>({...p,type:'virement',categorie_principale:'',sous_categorie:'',est_abonnement:false,date_debut_abo:''}))}>
                    {"↑ Virement"}
                  </button>
                </div>
              )}
              {editing && (
                <p style={{fontSize:'12px',color:'var(--gris)',margin:0}}>
                  {editing.type === 'depense' ? '💳 Dépense' : '↑ Virement'}
                </p>
              )}

              <div className={styles.mf}>
                <label>{"Entité"}</label>
                <select value={form.entite} onChange={e=>setForm(p=>({...p,entite:e.target.value}))}>
                  <option value="">{"— Non spécifiée —"}</option>
                  {ENTITES.map(e=><option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {(form.type === 'depense' || editing) && (
                <div className={styles.mf}>
                  <label>{"Catégorie"}</label>
                  <select value={form.categorie_principale}
                    onChange={e=>setForm(p=>({...p,categorie_principale:e.target.value,est_abonnement:false}))}>
                    <option value="">{"— Sans catégorie —"}</option>
                    {cats.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
                  </select>
                </div>
              )}

              {(form.type === 'depense' || editing) && form.categorie_principale && (
                <div className={styles.mf}>
                  <label>{"Sous-catégorie"}</label>
                  <select value={form.sous_categorie}
                    onChange={e=>setForm(p=>({...p,sous_categorie:e.target.value,est_abonnement:false}))}>
                    <option value="">{"— Optionnel —"}</option>
                    {cats.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
                  </select>
                </div>
              )}

              {!editing && form.type === 'depense' && (
                <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'13px',color:'var(--gris)',userSelect:'none'}}>
                  <input type="checkbox" checked={form.est_abonnement}
                    onChange={e=>setForm(p=>({...p,est_abonnement:e.target.checked,date_debut_abo:p.date_debut_abo||today()}))}
                    style={{width:'16px',height:'16px',cursor:'pointer'}}/>
                  {"Abonnement récurrent (mensuel)"}
                </label>
              )}

              {!editing && form.est_abonnement ? (
                <div className={styles.mf}>
                  <label>{"Date de début"}</label>
                  <input type="date" value={form.date_debut_abo}
                    onChange={e=>setForm(p=>({...p,date_debut_abo:e.target.value}))} required/>
                  <span style={{fontSize:'11px',color:'var(--gris-lt)',marginTop:'4px',display:'block'}}>
                    {"Le montant sera débité automatiquement chaque mois dès cette date"}
                  </span>
                </div>
              ) : (
                <div className={styles.mf}>
                  <label>{"Date"}</label>
                  <input type="date" value={form.date_transaction}
                    onChange={e=>setForm(p=>({...p,date_transaction:e.target.value}))} required/>
                </div>
              )}

              <div className={styles.mf}>
                <label>{"Description"}</label>
                <input value={form.description}
                  onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                  placeholder={form.est_abonnement ? 'Ex: Adobe, Netflix, Spotify…' : form.type==='depense'?'Ex: Produits Thalgo, Fleurs…':'Ex: Virement mensuel'}
                  required/>
              </div>
              <div className={styles.mf}>
                <label>{"Montant (CHF)"}</label>
                <input type="number" min="0" step="0.01" value={form.montant}
                  onChange={e=>setForm(p=>({...p,montant:e.target.value}))} placeholder="0.00" required/>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={closeModal}>{"Annuler"}</button>
                <button type="submit" className={styles.btnSubmit} disabled={saving}
                  style={{background: editing ? 'var(--rose)' : form.est_abonnement ? 'var(--indigo)' : form.type==='depense'?'var(--rouge)':'var(--vert)'}}>
                  {saving ? '…' : editing ? 'Enregistrer' : form.est_abonnement ? 'Créer abonnement' : form.type==='depense'?'Enregistrer la dépense':'Enregistrer le virement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
