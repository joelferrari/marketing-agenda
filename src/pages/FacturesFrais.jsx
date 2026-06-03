// ============================================================
//  FacturesFrais — Upload et liste des factures de frais
// ============================================================
import { useState, useEffect, useRef } from 'react';
import styles from './FacturesFrais.module.css';

const API = import.meta.env.VITE_API_URL || '/mkt';

export default function FacturesFrais({ user, onBack }) {
  const [invoices,     setInvoices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [toast,        setToast]        = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [form,         setForm]         = useState({ description: '', montant: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  const toast$ = (txt, ok=true) => {
    setToast({ txt, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('mkt_token');
      const r = await fetch(`${API}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFile = (file) => {
    if (!file) return;
    const ok = ['application/pdf','image/jpeg','image/png'].includes(file.type);
    if (!ok) { toast$('Format non supporté — PDF, JPEG ou PNG', false); return; }
    if (file.size > 20 * 1024 * 1024) { toast$('Fichier trop lourd (max 20 MB)', false); return; }
    setSelectedFile(file);
  };

  const upload = async () => {
    if (!selectedFile) { toast$('Sélectionnez un fichier', false); return; }
    setUploading(true);
    try {
      const token = localStorage.getItem('mkt_token');
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('description', form.description);
      fd.append('montant', form.montant);
      fd.append('user_id', user?.id || '');
      const r = await fetch(`${API}/invoices/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erreur || 'Erreur upload');
      toast$('Facture uploadée ✓');
      setSelectedFile(null);
      setForm({ description: '', montant: '' });
      await load();
    } catch(e) { toast$(e.message, false); }
    finally { setUploading(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    try {
      const token = localStorage.getItem('mkt_token');
      await fetch(`${API}/invoices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast$('Supprimée');
      await load();
    } catch { toast$('Erreur', false); }
  };

  const fileUrl = (id) => {
    const token = localStorage.getItem('mkt_token');
    return `${API}/invoices/${id}/file?token=${token}`;
  };

  const fmt = (dt) => new Date(dt).toLocaleDateString('fr-CH', { day:'2-digit', month:'2-digit', year:'numeric' });
  const isImg = (mime) => mime?.startsWith('image/');

  return (
    <div className={styles.page}>
      {toast && (
        <div className={styles.toast} style={{ background: toast.ok ? '#5a8a52' : '#c0756e' }}>
          {toast.ok ? '✓' : '⚠'} {toast.txt}
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className={styles.title}>Factures frais</span>
      </header>

      <div className={styles.body}>

        {/* Zone d'upload */}
        <div className={styles.uploadCard}>
          <p className={styles.sectionLabel}>Ajouter une facture</p>

          {/* Drag & drop */}
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dropZoneOver : ''} ${selectedFile ? styles.dropZoneSelected : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            {selectedFile ? (
              <div className={styles.filePreview}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4737c" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className={styles.fileName}>{selectedFile.name}</span>
                <span className={styles.fileSize}>{(selectedFile.size/1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <div className={styles.dropHint}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4737c" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Glissez un fichier ici ou <strong>cliquez pour parcourir</strong></span>
                <span className={styles.dropSub}>PDF, JPEG ou PNG — max 20 MB</span>
              </div>
            )}
          </div>

          {/* Champs */}
          <div className={styles.fields}>
            <div className={styles.field}>
              <label>Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Matériel, abonnement, impression…" />
            </div>
            <div className={styles.field} style={{ maxWidth: '140px' }}>
              <label>Montant (CHF)</label>
              <input type="number" min="0" step="0.05" value={form.montant}
                onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
                placeholder="0.00" />
            </div>
          </div>

          <button className={styles.uploadBtn} onClick={upload} disabled={!selectedFile || uploading}>
            {uploading ? 'Upload en cours…' : '↑ Envoyer la facture'}
          </button>
        </div>

        {/* Liste */}
        <p className={styles.sectionLabel} style={{ marginTop: '28px' }}>
          {invoices.length} facture{invoices.length !== 1 ? 's' : ''}
        </p>

        {loading && <p className={styles.empty}>Chargement…</p>}
        {!loading && !invoices.length && <p className={styles.empty}>Aucune facture uploadée</p>}

        <div className={styles.list}>
          {invoices.map(inv => (
            <div key={inv.id} className={styles.invoiceRow}>
              {/* Icône type */}
              <div className={styles.invoiceIcon}>
                {isImg(inv.mimetype)
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4737c" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4737c" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                }
              </div>

              {/* Infos */}
              <div className={styles.invoiceInfo}>
                <p className={styles.invoiceName}>{inv.original_name}</p>
                <p className={styles.invoiceMeta}>
                  {inv.prenom} {inv.nom} · {fmt(inv.created_at)}
                  {inv.description && ` · ${inv.description}`}
                </p>
              </div>

              {/* Montant */}
              {inv.montant && (
                <span className={styles.invoiceMontant}>{parseFloat(inv.montant).toFixed(2)} CHF</span>
              )}

              {/* Actions */}
              <div className={styles.invoiceActions}>
                <a href={fileUrl(inv.id)} target="_blank" rel="noreferrer" className={styles.btnView}>
                  Voir
                </a>
                <button className={styles.btnDel} onClick={() => del(inv.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
