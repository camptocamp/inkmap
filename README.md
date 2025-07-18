<div style="text-align: center"><strong>inkmap</strong>, a library for generating high resolution maps in the browser</div>


##### [Live demo here!](https://camptocamp.github.io/inkmap/main/)

## Introduction

**inkmap** is based on [OpenLayers](https://www.openlayers.org) and will generate maps in PNG format based on a given JSON specification.

**inkmap** can handle long-running jobs (e.g. A0 format in 300 dpi) and provides an API for following a job progress.
It uses a service worker in the background provided the user browser supports [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas), and falls back (almost) seamlessly to the main thread if not.

Please note that the first version of **inkmap** has been entirely funded and supported by the [French Ministry of Ecology](https://www.ecologie.gouv.fr/) as part of their Descartes web mapping toolkit, hosted here: https://adullact.net/projects/descartes/

## Usage

### Basic

To include the library in your project:
```bash
$ npm install --save @camptocamp/inkmap
```

Then import the different methods from the `inkmap` package:
```js
import { print, downloadBlob } from '@camptocamp/inkmap';

print({
  layers: [ ... ],
  projection: 'EPSG:4326',
  ...
}).then(downloadBlob);
```

### Advanced

**inkmap** offers advanced job monitoring through the use of Observables provided by the [rxjs](https://rxjs.dev/) library.

Observables are different from Promises in that they can emit *multiple values* instead of just one, and are a very good fit for progress reporting.

To use an Observable, simply call its `subscribe()` method with a function as argument. The function will be called anytime a new value is emitted, like so:
```js
import { getJobStatus } from '@camptocamp/inkmap';

...

getJobStatus(jobId).subscribe((jobStatus) => {
  // do something with the status
});
```

Note that for *long-lived Observables* (i.e. Observables that never completes) it is important to call `unsubscribe()` when the emitted values are not needed anymore. Open subscriptions to Observables might create memory leaks.

### Enabling the service worker

**inkmap** can _and will_ use a dedicated service worker for running print jobs if given the chance. This offers the following
advantages:
* Jobs run in a separate thread, meaning the user navigation will not be impacted at all by any CPU-intensive task
* The service worker isn't tied to a window or tab, so jobs will continue running when the tab is closed (and even when the browser is closed, depending on the platform)
* Push notifications might be sent to the user when a print job complete (not implemented yet)

**To enable this, the `inkmap-worker.js` file located in the `dist` folder must be published on the same path as the application
using inkmap**.

The worker file can be published either using a symbolic link or by actually copying the file, for example in the application build pipeline.

If using Webpack to build the application, a solution is to use the [CopyWebpackPlugin](https://webpack.js.org/plugins/copy-webpack-plugin/):

```js
export default {
  ...
  plugins: [
     new CopyWebpackPlugin([
       {
         from: 'node_modules/@camptocamp/inkmap/dist/inkmap-worker.js',
         to: 'dist'
       },
     ]),
  ],
  ...
}
```

## API

Important note: all API functions are named exports from the `inkmap` package.

See the [API documentation](https://camptocamp.github.io/inkmap/main/docs/) website.

## Architecture

Under the hood, `inkmap` will attempt to install a service worker on the page it is called. The service worker will then be in charge
of loading all the map images and data, composing them together and giving them back to the application code.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md).

## License

[CeCILL-C](https://cecill.info/licences/Licence_CeCILL-C_V1-en.txt)
