import {hasOffscreenCanvasSupport} from './utils'

/**
 * Resolves to a boolean (true/false) on subscription
 * True means a worker is used for print jobs
 * @type {Promise<boolean>}
 */
export const workerReady = new Promise(resolve => {
  if (hasOffscreenCanvasSupport() && false) {
    navigator.serviceWorker.register('inkmap-worker.js').then(
      () => {
        resolve(true)
      },
      error => {
        console.log('Service worker registration failed:', error)
      }
    )
  } else {
    resolve(false)
  }
})

export function messageWorker(type, message) {
  navigator.serviceWorker.controller.postMessage({
    ...message,
    type
  })
}
