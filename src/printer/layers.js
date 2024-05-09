import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import ImageWMS from 'ol/source/ImageWMS';
import TileWMS from 'ol/source/TileWMS';
import WFS from 'ol/format/WFS';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import ImageArcGISRest from 'ol/source/ImageArcGISRest';
import { bbox } from 'ol/loadingstrategy';
import { createCanvasContext2D } from 'ol/dom';
import { BehaviorSubject, interval, merge, Subject } from 'rxjs';
import {
  filter,
  map,
  startWith,
  take,
  takeWhile,
  tap,
  throttleTime,
} from 'rxjs/operators';
import { isWorker } from '../worker/utils';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { extentFromProjection } from 'ol/tilegrid';
import {
  generateGetFeatureUrl,
  makeLayerFrameState,
  useContainer,
} from './utils';
import OpenLayersParser from 'geostyler-openlayers-parser';

const update$ = interval(500);
export const cancel$ = new Subject();

/**
 * @typedef {Array} LayerPrintStatus
 * @property {number} 0 Progress, from 0 to 1, or -1 when canceled.
 * @property {HTMLCanvasElement|OffscreenCanvas|null} 1 Canvas on which the layer is printed, or null if progress < 1.
 * @property {string} 2 URL which caused an error.
 */

/**
 * Returns an observable emitting the printing status for this layer
 * The observable will emit a final value, with the finished canvas
 * if not canceled, and complete.
 * @param {import('../main/index.js').Layer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
export function createLayer(jobId, layerSpec, rootFrameState) {
  switch (layerSpec.type) {
    case 'XYZ':
      return createLayerXYZ(jobId, layerSpec, rootFrameState);
    case 'WMS':
      return createLayerWMS(jobId, layerSpec, rootFrameState);
    case 'WMTS':
      return createLayerWMTS(jobId, layerSpec, rootFrameState);
    case 'WFS':
      return createLayerWFS(jobId, layerSpec, rootFrameState);
    case 'GeoJSON':
      return createLayerGeoJSON(layerSpec, rootFrameState);
    case 'ImageArcGISRest':
      return createLayerImageArcGISRest(jobId, layerSpec, rootFrameState);
  }
}

/**
 * @param {number} jobId
 * @param {import('ol/source/TileImage').default} source
 * @param {import('ol/Map').FrameState} rootFrameState
 * @param {number} [opacity=1]
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createTiledLayer(jobId, source, rootFrameState, opacity) {
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};
  let frameState;
  let layer;
  let renderer;
  let tileLoadErrorUrl;

  layer = new TileLayer({
    source,
  });
  source.setTileLoadFunction(function (tile, src) {
    /** @type {HTMLImageElement} */
    const image = /** @type {any} */ (tile).getImage();

    if (isWorker()) {
      const tileSize = layer
        .getSource()
        .getTilePixelSize(
          0,
          rootFrameState.pixelRatio,
          rootFrameState.viewState.projection
        );
      // @ts-ignore
      image.hintImageSize(tileSize[0], tileSize[1]);
    }

    image.src = src;
  });

  layer.getSource().on('tileloaderror', function (e) {
    tileLoadErrorUrl = e.target.getUrls()[0];
  });

  frameState = makeLayerFrameState(rootFrameState, layer, opacity);

  renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  renderer.renderFrame(frameState, context.canvas);
  const tileCount = Object.keys(
    /** @type {any} */ (frameState.tileQueue).queuedElements_
  ).length;

  const updatedProgress$ = update$.pipe(
    startWith(true),
    takeWhile(() => {
      frameState.tileQueue.reprioritize();
      frameState.tileQueue.loadMoreTiles(12, 4);
      return frameState.tileQueue.getTilesLoading();
    }, true),
    map(() => {
      let queuedTilesCount = Object.keys(
        frameState.tileQueue.queuedElements_
      ).length;

      let progress = 1 - queuedTilesCount / tileCount;

      // this is to make sure all tiles have finished loading before completing layer
      if (progress === 1 && frameState.tileQueue.getTilesLoading() > 0) {
        progress -= 0.001;
      }

      if (progress === 1) {
        renderer.renderFrame(frameState, context.canvas);
        return [1, context.canvas, tileLoadErrorUrl];
      } else {
        return [progress, null, tileLoadErrorUrl];
      }
    }),
    throttleTime(500, undefined, { leading: true, trailing: true })
  );

  const canceledProgress$ = cancel$.pipe(
    filter((canceledJobId) => canceledJobId === jobId),
    map(() => [-1, null, undefined])
  );

  return merge(updatedProgress$, canceledProgress$).pipe(
    takeWhile(([progress]) => progress !== -1 && progress !== 1, true)
  );
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').XyzLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerXYZ(jobId, layerSpec, rootFrameState) {
  return createTiledLayer(
    jobId,
    new XYZ({
      crossOrigin: 'anonymous',
      url: layerSpec.url,
      transition: 0,
    }),
    rootFrameState,
    layerSpec.opacity
  );
}

