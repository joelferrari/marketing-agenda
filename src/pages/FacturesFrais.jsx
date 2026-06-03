import { useState, useEffect, useRef } from 'react';
import {
  getInvoices, uploadInvoice, deleteInvoice, getInvCats, addInvCat, delInvCat,
  getBudget, addBudget, deleteBudget,
} from '../api';
import styles from './FacturesFrais.module.css';

const BASE     = import.meta.env.VITE_API_URL || '/mkt';
const fileUrl  = (id, type) => `${BASE}/${type === 'budget' ? 'budget' : 'invoices'}/${id}/file`;
const fmt      = (dt) => dt ? new Date(dt).toLocaleDateString('fr-CH', {day:'2-digit',month:'2-digit',year:'numeric'}) : '—';

const SORT_OPTS = [
  {val:'date_desc',lbl:'Date ↓'},{val:'date_asc',lbl:'Date ↑'},
  {val:'categorie',lbl:'Catégorie'},{val:'montant_desc',lbl:'Montant ↓'},
];
const STATUT_OPTS = ['Prévu','Confirmé','Payé','Annulé'];

// ── Export PDF ────────────────────────────────────────────────
const exportPDF = (rows, filters, tab, cats) => {
  const title   = tab === 'budget' ? 'Budget — Projections de dépenses' : 'Factures frais';
  const periode = filters.dateDebut || filters.dateFin
    ? `Période : ${filters.dateDebut||'—'} → ${filters.dateFin||'—'}`
    : 'Toutes périodes';
  const catLabel = filters.categorie ? `Catégorie : ${filters.categorie}` : '';
  const total    = rows.reduce((s,r) => s + parseFloat(r.montant||0), 0);
  const dateCol  = tab === 'budget' ? 'Date prévue' : 'Date';

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>${title}</title>
<style>
  body{font-family:Georgia,serif;color:#2a2825;margin:40px}
  h1{font-size:22px;font-weight:normal;margin-bottom:4px;color:#c4737c}
  .meta{font-size:12px;color:#9b9490;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9b9490;
     border-bottom:2px solid #e8e0de;padding:8px 10px}
  td{padding:10px;border-bottom:1px solid #f0ebe9;vertical-align:top}
  tr:hover td{background:#fdf9f8}
  .montant{text-align:right;font-weight:600;color:#c0756e}
  .cat{font-size:11px;background:#f0ebe9;padding:2px 6px;border-radius:3px}
  .total{font-size:14px;font-weight:600;color:#c0756e;text-align:right;
         margin-top:16px;padding-top:12px;border-top:2px solid #e8e0de}
  .logo{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#c4737c;margin-bottom:8px}
  @media print{body{margin:20px}}
</style></head><body>
<div class="logo">Rubis SPA</div>
<h1>${title}</h1>
<div class="meta">${periode}${catLabel ? ' · ' + catLabel : ''} · Exporté le ${new Date().toLocaleDateString('fr-CH')}</div>
<table>
  <thead><tr>
    <th>${dateCol}</th><th>Description</th><th>Catégorie</th>${tab==='budget'?'<th>Statut</th>':''}<th style="text-align:right">Montant CHF</th>
  </tr></thead>
  <tbody>
    ${rows.map(r=>`<tr>
      <td>${fmt(r.date_prevue||r.date_facture||r.created_at)}</td>
      <td>${r.description||'—'}</td>
      <td>${r.categorie?`<span class="cat">${r.categorie}</span>`:'—'}</td>
      ${tab==='budget'?`<td>${r.statut||'—'}</td>`:''}
      <td class="montant">${r.montant?parseFloat(r.montant).toFixed(2)+' CHF':'—'}</td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="total">Total : ${total.toFixed(2)} CHF</div>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
};

// ── Composant principal ───────────────────────────────────────
export default function FacturesFrais({ user, onBack, onLogout }) {
  const [tab,        setTab]       = useState('factures');
  const [invoices,   setInvoices]  = useState([]);
  const [budget,     setBudget]    = useState([]);
  const [cats,       setCats]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [uploading,  setUploading] = useState(false);
  const [toast,      setToast]     = useState(null);
  const [showUpload, setShowUpload]= useState(false);
  const [showCats,   setShowCats]  = useState(false);
  const [dragOver,   setDragOver]  = useState(false);
  const [file,       setFile]      = useState(null);
  const [form,       setForm]      = useState({description:'',montant:'',categorie:'',date_facture:'',date_prevue:'',statut:'Prévu'});
  const [filters,    setFilters]   = useState({dateDebut:'',dateFin:'',categorie:'',sort:'date_desc'});
  const [newCat,     setNewCat]    = useState('');
  const fileRef = useRef();

  const toast$    = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3500); };
  const rows      = tab === 'budget' ? budget : invoices;
  const setRows   = tab === 'budget' ? setBudget : setInvoices;
  const total     = rows.reduce((s,i) => s + parseFloat(i.montant||0), 0);
  const hasFilters = filters.dateDebut || filters.dateFin || filters.categorie;

  const loadCats = async () => {
    try { const d = await getInvCats(); setCats(Array.isArray(d) ? d : []); } catch{}
  };

  const loadData = async (f=filters, t=tab) => {
    setLoading(true);
    try {
      const p = {};
      if (f.dateDebut) p.dateDebut = f.dateDebut;
      if (f.dateFin)   p.dateFin   = f.dateFin;
      if (f.categorie) p.categorie = f.categorie;
      if (f.sort)      p.sort      = f.sort;
      const fn = t === 'budget' ? getBudget : getInvoices;
      const d  = await fn(p);
      (t === 'budget' ? setBudget : setInvoices)(Array.isArray(d) ? d : []);
    } catch { (t === 'budget' ? setBudget : setInvoices)([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCats(); loadData(); }, []);
  useEffect(() => { loadData(filters, tab); }, [tab]);

  const switchTab = (t) => { setTab(t); setFilters({dateDebut:'',dateFin:'',categorie:'',sort:'date_desc'}); };

  const setFilter = (key, val) => {
    const next = {...filters, [key]: val};
    setFilters(next); loadData(next, tab);
  };

  const clearFilters = () => {
    const r = {dateDebut:'',dateFin:'',categorie:'',sort:'date_desc'};
    setFilters(r); loadData(r, tab);
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!['application/pdf','image/jpeg','image/png'].includes(f.type)) { toast$('PDF, JPEG ou PNG',false); return; }
    if (f.size > 20*1024*1024) { toast$('Max 20 MB',false); return; }
    setFile(f);
  };

  const resetForm = () => { setFile(null); setForm({description:'',montant:'',categorie:'',date_facture:'',date_prevue:'',statut:'Prévu'}); };

  const upload = async () => {
    setUploading(true);
    try {
      let d;
      if (tab === 'budget') {
        // Budget — JSON sans fichier obligatoire
        d = await addBudget({
          description: form.description, montant: form.montant,
          categorie: form.categorie, date_prevue: form.date_prevue,
          statut: form.statut,
        });
      } else {
        if (!file) { toast$('Sélectionnez un fichier',false); setUploading(false); return; }
        const fd = new FormData();
        fd.append('file',file); fd.append('description',form.description);
        fd.append('montant',form.montant); fd.append('date_facture',form.date_facture);
        fd.append('categorie',form.categorie); fd.append('user_id',user?.id||'');
        const { uploadInvoice: up } = await import('../api');
        const r = await fetch(`${BASE}/invoices/upload`, {
          method:'POST',
          headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},
          body:fd,
        });
        d = await r.json();
      }
      if (d?.erreur) throw new Error(d.erreur);
      toast$('Enregistré ✓');
      resetForm(); setShowUpload(false); loadData(filters, tab);
    } catch(e) { toast$(e.message,false); }
    finally { setUploading(false); }
  };

  const doDelRow = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    if (tab === 'budget') await deleteBudget(id);
    else await deleteInvoice(id);
    toast$('Supprimé'); loadData(filters, tab);
  };

  const doAddCat = async () => {
    if (!newCat.trim()) return;
    try { const d = await addInvCat(newCat.trim()); if(d.erreur) throw new Error(d.erreur); setNewCat(''); await loadCats(); toast$('Catégorie ajoutée'); }
    catch(e) { toast$(e.message||'Erreur',false); }
  };

  const doDelCat = async (id) => { await delInvCat(id); await loadCats(); };

  const dateField = tab === 'budget' ? (r) => r.date_prevue : (r) => r.date_facture || r.created_at;

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
          <div>
            <p className={styles.headerSub}>Rubis SPA</p>
            <h1 className={styles.headerTitle}>Factures frais</h1>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.navSecondary} onClick={()=>setShowCats(s=>!s)}>⚙ Catégories</button>
          <button className={styles.addBtn} onClick={()=>setShowUpload(true)}>+ Ajouter</button>
          <button className={styles.navSecondary} onClick={()=>exportPDF(rows, filters, tab, cats)}>↓ PDF</button>
          <button className={styles.navSecondary} onClick={onBack}>← Accueil</button>
          <button className={styles.navSecondary} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>

        {/* Onglets */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab==='factures'?styles.tabOn:''}`} onClick={()=>switchTab('factures')}>
            Factures
          </button>
          <button className={`${styles.tab} ${tab==='budget'?styles.tabOn:''}`} onClick={()=>switchTab('budget')}>
            Budget
          </button>
        </div>

        {/* Catégories */}
        {showCats && (
          <div className={styles.catsCard}>
            <p className={styles.catsTitle}>Catégories personnalisées</p>
            <div className={styles.catsList}>
              {cats.map(c => (
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
                placeholder="Nouvelle catégorie…" className={styles.catInput}/>
              <button className={styles.catAddBtn} onClick={doAddCat}>+ Ajouter</button>
            </div>
          </div>
        )}

        {/* Filtres + Total */}
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
            {hasFilters && <button className={styles.clearBtn} onClick={clearFilters}>✕ Effacer</button>}
            <div style={{flex:1}}/>
            <div className={styles.filterTotal}>
              <span>{rows.length} ligne{rows.length!==1?'s':''}</span>
              {total>0 && <strong style={{color:'var(--rouge)'}}>{total.toFixed(2)} CHF</strong>}
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? <p className={styles.loading}>Chargement…</p> : (
          <div className={styles.list}>
            <div className={`${styles.listHeader} ${tab==='budget'?styles.listHeaderBudget:''}`}>
              <span>Date</span>
              <span>Fichier / Libellé</span>
              <span>Catégorie</span>
              <span>Description</span>
              {tab==='budget' && <span>Statut</span>}
              <span style={{textAlign:'right'}}>Montant</span>
              <span/>
            </div>
            {!rows.length && <p className={styles.empty}>Aucune ligne trouvée</p>}
            {rows.map(r => (
              <div key={r.id} className={`${styles.row} ${tab==='budget'?styles.rowBudget:''}`}>
                <span className={styles.rowDate}>{fmt(dateField(r))}</span>
                {r.filename
                  ? <a href={fileUrl(r.id,tab)} target="_blank" rel="noreferrer" className={styles.rowFile}>
                      {r.mimetype?.startsWith('image/')
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      }
                      {r.original_name}
                    </a>
                  : <span className={styles.rowDesc} style={{fontStyle:'italic',color:'var(--gris-lt)'}}>—</span>
                }
                <span className={styles.rowCat}>{r.categorie||'—'}</span>
                <span className={styles.rowDesc}>{r.description||'—'}</span>
                {tab==='budget' && <span className={styles.rowStatut} data-s={r.statut}>{r.statut||'—'}</span>}
                <span className={styles.rowMontant} style={{color:r.montant?'var(--rouge)':'var(--gris-lt)'}}>
                  {r.montant?`${parseFloat(r.montant).toFixed(2)} CHF`:'—'}
                </span>
                <button className={styles.rowDel} onClick={()=>doDelRow(r.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal ajout */}
      {showUpload && (
        <div className={styles.overlay} onClick={()=>{setShowUpload(false);resetForm();}}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{tab==='budget'?'Ajouter au budget':'Ajouter une facture'}</span>
              <button className={styles.modalClose} onClick={()=>{setShowUpload(false);resetForm();}}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {/* Drop zone — seulement pour factures */}
              {tab==='factures' && (
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
              )}
              {tab==='factures'
                ? <div className={styles.mf}><label>Date de facture</label>
                    <input type="date" value={form.date_facture} onChange={e=>setForm(p=>({...p,date_facture:e.target.value}))}/>
                  </div>
                : <div className={styles.mf}><label>Date prévue</label>
                    <input type="date" value={form.date_prevue} onChange={e=>setForm(p=>({...p,date_prevue:e.target.value}))}/>
                  </div>
              }
              <div className={styles.mf}><label>Catégorie</label>
                <select value={form.categorie} onChange={e=>setForm(p=>({...p,categorie:e.target.value}))}>
                  <option value="">— Sans catégorie —</option>
                  {cats.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
                </select>
              </div>
              <div className={styles.mf}><label>Description</label>
                <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Matériel, abonnement…"/>
              </div>
              {tab==='budget' && (
                <div className={styles.mf}><label>Statut</label>
                  <select value={form.statut} onChange={e=>setForm(p=>({...p,statut:e.target.value}))}>
                    {STATUT_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.mf}><label>Montant CHF</label>
                <input type="number" min="0" step="0.05" value={form.montant} onChange={e=>setForm(p=>({...p,montant:e.target.value}))} placeholder="0.00"/>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={()=>{setShowUpload(false);resetForm();}}>Annuler</button>
              <button className={styles.btnSubmit} style={{background:'var(--rose)'}} onClick={upload} disabled={uploading}>
                {uploading?'…':'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
