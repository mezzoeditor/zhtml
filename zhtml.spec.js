const {Matchers} = require('@pptr/testrunner');

const {expect} = new Matchers();

module.exports.addTests = function addTests(testRunner, browserType) {
  const {it, xit} = testRunner;
  const product = browserType.name();
  const fit = product.toLowerCase() === 'chromium' ? testRunner.fit : it;
  const itHTML = runUnitTest.bind(null, testRunner.it);
  const xitHTML = runUnitTest.bind(null, testRunner.xit);
  const fitHTML = product.toLowerCase() === 'chromium' ? runUnitTest.bind(null, testRunner.fit) : it;

  testRunner.describe(product, () => {
    testRunner.beforeAll(async state => {
      state.browser = await browserType.launch();
      state.page = await state.browser.newPage();
      state.page.on('console', msg => console.log('LOG: ' + msg.text()));
      await state.page.goto(`${state.server.PREFIX}/demo.html`);
    });

    testRunner.afterAll(async state => {
      await state.browser.close();
      state.page = null;
      state.browser = null;
    });

    it('should add click listener', async ({page}) => {
      await page.evaluate(() => {
        window.__CLICKED = false;
        document.body.append(html`<div id=clickme onclick=${() => window.__CLICKED = true}>CLICKME</div>`);
      });
      expect(await page.evaluate(() => window.__CLICKED)).toBe(false);
      await page.click('#clickme');
      expect(await page.evaluate(() => window.__CLICKED)).toBe(true);
    });

    itHTML('should work', {
      dom: () => html`<div>test</div>`,
      expected: {
        name: 'DIV',
        children: [ 'test' ],
      }
    });

    itHTML('should return DocumentFragment with many children', {
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

    itHTML('should drop empty text nodes with newlines', {
      dom: () => html`
        <span> A </span>
        <span>   B  </span>
      `,
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

    itHTML('should keep text node if it is the only child', {
      dom: () => html`<span>
        </span>`,
      expected: {
        name: 'SPAN',
        children: ['\n        '],
      }
    });

    itHTML('should return just text nodes', {
      dom: () => html`what's up`,
      expected: `what's up`,
    });

    itHTML('should return empty document fragment when passed an empty string', {
      dom: () => html``,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
      },
    });

    itHTML('should return text node when passed a  string with a space', {
      dom: () => html` `,
      expected: ' ',
    });

    itHTML('should work with nested HMTL templates', {
      dom: () => html`<foo>${html`<bar>baz</bar>`}</foo>`,
      expected: {
        name: 'FOO',
        children: [
          {
            name: 'BAR',
            children: ['baz'],
          },
        ],
      },
    });

    itHTML('should properly handle document fragment nesting', {
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
        ],
      }
    });

    itHTML('should interpolate attribute names', {
      dom: () => html`<div ${'w' + 'oo'}=bar></div>`,
      expected: {
        name: 'DIV',
        attr: 'woo=bar',
      }
    });

    itHTML('should do many interpolations inside attribute name', {
      dom: () => html`<div ${'f'}-${'o'}-${'o'}=bar></div>`,
      expected: {
        name: 'DIV',
        attr: 'f-o-o=bar',
      }
    });

    itHTML('should do many interpolations inside attribute value', {
      dom: () => html`<div foo=${'b'}-${'a'}-${'r'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'foo=b-a-r',
      }
    });

    itHTML('should support boolean attribute value', {
      dom: () => html`<button disabled=${true}></button>`,
      expected: {
        name: 'BUTTON',
        attr: 'disabled',
      }
    });

    itHTML('should support truthy boolean attribute value', {
      dom: () => html`<button disabled=${'yes'}></button>`,
      expected: {
        name: 'BUTTON',
        attr: 'disabled',
      }
    });

    itHTML('should support falsy boolean attribute value', {
      dom: () => html`<button disabled=${0}></button>`,
      expected: {
        name: 'BUTTON',
      }
    });

    itHTML('should do many interpolations inside both attribute name and value', {
      dom: () => html`<div ${'f'}-${'o'}-${'o'}=${'b'}-${'a'}-${'r'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'f-o-o=b-a-r',
      }
    });

    itHTML('should interpolate multiple attribute names', {
      dom: () => html`<div ${'w' + '1'}=bar ${'w' + '2'}=baz></div>`,
      expected: {
        name: 'DIV',
        attr: 'w1=bar w2=baz',
      }
    });

    itHTML('should interpolate attribute values', {
      dom: () => html`<div class=${1 + 1}-bar></div>`,
      expected: {
        name: 'DIV',
        attr: 'class=2-bar',
      }
    });

    itHTML('should interpolate whole attribute key=value pairs', {
      dom: () => html`<div ${'class=foo'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'class=foo',
      }
    });

    itHTML('should retain textnodes around interpolation', {
      dom: () => html`(${'foo'})`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [
          '(', 'foo', ')'
        ]
      }
    });

    itHTML('should not have empty nodes in-between interpolations', {
      dom: () => html`${'foo'}${'bar'}${'baz'}`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [
          'foo', 'bar', 'baz'
        ]
      }
    });

    itHTML('should not drop whitespace textnode before interpolation', {
      dom: () => html`<span>  ${0}  </span>`,
      expected: {
        name: 'SPAN',
        children: [
          '  ', '0', '  '
        ]
      }
    });

    itHTML('should not drop whitespace textnodes between interpolations', {
      dom: () => html`<span>${'Hello'} ${'world'}</span>`,
      expected: {
        name: 'SPAN',
        children: [
          'Hello', ' ', 'world'
        ]
      }
    });

    itHTML('should work with array substitution with no other nodes', {
      dom: () => html`${[document.createElement('div'), document.createElement('span')]}`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [{
          name: 'DIV',
        }, {
          name: 'SPAN',
        }]
      }
    });

    itHTML('should drop "undefined" and "null" node values', {
      dom: () => html`<span>${undefined}</span><div>${null}</div>`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [
          { name: 'SPAN' },
          { name: 'DIV' },
        ],
      },
    });
    itHTML('should drop empty array node values', {
      dom: () => html`<span>${[]}</span>`,
      expected: {
        name: 'SPAN',
      },
    });

    itHTML('should drop "false" node value', {
      dom: () => html`<span>${false}</span>`,
      expected: {
        name: 'SPAN',
      },
    });

    itHTML('should drop attribute with name "undefined" or "null"', {
      dom: () => html`<div ${undefined} ${null}=foo></div>`,
      expected: {
        name: 'DIV',
      }
    });

    itHTML('should work with attribute shorthands', {
      dom: () => html`<input ${'disabled'}></input>`,
      expected: {
        name: 'INPUT',
        attr: 'disabled',
      }
    });

    itHTML('should drop both key and value when dropping attribute', {
      dom: () => html`<div ${null}=${'foo'} bar=${'baz'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'bar=baz',
      }
    });

    xitHTML('should work with table rows', {
      dom: () => html`<table><tr>${'<td>Hello</td>'}</tr></table>`,
      expected: {
        name: 'TABLE',
        children: [{
          name: 'TBODY',
          children: [{
            name: 'TR',
            children: [{
              name: 'TD',
              children: ['Hello'],
            }],
          }]
        }]
      }
    });

    itHTML('should work with arrays', {
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

    itHTML('should work with SVG', {
      dom: () => svg`<circle></circle><rect></rect>`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [
          {
            name: 'circle',
            xmlns: 'http://www.w3.org/2000/svg',
          },
          {
            name: 'rect',
            xmlns: 'http://www.w3.org/2000/svg',
          },
        ],
      },
    });

    itHTML('should compose SVG', {
      dom: () => svg`<svg>${[1,2].map(e => svg`<circle x=${e * 10} y=${e * 10} r=10></circle>`)}</svg>`,
      expected: {
        name: 'svg',
        xmlns: 'http://www.w3.org/2000/svg',
        children: [
          {
            name: 'circle',
            xmlns: 'http://www.w3.org/2000/svg',
            attr: "r=10 x=10 y=10",
          },
          {
            name: 'circle',
            xmlns: 'http://www.w3.org/2000/svg',
            attr: "r=10 x=20 y=20",
          },
        ],
      },
    });
  });
}

function runUnitTest(testFunction, name, {dom, expected}) {
  testFunction(name, async({page}) => {
    const handle = await page.evaluateHandle(dom);
    const json = await page.evaluate(result => dumpDOM(result), handle);
    expect(json).toEqual(expected);
  });
}

