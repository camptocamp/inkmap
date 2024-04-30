import './polyfills';
import '../printer';

// Service worker disabled to fit with OpenLayers versions and to add Layers like BingMaps.
/*
self.addEventListener('install', function () {
  console.log(`[inkmap] Installing worker...`);

  self.skipWaiting();
});

self.addEventListener('activate', function () {
  console.log(`[inkmap] Activated worker, claiming clients.`);
  self.clients.claim();
});
*/
