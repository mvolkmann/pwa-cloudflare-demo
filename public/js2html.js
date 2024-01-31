/**
 * Generates an HTML string for an element with a close tag.
 * @param {string} name
 * @param {Object.<string, boolean | number | string>} attrs
 * @param {string[]} children
 * @returns string - the HTML
 */
export function el(name, attrs, children) {
  // Begin the opening tag.
  /** @type {string} */
  let html = '<' + name;

  if (typeof attrs === 'object' && !Array.isArray(attrs)) {
    // Add attributes to the opening tag.
    for (const key of Object.keys(attrs).sort()) {
      html += ` ${key}="${attrs[key]}"`;
    }
  } else {
    // Assume the second argument describes the children, not attributes.
    children = attrs;
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
 * @param {string} name
 * @param {Object.<string, boolean | number | string>} attrs
 * @returns string - the HTML
 */
export function elc(name, attrs) {
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

/**
 * Generates an HTML string for an anchor tag.
 * @param {Object.<string, boolean | number | string>} attrs
 * @param {[string]} children
 * @returns string - the HTML
 */
export const a = (attrs, children) => el('a', attrs, children);

export const body = (attrs, children) => el('body', attrs, children);
export const br = (attrs, children) => elc('br', attrs);
export const button = (attrs, children) => el('button', attrs, children);
export const div = (attrs, children) => el('div', attrs, children);
export const form = (attrs, children) => el('form', attrs, children);
export const head = (attrs, children) => el('head', attrs, children);
export const hr = (attrs, children) => elc('hr', attrs);
export const html = (attrs, children) => el('html', attrs, children);
export const img = (attrs, children) => elc('img', attrs);
export const li = (attrs, children) => el('li', attrs, children);
export const ol = (attrs, children) => el('ol', attrs, children);
export const option = (attrs, children) => el('option', attrs, children);
export const p = (attrs, children) => el('p', attrs, children);
export const script = (attrs, children) => el('script', attrs, children);
export const section = (attrs, children) => el('section', attrs, children);
export const select = (attrs, children) => el('select', attrs, children);
export const span = (attrs, children) => el('span', attrs, children);
export const table = (attrs, children) => el('table', attrs, children);
export const tbody = (attrs, children) => el('tbody', attrs, children);
export const td = (attrs, children) => el('td', attrs, children);
export const tfoot = (attrs, children) => el('tfoot', attrs, children);
export const th = (attrs, children) => el('th', attrs, children);
export const thead = (attrs, children) => el('thead', attrs, children);
export const tr = (attrs, children) => el('tr', attrs, children);
export const ul = (attrs, children) => el('ul', attrs, children);
