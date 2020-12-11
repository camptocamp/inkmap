import { BehaviorSubject, of } from 'rxjs';
import { createJob } from '../../../src/printer/job';
import * as LayersMock from '../../../src/printer/layers';
import { messageToMain } from '../../../src/printer/exchange';
import * as UtilsMock from '../../../src/printer/utils';
import { MESSAGE_JOB_STATUS } from '../../../src/shared/constants';
import * as olDomMock from 'ol/dom';

jest.mock('../../../src/printer/layers');
jest.mock('../../../src/printer/exchange');
jest.mock('../../../src/printer/utils');
jest.mock('ol/dom');

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
  size: [8, 4, "cm"],
  center: [12, 48],
  dpi: 200,
  scale: 40000000,
  projection: 'EPSG:3857',
};

let layerSubjects;

LayersMock.createLayer = jest.fn(() => {
  const layer$ = new BehaviorSubject([0, null, []]);
  layerSubjects.push(layer$);
  return layer$;
});

UtilsMock.canvasToBlob = jest.fn(() => of({ blob: true }));

olDomMock.createCanvasContext2D = jest.fn(() => {
  return {
    drawImage: jest.fn()
  };
})

describe('job creation', () => {
  beforeEach(() => {
    layerSubjects = [];
    jest.clearAllMocks();
    createJob(spec);
  });

  it('creates the correct amount of layers', () => {
    expect(LayersMock.createLayer).toHaveBeenCalledTimes(3);
  });
  it('creates the correct canvas size from cm', () => {
    expect(olDomMock.createCanvasContext2D).toHaveBeenLastCalledWith(630, 315);
  });
  it('broadcasts initial status to the main thread', () => {
    expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
      status: {
        id: expect.any(Number),
        imageBlob: null,
        progress: 0,
        spec,
        status: 'ongoing',
        errors: []
      },
    });
  });
  it('broadcast advancement status', () => {
    layerSubjects[0].next([0.1, null, []]);
    layerSubjects[1].next([0.9, null, []]);
    layerSubjects[2].next([0.2, null, []]);
    expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
      status: {
        id: expect.any(Number),
        imageBlob: null,
        progress: 0.4,
        spec,
        status: 'ongoing',
        errors: []
      },
    });
  });
  it('prints all layers to a final canvas when finished', () => {
    layerSubjects[0].next([1, { style: {} }, []]);
    layerSubjects[1].next([1, { style: {} }, []]);
    layerSubjects[2].next([1, { style: {} }, []]);
    expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
      status: {
        id: expect.any(Number),
        imageBlob: { blob: true },
        progress: 1,
        spec,
        status: 'finished',
        errors: []
      },
    });
  });
});
