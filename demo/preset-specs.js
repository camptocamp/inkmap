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

export const WfsSpec = {
  layers: [
    {
      type: 'XYZ',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
    {
      type: 'WFS',
      url: 'https://ahocevar.com/geoserver/wfs',
      layer: 'osm:water_areas',
      format: 'geojson',
      version: '1.1.0',
    },
  ],
  size: [800, 600],
  center: [-81, 43],
  dpi: 200,
  scale: 400000,
  scaleBar: { position: 'bottom-right', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
};

const DownloadedProjection = {
  layers: [
    {
      type: 'WMS',
      url: 'https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/r/wms',
      layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      tiled: false,
    },
  ],
  size: [600, 400],
  center: [4, 47],
  dpi: 200,
  scale: 10000000,
  projection: 'EPSG:2154',
};

const CustomProjection = {
  layers: [
    {
      type: 'WMS',
      url: 'https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/r/wms',
      layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      tiled: true,
    },
  ],
  size: [600, 400],
  center: [4, 47],
  dpi: 200,
  scale: 10000000,
  projection: 'EPSG:3947',
  projectionDefinitions: [
    {
      name: 'EPSG:3947',
      bbox: [48.0, -4.77, 46.0, 7.63], // [maxlat, minlon, minlat, maxlon]
      proj4:
        '+proj=lcc +lat_1=46.25 +lat_2=47.75 +lat_0=47 +lon_0=3 +x_0=1700000 +y_0=6200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    },
  ],
};

export const ErrorSpec = {
  layers: [
    {
      type: 'WMS',
      url: 'https://ows.mundialis.de/services/service',
      layer: 'TOPO-OSM-WMS',
      tiled: true,
    },
    {
      type: 'WMS',
      url: 'https://wrong.tiled.wms.url/services/service',
      layer: 'TOPO-OSM-WMS',
      tiled: true,
    },
    {
      type: 'WMS',
      url: 'https://wrong.wms.url/services/service',
      layer: 'TOPO-OSM-WMS',
      tiled: false,
    },
    {
      type: 'XYZ',
      url: 'https://wrong.xyz.url/osm-tiles/{z}/{x}/{y}.png',
    },
  ],
  size: [256, 256],
  center: [12, 48],
  dpi: 50,
  scale: 40000000,
  scaleBar: { position: 'bottom-right', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
};

const PresetSpecs = {
  'OpenStreetMap layer': OsmSpec,
  'Tiled WMS layer': TiledWmsSpec,
  'WMTS layer': WmtsSpec,
  'WFS layer': WfsSpec,
  'Downloaded projection': DownloadedProjection,
  'Custom projection': CustomProjection,
  'Error layers': ErrorSpec,
};

export default PresetSpecs;
