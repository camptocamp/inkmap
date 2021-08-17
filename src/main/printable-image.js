import { CM_PER_INCH } from '../shared/constants';

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
   * @param {string} unit
   * @returns {[number, number]}
   */
  getRealWorldDimensions(unit) {
    let ratio = 1;
    switch (unit) {
      case 'in':
        ratio = 1 / this.dpi_;
        break;
      case 'cm':
        ratio = CM_PER_INCH / this.dpi_;
        break;
      case 'mm':
        ratio = (CM_PER_INCH * 10) / this.dpi_;
        break;
      case 'm':
        ratio = CM_PER_INCH / 100 / this.dpi_;
        break;
      default:
        throw new Error(`Invalid real world unit: ${unit}`);
    }
    return [this.image_.width * ratio, this.image_.height * ratio];
  }

  /**
   * Returns the image DPI.
   * @returns {number}
   */
  getDpi() {
    return this.dpi_;
  }
}
