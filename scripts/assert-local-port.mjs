import { createConnection } from 'node:net'

export function assertLocalPortFree(port) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.setTimeout(1500)
    socket.once('connect', () => {
      socket.destroy()
      reject(
        new Error(
          'Local port ' + port + ' is occupied; no fallback or process termination',
        ),
      )
    })
    socket.once('timeout', () => {
      socket.destroy()
      reject(new Error('Could not verify local port ' + port))
    })
    socket.once('error', (error) => {
      socket.destroy()
      if (error.code === 'ECONNREFUSED') resolve()
      else reject(error)
    })
  })
}
