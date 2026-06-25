# Rubis SPA — Portail marketing (marketing-agenda)

Frontend React/Vite du **portail staff** servi sous
`https://booking.rubisspa.ch/marketing/`. Regroupe l'agenda marketing, le
suivi carte de crédit, les factures de frais, le budget, la caisse cash, le
module RH d'Emilie et les demandes de dépense.

Langue de travail : **français**.
Backend associé : `rubis-spa-backend`, routes sous `/mkt/*` (+ `/api/depenses/*`).

---

## ⚠️ Règles critiques

1. **Le serveur ne reçoit que le `dist/` compilé** (déployé dans
   `marketing-dist/`). Toujours `git pull` avant de modifier.
2. **Apostrophes françaises dans le JSX** = cause n°1 d'échec de build
   (`l'agenda`, `d'Emilie`…). Les échapper (`l\'agenda`) ou utiliser des
   guillemets `"…"`. **Toujours valider `npm run build` avant de déployer.**
3. **Réponses API défensives** : encadrer les `.map()` par
   `Array.isArray(d) ? d : []` — une route en erreur renvoie un objet, pas un
   tableau, et casse le rendu.
4. Quand on ajoute une page : **import + route dans `App.jsx`** ET carte dans
   `Home.jsx`. Oublier l'un des deux = page qui ne s'ouvre pas / invisible.

---

## Stack & structure

- **React + Vite**, CSS Modules. API dans `src/api.js`.
- Auth portail : token dans `localStorage` (`mkt_token`).

```
src/
  api.js                 # fonctions /mkt/* (helper h() = headers + JWT)
  App.jsx                # routing par état `page` (home, rh, depenses, ...)
  pages/
    Home.jsx             # cartes d'accès (INTERNAL = liste des modules)
    Calendar.jsx         # agenda marketing (events multi-jours)
    CreditCard.jsx       # suivi carte de crédit
    FacturesFrais.jsx    # factures de frais + budget (onglets)
    Caisse.jsx           # caisse cash (import POS)
    RH.jsx               # pointage Emilie, résumé annuel, vacances
    Depenses.jsx         # demandes de dépense (validation Nathalie)
```

---

## Déploiement

```bash
cd ~/Downloads/marketing-agenda && git pull
npm run build
scp -P 22 -r dist/* \
  $RUBIS_SSH:/srv/customer/sites/booking.rubisspa.ch/marketing-dist/
```

`$RUBIS_SSH` = `<user>@57-110479.ssh.hosting-ik.com` (mot de passe interactif,
hors Git). Pas de redémarrage (statique).

---

## Conventions métier

- **RH — pointage** (`RH.jsx` + backend `marketing_rh.js`) :
  - Cible 9 h/jour. Calendrier mensuel cliquable (passé ET futur).
  - Type `travail` ou `recup`. Une récup bloque l'agenda spa
    (`staff_jours_exceptionnels`) + crée un event marketing violet, et
    consomme des heures sup. (montant saisi en HH:MM ou décimal).
  - Couleurs : vert ≥9h / orange 5–9h / rouge <5h / violet récup.
  - Résumé annuel : colonne « Cumul depuis janvier » qui s'accumule ;
    vue mois affiche une pill « Cumul {année} ».
- **Vacances** : période du/au → bloque chaque jour dans l'agenda spa + event
  marketing doré. Carte solde `X / 20 jours`.
- **Carte de crédit** : chaque dépense crée automatiquement une facture dans
  Factures frais (catégorie « Carte de crédit », `addInvoiceJSON`).
- **Factures frais** : filtres sur `date_facture` ; édition avec fichier
  optionnel ; boutons ✎/× groupés dans une seule cellule.
- **Caisse cash** : alimentée côté backend (part espèces, date du RDV). Les
  entrées POS sont en badge vert non supprimables.
- **Demandes de dépense** (`Depenses.jsx`) : formulaire Emilie → email à
  Nathalie avec boutons Valider/Refuser (liens `/api/depenses/:token/...`) →
  statut mis à jour + email à info@rubisspa.ch. Icône = document + coche,
  cohérente entre Home et header de page.
- **Agenda marketing** (`Calendar.jsx`) : `evForDate` doit inclure toute la
  plage `date_debut <= d <= COALESCE(date_fin, date_debut)` (events multi-jours).

---

## Accès

- URL : `https://booking.rubisspa.ch/marketing/`
- Login portail : `info@rubisspa.ch` (mot de passe hors Git).

---

## Vérifications avant commit

- `npm run build` **sans erreur** (apostrophes JSX !).
- Nouvelle page → vérifier `App.jsx` (route) **et** `Home.jsx` (carte).
- `.map()` protégés par `Array.isArray`.
- Commits en français, descriptifs.
