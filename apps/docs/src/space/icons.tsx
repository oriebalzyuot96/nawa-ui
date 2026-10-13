/** Small stroke icons (24×24, currentColor) for the palette, layers and toolbar. Decorative only. */
const P: Record<string, string> = {
  section: 'M3 5h18v14H3z M3 9h18',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  stack: 'M4 4h16v4H4z M4 10h16v4H4z M4 16h16v4H4z',
  card: 'M4 4h16v16H4z M4 9h16 M7 13h8 M7 16h5',
  spacer: 'M12 3v18 M8 7l4-4 4 4 M8 17l4 4 4-4',
  divider: 'M3 12h18 M6 7h12 M6 17h12',
  heading: 'M6 4v16 M18 4v16 M6 12h12',
  text: 'M4 6h16 M4 10h16 M4 14h16 M4 18h10',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
  badge: 'M4 9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z M8 12h8',
  input: 'M3 7h18v10H3z M7 10v4',
  select: 'M3 7h18v10H3z M14 11l2 2 2-2',
  checkbox: 'M4 4h16v16H4z M8 12l3 3 5-6',
  switch: 'M2 12a5 5 0 0 1 5-5h10a5 5 0 0 1 0 10H7a5 5 0 0 1-5-5z M17 12h.01',
  datepicker: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  otp: 'M3 8h4v8H3z M10 8h4v8h-4z M17 8h4v8h-4z',
  button: 'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M8 12h8',
  captcha: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4',
  table: 'M3 5h18v14H3z M3 10h18 M3 15h18 M9 5v14',
  stat: 'M4 19h16 M7 15v-3 M12 15V8 M17 15V5',
  chart: 'M4 20V4 M4 20h16 M8 16l4-5 3 3 5-7',
  timeline: 'M6 4v16 M6 7h.01 M6 12h.01 M6 17h.01 M10 7h10 M10 12h8 M10 17h10',
  progress: 'M3 10h18v4H3z M3 12h11',
  alert: 'M12 3l9 16H3z M12 10v4 M12 17h.01',
  empty: 'M4 7l8-4 8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10',
  skeleton: 'M4 6h16 M4 11h10 M4 16h13',
  toast: 'M4 15h16v5H4z M8 4h12 M8 8h8',
  tabs: 'M3 8h6V5h6v3h6v11H3z',
  breadcrumb: 'M3 12h4 M10 12h4 M17 12h4 M7 9l3 3-3 3 M14 9l3 3-3 3',
  stepper: 'M5 12a2 2 0 1 0 0 .01 M12 12a2 2 0 1 0 0 .01 M19 12a2 2 0 1 0 0 .01 M7 12h3 M14 12h3',
  accordion: 'M3 5h18v4H3z M3 11h18v4H3z M3 17h18v3H3z M16 7l1 1 1-1',
  avatar: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  image: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 8.5h.01',
  carousel: 'M7 6h10v12H7z M3 8v8 M21 8v8',
  // Blocks and toolbar
  hero: 'M3 4h18v16H3z M7 9h10 M9 12h6 M10 15h4',
  navbar: 'M3 5h18v5H3z M6 7.5h4 M14 7.5h4',
  pricing: 'M4 5h4v14H4z M10 3h4v18h-4z M16 5h4v14h-4z',
  login: 'M10 12h10 M16 8l4 4-4 4 M14 4H5v16h9',
  kpis: 'M3 5h8v6H3z M13 5h8v6h-8z M3 13h8v6H3z M13 13h8v6h-8z',
  faq: 'M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .8-1 1.5V14 M12 17h.01',
  features: 'M5 5h4v4H5z M15 5h4v4h-4z M5 15h4v4H5z M15 15h4v4h-4z',
  testimonial: 'M7 10h3v5H5v-3a5 5 0 0 1 2-4 M16 10h3v5h-5v-3a5 5 0 0 1 2-4',
  footer: 'M3 14h18v6H3z M6 17h3 M11 17h3 M16 17h2',
  cta: 'M4 8h16v8H4z M14 12h3',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M12 2v3 M12 19v3 M4.2 4.2l2.1 2.1 M17.7 17.7l2.1 2.1 M2 12h3 M19 12h3 M4.2 19.8l2.1-2.1 M17.7 6.3l2.1-2.1',
  undo: 'M9 14L4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5 M20 9H10a6 6 0 0 0 0 12h3',
  desktop: 'M3 4h18v12H3z M8 20h8 M12 16v4',
  tablet: 'M6 3h12v18H6z M11 18h2',
  mobile: 'M8 3h8v18H8z M11 18h2',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  copy: 'M8 8h12v12H8z M4 16V4h12',
  up: 'M12 19V5 M6 11l6-6 6 6',
  down: 'M12 5v14 M6 13l6 6 6-6',
  indent: 'M4 6h16 M10 12h10 M4 18h16 M4 9l3 3-3 3',
  outdent: 'M4 6h16 M10 12h10 M4 18h16 M7 9l-3 3 3 3',
  grip: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
  code: 'M8 7l-5 5 5 5 M16 7l5 5-5 5',
  share: 'M18 8a3 3 0 1 0 0-.01 M6 15a3 3 0 1 0 0-.01 M18 21a3 3 0 1 0 0-.01 M8.6 13.5l6.8-4 M8.6 16.5l6.8 4',
  save: 'M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6',
  folder: 'M3 6h6l2 2h10v11H3z',
  download: 'M12 4v11 M7 10l5 5 5-5 M4 20h16',
  upload: 'M12 20V9 M7 14l5-5 5 5 M4 4h16',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  template: 'M4 4h7v9H4z M13 4h7v5h-7z M13 11h7v9h-7z M4 15h7v5H4z',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6l12 12 M18 6L6 18',
  keyboard: 'M2 6h20v12H2z M6 10h.01 M10 10h.01 M14 10h.01 M18 10h.01 M7 14h10',
  layers: 'M12 3l9 5-9 5-9-5z M3 13l9 5 9-5',
  sliders: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M20 18h0 M14 4v4 M10 10v4 M16 16v4',
  rtl: 'M10 4v16 M14 4v16 M10 4h7 M7 16l-3-3 3-3 M4 13h4',
  check: 'M5 12l5 5L20 7',
};

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const d = P[name] ?? P.section;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
