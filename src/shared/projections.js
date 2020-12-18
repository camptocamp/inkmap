import { applyTransform } from 'ol/extent';
import { get as getProjection, getTransform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';

export async function search(query) {
  const response = await fetch('https://epsg.io/?format=json&q=' + query);
  const json = await response.json();

  const results = json['results'];
  if (results && results.length > 0) {
    for (let i = 0, ii = results.length; i < ii; i++) {
      const result = results[i];
      if (result) {
        const code = result['code'];
        const proj4def = result['proj4'];
        const bbox = result['bbox'];
        if (
          code &&
          code.length > 0 &&
          proj4def &&
          proj4def.length > 0 &&
          bbox &&
          bbox.length == 4
        ) {
          return { name: 'EPSG:' + code, proj4def, bbox };
        }
      }
    }
  }
}

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
