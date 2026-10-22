import { useEffect, useRef, type RefObject } from 'react'

/** Move only the title: forms keep full contrast and fixed actions stay anchored. */
export function useRouteEntrance(ref: RefObject<HTMLElement | null>, pathname: string) {
  const previousPathname = useRef(pathname)

  useEffect(() => {
    const changed = previousPathname.current !== pathname
    previousPathname.current = pathname
    const element = ref.current?.querySelector('h1')
    if (
      !changed ||
      !element ||
      typeof element.animate !== 'function' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) return

    const animation = element.animate(
      [{ transform: 'translateY(6px)' }, { transform: 'translateY(0)' }],
      { duration: 220, easing: 'ease-out' },
    )
    const onPreferenceChange = () => {
      if (preference.matches) animation.cancel()
    }
    preference.addEventListener('change', onPreferenceChange)

    return () => {
      animation.cancel()
      preference.removeEventListener('change', onPreferenceChange)
    }
  }, [pathname, ref])
}
