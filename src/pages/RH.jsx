import { useState, useEffect } from 'react';
import { getPointage, savePointage, delPointage, getBilan, getVacances, addVacances, deleteVacances, getDemandesVacances, addDemandeVacances, getDemandesRecup, addDemandeRecup, emailRH, getAttestations, uploadAttestation, deleteAttestation, emailAttestations, getAttestationUrl } from '../api';
import styles from './CreditCard.module.css';
import rh from './RH.module.css';

const CIBLE   = 9.0;
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const NOW     = new Date();

// Jours pris sur quota 2025 par Emilie (absents du bilan 2026, ajout manuel)
const JOURS_QUOTA_2025_EMILIE = { 1: 2.96 }; // jan 2026 : 2.96j (→ balance -1.29)

const PRENOMS = { emilie: 'Emilie', joel: 'Joël' };

const DEM_STATUT = {
  en_attente: { label: 'En attente', color: 'var(--orange)', bg: 'var(--orange-lt)' },
  validee:    { label: "Validée",    color: 'var(--vert)',   bg: 'var(--vert-lt)' },
  refusee:    { label: "Refusée",    color: 'var(--rouge)',  bg: 'var(--rouge-lt)' },
};

const ATT_TYPES  = { maladie: 'Maladie', accident: 'Accident', autre: 'Autre' };
const ATT_COLORS = { maladie: 'var(--rouge)', accident: 'var(--orange)', autre: 'var(--gris)' };

const VERT = '#4a7c5f';

// ── Icônes SVG minimalistes ───────────────────────────────────
const IcoPdf = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',flexShrink:0}}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',flexShrink:0}}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{display:'block',flexShrink:0}}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoCal = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',flexShrink:0}}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <polyline points="9,16 11,18 15,14"/>
  </svg>
);
const IcoClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',flexShrink:0}}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>
  </svg>
);
const IcoRotate = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',flexShrink:0}}>
    <path d="M3 12a9 9 0 1 1 2.6 6.3"/><polyline points="3,20 3,14 9,14"/>
  </svg>
);

