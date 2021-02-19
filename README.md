<div style="text-align: center"><strong>inkmap</strong>, a library for generating high resolution maps in the browser</div>


##### [Live demo here!](https://camptocamp.github.io/inkmap/master/)

## Introduction

**inkmap** is based on [OpenLayers](https://www.openlayers.org) and will generate maps in PNG format based on a given JSON specification.

**inkmap** can handle long-running jobs (e.g. A0 format in 300 dpi) and provides an API for following a job progress.
It uses a service worker in the background provided the user browser supports [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas), and falls back (almost) seamlessly to the main thread if not.

Please note that **inkmap** has been entirely funded and supported by the [French Ministry of Ecology](https://www.ecologie.gouv.fr/) as part of their Descartes web mapping toolkit, hosted here: https://adullact.net/projects/descartes/

## Usage

### Basic

To include the library in your project:
```bash
$ npm install --save @camptocamp/inkmap
```

Then import the different methods from the `inkmap` package:
```js
import { print, getJobsStatus } from '@camptocamp/inkmap';

print({
  layers: [ ... ],
  projection: 'EPSG:4326',
  ...
}).subscribe(progress => ...);

getJobsStatus().subscribe(jobs => ...);
```

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
module.exports = {
  ...
  plugins: [
     new CopyWebpackPlugin([
       { from: 'node_modules/@camptocamp/inkmap/dist/inkmap-worker.js', to: '/dist' },
     ]),
  ],
  ...
}
```

## API

Important note: all API functions are named exports from the `inkmap` package.

#### `print(jsonSpec: PrintSpec): Observable<PrintStatus>`

Takes in a [`PrintSpec`](#printspec-type) object and returns an observable which emits a [`PrintStatus`](#printstatus-type) object regularly and completes when the print job is finished.

#### `queuePrint(jsonSpec: PrintSpec): Observable<number>`

Takes in a [`PrintSpec`](#printspec-type) object and returns an observable which emits a job id (number) and completes immediately.

#### `getJobsStatus(): Observable<PrintStatus[]>`

Returns a long-running observable which emits an array of print job status.
Once a job is finished it will appear once in the array and then will not be part of subsequent emissions.

> Note: This observable will **never** complete.

#### `getJobStatus(id: number): Observable<PrintStatus>`

Takes in a job id and returns the same observable as the `print()` function.

#### `cancelJob(id: number): Observable<>`

Takes in a job id and completes once the job is cancelled without emitting any value.

#### `registerProjection(definition: ProjectionDefinition): void`

Takes in a projection definition and registers it with proj4.

#### `PrintSpec` type

A `PrintSpec` object describes the content and aspect of the map to be printed.

| field | type | description |
|---|---|---|
| `layers` | `Layer[]` | Array of `Layer` objects that will be rendered in the map; last layers will be rendered on top of first layers. |
| `size` | `[number, number]` or `[number, number, string]` | Width and height in pixels, or in the specified unit in 3rd place; valid units are `px`, `mm`, `cm`, `m` and `in`. |
| `center` | `[number, number]` | Longitude and latitude of the map center. |
| `dpi` | `number` | Dot-per-inch, usually 96 for a computer screen and 300 for a detailed print. |
| `scale` | `number` | Scale denominator. |
| `scaleBar` | `boolean \| ScaleBarSpec` | Indicates whether scalebar should be printed (`true`). Also allows to pass options object: `{"position": "bottom-left", "units": "metric" }` (default values). Possible values are: <ul><li>`position`: `"bottom-left" \| "bottom-right"`</li><li>`units`: `"degrees" \| "imperial" \| "metric" \| "nautical" \| "us"` (same as `ol.control.ScaleLine`)</li></ul> |
| `northArrow` | `boolean \| string` | North arrow position; either `'top-left'`, `'bottom-left'`, `'bottom-right'` or `'top-right'`; `true` defaults to `'top-right'`; absent or `false` means not to print the north arrow.
| `projection` | `string` | Projection name. If starting with `EPSG:`, and other than `EPSG:3857` or `EPSG:4326`, definition will be downloaded on [https://epsg.io/]. |
| `projectionDefinitions` | `[projectionDefinition]` | Optionnal. Registers new projections from the definitions. |

#### `Layer` type

A `Layer` object describes a layer in the printed map.

| field | type | description |
|---|---|---|
| `type` | `string` | Either `XYZ`, `WMTS`, `WMS` or `WFS`. |
| `url` | `string` | URL or URL template for the layer; for XYZ layers, a URL can contain the following tokens: `{a-d}` for randomly choosing a letter, `{x}`, `{y}` and `{z}`. |
| `opacity` | `number` | Opacity, from 0 (hidden) to 1 (visible). |

#### `WMS layer` type

Additional options for `WMS` layer type.

| field | type | description |
|---|---|---|
| `layer` | `string` | Layer name. |
| `version` | `string` | Version of WMS protocol used: `1.1.1` or `1.3.0` (default). |
| `tiled` | `boolean` | Indicates whether the WMS layer should be requested as tiles. Defaults to `false`. |

#### `WMTS layer` type

Additional options for `WMTS` layer to define the layer source. See https://openlayers.org/en/latest/apidoc/module-ol_source_WMTS-WMTS.html
for the full list of options. The following table introduces the common options to use.

| field | type | description |
|---|---|---|
| `requestEncoding` | `string` | Request encoding: `KVP`, `REST`. |
| `format` | `string` | Image format. Only used when `requestEncoding` is `'KVP'`. eg `image/png`. |
| `layer` | `string` | Layer name as advertised in the WMTS capabilities. |
| `style` | `number` | Style name as advertised in the WMTS capabilities. |
| `projection` | `string` | Projection. |
| `matrixSet` | `string` | Matrix set. |
| `tileGrid` | `TileGrid` | TileGrid object, see https://openlayers.org/en/latest/apidoc/module-ol_tilegrid_TileGrid-TileGrid.html for options |

#### `WFS layer` type

Additional options for `WFS` layer type.

| field | type | description |
|---|---|---|
| `layer` | `string` | Layer name. |
| `version` | `string` | Version of WFS protocol used: `1.0.0`, `1.1.0` (default) or `2.0.0`. |
| `format` | `string` | Format used when querying WFS, `gml` (default) or `geojson`. inkmap determines the GML parser based on the WFS version used. |
| `style` | `object` | JSON object in geostyler notation, defining the layer style. |

#### `projectionDefinition` type

A `projectionDefinition` object describes a projection to be registered in proj4.

| field | type | description |
|---|---|---|
| `name` | `string` | Name of the projection, written as `prefix`:`code`. |
| `bbox` | `[number, number, number, number]` | Extent of the projection, written as `[maxlat, minlon, minlat, maxlon]`. |
| `proj4` | `string` | Proj4 definition string. |

#### `PrintStatus` type

A `PrintStatus` object describes the status of a print job.

| field | type | description |
|---|---|---|
| `id` | `number` | Job id. |
| `progress` | `number` | Job progress, from 0 to 1. |
| `status` | `string` | Either `'pending'`, `'ongoing'`, `'finished'` or `'canceled'`. |
| `resultImageUrl` | `string` | An URL used to access the print result (PNG image). This will only be available once the job status is `'finished'`.|

## Architecture

Under the hood, `inkmap` will attempt to install a service worker on the page it is called. The service worker will then be in charge
of loading all the map images and data, composing them together and giving them back to the application code.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md).
