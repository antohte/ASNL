export function Icon({ type }: { type: 'back' | 'out' | 'bag' | 'search' | 'filter' | 'close' | 'ticket' | 'parking' | 'profile' | 'plus' | 'minus' | 'target' | 'chevron-down' }) {
  const paths = {
    back: 'M19 12H5m7 7-7-7 7-7',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    target: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM12 2v4m0 12v4M2 12h4m12 0h4',
    profile: 'M15.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 20v-1.5A4.5 4.5 0 0 1 9.5 14h5a4.5 4.5 0 0 1 4.5 4.5V20',
    out: 'M6 18 18 6M8 6h10v10',
    bag: 'M4 8l3-4h10l3 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm0 0h16m-11 3a3 3 0 0 0 6 0',
    filter: 'M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6',
    close: 'm6 6 12 12M18 6 6 18',
    ticket: 'M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Zm9 0v2m0 4v1m0 3v2',
    'chevron-down': 'm5 9 7 7 7-7',
    parking: 'M3 17v-5l2-6h14l2 6v5M3 13h18M5 17v2m14-2v2M6 15h2m8 0h2',
    search: 'm20 20-4-4m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[type]} /></svg>;
}