// ── Fenêtre d'impression avec typographie portail Rubis SPA ───
function openPrint(title, sub, tableHTML) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="fr"><head>
    <meta charset="utf-8"><title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Open Sans',system-ui,sans-serif;font-weight:300;max-width:800px;margin:0 auto;padding:32px 40px;color:#2a2825;font-size:13px;-webkit-font-smoothing:antialiased}
      h1{font-weight:300;font-size:22px;color:#c4737c;margin-bottom:4px;letter-spacing:.01em}
      h2{font-weight:400;font-size:12px;color:#b0aaa7;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.1em}
      .sub{color:#b0aaa7;margin-bottom:28px;margin-top:6px;font-size:12px}
      table{width:100%;border-collapse:collapse;margin:0 0 16px}
      th{background:#f5ede8;padding:9px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#b0aaa7;border-bottom:1px solid #eeddd8;font-weight:600}
      td{padding:9px 14px;border-bottom:1px solid #f5ede8;font-weight:300}
      .pos{color:#4a7c5f;font-weight:500}.neg{color:#b56b65;font-weight:500}
      .bold{font-weight:600}.gris{color:#b0aaa7}
      .toolbar{text-align:right;margin-bottom:28px}
      .toolbar button{background:#4a7c5f;color:#fff;border:none;padding:9px 22px;border-radius:6px;font-size:12px;cursor:pointer;font-family:'Open Sans',sans-serif;font-weight:500;letter-spacing:.04em}
      footer{color:#b0aaa7;font-size:11px;margin-top:40px;padding-top:14px;border-top:1px solid #eeddd8}
      @media print{.toolbar{display:none}}
    </style>
  </head><body>
    <div class="toolbar"><button onclick="window.print()">Imprimer / Enregistrer PDF</button></div>
    <h1>${title}</h1><p class="sub">${sub}</p>
    ${tableHTML}
    <footer>Rubis SPA &middot; Sentier de Beau-Site 3, 1802 Corseaux &middot; rubisspa.ch</footer>
  </body></html>`);
  w.document.close();
}

const fmtH = (h, forceSign=false) => {
  if (h === null || h === undefined || isNaN(h)) return '—';
  const sign = h < 0 ? '-' : (forceSign ? '+' : '');
  const abs  = Math.abs(h);
  const hh   = Math.floor(abs);
  const mm   = Math.round((abs - hh) * 60);
  return `${sign}${hh}h${mm.toString().padStart(2,'0')}`;
};

const toHHMM = (dec) => {
  if (!dec) return '';
  const hh = Math.floor(dec);
  const mm = Math.round((dec - hh) * 60);
  return `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  const d = new Date(year, month-1, 1).getDay();
  return d === 0 ? 7 : d; // 1=lun ... 7=dim
};

// Nombre de jours ouvrés du user dans une plage date_debut/date_fin (mar-sam
// Emilie, mar-ven Joël) — un lundi/dimanche dans la plage ne doit pas compter
// comme un jour de vacances consommé.
const workDaysCount = (dateDebut, dateFin, userKey) => {
  if (!dateDebut || !dateFin) return 0;
  const wd = userKey === 'joel' ? [2,3,4,5] : [2,3,4,5,6];
  let n = 0;
  const cur = new Date(dateDebut + 'T12:00:00');
  const end = new Date(dateFin + 'T12:00:00');
  while (cur <= end) {
    if (wd.includes(cur.getDay())) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
};

export default function RH({ user }) {
  // viewKey = quel utilisateur on consulte : 'emilie' ou 'joel'
  // Pour emilie/joel : fixe. Pour admin : sélectionnable.
  const myKey = (user?.role === 'emilie' || user?.role === 'joel') ? user.role : 'emilie';
  const [viewKey, setViewKey] = useState(myKey);
  const isAdmin    = user?.role === 'admin';
  const prenom     = PRENOMS[viewKey] || viewKey;
  const DROIT_VAC   = viewKey === 'joel' ? 16 : 20;
  const CREDIT_MENS = viewKey === 'joel' ? 1.33 : 1.67;
  const MOIS_DEBUT  = viewKey === 'joel' ? 3 : 1;

  const [tab,      setTab]     = useState('pointage');
  const [annee,    setAnnee]   = useState(NOW.getFullYear());
  const [mois,     setMois]    = useState(NOW.getMonth()+1);
  const [entries,  setEntries] = useState([]);
  const [bilan,    setBilan]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [modal,    setModal]   = useState(null); // {date_jour, entry?}
  const [vacances,  setVacances] = useState([]);
  const [vacModal,  setVacModal] = useState(false);
  const [vacForm,   setVacForm]  = useState({date_debut:'',date_fin:'',description:''});
  const [vacSaving, setVacSaving]= useState(false);
  const [demandes,      setDemandes]     = useState([]);
  const [demModal,      setDemModal]     = useState(false);
  const [demForm,       setDemForm]      = useState({date_debut:'',date_fin:'',commentaire:''});
  const [demSaving,     setDemSaving]    = useState(false);
  const [demandesRecup,   setDemandesRecup]   = useState([]);
  const [demRecupModal,   setDemRecupModal]   = useState(false);
  const [demRecupForm,    setDemRecupForm]    = useState({date_jour:'',heures_recup:'',commentaire:''});
  const [demRecupSaving,  setDemRecupSaving]  = useState(false);
  const [attestations,  setAttestations] = useState([]);
  const [attModal,      setAttModal]     = useState(false);
  const [attForm,       setAttForm]      = useState({titre:'',type_doc:'maladie',date_doc:''});
  const [attFile,       setAttFile]      = useState(null);
  const [attSaving,     setAttSaving]    = useState(false);
  const [emailing,      setEmailing]     = useState(false);
  const [emailModal,    setEmailModal]   = useState(null); // null | 'pointage' | 'resume' | 'attestations'
  const [emailTo,       setEmailTo]      = useState('info@rubisspa.ch');
  const [toast,    setToast]   = useState(null);
  const [form,     setForm]    = useState({heure_arrivee:'09:00',heure_depart:'18:00',notes:''});

  const toast$ = (txt,ok=true) => { setToast({txt,ok}); setTimeout(()=>setToast(null),3000); };

  const loadPointage = async (a=annee, m=mois) => {
    setLoading(true);
    try { const d=await getPointage({annee:a,mois:m,user:viewKey}); setEntries(Array.isArray(d)?d:[]); }
    catch { setEntries([]); }
    finally { setLoading(false); }
  };

  const loadVacances = async () => {
    try { const d = await getVacances(viewKey); setVacances(Array.isArray(d)?d:[]); } catch{}
  };

  const loadDemandes = async () => {
    try { const d = await getDemandesVacances(viewKey); setDemandes(Array.isArray(d)?d:[]); } catch{}
  };

  const loadDemandesRecup = async () => {
    try { const d = await getDemandesRecup(viewKey); setDemandesRecup(Array.isArray(d)?d:[]); } catch{}
  };

  const loadAttestations = async () => {
    try { const d = await getAttestations(viewKey); setAttestations(Array.isArray(d)?d:[]); } catch{}
  };

  const openEmailModal = (type) => { setEmailModal(type); setEmailTo('info@rubisspa.ch'); };

  const sendExport = async () => {
    if (!emailTo) return;
    setEmailing(true);
    try {
      const d = emailModal === 'attestations'
        ? await emailAttestations(emailTo, viewKey)
        : await emailRH({ type: emailModal, annee, mois, destinataire: emailTo, user: viewKey });
      if (d.erreur) throw new Error(d.erreur);
      toast$(`Email envoyé à ${emailTo} ✓`);
      setEmailModal(null);
    } catch(err) { toast$(err.message, false); }
    finally { setEmailing(false); }
  };

  const openFile = async (id) => {
    try {
      const url = getAttestationUrl(id);
      const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('mkt_token')||''}` } });
      if (!r.ok) throw new Error('Fichier introuvable');
      const blob = await r.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch(err) { toast$(err.message, false); }
  };

  const printPointage = () => {
    const rows = entries.map(e => {
      const h   = parseFloat(e.heures) || 0;
      const sup = e.type === 'recup' ? h : (e.heures ? h - CIBLE : null);
      const hCol = e.type==='recup'?'var(--violet)':h>=CIBLE?VERT:h>=CIBLE*0.6?'var(--orange)':'var(--rouge)';
      const dStr = new Date(e.date_jour+'T12:00:00').toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'});
      return `<tr>
        <td>${dStr}</td>
        <td>${e.heure_arrivee?.slice(0,5)||'—'}</td>
        <td>${e.heure_depart?.slice(0,5)||'—'}</td>
        <td style="font-weight:600;color:${hCol}">${e.type==='recup'?'Récup.':e.heures?fmtH(h):'—'}</td>
        <td style="color:${sup!==null&&sup>=0?VERT:'#c62828'}">${sup!==null?fmtH(sup,true):'—'}</td>
        <td style="color:#888">${e.notes||''}</td>
      </tr>`;
    }).join('');
    openPrint(`Pointage ${prenom}`, `${MOIS_FR[mois-1]} ${annee}`,
      `<table><thead><tr><th>Date</th><th>Arrivée</th><th>Départ</th><th>Heures</th><th>Sup.</th><th>Notes</th></tr></thead>
       <tbody>${rows||'<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px">Aucun pointage ce mois</td></tr>'}</tbody></table>`);
  };

  const printResume = () => {
    let cumul = 0;
    const rows = bilan.map(m => {
      const sup = parseFloat(m.heures_sup||0); cumul += sup; const snap = cumul;
      return `<tr>
        <td>${MOIS_FR[m.mois-1]}</td>
        <td style="text-align:center">${m.jours_travailles}j</td>
        <td style="text-align:right;font-weight:600">${fmtH(parseFloat(m.total_heures||0))}</td>
        <td style="text-align:right;font-weight:600;color:${sup>=0?VERT:'#c62828'}">${fmtH(sup,true)}</td>
        <td style="text-align:right;font-weight:700;color:${snap>=0?VERT:'#c62828'}">${fmtH(snap,true)}</td>
      </tr>`;
    }).join('');
    openPrint(`Résumé annuel RH ${prenom}`, String(annee),
      `<table><thead><tr><th>Mois</th><th style="text-align:center">Jours</th><th style="text-align:right">Heures</th><th style="text-align:right">Sup.</th><th style="text-align:right">Cumul</th></tr></thead>
       <tbody>${rows||'<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px">Aucune donnée</td></tr>'}</tbody></table>`);
  };

  const printAttestations = () => {
    const rows = attestations.map(a => `<tr>
      <td>${a.date_doc?new Date(a.date_doc+'T12:00:00').toLocaleDateString('fr-CH'):'—'}</td>
      <td>${ATT_TYPES[a.type_doc]||a.type_doc}</td>
      <td style="font-weight:500">${a.titre}</td>
      <td style="color:#888;font-size:12px">${a.original_name}</td>
    </tr>`).join('');
    openPrint(`Attestations ${prenom}`, `${attestations.length} document${attestations.length!==1?'s':''}`,
      `<table><thead><tr><th>Date</th><th>Type</th><th>Titre</th><th>Fichier</th></tr></thead>
       <tbody>${rows||'<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px">Aucune attestation</td></tr>'}</tbody></table>`);
  };

  const printVacances = () => {
    const now = new Date();
    const anneeVac = now.getFullYear();
    const rows = vacances.map(v => {
      const debut = new Date(v.date_debut+'T12:00:00');
      const fin   = new Date(v.date_fin+'T12:00:00');
      const jours = workDaysCount(v.date_debut, v.date_fin, viewKey);
      return `<tr>
        <td>${debut.toLocaleDateString('fr-CH')}</td>
        <td>${fin.toLocaleDateString('fr-CH')}</td>
        <td style="text-align:center;font-weight:600">${jours}j</td>
        <td style="color:#888">${v.notes||''}</td>
      </tr>`;
    }).join('');
    const total = vacances
      .filter(v=>new Date(v.date_debut).getFullYear()===anneeVac||new Date(v.date_fin).getFullYear()===anneeVac)
      .reduce((s,v)=>s+workDaysCount(v.date_debut, v.date_fin, viewKey),0);
    openPrint(`Vacances ${prenom}`, `${anneeVac} — ${total} / ${DROIT_VAC} jours pris`,
      `<table><thead><tr><th>Début</th><th>Fin</th><th style="text-align:center">Jours</th><th>Notes</th></tr></thead>
       <tbody>${rows||'<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px">Aucune vacance</td></tr>'}</tbody></table>`);
  };

  const uploadAtt = async (e) => {
    e.preventDefault();
    if (!attFile) { toast$('Choisissez un fichier', false); return; }
    setAttSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', attFile);
      fd.append('titre', attForm.titre);
      fd.append('type_doc', attForm.type_doc);
      if (attForm.date_doc) fd.append('date_doc', attForm.date_doc);
      const d = await uploadAttestation(fd, viewKey);
      if (d.erreur) throw new Error(d.erreur);
      toast$('Attestation enregistrée ✓');
      setAttModal(false);
      setAttForm({titre:'',type_doc:'maladie',date_doc:''});
      setAttFile(null);
      loadAttestations();
    } catch(err) { toast$(err.message, false); }
    finally { setAttSaving(false); }
  };

  const delAtt = async (id) => {
    if (!window.confirm('Supprimer cette attestation ?')) return;
    const d = await deleteAttestation(id, viewKey);
    if (d.erreur) { toast$(d.erreur, false); return; }
    toast$('Attestation supprimée');
    loadAttestations();
  };

  const loadBilan = async (a=annee) => {
    setLoading(true);
    try { const d=await getBilan({annee:a,user:viewKey}); setBilan(Array.isArray(d)?d:[]); }
    catch { setBilan([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab==='pointage') { loadPointage(); loadBilan(); loadDemandesRecup(); }
    else if (tab==='resume') loadBilan();
    else if (tab==='vacances') { loadVacances(); loadDemandes(); }
    else if (tab==='attestations') loadAttestations();
  }, [tab, annee, mois, viewKey]);

  const entriesByDate = Object.fromEntries(entries.map(e => [e.date_jour?.slice(0,10), e]));

  const addDem = async (e) => {
    e.preventDefault();
    if (!demForm.date_debut || !demForm.date_fin) return;
    setDemSaving(true);
    try {
      const d = await addDemandeVacances({ ...demForm, user: viewKey });
      if (d.erreur) throw new Error(d.erreur);
      toast$('Demande envoyée à Nathalie pour validation ✓');
      setDemModal(false);
      setDemForm({date_debut:'',date_fin:'',commentaire:''});
      loadDemandes();
    } catch(err) { toast$(err.message, false); }
    finally { setDemSaving(false); }
  };

  const addDemRecup = async (e) => {
    e.preventDefault();
    if (!demRecupForm.date_jour || !demRecupForm.heures_recup) return;
    setDemRecupSaving(true);
    try {
      const d = await addDemandeRecup({ ...demRecupForm, user: viewKey });
      if (d.erreur) throw new Error(d.erreur);
      toast$('Demande envoyée à Nathalie pour validation ✓');
      setDemRecupModal(false);
      setDemRecupForm({date_jour:'',heures_recup:'',commentaire:''});
      loadDemandesRecup();
    } catch(err) { toast$(err.message, false); }
    finally { setDemRecupSaving(false); }
  };

  const addVac = async (e) => {
    e.preventDefault();
    if (!vacForm.date_debut || !vacForm.date_fin) return;
    setVacSaving(true);
    try {
      const d = await addVacances({ ...vacForm, user: viewKey });
      if (d.erreur) throw new Error(d.erreur);
      toast$(`Vacances enregistrées — ${d.jours} jours`);
      setVacModal(false);
      setVacForm({date_debut:'',date_fin:'',description:''});
      loadVacances();
    } catch(e) { toast$(e.message, false); }
    finally { setVacSaving(false); }
  };

  const delVac = async (id) => {
    if (!window.confirm('Supprimer ces vacances ?')) return;
    const d = await deleteVacances(id, viewKey);
    if (d.erreur) { toast$(d.erreur, false); return; }
    toast$('Vacances supprimées');
    loadVacances();
  };

  const openDay = (dateStr) => {
    const e = entriesByDate[dateStr];
    if (e?.type === 'vacances' && !e.id) {
      toast$('Jour de vacances — à gérer depuis l\'onglet Vacances');
      setTab('vacances');
      return;
    }
    setForm({
      type:          e?.type || 'travail',
      heures_recup:  e?.heures ? String(Math.abs(parseFloat(e.heures))) : '9',
      heure_arrivee: e?.heure_arrivee?.slice(0,5) || '10:00',
      heure_depart:  e?.heure_depart?.slice(0,5)  || '19:00',
      notes:         e?.notes || '',
    });
    setModal({ date_jour: dateStr, entry: e });
  };

  const submit = async (e) => {
    e.preventDefault();
    const d = await savePointage({
      date_jour: modal.date_jour, ...form, type: form.type || 'travail',
      heures_recup: form.type==='recup' ? form.heures_recup : undefined,
    });
    if (d?.erreur) { toast$(d.erreur,false); return; }
    toast$('Pointage enregistré ✓');
    setModal(null);
    loadPointage();
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer ce jour ?')) return;
    await delPointage(id);
    toast$('Supprimé'); loadPointage();
  };

  // Navigation mois
  const prevMois = () => {
    if (mois === 1) { setAnnee(a=>a-1); setMois(12); } else setMois(m=>m-1);
  };
  const nextMois = () => {
    if (mois === 12) { setAnnee(a=>a+1); setMois(1); } else setMois(m=>m+1);
  };

  // Cumul depuis le début de l'année jusqu'au mois affiché (inclus)
  const cumulYTD = bilan
    .filter(m => parseInt(m.mois) <= mois)
    .reduce((s,m) => s + parseFloat(m.heures_sup||0), 0);

  // Un jour ne compte comme "travaillé" que s'il tombe sur un jour ouvré du
  // user (mar-sam Emilie, mar-ven Joël) — sinon un lundi (jour off pour les
  // deux) était compté dans "X jours"/"X travaillées" alors que heuresSup
  // l'excluait déjà correctement via entry.delta.
  const isExtraDay = (dateStr) => {
    const wd = viewKey === 'joel' ? [2,3,4,5] : [2,3,4,5,6];
    return !wd.includes(new Date(dateStr + 'T12:00:00').getDay());
  };

  // Stats mois courant
  const totalH     = entries.filter(e=>e.type!=='recup' && !isExtraDay(e.date_jour?.slice(0,10))).reduce((s,e) => s + (parseFloat(e.heures)||0), 0);
  const nbJours    = entries.filter(e=>e.type!=='recup' && e.heures && !isExtraDay(e.date_jour?.slice(0,10))).length;
  const nbRecup    = entries.filter(e=>e.type==='recup').length;
  const heuresSup  = entries.reduce((s,e) => s + (e.delta||0), 0);

  // Calendrier
  const nbDays     = getDaysInMonth(annee, mois);
  const firstDay   = getFirstDayOfMonth(annee, mois);
  const cells      = Array.from({length: Math.ceil((nbDays + firstDay - 1) / 7) * 7}, (_,i) => {
    const day = i - firstDay + 2;
    if (day < 1 || day > nbDays) return null;
    return day;
  });

  // Bilan annuel
  const totalSupAnnee = bilan.reduce((s,m) => s + parseFloat(m.heures_sup||0), 0);
  const maxH = bilan.length ? Math.max(...bilan.map(m=>parseFloat(m.total_heures||0))) : 0;

  const dayColor = (entry, dateStr) => {
    if (!entry) return 'var(--blanc)';
    if (entry.type === 'vacances') return 'var(--orange-lt)';
    if (entry.type === 'recup') return 'var(--violet-lt)';
    if (!entry.heures) return 'var(--blanc)';
    const h = parseFloat(entry.heures);
    const extra = isExtraDay(dateStr);
    if (extra && viewKey !== 'joel') return 'var(--blanc)'; // Emilie jour hors planning = neutre
    const c = extra ? 0 : CIBLE; // Joel jour extra : cible 0 → tout vert
    if (h >= c)       return 'var(--vert-lt)';
    if (h >= c * 0.6) return 'var(--orange-lt)';
    return 'var(--rouge-lt)';
  };

  const dayTextColor = (entry, dateStr) => {
    if (!entry) return 'var(--gris-lt)';
    if (entry.type === 'vacances') return 'var(--orange)';
    if (entry.type === 'recup') return 'var(--violet)';
    if (!entry.heures) return 'var(--gris-lt)';
    const h = parseFloat(entry.heures);
    const extra = isExtraDay(dateStr);
    if (extra && viewKey !== 'joel') return 'var(--gris)'; // Emilie jour hors planning = neutre
    const c = extra ? 0 : CIBLE;
    if (h >= c) return 'var(--vert)';
    if (h >= c * 0.6) return 'var(--orange)';
    return 'var(--rouge)';
  };

  return (
    <>
      {toast && <div className={`${styles.toast} ${toast.ok?styles.toastOk:styles.toastErr}`}>{toast.txt}</div>}

      <main className={styles.main}>
        {/* Sélecteur utilisateur (admin uniquement) */}
        {isAdmin && (
          <div className={rh.staffSwitch}>
            {['emilie','joel'].map(k => (
              <button key={k}
                className={`${rh.staffBtn} ${viewKey===k ? rh.staffBtnOn : ''}`}
                onClick={() => setViewKey(k)}>
                {PRENOMS[k]}
              </button>
            ))}
          </div>
        )}

        {/* Onglets + actions de l'onglet actif, alignées en haut à droite */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px',marginBottom:'4px'}}>
          <div className={rh.tabs} style={{flexWrap:'wrap'}}>
            {['pointage','resume','vacances','attestations'].map(t => (
              <button key={t} className={`${rh.tab} ${tab===t?rh.tabOn:''}`} onClick={()=>setTab(t)}>
                {t==='pointage'?'Pointage':t==='resume'?'Résumé annuel':t==='vacances'?'Vacances':'Attestations'}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {tab==='pointage' && (<>
              <button className={rh.exportBtn} onClick={printPointage} title="Télécharger PDF"><IcoPdf/> PDF</button>
              <button className={rh.exportBtn} onClick={()=>openEmailModal('pointage')} disabled={emailing}><IcoMail/> {emailing?'…':'Email'}</button>
              <button className={styles.addBtn} onClick={()=>setDemRecupModal(true)}><IcoCal/> Demander une récup.</button>
            </>)}
            {tab==='resume' && (<>
              <button className={rh.exportBtn} onClick={printResume} title="Télécharger PDF"><IcoPdf/> PDF</button>
              <button className={rh.exportBtn} onClick={()=>openEmailModal('resume')} disabled={emailing}><IcoMail/> {emailing?'…':'Email'}</button>
            </>)}
            {tab==='vacances' && (<>
              <button className={rh.exportBtn} onClick={printVacances} title="Télécharger PDF"><IcoPdf/> PDF</button>
              <button className={rh.exportBtn} onClick={()=>openEmailModal('vacances')} disabled={emailing}><IcoMail/> {emailing?'…':'Email'}</button>
              <button className={styles.addBtn} onClick={()=>setDemModal(true)}><IcoCal/> Demander</button>
              <button className={styles.addBtn} onClick={()=>setVacModal(true)}><IcoPlus/> Ajouter</button>
            </>)}
            {tab==='attestations' && (<>
              <button className={rh.exportBtn} onClick={printAttestations}><IcoPdf/> PDF</button>
              <button className={rh.exportBtn} onClick={()=>openEmailModal('attestations')} disabled={emailing}><IcoMail/> {emailing?'…':'Email'}</button>
              <button className={styles.addBtn} onClick={()=>setAttModal(true)}><IcoPlus/> Ajouter</button>
            </>)}
          </div>
        </div>

        {/* ── VACANCES ── */}
        {tab==='vacances' && (<>
          <p style={{fontSize:'13px',color:'var(--gris)',margin:'0 0 20px'}}>
            Les vacances bloquent automatiquement l'agenda du spa et apparaissent dans le calendrier marketing.
          </p>

          {/* Carte solde total */}
          {(() => {
            const now = new Date();
            const anneeVac = now.getFullYear();
            const totalJours = vacances
              .filter(v => new Date(v.date_debut).getFullYear() === anneeVac || new Date(v.date_fin).getFullYear() === anneeVac)
              .reduce((s,v) => s + workDaysCount(v.date_debut, v.date_fin, viewKey), 0);
            const DROIT = DROIT_VAC;
            const restant = DROIT - totalJours;
            return (
              <div className={styles.soldeCard} style={{marginBottom:'20px'}}>
                <p className={styles.soldeLabel}>Vacances prises en {anneeVac}</p>
                <p className={styles.soldeVal} style={{color: totalJours > DROIT ? 'var(--rouge)' : 'var(--vert)'}}>
                  {totalJours} <span style={{fontSize:'24px',fontWeight:'normal'}}>/ {DROIT} jours</span>
                </p>
                <div className={styles.soldeMeta}>
                  <span style={{color: restant >= 0 ? 'var(--vert)' : 'var(--rouge)', fontWeight:500}}>
                    {restant >= 0 ? `${restant} jour${restant!==1?'s':''} restants` : `${Math.abs(restant)} jour${Math.abs(restant)!==1?'s':''} de dépassement`}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Bilan mensuel vacances */}
          {(() => {
            const anneeVacBilan = NOW.getFullYear();
            const moisMax = NOW.getMonth() + 1;
            const CREDIT_MENSUEL = CREDIT_MENS;
            const debitParMois = {};
            const wd = viewKey === 'joel' ? [2,3,4,5] : [2,3,4,5,6];
            vacances.forEach(v => {
              const debut = new Date(v.date_debut + 'T12:00:00');
              const fin   = new Date((v.date_fin || v.date_debut) + 'T12:00:00');
              const cur = new Date(debut);
              while (cur <= fin) {
                if (cur.getFullYear() === anneeVacBilan && wd.includes(cur.getDay())) {
                  const m = cur.getMonth() + 1;
                  debitParMois[m] = (debitParMois[m] || 0) + 1;
                }
                cur.setDate(cur.getDate() + 1);
              }
            });
            // Jours pris sur quota 2025 par Emilie (non stockés comme dates 2026 en DB)
            const quota2025 = viewKey === 'emilie' ? JOURS_QUOTA_2025_EMILIE : {};
            Object.entries(quota2025).forEach(([m, j]) => {
              debitParMois[+m] = (debitParMois[+m] || 0) + j;
            });
            let balanceCumul = 0;
            const lignes = [];
            for (let m = MOIS_DEBUT; m <= moisMax; m++) {
              const debit = debitParMois[m] || 0;
              balanceCumul = Math.round((balanceCumul + CREDIT_MENSUEL - debit) * 100) / 100;
              lignes.push({ mois: m, credit: CREDIT_MENSUEL, debit, balance: balanceCumul });
            }
            const balFinale = lignes.length ? lignes[lignes.length-1].balance : 0;
            return (
              <div style={{marginBottom:'20px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                  <p style={{fontSize:'11px',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--gris-lt)',margin:0}}>
                    Bilan mensuel {anneeVacBilan}
                  </p>
                  <span style={{fontSize:'12px',fontWeight:700,color:balFinale>=0?'var(--vert)':'var(--rouge)'}}>
                    Solde : {balFinale>=0?'+':''}{balFinale.toFixed(2)} j
                  </span>
                </div>
                <div className={styles.list}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 90px',gap:'12px',padding:'10px 20px',background:'var(--beige)',fontSize:'11px',letterSpacing:'.06em',textTransform:'uppercase',color:'var(--gris-lt)'}}>
                    <span>Mois</span>
                    <span style={{textAlign:'right'}}>Crédit</span>
                    <span style={{textAlign:'right'}}>Débit</span>
                    <span style={{textAlign:'right'}}>Balance</span>
                  </div>
                  {lignes.map(({mois:m, credit, debit, balance}) => (
                    <div key={m} style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 90px',gap:'12px',padding:'11px 20px',alignItems:'center',borderTop:'1px solid var(--border)'}}>
                      <span style={{fontSize:'13px',color:'var(--gris)'}}>{MOIS_FR[m-1]}</span>
                      <span style={{textAlign:'right',fontSize:'13px',color:'var(--vert)',fontWeight:500}}>+{credit.toFixed(2)} j</span>
                      <span style={{textAlign:'right',fontSize:'13px',color:debit>0?'var(--rouge)':'var(--gris-lt)'}}>
                        {debit > 0 ? '-'+debit+' j' : '—'}
                      </span>
                      <span style={{textAlign:'right',fontSize:'13px',fontWeight:700,color:balance>=0?'var(--vert)':'var(--rouge)'}}>
                        {balance>=0?'+':''}{balance.toFixed(2)} j
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {vacances.length === 0 && <p className={styles.empty}>Aucune période de vacances enregistrée</p>}

          <div className={styles.list}>
            {vacances.length > 0 && (
              <div className={rh.vacHeader}>
                <span>Du</span><span>Au</span><span>Jours</span><span>Description</span><span/>
              </div>
            )}
            {vacances.map(v => {
              const debut = new Date(v.date_debut);
              const fin   = new Date(v.date_fin);
              const jours = workDaysCount(v.date_debut, v.date_fin, viewKey);
              const isPast = fin < new Date();
              return (
                <div key={v.id} className={`${styles.row} ${rh.vacRow}`}
                  style={{opacity: isPast ? 0.6 : 1}}>
                  <span className={styles.rowDate}>{debut.toLocaleDateString('fr-CH')}</span>
                  <span className={styles.rowDate}>{fin.toLocaleDateString('fr-CH')}</span>
                  <span style={{fontWeight:500,color:'var(--gris)'}}>{jours}j</span>
                  <span className={styles.rowAuteur}>{v.description || '—'}</span>
                  <button className={styles.rowDel} onClick={()=>delVac(v.id)}>×</button>
                </div>
              );
            })}
          </div>

          {/* Demandes de vacances */}
          <div style={{marginTop:'28px'}}>
            <p style={{fontSize:'11px',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--gris-lt)',margin:'0 0 8px'}}>
              Demandes de vacances
            </p>
            {demandes.length === 0 && <p className={styles.empty}>Aucune demande envoyée</p>}
            {demandes.length > 0 && (
              <div className={styles.list}>
                {demandes.map(dm => {
                  const debut = new Date(dm.date_debut + 'T12:00:00');
                  const fin   = new Date(dm.date_fin   + 'T12:00:00');
                  const jours = workDaysCount(dm.date_debut, dm.date_fin, viewKey);
                  const s     = DEM_STATUT[dm.statut] || DEM_STATUT.en_attente;
                  return (
                    <div key={dm.id} className={styles.row} style={{alignItems:'center',gap:'8px'}}>
                      <span className={styles.rowDate}>{debut.toLocaleDateString('fr-CH')}</span>
                      <span style={{color:'var(--gris-lt)'}}>→</span>
                      <span className={styles.rowDate}>{fin.toLocaleDateString('fr-CH')}</span>
                      <span style={{color:'var(--gris)',fontWeight:500}}>{jours}j</span>
                      {dm.commentaire && <span className={styles.rowAuteur}>{dm.commentaire}</span>}
                      <div style={{flex:1}}/>
                      <span style={{fontSize:'11px',fontWeight:600,color:s.color,background:s.bg,padding:'3px 8px',borderRadius:'4px',whiteSpace:'nowrap'}}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>)}

        {/* ── POINTAGE ── */}
        {tab==='pointage' && (<>
          {/* Navigation mois */}
          <div className={rh.moisNav}>
            <button className={rh.moisBtn} onClick={prevMois}>‹</button>
            <span className={rh.moisTitle}>{MOIS_FR[mois-1]} {annee}</span>
            <button className={rh.moisBtn} onClick={nextMois}>›</button>
          </div>
          <div className={rh.statCards}>
            <div className={rh.statCard}><div className={rh.statLabel}>Jours pointés</div><div className={rh.statVal}>{nbJours}</div></div>
            <div className={rh.statCard}><div className={rh.statLabel}>Heures travaillées</div><div className={rh.statVal}>{fmtH(totalH)}</div></div>
            <div className={rh.statCard}><div className={rh.statLabel}>Heures sup. (mois)</div><div className={rh.statVal} style={{color:heuresSup>=0?'var(--vert)':'var(--rouge)'}}>{fmtH(heuresSup,true)}</div></div>
            <div className={rh.statCard}><div className={rh.statLabel}>Cumul {annee}</div><div className={rh.statVal} style={{color:cumulYTD>=0?'var(--vert)':'var(--rouge)'}}>{fmtH(cumulYTD,true)}</div></div>
          </div>

          {/* Grille calendrier */}
          <div className={rh.calCard}>
            <div className={rh.calHeader}>
              {JOURS.map(j => <div key={j} className={rh.calHeaderCell}>{j}</div>)}
            </div>
            <div className={rh.calGrid}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} className={rh.calEmpty}/>;
                const dateStr = `${annee}-${String(mois).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const entry   = entriesByDate[dateStr];
                const isFuture = new Date(dateStr) > NOW;
                const isSun    = (i % 7) === 6;
                return (
                  <div key={i}
                    className={`${rh.calCell} ${isSun?rh.calSun:''} ${isFuture?rh.calFuture:''}`}
                    style={{background: isSun||isFuture ? '' : dayColor(entry, dateStr)}}
                    onClick={()=>openDay(dateStr)}>
                    <span className={dateStr === new Date().toISOString().slice(0,10) ? rh.calToday : rh.calDayNum}>{day}</span>
                    {entry?.type === 'vacances' ? (
                      <span className={rh.calHours} style={{color:'var(--orange)',fontSize:'12px'}}>Vacances</span>
                    ) : entry?.type === 'recup' ? (
                      <span className={rh.calHours} style={{color:'var(--violet)',fontSize:'12px'}}>Récup</span>
                    ) : entry?.heures ? (
                      <span className={rh.calHours} style={{color: dayTextColor(entry, dateStr)}}>
                        {fmtH(parseFloat(entry.heures))}
                      </span>
                    ) : null}
                    {entry?.heure_arrivee && (
                      <span className={rh.calTimes}>
                        {entry.heure_arrivee.slice(0,5)}→{entry.heure_depart?.slice(0,5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Légende */}
          <div className={rh.legend}>
            <span className={rh.legendItem} style={{background:'var(--vert-lt)',color:'var(--vert)'}}>≥ 9h</span>
            <span className={rh.legendItem} style={{background:'var(--orange-lt)',color:'var(--orange)'}}>5h–9h</span>
            <span className={rh.legendItem} style={{background:'var(--rouge-lt)',color:'var(--rouge)'}}>{'< 5h'}</span>
            <span className={rh.legendItem} style={{background:'var(--orange-lt)',color:'var(--orange)'}}>Vacances</span>
            <span className={rh.legendItem} style={{background:'var(--fond)',color:'var(--gris-lt)'}}>Pas de pointage</span>
          </div>

          {/* Demandes de récupération */}
          <div style={{marginTop:'28px'}}>
            <p style={{fontSize:'11px',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--gris-lt)',margin:'0 0 8px'}}>
              Demandes de récupération
            </p>
            {demandesRecup.length === 0 && <p className={styles.empty}>Aucune demande envoyée</p>}
            {demandesRecup.length > 0 && (
              <div className={styles.list}>
                {demandesRecup.map(dr => {
                  const s = DEM_STATUT[dr.statut] || DEM_STATUT.en_attente;
                  return (
                    <div key={dr.id} className={styles.row} style={{alignItems:'center',gap:'8px'}}>
                      <span className={styles.rowDate}>{new Date(dr.date_jour+'T12:00:00').toLocaleDateString('fr-CH')}</span>
                      <span style={{color:'var(--violet)',fontWeight:500}}>{dr.heures_recup} h</span>
                      {dr.commentaire && <span className={styles.rowAuteur}>{dr.commentaire}</span>}
                      <div style={{flex:1}}/>
                      <span style={{fontSize:'11px',fontWeight:600,color:s.color,background:s.bg,padding:'3px 8px',borderRadius:'4px',whiteSpace:'nowrap'}}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>)}

        {/* ── RÉSUMÉ ANNUEL ── */}
        {tab==='resume' && (<>
          {/* Sélecteur année */}
          <div className={rh.anneeBar}>
            {[NOW.getFullYear()-1, NOW.getFullYear()].map(a=>(
              <button key={a} className={`${rh.anneeBtn} ${annee===a?rh.anneeBtnOn:''}`}
                onClick={()=>setAnnee(a)}>{a}</button>
            ))}
          </div>

          {/* Solde global */}
          <div className={styles.soldeCard}>
            <p className={styles.soldeLabel}>Solde heures supplémentaires {annee}</p>
            <p className={styles.soldeVal} style={{color:totalSupAnnee>=0?'var(--vert)':'var(--rouge)'}}>
              {fmtH(totalSupAnnee, true)}
            </p>
            <div className={styles.soldeMeta}>
              <span>{bilan.reduce((s,m)=>s+parseInt(m.jours_travailles),0)} jours travaillés</span>
              <span style={{color:'var(--gris)'}}>·</span>
              <span>{fmtH(bilan.reduce((s,m)=>s+parseFloat(m.total_heures||0),0))} au total</span>
            </div>
          </div>

          {/* Graphique barres */}
          {bilan.length > 0 && (
            <div className={rh.chartCard}>
              <p className={styles.soldeLabel} style={{marginBottom:'16px'}}>Heures travaillées par mois</p>
              <div className={rh.barChart}>
                {bilan.map(m => {
                  const h   = parseFloat(m.total_heures||0);
                  const pct = maxH > 0 ? (h / maxH) * 100 : 0;
                  const sup = parseFloat(m.heures_sup||0);
                  return (
                    <div key={m.mois} className={rh.barCol}>
                      <span className={rh.barLabel} style={{color:sup>=0?'var(--vert)':'var(--rouge)',fontSize:'10px',marginBottom:'4px'}}>
                        {fmtH(sup,true)}
                      </span>
                      <div className={rh.barTrack}>
                        <div className={rh.barFill} style={{height:`${pct}%`, background:sup>=0?'var(--vert)':'var(--rouge)'}}/>
                      </div>
                      <span className={rh.barHours}>{fmtH(h)}</span>
                      <span className={rh.barMois}>{MOIS_FR[m.mois-1].slice(0,3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tableau mensuel */}
          <div className={styles.list}>
            <div className={rh.bilanHeaderCumul}>
              <span>Mois</span>
              <span style={{textAlign:'center'}}>Jours</span>
              <span style={{textAlign:'right'}}>Heures</span>
              <span style={{textAlign:'right'}}>Sup. du mois</span>
              <span style={{textAlign:'right'}}>Cumul depuis janvier</span>
            </div>
            {!bilan.length && <p className={styles.empty}>Aucune donnée pour {annee}</p>}
            {(() => {
              let cumul = 0;
              return bilan.map(m => {
                const sup = parseFloat(m.heures_sup||0);
                cumul += sup;
                const cumulSnapshot = cumul; // capture pour cette ligne
                return (
                  <div key={m.mois} className={`${styles.row} ${rh.bilanRowCumul}`}
                    onClick={()=>{ setMois(parseInt(m.mois)); setTab('pointage'); }}>
                    <span className={styles.rowDate}>{MOIS_FR[m.mois-1]} {annee}</span>
                    <span style={{textAlign:'center',color:'var(--gris)'}}>{m.jours_travailles}j</span>
                    <span style={{textAlign:'right',fontWeight:600}}>{fmtH(parseFloat(m.total_heures))}</span>
                    <span style={{textAlign:'right',fontWeight:600,color:sup>=0?'var(--vert)':'var(--rouge)'}}>
                      {fmtH(sup,true)}
                    </span>
                    <span style={{textAlign:'right',fontWeight:700,color:cumulSnapshot>=0?'var(--vert)':'var(--rouge)'}}>
                      {fmtH(cumulSnapshot,true)}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </>)}

        {/* ── ATTESTATIONS ── */}
        {tab==='attestations' && (<>
          <p style={{fontSize:'13px',color:'var(--gris)',margin:'0 0 20px'}}>
            Certificats médicaux, attestations maladie et accident.
          </p>

          {attestations.length === 0 && <p className={styles.empty}>Aucune attestation enregistrée</p>}

          {attestations.length > 0 && (
            <div className={styles.list}>
              <div className={rh.attHeader}>
                <span>Date</span><span>Type</span><span>Titre</span><span/>
              </div>
              {attestations.map(a => {
                const d = a.date_doc ? new Date(a.date_doc+'T12:00:00') : null;
                return (
                  <div key={a.id} className={`${styles.row} ${rh.attRow}`}>
                    <span className={styles.rowDate}>{d ? d.toLocaleDateString('fr-CH') : '—'}</span>
                    <span style={{fontSize:'11px',fontWeight:600,color:ATT_COLORS[a.type_doc]||'var(--gris)'}}>
                      {ATT_TYPES[a.type_doc]||a.type_doc}
                    </span>
                    <div>
                      <span style={{fontSize:'14px',fontWeight:500,color:'var(--noir)',display:'block'}}>{a.titre}</span>
                      <span style={{fontSize:'11px',color:'var(--gris-lt)'}}>{a.original_name}</span>
                    </div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center',justifyContent:'flex-end'}}>
                      <button
                        onClick={()=>openFile(a.id)}
                        style={{fontSize:'12px',color:VERT,background:'var(--vert-lt)',border:'none',padding:'4px 10px',borderRadius:'4px',cursor:'pointer',fontWeight:500}}>
                        Voir
                      </button>
                      <button className={styles.rowDel} onClick={()=>delAtt(a.id)}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}
      </main>

      {/* Modal pointage */}
      {modal && (
        <div className={styles.overlay} onClick={()=>setModal(null)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {new Date(modal.date_jour+'T12:00').toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'})}
              </h2>
              <button className={styles.modalClose} onClick={()=>setModal(null)}>✕</button>
            </div>
            <form onSubmit={submit} className={styles.modalBody}>
              {/* Toggle Travail / Récupération */}
              <div className={rh.typeToggle}>
                {[{id:'travail',label:'Travail',Icon:IcoClock,color:'var(--acc)'},{id:'recup',label:'Récupération',Icon:IcoRotate,color:'var(--violet)'}].map(t=>(
                  <button key={t.id} type="button"
                    className={rh.typeBtn}
                    style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',...(form.type===t.id?{background:t.color,borderColor:t.color,color:'#fff'}:{})}}
                    onClick={()=>setForm(p=>({...p,type:t.id}))}>
                    <t.Icon/>{t.label}
                  </button>
                ))}
              </div>

              {form.type==='recup' ? (<>
                <div className={styles.mf}>
                  <label>Heures à récupérer</label>
                  <input value={form.heures_recup}
                    onChange={e=>setForm(p=>({...p,heures_recup:e.target.value}))}
                    placeholder="ex: 4:30 ou 4.5"
                    style={{fontSize:'18px',fontWeight:'600',textAlign:'center'}}/>
                  <span style={{fontSize:'11px',color:'var(--gris-lt)',marginTop:'4px',display:'block'}}>Format HH:MM ou décimal. Journée complète = 9h</span>
                </div>
                {(() => {
                  let h = form.heures_recup?.toString().trim();
                  if (h?.includes(':')) { const [hh,mm]=h.split(':').map(Number); h=hh+mm/60; } else h=parseFloat(h?.replace(',','.'));
                  if (!isNaN(h) && h > 0) {
                    const hh=Math.floor(h), mm=Math.round((h-hh)*60);
                    return (
                      <div className={rh.preview} style={{background:'var(--violet-lt)',color:'var(--violet)'}}>
                        <span>Récupération</span>
                        <span style={{fontWeight:600}}>-{hh}h{String(mm).padStart(2,'0')} du solde</span>
                      </div>
                    );
                  }
                })()}
              </>) : (<>
                <div className={rh.timeRow}>
                  <div className={styles.mf}>
                    <label>Arrivée</label>
                    <input type="time" value={form.heure_arrivee} step="300"
                      onChange={e=>setForm(p=>({...p,heure_arrivee:e.target.value}))}/>
                  </div>
                  <div className={rh.timeSep}>→</div>
                  <div className={styles.mf}>
                    <label>Départ</label>
                    <input type="time" value={form.heure_depart} step="300"
                      onChange={e=>setForm(p=>({...p,heure_depart:e.target.value}))}/>
                  </div>
                </div>
                {(() => {
                  const [ha,ma]=(form.heure_arrivee||'10:00').split(':').map(Number);
                  const [hd,md]=(form.heure_depart||'19:00').split(':').map(Number);
                  const total=(hd+md/60)-(ha+ma/60);
                  const wd = viewKey === 'joel' ? [2,3,4,5] : [2,3,4,5,6];
                  const dow = modal?.date_jour ? new Date(modal.date_jour + 'T12:00:00').getDay() : -1;
                  const extra = !wd.includes(dow);
                  const cibleEff = extra ? 0 : CIBLE;
                  const delta = extra && viewKey !== 'joel' ? 0 : total - cibleEff;
                  const isNeutre = extra && viewKey !== 'joel';
                  if(total>0) return (
                    <div className={rh.preview} style={{background:isNeutre?'var(--fond)':delta>=0?'var(--vert-lt)':'var(--rouge-lt)',color:isNeutre?'var(--gris)':delta>=0?'var(--vert)':'var(--rouge)'}}>
                      <span>{fmtH(total)} travaillées</span>
                      <span style={{fontWeight:600}}>{isNeutre ? 'Jour hors planning — non comptabilisé' : `${fmtH(delta,true)} vs cible ${cibleEff}h`}</span>
                    </div>
                  );
                })()}
              </>)}

              <div className={styles.mf}>
                <label>Notes (optionnel)</label>
                <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                  placeholder={form.type==='recup'?'Journée récup., matin seulement…':'Formation, déplacement…'}/>
              </div>
              <div className={styles.modalFooter}>
                {modal.entry && (
                  <button type="button" className={styles.btnCancel}
                    style={{color:'var(--rouge)',borderColor:'var(--rouge)'}}
                    onClick={()=>del(modal.entry.id)}>Supprimer</button>
                )}
                <div style={{flex:1}}/>
                <button type="button" className={styles.btnCancel} onClick={()=>setModal(null)}>Annuler</button>
                <button type="submit" className={styles.btnSubmit}
                  style={{background:form.type==='recup'?'var(--violet)':'var(--acc)'}}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal choix destinataire email */}
      {emailModal && (
        <div className={styles.overlay} onClick={()=>setEmailModal(null)}>
          <div className={styles.modalBox} style={{maxWidth:'360px'}} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Envoyer par e-mail</h2>
              <button className={styles.modalClose} onClick={()=>setEmailModal(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.mf}>
                <label>Destinataire</label>
                <input type="email" value={emailTo} autoFocus
                  onChange={e=>setEmailTo(e.target.value)}
                  placeholder="email@exemple.com"
                  onKeyDown={e=>e.key==='Enter'&&sendExport()}/>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.btnCancel} onClick={()=>setEmailModal(null)}>Annuler</button>
                <button className={styles.btnSubmit} style={{background:VERT}}
                  disabled={emailing || !emailTo}
                  onClick={sendExport}>
                  {emailing ? '…' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal upload attestation */}
      {attModal && (
        <div className={styles.overlay} onClick={()=>setAttModal(false)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nouvelle attestation</h2>
              <button className={styles.modalClose} onClick={()=>setAttModal(false)}>✕</button>
            </div>
            <form onSubmit={uploadAtt} className={styles.modalBody}>
              <div className={styles.mf}>
                <label>Titre</label>
                <input value={attForm.titre} required
                  onChange={e=>setAttForm(p=>({...p,titre:e.target.value}))}
                  placeholder="Certificat médical Dr. Martin…"/>
              </div>
              <div className={rh.formRow}>
                <div className={styles.mf}>
                  <label>Type</label>
                  <select value={attForm.type_doc}
                    onChange={e=>setAttForm(p=>({...p,type_doc:e.target.value}))}
                    style={{border:'1.5px solid var(--border)',borderRadius:'6px',padding:'10px 12px',fontSize:'14px',background:'#fff',width:'100%'}}>
                    <option value="maladie">Maladie</option>
                    <option value="accident">Accident</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className={styles.mf}>
                  <label>Date du document</label>
                  <input type="date" value={attForm.date_doc}
                    onChange={e=>setAttForm(p=>({...p,date_doc:e.target.value}))}/>
                </div>
              </div>
              <div className={styles.mf}>
                <label>Fichier (JPG ou PDF)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required
                  onChange={e=>setAttFile(e.target.files[0]||null)}
                  style={{border:'1.5px solid var(--border)',borderRadius:'6px',padding:'10px 12px',fontSize:'13px',width:'100%'}}/>
                {attFile && (
                  <span style={{fontSize:'11px',color:'var(--gris-lt)',marginTop:'4px'}}>
                    {attFile.name} — {(attFile.size/1024).toFixed(0)} Ko
                  </span>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={()=>setAttModal(false)}>Annuler</button>
                <button type="submit" className={styles.btnSubmit} style={{background:VERT}} disabled={attSaving}>
                  {attSaving ? '…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {/* Modal demande de vacances */}
    {demModal && (
      <div className={styles.overlay} onClick={()=>setDemModal(false)}>
        <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Demande de vacances</h2>
            <button className={styles.modalClose} onClick={()=>setDemModal(false)}>✕</button>
          </div>
          <form onSubmit={addDem} className={styles.modalBody}>
            <p style={{fontSize:'13px',color:'var(--gris)',marginTop:0,marginBottom:'16px'}}>
              La demande sera envoyée à Nathalie par e-mail pour validation.
            </p>
            <div className={rh.formRow}>
              <div className={styles.mf}>
                <label>Du</label>
                <input type="date" value={demForm.date_debut} required
                  onChange={e=>setDemForm(p=>({...p,date_debut:e.target.value,date_fin:p.date_fin||e.target.value}))}/>
              </div>
              <div className={styles.mf}>
                <label>Au</label>
                <input type="date" value={demForm.date_fin} min={demForm.date_debut} required
                  onChange={e=>setDemForm(p=>({...p,date_fin:e.target.value}))}/>
              </div>
            </div>
            {demForm.date_debut && demForm.date_fin && demForm.date_fin >= demForm.date_debut && (
              <div className={rh.preview} style={{background:'#e8eaf6',color:VERT}}>
                <span style={{display:'flex',alignItems:'center',gap:'6px'}}><IcoCal/>{workDaysCount(demForm.date_debut, demForm.date_fin, viewKey)} jours</span>
                <span style={{fontSize:'12px'}}>E-mail envoyé à Nathalie pour validation</span>
              </div>
            )}
            <div className={styles.mf}>
              <label>Commentaire (optionnel)</label>
              <input value={demForm.commentaire}
                onChange={e=>setDemForm(p=>({...p,commentaire:e.target.value}))}
                placeholder="Vacances été, semaine ski…"/>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={()=>setDemModal(false)}>Annuler</button>
              <button type="submit" className={styles.btnSubmit} style={{background:VERT}} disabled={demSaving}>
                {demSaving ? '…' : 'Envoyer à Nathalie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    {/* Modal demande de récupération */}
    {demRecupModal && (
      <div className={styles.overlay} onClick={()=>setDemRecupModal(false)}>
        <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Demande de récupération</h2>
            <button className={styles.modalClose} onClick={()=>setDemRecupModal(false)}>✕</button>
          </div>
          <form onSubmit={addDemRecup} className={styles.modalBody}>
            <p style={{fontSize:'13px',color:'var(--gris)',marginTop:0,marginBottom:'16px'}}>
              La demande sera envoyée à Nathalie par e-mail pour validation.
            </p>
            <div className={rh.formRow}>
              <div className={styles.mf}>
                <label>Date</label>
                <input type="date" value={demRecupForm.date_jour} required
                  onChange={e=>setDemRecupForm(p=>({...p,date_jour:e.target.value}))}/>
              </div>
              <div className={styles.mf}>
                <label>Heures</label>
                <input value={demRecupForm.heures_recup} required
                  placeholder="ex: 4:30 ou 4.5"
                  onChange={e=>setDemRecupForm(p=>({...p,heures_recup:e.target.value}))}/>
              </div>
            </div>
            {demRecupForm.date_jour && demRecupForm.heures_recup && (
              <div className={rh.preview} style={{background:'var(--violet-lt)',color:'var(--violet)'}}>
                <span style={{display:'flex',alignItems:'center',gap:'6px'}}><IcoRotate/>{demRecupForm.heures_recup} h de récupération</span>
                <span style={{fontSize:'12px'}}>E-mail envoyé à Nathalie pour validation</span>
              </div>
            )}
            <div className={styles.mf}>
              <label>Commentaire (optionnel)</label>
              <input value={demRecupForm.commentaire}
                onChange={e=>setDemRecupForm(p=>({...p,commentaire:e.target.value}))}
                placeholder="Motif de la récupération…"/>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={()=>setDemRecupModal(false)}>Annuler</button>
              <button type="submit" className={styles.btnSubmit} style={{background:'var(--violet)'}} disabled={demRecupSaving}>
                {demRecupSaving ? '…' : 'Envoyer à Nathalie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    {/* Modal ajout vacances */}
    {vacModal && (
      <div className={styles.overlay} onClick={()=>setVacModal(false)}>
        <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Nouvelle période de vacances</h2>
            <button className={styles.modalClose} onClick={()=>setVacModal(false)}>✕</button>
          </div>
          <form onSubmit={addVac} className={styles.modalBody}>
            <div className={rh.formRow}>
              <div className={styles.mf}>
                <label>Du</label>
                <input type="date" value={vacForm.date_debut} required
                  onChange={e=>setVacForm(p=>({...p,date_debut:e.target.value,date_fin:p.date_fin||e.target.value}))}/>
              </div>
              <div className={styles.mf}>
                <label>Au</label>
                <input type="date" value={vacForm.date_fin} min={vacForm.date_debut} required
                  onChange={e=>setVacForm(p=>({...p,date_fin:e.target.value}))}/>
              </div>
            </div>
            {vacForm.date_debut && vacForm.date_fin && vacForm.date_fin >= vacForm.date_debut && (
              <div className={rh.preview} style={{background:'var(--orange-lt)',color:'var(--orange)'}}>
                <span style={{display:'flex',alignItems:'center',gap:'6px'}}><IcoCal/>{workDaysCount(vacForm.date_debut, vacForm.date_fin, viewKey)} jours</span>
                <span style={{fontSize:'12px'}}>{viewKey === 'joel' ? "Agenda personnel + calendrier marketing" : "Agenda spa bloque + calendrier marketing"}</span>
              </div>
            )}
            <div className={styles.mf}>
              <label>Description (optionnel)</label>
              <input value={vacForm.description}
                onChange={e=>setVacForm(p=>({...p,description:e.target.value}))}
                placeholder="Vacances été, Noël…"/>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={()=>setVacModal(false)}>Annuler</button>
              <button type="submit" className={styles.btnSubmit} style={{background:'var(--orange)'}} disabled={vacSaving}>
                {vacSaving ? '…' : "✓ Enregistrer et bloquer l'agenda"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
