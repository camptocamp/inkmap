export function sendMessage(message) {
    self.clients.matchAll({
        type: 'window',
    }).then((clients) => {
        if (clients && clients.length) {
            // clients array is ordered by last focused
            clients[0].postMessage(message)
        }
    });
}

export function isWorker() {
    return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
}
