const BingMapsJSONSpec = {
  layers: [
    {
      type: 'BingMaps',
      imagerySet: 'Road',
      apiKey: '{can be generated here : https://www.bingmapsportal.com/}',
      attribution: '© Microsoft Corporation',
    },
  ],
  size: [400, 240, 'mm'],
  center: [3, 46.5],
  dpi: 120,
  scale: 7000000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

const OsmAndGeoJSONSpec = {
  layers: [
    {
      type: 'XYZ',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap (www.openstreetmap.org)',
    },
    {
      type: 'GeoJSON',
      attribution: '',
      style: {
        name: 'Demo Style',
        rules: [
          {
            name: 'Rule 1',
            symbolizers: [
              {
                kind: 'Line',
                color: '#140155',
                width: 30,
              },
              {
                kind: 'Line',
                color: '#ffffff',
                width: 18,
              },
              {
                kind: 'Line',
                color: '#d80000',
                width: 6,
              },
            ],
          },
        ],
      },
      geojson: {
        type: 'FeatureCollection',
        name: 'france_3857',
        crs: {
          type: 'name',
          properties: { name: 'urn:ogc:def:crs:EPSG::3857' },
        },
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [6217174, -2414045],
                    [6210048, -2436728],
                    [6159355, -2426204],
                    [6145053, -2396057],
                    [6172342, -2375152],
                    [6195255, -2380625],
                    [6217174, -2414045],
                  ],
                ],
                [
                  [
                    [5047139, -1427109],
                    [5036007, -1465841],
                    [5011856, -1450925],
                    [5021517, -1423292],
                    [5047139, -1427109],
                  ],
                ],
                [
                  [
                    [1040800, 5121087],
                    [1028706, 5082432],
                    [1000448, 5088402],
                    [990010, 5121087],
                    [972280, 5176861],
                    [959570, 5217044],
                    [1047722, 5281129],
                    [1046648, 5139832],
                    [1040800, 5121087],
                  ],
                ],
                [
                  [
                    [647670, 6368072],
                    [656049, 6359607],
                    [708783, 6354906],
                    [729920, 6346294],
                    [748453, 6312074],
                    [790487, 6301373],
                    [808656, 6297595],
                    [820286, 6302302],
                    [849997, 6284021],
                    [880610, 6282528],
                    [898171, 6274745],
                    [916453, 6269191],
                    [886062, 6227245],
                    [855013, 6149762],
                    [843570, 6127074],
                    [843500, 6126117],
                    [843957, 6092648],
                    [840016, 6064300],
                    [844808, 6038894],
                    [841037, 6034717],
                    [836110, 6024498],
                    [821637, 6012857],
                    [793747, 6024573],
                    [772467, 6013155],
                    [763469, 5969414],
                    [763672, 5969123],
                    [719454, 5917809],
                    [683291, 5870171],
                    [675042, 5847303],
                    [681900, 5831332],
                    [663026, 5801543],
                    [687684, 5809500],
                    [694785, 5835581],
                    [719454, 5849852],
                    [759317, 5849067],
                    [784233, 5767925],
                    [757236, 5744934],
                    [790894, 5695574],
                    [793829, 5663665],
                    [738054, 5638833],
                    [786556, 5576525],
                    [773497, 5567330],
                    [766705, 5521523],
                    [858745, 5474966],
                    [838217, 5432078],
                    [828133, 5426684],
                    [827923, 5427087],
                    [825204, 5424182],
                    [824909, 5423654],
                    [825396, 5423225],
                    [771592, 5385360],
                    [719454, 5335851],
                    [631391, 5339298],
                    [470913, 5382281],
                    [456531, 5396788],
                    [396641, 5364020],
                    [379266, 5354536],
                    [360733, 5344429],
                    [338790, 5287372],
                    [339783, 5264793],
                    [353418, 5226421],
                    [192695, 5235027],
                    [192115, 5236838],
                    [198828, 5247302],
                    [160586, 5251839],
                    [148033, 5266407],
                    [95536, 5285485],
                    [82967, 5273832],
                    [73485, 5265049],
                    [53183, 5266423],
                    [-34881, 5289072],
                    [-80651, 5299827],
                    [-160175, 5351316],
                    [-192461, 5357149],
                    [-196968, 5363053],
                    [-198814, 5365471],
                    [-169735, 5392932],
                    [-139604, 5538098],
                    [-126830, 5686798],
                    [-79574, 5673366],
                    [-127330, 5747633],
                    [-129411, 5832452],
                    [-198803, 5865351],
                    [-210758, 5884561],
                    [-224402, 5906535],
                    [-220464, 5946763],
                    [-273676, 6015509],
                    [-310167, 6034563],
                    [-344151, 6014802],
                    [-375585, 6058589],
                    [-392179, 6081795],
                    [-481471, 6087134],
                    [-485829, 6133183],
                    [-518667, 6172533],
                    [-493611, 6210691],
                    [-407335, 6217269],
                    [-375585, 6229287],
                    [-347549, 6239913],
                    [-310167, 6204722],
                    [-216856, 6196985],
                    [-174894, 6211722],
                    [-196072, 6362875],
                    [-156970, 6378898],
                    [-124632, 6329721],
                    [33087, 6348124],
                    [71723, 6350382],
                    [76931, 6361385],
                    [82967, 6363274],
                    [82967, 6363710],
                    [82967, 6364146],
                    [12993, 6366828],
                    [30251, 6399769],
                    [82967, 6423939],
                    [153581, 6457561],
                    [183091, 6507184],
                    [175715, 6548992],
                    [183364, 6597111],
                    [230174, 6622466],
                    [283421, 6637120],
                    [290214, 6605864],
                    [318738, 6569864],
                    [319503, 6568907],
                    [321312, 6569400],
                    [322871, 6567215],
                    [323854, 6567425],
                    [324123, 6568943],
                    [325309, 6568889],
                    [326172, 6570447],
                    [326228, 6573012],
                    [326962, 6573679],
                    [327743, 6574030],
                    [327056, 6575465],
                    [327291, 6576372],
                    [329130, 6577707],
                    [329969, 6577183],
                    [330865, 6577227],
                    [332096, 6578452],
                    [334615, 6580020],
                    [335206, 6580745],
                    [335616, 6581339],
                    [336041, 6581332],
                    [344921, 6582297],
                    [361264, 6570685],
                    [377343, 6541249],
                    [402429, 6531641],
                    [406930, 6526628],
                    [416409, 6508515],
                    [448370, 6508565],
                    [460958, 6442598],
                    [471230, 6438976],
                    [493423, 6436171],
                    [533531, 6471773],
                    [553195, 6412026],
                    [573712, 6397568],
                    [600403, 6380228],
                    [609016, 6359657],
                    [638368, 6367966],
                    [647670, 6368072],
                  ],
                ],
                [
                  [
                    [-6076696, 258563],
                    [-6047547, 288195],
                    [-6013069, 396472],
                    [-6059709, 488729],
                    [-6044429, 583714],
                    [-6011881, 624668],
                    [-5994749, 635004],
                    [-5907279, 610351],
                    [-5868972, 583714],
                    [-5771637, 514462],
                    [-5750260, 451888],
                    [-5847524, 288195],
                    [-5896145, 246338],
                    [-5982217, 255610],
                    [-6031339, 238040],
                    [-6076696, 258563],
                  ],
                ],
                [
                  [
                    [-6767970, 1632250],
                    [-6784752, 1623968],
                    [-6812277, 1663231],
                    [-6775971, 1665973],
                    [-6767970, 1632250],
                  ],
                ],
                [
                  [
                    [-6798832, 1798947],
                    [-6823533, 1776027],
                    [-6841210, 1798947],
                    [-6822666, 1820201],
                    [-6798832, 1798947],
                  ],
                ],
                [
                  [
                    [-6853252, 1822305],
                    [-6870873, 1800196],
                    [-6884078, 1837025],
                    [-6850989, 1849908],
                    [-6841291, 1868491],
                    [-6822651, 1838819],
                    [-6853252, 1822305],
                  ],
                ],
              ],
            },
          },
        ],
      },
    },
  ],
  size: [400, 240, 'mm'],
  center: [3, 46.5],
  dpi: 120,
  scale: 7000000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

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
      attribution: '© OpenStreetMap (www.openstreetmap.org), terrestris GmbH',
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