/**
 * @param {import('../main/index.js').WmsLayer} layerSpec
 * @return {Object.<string, string|boolean>}
 */
export function getWMSParams(layerSpec) {
  return layerSpec.tiled
    ? {
        LAYERS: layerSpec.layer,
        VERSION: layerSpec.version || '1.3.0',
        TILED: true,
        ...layerSpec.customParams,
      }
    : {
        LAYERS: layerSpec.layer,
        VERSION: layerSpec.version || '1.3.0',
        ...layerSpec.customParams,
      };
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').WmsLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerWMS(jobId, layerSpec, rootFrameState) {
  if (layerSpec.tiled) {
    return createTiledLayer(
      jobId,
      new TileWMS({
        crossOrigin: 'anonymous',
        url: layerSpec.url,
        params: getWMSParams(layerSpec),
        transition: 0,
      }),
      rootFrameState,
      layerSpec.opacity
    );
  }

  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};
  let frameState;
  let layer;
  let renderer;

  /** @type {import('rxjs').BehaviorSubject<LayerPrintStatus>} */
  const progress$ = new BehaviorSubject([0, null, undefined]);

  const source = new ImageWMS({
    crossOrigin: 'anonymous',
    url: layerSpec.url,
    params: getWMSParams(layerSpec),
    ratio: 1,
  });
  layer = new ImageLayer({
    source,
  });
  source.setImageLoadFunction(function (layerImage, src) {
    /** @type {HTMLImageElement} */
    const image = /** @type {any} */ (layerImage).getImage();

    if (isWorker()) {
      // @ts-ignore
      image.hintImageSize(width, height);
    }

    const blankSrc =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    cancel$
      .pipe(
        filter((canceledJobId) => canceledJobId === jobId),
        take(1),
        tap(() => {
          progress$.next([-1, null, undefined]);
          progress$.complete();
          image.src = blankSrc;
        })
      )
      .subscribe();

    image.src = src;
  });

  frameState = makeLayerFrameState(rootFrameState, layer, layerSpec.opacity);

  renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  layer.getSource().once('imageloaderror', function (e) {
    const imageLoadErrorUrl = e.target.getUrl();
    progress$.next([1, context.canvas, imageLoadErrorUrl]);
    progress$.complete();
  });
  layer.getSource().once('imageloadend', () => {
    renderer.prepareFrame({ ...frameState, time: Date.now() });
    renderer.renderFrame({ ...frameState, time: Date.now() }, context.canvas);
    progress$.next([1, context.canvas, undefined]);
    progress$.complete();
  });
  renderer.prepareFrame({ ...frameState, time: Date.now() });

  return progress$;
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').WmtsLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerWMTS(jobId, layerSpec, rootFrameState) {
  let { tileGrid, projection } = layerSpec;
  let { resolutions, extent, matrixIds } = tileGrid;
  extent = extent || extentFromProjection(projection);
  matrixIds =
    matrixIds ||
    Array(resolutions.length)
      .fill(0)
      .map((_, i) => `${i}`);

  const olTileGrid = new WMTSTileGrid({
    ...tileGrid,
    extent,
    matrixIds,
  });

  return createTiledLayer(
    jobId,
    new WMTS({
      ...layerSpec,
      tileGrid: olTileGrid,
      projection,
      transition: 0,
      crossOrigin: 'anonymous',
    }),
    rootFrameState,
    layerSpec.opacity
  );
}

