#!/usr/bin/env node
const fs = require('fs');
const process = require('process');
const path = require('path');
const { promisify } = require('util');
const puppeteer = require('puppeteer');
const webpack = require('webpack');
const config = require('./webpack.config');
const webpackDevServer = require('webpack-dev-server');
const yargs = require('yargs');
const pixelmatch = require('pixelmatch');
const png = require('pngjs');

const options = yargs.option('fix', {
  describe: 'Write generated images to disk',
  type: 'boolean',
  default: false,
});

const serverPort = 8888;

// UTILS

async function getCases() {
  const root = path.resolve(__dirname, 'cases');
  return await promisify(fs.readdir)(root).then((cases) =>
    cases.filter((name) => fs.statSync(path.resolve(root, name)).isDirectory())
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
  browser = await puppeteer.launch({
    headless: true,
  });
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

  const spec = require(`./cases/${name}/spec.json`);

  await page.goto(
    `http://localhost:${serverPort}?spec=${JSON.stringify(spec)}`,
    {
      waitUntil: 'networkidle0',
    }
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
      `Unexpected width for ${receivedPath}: expected ${width}, got ${receivedImage.width}`
    );
  }
  if (receivedImage.height != height) {
    throw new Error(
      `Unexpected height for ${receivedPath}: expected ${height}, got ${receivedImage.height}`
    );
  }
  const count = pixelmatch(
    receivedImage.data,
    expectedImage.data,
    null,
    width,
    height
  );
  const errorPercentage = count / (width * height);

  if (errorPercentage > 0.01) {
    console.log(
      `Image comparison failed for case ${name} with an error of ${(
        errorPercentage * 100
      ).toFixed(2)}%.`
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

  await closeBrowser();
}

const server = new webpackDevServer(webpack(config), {
  port: serverPort,
  quiet: true,
  contentBase: path.resolve(__dirname, 'testbench'),
  publicPath: '/',
  liveReload: false,
});

console.log('Starting webpack-dev-server...');
server.listen(serverPort, 'localhost', function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Dev server started on http://localhost:' + serverPort);

    runTests().then(() => {
      server.close();
      if (failed) {
        console.log(
          'One or several rendering tests failed - check the logs above.'
        );
        process.exit(1);
      } else {
        console.log('Rendering tests completed successfully.');
      }
    });
  }
});
