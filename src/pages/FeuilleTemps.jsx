import { useState, useEffect, useRef } from 'react';
import { getTimesheet, saveTimesheetEntry, deleteTimesheetEntry, emailTimesheet, getTimesheetSuggestions } from '../api';
import styles from './FeuilleTemps.module.css';

const ENTITES  = ["Mined'or", 'Rubis Spa', 'Rubis Time 20', 'Edelschweiz', ''];
const JOURS_C  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const JOURS_L  = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const ENT_COLORS = { "Mined'or": '#e8590c', 'Rubis Spa': '#c4737c', 'Rubis Time 20': '#1098ad', 'Edelschweiz': '#5f3dc4' };
const entColor = e => ENT_COLORS[e] || '#adb5bd';

const today = () => new Date().toISOString().slice(0, 10);

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function lundiDe(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' });
}

function fmtDateLong(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseHeures(val) {
  if (!val || val.trim() === '' || val === '0' || val === '—') return 0;
  const s = String(val).trim().replace(',', '.');
  if (s.includes('h') || s.includes(':')) {
    const parts = s.replace('h', ':').split(':');
    const h = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    return Math.round((h + m / 60) * 100) / 100;
  }
  return Math.round(parseFloat(s) * 100) / 100 || 0;
}

function fmtH(h) {
  if (!h) return '';
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs % 1) * 60);
  return `${hh}h${String(mm).padStart(2, '0')}`;
}

// Groupe les entrées DB en lignes (tache + projet + entite)
function buildGrid(rows, lundi) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(lundi, i));
  const map = new Map();
  for (const r of rows) {
    const key = `${r.tache}||${r.projet || ''}||${r.entite || ''}`;
    if (!map.has(key)) map.set(key, { tache: r.tache, projet: r.projet || '', entite: r.entite || '', jours: {} });
    map.get(key).jours[r.date_jour] = { id: r.id, heures: parseFloat(r.heures) };
  }
  return { days, lignes: [...map.values()] };
}

