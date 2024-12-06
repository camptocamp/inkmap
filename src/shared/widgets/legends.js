import LegendRenderer from 'geostyler-legend/dist/LegendRenderer/LegendRenderer';
import { PrintableImage } from '../../main/printable-image';

function getLegendRenderer(spec) {
  const wmsLayers =
    /** @type {Array<import("../../main/index.js").WmsLayer>} */ (
      spec.layers.filter((layer) => layer.type === 'WMS')
    );
  const vectorLayers =
    /** @type {Array<import("../../main/index.js").WfsLayer|import("../../main/index.js").GeoJSONLayer>} */ (
      spec.layers.filter(
        (layer) => layer.type === 'WFS' || layer.type === 'GeoJSON'
      )
    );
  const vectorLayerStyles = vectorLayers.map((layer) => layer.style);
  const remoteLegends = [];

  wmsLayers.forEach((layer) => {
    const url = new URL(layer.url);
    url.searchParams.set('REQUEST', 'GetLegendGraphic');
    url.searchParams.set('SERVICE', 'WMS');
    url.searchParams.set('VERSION', layer.version || '1.3.0');
    url.searchParams.set('LAYER', layer.layer);
    url.searchParams.set('FORMAT', 'image/png');
    url.searchParams.set(
      'DPI',
      (spec.dpi || (layer.version === '1.1.1' ? 72 : 91)).toString()
    );

    if (spec.scale) {
      url.searchParams.set('SCALE', spec.scale.toString());
    }

    remoteLegends.push({
      url: url.toString(),
      title: layer.layer,
    });
  });

  return new LegendRenderer({
    maxColumnWidth: 290,
    maxColumnHeight: 840,
    overflow: 'auto',
    styles: vectorLayerStyles,
    remoteLegends: remoteLegends,
    size: [595, 842],
  });
}

/**
 * Returns an SVG fragment containing legends for all layers
 * that have a legend configured by the given spec.
 * @param {import("../../main/index.js").PrintSpec} spec
 * @return {Promise<Blob>}
 */
export async function getLegendAsSvg(spec) {
  const renderer = getLegendRenderer(spec);
  const svgParent = await renderer.renderAsImage('svg');
  let svgString = svgParent.outerHTML;
  return new Blob([svgString], { type: 'image/svg+xml' });
}

/**
 * Returns a `PrintableImage` containing legends for all layers
 * that have a legend configured by the given spec.
 * @param {import("../../main/index.js").PrintSpec} spec
 * @return {Promise<PrintableImage>}
 */
export async function getPrintableLegend(spec) {
  const renderer = getLegendRenderer(spec);
  const canvas = /** @type {HTMLCanvasElement} */ (
    await renderer.renderAsImage('png')
  );
  return new PrintableImage(canvas, spec.dpi);
}
