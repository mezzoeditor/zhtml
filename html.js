const templateCache = new Map();

function template(strings, ...values) {
  let template = templateCache.get(strings);
  if (!template) {
    template = ZTemplate.process(strings);
    templateCache.set(strings, template);
  }
  return new ZTemplate(template, values);
}

export function html(strings, ...values) {
  const node = template(strings, ...values).render();
  if (node.querySelector) {
    node.$ = node.querySelector.bind(node);
    node.$$ = node.querySelectorAll.bind(node);
  }
  return node;
}

const SPACE_REGEX = /^\s*$/;
const MARKER_REGEX = /z-t-e-\d+-m-p-l-a-t-e/;

class ZTemplate {
  static process(strings) {
    const template = document.createElement('template');
    let html = ''
    for (let i = 0; i < strings.length - 1; ++i) {
      html += strings[i];
      html += `z-t-e-${i}-m-p-l-a-t-e`;
    }
    html += strings[strings.length - 1];
    template.innerHTML = html;

    const walker = template.ownerDocument.createTreeWalker(
        template.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
    let valueIndex = 0;
    const emptyTextNodes = [];
    const subs = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.ELEMENT_NODE && MARKER_REGEX.test(node.tagName))
        throw new Error('Should not use a parameter as an html tag');

      if (node.nodeType === Node.ELEMENT_NODE && node.hasAttributes()) {
        for (let i = 0; i < node.attributes.length; i++) {
          const name = node.attributes[i].name;

          const isNameMatching = MARKER_REGEX.test(name);
          const isValueMatching = MARKER_REGEX.test(node.attributes[i].value);

          let type = null;
          if (isNameMatching && isValueMatching)
            type = 'attribute-all';
          else if (isNameMatching)
            type = 'attribute-name';
          else if (isValueMatching)
            type = 'attribute-value';

          if (type)
            subs.push({ node, type, attr: name});
        }
      } else if (node.nodeType === Node.TEXT_NODE && MARKER_REGEX.test(node.data)) {
        const texts = node.data.split(MARKER_REGEX);
        node.data = texts[0];
        const anchor = node.nextSibling;
        for (let i = 1; i < texts.length; ++i) {
          const span = document.createElement('span');
          node.parentNode.insertBefore(span, anchor);
          subs.push({
            node: span,
            type: 'replace-node',
          });
        }
        if ((!node.previousSibling || node.previousSibling.nodeType === Node.ELEMENT_NODE) &&
            SPACE_REGEX.test(node.data))
          emptyTextNodes.push(node);
      } else if (node.nodeType === Node.TEXT_NODE &&
          (!node.previousSibling || node.previousSibling.nodeType === Node.ELEMENT_NODE) &&
          (!node.nextSibling || node.nextSibling.nodeType === Node.ELEMENT_NODE) &&
          SPACE_REGEX.test(node.data)) {
        emptyTextNodes.push(node);
      }
    }

    for (const emptyTextNode of emptyTextNodes)
      emptyTextNode.remove();

    const markedNodes = new Map();
    for (const sub of subs) {
      let index = markedNodes.get(sub.node);
      if (index === undefined) {
        index = markedNodes.size;
        sub.node.setAttribute('z-framework-marked-node', true);
        markedNodes.set(sub.node, index);
      }
      sub.nodeIndex = index;
    }
    return {template, subs};
  }

  constructor({template, subs}, values) {
    this._template = template;
    this._subs = subs;
    this._values = values;
  }

  render() {
    let node = null;
    const content = this._template.ownerDocument.importNode(this._template.content, true);
    if (content.firstChild === content.lastChild)
      node = content.firstChild;
    else
      node = content;

    const boundElements = Array.from(content.querySelectorAll('[z-framework-marked-node]'));
    for (const node of boundElements)
      node.removeAttribute('z-framework-marked-node');

    let valueIndex = 0;
    const interpolateText= (texts) => {
      let newText = texts[0];
      for (let i = 1; i < texts.length; ++i) {
        newText += this._values[valueIndex++];
        newText += texts[i];
      }
      return newText;
    }

    for (const sub of this._subs) {
      const node = boundElements[sub.nodeIndex];
      if (sub.attr) {
        const attribute = node.attributes[sub.attr];
        let name = attribute.name;
        let value = attribute.value;
        let maybeHandleBooleanValue = false;
        node.removeAttribute(name);
        if (sub.type === 'attribute-all' || sub.type === 'attribute-name')
          name = interpolateText(name.split(MARKER_REGEX), false /* isAttributeValue */);
        if (sub.type === 'attribute-all' || sub.type === 'attribute-value') {
          const texts = value.split(MARKER_REGEX);
          if (texts.length === 2 && texts[0] === '' && texts[1] === '') {
            value = this._values[valueIndex++];
            maybeHandleBooleanValue = true;
          } else {
            value = interpolateText(texts);
          }
        }
        if (maybeHandleBooleanValue && (typeof value === 'boolean' || (value instanceof Boolean)))
          node.toggleAttribute(name, value);
        else
          node.setAttribute(name, value);
      } else if (sub.type === 'replace-node') {
        const replacement = this._values[valueIndex++];
        if (Array.isArray(replacement)) {
          const fragment = document.createDocumentFragment();
          for (const node of replacement)
            fragment.appendChild(node);
          node.replaceWith(fragment);
        } else if (replacement instanceof Node) {
          node.replaceWith(replacement);
        } else {
          node.replaceWith(document.createTextNode(replacement));
        }
      }
    }

    return node;
  }
}
