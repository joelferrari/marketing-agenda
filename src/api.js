const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const h = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}` });
export const login          = (d) => fetch(`${BASE}/auth/login`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const getMe          = ()  => fetch(`${BASE}/auth/me`,{headers:h()}).then(r=>r.json());
export const changePassword = (d) => fetch(`${BASE}/auth/change-password`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const getEvents   = (p={})=> fetch(`${BASE}/events?${new URLSearchParams(p)}`,{headers:h()}).then(r=>r.json());
export const createEvent = (d)   => fetch(`${BASE}/events`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const updateEvent = (id,d)=> fetch(`${BASE}/events/${id}`,{method:'PUT',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteEvent = (id)  => fetch(`${BASE}/events/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const getTransactions    = ()     => fetch(`${BASE}/transactions`,{headers:h()}).then(r=>r.json());
export const addTransaction     = (d)    => fetch(`${BASE}/transactions`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const updateTransaction  = (id,d) => fetch(`${BASE}/transactions/${id}`,{method:'PUT',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteTransaction  = (id)   => fetch(`${BASE}/transactions/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());

export const updateInvoice  = (id,fd) => fetch(`${BASE}/invoices/${id}`,{method:'PUT',headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},body:fd}).then(r=>r.json());
export const addInvoiceJSON = (d) => fetch(`${BASE}/invoices`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const getInvoices    = (p={}) => fetch(`${BASE}/invoices?${new URLSearchParams(p)}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const uploadInvoice  = (fd)   => fetch(`${BASE}/invoices/upload`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},body:fd}).then(r=>r.json());
export const deleteInvoice  = (id)   => fetch(`${BASE}/invoices/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const getInvCats     = ()     => fetch(`${BASE}/invoices/categories`,{headers:h()}).then(r=>r.json());
export const addInvCat      = (nom)  => fetch(`${BASE}/invoices/categories`,{method:'POST',headers:h(),body:JSON.stringify({nom})}).then(r=>r.json());
export const delInvCat      = (id)   => fetch(`${BASE}/invoices/categories/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const envoyerInvoice = (id)   => fetch(`${BASE}/invoices/${id}/envoyer`,{method:'POST',headers:h()}).then(r=>r.json());

export const getFacturesCeline    = (p={}) => fetch(`${BASE}/factures-celine?${new URLSearchParams(p)}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const uploadFactureCeline  = (fd)   => fetch(`${BASE}/factures-celine/upload`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},body:fd}).then(r=>r.json());
export const updateFactureCeline  = (id,fd)=> fetch(`${BASE}/factures-celine/${id}`,{method:'PUT',headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},body:fd}).then(r=>r.json());
export const deleteFactureCeline  = (id)   => fetch(`${BASE}/factures-celine/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const envoyerFactureCeline = (id)   => fetch(`${BASE}/factures-celine/${id}/envoyer`,{method:'POST',headers:h()}).then(r=>r.json());

export const getCaisse      = ()    => fetch(`${BASE}/caisse`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const addCaisse      = (d)   => fetch(`${BASE}/caisse`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteCaisse   = (id)  => fetch(`${BASE}/caisse/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());

export const getBudget      = (p={}) => fetch(`${BASE}/budget?${new URLSearchParams(p)}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const addBudget      = (d)    => fetch(`${BASE}/budget`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const uploadBudget   = (fd)   => fetch(`${BASE}/budget/upload`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},body:fd}).then(r=>r.json());
export const updateBudget   = (id,d) => fetch(`${BASE}/budget/${id}`,{method:'PUT',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteBudget   = (id)   => fetch(`${BASE}/budget/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());

export const getPointage   = (p={}) => fetch(`${BASE}/rh/pointage?${new URLSearchParams(p)}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const savePointage  = (d)    => fetch(`${BASE}/rh/pointage`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const delPointage   = (id)   => fetch(`${BASE}/rh/pointage/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const getBilan      = (p={}) => fetch(`${BASE}/rh/bilan?${new URLSearchParams(p)}`,{headers:h(),cache:'no-store'}).then(r=>r.json());

export const getVacances    = (uk='emilie') => fetch(`${BASE}/rh/vacances?user=${uk}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const addVacances    = (d)           => fetch(`${BASE}/rh/vacances`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteVacances = (id,uk='emilie') => fetch(`${BASE}/rh/vacances/${id}?user=${uk}`,{method:'DELETE',headers:h()}).then(r=>r.json());

export const getAbonnements   = ()    => fetch(`${BASE}/abonnements`,{headers:h()}).then(r=>r.json());
export const addAbonnement    = (d)   => fetch(`${BASE}/abonnements`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const toggleAbonnement = (id)  => fetch(`${BASE}/abonnements/${id}/toggle`,{method:'PUT',headers:h()}).then(r=>r.json());
export const deleteAbonnement = (id)  => fetch(`${BASE}/abonnements/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());

export const getDemandesVacances = (uk='emilie') => fetch(`${BASE}/vacances-demandes?user=${uk}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const addDemandeVacances  = (d)           => fetch(`${BASE}/vacances-demandes`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());

export const getDemandesRecup = (uk='emilie') => fetch(`${BASE}/recup-demandes?user=${uk}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const addDemandeRecup  = (d)           => fetch(`${BASE}/recup-demandes`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());

export const emailRH             = (d)  => fetch(`${BASE}/rh/email-export`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const getAttestations     = (uk='emilie') => fetch(`${BASE}/attestations?user=${uk}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const uploadAttestation   = (fd,uk='emilie') => { fd.append('user',uk); return fetch(`${BASE}/attestations`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},body:fd}).then(r=>r.json()); };
export const deleteAttestation   = (id,uk='emilie') => fetch(`${BASE}/attestations/${id}?user=${uk}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const emailAttestations   = (to,uk='emilie') => fetch(`${BASE}/attestations/email`,{method:'POST',headers:h(),body:JSON.stringify({destinataire:to,user:uk})}).then(r=>r.json());
export const getAttestationUrl   = (id) => `${BASE}/attestations/${id}/file`;


export const getTimesheet    = (date, uk='joel') => fetch(`${BASE}/timesheet/semaine?date=${date}&user=${uk}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const saveTimesheetEntry = (d) => fetch(`${BASE}/timesheet`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const updateTimesheetEntry = (id,d) => fetch(`${BASE}/timesheet/${id}`,{method:'PUT',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteTimesheetEntry = (id) => fetch(`${BASE}/timesheet/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const emailTimesheet  = (d) => fetch(`${BASE}/timesheet/email`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const getTimesheetSuggestions = (uk='joel') => fetch(`${BASE}/timesheet/suggestions?user=${uk}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
