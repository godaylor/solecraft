import type { SVGProps } from 'react'

type IconName = 'arrow' | 'heart' | 'bag' | 'user' | 'search' | 'route' | 'return'
const paths: Record<IconName, string> = {
  arrow: 'M4 12h15M13 5l7 7-7 7',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  bag: 'M5 7h14l1 14H4L5 7ZM8 8V6a4 4 0 0 1 8 0v2',
  user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  route: 'M3 19h9a5 5 0 0 0 0-10H9a3 3 0 0 1 0-6h12M3 14v7M17 1l4 2-4 2',
  return: 'M9 4 3 10l6 6M3 10h11a6 6 0 0 1 0 12h-3',
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
