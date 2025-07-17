import { applyTransform } from 'ol/extent';
import { get as getProjection, getTransform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';

register(proj4);

/**
 * @param {string} name Projection name written as `prefix:code`.
 * @param {string} proj4def Proj4 definition.
 * @param {[number, number, number, number]} bbox Projection validity extent.
 */
export function registerWithExtent(name, proj4def, bbox) {
  proj4.defs(name, proj4def);
  register(proj4);

  const newProj = getProjection(name);
  const fromLonLat = getTransform('EPSG:4326', newProj);

  let worldExtent = [bbox[1], bbox[2], bbox[3], bbox[0]];
  newProj.setWorldExtent(worldExtent);

  // approximate calculation of projection extent,
  // checking if the world extent crosses the dateline
  if (bbox[1] > bbox[3]) {
    worldExtent = [bbox[1], bbox[2], bbox[3] + 360, bbox[0]];
  }
  var extent = applyTransform(worldExtent, fromLonLat, undefined, 8);
  newProj.setExtent(extent);
}
