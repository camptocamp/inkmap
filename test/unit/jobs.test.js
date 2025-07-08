import '../../src/main/index.js'; // this will also initialize all message exchange logic
import { createNewJob } from '../../src/main/jobs.js';
import { combineLatest, of } from 'rxjs';

jest.mock('../../src/printer/utils', () => ({
  ...jest.requireActual('../../src/printer/utils'),
  canvasToBlob: jest.fn(() => mockCanvasToBlob()),
}));

const mockCanvasToBlob = () => of({ blob: true });

/** @type {any} */
const sampleSpec = {
  layers: [],
  dpi: 127,
  scale: 10000,
  projection: 'EPSG:3857',
  center: [4, 40],
  size: [100, 200],
};

const randomSpec = () => ({
  ...sampleSpec,
  scale: Math.ceil(Math.random() * 100000),
});

describe('jobs monitoring and creation', () => {
  beforeEach(() => {});
  describe('createNewJob', () => {
    describe('when starting several jobs at the same time', () => {
      let jobIds, specs;
      beforeEach(async () => {
        jobIds = [];
        specs = [randomSpec(), randomSpec(), randomSpec()];
        jobIds = await combineLatest(specs.map(createNewJob)).toPromise();
      });
      it('returns a different id for each job', () => {
        expect(jobIds).toEqual([0, 1, 2]);
      });
    });
  });
});
