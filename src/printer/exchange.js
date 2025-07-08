import { fromEvent } from 'rxjs';
import { pluck, tap } from 'rxjs/operators';
import { isWorker } from '../worker/utils.js';

/**
 * Sends a message to the main thread
 * @param {string} type Message type, described by a MESSAGE_JOB_* constant.
 * @param {Object} [message] Message object.
 */
export function messageToMain(type, message) {
  if (isWorker()) {
    // @ts-ignore
    self.clients
      .matchAll({
        type: 'window',
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            ...message,
            type,
          });
        });
      });
  } else {
    window.dispatchEvent(
      new CustomEvent('inkmap.toMain', {
        detail: {
          ...message,
          type,
        },
      }),
    );
  }
}

const events$ = isWorker()
  ? fromEvent(self, 'message').pipe(pluck('data'))
  : fromEvent(window, 'inkmap.toPrinter').pipe(pluck('detail'));

/**
 * @type {import('rxjs').Observable<Object>}
 */
export const messageToPrinter$ = events$.pipe(
  tap((message) => console.log('[inkmap] message to printer:', message)),
);
