const path = require('path');
const {TestServer} = require('@pptr/testserver');
const {Matchers, TestRunner, Reporter} = require('@pptr/testrunner');
const puppeteer = require('puppeteer');

let parallel = 1;
const parallelArgIndex = process.argv.indexOf('-j');
if (parallelArgIndex !== -1)
  parallel = parseInt(process.argv[parallelArgIndex + 1], 10);
require('events').defaultMaxListeners *= parallel;

const {expect} = new Matchers();
let timeout = 10000;
if (!isNaN(process.env.TIMEOUT))
  timeout = parseInt(process.env.TIMEOUT, 10);

const testRunner = new TestRunner({timeout, parallel});

console.log('Testing on Node', process.version);

testRunner.beforeAll(async state => {
  const assetsPath = path.join(__dirname);
  const port = 8907 + state.parallelIndex;
  state.server = await TestServer.create(assetsPath, port);
  state.browser = await puppeteer.launch();
  state.page = await state.browser.newPage();
  await state.page.goto(`http://localhost:${port}/sample.html`);
});

testRunner.afterAll(async({server}) => {
  await server.stop();
});

function runTest(testFunction, name, {dom, expected}) {
  testFunction(name, async({page}) => {
    const handle = await page.evaluateHandle(dom);
    const json = await page.evaluate(result => dumpDOM(result), handle);
    expect(json).toEqual(expected);
  });
}

const it = runTest.bind(null, testRunner.it);
const xit = runTest.bind(null, testRunner.xit);
const fit = runTest.bind(null, testRunner.fit);

it('should work', {
  dom: () => html`<div>test</div>`,
  expected: {
    name: 'DIV',
    children: [ 'test' ],
  }
});

it('should return DocumentFragment with many children', {
  dom: () => html`<b>foo</b><b>bar</b>`,
  expected: {
    name: 'DOCUMENT_FRAGMENT',
    children: [
      {
        name: 'B',
        children: ['foo'],
      },
      {
        name: 'B',
        children: ['bar'],
      }
    ],
  }
});

it('should drop empty text nodes', {
  dom: () => html`  <span> A </span>   <span>   B  </span>  `,
  expected: {
    name: 'DOCUMENT_FRAGMENT',
    children: [
      {
        name: 'SPAN',
        children: [' A '],
      },
      {
        name: 'SPAN',
        children: ['   B  '],
      },
    ],
  }
});

it('should return just text nodes', {
  dom: () => html`what's up`,
  expected: `what's up`,
});

it('should work with nested HMTL templates', {
  dom: () => html`<foo>${html`<bar>baz</bar>`}</foo>`,
  expected: {
    name: 'FOO',
    children: [
      {
        name: 'BAR',
        children: ['baz'],
      },
      //TODO: this text node should not be.
      ''
    ],
  },
});

it('should properly handle document fragment nesting', {
  dom: () => html`${html`<b>1</b><b>2</b>`}${html`<b>3</b><b>4</b>`}`,
  expected: {
    name: 'DOCUMENT_FRAGMENT',
    children: [
      {
        name: 'B',
        children: ['1'],
      },
      {
        name: 'B',
        children: ['2'],
      },
      {
        name: 'B',
        children: ['3'],
      },
      {
        name: 'B',
        children: ['4'],
      },
      //TODO: this text node should not be.
      ''
    ],
  }
});

it('should interpolate attribute names', {
  dom: () => html`<div ${'w' + 'oo'}=bar></div>`,
  expected: {
    name: 'DIV',
    attr: 'woo=bar',
  }
});

it('should interpolate multiple attribute names', {
  dom: () => html`<div ${'w' + '1'}=bar ${'w' + '2'}=baz></div>`,
  expected: {
    name: 'DIV',
    attr: 'w1=bar w2=baz',
  }
});

it('should interpolate attribute values', {
  dom: () => html`<div class=${1 + 1}-bar></div>`,
  expected: {
    name: 'DIV',
    attr: 'class=2-bar',
  }
});

it('should work with arrays', {
  dom: () => html`<ul>${[1,2].map(e => html`<li>${e}</li>`)}`,
  expected: {
    name: 'UL',
    children: [
      {
        name: 'LI',
        children: ['1'],
      },
      {
        name: 'LI',
        children: ['2'],
      },
    ],
  },
});

new Reporter(testRunner, path.join(__dirname));
testRunner.run();
