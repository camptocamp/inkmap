import { BehaviorSubject, of } from 'rxjs';
import { createJob } from '../../../src/printer/job';
import * as LayersMock from '../../../src/printer/layers';
import { messageToMain } from '../../../src/printer/exchange';
import * as UtilsMock from '../../../src/printer/utils';
import { MESSAGE_JOB_STATUS } from '../../../src/shared/constants';

jest.mock('../../src/printer/layers');
jest.mock('../../src/printer/exchange');
jest.mock('../../src/printer/utils');

const spec = {
  layers: [
    {
      type: 'XYZ',
      url: 'https://my.url/z/y/x.png',
    },
    {
      type: 'XYZ',
      url: 'https://my.url2/z/y/x.png',
    },
    {
      type: 'WMS',
      url: 'https://my.url/wms',
      layer: 'SOME_LAYER',
      opacity: 0.4,
    },
  ],
  size: [800, 400],
  center: [12, 48],
  dpi: 200,
  scale: 40000000,
  projection: 'EPSG:3857',
};

let layerSubjects;

LayersMock.createLayer = jest.fn(() => {
  const layer$ = new BehaviorSubject([0, null]);
  layerSubjects.push(layer$);
  return layer$;
});

UtilsMock.canvasToBlob = jest.fn(() => of({ blob: true }));

describe('job creation', () => {
  beforeEach(() => {
    layerSubjects = [];
    jest.clearAllMocks();
    createJob(spec);
  });

  it('creates the correct amount of layers', () => {
    expect(LayersMock.createLayer).toHaveBeenCalledTimes(3);
  });
  it('broadcasts initial status to the main thread', () => {
    expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
      status: {
        id: expect.any(Number),
        imageBlob: null,
        progress: 0,
        spec,
        status: 'ongoing',
      },
    });
  });
  it('broadcast advancement status', () => {
    layerSubjects[0].next([0.1, null]);
    layerSubjects[1].next([0.9, null]);
    layerSubjects[2].next([0.2, null]);
    expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
      status: {
        id: expect.any(Number),
        imageBlob: null,
        progress: 0.4,
        spec,
        status: 'ongoing',
      },
    });
  });
  it('prints all layers to a final canvas when finished', () => {
    layerSubjects[0].next([1, { style: {} }]);
    layerSubjects[1].next([1, { style: {} }]);
    layerSubjects[2].next([1, { style: {} }]);
    expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
      status: {
        id: expect.any(Number),
        imageBlob: { blob: true },
        progress: 1,
        spec,
        status: 'finished',
      },
    });
  });
});
