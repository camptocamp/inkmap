self.addEventListener('install', function(event) {
  console.log(`[inkmap] Installing worker...`)

  self.skipWaiting()
});

self.addEventListener('activate', function(event) {
  console.log(`[inkmap] Activated worker, claiming clients.`)
  self.clients.claim()
});
