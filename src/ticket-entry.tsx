import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource-variable/source-sans-3';
import { fixture, guichet } from './ticket-fixture';
import { ProfileButton } from './site-account';
import { Icon } from './site-icons';
import { SiteFooter } from './site-footer';
import './style.css';
import './shop.css';
import './ticket.css';

const categories = [
  { key: 'match', label: 'Match', image: '/medias/billetterie-match.webp' },
  { key: 'parking', label: 'Parking', image: '/medias/billetterie-parking.webp' },
] as const;
type TicketCategory = typeof categories[number]['key'];

function MatchTicket() {
  return <article className="match-ticket" aria-labelledby="match-name">
    <div className="match-date" aria-hidden="true"><b>{fixture.day}</b><span>{fixture.month}</span></div>
    <div className="match-body">
      <p className="match-competition">{fixture.competition}</p>
      <h2 id="match-name"><span>AS Nancy Lorraine</span><span>{fixture.team}</span></h2>
      <p className="match-time"><time dateTime={fixture.date}>{fixture.when}</time><span>{fixture.venue}</span></p>
      <div className="match-actions">
        <a className="ticket-action ticket-primary" href="/billetterie/reservation/"><Icon type="ticket" /> Réserver mes billets</a>
        <a className="ticket-details" href={fixture.details}>Infos du match</a>
      </div>
    </div>
  </article>;
}

function ParkingTicket({ upcoming }: { upcoming: boolean }) {
  return <article className="parking-ticket" aria-labelledby="parking-title">
    <div className="parking-icon"><Icon type="parking" /></div>
    <h2 id="parking-title">Parking Marcel-Picot</h2>
    {upcoming && <>
      <p className="parking-fixture">AS Nancy Lorraine – {fixture.team}</p>
      <p><time dateTime={fixture.date}>{fixture.when}</time></p>
    </>}
    <p className="parking-guide">Choisis ton parking sur le plan de Marcel-Picot.</p>
    <a className="ticket-action ticket-secondary" href="/billetterie/parking/">Choisir mon parking <Icon type="out" /></a>
  </article>;
}

function TicketOffice() {
  const [category, setCategory] = useState<TicketCategory | null>(() => categories.find(({ key }) => location.hash === '#' + key)?.key ?? null);
  const offer = useRef<HTMLElement>(null);
  const upcoming = Date.now() < Date.parse(fixture.date);

  useEffect(() => {
    if (category) offer.current?.focus();
  }, [category]);

  return <div className="shop-page ticket-page">
    <main>
      <div className="shop-sticky">
        <nav className="shop-width shop-navigation" aria-label="Navigation de la billetterie">
          <a className="shop-back" href="/#les-acces"><Icon type="back" /> Retour à l’accueil</a>
          <ProfileButton />
        </nav>
        <div className="shop-width catalog-controls">
          <div className="catalog-heading">
            <h1 id="ticket-title"><img src="/medias/crest.webp" alt="" width="32" height="37" /> Billetterie ASNL</h1>
          </div>
        </div>
      </div>
      <div className="shop-width ticket-choices" role="group" aria-label="Type de réservation">
        {categories.map(({ key, label, image }) => (
          <button className={'tile ticket-choice ticket-choice-' + key} key={key} type="button"
            aria-expanded={category === key} aria-controls="ticket-offer"
            onClick={() => setCategory(current => current === key ? null : key)}>
            <img src={image} alt="" />
            <span className="tile-content">
              <span className="tile-title">{label}</span>
              <span className="tile-arrow"><Icon type="chevron-down" /></span>
            </span>
          </button>
        ))}
      </div>
      <section id="ticket-offer" ref={offer} tabIndex={-1} className="shop-width ticket-list" hidden={!category}
        aria-label={category === 'parking' ? 'Offre parking' : 'Offre match'}>
        {category === 'parking' ? <ParkingTicket upcoming={upcoming} /> : category === 'match' && (upcoming ? <MatchTicket /> : <div className="ticket-empty">
          <h2>Aucun match à venir dans ce catalogue</h2>
          <p>Retrouve les prochaines offres sur le guichet du club.</p>
          <a className="ticket-action ticket-primary" href={guichet}>Consulter ASNL Billets <Icon type="out" /></a>
        </div>)}
      </section>
    </main>
    <SiteFooter page="billetterie" />
  </div>;
}

createRoot(document.getElementById('root')!).render(<TicketOffice />);
