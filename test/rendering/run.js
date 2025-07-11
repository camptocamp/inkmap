#!/usr/bin/env node
import fs from 'fs';
import process from 'process';
import path from 'path';
import { promisify } from 'util';
import puppeteer from 'puppeteer';
import webpack from 'webpack';
import config from './webpack.config.js';
import webpackDevServer from 'webpack-dev-server';
import yargs from 'yargs';
import pixelmatch from 'pixelmatch';
import * as png from 'pngjs';
import { hideBin } from 'yargs/helpers';

const options = yargs(hideBin(process.argv))
  .option('fix', {
    describe: 'Write generated images to disk',
    type: 'boolean',
    default: false,
  })
  .option('interactive', {
    describe: 'Disable headless mode and leave the browser running for a while',
    type: 'boolean',
    default: false,
  });

const serverPort = 8888;

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// UTILS

async function getCases() {
  const root = path.resolve(__dirname, 'cases');
  return await promisify(fs.readdir)(root).then((cases) =>
    cases.filter((name) => fs.statSync(path.resolve(root, name)).isDirectory()),
  );
}

function getCaseReceivedImagePath(name) {
  return path.resolve(__dirname, 'cases', name, 'received.png');
}

function getCaseExpectedImagePath(name) {
  return path.resolve(__dirname, 'cases', name, 'expected.png');
}

function parsePNG(filepath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filepath);
    stream.on('error', (err) => {
      if (err.code === 'ENOENT') {
        return reject(new Error(`File not found: ${filepath}`));
      }
      reject(err);
    });

    const image = stream.pipe(new png.PNG());
    image.on('parsed', () => resolve(image));
    image.on('error', reject);
  });
}

// TEST RUN

let browser;
let page;
let resolver, rejecter;
let failed = false;

async function startBrowser() {
  const launchOptions = {
    headless: !options.argv.interactive,
    // Try to use an existing Chrome installation if Chromium download failed
    executablePath:
      process.env.CHROME_PATH ||
      (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome'),
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [],
  };

  // Add --no-sandbox for CI environments
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    launchOptions.args.push(
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    );
  }

  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error) {
    console.error('Failed to launch browser with specified path:', error);
    console.log('Attempting to launch with default configuration...');
    browser = await puppeteer.launch({
      headless: !options.argv.interactive,
      args:
        process.env.CI || process.env.GITHUB_ACTIONS
          ? ['--no-sandbox', '--disable-setuid-sandbox']
          : [],
    });
  }

  page = await browser.newPage();
  page.on('error', (err) => {
    console.error('page crash', err);
  });
  page.on('pageerror', (err) => {
    console.error('uncaught exception', err);
  });
  page.on('console', (message) => {
    const type = message.type();
    console.log(`console.${type}: ${message.text()}`);
  });

  await page.setViewport({ width: 256, height: 256 });

  await page.exposeFunction('validate', () => {
    resolver();
  });
  await page.exposeFunction('fail', (error) => {
    console.log('test failed', error);
    rejecter();
  });
}

async function closeBrowser() {
  await browser.close();
}

async function runTest(name) {
  console.log(`Running case ${name}...`);

  const testFinished = new Promise((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;
  });
  const spec = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, 'cases', name, 'spec.json'),
      'utf-8',
    ),
  );

  await page.goto(
    `http://localhost:${serverPort}?spec=${JSON.stringify(spec)}`,
    {
      waitUntil: 'networkidle0',
    },
  );

  await testFinished;

  const receivedPath = getCaseReceivedImagePath(name);
  const expectedPath = getCaseExpectedImagePath(name);

  await page.screenshot({ path: receivedPath });
  if (options.argv.fix) {
    await promisify(fs.copyFile)(receivedPath, expectedPath);
  }
}

// returns true if validation failed
async function validateResult(name) {
  const receivedPath = getCaseReceivedImagePath(name);
  const expectedPath = getCaseExpectedImagePath(name);
  const receivedImage = await parsePNG(receivedPath);
  const expectedImage = await parsePNG(expectedPath);
  const width = expectedImage.width;
  const height = expectedImage.height;
  if (receivedImage.width != width) {
    throw new Error(
      `Unexpected width for ${receivedPath}: expected ${width}, got ${receivedImage.width}`,
    );
  }
  if (receivedImage.height != height) {
    throw new Error(
      `Unexpected height for ${receivedPath}: expected ${height}, got ${receivedImage.height}`,
    );
  }
  const count = pixelmatch(
    receivedImage.data,
    expectedImage.data,
    null,
    width,
    height,
  );
  const errorPercentage = count / (width * height);

  if (errorPercentage > 0.003) {
    console.log(
      `Image comparison failed for case ${name} with an error of ${(
        errorPercentage * 100
      ).toFixed(2)}%.`,
    );
    return true;
  }
}

async function runTests() {
  await startBrowser();

  const cases = await getCases();

  for (let name of cases) {
    await runTest(name);
    const mismatch = await validateResult(name);
    failed = failed || mismatch;
  }

  // await 30 minutes
  if (options.argv.interactive) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 30));
  }

  await closeBrowser();
}

const server = new webpackDevServer(
  {
    port: serverPort,
    host: 'localhost',
    liveReload: false,
    hot: false,
    static: [
      {
        directory: path.resolve(__dirname, 'testbench'),
      },
      {
        directory: path.resolve(__dirname, 'data'),
      },
    ],
    devMiddleware: {
      publicPath: '/',
    },
  },
  webpack({
    ...config,
    infrastructureLogging: {
      level: 'warn',
    },
    stats: 'errors-warnings',
  }),
);

console.log('Starting webpack-dev-server...');
server.startCallback(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Dev server started on http://localhost:' + serverPort);

    runTests().then(() => {
      server.stop();
      if (failed) {
        console.log(
          'One or several rendering tests failed - check the logs above.',
        );
        process.exit(1);
      } else {
        console.log('Rendering tests completed successfully.');
      }
    });
  }
});
