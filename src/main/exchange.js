import {fromEvent} from 'rxjs'
import {pluck, switchMap, tap} from 'rxjs/operators'
import {from} from 'rxjs'
import {printerReady} from './utils'

export function messageToPrinter(type, message) {
  printerReady.then(useWorker => {
    if (useWorker) {
      navigator.serviceWorker.controller.postMessage({
        ...message,
        type
      })
    } else {
      window.dispatchEvent(new CustomEvent('inkmap.toPrinter', {
        detail: {
          ...message,
          type,
        }
      }))
    }
  })
}

export const messageToMain$ = from(printerReady).pipe(
  switchMap(useWorker => {
    const events$ = useWorker ?
      fromEvent(navigator.serviceWorker, 'message').pipe(pluck('data')) :
      fromEvent(window, 'inkmap.toMain').pipe(pluck('detail'))
    return events$.pipe( tap(message => console.log('message to main:', message)))
  })
)
