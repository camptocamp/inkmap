import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import BingMaps from 'ol/source/BingMaps';
import { quadKey } from 'ol/source/BingMaps';
import ImageWMS from 'ol/source/ImageWMS';
import TileWMS from 'ol/source/TileWMS';
import MVT from 'ol/format/MVT';

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
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { stylefunction } from 'ol-mapbox-style';

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
    case 'VectorTile':
      return createLayerVectorTile(jobId, layerSpec, rootFrameState);
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

/**
 * Creates a vector tile layer and handles its rendering process
 * @param {number} jobId - Unique identifier for the print job
 * @param {import('../main/index.js').VectorTileLayer} layerSpec - Vector tile layer configuration
 * @param {import('ol/Map').FrameState} rootFrameState - Frame state from the root map
 * @return {import('rxjs').Observable<LayerPrintStatus>} Observable emitting layer print status
 */
function createLayerVectorTile(jobId, layerSpec, rootFrameState) {
  // Create a canvas with dimensions from the frame state
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  // @ts-ignore
  context.canvas.style = {};

  // Create progress tracking subject that emits [progress, canvas, errorUrl]
  const progress$ = new BehaviorSubject([0, null, undefined]);
  let tileLoadErrorUrl;

  try {
    // Use URL exactly as provided in config - no special handling needed
    const source = new VectorTileSource({
      format: new MVT(), // Mapbox Vector Tile format
      url: layerSpec.url, // URL with tile template placeholders {z}/{x}/{y}.pbf
      // @ts-ignore - crossOrigin is valid but not in typedefs
      crossOrigin: 'anonymous',
      maxZoom: layerSpec.maxZoom || 14,
      minZoom: layerSpec.minZoom || 0,
      projection: rootFrameState.viewState.projection,
    });

    // Custom tile loading function to handle vector tiles
    source.setTileLoadFunction((tile, url) => {
      // Use fetch with proper headers for vector tiles
      fetch(url, {
        headers: {
          Accept: 'application/x-protobuf',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
        .then((response) => {
          if (!response.ok) {
            // Handle HTTP errors by setting tile to error state
            tile.setState(3); // TileState.ERROR
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then((data) => {
          if (data !== undefined && data.byteLength > 0) {
            try {
              // @ts-ignore - VectorTile specific properties
              const format = tile.getFormat();
              // @ts-ignore
              const tileCoord = tile.getTileCoord();
              const extent = source.getTileGrid().getTileCoordExtent(tileCoord);

              // Parse features from binary data using MVT parser
              const features = format.readFeatures(data, {
                extent: extent,
                featureProjection: rootFrameState.viewState.projection,
              });

              // Set parsed features on the tile and mark as loaded
              // @ts-ignore
              tile.setFeatures(features);
              tile.setState(2); // TileState.LOADED
            } catch (err) {
              // Handle parsing errors
              tileLoadErrorUrl = url;
              tile.setState(3); // TileState.ERROR
            }
          } else {
            // Empty tiles are normal for areas without data
            // @ts-ignore - Set empty features array but mark as loaded
            tile.setFeatures([]);
            tile.setState(2); // TileState.LOADED
          }
        })
        .catch(() => {
          // Record the URL that caused the error for reporting
          tileLoadErrorUrl = url;
          tile.setState(3); // TileState.ERROR
        });
    });

    // Create the vector tile layer
    const layer = new VectorTileLayer({
      source,
      declutter: layerSpec.declutter !== false, // Enable decluttering by default
      // @ts-ignore - renderMode is valid but not in typedefs
      renderMode: layerSpec.renderMode || 'hybrid', // 'hybrid' mode for better performance
      opacity: layerSpec.opacity || 1,
    });

    // Set up frame state and renderer
    const frameState = makeLayerFrameState(rootFrameState, layer);
    const renderer = layer.getRenderer();
    // @ts-ignore
    renderer.useContainer = useContainer.bind(renderer, context);

    // Track tile load errors
    source.on('tileloaderror', (/* e */) => {
      tileLoadErrorUrl = layerSpec.url;
    });

    // Fetch and apply style to the vector tiles
    const applyStyle = () => {
      return fetch(layerSpec.styleUrl)
        .then((r) => {
          if (!r.ok) {
            throw new Error(
              `Failed to fetch style: ${r.status} ${r.statusText}`
            );
          }
          return r.json();
        })
        .then((glStyle) => {
          // Calculate sprite URLs for style icons based on device pixel ratio
          const pixelRatio = rootFrameState.pixelRatio || 1;
          const spriteUrl = glStyle.sprite
            ? glStyle.sprite + (pixelRatio > 1 ? '@2x' : '') + '.json'
            : null;
          const spriteImageUrl = glStyle.sprite
            ? glStyle.sprite + (pixelRatio > 1 ? '@2x' : '') + '.png'
            : null;

          // Ensure the style has a source that matches our URL
          let targetSourceName = null;
          if (glStyle.sources) {
            // Try to find either an exact URL match or any vector source
            for (const [name, source] of Object.entries(glStyle.sources)) {
              if (source.type === 'vector') {
                if (source.url === layerSpec.url) {
                  targetSourceName = name;
                  break;
                } else if (!targetSourceName) {
                  // Keep as backup if no exact match
                  targetSourceName = name;
                }
              }
            }

            // If no matching source found, add one with a default name
            if (!targetSourceName) {
              targetSourceName = 'vectorTileSource';
              glStyle.sources[targetSourceName] = {
                type: 'vector',
                url: layerSpec.url,
              };
            }

            // Make sure our target source has the correct URL
            if (glStyle.sources[targetSourceName].url !== layerSpec.url) {
              glStyle.sources[targetSourceName].url = layerSpec.url;
            }
          }

          // Fetch sprite data if available
          return Promise.all([
            glStyle,
            spriteUrl
              ? fetch(spriteUrl)
                  .then((r) => (r.ok ? r.json() : {}))
                  .catch(() => ({})) // Return empty object on error
              : Promise.resolve({}),
            targetSourceName,
            spriteImageUrl,
          ]);
        })
        .then(([glStyle, spriteData, targetSourceName, spriteImageUrl]) => {
          // Define a font replacement function for text rendering
          const fontReplacer = (font) =>
            font[0]
              .replace('Noto Sans', 'serif')
              .replace('Roboto', 'sans-serif');

          let styleApplied = false;

          // Try multiple approaches to ensure style gets applied

          // 1. Try with the identified target source first
          if (targetSourceName && !styleApplied) {
            try {
              stylefunction(
                layer,
                glStyle,
                targetSourceName,
                undefined,
                spriteData,
                spriteImageUrl,
                // @ts-ignore
                layerSpec.fontCallback || fontReplacer
              );
              styleApplied = true;
            } catch (_) {
              // Failed with target source, will try alternatives
            }
          }

          // 2. If that didn't work, try each source in the style
          if (!styleApplied && glStyle.sources) {
            for (const sourceName of Object.keys(glStyle.sources)) {
              if (styleApplied) break;

              try {
                stylefunction(
                  layer,
                  glStyle,
                  sourceName,
                  undefined,
                  spriteData,
                  spriteImageUrl,
                  // @ts-ignore
                  layerSpec.fontCallback || fontReplacer
                );
                styleApplied = true;
              } catch (_) {
                // Continue trying other sources
              }
            }
          }

          // 3. If still nothing worked, try with no specific source
          if (!styleApplied) {
            try {
              stylefunction(
                layer,
                glStyle,
                undefined,
                undefined,
                spriteData,
                spriteImageUrl,
                // @ts-ignore
                layerSpec.fontCallback || fontReplacer
              );
              styleApplied = true;
            } catch (_) {
              // All style application attempts failed
            }
          }

          return styleApplied;
        });
    };

    // Handle cancellation
    cancel$
      .pipe(
        filter((canceledJobId) => canceledJobId === jobId),
        take(1)
      )
      .subscribe(() => {
        progress$.next([-1, null, undefined]);
        progress$.complete();
      });

    // Apply style and monitor loading
    applyStyle()
      .then(() => {
        // Default number of tiles to track for progress reporting
        let tileCount = 20;

        // Force initial rendering passes to trigger tile loading
        for (let i = 0; i < 3; i++) {
          renderer.prepareFrame(frameState);
          renderer.renderFrame(frameState, context.canvas);

          // Load more tiles explicitly - necessary to start vector tile loading
          frameState.tileQueue.reprioritize();
          frameState.tileQueue.loadMoreTiles(24, 12);
        }

        // Give tiles more time to start loading
        setTimeout(() => {
          startMonitoring();
        }, 200); // Longer timeout to ensure loading starts

        // Monitor tile loading with aggressive tile loading strategy
        function startMonitoring() {
          const updateSub = update$
            .pipe(
              startWith(true),
              // @ts-ignore
              takeWhile((value, index) => {
                // Force loading for multiple iterations to ensure tiles start loading
                if (index < 5) {
                  // Aggressive tile loading for initial iterations
                  frameState.tileQueue.reprioritize();
                  frameState.tileQueue.loadMoreTiles(24, 12);
                  return true;
                }

                // Get current loading status
                const tilesLoading = frameState.tileQueue.getTilesLoading();

                // Request more tiles
                frameState.tileQueue.reprioritize();
                frameState.tileQueue.loadMoreTiles(24, 12);

                // Continue while loading or for minimum iterations
                return tilesLoading > 0 || index < 5;
              }, true)
            )
            .subscribe({
              next: () => {
                // Calculate progress based on remaining tiles loading
                let tilesLoading = frameState.tileQueue.getTilesLoading();
                let progress = 1 - tilesLoading / tileCount;
                progress = Math.min(1, Math.max(0.1, progress));

                // Force render on each update
                renderer.prepareFrame(frameState);
                renderer.renderFrame(frameState, context.canvas);

                // Check if complete
                if (tilesLoading === 0) {
                  // Final render
                  renderer.prepareFrame(frameState);
                  renderer.renderFrame(frameState, context.canvas);

                  // Add border for visual clarity
                  context.strokeStyle = 'rgba(0,0,0,0.2)';
                  context.lineWidth = 1;
                  context.strokeRect(0, 0, width, height);

                  // Complete observable with finished canvas
                  // @ts-ignore
                  progress$.next([1, context.canvas, tileLoadErrorUrl]);
                  progress$.complete();
                  updateSub.unsubscribe();
                } else {
                  // Update progress
                  // @ts-ignore
                  progress$.next([progress, null, tileLoadErrorUrl]);
                }
              },
              error: () => {
                // Handle monitoring errors
                // @ts-ignore
                progress$.next([1, context.canvas, 'Error monitoring tiles']);
                progress$.complete();
              },
            });
        }
      })
      .catch(() => {
        // Handle style application errors by rendering an error message
        context.fillStyle = 'rgba(255,0,0,0.2)';
        context.fillRect(0, 0, width, height);
        context.fillStyle = 'red';
        context.fillText('Error applying style', width / 2, height / 2);
        // @ts-ignore
        progress$.next([1, context.canvas, layerSpec.styleUrl]);
        progress$.complete();
      });

    return progress$;
  } catch (err) {
    // Handle unexpected errors in the entire process
    context.fillStyle = 'rgba(255,0,0,0.2)';
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'red';
    context.fillText('Vector tile error', width / 2, height / 2);
    // @ts-ignore
    progress$.next([1, context.canvas, 'Vector tile error']);
    progress$.complete();
    return progress$;
  }
}