const IgnOrthoWmtsSpec = {
  layers: [
    {
      type: 'WMTS',
      url: 'https://data.geopf.fr/wmts?',
      layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
      matrixSet: 'PM',
      projection: 'EPSG:3857',
      format: 'image/jpeg',
      style: 'normal',
      tileGrid: {
        matrixIds: [
          '0',
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          '10',
          '11',
          '12',
          '13',
          '14',
          '15',
          '16',
          '17',
          '18',
          '19',
          '20',
          '21',
        ],
        resolutions: [
          156543.03392811998, 78271.51696391999, 39135.758481959994,
          19567.879241008, 9783.939620504, 4891.969810252, 2445.984905126,
          1222.9924525615997, 611.4962262807999, 305.74811314039994,
          152.87405657047998, 76.43702828523999, 38.21851414248,
          19.109257071295996, 9.554628535647998, 4.777314267823999,
          2.3886571339119995, 1.1943285669559998, 0.5971642834779999,
          0.2985821417376, 0.14929107086935997, 0.07464553543467999,
        ],
        tileSize: 256,
      },
      attribution:
        "© IGN – Institut national de l'information géographique et forestière",
    },
  ],
  size: [240, 280, 'mm'],
  center: [2.5, 46.5],
  dpi: 120,
  scale: 7000000,
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
      url: 'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
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
      url: 'https://mars.nasa.gov/mmgis-maps/M20/Layers/Jezero_Balanced_Visible_HiRISE_HRSCcolor_IHS_pansharp/{z}/{x}/{-y}.png',
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
      url: 'https://sextant.ifremer.fr/geowebcache/service/wmts?layer=SXT_PHOTOANCIENNE_BAYONNE&style=&tilematrixset=EPSG%3A3857&Service=WMTS',
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
          156543.03392811998, 78271.51696391999, 39135.758481959994,
          19567.879241008, 9783.939620504, 4891.969810252, 2445.984905126,
          1222.9924525615997, 611.4962262807999, 305.74811314039994,
          152.87405657047998, 76.43702828523999, 38.21851414248,
          19.109257071295996, 9.554628535647998, 4.777314267823999,
          2.3886571339119995, 1.1943285669559998, 0.5971642834779999,
          0.2985821417376, 0.14929107086935997, 0.07464553543467999,
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

export const MapboxVectorStyleSpec = {
  layers: [
    {
      type: 'VectorTile',
      styleUrl:
        'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/resources/styles/root.json',
      attribution: '© ESRI',
    },
  ],
  size: [400, 240, 'mm'],
  center: [12, 48],
  dpi: 120,
  scale: 10000000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

const CustomProjection = {
  layers: [
    {
      type: 'WMS',
      url: 'https://data.geopf.fr/wms-r/wms',
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

const LegendSpec = {
  layers: [
    {
      type: 'WMS',
      url: 'https://ows.terrestris.de/osm/service',
      layer: 'OSM-WMS',
      tiled: true,
      legend: true,
      attribution: '© OpenStreetMap (www.openstreetmap.org), terrestris GmbH',
    },
    {
      type: 'WFS',
      url: 'https://ows-demo.terrestris.de/geoserver/osm/wfs?maxFeatures=50',
      layer: 'osm:osm-fuel',
      format: 'geojson',
      version: '1.1.0',
      legend: true,
      style: {
        name: 'WFS Style',
        rules: [
          {
            name: 'Simple symbol',
            symbolizers: [
              {
                kind: 'Mark',
                wellKnownName: 'x',
                opacity: 0.7,
                radius: 10,
                color: '#ff0000',
              },
            ],
          },
        ],
      },
    },
    OsmAndGeoJSONSpec.layers[1],
  ],
  size: [400, 300, 'mm'],
  center: [3, 46.5],
  dpi: 72,
  scale: 7000000,
  scaleBar: {
    position: 'bottom-left',
    units: 'metric',
  },
  projection: 'EPSG:3857',
  northArrow: 'top-right',
  attributions: 'bottom-right',
};

export const ErrorSpec = {
  layers: [
    {
      type: 'WMS',
      url: 'https://ows.mundialis.de/services/service',
      layer: 'TOPO-OSM-WMS',
      tiled: true,
      attribution: '© OpenStreetMap, Natural Earth, terrestris GmbH',
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
  'France in OpenStreetMap and GeoJSON': OsmAndGeoJSONSpec,
  'France in IGN orthophotos (WMTS)': IgnOrthoWmtsSpec,
  'Volcanoes Terrain model (WMS)': AuvergneTerrainSpec,
  'Mars Perseverance Rover Landing Site': MarsRoverLandingSpec,
  'Bayonne, 1935 (WMTS)': BayonneWmtsSpec,
  'North pole, arctic projection (WMS)': PolarProjectionSpec,
  'Water areas geometries (WFS)': WfsSpec,
  'Europe as vector tiles (Mapbox Style)': MapboxVectorStyleSpec,
  'Custom local projection (WMS)': CustomProjection,
  'Spec with legends': LegendSpec,
  'Spec with invalid sources': ErrorSpec,
};

export default PresetSpecs;
