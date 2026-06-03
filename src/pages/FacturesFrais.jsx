import { useState, useEffect, useRef } from 'react';
import styles from './FacturesFrais.module.css';

const API = import.meta.env.VITE_API_URL || '/mkt';
const token = () => localStorage.getItem('mkt_token');
const auth  = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (dt) => new Date(dt).toLocaleDateString('fr-CH', { day:'2-digit', month:'2-digit', year:'numeric' });
const isImg = (m) => m?.startsWith('image/');

export default function FacturesFrais({ user, onBack, onLogout }) {
  const [invoices,  setInvoices]  = useState([]);
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [file,      setFile]      = useState(null);
  const [form,      setForm]      = useState({ description:'', montant:'', categorie:'' });
  const [filters,   setFilters]   = useState({ dateDebut:'', dateFin:'', categorie:'', sort:'date_desc' });
  const [newCat,    setNewCat]    = useState('');
  const [showCats,  setShowCats]  = useState(false);
  const fileRef = useRef();

  const toast$ = (txt, ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null), 3500); };

  /* ── Chargement ── */
  const loadCats = async () => {
    const r = await fetch(`${API}/invoices/categories`, { headers: auth() });
    setCats(await r.json());
  };

  const loadInvoices = async (f = filters) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (f.dateDebut)  p.set('dateDebut',  f.dateDebut);
      if (f.dateFin)    p.set('dateFin',    f.dateFin);
      if (f.categorie)  p.set('categorie',  f.categorie);
      if (f.sort)       p.set('sort',       f.sort);
      const r = await fetch(`${API}/invoices?${p}`, { headers: auth(), cache: 'no-store' });
      setInvoices(await r.json());
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCats(); loadInvoices(); }, []);

  /* ── Filtres ── */
  const setFilter = (key, val) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    loadInvoices(next);
  };

  const clearFilters = () => {
    const reset = { dateDebut:'', dateFin:'', categorie:'', sort:'date_desc' };
    setFilters(reset);
    loadInvoices(reset);
  };

  /* ── Upload ── */
  const handleFile = (f) => {
    if (!f) return;
    if (!['application/pdf','image/jpeg','image/png'].includes(f.type)) { toast$('PDF, JPEG ou PNG uniquement', false); return; }
    if (f.size > 20*1024*1024) { toast$('Max 20 MB', false); return; }
    setFile(f);
  };

  const upload = async () => {
    if (!file) { toast$('Sélectionnez un fichier', false); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('description', form.description);
      fd.append('montant', form.montant);
      fd.append('categorie', form.categorie);
      fd.append('user_id', user?.id || '');
      const r = await fetch(`${API}/invoices/upload`, { method:'POST', headers: auth(), body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erreur || 'Erreur');
      toast$('Facture uploadée ✓');
      setFile(null); setForm({ description:'', montant:'', categorie:'' });
      loadInvoices();
    } catch(e) { toast$(e.message, false); }
    finally { setUploading(false); }
  };

  /* ── Catégories ── */
  const addCat = async () => {
    if (!newCat.trim()) return;
    const r = await fetch(`${API}/invoices/categories`, { method:'POST', headers:{...auth(),'Content-Type':'application/json'}, body: JSON.stringify({nom:newCat.trim()}) });
    if (r.ok) { setNewCat(''); await loadCats(); toast$('Catégorie ajoutée'); }
  };

  const delCat = async (id) => {
    await fetch(`${API}/invoices/categories/${id}`, { method:'DELETE', headers: auth() });
    await loadCats();
    toast$('Catégorie supprimée');
  };

  /* ── Suppression facture ── */
  const del = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    await fetch(`${API}/invoices/${id}`, { method:'DELETE', headers: auth() });
    toast$('Supprimée');
    loadInvoices();
  };

  const totalMontant = invoices.reduce((s, i) => s + parseFloat(i.montant || 0), 0);

  const SORT_OPTS = [
    { val:'date_desc',    lbl:'Date (récent)' },
    { val:'date_asc',     lbl:'Date (ancien)' },
    { val:'categorie',    lbl:'Catégorie' },
    { val:'montant_desc', lbl:'Montant' },
  ];

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast} style={{background:toast.ok?'#5a8a52':'#c0756e'}}>{toast.ok?'✓':'⚠'} {toast.txt}</div>}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rose,#c4737c)" strokeWidth="1.3" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <div>
            <p className={styles.headerSub}>Rubis SPA</p>
            <h1 className={styles.headerTitle}>Factures frais</h1>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.navSecondary} onClick={onBack}>← Accueil</button>
          <button className={styles.navSecondary} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>

        {/* ── Upload + Catégories ── */}
        <div className={styles.uploadCard}>
          <p className={styles.sectionLabel}>Ajouter une facture</p>

          <div className={styles.dropZone}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
            onClick={()=>fileRef.current?.click()}
            style={{borderColor:dragOver?'#c4737c':file?'#6b8a5e':'#e0d8d7', background:file?'#f5faf3':dragOver?'#fdf0f1':'#fff'}}>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
            {file ? (
              <div className={styles.filePreview}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b8a5e" strokeWidth="1.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size/1024).toFixed(0)} KB</span>
                <button onClick={e=>{e.stopPropagation();setFile(null);}} className={styles.clearFile}>✕</button>
              </div>
            ) : (
              <div className={styles.dropHint}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c4737c" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Glissez un fichier ou <strong>cliquez pour parcourir</strong></span>
                <span className={styles.dropSub}>PDF, JPEG, PNG — max 20 MB</span>
              </div>
            )}
          </div>

          <div className={styles.fields}>
            <div className={styles.field} style={{flex:2}}>
              <label>Description</label>
              <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Matériel, abonnement…"/>
            </div>
            <div className={styles.field}>
              <label>Catégorie</label>
              <select value={form.categorie} onChange={e=>setForm(p=>({...p,categorie:e.target.value}))}>
                <option value="">— Sans catégorie —</option>
                {cats.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div className={styles.field} style={{maxWidth:'120px'}}>
              <label>Montant CHF</label>
              <input type="number" min="0" step="0.05" value={form.montant} onChange={e=>setForm(p=>({...p,montant:e.target.value}))} placeholder="0.00"/>
            </div>
          </div>

          <div className={styles.uploadFooter}>
            <button className={styles.btnGhost} onClick={()=>setShowCats(s=>!s)}>
              ⚙ {showCats ? 'Fermer catégories' : 'Gérer catégories'}
            </button>
            <button className={styles.uploadBtn} onClick={upload} disabled={!file||uploading}>
              {uploading ? 'Upload…' : '↑ Envoyer'}
            </button>
          </div>

          {showCats && (
            <div className={styles.catsPanel}>
              <p className={styles.catsPanelTitle}>Catégories</p>
              <div className={styles.catsList}>
                {cats.map(c=>(
                  <div key={c.id} className={styles.catItem}>
                    <span>{c.nom}</span>
                    <button onClick={()=>delCat(c.id)} className={styles.catDel}>✕</button>
                  </div>
                ))}
              </div>
              <div className={styles.catAdd}>
                <input value={newCat} onChange={e=>setNewCat(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addCat()}
                  placeholder="Nouvelle catégorie…"/>
                <button onClick={addCat} className={styles.catAddBtn}>+ Ajouter</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Filtres ── */}
        <div className={styles.filtersBar}>
          <div className={styles.filterGroup}>
            <label>Du</label>
            <input type="date" value={filters.dateDebut} onChange={e=>setFilter('dateDebut',e.target.value)}/>
          </div>
          <div className={styles.filterGroup}>
            <label>Au</label>
            <input type="date" value={filters.dateFin} onChange={e=>setFilter('dateFin',e.target.value)}/>
          </div>
          <div className={styles.filterGroup}>
            <label>Catégorie</label>
            <select value={filters.categorie} onChange={e=>setFilter('categorie',e.target.value)}>
              <option value="">Toutes</option>
              {cats.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Trier par</label>
            <select value={filters.sort} onChange={e=>setFilter('sort',e.target.value)}>
              {SORT_OPTS.map(o=><option key={o.val} value={o.val}>{o.lbl}</option>)}
            </select>
          </div>
          {(filters.dateDebut||filters.dateFin||filters.categorie) && (
            <button className={styles.clearBtn} onClick={clearFilters}>✕ Effacer</button>
          )}
        </div>

        {/* ── Résumé ── */}
        <div className={styles.summary}>
          <span className={styles.summaryCount}>{invoices.length} facture{invoices.length!==1?'s':''}</span>
          {totalMontant>0 && <span className={styles.summaryTotal}>Total : <strong>{totalMontant.toFixed(2)} CHF</strong></span>}
        </div>

        {/* ── Liste ── */}
        {loading ? <p className={styles.empty}>Chargement…</p> : !invoices.length ? <p className={styles.empty}>Aucune facture trouvée</p> : (
          <div className={styles.list}>
            {invoices.map(inv=>(
              <div key={inv.id} className={styles.invoiceRow}>
                <div className={styles.invoiceIcon}>
                  {isImg(inv.mimetype)
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4737c" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4737c" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  }
                </div>
                <div className={styles.invoiceInfo}>
                  <p className={styles.invoiceName}>{inv.original_name}</p>
                  <p className={styles.invoiceMeta}>
                    {inv.prenom} {inv.nom} · {fmt(inv.created_at)}
                    {inv.description && ` · ${inv.description}`}
                  </p>
                  {inv.categorie && <span className={styles.catBadge}>{inv.categorie}</span>}
                </div>
                {inv.montant && <span className={styles.invoiceMontant}>{parseFloat(inv.montant).toFixed(2)} CHF</span>}
                <div className={styles.invoiceActions}>
                  <a href={`${API}/invoices/${inv.id}/file`} target="_blank" rel="noreferrer" className={styles.btnView}>Voir</a>
                  <button className={styles.btnDel} onClick={()=>del(inv.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
