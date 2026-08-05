import { useState, useEffect } from 'react';
import { getMe } from './api';
import Login from './pages/Login';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import CreditCard from './pages/CreditCard';
import FacturesFrais from './pages/FacturesFrais';
import Caisse from './pages/Caisse';
import RH from './pages/RH';
import Depenses from './pages/Depenses';
import './index.css';

export default function App() {
  const [user, setUser]         = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage]         = useState('home');
  const [theme, setTheme]       = useState(() => localStorage.getItem('mkt_theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mkt_theme', theme);
  }, [theme]);

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
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const ThemeToggle = () => (
    <button className="themeToggle" onClick={toggleTheme}
      title={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
      aria-label="Basculer le thème">
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );

  if (checking) return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gris)',fontFamily:'var(--font-ui)'}}>Chargement…</div>;
  if (!user) return <><Login onLogin={u => { setUser(u); setPage('home'); }}/><ThemeToggle/></>;

  let pageEl;
  if (page === 'agenda')              pageEl = <Calendar user={user} onLogout={logout} onBack={()=>setPage('home')}/>;
  else if (page === 'carte')          pageEl = <CreditCard user={user} onLogout={logout} onBack={()=>setPage('home')}/>;
  else if (page === 'factures-frais') pageEl = <FacturesFrais user={user} onBack={()=>setPage('home')} onLogout={logout}/>;
  else if (page === 'caisse')         pageEl = <Caisse user={user} onBack={()=>setPage('home')} onLogout={logout}/>;
  else if (page === 'rh')             pageEl = <RH user={user} onBack={()=>setPage('home')} onLogout={logout}/>;
  else if (page === 'depenses')       pageEl = <Depenses user={user} onBack={()=>setPage('home')} onLogout={logout}/>;
  else                                pageEl = <Home user={user} onNavigate={setPage} onLogout={logout}/>;

  return <>{pageEl}<ThemeToggle/></>;
}
