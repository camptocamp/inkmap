import './polyfills'
import {createJob} from '../print/job'

self.addEventListener('install', function(event) {
  console.log(`[inkmap] Installing worker...`)

  self.skipWaiting()
});

self.addEventListener('activate', function(event) {
  console.log(`[inkmap] Activated worker, claiming clients.`)
  self.clients.claim()
});

self.addEventListener('message', function(event) {
  const msg = event.data
  console.log(`Message received by worker`, msg)
  switch (msg.type) {
    case 'requestJob':
      createJob(msg.spec)
      break
    default:
      console.log('Unhandled message', msg)
  }
});
