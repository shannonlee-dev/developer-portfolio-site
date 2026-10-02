import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const ids = new Set();
const targets = [];

for (const tag of html.matchAll(/<[a-z][^>]*>/gi)) {
  for (const [, attribute, , value] of tag[0].matchAll(
    /\b(id|src|href)\s*=\s*(["'])(.*?)\2/gi,
  )) {
    if (attribute.toLowerCase() === 'id') ids.add(value);
    else targets.push(value);
  }
}

test('HTML에서 참조하는 로컬 자산이 존재한다', () => {
  const local = targets.filter((target) => !/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(target));
  assert.ok(local.length > 0);
  for (const target of local) {
    const pathname = decodeURIComponent(
      new URL(target, 'https://portfolio.test/').pathname,
    );
    const path = resolve(root, pathname.replace(/^\//, ''));
    assert.ok(existsSync(path) && statSync(path).isFile(), target);
  }
});

test('내부 이동 링크가 실제 HTML 요소를 가리킨다', () => {
  const anchors = targets.filter((target) => target.startsWith('#'));
  assert.ok(anchors.length > 0);
  for (const target of anchors)
    assert.ok(ids.has(decodeURIComponent(target.slice(1))), target);
});
