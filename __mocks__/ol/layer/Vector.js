import LayerMock from './base';

export default class VectorLayerMock extends LayerMock {
  _style = undefined
  setStyle(style) { this._style = style }
  getStyle() { return this._style; }
}
