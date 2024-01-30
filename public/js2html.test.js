import {expect, test} from 'bun:test';
// Can also import describe, beforeAll, beforeEach, afterAll, and afterEach.
import {el, elc} from './js2html.js';

test('el1', () => {
  const html = el('p', 'Hello, World!');
  expect(html).toBe('<p>Hello, World!</p>');
});

test('el2', () => {
  const html = el('p', {id: 'p1', class: 'greet'}, 'Hello, World!');
  expect(html).toBe('<p class="greet" id="p1">Hello, World!</p>');
});

test('el3', () => {
  const html = el('div', [el('p', 'Hello'), el('p', 'World')]);
  expect(html).toBe('<div><p>Hello</p><p>World</p></div>');
});

test('el4', () => {
  const html = elc('img', {alt: 'giraffe', src: 'giraffe.jpg'});
  expect(html).toBe('<img alt="giraffe" src="giraffe.jpg" />');
});
