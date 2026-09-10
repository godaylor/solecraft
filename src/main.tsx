import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import '@fontsource/ibm-plex-mono/cyrillic-400.css'
import '@fontsource/ibm-plex-mono/latin-400.css'

import { AppQueryProvider } from './app/providers/AppQueryProvider'
import { AuthProvider } from './app/providers/AuthProvider'
import { CommerceProvider } from './app/providers/CommerceProvider'
import {
  cartRepository,
  catalogRepository,
  checkoutRepository,
  loadSupabaseClient,
  orderRepository,
  ownerCommerceRepository,
  productRepository,
} from './app/bootstrap/deferredCommerceRuntime'
import { createAppQueryClient } from './app/providers/queryClient'
import { createAppRouter } from './app/router/createAppRouter'
import { guestCartHandoff } from './entities/cart/model/guestCartStore'
import { installObservability } from './shared/lib/observability'
import { LocaleProvider } from './shared/i18n/locale'
import './shared/styles/global.scss'

const rootElement = document.getElementById('app-root')
const bootElement = document.getElementById('solecraft-boot')

if (!rootElement) {
  throw new Error('Root element #app-root was not found')
}

if (bootElement) {
  bootElement.inert = true
  bootElement.setAttribute('aria-hidden', 'true')
  bootElement
    .querySelectorAll<HTMLElement>('a, button, input, select, textarea')
    .forEach((element) => element.setAttribute('tabindex', '-1'))
}

installObservability()

const queryClient = createAppQueryClient()
const router = createAppRouter({
  catalogRepository,
  productRepository,
  cartRepository,
  cartHandoff: guestCartHandoff,
  ownerCommerceRepository,
  checkoutRepository,
  orderRepository,
})

createRoot(rootElement).render(
  <StrictMode>
    <AppQueryProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider loadClient={loadSupabaseClient}>
          <CommerceProvider repository={ownerCommerceRepository}>
            <RouterProvider router={router} />
          </CommerceProvider>
        </AuthProvider>
      </LocaleProvider>
    </AppQueryProvider>
  </StrictMode>,
)
