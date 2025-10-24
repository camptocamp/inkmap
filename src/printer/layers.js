import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import XYZ from 'ol/source/XYZ.js';
import BingMaps, { quadKey } from 'ol/source/BingMaps.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import TileWMS from 'ol/source/TileWMS.js';
import MVT from 'ol/format/MVT.js';
import WFS from 'ol/format/WFS.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from 'ol/source/Vector.js';
import ImageLayer from 'ol/layer/Image.js';
import VectorLayer from 'ol/layer/Vector.js';
import ImageArcGISRest from 'ol/source/ImageArcGISRest.js';
import { bbox } from 'ol/loadingstrategy.js';
import { createCanvasContext2D } from 'ol/dom.js';
import { BehaviorSubject, from, interval, merge, Subject } from 'rxjs';
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
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { extentFromProjection } from 'ol/tilegrid.js';
import {
  generateGetFeatureUrl,
  makeLayerFrameState,
  useContainer,
} from './utils.js';
import OpenLayersParser from 'geostyler-openlayers-parser';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import { applyStyle } from 'ol-mapbox-style';
import { PrintError } from '../shared/print-error.js';
import BaseEvent from 'ol/events/Event.js';

const blankSrc =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const update$ = interval(500);
export const cancel$ = new Subject();

/**
 * @typedef {Array} LayerPrintStatus
 * @property {number} 0 Progress, from 0 to 1, or -1 when canceled.
 * @property {HTMLCanvasElement|OffscreenCanvas|null} 1 Canvas on which the layer is printed, or null if progress < 1.
 */

/**
 * Returns an observable emitting the printing status for this layer
 * The observable will emit a final value, with the finished canvas
 * if not canceled, and complete.
 * @param {number} jobId
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
    case 'VectorTile':
      return createLayerVectorTile(jobId, layerSpec, rootFrameState);
  }
}

/**
 * @param {number} jobId
 * @param {import('ol/source/TileImage').default|import('ol/source/VectorTile').default} source
 * @param {import('ol/Map').FrameState} rootFrameState
 * @param {number} [opacity=1]
 * @param {import('ol/layer/Layer').default} [layer] Predefined layer (if any)
 * @return {import('rxjs').Observable<LayerPrintStatus>}
 */
