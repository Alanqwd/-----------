
import { jest } from '@jest/globals';
import {
  escapeHtml,
  truncate,
  highlightKeywords,
  formatCodeBlock,
  createSanitizer,
  asyncFormatText,
  setCodeTheme
} from '../js/text-formatter.js';

describe('escapeHtml', () => {
  test('экранирует спец-символы', () => {
    expect(escapeHtml('<div>&"\'</div>')).toBe('&lt;div&gt;&amp;&quot;&#39;&lt;/div&gt;');
  });
  test('возвращает пустую строку для null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
  test('не изменяет обычный текст', () => {
    expect(escapeHtml('hello')).toBe('hello');
  });
});

describe('truncate', () => {
  test('возвращает оригинал если короткий', () => {
    expect(truncate(10)('hello')).toBe('hello');
  });
  test('обрезает по длине и не разрывает слово', () => {
    expect(truncate(5)('hello world')).toBe('hello…');
  });
  test('поддерживает вызов truncate(text) — сразу строка', () => {
    expect(truncate('a<b>c')).toBe('a&lt;b&gt;c');
  });
  test('обрабатывает пустые строки и null', () => {
    expect(truncate(10)('')).toBe('');
    expect(truncate(10)(null)).toBe('');
  });
});

describe('highlightKeywords', () => {
  test('подсвечивает слово, нечувствительно к регистру', () => {
    const high = highlightKeywords(['foo'], 'h');
    expect(high('Foo bar')).toContain('<span class="h">Foo</span>');
  });
  test('экранирует HTML в тексте перед подсветкой', () => {
    const high = highlightKeywords(['x'], 'c');
    expect(high('<b>x</b>')).toContain('&lt;b&gt;');
  });
  test('возвращает экранированный текст если слова пусты', () => {
    const high = highlightKeywords([], 'c');
    expect(high('<a>')).toBe('&lt;a&gt;');
  });
});

describe('formatCodeBlock', () => {
  test('оборачивает код в pre/code и применяет подсветку для js', () => {
    const out = formatCodeBlock("const x = 1;\n// comment\n", 'js');
    expect(out).toMatch(/<pre><code class="language-js">/);
    expect(out).toContain('cm-comment');
    expect(out).toContain('cm-keyword');
  });
  test('обрабатывает null/undefined', () => {
    expect(formatCodeBlock(null)).toBe('<pre><code></code></pre>');
    expect(formatCodeBlock(undefined)).toBe('<pre><code></code></pre>');
  });
  test('не ломается для других языков', () => {
    const out = formatCodeBlock('print("hi")', 'python');
    expect(out).toMatch(/<pre><code class="language-python">/);
  });
});

describe('createSanitizer', () => {
  const sanitize = createSanitizer();
  test('стрипает запрещённые теги и экранирует их содержимое', () => {
    expect(sanitize('<script>alert(1)</script><b>ok</b>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;<b>ok</b>');
  });
  test('сохраняет допустимые атрибуты для a и span', () => {
    const s = createSanitizer();
    const res = s('<a href="https://example.com" onclick="x()">link</a><span class="cls" data-x="1">s</span>');
    expect(res).toContain('<a href="https://example.com">');
    expect(res).not.toContain('data-x=');
  });
  test('обрабатывает пустую строку и null', () => {
    expect(sanitize('')).toBe('');
    expect(sanitize(null)).toBe('');
  });
});

describe('asyncFormatText', () => {
  test('синхронно возвращает для небольшого текста', async () => {
    const r = await asyncFormatText('plain text', { threshold: 2000 });
    expect(typeof r).toBe('string');
  });
  test('асинхронно обрабатывает большой текст по чанкам', async () => {
    const big = 'a'.repeat(10000);
    const r = await asyncFormatText(big, { threshold: 1000, chunkSize: 2000 });
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });
  test('обрабатывает специальные символы и HTML безопасно', async () => {
    const src = '<b>bold</b> ```js\nconst x = 1;\n``` <script>alert(1)</script>';
    const r = await asyncFormatText(src, { threshold: 1 });
    expect(r).toContain('&lt;script&gt;');
    expect(r).toContain('<pre><code');
  });
});

describe('setCodeTheme (side effects)', () => {
  test('можно вызвать без ошибки', () => {
    expect(() => setCodeTheme('code-theme-light')).not.toThrow();
  });
});
