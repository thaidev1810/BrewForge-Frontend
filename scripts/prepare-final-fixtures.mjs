import fs from 'node:fs'
import crypto from 'node:crypto'
import { chromium } from '@playwright/test'
const dir = 'e2e-private/final-fixtures'
fs.mkdirSync(dir, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  const fixture = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360
    const context = canvas.getContext('2d')
    const mime = 'video/webm;codecs=vp8'
    if (!MediaRecorder.isTypeSupported(mime)) throw new Error('VP8 recording is unavailable')
    const recorder = new MediaRecorder(canvas.captureStream(15), { mimeType: mime })
    const chunks = []
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    const recorded = new Promise(resolve => { recorder.onstop = resolve })
    recorder.start()
    const started = performance.now()
    await new Promise(resolve => {
      function frame(now) {
        context.fillStyle = '#38281f'; context.fillRect(0, 0, 640, 360)
        context.fillStyle = '#fff4e7'; context.font = '24px sans-serif'
        context.fillText('BrewForge automated technical test', 45, 100)
        context.font = '17px sans-serif'; context.fillText('Synthetic fixture - no person or competency evidence', 45, 145)
        context.fillStyle = '#d9a76c'; context.fillRect(45, 220, Math.min(550, (now - started) / 3000 * 550), 24)
        if (now - started >= 3000) { recorder.stop(); resolve() } else requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })
    await recorded
    const blob = new Blob(chunks, { type: mime })
    const url = URL.createObjectURL(blob), video = document.createElement('video')
    video.muted = true; video.src = url; document.body.append(video)
    await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error('Container decode failed')) })
    await new Promise((resolve, reject) => { video.onended = resolve; video.onerror = () => reject(new Error('Video play failed')); video.play().catch(reject) })
    const duration = Number.isFinite(video.duration) ? video.duration : video.currentTime
    const seeked = new Promise(resolve => { video.onseeked = resolve }); video.currentTime = 1; await seeked
    const probe = { tool: 'Chromium HTMLMediaElement/MediaRecorder', container: 'WebM', codec: 'VP8', mime, width: video.videoWidth, height: video.videoHeight, durationSeconds: duration, seekSeconds: video.currentTime, decodedFrames: video.getVideoPlaybackQuality().totalVideoFrames }
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()))
    const png = canvas.toDataURL('image/png').split(',')[1]
    URL.revokeObjectURL(url)
    return { bytes, png, probe }
  })
  const video = Buffer.from(fixture.bytes)
  if (video.subarray(0, 4).toString('hex') !== '1a45dfa3' || fixture.probe.durationSeconds < 2 || fixture.probe.decodedFrames < 2) throw new Error('Fixture metadata validation failed')
  fs.writeFileSync(dir + '/technical-test.webm', video)
  fs.writeFileSync(dir + '/technical-audit.png', Buffer.from(fixture.png, 'base64'))
  const metadata = { ...fixture.probe, bytes: video.length, sha256: crypto.createHash('sha256').update(video).digest('hex'), synthetic: true }
  fs.writeFileSync(dir + '/metadata.json', JSON.stringify(metadata, null, 2))
  console.log(JSON.stringify(metadata))
} finally { await browser.close() }
