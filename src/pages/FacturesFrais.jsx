import { useState, useEffect, useRef } from 'react';
import { getInvoices, uploadInvoice, deleteInvoice, getInvCats, addInvCat, delInvCat } from '../api';
import styles from './FacturesFrais.module.css';

const BASE = import.meta.env.VITE_API_URL || '/mkt';
const fileUrl = (id) => `${BASE}/invoices/${id}/file`;
const fmt = (dt) => new Date(dt).toLocaleDateString('fr-CH', {day:'2-digit',month:'2-digit',year:'numeric'});

const SORT_OPTS = [
  {val:'date_desc',lbl:'Date ↓'},{val:'date_asc',lbl:'Date ↑'},
  {val:'categorie',lbl:'Catégorie'},{val:'montant_desc',lbl:'Montant ↓'},
];

export default function FacturesFrais({ user, onBack, onLogout }) {
  const [invoices,  setInvoices]  = useState([]);
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [showUpload,setShowUpload]= useState(false);
  const [showCats,  setShowCats]  = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [file,      setFile]      = useState(null);
  const [form,      setForm]      = useState({description:'',montant:'',categorie:'',date_facture:''});
  const [filters,   setFilters]   = useState({dateDebut:'',dateFin:'',categorie:'',sort:'date_desc'});
  const [newCat,    setNewCat]    = useState('');
  const fileRef = useRef();

  const toast$ = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3500); };

  const loadCats     = async () => { try { const d=await getInvCats(); setCats(Array.isArray(d)?d:[]); } catch(e) { console.error(e); } };
  const loadInvoices = async (f=filters) => {
    setLoading(true);
    try {
      const p = {};
      if (f.dateDebut) p.dateDebut = f.dateDebut;
      if (f.dateFin)   p.dateFin   = f.dateFin;
      if (f.categorie) p.categorie = f.categorie;
      if (f.sort)      p.sort      = f.sort;
      const d = await getInvoices(p); setInvoices(Array.isArray(d)?d:[]);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCats(); loadInvoices(); }, []);

  const setFilter = (key, val) => {
    const next = {...filters,[key]:val};
    setFilters(next); loadInvoices(next);
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!['application/pdf','image/jpeg','image/png'].includes(f.type)) { toast$('PDF, JPEG ou PNG uniquement',false); return; }
    if (f.size > 20*1024*1024) { toast$('Max 20 MB',false); return; }
    setFile(f);
  };

  const upload = async () => {
    if (!file) { toast$('Sélectionnez un fichier',false); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',file);
      fd.append('description',form.description);
      fd.append('montant',form.montant);
      fd.append('date_facture',form.date_facture);
      fd.append('categorie',form.categorie);
      fd.append('user_id',user?.id||'');
      const d = await uploadInvoice(fd);
      if (d.erreur) throw new Error(d.erreur);
      toast$('Facture uploadée ✓');
      setFile(null); setForm({description:'',montant:'',categorie:'',date_facture:''}); setShowUpload(false);
      loadInvoices();
    } catch(e) { toast$(e.message,false); }
    finally { setUploading(false); }
  };

  const doAddCat = async () => {
    if (!newCat.trim()) return;
    try {
      const d = await addInvCat(newCat.trim());
      if (d.erreur) throw new Error(d.erreur);
      setNewCat(''); await loadCats(); toast$('Catégorie ajoutée');
    } catch(e) { toast$(e.message||'Erreur',false); }
  };

  const doDelCat = async (id) => {
    await delInvCat(id); await loadCats(); toast$('Supprimée');
  };

  const doDelInvoice = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    await deleteInvoice(id); toast$('Supprimée'); loadInvoices();
  };

  const total = invoices.reduce((s,i) => s+parseFloat(i.montant||0),0);
  const hasFilters = filters.dateDebut||filters.dateFin||filters.categorie;

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.3" strokeLinecap="round" style={{flexShrink:0}}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <div><p className={styles.headerSub}>Rubis SPA</p><h1 className={styles.headerTitle}>Factures frais</h1></div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.navSecondary} onClick={()=>setShowCats(s=>!s)}>⚙ Catégories</button>
          <button className={styles.addBtn} onClick={()=>setShowUpload(true)}>+ Ajouter</button>
          <button className={styles.navSecondary} onClick={onBack}>← Accueil</button>
          <button className={styles.navSecondary} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>

        </div>

        {/* Gestion catégories */}
        {showCats && (
          <div className={styles.catsCard}>
            <p className={styles.catsTitle}>Catégories personnalisées</p>
            <div className={styles.catsList}>
              {cats.map(c=>(
                <div key={c.id} className={styles.catItem}>
                  <span>{c.nom}</span>
                  <button className={styles.catDel} onClick={()=>doDelCat(c.id)}>✕</button>
                </div>
              ))}
              {cats.length===0 && <span className={styles.catsEmpty}>Aucune catégorie</span>}
            </div>
            <div className={styles.catAdd}>
              <input value={newCat} onChange={e=>setNewCat(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&doAddCat()}
                placeholder="Nom de la nouvelle catégorie…"
                className={styles.catInput}/>
              <button className={styles.catAddBtn} onClick={doAddCat}>+ Ajouter</button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className={styles.filtersCard}>
          <div className={styles.filtersRow}>
            <div className={styles.mf}><label>Du</label>
              <input type="date" value={filters.dateDebut} onChange={e=>setFilter('dateDebut',e.target.value)}/>
            </div>
            <div className={styles.mf}><label>Au</label>
              <input type="date" value={filters.dateFin} onChange={e=>setFilter('dateFin',e.target.value)}/>
            </div>
            <div className={styles.mf}><label>Catégorie</label>
              <select value={filters.categorie} onChange={e=>setFilter('categorie',e.target.value)}>
                <option value="">Toutes</option>
                {cats.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div className={styles.mf}><label>Trier par</label>
              <select value={filters.sort} onChange={e=>setFilter('sort',e.target.value)}>
                {SORT_OPTS.map(o=><option key={o.val} value={o.val}>{o.lbl}</option>)}
              </select>
            </div>
            {hasFilters && <button className={styles.clearBtn} onClick={()=>{const r={dateDebut:'',dateFin:'',categorie:'',sort:'date_desc'};setFilters(r);loadInvoices(r);}}>✕ Effacer</button>}
            <div style={{flex:1}}/>
            <div className={styles.filterTotal}>
              <span>{invoices.length} facture{invoices.length!==1?'s':''}</span>
              {total>0&&<strong style={{color:'var(--rouge)'}}>{total.toFixed(2)} CHF</strong>}
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? <p className={styles.loading}>Chargement…</p> : (
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <span>Date</span><span>Fichier</span><span>Catégorie</span><span>Description</span><span style={{textAlign:'right'}}>Montant</span><span></span>
            </div>
            {!invoices.length && <p className={styles.empty}>Aucune facture trouvée</p>}
            {invoices.map(inv=>(
              <div key={inv.id} className={styles.row}>
                <span className={styles.rowDate}>{fmt(inv.created_at)}</span>
                <a href={fileUrl(inv.id)} target="_blank" rel="noreferrer" className={styles.rowFile}>
                  {inv.mimetype?.startsWith('image/')
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  }
                  {inv.original_name}
                </a>
                <span className={styles.rowCat}>{inv.categorie||'—'}</span>
                <span className={styles.rowDesc}>{inv.description||<em style={{color:'var(--gris-lt)'}}>—</em>}</span>
                <span className={styles.rowMontant} style={{color:inv.montant?'var(--rouge)':'var(--gris-lt)'}}>
                  {inv.montant ? `${parseFloat(inv.montant).toFixed(2)} CHF` : '—'}
                </span>
                <button className={styles.rowDel} onClick={()=>doDelInvoice(inv.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal upload */}
      {showUpload && (
        <div className={styles.overlay} onClick={()=>setShowUpload(false)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Ajouter une facture</span>
              <button className={styles.modalClose} onClick={()=>setShowUpload(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {/* Drop zone */}
              <div className={styles.dropZone}
                style={{borderColor:dragOver?'var(--rose)':file?'var(--vert)':'var(--border)',background:dragOver?'#fdf0f1':file?'#f3f8f0':'#fff'}}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
                {file ? (
                  <div className={styles.filePreview}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--vert)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className={styles.fileName}>{file.name}</span>
                    <button onClick={e=>{e.stopPropagation();setFile(null);}} className={styles.clearFile}>✕</button>
                  </div>
                ) : (
                  <div className={styles.dropHint}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.3" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Glissez ou <strong>cliquez pour parcourir</strong></span>
                    <span className={styles.dropSub}>PDF, JPEG, PNG — max 20 MB</span>
                  </div>
                )}
              </div>
              {/* Champs */}
              <div className={styles.mf}><label>Date de facture</label>
                <input type="date" value={form.date_facture} onChange={e=>setForm(p=>({...p,date_facture:e.target.value}))}/>
              </div>
              <div className={styles.mf}><label>Catégorie</label>
                <select value={form.categorie} onChange={e=>setForm(p=>({...p,categorie:e.target.value}))}>
                  <option value="">— Sans catégorie —</option>
                  {cats.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
                </select>
              </div>
              <div className={styles.mf}><label>Description</label>
                <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Matériel, abonnement, impression…"/>
              </div>
              <div className={styles.mf}><label>Montant CHF</label>
                <input type="number" min="0" step="0.05" value={form.montant} onChange={e=>setForm(p=>({...p,montant:e.target.value}))} placeholder="0.00"/>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={()=>setShowUpload(false)}>Annuler</button>
              <button className={styles.btnSubmit} style={{background:'var(--rose)'}} onClick={upload} disabled={!file||uploading}>
                {uploading?'Upload…':'↑ Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
