import { useState } from 'react';
import { changePassword } from '../api';
import styles from './Home.module.css';

const IconCalendar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 4v2M16 4v2"/>
  </svg>
);
const IconCard = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h4"/>
  </svg>
);
const IconReceipt = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconCaisse = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="2" y="7" width="20" height="15" rx="2"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const IconDepenses = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <polyline points="9 15 11 17 15 13" strokeWidth="1.6"/>
  </svg>
);
const IconRH = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0113 0"/>
  </svg>
);
const IconAdmin = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconPOS = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
);
const IconKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
  </svg>
);

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

const EXTERNAL = [
  { href:'https://booking.rubisspa.ch/admin', Icon:IconAdmin, titre:'Administration', desc:'Réservations, planning et gestion du spa', color:'#9b59b6' },
  { href:'https://booking.rubisspa.ch/pos',   Icon:IconPOS,   titre:'Point de vente', desc:'Caisse et encaissement sur place',          color:'#e67e22' },
];

const S = {
  overlay: { position:'fixed',inset:0,background:'rgba(42,40,37,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 },
  box:     { background:'#fff',borderRadius:'12px',padding:'32px',width:'100%',maxWidth:'360px',boxShadow:'0 8px 40px rgba(0,0,0,.18)' },
  title:   { fontFamily:'inherit',fontSize:'17px',fontWeight:400,color:'#2a2825',margin:'0 0 24px' },
  label:   { display:'block',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.08em',color:'#b0aaa7',marginBottom:'5px',marginTop:'14px' },
  input:   { width:'100%',border:'1px solid #eeddd8',borderRadius:'6px',padding:'9px 12px',fontSize:'13px',fontFamily:'inherit',outline:'none',color:'#2a2825',boxSizing:'border-box' },
  err:     { fontSize:'12px',color:'#c62828',marginTop:'12px' },
  ok:      { fontSize:'12px',color:'#4a7c5f',marginTop:'12px',fontWeight:500 },
  footer:  { display:'flex',justifyContent:'flex-end',gap:'8px',marginTop:'24px' },
  cancel:  { background:'none',border:'1px solid #eeddd8',borderRadius:'6px',padding:'8px 18px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',color:'#6b6560' },
  submit:  { background:'#4a7c5f',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 20px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit' },
};

export default function Home({ user, onNavigate, onLogout }) {
  const [pwModal,  setPwModal]  = useState(false);
  const [pwForm,   setPwForm]   = useState({ current:'', nouveau:'', confirm:'' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErr,    setPwErr]    = useState('');
  const [pwOk,     setPwOk]     = useState(false);

  const openPw = () => { setPwForm({current:'',nouveau:'',confirm:''}); setPwErr(''); setPwOk(false); setPwModal(true); };
  const closePw = () => setPwModal(false);

  const submitPw = async (e) => {
    e.preventDefault();
    setPwErr('');
    if (pwForm.nouveau !== pwForm.confirm) { setPwErr('Les mots de passe ne correspondent pas'); return; }
    if (pwForm.nouveau.length < 6) { setPwErr('Minimum 6 caractères'); return; }
    setPwSaving(true);
    try {
      const d = await changePassword({ current_password: pwForm.current, new_password: pwForm.nouveau });
      if (d.erreur) { setPwErr(d.erreur); return; }
      setPwOk(true);
      setTimeout(closePw, 1500);
    } catch { setPwErr('Erreur réseau'); }
    finally { setPwSaving(false); }
  };

  const rhLabel = user.role === 'admin' ? 'RH — Admin' : `RH — ${user.prenom}`;

  const INTERNAL = [
    { id:'agenda',         Icon:IconCalendar, titre:'Agenda Marketing',     desc:'Campagnes, newsletters et événements marketing',        color:'#3b5bdb' },
    { id:'carte',          Icon:IconCard,     titre:'Carte de crédit',      desc:'Dépenses et virements de la carte du spa',              color:'#c4737c' },
    { id:'factures-frais', Icon:IconReceipt,  titre:'Factures frais',       desc:'Upload et gestion des factures de frais',               color:'#6b8a5e' },
    { id:'depenses',       Icon:IconDepenses, titre:'Demandes de dépense',  desc:'Soumettre une dépense à Nathalie pour validation',      color:'#e67e22' },
    { id:'rh',             Icon:IconRH,       titre:rhLabel,                desc:'Heures travaillées, heures sup. et vacances',           color:'#1098ad' },
    ...(user.prenom === 'Joël' ? [{ id:'timesheet', Icon:IconCalendar, titre:'Feuille de temps', desc:'Tâches hebdomadaires par projet et entité, rapport Grace', color:'#862e9c' }] : []),
    { id:'caisse',         Icon:IconCaisse,   titre:'Caisse cash',          desc:'Suivi de la caisse espèces avec import POS auto',       color:'#2b8a3e' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src="https://booking.rubisspa.ch/logo.png" alt="Rubis SPA" className={styles.logo}
            onError={e=>e.target.style.display='none'}/>
          <span className={styles.headerSub}>Espace Staff</span>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button className={styles.logoutBtn}
            onClick={openPw}
            style={{display:'inline-flex',alignItems:'center',gap:'5px'}}>
            <IconKey/> Mot de passe
          </button>
          <button className={styles.logoutBtn} onClick={onLogout}>Déconnexion</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcome}>
          <p className={styles.welcomeGreet}>Bonjour, {user.prenom}</p>
          <h2 className={styles.welcomeTitle}>Que souhaitez-vous faire ?</h2>
        </div>
        <div className={styles.grid}>
          {INTERNAL.map(({ id, Icon, titre, desc, color }) => (
            <button key={id} className={styles.card} onClick={()=>onNavigate(id)}>
              <div className={styles.cardIcon} style={{color}}><Icon/></div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{titre}</h3>
                <p className={styles.cardDesc}>{desc}</p>
              </div>
              <Arrow/>
            </button>
          ))}
          {EXTERNAL.map(({ href, Icon, titre, desc, color }) => (
            <a key={href} className={styles.card} href={href} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
              <div className={styles.cardIcon} style={{color}}><Icon/></div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{titre}</h3>
                <p className={styles.cardDesc}>{desc}</p>
              </div>
              <Arrow/>
            </a>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>✦ Rubis SPA · Espace privé</footer>

      {pwModal && (
        <div style={S.overlay} onClick={closePw}>
          <div style={S.box} onClick={e=>e.stopPropagation()}>
            <h2 style={S.title}>Changer le mot de passe</h2>
            <form onSubmit={submitPw}>
              <label style={S.label}>Mot de passe actuel</label>
              <input type="password" style={S.input} autoFocus required
                value={pwForm.current}
                onChange={e=>setPwForm(p=>({...p,current:e.target.value}))}/>
              <label style={S.label}>Nouveau mot de passe</label>
              <input type="password" style={S.input} required
                value={pwForm.nouveau}
                onChange={e=>setPwForm(p=>({...p,nouveau:e.target.value}))}
                placeholder="6 caractères minimum"/>
              <label style={S.label}>Confirmer le nouveau mot de passe</label>
              <input type="password" style={S.input} required
                value={pwForm.confirm}
                onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))}/>
              {pwErr && <p style={S.err}>{pwErr}</p>}
              {pwOk  && <p style={S.ok}>Mot de passe modifié ✓</p>}
              <div style={S.footer}>
                <button type="button" style={S.cancel} onClick={closePw}>Annuler</button>
                <button type="submit" style={S.submit} disabled={pwSaving}>
                  {pwSaving ? '…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
