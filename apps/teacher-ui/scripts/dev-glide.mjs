import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createConnection } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const projectDir = fileURLToPath(new URL('..', import.meta.url))
const viteCli = resolve(dirname(require.resolve('vite')), '../../bin/vite.js')
const glideCli = resolve(dirname(require.resolve('@srivarsank/glide')), 'cli.js')

let stopping = false
let glide
const vite = spawn(process.execPath, [
  viteCli, '--config', 'vite.glide.config.ts', '--host', '127.0.0.1', '--port', '5173', '--strictPort'
], { cwd: projectDir, stdio: 'inherit' })

function stop(code = 0) {
  if (stopping) return
  stopping = true
  glide?.kill()
  vite.kill()
  process.exitCode = code
}

process.on('SIGINT', () => stop(130))
process.on('SIGTERM', () => stop(143))
vite.on('error', (error) => {
  console.error('Glide: Vite konnte nicht gestartet werden:', error)
  stop(1)
})
vite.on('exit', () => {
  if (!stopping) {
    console.error('Glide: Der Vite-Server wurde beendet.')
    stop(1)
  }
})

async function viteReady() {
  return new Promise((resolveReady) => {
    const socket = createConnection({ host: '127.0.0.1', port: 5173 })
    let settled = false
    function finish(ready) {
      if (settled) return
      settled = true
      socket.destroy()
      resolveReady(ready)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(500, () => finish(false))
  })
}

for (let attempt = 0; attempt < 150 && !stopping; attempt++) {
  if (await viteReady() && !stopping) {
    glide = spawn(process.execPath, [glideCli, '5173'], { cwd: projectDir, stdio: 'inherit' })
    glide.on('error', (error) => {
      console.error('Glide: Editor konnte nicht gestartet werden:', error)
      stop(1)
    })
    glide.on('exit', () => {
      if (!stopping) stop(1)
    })
    break
  }
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 200))
}

if (!glide && !stopping) {
  console.error('Glide: Vite auf 127.0.0.1:5173 ist nicht erreichbar.')
  stop(1)
}
