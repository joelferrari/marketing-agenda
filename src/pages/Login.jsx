import { useState } from 'react';
import { login } from '../api';
import styles from './Login.module.css';

export default function Login({ onLogin }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const r = await login({ email, password });
    setLoading(false);
    if (r.erreur) { setError(r.erreur); return; }
    localStorage.setItem('mkt_token', r.token);
    onLogin(r.user);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src="https://booking.rubisspa.ch/logo.png" alt="Rubis SPA" className={styles.logoImg}
            onError={e=>{e.target.style.display='none'}}/>
          <div>
            <span className={styles.logoSub}>Rubis SPA</span>
            <span className={styles.logoTitle}>Espace Staff</span>
          </div>
        </div>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com" required/>
          </div>
          <div className={styles.field}>
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
