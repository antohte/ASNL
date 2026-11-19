import { useEffect, useId, useState, type FormEvent } from 'react';
import { Icon } from './site-icons';
import { guichet } from './ticket-fixture';
import './site-account.css';

export function DialogHeading({ id, title }: { id: string; title: string }) {
  return <div className="asnl-dialog-heading">
    <h2 id={id}>{title}</h2>
    <form method="dialog">
      <button className="asnl-icon-button" aria-label="Fermer"><Icon type="close" /></button>
    </form>
  </div>;
}

type Account = { firstName: string; lastName: string; email: string };

async function accountRequest(action: string, details?: Record<string, FormDataEntryValue>) {
  const response = await fetch('/api/account/' + action, details && {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Le service de compte est indisponible.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Le service de compte est indisponible.');
  return data.user as Account | null;
}

export function AccountActions({ checkout = false, parking, returnHref, onAccountLink }: {
  checkout?: boolean;
  parking?: string;
  returnHref?: string;
  onAccountLink?: () => void;
}) {
  const id = useId();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const registering = mode === 'register';

  useEffect(() => {
    let active = true;
    accountRequest('session').then(user => {
      if (active) setAccount(user);
    }).catch(() => {
      if (active) {
        setAccount(null);
        setError('Le service de compte est indisponible. Réessayez dans un instant.');
      }
    });
    return () => { active = false; };
  }, []);

  async function submit(action: string, fields: Record<string, FormDataEntryValue>) {
    setBusy(true);
    setError('');
    try {
      const user = await accountRequest(action, fields);
      setAccount(user);
      if (action === 'logout') setMode('login');
    } catch (failure) {
      setError(failure instanceof TypeError ? 'Connexion au serveur impossible. Réessayez dans un instant.'
        : failure instanceof Error ? failure.message : 'Le service de compte est indisponible.');
    } finally {
      setBusy(false);
    }
  }

  function handleForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    void submit(mode, Object.fromEntries(new FormData(event.currentTarget)));
  }

  return <div className="asnl-dialog-content asnl-account">
    {account === undefined ? <p role="status">Chargement du compte…</p> : account ? <>
      <p className="asnl-account-name">{account.firstName} {account.lastName}</p>
      <p>{account.email}</p>
      {checkout && <>
        <p>{parking
          ? `Sur ASNL Billets, ouvrez l’offre Parking et sélectionnez ${parking} pour payer si cet emplacement est disponible.`
          : 'Sur ASNL Billets, choisissez vos places et connectez-vous avec votre compte du guichet pour payer.'}</p>
        <a className="asnl-action asnl-account-submit" href={guichet}>Continuer sur ASNL Billets <Icon type="out" /></a>
      </>}
      {returnHref && <a className="asnl-action asnl-account-submit" href={returnHref}>Reprendre ma réservation</a>}
      <button type="button" className="asnl-action asnl-account-signout" disabled={busy}
        onClick={() => void submit('logout', {})}>Se déconnecter</button>
    </> : checkout ? <>
      <p>Connectez-vous ou créez un compte pour continuer.</p>
      <a href={parking ? `/compte/?retour=parking&zone=${encodeURIComponent(parking)}` : "/compte/?retour=reservation"} className="asnl-action asnl-account-submit" onClick={onAccountLink}>Accéder à mon compte</a>
    </> : <>
      <div className="asnl-account-modes" role="group" aria-label="Accès au compte">
        <button type="button" aria-pressed={!registering} disabled={busy} onClick={() => { setMode('login'); setError(''); }}>Connexion</button>
        <button type="button" aria-pressed={registering} disabled={busy} onClick={() => { setMode('register'); setError(''); }}>Inscription</button>
      </div>
      <form className="asnl-account-form" onSubmit={handleForm}>
        {registering && <>
          <div className="asnl-account-names">
            <label>Prénom<input name="firstName" autoComplete="given-name" maxLength={80} required /></label>
            <label>Nom<input name="lastName" autoComplete="family-name" maxLength={80} required /></label>
          </div>
          <label>Téléphone<input type="tel" name="phone" autoComplete="tel" maxLength={30} required /></label>
          <label>Adresse postale<textarea name="address" autoComplete="street-address" rows={2} maxLength={300}
            placeholder="Rue, code postal, ville, pays" required /></label>
          <label>Date de naissance<input type="date" name="birthDate" autoComplete="bday" min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)} required /></label>
        </>}
        <label>Adresse e-mail<input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
        <label>Mot de passe<input type="password" name="password" autoComplete={registering ? 'new-password' : 'current-password'}
          minLength={registering ? 12 : undefined} maxLength={256} aria-describedby={registering ? id : undefined} required />
          {registering && <small id={id}>12 caractères minimum</small>}
        </label>
        <button type="submit" className="asnl-action asnl-account-submit" disabled={busy}>
          {busy ? 'Un instant…' : registering ? 'Créer mon compte' : 'Me connecter'}
        </button>
      </form>
    </>}
    {error && <p className="asnl-account-error" role="alert">{error}</p>}
  </div>;
}

export function ProfileButton({ className = '' }: { className?: string }) {
  return <a href="/compte/" className={'asnl-icon-button asnl-profile ' + className} aria-label="Mon compte">
    <Icon type="profile" />
  </a>;
}