/**
 * @param {import('../main/index.js').GeoJSONLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerGeoJSON(layerSpec, rootFrameState) {
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};

  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(layerSpec.geojson),
  });

  const layer = new VectorLayer({
    source: vectorSource,
  });

  let frameState = makeLayerFrameState(rootFrameState, layer);
  let renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  /** @type {import('rxjs').BehaviorSubject<LayerPrintStatus>} */
  const progress$ = new BehaviorSubject([0, null]);

  // when this promise resolves, the layer is ready to be drawn
  const styleReadyPromise = layerSpec.style
    ? new OpenLayersParser()
        .writeStyle(layerSpec.style)
        .then(({ output: olStyle }) => layer.setStyle(olStyle))
        .catch((error) => console.log(error))
    : Promise.resolve();

  // when ready, draw layer & send a complete progress value
  styleReadyPromise.then(() => {
    renderer.prepareFrame({ ...frameState, time: Date.now() });
    renderer.renderFrame({ ...frameState, time: Date.now() }, context.canvas);
    progress$.next([1, context.canvas]);
    progress$.complete();
  });

  return progress$;
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').WfsLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerWFS(jobId, layerSpec, rootFrameState) {
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};

  let frameState;
  let renderer;
  const version = layerSpec.version || '1.1.0';
  const format =
    layerSpec.format === 'geojson' ? new GeoJSON() : new WFS({ version });

  /** @type {import('rxjs').BehaviorSubject<LayerPrintStatus>} */
  const progress$ = new BehaviorSubject([0, null]);

  let vectorSource = new VectorSource({
    format,
    loader: function (extent, resolution, projection) {
      const projCode = projection.getCode();
      const requestUrl = generateGetFeatureUrl(
        layerSpec.url,
        version,
        layerSpec.layer,
        layerSpec.format,
        projCode,
        extent
      );
      fetch(requestUrl)
        .then((response) => {
          if (response.status >= 400) {
            throw new Error();
          }
          return response.text();
        })
        .then((responseText) => {
          vectorSource.addFeatures(format.readFeatures(responseText));
          if (vectorSource.getFeatures().length !== 0) {
            renderer.prepareFrame({ ...frameState, time: Date.now() });
            renderer.renderFrame(
              { ...frameState, time: Date.now() },
              context.canvas
            );
          }
          progress$.next([1, context.canvas]);
          progress$.complete();
        })
        .catch(() => {
          progress$.next([1, context.canvas, layerSpec.url]);
          progress$.complete();
        });

      cancel$
        .pipe(
          filter((canceledJobId) => canceledJobId === jobId),
          take(1),
          tap(() => {
            progress$.next([-1, null]);
            progress$.complete();
          })
        )
        .subscribe();
    },
    strategy: bbox,
  });

  let layer = new VectorLayer({
    source: vectorSource,
  });

  if (layerSpec.style) {
    const parser = new OpenLayersParser();
    parser
      .writeStyle(layerSpec.style)
      .then(({ output: olStyle }) => layer.setStyle(olStyle))
      .catch((error) => console.log(error));
  }

  frameState = makeLayerFrameState(rootFrameState, layer);
  renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  renderer.prepareFrame({ ...frameState, time: Date.now() });

  return progress$;
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').ImageArcGISRest} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerImageArcGISRest(jobId, layerSpec, rootFrameState) {
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};
  let frameState;
  let layer;
  let renderer;

  const source = new ImageArcGISRest({
    ...layerSpec,
    crossOrigin: 'anonymous',
  });
  /** @type {import('rxjs').BehaviorSubject<LayerPrintStatus>} */
  const progress$ = new BehaviorSubject([0, null, undefined]);

  layer = new ImageLayer({
    source: source,
  });
  source.setImageLoadFunction(function (layerImage, src) {
    /** @type {HTMLImageElement} */
    const image = /** @type {any} */ (layerImage).getImage();

    if (isWorker()) {
      // @ts-ignore
      image.hintImageSize(width, height);
    }

    const blankSrc =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    cancel$
      .pipe(
        filter((canceledJobId) => canceledJobId === jobId),
        take(1),
        tap(() => {
          progress$.next([-1, null, undefined]);
          progress$.complete();
          image.src = blankSrc;
        })
      )
      .subscribe();

    image.src = src;
  });

  frameState = makeLayerFrameState(rootFrameState, layer, layerSpec.opacity);

  renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  layer.getSource().once('imageloaderror', function (e) {
    const imageLoadErrorUrl = e.target.getUrl();
    progress$.next([1, context.canvas, imageLoadErrorUrl]);
    progress$.complete();
  });
  layer.getSource().once('imageloadend', () => {
    renderer.prepareFrame({ ...frameState, time: Date.now() });
    renderer.renderFrame({ ...frameState, time: Date.now() }, context.canvas);
    progress$.next([1, context.canvas, undefined]);
    progress$.complete();
  });
  renderer.prepareFrame({ ...frameState, time: Date.now() });

  return progress$;
}
