import { Component, lazy, Suspense, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource-variable/source-sans-3';
import { AccountActions, DialogHeading, ProfileButton } from './site-account';
import { Icon } from './site-icons';
import { SiteFooter } from './site-footer';
import { maxSeats, seatsInRow, sections, sectionsById, zones, type StadiumSection } from './stadium-layout';
import { fixture } from './ticket-fixture';
import './style.css';
import './shop.css';
import './reservation.css';

const StadiumView = lazy(() => import('./stadium-view'));
const bookableSectors = sections.filter(section => section.zoneIndex >= 0);
const viewControls = [
  { action: 'in', text: 'Agrandir le zoom', icon: 'plus' },
  { action: 'out', text: 'Réduire le zoom', icon: 'minus' },
  { action: 'reset', text: 'Recentrer la vue', icon: 'target' },
] as const;
type ViewAction = typeof viewControls[number]['action'];

function StadiumFallback() {
  return <img className="stadium-fallback" src="/medias/marcel-picot-plan.webp"
    alt="Vue en perspective de Marcel-Picot." width="1496" height="794" />;
}

class StadiumBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <StadiumFallback /> : this.props.children; }
}

const pendingSelectionKey = 'asnl-seat-selection';

function resumeSelection(): Record<number, string[]> {
  if (new URLSearchParams(location.search).get('reprise') !== '1') return {};
  try {
    const stored = JSON.parse(sessionStorage.getItem(pendingSelectionKey) ?? '{}');
    return Object.fromEntries(bookableSectors.flatMap(({ id }) => {
      const ids = stored?.[id];
      return Array.isArray(ids) ? [[id, ids.filter(place => typeof place === 'string' && /^\d+-\d+$/.test(place))]] : [];
    }));
  } catch {
    return {};
  }
}

