export function deploymentEnvironment(env) {
  if (!['preview', 'production'].includes(env.VITE_APP_ENV)) {
    throw new Error('Set VITE_APP_ENV to preview or production for a hosted build')
  }
  let url
  try {
    url = new URL(env.VITE_SUPABASE_URL)
  } catch {
    throw new Error('Set VITE_SUPABASE_URL to the real cloud Supabase project URL')
  }
  if (
    url.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Hosted builds require an HTTPS cloud Supabase project origin')
  }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error(
      'Set the public sb_publishable_ key; secret/service-role keys are forbidden',
    )
  }
  return { origin: url.origin }
}

export function vercelOutputConfig(origin) {
  return {
    version: 3,
    routes: [
      {
        src: '/(.*)',
        headers: {
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'Content-Security-Policy':
            "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' " +
            origin +
            "; form-action 'self'; upgrade-insecure-requests",
        },
        continue: true,
      },
      {
        src: '/assets/(.*)',
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
        continue: true,
      },
      { handle: 'filesystem' },
      { src: '/(?:assets|img)/(.*)', status: 404 },
      { src: '/.*\\.[^/]+$', status: 404 },
      { src: '/(.*)', dest: '/index.html' },
    ],
  }
}
