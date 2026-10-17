type EmailSignInEnvironment = {
  VITE_APP_ENV?: string
  VITE_EMAIL_SIGN_IN_ENABLED?: string
}

export function emailSignInEnabled(
  environment: EmailSignInEnvironment = import.meta.env,
): boolean {
  const setting = environment.VITE_EMAIL_SIGN_IN_ENABLED
  if (setting) return setting === 'true'
  return !['production', 'preview'].includes(environment.VITE_APP_ENV ?? '')
}
