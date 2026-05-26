import { useState, useEffect } from 'react';
import { getMe } from './api';
import Login from './pages/Login';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import CreditCard from './pages/CreditCard';
import './index.css';

export default function App() {
  const [user, setUser]         = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage]         = useState('home');

  useEffect(() => {
    const token = localStorage.getItem('mkt_token');
    if (!token) { setChecking(false); return; }
    getMe().then(u => {
      if (u?.id) setUser(u);
      else localStorage.removeItem('mkt_token');
      setChecking(false);
    });
  }, []);

  const logout = () => { localStorage.removeItem('mkt_token'); setUser(null); setPage('home'); };

  if (checking) return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b6560',fontFamily:'system-ui'}}>Chargement…</div>;
  if (!user) return <Login onLogin={u => { setUser(u); setPage('home'); }}/>;

  if (page === 'agenda')  return <Calendar user={user} onLogout={logout} onBack={()=>setPage('home')}/>;
  if (page === 'carte')   return <CreditCard user={user} onLogout={logout} onBack={()=>setPage('home')}/>;
  return <Home user={user} onNavigate={setPage} onLogout={logout}/>;
}
