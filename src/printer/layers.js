import TileLayer from 'ol/layer/Tile';
import TileState from 'ol/TileState';
import XYZ from 'ol/source/XYZ';
import ImageWMS from 'ol/source/ImageWMS';
import TileWMS from 'ol/source/TileWMS';
import ImageLayer from 'ol/layer/Image';
import { createCanvasContext2D } from 'ol/dom';
import { BehaviorSubject, interval } from 'rxjs';
import { map, startWith, takeWhile, throttleTime } from 'rxjs/operators';
import { isWorker } from '../worker/utils';
import { HTTP_CODES } from '../shared/constants';

const update$ = interval(500);

/**
 * @typedef {Array} LayerPrintStatus
 * @property {number} 0 Progress, from 0 to 1.
 * @property {HTMLCanvasElement|OffscreenCanvas|null} 1 Canvas on which the layer is printed, or null if progress < 1.
 */

/**
 * Returns an observable emitting the printing status for this layer
 * The observable will emit a final value with the finished canvas
 * and complete.
 * @param {Layer} layerSpec
 * @param {FrameState} rootFrameState
 * @return {Observable<LayerPrintStatus>}
 */
export function createLayer(layerSpec, rootFrameState) {
  switch (layerSpec.type) {
    case 'XYZ':
      return createLayerXYZ(layerSpec, rootFrameState);
    case 'WMS':
      return createLayerWMS(layerSpec, rootFrameState);
  }
}

/**
 * @param {TileSource} source
 * @param {FrameState} rootFrameState
 * @param {number} [opacity=1]
 * @return {Observable<LayerPrintStatus>}
 */
function createTiledLayer(source, rootFrameState, opacity, debug) {
  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  context.canvas.style = {};
  let frameState;
  let layer;
  let renderer;

  layer = new TileLayer({
    transition: 0,
    source,
  });
  layer.getSource().setTileLoadFunction(function (tile, src) {
    const image = tile.getImage();

    const tileSize = layer
      .getSource()
      .getTilePixelSize(
        0,
        rootFrameState.pixelRatio,
        rootFrameState.viewState.projection
      );
    if (isWorker()) {
      image.hintImageSize(tileSize[0], tileSize[1]);
    }

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.addEventListener('loadend', function () {
      var data = this.response;

      if (this.status === 0 || this.status >= 400) {
        if (debug) {
          createErrorTile(image, tileSize, this.status);
        }
        tile.setState(TileState.ERROR);
      } else {
        if (data !== undefined) {
          tile.getImage().src = URL.createObjectURL(data);
        }
      }
    });
    xhr.addEventListener('error', function () {
      tile.setState(TileState.ERROR);
    });
    xhr.open('GET', src);
    xhr.send();
  });

  frameState = {
    ...rootFrameState,
    layerStatesArray: [
      {
        layer,
        managed: true,
        maxResolution: null,
        maxZoom: null,
        minResolution: 0,
        minZoom: null,
        opacity: opacity !== undefined ? opacity : 1,
        sourceState: 'ready',
        visible: true,
        zIndex: 0,
      },
    ],
  };

  renderer = layer.getRenderer();
  renderer.useContainer = function () {
    this.containerReused = false;
    this.canvas = context.canvas;
    this.context = context;
    this.container = {
      firstElementChild: context.canvas,
    };
  };

  renderer.renderFrame({ ...frameState, time: Date.now() }, context.canvas);
  const tileCount = Object.keys(frameState.tileQueue.queuedElements_).length;

  return update$.pipe(
    startWith(true),
    takeWhile(() => {
      frameState.tileQueue.reprioritize();
      frameState.tileQueue.loadMoreTiles(12, 4);
      return frameState.tileQueue.getTilesLoading();
    }, true),
    map(() => {
      let loadedTilesCount = Object.keys(frameState.tileQueue.queuedElements_)
        .length;

      let progress = 1 - loadedTilesCount / tileCount;

      // this is to make sure all tiles have finished loading before completing layer
      if (progress === 1 && frameState.tileQueue.getTilesLoading() > 0) {
        progress -= 0.001;
      }

      if (progress === 1) {
        renderer.renderFrame(
          { ...frameState, time: Date.now() },
          context.canvas
        );
        return [1, context.canvas];
      } else {
        return [progress, null];
      }
    }),
    throttleTime(500, undefined, { leading: true, trailing: true })
  );
}

