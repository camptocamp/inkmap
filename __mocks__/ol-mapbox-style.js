import VectorTileSourceMock from './ol/source/VectorTile.js';

export const applyStyle = jest.fn((layer) => {
  layer.setSource(new VectorTileSourceMock())
})
