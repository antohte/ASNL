import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource-variable/source-sans-3';
import { destinations } from './content';
import { ProfileButton } from './site-account';
import './style.css';

const Scene = lazy(() => import('./crest'));
const media = (name: string) => '/medias/' + name + '.webp';

function Arrow({ down = false }: { down?: boolean }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={down ? 'm5 9 7 7 7-7' : 'M4 12h15m-6-6 6 6-6 6'} />
  </svg>;
}

function Mosaic() {
  const section = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (window.location.hash === '#les-acces') {
      section.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    const mosaic = section.current;
    if (!mosaic) return;

    const tolerance = 3;
    const gestureGap = 180;
    const scrollTimeout = 900;
    let jump: { top: number; direction: number; startedAt: number } | undefined;
    let previousWheelAt = -Infinity;

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.shiftKey
        || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const direction = Math.sign(event.deltaY);
      const now = performance.now();
      const gap = now - previousWheelAt;
      const position = window.scrollY;
      previousWheelAt = now;

      if (jump) {
        const moving = Math.abs(position - jump.top) > tolerance && now - jump.startedAt < scrollTimeout;
        const sameGesture = jump.direction === direction && gap < gestureGap;
        if (moving || sameGesture) {
          event.preventDefault();
          return;
        }
        jump = undefined;
      }

      const mosaicTop = Math.min(
        mosaic.getBoundingClientRect().top + position,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      // Once inside a tall mosaic, let the wheel scroll through its cards normally.
      const toMosaic = direction > 0 && position < mosaicTop - tolerance;
      const toCrest = direction < 0 && position > tolerance && position <= mosaicTop + tolerance;
      if (!toMosaic && !toCrest) return;

      event.preventDefault();
      jump = { top: toMosaic ? mosaicTop : 0, direction, startedAt: now };
      if (toCrest && window.location.hash === '#' + mosaic.id) {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      }
      // Match the arrow's native scroll behavior, including reduced motion.
      window.scrollTo({ top: jump.top, behavior: 'auto' });
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  return <section ref={section} id="les-acces" className="destinations" tabIndex={-1} aria-labelledby="destinations-title">
    <h2 id="destinations-title" className="visually-hidden">Les accès de l’AS Nancy Lorraine</h2>
    <nav aria-label="Les accès du club" className="mosaic">
      {destinations.map(({ id, title, href, image }) => (
        <a className={'tile tile-' + id} key={id} href={href}>
          <img src={media(image)} alt="" loading="lazy" decoding="async" />
          <span className="tile-content">
            <span className="tile-title">{title}</span>
            <span className="tile-arrow"><Arrow /></span>
          </span>
        </a>
      ))}
    </nav>
  </section>;
}

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function App() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailure] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailure(true); setReady(false); }, []);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { setReduced(preference.matches); if (preference.matches) setReady(false); };
    const visibility = () => setForeground(!document.hidden);
    preference.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    if (target.current) observer.observe(target.current);
    return () => { observer.disconnect(); preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!visible || reduced || requested) return;
    const frame = requestAnimationFrame(() => {
      if ('WebGL2RenderingContext' in window) setRequested(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, reduced, requested]);

  return <main>
    <ProfileButton className="home-profile" />
    <section className="hero" aria-labelledby="home-title">
      <img className="hero-photo" src={media('stade-de-nuit')} alt="" width="1024" height="768" fetchPriority="high" />
      <div className="hero-wash" aria-hidden="true" />
      <div className="hero-signature">
        <img src={media('crest')} alt="" width="36" height="42" />
        <div>
          <h1 id="home-title">AS <span>Nancy Lorraine</span></h1>
          <p>Qui s’y frotte s’y pique</p>
        </div>
      </div>
      <div className="crest-stage" ref={target} role="img" aria-label="Écusson rouge et blanc de l’AS Nancy Lorraine">
        {(!ready || reduced || failed) && <img className="crest-poster" src={media('crest-laque')} alt="" />}
        {requested && !reduced && !failed && <div className={'crest-canvas' + (ready ? ' ready' : '')}>
          <SceneBoundary onFailure={onFailure}><Suspense fallback={null}>
            <Scene playing={visible && foreground} onReady={onReady} onFailure={onFailure} />
          </Suspense></SceneBoundary>
        </div>}
      </div>
      <a href="#les-acces" className="scroll-cue" aria-label="Découvrir les accès de l’AS Nancy Lorraine">
        <Arrow down />
      </a>
    </section>
    <Mosaic />
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
