import type { ReactNode } from 'react';

// Iconos de línea en SVG, dibujados aquí: sin fuentes ni librerías externas (la CSP del
// portal solo admite recursos propios). Todos son decorativos (aria-hidden); el texto
// visible o accesible del control es el que da el significado.
const paths = {
  home: <path d="M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10" />,
  download: (
    <>
      <path d="M12 4v11m0 0-4-4m4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  devices: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  privacy: (
    <>
      <path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  windows: (
    <>
      <path d="M4 5.5 11 4.5v7H4zM13 4.2 20 3v8.5h-7zM4 12.5h7v7l-7-1zM13 12.5h7V21l-7-1.2z" />
    </>
  ),
  check: <path d="m5 12 4 4 10-10" />,
  alert: (
    <>
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="4" width="16" height="7" rx="1.5" />
      <rect x="4" y="13" width="16" height="7" rx="1.5" />
      <path d="M8 7.5h.01M8 16.5h.01" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16" />
    </>
  ),
  bug: (
    <>
      <rect x="8" y="7" width="8" height="12" rx="4" />
      <path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1.5 2M15 4l-1.5 2" />
    </>
  ),
  vault: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 8.5V7M12 17v-1.5M8.5 12H7M17 12h-1.5" />
    </>
  ),
  chart: <path d="M4 20h16M7 16v-4M12 16V7M17 16v-7" />,
  layers: (
    <>
      <path d="m12 4 9 5-9 5-9-5z" />
      <path d="m3 14 9 5 9-5" />
    </>
  ),
  chat: (
    <>
      <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  queue: (
    <>
      <rect x="3" y="8" width="5" height="8" rx="1" />
      <rect x="10" y="8" width="5" height="8" rx="1" />
      <path d="M17 12h4m-2-2 2 2-2 2" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M7.5 18.5c1-1.7 1.5-3.8 1.5-6.5a3 3 0 0 1 6 0c0 1.2 0 2.3-.2 3.3" />
      <path d="M12 12c0 3.2-.6 5.8-2 8M14.3 19.5c.4-.9.7-1.9.9-3" />
      <path d="M5 15.5c.6-1 .9-2.2 1-3.5a6 6 0 0 1 11.6-2.2M18 12.5c0 1.6-.2 3.2-.6 4.6" />
    </>
  ),
  pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  history: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" />
      <path d="M4 4v4.5h4.5M12 8v4l3 2" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" />
      <path d="M19 16.5c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.2-.2-1.3-.9-2-2.3-2.2 1.4-.2 2.1-.9 2.3-2.3z" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.5 17a8.5 8.5 0 1 1 15 0" />
      <path d="m12 13 3.5-4" />
      <circle cx="12" cy="13" r="1.3" />
    </>
  ),
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />,
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </>
  ),
  cloud: <path d="M7 18h10.5a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z" />,
  branch: (
    <>
      <circle cx="6" cy="5.5" r="2" />
      <circle cx="6" cy="18.5" r="2" />
      <circle cx="18" cy="8" r="2" />
      <path d="M6 7.5v9M18 10c0 4-6 3-11 7" />
    </>
  ),
  window: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8.5h18M6 6.3h.01M8.5 6.3h.01" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="4" />
      <path d="m11 11 9-9M17 5l2.5 2.5M14.5 7.5 16.5 9.5" />
    </>
  ),
  hash: <path d="M9 4 7 20M17 4l-2 16M4.5 9h16M3.5 15h16" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
