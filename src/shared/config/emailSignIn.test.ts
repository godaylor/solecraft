import { describe, expect, it } from 'vitest'

import { emailSignInEnabled } from './emailSignIn'

describe('email sign-in availability', () => {
  it('requires an explicit delivery capability on hosted builds', () => {
    expect(emailSignInEnabled({ VITE_APP_ENV: 'production' })).toBe(false)
    expect(emailSignInEnabled({ VITE_APP_ENV: 'preview' })).toBe(false)
    expect(
      emailSignInEnabled({
        VITE_APP_ENV: 'production',
        VITE_EMAIL_SIGN_IN_ENABLED: 'true',
      }),
    ).toBe(true)
  })

  it('retains isolated local auth tests and supports an explicit off switch', () => {
    expect(emailSignInEnabled({ VITE_APP_ENV: 'test' })).toBe(true)
    expect(
      emailSignInEnabled({
        VITE_APP_ENV: 'test',
        VITE_EMAIL_SIGN_IN_ENABLED: 'false',
      }),
    ).toBe(false)
    expect(
      emailSignInEnabled({
        VITE_APP_ENV: 'production',
        VITE_EMAIL_SIGN_IN_ENABLED: 'invalid',
      }),
    ).toBe(false)
  })
})
