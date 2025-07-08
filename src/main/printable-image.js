import { pixelToRealWorld } from '../shared/units.js';

export class PrintableImage {
  /**
   * @param {HTMLImageElement|HTMLCanvasElement} image
   * @param {number} dpi
   */
  constructor(image, dpi) {
    this.image_ = image;
    this.dpi_ = dpi;
  }

  /**
   * Returns the native image to be drawn or printed.
   * @returns {HTMLImageElement|HTMLCanvasElement}
   */
  getImage() {
    return this.image_;
  }

  /**
   * Returns the real world dimensions of the image for a given unit (e.g. `mm`).
   * @param {import("./index").RealWorldUnit} unit
   * @returns {[number, number]}
   */
  getRealWorldDimensions(unit) {
    return [
      pixelToRealWorld(this.image_.width, unit, this.dpi_),
      pixelToRealWorld(this.image_.height, unit, this.dpi_),
    ];
  }

  /**
   * Returns the image DPI.
   * @returns {number}
   */
  getDpi() {
    return this.dpi_;
  }
}
