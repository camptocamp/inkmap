import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import BingMaps from 'ol/source/BingMaps';
import { quadKey } from 'ol/source/BingMaps';
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
  skipWhile,
  startWith,
  switchMap,
  take,
  takeWhile,
  tap,
  throttleTime,
} from 'rxjs/operators';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { extentFromProjection } from 'ol/tilegrid';
import {
  generateGetFeatureUrl,
  makeLayerFrameState,
  useContainer,
} from './utils.js';
import OpenLayersParser from 'geostyler-openlayers-parser';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

const blankSrc =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

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
      return createLayerGeoJSON(jobId, layerSpec, rootFrameState);
    case 'BingMaps':
      // @ts-ignore
      return createLayerBingMaps(jobId, layerSpec, rootFrameState);
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
    /** @type {any} */ (frameState.tileQueue).queuedElements_,
  ).length;

  const updatedProgress$ = update$.pipe(
    startWith(true),
    takeWhile(() => {
      frameState.tileQueue.reprioritize();
      frameState.tileQueue.loadMoreTiles(12, 4);
      return !!frameState.tileQueue.getTilesLoading();
    }, true),
    map(() => {
      let queuedTilesCount = Object.keys(
        frameState.tileQueue['queuedElements_'],
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
    throttleTime(500, undefined, { leading: true, trailing: true }),
  );

  const canceledProgress$ = cancel$.pipe(
    filter((canceledJobId) => canceledJobId === jobId),
    map(() => [-1, null, undefined]),
  );

  return merge(updatedProgress$, canceledProgress$).pipe(
    takeWhile(([progress]) => progress !== -1 && progress !== 1, true),
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
    layerSpec.opacity,
  );
}

/**
 * @param {number} jobId
 * @param {import('ol/source/Vector').default} source
 * @param {Object} style
 * @param {import('ol/Map').FrameState} rootFrameState
 * @param {number} [opacity=1]
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createVectorLayer(jobId, source, style, rootFrameState, opacity) {
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};

  const layer = new VectorLayer({
    source,
  });

  let frameState = makeLayerFrameState(rootFrameState, layer);
  let renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  /** @type {import('rxjs').BehaviorSubject<LayerPrintStatus>} */
  const progress$ = new BehaviorSubject([0, null]);

  // when true, the layer is ready to be drawn
  let styleReady = false;
  if (style) {
    new OpenLayersParser()
      .writeStyle(style)
      .then(({ output: olStyle }) => {
        layer.setStyle(olStyle);
        styleReady = true;
      })
      .catch((error) => console.log(error));
  } else {
    styleReady = true;
  }

  const updateSub = update$
    .pipe(
      skipWhile(() => !styleReady),
      tap(() => {
        // try to render the layer on each update
        renderer.prepareFrame({ ...frameState, time: Date.now() });
        renderer.renderFrame(
          { ...frameState, time: Date.now() },
          context.canvas,
        );
      }),
      map(() => {
        const sourceLoaded = source.getState() === 'ready';
        const layerRendered = renderer.ready;
        if (sourceLoaded && layerRendered) {
          progress$.next([1, context.canvas]);
          progress$.complete();
          updateSub.unsubscribe();
          cancelSub.unsubscribe();
        } else if (sourceLoaded) {
          progress$.next([0.75, null]);
        } else {
          progress$.next([0.5, null]);
        }
      }),
    )
    .subscribe();

  const cancelSub = cancel$
    .pipe(
      filter((canceledJobId) => canceledJobId === jobId),
      take(1),
      tap(() => {
        progress$.next([-1, null]);
        progress$.complete();
        updateSub.unsubscribe();
        cancelSub.unsubscribe();
      }),
    )
    .subscribe();

  return progress$;
}

/**
 * @param {number} jobId
 * @param {import('ol/source/Image').default} source
 * @param {import('ol/Map').FrameState} rootFrameState
 * @param {number} [opacity=1]
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createImageLayer(jobId, source, rootFrameState, opacity) {
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
  layer = new ImageLayer({
    source,
  });

  let isCancelled = false;
  const cancelSub = cancel$
    .pipe(
      filter((canceledJobId) => canceledJobId === jobId),
      take(1),
      tap(() => {
        progress$.next([-1, null, undefined]);
        progress$.complete();
        isCancelled = true;
        cancelSub.unsubscribe();
      }),
    )
    .subscribe();

  if (
    'setImageLoadFunction' in source &&
    typeof source.setImageLoadFunction === 'function' &&
    'getImageLoadFunction' in source &&
    typeof source.getImageLoadFunction === 'function'
  ) {
    const originalFn = /** @type {import("ol/Image").LoadFunction} */ (
      source.getImageLoadFunction()
    );
    source.setImageLoadFunction(function (layerImage, src) {
      /** @type {HTMLImageElement} */
      const image = /** @type {any} */ (layerImage).getImage();

      if (isCancelled) {
        image.src = blankSrc;
        return;
      }

      originalFn(layerImage, src);
    });
  }

  frameState = makeLayerFrameState(rootFrameState, layer, opacity);

  renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  source.once('imageloaderror', function (e) {
    const imageLoadErrorUrl = e.target.getUrl();
    progress$.next([1, context.canvas, imageLoadErrorUrl]);
    progress$.complete();
    cancelSub.unsubscribe();
  });
  source.once('imageloadend', () => {
    renderer.prepareFrame({ ...frameState, time: Date.now() });
    renderer.renderFrame({ ...frameState, time: Date.now() }, context.canvas);
    progress$.next([1, context.canvas, undefined]);
    progress$.complete();
    cancelSub.unsubscribe();
  });
  renderer.prepareFrame({ ...frameState, time: Date.now() });

  return progress$;
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
      layerSpec.opacity,
    );
  }

  const source = new ImageWMS({
    crossOrigin: 'anonymous',
    url: layerSpec.url,
    params: getWMSParams(layerSpec),
    ratio: 1,
  });
  return createImageLayer(jobId, source, rootFrameState, layerSpec.opacity);
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
    layerSpec.opacity,
  );
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').GeoJSONLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerGeoJSON(jobId, layerSpec, rootFrameState) {
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(layerSpec.geojson),
  });

  return createVectorLayer(
    jobId,
    vectorSource,
    layerSpec.style,
    rootFrameState,
    layerSpec.opacity,
  );
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').WfsLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerWFS(jobId, layerSpec, rootFrameState) {
  const version = layerSpec.version || '1.1.0';
  const format =
    layerSpec.format === 'geojson' ? new GeoJSON() : new WFS({ version });
  const vectorSource = new VectorSource({
    format,
    loader: function (extent, resolution, projection) {
      const projCode = projection.getCode();
      const requestUrl = generateGetFeatureUrl(
        layerSpec.url,
        version,
        layerSpec.layer,
        layerSpec.format,
        projCode,
        extent,
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
          vectorSource.setState('ready');
        });
      vectorSource.setState('loading');
    },
    strategy: bbox,
  });

  return createVectorLayer(
    jobId,
    vectorSource,
    layerSpec.style,
    rootFrameState,
    layerSpec.opacity,
  );
}

