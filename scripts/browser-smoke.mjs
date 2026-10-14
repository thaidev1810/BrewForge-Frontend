// Optional Windows Chrome smoke test. No backend requests or application mock data.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
const chrome = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.FE_SMOKE_URL ?? 'http://127.0.0.1:5173'
assert(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Smoke test only uses a local frontend')
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'brewforge-smoke-'))
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket
try {
  let port
  for (let i = 0; i < 100 && !port; i++) { try { port = Number((await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]) } catch { await delay(100) } }
  assert(port, 'Chrome debugging port ready')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map(), exceptions = []
  socket.addEventListener('message', event => { const msg = JSON.parse(event.data); if (msg.method === 'Runtime.exceptionThrown') exceptions.push(msg.params.exceptionDetails.text); const p = pending.get(msg.id); if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } })
  function command(method, params = {}) { return new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)) }, 10000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })) }) }
  const evaluate = async expression => (await command('Runtime.evaluate', { expression, returnByValue: true })).result.value
  async function until(expression) { for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await delay(100) } throw new Error(`Not ready: ${expression}`) }
  await command('Page.enable'); await command('Runtime.enable')
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await command('Page.navigate', { url: origin + '/admin/users' })
  await until("location.pathname === '/login' && !!document.querySelector('#username')")
  console.log('PASS protected admin route redirects to actual login')
  await evaluate('document.querySelector("form").requestSubmit()')
  await until('document.querySelectorAll("[aria-invalid=true]").length === 2')
  console.log('PASS empty login form validates without contacting backend')
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: name === 'mobile' })
    await delay(200)
    const metrics = await evaluate('({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
    assert(metrics.scroll <= metrics.width, `${name} horizontal overflow: ${JSON.stringify(metrics)}`)
    const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    const filename = path.join(os.tmpdir(), `brewforge-login-${name}.png`)
    await fs.writeFile(filename, Buffer.from(shot.data, 'base64'))
    console.log(`PASS ${name} responsive layout; screenshot ${filename}`)
  }
  assert.deepEqual(exceptions, [], 'No unhandled React/browser runtime exceptions')
  console.log('PASS no browser runtime exceptions')
} finally { socket?.close(); browser.kill() }
