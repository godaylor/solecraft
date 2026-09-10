import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('http://localhost/api/health', () => HttpResponse.json({ status: 'ok' })),
]
