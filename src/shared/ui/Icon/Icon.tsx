import type { SVGProps } from 'react'

type IconName =
  | 'arrow'
  | 'heart'
  | 'bag'
  | 'user'
  | 'search'
  | 'route'
  | 'return'
  | 'sun'
  | 'moon'
  | 'monitor'
const paths: Record<IconName, string> = {
  arrow: 'M4 12h15M13 5l7 7-7 7',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  bag: 'M5 7h14l1 14H4L5 7ZM8 8V6a4 4 0 0 1 8 0v2',
  user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  route: 'M3 19h9a5 5 0 0 0 0-10H9a3 3 0 0 1 0-6h12M3 14v7M17 1l4 2-4 2',
  return: 'M9 4 3 10l6 6M3 10h11a6 6 0 0 1 0 12h-3',
  sun: 'M12 3V1M12 23v-2M3 12H1M23 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  moon: 'M20.8 13.4A9 9 0 0 1 10.6 3.2a9 9 0 1 0 10.2 10.2Z',
  monitor: 'M3 4h18v13H3V4ZM8 21h8M12 17v4',
}
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}
