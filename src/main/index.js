import { map, switchMap, takeWhile } from 'rxjs/operators';

import '../printer';
import { MESSAGE_JOB_CANCEL, MESSAGE_JOB_REQUEST } from '../shared/constants';
import { registerWithExtent } from '../shared/projections';
import { messageToPrinter } from './exchange';
import {
  createNewJob,
  getJobsStatusObservable,
  getJobStatusObservable,
} from './jobs';
import getLegends from '../shared/widgets/legends';

export { downloadBlob } from './utils';

/**
 * @typedef {Object} TileGrid
 * @property {!Array<number>} resolutions Resolutions. The array index of each
 * resolution needs to match the zoom level. This means that even if a `minZoom`
 * is configured, the resolutions array will have a length of `maxZoom + 1`
 * @property {Array<string>} matrixIds matrix IDs. The length of this array needs
 * to match the length of the `resolutions` array. By default, it will be ['0', '1', '2', ..., resolutions.length-1]
 * @property {number} tileSize Tile size.
 * @property {number[]} [extent] Extent for the tile grid.
 */

/**
 * @typedef {Object} WmsLayer
 * @property {'WMS'} type
 * @property {string} url
 * @property {string} layer Layer name.
 * @property {string} version Version of WMS protocol used: `1.1.1` or `1.3.0` (default).
 * @property {number} opacity Opacity, from 0 (hidden) to 1 (visible).
 * @property {boolean} [tiled=false] Whether the WMS layer should be requested as tiles.
 * @property {string} [attribution] Attribution for the data used in the layer
 * @property {boolean} [legend=false] Whether a legend should be created for this layer.
 * @property {Object} [customParams] Custom parameters added to GetMap requests
 */

/**
 * @typedef {Object} XyzLayer
 * @property {'XYZ'} type
 * @property {string} url URL or URL template for the layer; can contain the following tokens: `{a-d}` for randomly choosing a letter, `{x}`, `{y}` and `{z}`.
 *   Note: tile grids are expected to have their x=0,y=0 point at the top left corner; for tile grids where it is at the bottom left corner, use the `{-y}` placeholder.
 * @property {number} opacity Opacity, from 0 (hidden) to 1 (visible).
 * @property {string} [attribution] Attribution for the data used in the layer
 * @property {boolean} [legend=false] Whether a legend should be created for this layer.
 */

/**
 * @typedef {Object} GeoJSONLayer
 * @property {'GeoJSON'} type
 * @property {Object} geojson Feature collection in GeoJSON format; coordinates are expected to be in the print job reference system
 * @property {Object} style JSON object in geostyler notation, defining the layer style.
 * @property {string} [attribution] Attribution for the data used in the layer
 * @property {boolean} [legend=false] Whether a legend should be created for this layer.
 */

/**
 * @typedef {Object} WmtsLayer
 * @property {'WMTS'} type
 * @property {number} opacity Opacity, from 0 (hidden) to 1 (visible)
 * @property {string} url A URL for the service.
 * @property {'KVP' | 'REST'} requestEncoding Request encoding; valid values are `KVP`, `REST`.
 * @property {string} format Image format. Only used when `requestEncoding` is `'KVP'`. eg `image/png`
 * @property {string} layer Layer name as advertised in the WMTS capabilities.
 * @property {string} style Style name as advertised in the WMTS capabilities.
 * @property {!string} projection Projection expressed in a code, e.g. 'EPSG:4326'.
 * @property {string} matrixSet Matrix set.
 * @property {TileGrid} tileGrid Tile grid.
 * @property {string} [attribution] Attribution for the data used in the layer
 * @property {boolean} [legend=false] Whether a legend should be created for this layer.
 */

/**
 * @typedef {Object} WfsLayer
 * @property {'WFS'} type
 * @property {string} url URL for the service.
 * @property {string} layer Layer name as advertised in the WFS capabilities.
 * @property {string} version Version of WFS protocol used: `1.0.0`, `1.1.0` (default) or `2.0.0`.
 * @property {string} format Format used when querying WFS, `gml` (default) or `geojson`. inkmap determines the GML parser based on the WFS version used.
 * @property {Object} style JSON object in geostyler notation, defining the layer style.
 * @property {string} [attribution] Attribution for the data used in the layer
 * @property {boolean} [legend=false] Whether a legend should be created for this layer.
 */

/**
 * @typedef {Object} ImageArcGISRest
 * @property {'ImageArcGISRest'} type
 * @property {string} url URL for the service.
 * @property {boolean} [hidpi=true] Use the ol/Map#pixelRatio value when requesting the image from the remote server.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling. By default, linear interpolation is used when resampling. Set to false to use the nearest neighbor instead.
 * @property {Object} params ArcGIS Rest parameters. This field is optional. Service defaults will be used for any fields not specified. FORMAT is PNG32 by default. F is IMAGE by default. TRANSPARENT is true by default. BBOX, SIZE, BBOXSR, and IMAGESR will be set dynamically. Set LAYERS to override the default service layer visibility. See https://developers.arcgis.com/rest/services-reference/export-map.htm for further reference.
 * @property {number} ratio Ratio. 1 means image requests are the size of the map viewport, 2 means twice the size of the map viewport, and so on. (defaults to 1.5)
 * @property {number} opacity Opacity, from 0 (hidden) to 1 (visible).
 * @property {string} [attribution] Attribution for the data used in the layer
 * @property {boolean} [legend=false] Whether a legend should be created for this layer.
 */

