export const P = {
  dash: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  assets: "M4 19h16M7 16V9m5 7V5m5 11v-4",
  tx: "M7 7h13l-3-3M17 17H4l3 3",
  import: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2",
  plat: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6",
  fx: "M4 8h12l-3-3M20 16H8l3 3M18 8a2 2 0 100-.01M6 16a2 2 0 100-.01",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  plus: "M12 5v14M5 12h14",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  down: "M12 4v12m0 0l-5-5m5 5l5-5M5 20h14",
  alert: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4",
  check: "M5 12l5 5L20 7",
  back: "M15 18l-6-6 6-6",
  edit: "M4 20h4L19 9l-4-4L4 16v4z",
  trash: "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3",
  coin: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-14v10m-3-7.5c0-1 1.3-1.5 3-1.5s3 .7 3 1.8c0 2.7-6 1.2-6 4 0 1.1 1.3 1.7 3 1.7s3-.6 3-1.5",
  wallet: "M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h15V9H5a2 2 0 01-2-2zm14 7h.01",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  file: "M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6zm0 0v6h6",
  logout: "M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v4l3 2",
  x: "M6 6l12 12M18 6L6 18",
};

export function Icon({ n, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={P[n]} />
    </svg>
  );
}

export const LogoMark = () => (
  <span className="brand-mark">
    <svg viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="#2ED3B7"
        strokeWidth="3"
        strokeDasharray="22 50"
        transform="rotate(-90 12 12)"
      />
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="#F5B83D"
        strokeWidth="3"
        strokeDasharray="14 50"
        strokeDashoffset="-23"
        transform="rotate(-90 12 12)"
      />
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="#6B9BFF"
        strokeWidth="3"
        strokeDasharray="12 50"
        strokeDashoffset="-38"
        transform="rotate(-90 12 12)"
      />
    </svg>
  </span>
);
