// Generates an HTML string for an element with a close tag.
export function el(name, attrs, children) {
  // Begin the opening tag.
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

// Generates an HTML string for a self-closing element.
export function elc(name, attrs) {
  // Begin the tag.
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

export const button = (attrs, children) => el('button', attrs, children);
export const div = (attrs, children) => el('div', attrs, children);
export const img = (attrs, children) => elc('img', attrs);
export const p = (attrs, children) => el('p', attrs, children);
export const table = (attrs, children) => el('table', attrs, children);
export const td = (attrs, children) => el('td', attrs, children);
export const th = (attrs, children) => el('th', attrs, children);
export const tr = (attrs, children) => el('tr', attrs, children);
