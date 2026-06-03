const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const h = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}` });
export const login       = (d)   => fetch(`${BASE}/auth/login`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const getMe       = ()    => fetch(`${BASE}/auth/me`,{headers:h()}).then(r=>r.json());
export const getEvents   = (p={})=> fetch(`${BASE}/events?${new URLSearchParams(p)}`,{headers:h()}).then(r=>r.json());
export const createEvent = (d)   => fetch(`${BASE}/events`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const updateEvent = (id,d)=> fetch(`${BASE}/events/${id}`,{method:'PUT',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteEvent = (id)  => fetch(`${BASE}/events/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const getTransactions    = ()    => fetch(`${BASE}/transactions`,{headers:h()}).then(r=>r.json());
export const addTransaction     = (d)   => fetch(`${BASE}/transactions`,{method:'POST',headers:h(),body:JSON.stringify(d)}).then(r=>r.json());
export const deleteTransaction  = (id)  => fetch(`${BASE}/transactions/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());

export const getInvoices    = (p={}) => fetch(`${BASE}/invoices?${new URLSearchParams(p)}`,{headers:h(),cache:'no-store'}).then(r=>r.json());
export const uploadInvoice  = (fd)   => fetch(`${BASE}/invoices/upload`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('mkt_token')||''}`},body:fd}).then(r=>r.json());
export const deleteInvoice  = (id)   => fetch(`${BASE}/invoices/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
export const getInvCats     = ()     => fetch(`${BASE}/invoices/categories`,{headers:h()}).then(r=>r.json());
export const addInvCat      = (nom)  => fetch(`${BASE}/invoices/categories`,{method:'POST',headers:h(),body:JSON.stringify({nom})}).then(r=>r.json());
export const delInvCat      = (id)   => fetch(`${BASE}/invoices/categories/${id}`,{method:'DELETE',headers:h()}).then(r=>r.json());
