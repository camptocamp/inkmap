import {hasOffscreenCanvasSupport} from './utils'

if (hasOffscreenCanvasSupport()) {
  navigator.serviceWorker.register('inkmap-worker.js').then(
    () => {},
    error => {
      console.log('Service worker registration failed:', error)
    }
  )
}
