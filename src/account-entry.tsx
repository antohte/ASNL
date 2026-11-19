import { createRoot } from 'react-dom/client';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource-variable/source-sans-3';
import { AccountActions } from './site-account';
import { Icon } from './site-icons';
import './style.css';

const params = new URLSearchParams(location.search);
const zone = params.get('zone') ?? '';
const returnHref = params.get('retour') === 'reservation' ? '/billetterie/reservation/?reprise=1'
  : params.get('retour') === 'parking' && /^P[0-8]$/.test(zone) ? `/billetterie/parking/?zone=${zone}`
  : undefined;

function AccountPage() {
  return <main className="account-page">
    <a className="account-back" href={returnHref ?? '/#les-acces'}>
      <Icon type="back" /> {returnHref ? 'Retour à la réservation' : 'Retour à l’accueil'}
    </a>
    <section className="account-page-content" aria-labelledby="account-title">
      <div className="account-page-heading">
        <img src="/medias/crest.webp" width="38" height="44" alt="AS Nancy Lorraine" />
        <h1 id="account-title">Mon compte</h1>
      </div>
      <AccountActions returnHref={returnHref} />
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<AccountPage />);
