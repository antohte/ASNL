import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource-variable/source-sans-3';
import { AccountActions, DialogHeading, ProfileButton } from './site-account';
import { Icon } from './site-icons';
import { SiteFooter } from './site-footer';
import { fixture } from './ticket-fixture';
import './style.css';
import './shop.css';
import './parking.css';

const zones = [
  { id: 'P0', label: 'P0', x: 501, y: 397 },
  { id: 'P1', label: 'P1', x: 444, y: 490 },
  { id: 'P2', label: 'P2 X-Trail', x: 306, y: 410 },
  { id: 'P3', label: 'P3 Juke', x: 295, y: 278 },
  { id: 'P4', label: 'P4', x: 257, y: 230 },
  { id: 'P5', label: 'P5', x: 435, y: 54 },
  { id: 'P6', label: 'P6 Qashqai', x: 369, y: 182 },
  { id: 'P7', label: 'P7', x: 647, y: 186 },
  { id: 'P8', label: 'P8 Micra', x: 324, y: 337 },
  { id: 'Presse', label: 'Parking presse', x: 394, y: 415, info: true },
  { id: 'Visiteurs', label: 'Parking visiteurs', x: 585, y: 271, info: true },
  { id: 'PMR', label: 'Accès PMR', x: 405, y: 122, info: true },
] as const;

const accessInfo = 'https://www.asnl.net/348/stade_parkings';
type ParkingZone = typeof zones[number];
const upcoming = Date.now() < Date.parse(fixture.date);

function Parking() {
  const [selection, setSelection] = useState<ParkingZone | undefined>(() => {
    const id = new URLSearchParams(location.search).get('zone');
    return zones.find(zone => zone.id === id);
  });
  const payment = useRef<HTMLDialogElement>(null);
  return <div className="shop-page parking-page">
    <main className="shop-width">
      <nav className="shop-navigation" aria-label="Navigation parking">
        <a className="shop-back" href="/billetterie/#parking"><Icon type="back" /> Retour à la billetterie</a>
        <ProfileButton />
      </nav>
      <header className="parking-header">
        <div className="catalog-heading"><h1><img src="/medias/crest.webp" width="32" height="37" alt="" /> PARKING MARCEL-PICOT</h1></div>
        {upcoming && <p>AS Nancy Lorraine – {fixture.team} · <time dateTime={fixture.date}>{fixture.when}</time></p>}
      </header>
      <div className="parking-layout">
        <figure className="parking-map" aria-labelledby="parking-map-caption">
          <figcaption id="parking-map-caption">Cliquez sur un parking pour le sélectionner</figcaption>
          <div className="parking-map-image">
            <img src="/medias/marcel-picot-parkings.webp" alt="Plan du stade Marcel-Picot, de ses accès et de ses parkings." width="1040" height="791" />
            {zones.map(zone => <button type="button" key={zone.id} aria-label={zone.label} aria-pressed={zone.id === selection?.id}
              className={'parking-pin' + ('info' in zone ? ' parking-pin-special' : '')}
              style={{ left: zone.x / 1040 * 100 + '%', top: zone.y / 791 * 100 + '%' }}
              onClick={() => setSelection(zone)}>{zone.id}</button>)}
          </div>
        </figure>
        <section className="parking-summary" aria-labelledby="parking-summary-title">
          <h2 id="parking-summary-title">Votre parking</h2>
          <label htmlFor="parking-zone">Choisir un emplacement</label>
          <select id="parking-zone" value={selection?.id ?? ''} onChange={event => setSelection(zones.find(zone => zone.id === event.target.value))}>
            <option value="">Sélectionnez une zone</option>
            {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.label}</option>)}
          </select>
          {selection && <div className="parking-selection">
            <p className={'parking-chosen' + ('info' in selection ? '' : ' visually-hidden')} role="status">{selection.label}</p>
            {'info' in selection ? <>
              <p>Consultez les modalités d’accès de cette zone.</p>
              <a href={accessInfo} className="asnl-action parking-quick">Informations d’accès <Icon type="out" /></a>
            </> : <button type="button" className="asnl-action parking-quick parking-pay"
              aria-haspopup="dialog" onClick={() => payment.current?.showModal()}>Payer</button>}
          </div>}
        </section>
      </div>
      <dialog ref={payment} className="asnl-dialog" aria-labelledby="parking-payment-title">
        <DialogHeading id="parking-payment-title" title="Paiement du parking" />
        {selection && !('info' in selection) && <AccountActions key={selection.id} checkout parking={selection.id} />}
      </dialog>
    </main>
    <SiteFooter />
  </div>;
}

createRoot(document.getElementById('root')!).render(<Parking />);
