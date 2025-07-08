import './polyfills.js';
import '../printer/index.js';
import { shared as sharedIconCache } from 'ol/style/IconImageCache';

self.addEventListener('install', function () {
  console.log(`[inkmap] Installing worker...`);

  self.skipWaiting();
});

self.addEventListener('activate', function () {
  console.log(`[inkmap] Activated worker, claiming clients.`);
  self.clients.claim();
});
