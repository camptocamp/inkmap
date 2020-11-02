#!/usr/bin/env node
const path = require('path');
const puppeteer = require('puppeteer');
const webpack = require('webpack');
const config = require('./webpack.config');
const webpackDevServer = require('webpack-dev-server');
const yargs = require('yargs');
const fs = require('fs');
const { promisify } = require('util');

const options = yargs.option('fix', {
  describe: 'Write generated images to disk',
  type: 'boolean',
  default: false,
});

const serverPort = 8888;

let browser;
let page;
let resolver, rejecter;

async function startBrowser() {
  browser = await puppeteer.launch({
    headless: false,
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
    console.log('received image');
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

async function getCases() {
  return await promisify(fs.readdir)(path.resolve(__dirname, 'cases'));
}

function getCaseReceivedImagePath(name) {
  return path.resolve(__dirname, 'cases', name, 'received.png');
}

function getCaseExpectedImagePath(name) {
  return path.resolve(__dirname, 'cases', name, 'expected.png');
}

async function runTest(name) {
  console.log('Running case:', name);

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

async function validateResult(name) {
  return true; // to do: image check
}

async function runTests() {
  await startBrowser();

  const cases = await getCases();

  for (let name of cases) {
    await runTest(name);
    await validateResult(name);
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
      console.log('rendering tests over');
      server.close();
    });
  }
});
