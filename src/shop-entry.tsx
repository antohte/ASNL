import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource-variable/source-sans-3';
import { categories, official, products, type Age, type Category } from './shop-catalog';
import { Icon } from './site-icons';
import { SiteFooter } from './site-footer';
import { ProfileButton } from './site-account';
import './style.css';
import './shop.css';

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
const featured = [
  'T-shirt Champion adulte 24/25', 'T-shirt Champion junior 24/25',
  'Écharpe acrylique ASNL 25/26', 'Casquette LS ASNL rouge 24/25',
  'Drapeau rouge 75 × 120 25/26', 'Ballon taille 5 23/24', 'Short de bain 25/26',
];
const featuredRank = new Map(featured.map((name, index) => [name, index]));

const clean = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim();

function ProductImage({ image }: { image: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={'product-image' + (failed ? ' image-missing' : '')}>
    <img src={failed ? '/medias/crest.webp' : image} alt="" width="600" height="600" loading="lazy" decoding="async" onError={failed ? undefined : () => setFailed(true)} />
  </div>;
}

function Shop() {
  const [age, setAge] = useState<Age>('adult');
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [draftAge, setDraftAge] = useState<Age>(age);
  const [draftSort, setDraftSort] = useState(sort);
  const filters = useRef<HTMLDialogElement>(null);

  const matches = products.filter(product =>
    (!product.age || product.age === age) &&
    (category === 'all' || category === product.category) &&
    clean(product.name).includes(clean(query)),
  );

  const visibleProducts = matches.sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return (featuredRank.get(a.name) ?? featured.length) - (featuredRank.get(b.name) ?? featured.length);
  });

  return <div className="shop-page">
    <main>
      <div className="shop-sticky">
        <nav className="shop-width shop-navigation" aria-label="Navigation de la boutique">
          <a className="shop-back" href="/#les-acces"><Icon type="back" /> Retour à l’accueil</a>
          <div className="shop-account-actions">
            <a className="shop-bag" href={official + '/cart?age_group=' + age} aria-label="Ouvrir le panier sur Grinta"><Icon type="bag" /></a>
            <ProfileButton />
          </div>
        </nav>
        <div className="shop-width catalog-controls">
          <div className="catalog-heading">
            <h1 id="catalog-title"><img src="/medias/crest.webp" alt="" width="32" height="37" /> BOUTIQUE ASNL</h1>
            <label className="shop-search">
              <Icon type="search" />
              <span className="visually-hidden">Rechercher un article</span>
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un article" />
            </label>
          </div>
          <div className="catalog-categories" role="group" aria-label="Catégories">
            {(Object.keys(categories) as Category[]).map(id => <button className="category-chip" key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>{categories[id]}</button>)}
          </div>
          <p className="catalog-count" role="status">{visibleProducts.length} {visibleProducts.length === 1 ? 'article' : 'articles'}</p>
        </div>
      </div>
      <section className="shop-width catalog" aria-labelledby="catalog-title">
        {visibleProducts.length ? <ul className="product-grid">
          {visibleProducts.map(product => <li key={product.href}>
            <a className="product-card" href={product.href} aria-label={product.name + ', ' + euros.format(product.price) + ' sur Grinta'}>
              <ProductImage image={product.image} />
              <div className="product-details">
                <div><h2>{product.name}</h2><span>{euros.format(product.price)}</span></div>
              </div>
            </a>
          </li>)}
        </ul> : <div className="shop-empty"><p>Aucun article ne correspond à ta recherche.</p><button type="button" onClick={() => { setQuery(''); setCategory('all'); }}>Réinitialiser les filtres</button></div>}
      </section>
      <button className="filter-trigger" type="button" aria-haspopup="dialog" onClick={() => {
        setDraftAge(age);
        setDraftSort(sort);
        filters.current?.showModal();
      }}><Icon type="filter" /> Filtrer</button>
    </main>
    <dialog ref={filters} className="filter-drawer" aria-labelledby="filters-title"
      onClick={event => { if (event.target === event.currentTarget) filters.current?.close(); }}>
      <form className="filter-form" onSubmit={event => {
        event.preventDefault();
        setAge(draftAge);
        setSort(draftSort);
        filters.current?.close();
      }}>
        <div className="filter-head">
          <h2 id="filters-title">Filtres</h2>
          <button type="button" className="filter-close" aria-label="Fermer les filtres" onClick={() => filters.current?.close()}><Icon type="close" /></button>
        </div>
        <div className="filter-options">
          <fieldset>
            <legend>Collection</legend>
            <label><input type="radio" name="filter-age" checked={draftAge === 'adult'} onChange={() => setDraftAge('adult')} /> Adulte</label>
            <label><input type="radio" name="filter-age" checked={draftAge === 'kid'} onChange={() => setDraftAge('kid')} /> Enfant</label>
          </fieldset>
          <fieldset>
            <legend>Trier par</legend>
            {[
              ['featured', 'En vedette'],
              ['price-asc', 'Prix croissant'],
              ['price-desc', 'Prix décroissant'],
            ].map(([value, label]) => <label key={value}><input type="radio" name="filter-sort" checked={draftSort === value} onChange={() => setDraftSort(value)} /> {label}</label>)}
          </fieldset>
        </div>
        <div className="filter-actions"><button type="submit">Voir les produits</button></div>
      </form>
    </dialog>
    <SiteFooter page="boutique" />
  </div>;
}

createRoot(document.getElementById('root')!).render(<Shop />);
