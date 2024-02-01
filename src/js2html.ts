type Attrs = {[key: string]: boolean | number | string};
type Child = string | number;
type Children = Child | Child[];

/**
 * Generates an HTML string for an element with a close tag.
 */
export function el(
  name: string,
  attrs?: Attrs | Children,
  children?: Children
): string {
  if (typeof attrs !== 'object' || Array.isArray(attrs)) {
    // Assume the second argument describes children, not attributes.
    children = attrs;
    attrs = undefined;
  }

  // Begin the opening tag.
  /** @type {string} */
  let html = '<' + name;

  if (attrs) {
    // Add attributes to the opening tag.
    for (const key of Object.keys(attrs).sort()) {
      html += ` ${key}="${attrs[key]}"`;
    }
  }

  // Close the opening tag.
  html += '>';

  if (Array.isArray(children)) {
    // Add child elements.
    for (const child of children) {
      html += child;
    }
  } else {
    // Add text content.
    html += children;
  }

  // Add the closing tag.
  html += `</${name}>`;

  return html;
}

/**
 * Generates an HTML string for a self-closing element.
 */
export function elc(name: string, attrs?: Attrs): string {
  // Begin the tag.
  /** @type {string} */
  let html = '<' + name;

  if (typeof attrs === 'object' && !Array.isArray(attrs)) {
    // Add attributes to the opening tag.
    for (const key of Object.keys(attrs).sort()) {
      html += ` ${key}="${attrs[key]}"`;
    }
  }

  // Close the tag.
  html += ' />';

  return html;
}

export const a = (attrs: Attrs | Children, children?: Children) =>
  el('a', attrs, children);
export const body = (attrs?: Attrs | Children, children?: Children) =>
  el('body', attrs, children);
export const br = (attrs?: Attrs) => elc('br', attrs);
export const button = (attrs?: Attrs | Children, children?: Children) =>
  el('button', attrs, children);
export const div = (attrs?: Attrs | Children, children?: Children) =>
  el('div', attrs, children);
export const form = (attrs?: Attrs | Children, children?: Children) =>
  el('form', attrs, children);
export const head = (attrs?: Attrs | Children, children?: Children) =>
  el('head', attrs, children);
export const hr = (attrs?: Attrs) => elc('hr', attrs);
export const html = (attrs?: Attrs | Children, children?: Children) =>
  el('html', attrs, children);
export const img = (attrs: Attrs) => elc('img', attrs);
export const li = (attrs?: Attrs | Children, children?: Children) =>
  el('li', attrs, children);
export const ol = (attrs?: Attrs | Children, children?: Children) =>
  el('ol', attrs, children);
export const option = (attrs?: Attrs | Children, children?: Children) =>
  el('option', attrs, children);
export const p = (attrs?: Attrs | Children, children?: Children) =>
  el('p', attrs, children);
export const script = (attrs?: Attrs | Children, children?: Children) =>
  el('script', attrs, children);
export const section = (attrs?: Attrs | Children, children?: Children) =>
  el('section', attrs, children);
export const select = (attrs?: Attrs | Children, children?: Children) =>
  el('select', attrs, children);
export const span = (attrs?: Attrs | Children, children?: Children) =>
  el('span', attrs, children);
export const table = (attrs?: Attrs | Children, children?: Children) =>
  el('table', attrs, children);
export const tbody = (attrs?: Attrs | Children, children?: Children) =>
  el('tbody', attrs, children);
export const td = (attrs?: Attrs | Children, children?: string[]) =>
  el('td', attrs, children);
export const tfoot = (attrs?: Attrs | Children, children?: Children) =>
  el('tfoot', attrs, children);
export const th = (attrs?: Attrs | Children, children?: string[]) =>
  el('th', attrs, children);
export const thead = (attrs?: Attrs | Children, children?: Children) =>
  el('thead', attrs, children);
export const tr = (attrs?: Attrs | Children, children?: Children) =>
  el('tr', attrs, children);
export const ul = (attrs?: Attrs | Children, children?: Children) =>
  el('ul', attrs, children);
