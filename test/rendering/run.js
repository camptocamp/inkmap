#!/usr/bin/env node
const path = require('path');
const puppeteer = require('puppeteer');
const webpack = require('webpack');
const config = require('./webpack.config');
const webpackDevServer = require('webpack-dev-server');
const yargs = require('yargs');

const options = yargs.option('fix', {
  describe: 'Write generated images to disk',
  type: 'boolean',
  default: false,
});

const serverPort = 8888;

let browser;

async function startBrowser() {
  browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
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

  let resolver;
  const validated = new Promise((resolve) => (resolver = resolve));

  await page.exposeFunction('validate', (img) => {
    console.log('received image');
    resolver(img);
  });

  await page.goto(`http://localhost:${serverPort}`, {
    waitUntil: 'networkidle0',
  });

  await validated;

  await page.screenshot({ path: path.resolve(__dirname, 'screen.png') });
}

async function closeBrowser() {
  await browser.close();
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

    startBrowser()
      .then(closeBrowser)
      .then(() => {
        console.log('rendering tests over');
        server.close();
      });
  }
});
