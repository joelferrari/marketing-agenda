/* Données de navigation partagées (barre latérale + tableau de bord).
   Un seul endroit pour la liste des modules, leurs couleurs et leurs icônes. */

const s = (p, sw = 1.4) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' });

export const IconHome = () => (<svg {...s()}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>);
export const IconCalendar = () => (<svg {...s()}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 3v3M16 3v3"/></svg>);
export const IconCard = () => (<svg {...s()}><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>);
export const IconReceipt = () => (<svg {...s()}><path d="M14 2H6a2 2 0 00-2 2v18l3-2 3 2 3-2 3 2V8z"/><path d="M14 2v6h6M8 12h8M8 16h5"/></svg>);
export const IconDepenses = () => (<svg {...s()}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>);
export const IconRH = () => (<svg {...s()}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>);
export const IconCaisse = () => (<svg {...s()}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M12 12v4M10 14h4"/></svg>);
export const IconAdmin = () => (<svg {...s()}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>);
export const IconPOS = () => (<svg {...s()}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>);
export const IconClock = () => (<svg {...s()}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>);
export const IconSearch = () => (<svg {...s(1.5)} width="18" height="18"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>);
export const IconBell = () => (<svg {...s(1.5)} width="18" height="18"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>);
export const IconLogout = () => (<svg {...s(1.5)} width="17" height="17"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>);
export const Arrow = () => (<svg {...s(1.6)} width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg>);

/* Accent neutre (Accueil / coquille) — famille Meadow, comme la maquette. */
export const HOME_ACCENT = { soft:'#a4bda8', deep:'#6f9179', ink:'#213328' };

/* color = teinte moyenne (icône) · soft = pastel opaque (fond pastille/tuile) · ink = texte foncé sur pastel */
const rhLabel = (user) => user?.role === 'admin' ? 'RH — Admin' : `RH — ${user?.prenom || 'Emilie'}`;

export const getModules = (user) => [
  { id:'agenda',         mod:'agenda',    label:'Agenda Marketing',    desc:'Campagnes, newsletters et événements',   color:'#c56e6e', deep:'#af5b5b', soft:'#eba5a5', ink:'#571f1f', Icon:IconCalendar },
  { id:'carte',          mod:'carte',     label:'Carte de crédit',     desc:'Dépenses et virements de la carte',       color:'#e39b45', deep:'#c9842f', soft:'#ffca8c', ink:'#553611', Icon:IconCard },
  { id:'factures-frais', mod:'factures',  label:'Factures frais',      desc:'Upload et gestion des factures',          color:'#6f9179', deep:'#5a7a64', soft:'#a4bda8', ink:'#213328', Icon:IconReceipt },
  { id:'depenses',       mod:'depenses',  label:'Demandes de dépense', desc:'À valider par Nathalie',                  color:'#e28a56', deep:'#c9743f', soft:'#fabb92', ink:'#552c12', Icon:IconDepenses },
  { id:'rh',             mod:'rh',        label:rhLabel(user),         desc:'Heures, heures sup. et vacances',         color:'#8d8858', deep:'#787245', soft:'#c7c19d', ink:'#302f19', Icon:IconRH },
  ...(user?.prenom === 'Joël' ? [
    { id:'timesheet',    mod:'timesheet', label:'Feuille de temps',    desc:'Tâches hebdo par projet et entité',       color:'#862e9c', deep:'#6f2482', soft:'#d9b3e6', ink:'#3a1042', Icon:IconClock },
  ] : []),
  { id:'caisse',         mod:'caisse',    label:'Caisse cash',         desc:'Suivi espèces, import POS auto',          color:'#cf8078', deep:'#b8675f', soft:'#f5cec7', ink:'#592923', Icon:IconCaisse },
];

export const EXTERNAL = [
  { href:'https://booking.rubisspa.ch/admin', label:'Administration', Icon:IconAdmin },
  { href:'https://booking.rubisspa.ch/pos',   label:'Point de vente', Icon:IconPOS },
];

export const getTitles = (user) => ({
  home:'Accueil', agenda:'Agenda Marketing', carte:'Carte de crédit',
  'factures-frais':'Factures frais', depenses:'Demandes de dépense',
  rh:rhLabel(user), caisse:'Caisse cash', timesheet:'Feuille de temps',
});
