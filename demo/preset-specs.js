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

const PresetSpecs = {
  'OpenStreetMap layer': OsmSpec,
  'Tiled WMS layer': TiledWmsSpec,
};

export default PresetSpecs;
