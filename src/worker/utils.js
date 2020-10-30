/**
 * @return {boolean} True if executed in a worker thread, false otherwise.
 */
export function isWorker() {
  return (
    typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope
  );
}
