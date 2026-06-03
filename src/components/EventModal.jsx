import { useState } from 'react';
import styles from './EventModal.module.css';

const COLORS = [
  {label:'Indigo',val:'#3b5bdb'},{label:'Teal',val:'#0ca678'},{label:'Violet',val:'#7950f2'},
  {label:'Ciel',val:'#22b8cf'},{label:'Corail',val:'#f76707'},{label:'Or',val:'#fab005'},
  {label:'Fraise',val:'#e03131'},{label:'Sauge',val:'#5c940d'},
];

const CATS = ['Vacances','Maladie','Récup. heures sup.','Marketing','Autre'];

const CAT_COLORS = {
  'Vacances':'#fab005','Maladie':'#e03131','Récup. heures sup.':'#7950f2',
  'Marketing':'#3b5bdb','Autre':'#868e96',
};

const empty = (date='') => ({
  titre:'',description:'',categorie:'',
  date_debut:date,date_fin:date,
  heure_debut:'09:00',heure_fin:'10:00',
  toute_la_journee:false,couleur:'#3b5bdb',rappel_email:false,
});

export default function EventModal({ event, defaultDate, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(event
    ? {...event, heure_debut:event.heure_debut?.slice(0,5)||'', heure_fin:event.heure_fin?.slice(0,5)||'', date_fin:event.date_fin||event.date_debut||''}
    : empty(defaultDate));
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const selectCat = (cat) => {
    set('categorie', form.categorie===cat ? '' : cat);
    if (cat && CAT_COLORS[cat] && !event) set('couleur', CAT_COLORS[cat]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titre || !form.date_debut) return;
    // S'assurer que date_fin >= date_debut
    const payload = {...form};
    if (!payload.date_fin || payload.date_fin < payload.date_debut) payload.date_fin = payload.date_debut;
    setSaving(true); await onSave(payload); setSaving(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{event ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className={styles.body}>

          {/* Titre */}
          <div className={styles.field}>
            <label>Titre *</label>
            <input value={form.titre} onChange={e=>set('titre',e.target.value)} placeholder="Ex: Newsletter été, Campagne Instagram…" required/>
          </div>

          {/* Catégorie */}
          <div className={styles.field}>
            <label>Catégorie</label>
            <div className={styles.catBtns}>
              {CATS.map(c=>(
                <button key={c} type="button"
                  className={`${styles.catBtn} ${form.categorie===c ? styles.catBtnOn : ''}`}
                  style={form.categorie===c ? {background:CAT_COLORS[c],borderColor:CAT_COLORS[c],color:'#fff'} : {}}
                  onClick={()=>selectCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Date de début *</label>
              <input type="date" value={form.date_debut} onChange={e=>{set('date_debut',e.target.value); if(!form.date_fin||form.date_fin<e.target.value) set('date_fin',e.target.value);}} required/>
            </div>
            <div className={styles.field}>
              <label>Date de fin</label>
              <input type="date" value={form.date_fin} min={form.date_debut} onChange={e=>set('date_fin',e.target.value)}/>
            </div>
          </div>

          {/* Heures */}
          <div className={styles.field}>
            <label>
              <input type="checkbox" checked={form.toute_la_journee} onChange={e=>set('toute_la_journee',e.target.checked)} style={{marginRight:6}}/>
              Toute la journée
            </label>
            {!form.toute_la_journee && (
              <div className={styles.times}>
                <input type="time" value={form.heure_debut} onChange={e=>set('heure_debut',e.target.value)} step="900"/>
                <span>→</span>
                <input type="time" value={form.heure_fin} onChange={e=>set('heure_fin',e.target.value)} step="900"/>
              </div>
            )}
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label>Description</label>
            <textarea rows={3} value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Détails, liens, notes…"/>
          </div>

          {/* Couleur */}
          <div className={styles.field}>
            <label>Couleur</label>
            <div className={styles.colors}>
              {COLORS.map(c=>(
                <button key={c.val} type="button" title={c.label}
                  className={`${styles.colorBtn} ${form.couleur===c.val ? styles.colorBtnOn : ''}`}
                  style={{background:c.val}} onClick={()=>set('couleur',c.val)}/>
              ))}
            </div>
          </div>

          {/* Rappel */}
          <label className={styles.rappel}>
            <div className={`${styles.toggle} ${form.rappel_email ? styles.toggleOn : ''}`} onClick={()=>set('rappel_email',!form.rappel_email)}>
              <div className={styles.thumb}/>
            </div>
            <span>Envoyer un rappel email la veille</span>
          </label>

          {/* Footer */}
          <div className={styles.footer}>
            {event && <button type="button" className={styles.btnDelete} onClick={()=>onDelete(event.id)}>Supprimer</button>}
            <div style={{flex:1}}/>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Annuler</button>
            <button type="submit" className={styles.btnSave} disabled={saving} style={{background:form.couleur}}>
              {saving ? '…' : event ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
