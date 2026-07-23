/**
 * A tiny inline-SVG icon set. No icon library — keeps the bundle small and the
 * icons themable via `currentColor`.
 */
import type { SVGProps } from 'react'

export type IconName =
  | 'compass'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'trash'
  | 'edit'
  | 'grip'
  | 'chevron'
  | 'arrow'
  | 'close'
  | 'sparkles'
  | 'retry'
  | 'clock'
  | 'coin'
  | 'tag'
  | 'warning'
  | 'check'
  | 'landmark'
  | 'food'
  | 'leaf'
  | 'museum'
  | 'spa'
  | 'bag'
  | 'route'
  | 'wallet'
  | 'suitcase'
  | 'bulb'
  | 'menu'
  | 'send'
  | 'map'
  | 'empty'
  | 'shield'
  | 'wifi'
  | 'passport'
  | 'users'
  | 'calendar'
  | 'cloud'
  | 'globe'
  | 'bed'
  | 'ticket'
  | 'plane'
  | 'image'
  | 'external'
  | 'flag'
  | 'circleCheck'
  | 'flame'

const PATHS: Record<IconName, JSX.Element> = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
  grip: (
    <>
      <circle cx="9" cy="6" r="1.3" />
      <circle cx="15" cy="6" r="1.3" />
      <circle cx="9" cy="12" r="1.3" />
      <circle cx="15" cy="12" r="1.3" />
      <circle cx="9" cy="18" r="1.3" />
      <circle cx="15" cy="18" r="1.3" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  sparkles: (
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
  ),
  retry: <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.2a2.4 2.4 0 0 1 2.5-1.7c1.3 0 2.3.8 2.3 1.9 0 2.4-4.8 1.4-4.8 3.8 0 1.1 1 1.9 2.5 1.9a2.5 2.5 0 0 0 2.5-1.7" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 13.4 13 21a1.5 1.5 0 0 1-2.1 0l-7.9-7.9V3h10.1l7.4 7.4a1.5 1.5 0 0 1 0 2Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  landmark: (
    <>
      <path d="M3 21h18M4 10h16M12 3 4 7h16l-8-4Z" />
      <path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
    </>
  ),
  food: (
    <>
      <path d="M6 3v7a3 3 0 0 0 6 0V3M9 3v18" />
      <path d="M18 3c-1.5 1-2.5 3-2.5 5.5 0 2 1 3 2.5 3v9.5" />
    </>
  ),
  leaf: (
    <path d="M4 20c8 0 16-4 16-14 0 0-11-2-15 6-1.6 3.2 0 6 0 6l-1 2M5 19c3-6 7-8 11-9" />
  ),
  museum: (
    <>
      <path d="m3 9 9-5 9 5M4 9h16M4 20h16" />
      <path d="M6 9v11M10 9v11M14 9v11M18 9v11" />
    </>
  ),
  spa: (
    <>
      <path d="M12 12c0-4 2-7 2-7s2 3 2 7a4 4 0 0 1-4 4 4 4 0 0 1-4-4c0-1 .5-2 1-3" />
      <path d="M4 15c3 4 8 5 8 5s5-1 8-5" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a3 3 0 0 0 0-6H10a3 3 0 0 1 0-6h6" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3" />
      <path d="M17 12h.01" />
    </>
  ),
  suitcase: (
    <>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V4h6v3M9 11v5M15 11v5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3Z" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />,
  map: (
    <>
      <path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6l6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  empty: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4Z" />
      <path d="M3 7v10l9 4 9-4V7" opacity="0.5" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3Z" />,
  wifi: (
    <>
      <path d="M2 8.8a15 15 0 0 1 20 0M5 12.3a10 10 0 0 1 14 0M8.5 15.8a5 5 0 0 1 7 0" />
      <path d="M12 19.5h.01" />
    </>
  ),
  passport: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M9.5 16h5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  cloud: <path d="M7 18a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6 1.02A3.5 3.5 0 0 1 17 18H7Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),
  bed: (
    <>
      <path d="M3 8v11M3 13h18a0 0 0 0 1 0 0v6M21 19v-4a2 2 0 0 0-2-2" />
      <path d="M7 13v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
      <path d="M13 6v2M13 12v2" />
    </>
  ),
  plane: (
    <path d="M10.2 3.3a1.4 1.4 0 0 1 2.6 0l1.8 6 5.4 3.2a1 1 0 0 1-.5 1.9l-5.9-1-1 5.2 1.7 1.5a.6.6 0 0 1-.5 1l-2.3-.6-2.3.6a.6.6 0 0 1-.5-1l1.7-1.5-1-5.2-5.9 1a1 1 0 0 1-.5-1.9L8.4 9.3l1.8-6Z" />
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-4.5-4.5L7 20" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8 8" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4 2.5 4H5" />
    </>
  ),
  circleCheck: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  flame: (
    <path d="M12 3c3 3.4 5 5.8 5 8.9a5 5 0 0 1-10 0c0-1.6.7-3 1.9-4-.1 1.5.8 2.5 1.9 2.5 1.3 0 2-1.2 1.5-2.8C11.8 6.2 11.3 4.7 12 3Z" />
  ),
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
