const allowedEnvironments = ['local', 'test', 'preview', 'production'] as const

export type AppEnvironment = (typeof allowedEnvironments)[number]

export function parseAppEnvironment(value: string | undefined): AppEnvironment {
  if (!value) {
    return 'local'
  }

  const environment = allowedEnvironments.find((item) => item === value)

  if (!environment) {
    throw new Error(`Unsupported VITE_APP_ENV: ${value}`)
  }

  return environment
}

const configuredAppEnvironment: unknown = import.meta.env.VITE_APP_ENV

export const appEnvironment = parseAppEnvironment(
  typeof configuredAppEnvironment === 'string' ? configuredAppEnvironment : undefined,
)
