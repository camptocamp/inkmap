import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
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
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { stylefunction } from 'ol-mapbox-style';

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