function createTiledLayer(jobId, source, rootFrameState, opacity, layer) {
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};
  let frameState;
  let renderer;
  const errors$ = new Subject();

  layer =
    layer ??
    new TileLayer({
      source,
    });
  source.on('tileloaderror', function (e) {
    const tileUrl = /** @type {any} */ (e.tile)?.src_;
    errors$.next(new PrintError(`Failed to load tile at ${tileUrl}`));
  });

  frameState = makeLayerFrameState(rootFrameState, layer, opacity);

  renderer = layer.getRenderer();
  // @ts-ignore
  renderer.useContainer = useContainer.bind(renderer, context);

  renderer.renderFrame(frameState, context.canvas);
  const tileCount = Object.keys(
    /** @type {any} */ (frameState.tileQueue).queuedElements_,
  ).length;

  const updatedProgress$ = merge(update$, errors$).pipe(
    startWith(true),
    takeWhile(() => {
      frameState.tileQueue.reprioritize();
      frameState.tileQueue.loadMoreTiles(12, 4);
      return !!frameState.tileQueue.getTilesLoading();
    }, true),
    tap((v) => {
      if (v instanceof Error) throw v; // throw error if it was emitted by errors$
    }),
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
        return [1, context.canvas];
      } else {
        return [progress, null];
      }
    }),
    throttleTime(500, undefined, { leading: true, trailing: true }),
  );

  const canceledProgress$ = cancel$.pipe(
    filter((canceledJobId) => canceledJobId === jobId),
    map(() => [-1, null]),
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

  /** @type {import('rxjs').BehaviorSubject<LayerPrintStatus|PrintError>} */
  const progress$ = new BehaviorSubject([0, null]);

  /** @type {import('rxjs').Subject<Error>} */
  const errors$ = new Subject();

  // 'vectorloaderror' is a custom event, not part of OL
  source.on(/** @type {any} */ ('vectorloaderror'), function (e) {
    errors$.next(
      new PrintError(
        `Failed to load vector data: ${/** @type {any} */ (e).error.toString()}`,
      ),
    );
  });

  // when true, the layer is ready to be drawn
  let styleReady = false;
  if (style) {
    new OpenLayersParser().writeStyle(style).then(({ output: olStyle }) => {
      layer.setStyle(olStyle);
      styleReady = true;
    });
  } else {
    styleReady = true;
  }

  const updateSub = merge(update$, errors$)
    .pipe(
      // waiting for style to be converted
      skipWhile(() => !styleReady),
      tap((v) => {
        // close the progress$ stream & set it as errored
        if (v instanceof Error) {
          progress$.next(v);
          progress$.next([1, context.canvas]);
          updateSub.unsubscribe();
          cancelSub.unsubscribe();
        }
      }),
    )
    .subscribe({
      next: () => {
        // try to render the layer on each update
        renderer.prepareFrame({ ...frameState, time: Date.now() });
        renderer.renderFrame(
          { ...frameState, time: Date.now() },
          context.canvas,
        );

        // update status according to whether the data is loaded and layer is rendered
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
      },
    });

  const cancelSub = cancel$
    .pipe(
      filter((canceledJobId) => canceledJobId === jobId),
      take(1),
    )
    .subscribe(() => {
      progress$.next([-1, null]);
      progress$.complete();
      updateSub.unsubscribe();
      cancelSub.unsubscribe();
    });

  return /** @type {BehaviorSubject<LayerPrintStatus>} */ (
    progress$.pipe(
      tap((value) => {
        if (value instanceof Error) {
          progress$.next([1, context.canvas]);
          throw value;
        }
      }),
    )
  );
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

  /** @type {BehaviorSubject<LayerPrintStatus|PrintError>} */
  const progress$ = new BehaviorSubject([0, null]);
  layer = new ImageLayer({
    source,
  });

  let isCancelled = false;
  const cancelSub = cancel$
    .pipe(
      filter((canceledJobId) => canceledJobId === jobId),
      take(1),
    )
    .subscribe(() => {
      progress$.next([-1, null]);
      progress$.complete();
      isCancelled = true;
      cancelSub.unsubscribe();
    });

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
    const imageSrc =
      /** @type {any} */ (e.image?.getImage())?.src ?? '(unknown url)';
    progress$.next(new PrintError(`Failed to load image at ${imageSrc}`));
    progress$.complete();
  });
  source.once('imageloadend', () => {
    renderer.prepareFrame({ ...frameState, time: Date.now() });
    renderer.renderFrame({ ...frameState, time: Date.now() }, context.canvas);
    progress$.next([1, context.canvas]);
    progress$.complete();
    cancelSub.unsubscribe();
  });
  renderer.prepareFrame({ ...frameState, time: Date.now() });

  return /** @type {BehaviorSubject<LayerPrintStatus>} */ (
    progress$.pipe(
      tap((value) => {
        if (value instanceof Error) {
          progress$.next([1, context.canvas]);
          cancelSub.unsubscribe();
          throw value;
        }
      }),
    )
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
        ...(layerSpec.projection ? { projection: layerSpec.projection } : {}),
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
    ...(layerSpec.projection ? { projection: layerSpec.projection } : {}),
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
          if (!response.ok) {
            throw new PrintError(
              `Failed to fetch data: ${response.status} ${response.statusText}`,
            );
          }
          return response.text();
        })
        .then((responseText) => {
          vectorSource.addFeatures(format.readFeatures(responseText));
          vectorSource.setState('ready');
        })
        .catch((e) => {
          vectorSource.setState('error');
          const event = /** @type {any} */ (new BaseEvent('vectorloaderror'));
          event.error = e;
          vectorSource.dispatchEvent(event);
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
        throw new PrintError(
          `Failed to fetch metadata: ${response.status} ${response.statusText}`,
        );
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
  return from(createBingMapsSource(layerSpec)).pipe(
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

/**
 * Creates a vector tile layer and handles its rendering process
 * @param {number} jobId - Unique identifier for the print job
 * @param {import('../main/index.js').VectorTileLayer} layerSpec - Vector tile layer configuration
 * @param {import('ol/Map').FrameState} rootFrameState - Frame state from the root map
 * @return {import('rxjs').Observable<LayerPrintStatus>} Observable emitting layer print status
 */
function createLayerVectorTile(jobId, layerSpec, rootFrameState) {
  const tileLoadFunction =
    /** @type {function(import('ol/VectorTile').default,string): void} */ (
      function (tile, url) {
        tile.setLoader(async (extent, resolution, projection) => {
          const data = await fetch(url)
            .then((response) => {
              if (!response.ok) {
                throw new PrintError(
                  `Failed to fetch tile at ${url}: ${response.status} ${response.statusText}`,
                );
              }
              return response.arrayBuffer();
            })
            .catch((e) => {
              tile.setState('error');
              throw e;
            });
          const format = tile.getFormat();
          const features = format.readFeatures(data, {
            extent: extent,
            featureProjection: projection,
          });
          tile.setFeatures(features);
        });
      }
    );

  const layer = new VectorTileLayer({});
  /** @type {VectorTileSource} */
  let source;

  if (!layerSpec.styleUrl) {
    source = new VectorTileSource({
      format: new MVT(), // Mapbox Vector Tile format
      url: layerSpec.url, // URL with tile template placeholders {z}/{x}/{y}.pbf
      // @ts-ignore - crossOrigin is valid but not in typedefs
      crossOrigin: 'anonymous',
      maxZoom: layerSpec.maxZoom || 14,
      minZoom: layerSpec.minZoom || 0,
      projection: rootFrameState.viewState.projection,
      tileLoadFunction,
    });
    layer.setSource(source);
  }

  let styleReadyPromise;
  if (layerSpec.styleUrl) {
    styleReadyPromise = fetch(layerSpec.styleUrl)
      .then((response) => {
        if (!response.ok) {
          throw new PrintError(
            `Failed to fetch style: ${response.status} ${response.statusText}`,
          );
        }
        return response.json();
      })
      .then((styleJson) => {
        const spriteUrl = /** @type {string} */ (styleJson.sprite);
        if (!spriteUrl.includes('://')) {
          const newSpriteUrl = new URL(
            layerSpec.styleUrl,
            window.location.toString(),
          );
          newSpriteUrl.pathname += `/../${spriteUrl}`;
          styleJson.sprite = newSpriteUrl.toString();
        }
        for (const source in styleJson.sources) {
          const sourceObj = styleJson.sources[source];
          const sourceUrl = /** @type {string} */ (sourceObj.url);
          if (!sourceUrl.includes('://')) {
            const newSourceUrl = new URL(
              layerSpec.styleUrl,
              window.location.toString(),
            );
            newSourceUrl.pathname += `/../${sourceUrl}`;
            sourceObj.url = newSourceUrl.toString();
          }
        }

        return applyStyle(layer, styleJson);
      })
      .then(() => {
        source = layer.getSource();
        source.setTileLoadFunction(tileLoadFunction);
      });
  } else if (layerSpec.style) {
    styleReadyPromise = new OpenLayersParser()
      .writeStyle(layerSpec.style)
      .then(({ output: olStyle }) => {
        layer.setStyle(olStyle);
      });
  } else {
    styleReadyPromise = Promise.resolve();
  }

  return from(styleReadyPromise).pipe(
    switchMap(() =>
      createTiledLayer(jobId, source, rootFrameState, layerSpec.opacity, layer),
    ),
  );
}