export default function FeuilleTemps({ user, viewKey = 'joel', onBack, onLogout }) {
  const [lundi,    setLundi]    = useState(lundiDe(today()));
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const [newRow,   setNewRow]   = useState({ tache: '', projet: '', entite: '' });
  const [showAdd,  setShowAdd]  = useState(false);
  const [sending,  setSending]  = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [search,   setSearch]   = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const editRef = useRef({});
  const addRef  = useRef(null);

  const toast$ = (txt, ok = true) => { setToast({ txt, ok }); setTimeout(() => setToast(null), 3500); };

  const load = async (ld = lundi) => {
    setLoading(true);
    try {
      const d = await getTimesheet(ld, viewKey);
      setData(d);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  const loadSuggestions = async () => {
    try {
      const s = await getTimesheetSuggestions(viewKey);
      setSuggestions(Array.isArray(s) ? s : []);
    } catch { setSuggestions([]); }
  };

  useEffect(() => { load(); }, [lundi, viewKey]);
  useEffect(() => { loadSuggestions(); }, [viewKey]);

  // Fermer le menu d'ajout si clic à l'extérieur
  useEffect(() => {
    if (!showAdd) return;
    const onDoc = e => { if (addRef.current && !addRef.current.contains(e.target)) closeAdd(); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showAdd]);

  const prevWeek = () => setLundi(l => addDays(l, -7));
  const nextWeek = () => setLundi(l => addDays(l, 7));
  const thisWeek = () => setLundi(lundiDe(today()));

  const { days, lignes } = data ? buildGrid(data.rows, lundi) : { days: Array.from({ length: 7 }, (_, i) => addDays(lundi, i)), lignes: [] };

  // Sauvegarde une cellule quand on quitte le champ
  const saveCell = async (date, ligne, inputVal) => {
    const heures = parseHeures(inputVal);
    const existing = ligne.jours[date];
    const prevH = existing?.heures || 0;
    if (heures === prevH) return; // rien changé

    setSaving(true);
    try {
      if (existing?.id && heures === 0) {
        await deleteTimesheetEntry(existing.id);
      } else {
        await saveTimesheetEntry({
          user_key: viewKey,
          date_jour: date,
          tache: ligne.tache,
          projet: ligne.projet || null,
          entite: ligne.entite || null,
          heures,
        });
      }
      await load();
    } catch(e) { toast$(e.message || 'Erreur', false); }
    finally { setSaving(false); }
  };

  const closeAdd = () => { setShowAdd(false); setShowNew(false); setSearch(''); setNewRow({ tache: '', projet: '', entite: '' }); };

  const ligneExiste = (tache, projet, entite) =>
    lignes.some(l => l.tache === tache && (l.projet || '') === (projet || '') && (l.entite || '') === (entite || ''));

  // Ajoute une ligne vide dans la grille (les heures seront saisies ensuite)
  const ajouterLigne = ({ tache, projet, entite }) => {
    const t = tache.trim();
    if (!t) return;
    if (ligneExiste(t, projet || '', entite || '')) { toast$('Cette tâche est déjà dans la semaine', false); closeAdd(); return; }
    setData(prev => {
      const r = { ...prev };
      r.rows = [...(r.rows || []), {
        id: null, date_jour: lundi,
        tache: t, projet: projet?.trim() || null, entite: entite || null,
        heures: 0,
      }];
      return r;
    });
    closeAdd();
  };

  const addLigne = () => ajouterLigne(newRow);

  const supprimerLigne = async (ligne) => {
    if (!window.confirm(`Supprimer "${ligne.tache}" et toutes ses heures cette semaine ?`)) return;
    setSaving(true);
    try {
      const ids = Object.values(ligne.jours).map(j => j.id).filter(Boolean);
      await Promise.all(ids.map(id => deleteTimesheetEntry(id)));
      await load();
    } catch(e) { toast$(e.message, false); }
    finally { setSaving(false); }
  };

  const envoyerEmail = async () => {
    if (!window.confirm(`Envoyer le rapport de la semaine du ${fmtDateLong(lundi)} à Grace (grace@rubis.com.cn) ?`)) return;
    setSending(true);
    try {
      const r = await emailTimesheet({ lundi, user_key: viewKey });
      if (r.erreur) throw new Error(r.erreur);
      toast$('Rapport envoyé à Grace ✓');
    } catch(e) { toast$(e.message || 'Erreur envoi', false); }
    finally { setSending(false); }
  };

  // Totaux
  const totalParJour  = days.map(d => lignes.reduce((s, l) => s + (l.jours[d]?.heures || 0), 0));
  const totalSemaine  = totalParJour.reduce((s, h) => s + h, 0);
  const parEntite     = lignes.reduce((acc, l) => {
    const total = Object.values(l.jours).reduce((s, j) => s + (j.heures || 0), 0);
    if (total > 0) acc[l.entite || '—'] = (acc[l.entite || '—'] || 0) + total;
    return acc;
  }, {});

  // Suggestions filtrées + groupées par entité (autocomplétion type Clockify)
  const q = search.trim().toLowerCase();
  const suggFiltres = suggestions
    .filter(s => !ligneExiste(s.tache, s.projet || '', s.entite || ''))
    .filter(s => !q || `${s.tache} ${s.projet || ''} ${s.entite || ''}`.toLowerCase().includes(q));
  const groupesMap = {};
  for (const s of suggFiltres) {
    const k = s.entite || 'Sans entité';
    (groupesMap[k] = groupesMap[k] || []).push(s);
  }
  const groupes = Object.entries(groupesMap);

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>{toast.txt}</div>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.3" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div>
            <p className={styles.headerSub}>Rubis SPA</p>
            <h1 className={styles.headerTitle}>{"Feuille de temps"}</h1>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.navSecondary} onClick={onBack}>{"← Accueil"}</button>
          <button className={styles.navSecondary} onClick={onLogout}>{"Déconnexion"}</button>
        </div>
      </header>

      <main className={styles.main}>

        {/* Navigation semaine */}
        <div className={styles.weekNav}>
          <button className={styles.navBtn} onClick={prevWeek}>{"‹"}</button>
          <div className={styles.weekLabel}>
            <span className={styles.weekTitle}>
              {`Semaine du ${fmtDate(lundi)} au ${fmtDate(addDays(lundi, 6))}`}
            </span>
            <button className={styles.todayBtn} onClick={thisWeek}>{"Cette semaine"}</button>
          </div>
          <button className={styles.navBtn} onClick={nextWeek}>{"›"}</button>
        </div>

        {/* Résumé entités */}
        {Object.keys(parEntite).length > 0 && (
          <div className={styles.summaryRow}>
            {Object.entries(parEntite).map(([e, h]) => (
              <div key={e} className={styles.summaryChip}>
                <span className={styles.summaryLabel}>{e}</span>
                <span className={styles.summaryH}>{fmtH(h)}</span>
              </div>
            ))}
            <div className={styles.summaryChip} style={{ borderColor: 'var(--rose)', background: '#fff5f5' }}>
              <span className={styles.summaryLabel}>{"Total"}</span>
              <span className={styles.summaryH} style={{ color: 'var(--rouge)' }}>{fmtH(totalSemaine)}</span>
            </div>
          </div>
        )}

        {/* Tableau */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thTask}>{"Tâche / Projet"}</th>
                <th className={styles.thEntite}>{"Entité"}</th>
                {days.map((d, i) => (
                  <th key={d} className={`${styles.thDay} ${d === today() ? styles.thDayToday : ''}`}>
                    <div>{JOURS_C[i]}</div>
                    <div className={styles.thDayDate}>{fmtDate(d)}</div>
                  </th>
                ))}
                <th className={styles.thTotal}>{"Total"}</th>
                <th style={{ width: 32 }}/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className={styles.loadingCell}>{"Chargement…"}</td></tr>
              ) : lignes.length === 0 ? (
                <tr><td colSpan={11} className={styles.emptyCell}>{"Aucune entrée — cliquez + Ajouter une tâche"}</td></tr>
              ) : lignes.map((ligne, li) => {
                const rowTotal = Object.values(ligne.jours).reduce((s, j) => s + (j.heures || 0), 0);
                return (
                  <tr key={li} className={styles.row}>
                    <td className={styles.tdTask}>
                      <div className={styles.taskName}>{ligne.tache}</div>
                      {ligne.projet && <div className={styles.taskProjet}>{ligne.projet}</div>}
                    </td>
                    <td className={styles.tdEntite}>
                      {ligne.entite
                        ? <span className={styles.entiteChip}>{ligne.entite}</span>
                        : <span className={styles.entiteNone}>{"—"}</span>}
                    </td>
                    {days.map(d => {
                      const cell = ligne.jours[d];
                      const cellKey = `${li}-${d}`;
                      return (
                        <td key={d} className={`${styles.tdDay} ${d === today() ? styles.tdDayToday : ''}`}>
                          <input
                            className={styles.cellInput}
                            defaultValue={cell?.heures ? fmtH(cell.heures) : ''}
                            placeholder={"—"}
                            onFocus={e => { editRef.current[cellKey] = e.target.value; e.target.select(); }}
                            onBlur={e => { if (e.target.value !== editRef.current[cellKey]) saveCell(d, ligne, e.target.value); }}
                            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = editRef.current[cellKey]; e.target.blur(); } }}
                          />
                        </td>
                      );
                    })}
                    <td className={styles.tdTotal}>{rowTotal > 0 ? fmtH(rowTotal) : '—'}</td>
                    <td>
                      <button className={styles.delBtn} onClick={() => supprimerLigne(ligne)} title={"Supprimer"}>{"×"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={styles.footerRow}>
                <td colSpan={2} className={styles.footerLabel}>{"Total"}</td>
                {totalParJour.map((h, i) => (
                  <td key={i} className={styles.footerCell}>{h > 0 ? fmtH(h) : '—'}</td>
                ))}
                <td className={styles.footerTotal}>{fmtH(totalSemaine)}</td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Ajouter ligne — menu déroulant type Clockify */}
        <div className={styles.addWrap} ref={addRef}>
          {showAdd ? (
            <div className={styles.addPanel}>
              {showNew ? (
                <div className={styles.newForm}>
                  <input className={styles.addInput} placeholder={"Nom de la tâche"} value={newRow.tache}
                    onChange={e => setNewRow(p => ({ ...p, tache: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addLigne()} autoFocus/>
                  <input className={styles.addInput} placeholder={"Projet (optionnel)"} value={newRow.projet}
                    onChange={e => setNewRow(p => ({ ...p, projet: e.target.value }))}/>
                  <select className={styles.addSelect} value={newRow.entite}
                    onChange={e => setNewRow(p => ({ ...p, entite: e.target.value }))}>
                    <option value="">{"— Entité —"}</option>
                    {ENTITES.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <button className={styles.addConfirm} onClick={addLigne}>{"Créer"}</button>
                  <button className={styles.addCancel} onClick={() => setShowNew(false)}>{"← Retour"}</button>
                </div>
              ) : (
                <>
                  <input className={styles.addSearch} placeholder={"Rechercher une tâche ou entité…"}
                    value={search} onChange={e => setSearch(e.target.value)} autoFocus/>
                  <div className={styles.suggList}>
                    {groupes.length === 0 ? (
                      <div className={styles.suggEmpty}>{"Aucune tâche trouvée"}</div>
                    ) : groupes.map(([ent, items]) => (
                      <div key={ent} className={styles.suggGroup}>
                        <div className={styles.suggGroupTitle}>
                          <span className={styles.suggDot} style={{ background: entColor(ent === 'Sans entité' ? null : ent) }}/>
                          {ent}<span className={styles.suggCount}>{items.length}</span>
                        </div>
                        {items.map((s, i) => (
                          <button key={i} className={styles.suggItem} onClick={() => ajouterLigne(s)}>
                            <span className={styles.suggName}>{s.tache}</span>
                            {s.projet && <span className={styles.suggProjet}>{s.projet}</span>}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button className={styles.suggNew} onClick={() => { setShowNew(true); setNewRow({ tache: search, projet: '', entite: '' }); }}>
                    {`+ Créer une nouvelle tâche${search.trim() ? ` « ${search.trim()} »` : ''}`}
                  </button>
                </>
              )}
            </div>
          ) : (
            <button className={styles.addBtn} onClick={() => setShowAdd(true)}>{"+ Ajouter une tâche"}</button>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {saving && <span className={styles.savingDot}>{"Enregistrement…"}</span>}
          <button className={styles.emailBtn} onClick={envoyerEmail} disabled={sending || !totalSemaine}>
            {sending ? '…' : '✉ Envoyer à Grace'}
          </button>
        </div>

      </main>
    </div>
  );
}
