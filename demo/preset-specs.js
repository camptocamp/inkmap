export const TiledWmsSpec = {
  layers: [
    {
      type: 'WMS',
      url: 'https://ows.mundialis.de/services/service',
      layer: 'TOPO-OSM-WMS',
      tiled: true,
    },
  ],
  size: [800, 600],
  center: [12, 48],
  dpi: 200,
  scale: 40000000,
  scaleBar: { position: 'bottom-right', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
};

export const OsmSpec = {
  layers: [
    {
      type: 'XYZ',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
  ],
  size: [800, 600],
  center: [12, 48],
  dpi: 200,
  scale: 40000000,
  scaleBar: { position: 'bottom-right', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
};

export const WmtsSpec = {
  size: [800, 600],
  center: [12, 48],
  dpi: 200,
  scale: 40000000,
  scaleBar: { position: 'bottom-right', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  layers: [
    {
      type: 'WMTS',
      url: 'https://wxs.ign.fr/pratique/geoportail/wmts',
      layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
      matrixSet: 'PM',
      projection: 'EPSG:3857',
      format: 'image/jpeg',
      style: 'normal',
      tileGrid: {
        resolutions: [
          156543.03392811998,
          78271.51696391999,
          39135.758481959994,
          19567.879241008,
          9783.939620504,
          4891.969810252,
          2445.984905126,
          1222.9924525615997,
          611.4962262807999,
          305.74811314039994,
          152.87405657047998,
          76.43702828523999,
          38.21851414248,
          19.109257071295996,
          9.554628535647998,
          4.777314267823999,
          2.3886571339119995,
          1.1943285669559998,
          0.5971642834779999,
          0.2985821417376,
          0.14929107086935997,
          0.07464553543467999,
        ],
        tileSize: 256,
      },
      opacity: 1,
    },
  ],
};

const PresetSpecs = {
  'OpenStreetMap layer': OsmSpec,
  'Tiled WMS layer': TiledWmsSpec,
  'WMTS layer': WmtsSpec,
};

export default PresetSpecs;
