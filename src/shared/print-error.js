/**
 * This error class should be used for all print-related errors.
 */
export class PrintError extends Error {
  /**
   * @constructor
   * @param {string} message
   */
  constructor(message) {
    super(message);
  }
}
