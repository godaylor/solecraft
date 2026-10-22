import { useEffect, type RefObject } from 'react'

/** Enhances visible-by-default sections, once per mount, without a scroll listener. */
export function useScrollReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (
      !root ||
      typeof window.IntersectionObserver !== 'function' ||
      typeof root.animate !== 'function' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) return

    const animations = new Map<HTMLElement, Animation>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
            continue
          }
          const element = entry.target
          observer.unobserve(element)
          if (preference.matches || element.contains(document.activeElement)) {
            continue
          }
          const animation = element.animate(
            [{ transform: 'translateY(14px)' }, { transform: 'translateY(0)' }],
            { duration: 440, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
          )
          animations.set(element, animation)
          animation.onfinish = () => animations.delete(element)
          animation.oncancel = () => animations.delete(element)
        }
      },
      { threshold: 0.08 },
    )

    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      observer.observe(element)
    })

    const cancelAnimations = () => {
      for (const animation of animations.values()) animation.cancel()
      animations.clear()
    }
    const onPreferenceChange = () => {
      if (preference.matches) {
        observer.disconnect()
        cancelAnimations()
      }
    }
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return
      for (const [element, animation] of animations) {
        if (element.contains(event.target)) {
          animation.cancel()
          animations.delete(element)
        }
      }
    }
    root.addEventListener('focusin', onFocus)
    preference.addEventListener('change', onPreferenceChange)

    return () => {
      observer.disconnect()
      cancelAnimations()
      root.removeEventListener('focusin', onFocus)
      preference.removeEventListener('change', onPreferenceChange)
    }
  }, [ref])
}