function createErrorTile(image, tileSize, errorCode) {
  let errorText = HTTP_CODES[errorCode];

  const ctx = createCanvasContext2D(tileSize[0], tileSize[1]);
  const fontsize1 = 12;
  const font1 = fontsize1 + 'px Arial';
  const errorTextWidth = ctx.measureText(errorText).width;
  const xOffset = ctx.canvas.width / 2 - errorTextWidth / 2;
  const yOffset = ctx.canvas.height / 2 - fontsize1 / 2;

  ctx.save();
  ctx.globalAlpha = 0.8;

  // Tile shape
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#f29a94';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  // Text
  ctx.beginPath();
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 5;
  ctx.font = font1;
  ctx.strokeText([errorText], xOffset, yOffset);
  ctx.fillText([errorText], xOffset, yOffset);
  ctx.restore();

  image.src = ctx.canvas.toDataURL();
}

/**
 * @param {XyzLayer} layerSpec
 * @param {FrameState} rootFrameState
 * @return {Observable<LayerPrintStatus>}
 */
function createLayerXYZ(layerSpec, rootFrameState) {
  return createTiledLayer(
    new XYZ({
      crossOrigin: 'anonymous',
      url: layerSpec.url,
      transition: 0,
    }),
    rootFrameState,
    layerSpec.opacity,
    layerSpec.debug
  );
}

/**
 * @param {WmsLayer} layerSpec
 * @param {FrameState} rootFrameState
 * @return {Observable<LayerPrintStatus>}
 */
function createLayerWMS(layerSpec, rootFrameState) {
  if (layerSpec.tiled) {
    return createTiledLayer(
      new TileWMS({
        crossOrigin: 'anonymous',
        url: layerSpec.url,
        params: { LAYERS: layerSpec.layer, TILED: true },
        transition: 0,
      }),
      rootFrameState,
      layerSpec.opacity,
      layerSpec.debug
    );
  }

  const width = rootFrameState.size[0];
  const height = rootFrameState.size[1];
  const context = createCanvasContext2D(width, height);
  context.canvas.style = {};
  let frameState;
  let layer;
  let renderer;

  layer = new ImageLayer({
    transition: 0,
    source: new ImageWMS({
      crossOrigin: 'anonymous',
      url: layerSpec.url,
      params: { LAYERS: layerSpec.layer },
      ratio: 1,
    }),
  });
  layer.getSource().setImageLoadFunction(function (layerImage, src) {
    const image = layerImage.getImage();
    if (isWorker()) {
      image.hintImageSize(width, height);
    }

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.addEventListener('loadend', function () {
      var data = this.response;
      if (this.status === 0 || this.status >= 400) {
        if (layerSpec.debug) {
          // create one error tile for entire WMS response
          createErrorTile(image, [width, height], this.status);
        }
      } else {
        if (data !== undefined) {
          image.src = URL.createObjectURL(data);
        }
      }
    });
    xhr.open('GET', src);
    xhr.send();
  });

  frameState = {
    ...rootFrameState,
    layerStatesArray: [
      {
        layer,
        managed: true,
        maxResolution: null,
        maxZoom: null,
        minResolution: 0,
        minZoom: null,
        opacity: layerSpec.opacity !== undefined ? layerSpec.opacity : 1,
        sourceState: 'ready',
        visible: true,
        zIndex: 0,
      },
    ],
  };

  renderer = layer.getRenderer();
  renderer.useContainer = function () {
    this.containerReused = false;
    this.canvas = context.canvas;
    this.context = context;
    this.container = {
      firstElementChild: context.canvas,
    };
  };

  const progress$ = new BehaviorSubject([0, null]);
  layer.getSource().once('imageloadend', () => {
    renderer.prepareFrame({ ...frameState, time: Date.now() });
    renderer.renderFrame({ ...frameState, time: Date.now() }, context.canvas);
    progress$.next([1, context.canvas]);
    progress$.complete();
  });
  renderer.prepareFrame({ ...frameState, time: Date.now() });

  return progress$;
}
