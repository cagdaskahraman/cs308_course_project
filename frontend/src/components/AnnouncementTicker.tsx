const ITEMS: { icon: JSX.Element; label: string }[] = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    label: 'Free 2-day shipping over $50',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z"/><path d="M8 12l3 3 5-6"/>
      </svg>
    ),
    label: '30-day easy returns',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    label: 'Encrypted, secure checkout',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/>
        <path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
    label: 'Carbon-neutral delivery',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7l-8 8-5-5"/>
      </svg>
    ),
    label: 'Authorized retailer · genuine stock',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 4.2L18 21l-6-4.5L6 21l1.5-7.8L2 9h7z"/>
      </svg>
    ),
    label: 'Hand-picked, expert-reviewed',
  },
];

export const AnnouncementTicker = (): JSX.Element => {
  const track = [...ITEMS, ...ITEMS];
  return (
    <div className="es-ticker" role="marquee" aria-label="Announcements">
      <div className="es-ticker__track">
        {track.map((it, i) => (
          <span key={i} className="es-ticker__item">
            {it.icon}
            {it.label}
            <span className="es-ticker__dot" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
};
