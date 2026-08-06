/* Agrégation des données existantes pour la cloche de notifications et le
   rappel "Aujourd'hui" de l'accueil — pas de nouvelle table en base, juste
   des requêtes sur les endpoints déjà utilisés par Agenda/Factures/RH/Dépenses. */
import { getEvents, getInvoices, getDemandesVacances, getDemandesRecup, getDepenses } from './api';

const today   = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

export async function getTodayEvents() {
  const d = today();
  try {
    const data = await getEvents({ dateDebut: d, dateFin: d });
    const list = Array.isArray(data) ? data : [];
    return list
      .filter(e => (e.date_debut?.slice(0, 10) || '') <= d && (e.date_fin?.slice(0, 10) || e.date_debut?.slice(0, 10) || '') >= d)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
  } catch { return []; }
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
