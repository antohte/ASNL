import { Icon } from './site-icons';

export function SiteFooter({ page }: { page?: 'boutique' | 'billetterie' }) {
  const club = 'https://www.asnl.net';
  const legal = club + '/195/mentions_legales';
  const partners = ['Decathlon', 'Alcopa Auction', 'Technitoit', 'McDonald’s', 'FCGE', 'Nissan', 'Euromaster', 'Oxygen', 'Hess Automobile', 'PopKfé', 'Nancomcy'];

  return <footer className="shop-footer">
    <div className="shop-width">
      <section className="footer-newsletter" aria-labelledby="newsletter-title">
        <h2 id="newsletter-title">Inscrivez-vous à <span>la newsletter</span></h2>
        <form className="newsletter-form" action={club + '/plugin_newsletters/plugin_newsletters_abonnes/inscriptionNL'} method="post">
          <input type="hidden" name="_method" value="POST" />
          <label htmlFor="newsletter-email" className="visually-hidden">Adresse e-mail</label>
          <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="Inscrivez votre mail" required />
          <button type="submit">Souscrire</button>
        </form>
      </section>
      <a className="footer-partners" href={club + '/505/les_partenaires_majeurs_premium_et_officiels'} aria-label="Voir les partenaires de l’AS Nancy Lorraine">
        {partners.map(name => <span key={name}>{name}</span>)}
      </a>
      <div className="footer-panel">
        <a className="footer-brand" href="/#les-acces" aria-label="AS Nancy Lorraine, retour à l’accueil">
          <img src="/medias/crest.webp" alt="" width="63" height="73" />
          <span>Qui s’y frotte<br />s’y pique</span>
        </a>
        <nav className="footer-club-links" aria-label="Accès du club">
          <a href="/billetterie/" aria-current={page === 'billetterie' ? 'page' : undefined}>Billetterie</a>
          <a href="/boutique/" aria-current={page === 'boutique' ? 'page' : undefined}>Boutique</a>
          <a href={club + '/519/sponsoring_entreprise'}>Entreprises</a>
        </nav>
        <small>© AS Nancy Lorraine</small>
        <nav className="footer-legal-links" aria-label="Informations et contact">
          <a href={legal}>Mentions légales</a>
          <a href={legal}>Cookies</a>
          <a href={club + '/229/administration/formulaires/formulaire/formulaire_de_contact_club'}>Contact</a>
        </nav>
      </div>
    </div>
  </footer>;
}

