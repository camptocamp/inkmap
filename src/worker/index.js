import './polyfills';
import '../printer';

self.addEventListener('install', function () {
  console.log(`[inkmap] Installing worker...`);

  self.skipWaiting();
});

self.addEventListener('activate', function () {
  console.log(`[inkmap] Activated worker, claiming clients.`);
  self.clients.claim();
});
