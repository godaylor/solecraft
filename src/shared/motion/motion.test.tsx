import { useRef } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRouteEntrance } from './useRouteEntrance'
import { useScrollReveal } from './useScrollReveal'

function Route({ pathname }: { pathname: string }) {
  const ref = useRef<HTMLElement>(null)
  useRouteEntrance(ref, pathname)
  return (
    <main ref={ref}>
      <h1>Shop</h1>
      <input aria-label="Draft" defaultValue="Keep this" />
    </main>
  )
}

function Reveals() {
  const ref = useRef<HTMLDivElement>(null)
  useScrollReveal(ref)
  return (
    <div ref={ref}>
      <section data-reveal aria-label="Collection">
        <button type="button">Explore</button>
      </section>
      <section data-reveal aria-label="Guide">
        Fit guide
      </section>
    </div>
  )
}

let reduced = false
let preferenceEvents: EventTarget
let observerCallback: IntersectionObserverCallback
const observers: IntersectionObserver[] = []
const observe = vi.fn()
const unobserve = vi.fn()
const disconnect = vi.fn()
const animations: { cancel: ReturnType<typeof vi.fn> }[] = []
const animate = vi.fn(() => {
  const animation = { cancel: vi.fn() }
  animations.push(animation)
  return animation as unknown as Animation
})
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate')

beforeEach(() => {
  reduced = false
  animations.length = 0
  observers.length = 0
  preferenceEvents = new EventTarget()
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reduced
    },
    addEventListener: preferenceEvents.addEventListener.bind(preferenceEvents),
    removeEventListener: preferenceEvents.removeEventListener.bind(preferenceEvents),
  }))
  vi.stubGlobal(
    'IntersectionObserver',
    class implements IntersectionObserver {
      root = null
      rootMargin = '0px'
      scrollMargin = '0px'
      thresholds = [0.08]
      observe = observe
      unobserve = unobserve
      disconnect = disconnect
      takeRecords = () => []
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
        observers.push(this)
      }
    },
  )
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: animate,
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  if (originalAnimate) {
    Object.defineProperty(Element.prototype, 'animate', originalAnimate)
  } else {
    Reflect.deleteProperty(Element.prototype, 'animate')
  }
})

function intersect(element: HTMLElement) {
  const observer = observers.at(-1)
  if (!observer) throw new Error('Reveal observer was not created')
  act(() => {
    observerCallback(
      [
        {
          isIntersecting: true,
          target: element,
          boundingClientRect: element.getBoundingClientRect(),
          intersectionRatio: 1,
          intersectionRect: element.getBoundingClientRect(),
          rootBounds: null,
          time: 0,
        },
      ],
      observer,
    )
  })
}

function reduceMotion() {
  act(() => {
    reduced = true
    preferenceEvents.dispatchEvent(new Event('change'))
  })
}

describe('route entrance', () => {
  it('keeps route content mounted and moves only its heading on a changed pathname', () => {
    const view = render(<Route pathname="/catalog" />)
    const draft = screen.getByRole('textbox')
    expect(animate).not.toHaveBeenCalled()
    view.rerender(<Route pathname="/catalog" />)
    expect(animate).not.toHaveBeenCalled()

    view.rerender(<Route pathname="/cart" />)
    expect(screen.getByRole('textbox')).toBe(draft)
    expect(animate.mock.contexts[0]).toBe(screen.getByRole('heading'))
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'translateY(6px)' }, { transform: 'translateY(0)' }],
      { duration: 220, easing: 'ease-out' },
    )
    view.rerender(<Route pathname="/wishlist" />)
    expect(animations[0]?.cancel).toHaveBeenCalledOnce()
    view.unmount()
    expect(animations[1]?.cancel).toHaveBeenCalledOnce()
  })

  it('skips reduced motion and cancels an entrance if the preference changes', () => {
    const view = render(<Route pathname="/catalog" />)
    view.rerender(<Route pathname="/cart" />)
    reduceMotion()
    expect(animations[0]?.cancel).toHaveBeenCalledOnce()
    view.rerender(<Route pathname="/wishlist" />)
    expect(animate).toHaveBeenCalledOnce()
  })
})

describe('scroll reveals', () => {
  it('keeps content visible before observation and stops observing each entered section', () => {
    const view = render(<Reveals />)
    const collection = screen.getByRole('region', { name: 'Collection' })
    expect(collection).toBeVisible()
    expect(animate).not.toHaveBeenCalled()
    expect(observe).toHaveBeenCalledTimes(2)
    intersect(collection)
    expect(unobserve).toHaveBeenCalledWith(collection)
    expect(animate).toHaveBeenCalledOnce()
    view.unmount()
    expect(disconnect).toHaveBeenCalled()
    expect(animations[0]?.cancel).toHaveBeenCalledOnce()
  })

  it('skips focused content and cancels a reveal when focus enters it', () => {
    render(<Reveals />)
    screen.getByRole('button').focus()
    intersect(screen.getByRole('region', { name: 'Collection' }))
    expect(animate).not.toHaveBeenCalled()

    const guide = screen.getByRole('region', { name: 'Guide' })
    intersect(guide)
    expect(animate).toHaveBeenCalledOnce()
    guide.tabIndex = -1
    guide.focus()
    expect(animations[0]?.cancel).toHaveBeenCalledOnce()
  })

  it('disables pending and active reveals when reduced motion is requested', () => {
    render(<Reveals />)
    intersect(screen.getByRole('region', { name: 'Collection' }))
    reduceMotion()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(animations[0]?.cancel).toHaveBeenCalledOnce()
    intersect(screen.getByRole('region', { name: 'Guide' }))
    expect(animate).toHaveBeenCalledOnce()
  })

  it('keeps all sections visible with reduced motion or without observer support', () => {
    reduced = true
    const view = render(<Reveals />)
    expect(observe).not.toHaveBeenCalled()
    expect(screen.getByText('Fit guide')).toBeVisible()
    view.unmount()

    reduced = false
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Reveals />)
    expect(screen.getByText('Fit guide')).toBeVisible()
    expect(animate).not.toHaveBeenCalled()
  })
})
