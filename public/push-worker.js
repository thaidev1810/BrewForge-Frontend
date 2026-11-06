self.addEventListener('push', event => {
  let payload = { title: 'BrewForge', body: 'Bạn có thông báo mới.' }
  try { if (event.data) payload = event.data.json() } catch { /* Ignore invalid channel payload. */ }
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const app = windows.find(client => new URL(client.url).origin === self.location.origin)
    return app ? app.focus() : self.clients.openWindow('/')
  }))
})
