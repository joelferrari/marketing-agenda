import { useState, useEffect } from 'react';
import styles from './CreditCard.module.css';
import dep from './Depenses.module.css';

const BASE = '/mkt';
const h = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}` });

const STATUT = {
  en_attente: { label:'En attente', color:'#b08020', bg:'#fff8e1' },
  validee:    { label:'Validée ✅',  color:'#2e7d32', bg:'#e8f5e9' },
  refusee:    { label:'Refusée ❌',  color:'#c62828', bg:'#fde8e8' },
};

export default function Depenses({ user, onBack, onLogout }) {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ titre:'', prix:'', magasin:'', lien:'' });
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const toast$ = (txt, ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),4000); };

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch(`${BASE}/depenses`, { headers:h(), cache:'no-store' }).then(r=>r.json());
      setList(Array.isArray(d) ? d : []);
    } catch { setList([]); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titre) return;
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/depenses`, { method:'POST', headers:h(), body:JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erreur || 'Erreur');
      toast$('Demande envoyée à Nathalie ✓');
      setForm({ titre:'', prix:'', magasin:'', lien:'' });
      load();
    } catch(e) { toast$(e.message, false); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <polyline points="9 15 11 17 15 13" strokeWidth="1.6"/>
          </svg>
          <div><p className={styles.headerSub}>Rubis SPA</p><h1 className={styles.headerTitle}>Demandes de dépense</h1></div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.navSecondary} onClick={onBack}>← Accueil</button>
          <button className={styles.navSecondary} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Formulaire */}
        <div className={dep.card}>
          <h2 className={dep.cardTitle}>Nouvelle demande</h2>
          <form onSubmit={submit} className={dep.form}>
            <div className={styles.mf}>
              <label>Titre de la dépense *</label>
              <input value={form.titre} onChange={e=>setForm(p=>({...p,titre:e.target.value}))}
                placeholder="Ex: Huile de massage, serviettes…" required/>
            </div>
            <div className={dep.row2}>
              <div className={styles.mf}>
                <label>Prix (CHF)</label>
                <input type="number" step="0.01" min="0" value={form.prix}
                  onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder="0.00"/>
              </div>
              <div className={styles.mf}>
                <label>Magasin</label>
                <input value={form.magasin} onChange={e=>setForm(p=>({...p,magasin:e.target.value}))}
                  placeholder="Migros, Amazon…"/>
              </div>
            </div>
            <div className={styles.mf}>
              <label>Lien vers le produit (optionnel)</label>
              <input type="url" value={form.lien} onChange={e=>setForm(p=>({...p,lien:e.target.value}))}
                placeholder="https://…"/>
            </div>
            <button type="submit" className={dep.submitBtn} disabled={saving || !form.titre}>
              {saving ? 'Envoi en cours…' : '📩 Envoyer à Nathalie pour validation'}
            </button>
          </form>
        </div>

        {/* Liste des demandes */}
        <div className={dep.card} style={{marginTop:'20px'}}>
          <h2 className={dep.cardTitle}>Historique des demandes</h2>
          {loading && <p className={styles.empty}>Chargement…</p>}
          {!loading && list.length === 0 && <p className={styles.empty}>Aucune demande pour le moment</p>}
          {list.map(d => {
            const st = STATUT[d.statut] || STATUT.en_attente;
            return (
              <div key={d.id} className={dep.depRow}>
                <div className={dep.depInfo}>
                  <span className={dep.depTitre}>{d.titre}</span>
                  {d.magasin && <span className={dep.depMeta}>{d.magasin}</span>}
                  {d.lien && <a href={d.lien} target="_blank" rel="noopener noreferrer" className={dep.depLink}>🔗 Voir le produit</a>}
                  <span className={dep.depDate}>{new Date(d.created_at).toLocaleDateString('fr-CH',{day:'numeric',month:'long',year:'numeric'})}</span>
                </div>
                <div className={dep.depRight}>
                  {d.prix && <span className={dep.depPrix}>{parseFloat(d.prix).toFixed(2)} CHF</span>}
                  <span className={dep.statut} style={{color:st.color,background:st.bg}}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
