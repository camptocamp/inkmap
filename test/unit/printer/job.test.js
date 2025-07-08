import { BehaviorSubject, of } from 'rxjs';
import { createJob } from '../../../src/printer/job.js';
import * as LayersMock from '../../../src/printer/layers.js';
import { messageToMain } from '../../../src/printer/exchange.js';
import { MESSAGE_JOB_STATUS } from '../../../src/shared/constants.js';
import * as olDomMock from 'ol/dom';

jest.mock('../../../src/printer/layers');
jest.mock('../../../src/printer/exchange');
jest.mock('../../../src/printer/utils', () => ({
  ...jest.requireActual('../../../src/printer/utils'),
  canvasToBlob: jest.fn(() => mockCanvasToBlob()),
}));
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
  size: [8, 4, 'cm'],
  center: [12, 48],
  dpi: 200,
  scale: 40000000,
  projection: 'EPSG:3857',
};
const errorurl = 'https://my.url/z/y/x.png';
let layerSubjects;

LayersMock.createLayer = jest.fn(() => {
  const layer$ = new BehaviorSubject([0, null, undefined]);
  layerSubjects.push(layer$);
  return layer$;
});

const mockCanvasToBlob = () => of({ blob: true });

olDomMock.createCanvasContext2D = jest.fn(() => {
  return {
    drawImage: jest.fn(),
  };
});

describe('job creation', () => {
  beforeEach(() => {
    layerSubjects = [];
    jest.clearAllMocks();
  });

  describe('with 3 layers', () => {
    beforeEach(() => {
      createJob(spec);
    });

    it('creates the correct amount of layers', () => {
      expect(LayersMock.createLayer).toHaveBeenCalledTimes(3);
    });
    it('creates the correct canvas size from cm', () => {
      expect(olDomMock.createCanvasContext2D).toHaveBeenLastCalledWith(
        630,
        315,
      );
    });
    it('broadcasts initial status to the main thread', () => {
      expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
        status: {
          id: expect.any(Number),
          imageBlob: null,
          progress: 0,
          spec,
          status: 'ongoing',
          sourceLoadErrors: [],
        },
      });
    });
    it('broadcast advancement status', () => {
      layerSubjects[0].next([0.1, null, undefined]);
      layerSubjects[1].next([0.9, null, undefined]);
      layerSubjects[2].next([0.2, null, undefined]);
      expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
        status: {
          id: expect.any(Number),
          imageBlob: null,
          progress: 0.4,
          spec,
          status: 'ongoing',
          sourceLoadErrors: [],
        },
      });
    });
    it('prints all layers to a final canvas and passes errorurls to status when finished', () => {
      layerSubjects[0].next([1, { style: {} }, errorurl]);
      layerSubjects[1].next([1, { style: {} }]);
      layerSubjects[2].next([1, { style: {} }]);
      expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
        status: {
          id: expect.any(Number),
          imageBlob: { blob: true },
          progress: 1,
          spec,
          status: 'finished',
          sourceLoadErrors: [
            {
              url: errorurl,
            },
          ],
        },
      });
    });
  });

  describe('with 100 layers', () => {
    beforeEach(() => {
      const layers = new Array(100).fill(0).map((v, i) => ({
        type: 'XYZ',
        url: `https://my.url-${i}/z/y/x.png`,
      }));
      createJob({ ...spec, layers });
    });

    it('does not broadcast a print success if all layers except one are complete', () => {
      layerSubjects.forEach((subject, index) =>
        subject.next(index > 0 ? [1, { style: {} }] : [0.999, null, undefined]),
      );
      expect(messageToMain).toHaveBeenLastCalledWith(MESSAGE_JOB_STATUS, {
        status: {
          id: expect.any(Number),
          imageBlob: null,
          progress: 0.999,
          spec: expect.any(Object),
          status: 'ongoing',
          sourceLoadErrors: [],
        },
      });
    });
  });
});
