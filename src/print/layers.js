import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import ImageWMS from 'ol/source/ImageWMS'
import ImageLayer from 'ol/layer/Image'
import {createCanvasContext2D} from 'ol/dom'
import {BehaviorSubject, interval} from 'rxjs'
import {map, takeWhile, throttleTime} from 'rxjs/operators'
import {isWorker} from '../worker/utils'

const update$ = interval(100)

export function createLayer(layerSpec, rootFrameState) {
  switch (layerSpec.type) {
    case 'XYZ':
      return createLayerXYZ(layerSpec, rootFrameState)
    case 'WMS':
      return createLayerWMS(layerSpec, rootFrameState)
  }
}

function createLayerXYZ(layerSpec, rootFrameState) {
  const width = rootFrameState.size[0]
  const height = rootFrameState.size[1]
  const context = createCanvasContext2D(width, height)
  context.canvas.style = {}
  let frameState
  let layer
  let renderer

  layer = new TileLayer({
    transition: 0,
    source: new XYZ({
      crossOrigin: 'anonymous',
      url: layerSpec.url,
      transition: 0
    })
  })
  layer.getSource().setTileLoadFunction(
    function (tile, src) {
      const image = tile.getImage()
      if (!isWorker()) {
        image.src = src
        return
      }
      fetch(src)
        .then(response => response.blob())
        .then(blob => {
          const tileSize = layer.getSource().getTilePixelSize(0,
            rootFrameState.pixelRatio,
            rootFrameState.viewState.projection
          )
          image.setSize(tileSize[0], tileSize[1])
          const ctx = image.getContext('2d')
          createImageBitmap(blob).then(imageData => {
            ctx.drawImage(imageData, 0, 0)
            image.loaded()
          })
        })
    })

  frameState = {
    ...rootFrameState,
    layerStatesArray: [{
      layer,
      managed: true,
      maxResolution: null,
      maxZoom: null,
      minResolution: 0,
      minZoom: null,
      opacity: layerSpec.opacity !== undefined ? layerSpec.opacity : 1,
      sourceState: 'ready',
      visible: true,
      zIndex: 0
    }]
  }

  renderer = layer.getRenderer()
  renderer.useContainer = function (target, transform) {
    this.containerReused = false
    this.canvas = context.canvas
    this.context = context
    this.container = {
      firstElementChild: context.canvas,
    }
  }

  renderer.renderFrame({...frameState, time: Date.now()}, context.canvas)
  const tileCount = Object.keys(frameState.tileQueue.queuedElements_).length

  return update$.pipe(
    takeWhile(() => {
      renderer.renderFrame({...frameState, time: Date.now()}, context.canvas)
      frameState.tileQueue.reprioritize()
      frameState.tileQueue.loadMoreTiles(8, 2)
      return frameState.tileQueue.getTilesLoading()
    }, true),
    map(() => {
      const progress = 1 - Object.keys(frameState.tileQueue.queuedElements_).length / tileCount
      return progress < 1 ? [progress, null] : [1, context.canvas]
    }),
    throttleTime(500, undefined, { leading: true, trailing: true })
  )
}

function createLayerWMS(layerSpec, rootFrameState) {
  const width = rootFrameState.size[0]
  const height = rootFrameState.size[1]
  const context = createCanvasContext2D(width, height)
  context.canvas.style = {}
  let frameState
  let layer
  let renderer

  layer = new ImageLayer({
    transition: 0,
    source: new ImageWMS({
      crossOrigin: 'anonymous',
      url: layerSpec.url,
      params: {LAYERS: layerSpec.layer},
      ratio: 1
    })
  })
  layer.getSource().setImageLoadFunction(
    function (image, src) {
      if (!isWorker()) {
        image.getImage().src = src
        return
      }
      const layerImage = image
      fetch(src)
        .then(response => response.blob())
        .then(blob => {
          const image = layerImage.getImage()
          if (image.setSize) {
            image.setSize(width, height)
          }
          const ctx = image.getContext('2d')
          createImageBitmap(blob).then(imageData => {
            ctx.drawImage(imageData, 0, 0)
            image.loaded()
          })
        })
    })

  frameState = {
    ...rootFrameState,
    layerStatesArray: [{
      layer,
      managed: true,
      maxResolution: null,
      maxZoom: null,
      minResolution: 0,
      minZoom: null,
      opacity: layerSpec.opacity !== undefined ? layerSpec.opacity : 1,
      sourceState: 'ready',
      visible: true,
      zIndex: 0
    }]
  }

  renderer = layer.getRenderer()
  renderer.useContainer = function (target, transform) {
    this.containerReused = false
    this.canvas = context.canvas
    this.context = context
    this.container = {
      firstElementChild: context.canvas,
    }
  }

  const progress$ = new BehaviorSubject([0, null])
  layer.getSource().once('imageloadend', () => {
    renderer.prepareFrame({...frameState, time: Date.now()})
    renderer.renderFrame({...frameState, time: Date.now()}, context.canvas)
    progress$.next([1, context.canvas])
    progress$.complete()
  })
  renderer.prepareFrame({...frameState, time: Date.now()})

  return progress$
}
