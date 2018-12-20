# ZHTML

## Installation

Import `html` function from `zhtml.js`.

```js
import {html} from './path/to/zhtml.js';
```

## Usage

`html` function materializes string template into DOM. If string
template has multiple top-level nodes, `html` will return `DocumentFragment`.

```js
// Create a DIV element.
const div = html`<div></div>`; // similar to html`<div>`
// Create just a text node.
const textNode = html`just some text`;
// This returns DocumentFragment
const fragment = html`<a>one</a> <a>two</a>`;
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

## Text Nodes

`zhtml` drops empty text nodes where possible, so markup can be lined with context
indentation.

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

