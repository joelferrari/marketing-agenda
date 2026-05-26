import styles from './Home.module.css';

const IconCalendar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 4v2M16 4v2"/>
  </svg>
);

const IconCard = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h4"/>
  </svg>
);

const cards = [
  { id:'agenda', Icon:IconCalendar, titre:'Agenda Marketing', desc:'Campagnes, newsletters et événements marketing', color:'#3b5bdb' },
  { id:'carte',  Icon:IconCard,     titre:'Carte de crédit',  desc:'Dépenses et virements de la carte du spa',   color:'#c4737c' },
];

export default function Home({ user, onNavigate, onLogout }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src="https://booking.rubisspa.ch/logo.png" alt="Rubis SPA" className={styles.logo}
            onError={e=>e.target.style.display='none'}/>
          <span className={styles.headerSub}>Espace Staff</span>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout}>Déconnexion</button>
      </header>

      <main className={styles.main}>
        <div className={styles.welcome}>
          <p className={styles.welcomeGreet}>Bonjour, {user.prenom}</p>
          <h2 className={styles.welcomeTitle}>Que souhaitez-vous faire ?</h2>
        </div>
        <div className={styles.grid}>
          {cards.map(({ id, Icon, titre, desc, color }) => (
            <button key={id} className={styles.card} onClick={()=>onNavigate(id)}>
              <div className={styles.cardIcon} style={{color}}>
                <Icon/>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{titre}</h3>
                <p className={styles.cardDesc}>{desc}</p>
              </div>
              <svg className={styles.cardArrow} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>✦ Rubis SPA · Espace privé</footer>
    </div>
  );
}
