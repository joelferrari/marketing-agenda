/* Agrégation des données existantes pour la cloche de notifications et le
   rappel "Aujourd'hui" de l'accueil — pas de nouvelle table en base, juste
   des requêtes sur les endpoints déjà utilisés par Agenda/Factures/RH/Dépenses. */
import { getEvents, getInvoices, getDemandesVacances, getDemandesRecup, getDepenses, getVacances, getBilan } from './api';

const today   = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// Jours ouvrés du user dans une plage (mar-sam Emilie, mar-ven Joël) —
// même logique que RH.jsx (workDaysCount).
function workDaysCount(dateDebut, dateFin, userKey) {
  if (!dateDebut || !dateFin) return 0;
  const wd = userKey === 'joel' ? [2, 3, 4, 5] : [2, 3, 4, 5, 6];
  let n = 0;
  const cur = new Date(dateDebut + 'T12:00:00');
  const end = new Date(dateFin + 'T12:00:00');
  while (cur <= end) {
    if (wd.includes(cur.getDay())) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

const PRENOMS = { emilie: 'Emilie', joel: 'Joël' };

// Solde de vacances de l'utilisateur CONNECTÉ (pas toujours Emilie).
export async function getVacationBalance(user) {
  const viewKey = (user?.role === 'emilie' || user?.role === 'joel') ? user.role : 'emilie';
  const droit = viewKey === 'joel' ? 16 : 20;
  const annee = new Date().getFullYear();
  try {
    const data = await getVacances(viewKey);
    const list = Array.isArray(data) ? data : [];
    const pris = list
      .filter(v => new Date(v.date_debut).getFullYear() === annee || new Date(v.date_fin).getFullYear() === annee)
      .reduce((s, v) => s + workDaysCount(v.date_debut, v.date_fin, viewKey), 0);
    return { prenom: PRENOMS[viewKey] || viewKey, pris, droit, restant: droit - pris };
  } catch {
    return { prenom: PRENOMS[viewKey] || viewKey, pris: 0, droit, restant: droit };
  }
}

async function getEventsForDate(d) {
  try {
    const data = await getEvents({ dateDebut: d, dateFin: d });
    const list = Array.isArray(data) ? data : [];
    return list
      .filter(e => (e.date_debut?.slice(0, 10) || '') <= d && (e.date_fin?.slice(0, 10) || e.date_debut?.slice(0, 10) || '') >= d)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
  } catch { return []; }
}

export async function getTodayEvents() {
  return getEventsForDate(today());
}

export async function getTomorrowEvents() {
  return getEventsForDate(daysFromNow(1));
}

// Nombre d'événements de l'agenda marketing dans le mois en cours.
export async function getEventsThisMonthCount() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  try {
    const data = await getEvents({ dateDebut: start, dateFin: end });
    const list = Array.isArray(data) ? data : [];
    return list.filter(e => {
      const es = e.date_debut?.slice(0, 10);
      const ef = e.date_fin?.slice(0, 10) || es;
      return es && ef >= start && es <= end;
    }).length;
  } catch { return 0; }
}

// Nombre de factures frais pas encore payées.
export async function getPendingInvoicesCount() {
  try {
    const data = await getInvoices({});
    const list = Array.isArray(data) ? data : [];
    return list.filter(i => i.statut !== 'payee').length;
  } catch { return 0; }
}

// Cumul d'heures sup. depuis janvier pour l'utilisateur CONNECTÉ (même
// calcul que "Cumul {année}" dans RH.jsx : somme des heures_sup mensuelles
// du bilan jusqu'au mois en cours inclus).
export async function getOvertimeBalance(user) {
  const viewKey = (user?.role === 'emilie' || user?.role === 'joel') ? user.role : 'emilie';
  const now = new Date();
  try {
    const data = await getBilan({ annee: now.getFullYear(), user: viewKey });
    const list = Array.isArray(data) ? data : [];
    const mois = now.getMonth() + 1;
    return list.filter(m => parseInt(m.mois) <= mois).reduce((s, m) => s + parseFloat(m.heures_sup || 0), 0);
  } catch { return null; }
}

// Factures marquées payées + demandes (vacances/récup/dépense) validées dans les 7 derniers jours.
export async function getRecentApprovals(user) {
  const viewKey = (user?.role === 'emilie' || user?.role === 'joel') ? user.role : 'emilie';
  const limite = daysAgo(7);

  const [invoices, vacances, recup, depenses] = await Promise.all([
    getInvoices({}).catch(() => []),
    getDemandesVacances(viewKey).catch(() => []),
    getDemandesRecup(viewKey).catch(() => []),
    getDepenses().catch(() => []),
  ]);

  const facturesPayees = (Array.isArray(invoices) ? invoices : [])
    .filter(i => i.statut === 'payee' && i.payee_le && i.payee_le.slice(0, 10) >= limite)
    .map(i => ({
      id: `facture-${i.id}`, page: 'factures-frais',
      titre: i.description || 'Facture', sousTitre: `${parseFloat(i.montant || 0).toFixed(2)} CHF`,
      date: i.payee_le,
    }));

  const demandesValidees = [
    ...(Array.isArray(vacances) ? vacances : [])
      .filter(v => v.statut === 'validee' && v.repondu_at && v.repondu_at.slice(0, 10) >= limite)
      .map(v => ({
        id: `vacances-${v.id}`, page: 'rh',
        titre: 'Vacances validées', sousTitre: `Du ${v.date_debut} au ${v.date_fin}`,
        date: v.repondu_at,
      })),
    ...(Array.isArray(recup) ? recup : [])
      .filter(r => r.statut === 'validee' && r.repondu_at && r.repondu_at.slice(0, 10) >= limite)
      .map(r => ({
        id: `recup-${r.id}`, page: 'rh',
        titre: 'Récupération validée', sousTitre: `${r.heures_recup}h le ${r.date_jour}`,
        date: r.repondu_at,
      })),
    ...(Array.isArray(depenses) ? depenses : [])
      .filter(d => d.statut === 'validee' && d.repondu_at && d.repondu_at.slice(0, 10) >= limite)
      .map(d => ({
        id: `depense-${d.id}`, page: 'depenses',
        titre: 'Dépense validée', sousTitre: `${d.titre} — ${parseFloat(d.prix || 0).toFixed(2)} CHF`,
        date: d.repondu_at,
      })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return { facturesPayees, demandesValidees };
}
