# ZHTML ![tests](https://github.com/mezzoeditor/zhtml/workflows/tests/badge.svg)

[Demo](https://mezzoeditor.github.io/zhtml/demo.html)

## Installation

1. Copy `zhmlt.js` to your project.
2. Import `html` and `svg` functions from `zhtml.js`.

```js
import {html, svg} from './path/to/zhtml.js';
```

## Usage

`html` and `svg` functions materializes string template into DOM. If string
template has multiple top-level nodes, functions will return `DocumentFragment`.

```js
// Create a DIV element.
const div = html`<div></div>`; // similar to html`<div>`
// Create just a text node.
const textNode = html`just some text`;
// This returns DocumentFragment
const fragment = html`<a>one</a> <a>two</a>`;

// Render SVG circle. Returns element that belongs to the correct namespace URI.
const circle = svg`<circle cx=200 cy=200 r=100 fill=blue></circle>`;
```

`html` supports nested arrays:

```js
const items = [1,2,3,4,5,6,7,8];
return html`
  <ul>${items.map(item => html`
    <li>${item}</li>
  `)}
  </ul>
`;
```

Top-level node returned by `html` function also has shortcuts for `querySelector` and
`querySelectorAll`:

```js
const dom = html`<a>foo</a><a class=bar>baz</a>`;
const oneA = dom.$('.bar');
const allA = dom.$$('a');

// $ and $$ shortcuts are not defined for text nodes:
const textNode = html`yo`;
textNode.$; // undefined - there's no querySelector.
```


## Text Nodes

`zhtml` drops whitespace-only text nodes that have one or more newline character.
This way markup can be alined with indentation and no surprising text nodes appear

```js
function generateSomething() {
  return html`
    <h1>Hey ZHTML!</h1>
    <article>
      <h2>Example</h2>
      <section>Some content goes here</section>
    </article>
  `;
}
```

If such text node is absolutely needed, it can be surrounded with any tag: text node is not
removed if it's not zero-length and it's the only child of its parent.

```js
html`
  ${0}<span>
  </span>${1}
`;
```

## Performance

`zhtml` caches parses string literal only once, caching intermediate DOM and
applying interpolations later on.

`ZHTML` is 2x-3x times faster than innerHTML for small DOM. The benefits grow as the DOM
grows larger.

```js
console.time('innerHTML');
for (let i = 0; i < 10000; ++i) {
    const div = document.createElement('div');
    div.innerHTML = `
      <div>
        <span style='color: red'>H</span>
        <span style='color: green'>E</span>
        <span style='color: blue'>L</span>
        <span style='color: red'>L</span>
        <span style='color: green'>O</span>
        <span style='color: blue'> ${i}</span>
      </div>
    `
}
console.timeEnd('innerHTML')
console.time('zhtml');
for (let i = 0; i < 10000; ++i) {
    const div = html`
      <div>
        <span style='color: red'>H</span>
        <span style='color: green'>E</span>
        <span style='color: blue'>L</span>
        <span style='color: red'>L</span>
        <span style='color: green'>O</span>
        <span style='color: blue'> ${i}</span>
      </div>
    `
}
console.timeEnd('zhtml');

```

## Testing

This is tested with [Cirrus CI](https://cirrus-ci.org/) on both Chromium and Firefox using [Puppeteer](https://github.com/GOogleChrome/puppeteer/).

## Inspiration

Inspired by Dmitry Gozman's experiments.

Similar projects:
- [lit-html](https://github.com/Polymer/lit-html)
- [hyperHTML](https://github.com/WebReflection/hyperHTML)

## Motivation

`zhtml` does exactly what I want:
- always returns Node (either DocumentFragment, TextNode or Element)
- has shortcuts for `querySelector` and `querySelectorAll`
- tiny: 150LOC. Copy & change however you want.

