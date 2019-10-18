const {Matchers} = require('@pptr/testrunner');

const {expect} = new Matchers();

module.exports.addTests = function addTests(testRunner, puppeteer, product) {
  const it = runUnitTest.bind(null, testRunner.it);
  const xit = runUnitTest.bind(null, testRunner.xit);
  const fit = product.toLowerCase() === 'chromium' ? runUnitTest.bind(null, testRunner.fit) : it;

  testRunner.describe(product, () => {
    testRunner.beforeAll(async state => {
      state.browser = await puppeteer.launch();
      state.page = await state.browser.newPage();
      state.page.on('console', msg => console.log(msg.text()));
      await state.page.goto(`${state.server.PREFIX}/demo.html`);
    });

    testRunner.afterAll(async state => {
      await state.browser.close();
      state.page = null;
      state.browser = null;
    });

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

    it('should drop empty text nodes with newlines', {
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

    it('should keep text node if it is the only child', {
      dom: () => html`<span>
        </span>`,
      expected: {
        name: 'SPAN',
        children: ['\n        '],
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

    it('should do many interpolations inside attribute name', {
      dom: () => html`<div ${'f'}-${'o'}-${'o'}=bar></div>`,
      expected: {
        name: 'DIV',
        attr: 'f-o-o=bar',
      }
    });

    it('should do many interpolations inside attribute value', {
      dom: () => html`<div foo=${'b'}-${'a'}-${'r'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'foo=b-a-r',
      }
    });

    it('should support boolean attribute value', {
      dom: () => html`<button disabled=${true}></button>`,
      expected: {
        name: 'BUTTON',
        attr: 'disabled',
      }
    });

    it('should support truthy boolean attribute value', {
      dom: () => html`<button disabled=${'yes'}></button>`,
      expected: {
        name: 'BUTTON',
        attr: 'disabled',
      }
    });

    it('should support falsy boolean attribute value', {
      dom: () => html`<button disabled=${0}></button>`,
      expected: {
        name: 'BUTTON',
      }
    });

    it('should do many interpolations inside both attribute name and value', {
      dom: () => html`<div ${'f'}-${'o'}-${'o'}=${'b'}-${'a'}-${'r'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'f-o-o=b-a-r',
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

    it('should interpolate whole attribute key=value pairs', {
      dom: () => html`<div ${'class=foo'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'class=foo',
      }
    });

    it('should retain textnodes around interpolation', {
      dom: () => html`(${'foo'})`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [
          '(', 'foo', ')'
        ]
      }
    });

    it('should not have empty nodes in-between interpolations', {
      dom: () => html`${'foo'}${'bar'}${'baz'}`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [
          'foo', 'bar', 'baz'
        ]
      }
    });

    it('should not drop whitespace textnode before interpolation', {
      dom: () => html`<span>  ${0}  </span>`,
      expected: {
        name: 'SPAN',
        children: [
          '  ', '0', '  '
        ]
      }
    });

    it('should not drop whitespace textnodes between interpolations', {
      dom: () => html`<span>${'Hello'} ${'world'}</span>`,
      expected: {
        name: 'SPAN',
        children: [
          'Hello', ' ', 'world'
        ]
      }
    });

    it('should work with array substitution with no other nodes', {
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

    it('should drop "undefined" and "null" node values', {
      dom: () => html`<span>${undefined}</span><div>${null}</div>`,
      expected: {
        name: 'DOCUMENT_FRAGMENT',
        children: [
          { name: 'SPAN' },
          { name: 'DIV' },
        ],
      },
    });

    it('should drop attribute with name "undefined" or "null"', {
      dom: () => html`<div ${undefined} ${null}=foo></div>`,
      expected: {
        name: 'DIV',
      }
    });

    it('should drop both key and value when dropping attribute', {
      dom: () => html`<div ${null}=${'foo'} bar=${'baz'}></div>`,
      expected: {
        name: 'DIV',
        attr: 'bar=baz',
      }
    });

    xit('should work with table rows', {
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
  });
}

function runUnitTest(testFunction, name, {dom, expected}) {
  testFunction(name, async({page}) => {
    const handle = await page.evaluateHandle(dom);
    const json = await page.evaluate(result => dumpDOM(result), handle);
    expect(json).toEqual(expected);
  });
}

