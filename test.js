const path = require('path');
const {TestServer} = require('@pptr/testserver');
const {TestRunner, Reporter} = require('@pptr/testrunner');

let parallel = 1;
const parallelArgIndex = process.argv.indexOf('-j');
if (parallelArgIndex !== -1)
  parallel = parseInt(process.argv[parallelArgIndex + 1], 10);
require('events').defaultMaxListeners *= parallel;

let timeout = 10000;
if (!isNaN(process.env.TIMEOUT))
  timeout = parseInt(process.env.TIMEOUT, 10);

const testRunner = new TestRunner({timeout, parallel});

console.log('Testing on Node', process.version);

testRunner.beforeAll(async state => {
  const assetsPath = path.join(__dirname);
  const port = 8907 + state.parallelIndex;
  state.server = await TestServer.create(assetsPath, port);
  state.server.PREFIX = 'http://localhost:' + port;
});

testRunner.afterAll(async({server}) => {
  await server.stop();
});

require('./zhtml.spec.js').addTests(testRunner, require('puppeteer'), 'Chromium');
require('./zhtml.spec.js').addTests(testRunner, require('puppeteer-firefox'), 'Firefox');

new Reporter(testRunner, path.join(__dirname));
testRunner.run();