/**
 * @typedef {WmsLayer|XyzLayer|WmtsLayer|WfsLayer|GeoJSONLayer|ImageArcGISRest} Layer
 */

/**
 * @typedef {Object} ProjectionDefinition
 * @property {string} name Projection name written as `prefix:code`.
 * @property {string} proj4 Proj4 definition.
 * @property {[number, number, number, number]} bbox Projection validity extent.
 */

/**
 * @typedef {'m'|'mm'|'cm'|'in'|'px'} RealWorldUnit
 */

/**
 * @typedef {[number]|[number, RealWorldUnit]} LengthWithUnit
 */

/**
 * @typedef {[number, number]|[number, number, RealWorldUnit]} SizeWithUnit
 */

/**
 * @typedef {Object} PrintSpec
 * @property {Layer[]} layers Array of `Layer` objects that will be rendered in the map; last layers will be rendered on top of first layers.
 * @property {SizeWithUnit} size Width and height in pixels, or in the specified unit in 3rd place; valid units are `px`, `mm`, `cm`, `m` and `in`.
 * @property {[number, number]} center Longitude and latitude of the map center.
 * @property {number} dpi Dot-per-inch, usually 96 for a computer screen and 300 for a detailed print.
 * @property {number} scale Scale denominator.
 * @property {string} projection EPSG projection code.
 * @property {ProjectionDefinition} projectionDefinitions Projection definitions to be newly registered.
 * @property {boolean|WidgetPosition} attributions Position where the attributions should be printed; specify `true` for default position (bottom right).
 * @property {boolean|WidgetPosition|ScaleBarSpec} [scaleBar] Scale bar position or specs (for more options); specify `true` for default position (bottom-left). No scale bar if left undefined.
 * @property {boolean|WidgetPosition} [northArrow] North arrow position; specify `true` for default position (top right). No north arrow if left undefined.
 */

/**
 * @typedef {Object} ScaleBarSpec
 * @property {boolean|WidgetPosition} position Position on the map; specify `true` for default position (bottom left).
 * @property {ScaleUnits} units Units for the graphical scale bar. Possible values: "metric" (default), "degrees", "imperial", "nautical", "us".
 */

/** @typedef {'metric'|'degrees'|'imperial'|'nautical'|'us'} ScaleUnits */

/**
 * @typedef {Object} PrintStatus
 * @property {number} id Job id.
 * @property {PrintSpec} spec Job initial spec.
 * @property {number} progress Job progress, from 0 to 1.
 * @property {'pending' | 'ongoing' | 'finished' | 'canceled'} status Job status.
 * @property {Blob} [imageBlob] Finished image blob.
 * @property {SourceLoadError[]} [sourceLoadErrors] Array of `SourceLoadError` objects.
 */

/**
 * @typedef {Object} SourceLoadError
 * @property {string} url url of the ol.source that encountered at least one 'tileloaderror' or 'imageloaderror'.
 */

/**
 * @typedef {'bottom-left'|'bottom-right'|'top-left'|'top-right'} WidgetPosition
 * Specifies the position of a widget on the map.
 */

/**
 * Starts generating a map image from a print spec.
 * @param {PrintSpec} printSpec
 * @return {Promise<Blob>} Promise resolving to the final image blob.
 */
export function print(printSpec) {
  messageToPrinter(MESSAGE_JOB_REQUEST, { spec: printSpec });
  return createNewJob(printSpec)
    .pipe(
      switchMap((jobId) => getJobStatusObservable(jobId)),
      takeWhile((job) => job.progress < 1, true),
      map((job) => job.imageBlob)
    )
    .toPromise();
}

/**
 * Starts generating a map image from a print spec. Will simply return the job
 * id for further monitoring.
 * @param {PrintSpec} printSpec
 * @return {Promise<number>} Promise resolving to the print job id.
 */
export function queuePrint(printSpec) {
  return createNewJob(printSpec).toPromise();
}

/**
 * Starts generating a legend image from a print spec.
 * @param {PrintSpec} printSpec
 * @return {Promise<Blob>} Promise resolving to the final legend image blob.
 */
export function createLegends(printSpec) {
  if (printSpec.layers.find((el) => el.legend)) {
    return getLegends(printSpec);
  } else {
    console.warn(
      'The given spec did not include any layer with a configured legend'
    );
  }
}

/**
 * Returns a long-running observable which emits an array of print job status.
 * This observable will never complete.
 * @return {import('rxjs').Observable<PrintStatus[]>} Observable emitting jobs status array.
 */
export function getJobsStatus() {
  return getJobsStatusObservable();
}

/**
 * Returns an observable emitting status objects for a particular job.
 * The observable will complete once the job is ready.
 * @param {number} jobId
 * @return {import('rxjs').Observable<PrintStatus>} Observable emitting job status objects.
 */
export function getJobStatus(jobId) {
  return getJobStatusObservable(jobId).pipe(
    takeWhile((job) => job.progress < 1 && job.progress !== -1, true)
  );
}

/**
 * @param {number} jobId
 */
export function cancelJob(jobId) {
  messageToPrinter(MESSAGE_JOB_CANCEL, { jobId });
}

/**
 * Register a new projection from a projection definition.
 * @param {ProjectionDefinition} definition
 */
export function registerProjection(definition) {
  registerWithExtent(definition.name, definition.proj4, definition.bbox);
}

export { computeAttributionsText as getAttributionsText } from '../shared/widgets/attributions';

export { getPrintableNorthArrow as getNorthArrow } from '../shared/widgets/north-arrow';
export { getPrintableScaleBar as getScaleBar } from '../shared/widgets/scalebar';
