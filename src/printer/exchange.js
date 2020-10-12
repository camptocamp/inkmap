import {fromEvent} from 'rxjs'
import {pluck, tap} from 'rxjs/operators'
import {isWorker} from '../worker/utils'

export function messageToMain(type, message) {
  if (isWorker()) {
    self.clients.matchAll({
      type: 'window',
    }).then((clients) => {
      if (clients && clients.length) {
        // clients array is ordered by last focused
        clients[0].postMessage({
          ...message,
          type,
        })
      }
    });
  } else {
    window.dispatchEvent(new CustomEvent('inkmap.toMain', {
      detail: {
        ...message,
        type,
      }
    }))
  }
}

const events$ = isWorker() ?
  fromEvent(self, 'message').pipe(pluck('data')) :
  fromEvent(window, 'inkmap.toPrinter').pipe(pluck('detail'))

export const messageToPrinter$ = events$.pipe(
  tap(message => console.log('message to printer:', message))
)
