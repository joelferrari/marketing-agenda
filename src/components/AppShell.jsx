import { getModules, HOME_ACCENT, EXTERNAL, getTitles, IconHome, IconLogout } from '../nav';
import NotificationBell from './NotificationBell';
import styles from './AppShell.module.css';

/* Coquille persistante : barre latérale + header unifié + panneau de contenu.
   Props : user, page, onNavigate(id), onLogout, children. */
export default function AppShell({ user, page, onNavigate, onLogout, children }) {
  const MODULES = getModules(user);
  const TITLES = getTitles(user);
  const active = MODULES.find(m => m.id === page);
  const mod = active?.mod;               // token data-module du contenu affiché
  const prenom = user?.prenom || 'Émilie';
  const initiale = prenom.slice(0, 1).toUpperCase();

  return (
    <div className={styles.shell} data-module={mod}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          <img src={`${import.meta.env.BASE_URL}rubis-pilot.png`} alt="Rubis Pilot" className={styles.brandLogo}
            onError={e => { e.target.style.display = 'none'; }}/>
          <div>
            <div className={styles.brandSub}>Rubis SPA</div>
            <div className={styles.brandName}>Rubis Pilot</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={styles.navItem} data-on={page === 'home'} onClick={() => onNavigate('home')}
            style={page === 'home' ? { background: HOME_ACCENT.soft, color: HOME_ACCENT.ink, fontWeight: 600 } : undefined}>
            <span className={styles.navIcon}><IconHome/></span><span className={styles.navLabel}>Accueil</span>
          </button>
          {MODULES.map(m => {
            const on = page === m.id;
            return (
              <button key={m.id} className={styles.navItem} data-on={on} onClick={() => onNavigate(m.id)}
                style={on ? { background: m.soft, color: m.ink, fontWeight: 600 } : undefined}>
                <span className={styles.navIcon}><m.Icon/></span>
                <span className={styles.navLabel}>{m.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.navDivider}/>
        <div className={styles.navHeading}>Externe</div>
        {EXTERNAL.map(e => (
          <a key={e.href} className={styles.navItem} href={e.href} target="_blank" rel="noreferrer">
            <span className={styles.navIcon}><e.Icon/></span><span className={styles.navLabel}>{e.label}</span>
          </a>
        ))}

        <div className={styles.userCard}>
          <span className={styles.avatar}>{initiale}</span>
          <div className={styles.userMeta}>
            <div className={styles.userName}>{prenom}</div>
            <div className={styles.userRole}>Marketing</div>
          </div>
          <button className={styles.logoutBtn} onClick={onLogout} title="Déconnexion" aria-label="Déconnexion">
            <IconLogout/>
          </button>
        </div>
      </aside>

      <div className={styles.body}>
        <header className={styles.topbar}>
          <div className={styles.pageTitle}>{TITLES[page] || 'Accueil'}</div>
          <div className={styles.topbarRight}>
            <NotificationBell user={user} onNavigate={onNavigate}/>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