/**
 * @param {import('../main/index.js').BingMapsLayer} layerSpec
 * @return {Promise<import('ol/source/BingMaps').default>}
 */
async function createBingMapsSource(layerSpec) {
  const source = new BingMaps({
    key: layerSpec.apiKey,
    imagerySet: layerSpec.imagerySet,
    culture: layerSpec.culture,
  });
  const culture = layerSpec.culture !== undefined ? layerSpec.culture : 'en-us';

  // BingMaps doesn't store the URL, so we need to do a fetch by ourselves to get it and pass it to the Object
  await fetch(
    'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/' +
      layerSpec.imagerySet +
      '?uriScheme=https&include=ImageryProviders&key=' +
      layerSpec.apiKey +
      '&c=' +
      culture,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error('ERROR HTTP, status ' + response.status);
      }
      return response.json();
    })
    .then((data) => {
      var url = data.resourceSets[0].resources[0].imageUrl;

      url = url.replace('{subdomain}', 't{0-3}');
      if (url.includes('{culture}')) {
        url = url.replace('{culture}', culture);
      } else if (url.includes('en-US')) {
        url = url.replace('en-US', culture);
      }
      url = url + '&coord={z}/{x}/{y}';
      source.setUrl(url);
    })
    .catch((error) => {
      console.error('ERROR : ', error);
      return error;
    });

  source.setTileLoadFunction(function (tile, src) {
    const image = /** @type {HTMLImageElement} */ (
      /** @type {import('ol/ImageTile').default} */ (tile).getImage()
    );
    function getCoords(str) {
      str = str.split('&coord=');
      return str[str.length - 1];
    }
    let coords = getCoords(src);

    let tabCoords = coords.split('/');
    let resQuadKey = quadKey([tabCoords[0], tabCoords[1], tabCoords[2]]);

    src = src.replace('{quadkey}', resQuadKey);
    src = src.replace('&coord=' + coords, '');
    image.src = src;
  });

  return source;
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').BingMapsLayer} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerBingMaps(jobId, layerSpec, rootFrameState) {
  return fromPromise(createBingMapsSource(layerSpec)).pipe(
    switchMap((source) =>
      createTiledLayer(jobId, source, rootFrameState, layerSpec.opacity),
    ),
  );
}

/**
 * @param {number} jobId
 * @param {import('../main/index.js').ImageArcGISRest} layerSpec
 * @param {import('ol/Map').FrameState} rootFrameState
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createLayerImageArcGISRest(jobId, layerSpec, rootFrameState) {
  const source = new ImageArcGISRest({
    ...layerSpec,
    crossOrigin: 'anonymous',
  });
  return createImageLayer(jobId, source, rootFrameState, layerSpec.opacity);
}
