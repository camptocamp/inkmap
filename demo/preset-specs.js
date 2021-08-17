const OsmSpec = {
  layers: [
    {
      type: 'XYZ',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap (www.openstreetmap.org)',
    },
  ],
  size: [400, 240, 'mm'],
  center: [12, 56],
  dpi: 120,
  scale: 20000000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

const OsmWmsSpec = {
  layers: [
    {
      type: 'WMS',
      url: 'https://ows.mundialis.de/services/service',
      layer: 'OSM-WMS',
      tiled: true,
      attribution: '© OpenStreetMap (www.openstreetmap.org), Terrestris GmbH',
    },
  ],
  size: [400, 240, 'mm'],
  center: [12, 56],
  dpi: 120,
  scale: 20000000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

const AuvergneTerrainSpec = {
  layers: [
    {
      type: 'WMS',
      url: 'http://tiles.craig.fr/mnt/service',
      layer: 'relief',
      attribution: '© CRAIG (craig.fr)',
    },
  ],
  size: [20, 20, 'cm'],
  center: [2.959, 45.768],
  dpi: 200,
  scale: 150000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

const PolarProjectionSpec = {
  layers: [
    {
      type: 'XYZ',
      url:
        'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      attribution:
        '© GEBCO, National Oceanic and Atmospheric Administration (NOAA), Esri',
    },
  ],
  size: [30, 30, 'cm'],
  center: [0, 89],
  dpi: 200,
  scale: 20000000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3413',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

// Mars perseverance landing site
const MarsRoverLandingSpec = {
  layers: [
    {
      type: 'XYZ',
      url:
        'https://mars.nasa.gov/mmgis-maps/M20/Layers/Jezero_Balanced_Visible_HiRISE_HRSCcolor_IHS_pansharp/{z}/{x}/{-y}.png',
      attribution: '© NASA/JPL-Caltech',
    },
  ],
  size: [20, 20, 'cm'],
  center: [77.451, 18.444],
  dpi: 200,
  scale: 180000,
  scaleBar: { position: 'bottom-left', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

export const BayonneWmtsSpec = {
  layers: [
    {
      type: 'WMTS',
      url:
        'https://sextant.ifremer.fr/geowebcache/service/wmts?layer=SXT_PHOTOANCIENNE_BAYONNE&style=&tilematrixset=EPSG%3A3857&Service=WMTS',
      layer: 'SXT_PHOTOANCIENNE_BAYONNE',
      matrixSet: 'EPSG:3857',
      projection: 'EPSG:3857',
      format: 'image/png',
      style: '',
      tileGrid: {
        matrixIds: [
          'EPSG:3857:0',
          'EPSG:3857:1',
          'EPSG:3857:2',
          'EPSG:3857:3',
          'EPSG:3857:4',
          'EPSG:3857:5',
          'EPSG:3857:6',
          'EPSG:3857:7',
          'EPSG:3857:8',
          'EPSG:3857:9',
          'EPSG:3857:10',
          'EPSG:3857:11',
          'EPSG:3857:12',
          'EPSG:3857:13',
          'EPSG:3857:14',
          'EPSG:3857:15',
          'EPSG:3857:16',
          'EPSG:3857:17',
          'EPSG:3857:18',
        ],
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
      attribution: '© SHOM, Ifremer, Phototèque nationale',
    },
  ],
  size: [240, 280, 'mm'],
  center: [-1.473, 43.499],
  dpi: 120,
  scale: 15000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

export const WfsSpec = {
  layers: [
    {
      type: 'XYZ',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap (www.openstreetmap.org)',
    },
    {
      type: 'WFS',
      url: 'https://ahocevar.com/geoserver/wfs',
      layer: 'osm:water_areas',
      format: 'geojson',
      version: '1.1.0',
      style: {
        name: 'Demo Style',
        rules: [
          {
            name: 'Rule 1',
            symbolizers: [
              {
                kind: 'Line',
                color: '#2e37c5',
                width: 3,
                opacity: 0.7,
              },
            ],
          },
        ],
      },
    },
  ],
  size: [800, 600],
  center: [-81, 43],
  dpi: 70,
  scale: 400000,
  scaleBar: { position: 'bottom-left', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

const CustomProjection = {
  layers: [
    {
      type: 'WMS',
      url: 'https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/r/wms',
      layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      tiled: true,
      attribution: '© IGN',
    },
  ],
  size: [1800, 1200],
  center: [4, 47],
  dpi: 200,
  scale: 2500000,
  projection: 'EPSG:3947',
  projectionDefinitions: [
    {
      name: 'EPSG:3947',
      bbox: [48.0, -4.77, 46.0, 7.63], // [maxlat, minlon, minlat, maxlon]
      proj4:
        '+proj=lcc +lat_1=46.25 +lat_2=47.75 +lat_0=47 +lon_0=3 +x_0=1700000 +y_0=6200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    },
  ],
  attributions: 'bottom-right',
};

export const ErrorSpec = {
  layers: [
    {
      type: 'WMS',
      url: 'https://ows.mundialis.de/services/service',
      layer: 'TOPO-OSM-WMS',
      tiled: true,
      attribution: '© OpenStreetMap, Natural Earth, Terrestris GmbH',
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
  dpi: 25,
  scale: 20000000,
  scaleBar: { position: 'bottom-left', units: 'metric' },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

const PresetSpecs = {
  'Europe in OpenStreetMap': OsmSpec,
  'Europe in OpenStreetMap (WMS, tiled)': OsmWmsSpec,
  'Volcanoes Terrain model (WMS)': AuvergneTerrainSpec,
  'Mars Perseverance Rover Landing Site': MarsRoverLandingSpec,
  'Bayonne, 1935 (WMTS)': BayonneWmtsSpec,
  'North pole, arctic projection (WMS)': PolarProjectionSpec,
  'WFS layer example': WfsSpec,
  'Custom local projection (WMS)': CustomProjection,
  'Spec with invalid sources': ErrorSpec,
};

export default PresetSpecs;