function Reservation() {
  const [sector, setSector] = useState<StadiumSection>();
  const [showSector, setShowSector] = useState(false);
  const [selection, setSelection] = useState<Record<number, string[]>>(resumeSelection);
  const [row, setRow] = useState(1);
  const [hover, setHover] = useState('');
  const [viewFailed, setViewFailed] = useState(false);
  const [command, setCommand] = useState<{ action: ViewAction; sequence: number } | null>(null);
  const payment = useRef<HTMLDialogElement>(null);
  const keyboard = useRef<HTMLDialogElement>(null);
  const focusedSector = showSector ? sector : undefined;
  const places = sector ? selection[sector.id] ?? [] : [];
  const groups = Object.entries(selection).filter(([, ids]) => ids.length > 0);
  const total = groups.reduce((count, [, ids]) => count + ids.length, 0);
  const seats = sector ? seatsInRow(sector, row).filter(seat => seat.free) : [];

  function chooseSector(next?: StadiumSection) {
    if (next) {
      if (next.id !== sector?.id) {
        setRow(1);
      }
      setSector(next);
    }
    setShowSector(!!next);
    setHover('');
  }

  function removeSeat(sectorId: number, id: string) {
    setSelection(current => ({
      ...current,
      [sectorId]: (current[sectorId] ?? []).filter(place => place !== id),
    }));
  }

  function toggleSeat(id: string, seatRow: number) {
    if (!focusedSector) return;
    const sectorId = focusedSector.id;
    setRow(seatRow);
    setSelection(current => {
      const ids = current[sectorId] ?? [];
      if (ids.includes(id)) return { ...current, [sectorId]: ids.filter(place => place !== id) };
      const count = Object.values(current).reduce((sum, places) => sum + places.length, 0);
      return count < maxSeats ? { ...current, [sectorId]: [...ids, id] } : current;
    });
  }

  return <div className="shop-page">
    <main className="reservation">
      <header className="reservation-header">
        <div className="reservation-top">
          <a className="shop-back" href="/billetterie/#match"><Icon type="back" /> Retour à la billetterie</a>
          <ProfileButton />
        </div>
        <div className="shop-width reservation-fixture">
          <img src="/medias/crest.webp" width="44" height="52" alt="" />
          <div>
            <h1>AS Nancy Lorraine <span>–</span> {fixture.team}</h1>
            <p><time dateTime={fixture.date}>{fixture.when}</time> <span>·</span> {fixture.venue}</p>
          </div>
        </div>
      </header>

      <div className="shop-width reservation-layout">
        <figure className="venue-card">
          <figcaption>
            <div className="venue-caption">
              {focusedSector && <button type="button" className="asnl-icon-button stadium-back" aria-label="Revenir à la vue complète du stade"
                title="Revenir à la vue complète du stade" onClick={() => chooseSector()}>
                <Icon type="back" />
              </button>}
              <div>
                {focusedSector && <span>{focusedSector.stand} · Secteur {focusedSector.id}</span>}
                <strong>{viewFailed ? 'Choisissez vos places dans la liste' : focusedSector ? 'Cliquez sur les sièges verts pour choisir vos places' : 'CLIQUEZ SUR UNE TRIBUNE POUR CHOISIR VOS PLACES'}</strong>
              </div>
            </div>
          </figcaption>

          <div className="stadium-stage">
            {viewFailed ? <StadiumFallback /> : <StadiumBoundary onFailure={() => setViewFailed(true)}>
              <Suspense fallback={<p className="stadium-loading" role="status">Chargement du stade 3D…</p>}>
                <StadiumView focus={focusedSector} zoneIndex={-1} selected={places} activeRow={row}
                  canSelect={!!focusedSector} onSector={chooseSector} onSeat={toggleSeat} onHover={setHover}
                  onFailure={() => setViewFailed(true)} command={command} />
              </Suspense>
            </StadiumBoundary>}
            {hover && !viewFailed && <div className="stadium-hover" aria-hidden="true">{hover}</div>}
          </div>
          <div className="stadium-controls" role="group" aria-label="Commandes de la vue du stade">
            <button type="button" className={viewFailed ? '' : 'stadium-keyboard'}
              aria-haspopup="dialog" onClick={() => keyboard.current?.showModal()}>Choisir depuis la liste</button>
            {!viewFailed && viewControls.map(({ action, icon, text }) => (
              <button type="button" key={action} aria-label={text} title={text}
                onClick={() => setCommand(current => ({ action, sequence: (current?.sequence ?? 0) + 1 }))}><Icon type={icon} /></button>
            ))}
          </div>
          <p className="visually-hidden" role="status">{total} sur {maxSeats} places sélectionnées</p>
        </figure>

        {total > 0 && <aside className="stadium-summary" aria-labelledby="stadium-summary-title">
          <h2 id="stadium-summary-title">Récapitulatif</h2>
          <p className="stadium-summary-count">{total} {total === 1 ? 'place sélectionnée' : 'places sélectionnées'}</p>
          {groups.map(([key, ids]) => {
            const groupSector = sectionsById[Number(key)];
            const name = zones[groupSector.zoneIndex].name;
            return <section key={key} className="stadium-recap-group">
              <h3>{name} · Secteur {key}</h3>
              <ul className="stadium-recap-seats">{ids.map(id => {
                const [rank, number] = id.split('-');
                return <li key={id}>
                  <span>Rang {rank}, place {number}</span>
                  <button type="button" className="asnl-icon-button stadium-remove-seat"
                    aria-label={`Retirer la place ${number}, rang ${rank}, secteur ${key}`}
                    onClick={() => removeSeat(groupSector.id, id)}><Icon type="close" /></button>
                </li>;
              })}</ul>
            </section>;
          })}
          <button type="button" className="asnl-action stadium-pay" aria-haspopup="dialog"
            onClick={() => payment.current?.showModal()}>Payer</button>
        </aside>}
      </div>

      <dialog ref={payment} className="asnl-dialog" aria-labelledby="payment-heading">
        <DialogHeading id="payment-heading" title="Compte requis pour payer" />
        <AccountActions checkout onAccountLink={() => {
          try { sessionStorage.setItem(pendingSelectionKey, JSON.stringify(selection)); } catch { /* Storage disabled. */ }
        }} />
      </dialog>

      <dialog ref={keyboard} className="asnl-dialog" aria-labelledby="seat-list-heading">
        <DialogHeading id="seat-list-heading" title="Choisir des places" />
        <div className="asnl-dialog-content stadium-list">
          <label htmlFor="list-sector">Secteur</label>
          <select id="list-sector" value={focusedSector?.id ?? ''} onChange={event => chooseSector(sectionsById[Number(event.target.value)])}>
            <option value="">Choisis un secteur</option>
            {bookableSectors.map(item => <option key={item.id} value={item.id}>{item.stand} · Secteur {item.id}</option>)}
          </select>
          {focusedSector && <>
            <label htmlFor="list-row">Rang</label>
            <select id="list-row" value={row} onChange={event => setRow(Number(event.target.value))}>
              {Array.from({ length: focusedSector.rows }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
            </select>
            <div className="stadium-list-seats" role="group" aria-label={`Places libres au rang ${row}`}>
              {seats.map(seat => <button key={seat.id} type="button" className="asnl-action"
                aria-label={`Rang ${row}, place ${seat.number}`} aria-pressed={places.includes(seat.id)}
                disabled={total >= maxSeats && !places.includes(seat.id)} onClick={() => toggleSeat(seat.id, row)}>{seat.number}</button>)}
              {!seats.length && <p>Aucun siège libre à ce rang.</p>}
            </div>
            <p role="status">{total} sur {maxSeats} places sélectionnées</p>
          </>}
        </div>
      </dialog>
    </main>
    <SiteFooter />
  </div>;
}

createRoot(document.getElementById('root')!).render(<Reservation />);
