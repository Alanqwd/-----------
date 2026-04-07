// js/text-formatter.js

// Экранирует HTML-спецсимволы
export function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Каррированная truncate: поддерживает обе формы:
// truncate(n)(text) и truncate(n, suffix)(text) или truncate(text) если передан текст сразу.
// Возвращает строку с экранированием HTML и аккуратной обрезкой по словам.
export function truncate(n, suffix = '…') {
  // если первый аргумент — строка (вызов truncate(text)), просто экранируем и вернём
  if (typeof n === 'string') {
    const safe = escapeHtml(n);
    return safe;
  }

  // возвращает функцию, принимающую текст
  return function (text) {
    if (text == null) return '';
    const safe = escapeHtml(String(text));
    if (safe.length <= n) return safe;
    let truncated = safe.slice(0, n);
    // не разрывать слово, если следующий символ непробельный
    if (/\S/.test(safe.charAt(n)) && /\S/.test(truncated.charAt(truncated.length - 1))) {
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
    }
    return truncated.trimEnd() + suffix;
  };
}

// highlightKeywords: принимает массив ключевых слов и возвращает каррированную функцию,
// которая подсвечивает все вхождения в переданном тексте, используя заданный класс.
// Пример использования:
// const high = highlightKeywords(['foo','bar'], 'myclass');
// const result = high(someText);
export function highlightKeywords(keywords = [], className = 'highlight') {
  // нормализуем ключевые слова, убираем пустые и экранируем для RegExp
  const words = (keywords || [])
    .filter(Boolean)
    .map(w => String(w).trim())
    .filter(w => w.length > 0);

  if (words.length === 0) {
    return function (text) { return escapeHtml(text); };
  }

  // составим один RegExp, учитывая границы слов и нечувствительность к регистру
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');

  return function (text) {
    if (text == null) return '';
    // текст должен быть экранирован прежде чем вставлять HTML
    const safe = escapeHtml(String(text));
    // заменяем совпадения на span с классом
    return safe.replace(pattern, `<span class="${escapeHtml(className)}">$1</span>`);
  };
}

// formatCodeBlock: базовая подсветка синтаксиса для JavaScript-подобного кода.
// Возвращает HTML-код (экранированный) обёрнутый в <pre><code class="language-...">...</code></pre>.
// Поддерживает минимальную подсветку: строки, комментарии, числа, ключевые слова, строки в кавычках.
// Не использует внешних библиотек.
export function formatCodeBlock(code, language = 'javascript') {
  if (code == null) return '<pre><code></code></pre>';
  const lang = String(language || '').toLowerCase();
  let src = String(code);

  // Экранируем исходный код, чтобы избежать XSS
  src = escapeHtml(src);

  // Примитивная подсветка для JS/TS/C-like:
  if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
    // порядок важен: комментарии до прочего, затем строки, затем числа, затем ключевые слова
    // комментарии (одно- и многострочные)
    src = src
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cm-comment">$1</span>')
      .replace(/(\/\/[^\n\r]*)/g, '<span class="cm-comment">$1</span>');
    // строки (в двойных/одинарных/`backticks`)
    src = src.replace(/(['"`])((?:\\.|(?!\1).)*)\1/g, (m) => {
      return `<span class="cm-string">${m}</span>`;
    });
    // числа
    src = src.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="cm-number">$1</span>');
    // ключевые слова (JS common)
    const kw = '\\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield)\\b';
    src = src.replace(new RegExp(kw, 'g'), '<span class="cm-keyword">$1</span>');
  }

  // для прочих языков просто возвращаем экранированный код без подсветки
  return `<pre><code class="language-${escapeHtml(lang)}">${src}</code></pre>`;
}
export function createSanitizer(allowedTags = ['b','i','em','strong','u','p','br','pre','code','span','ul','ol','li','a'], allowedAttrs = { a: ['href', 'title', 'target'], span: ['class'], code: ['class'] }) {
  const tagRegex = /<\/?([a-z0-9-]+)([^>]*)>/ig;
  const attrRegex = /([a-z0-9-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/ig;
  return function sanitize(html = '') {
    if (html == null) return '';
    let out = '';
    let lastIndex = 0;
    html = String(html);
    let m;
    while ((m = tagRegex.exec(html)) !== null) {
      out += escapeHtml(html.slice(lastIndex, m.index));
      const tag = m[1].toLowerCase();
      const rest = m[2] || '';
      const isClosing = html[m.index+1] === '/';
      if (!allowedTags.includes(tag)) {
        lastIndex = tagRegex.lastIndex;
        continue;
      }
      if (isClosing) {
        out += `</${tag}>`;
      } else {
        let attrs = '';
        let a;
        while ((a = attrRegex.exec(rest)) !== null) {
          const name = a[1].toLowerCase();
          const val = a[2] || a[3] || a[4] || '';
          const allowed = (allowedAttrs[tag] || []).includes(name);
          if (allowed) {
            attrs += ` ${name}="${escapeHtml(val)}"`;
          }
        }
        out += `<${tag}${attrs}>`;
      }
      lastIndex = tagRegex.lastIndex;
    }
    out += escapeHtml(html.slice(lastIndex));
    return out;
  };
}

// helper to strip inline HTML for internal rendering
function stripHtmlInline(s = '') {
  return String(s).replace(/<[^>]+>/g, '');
}

// renderContentWithCodeSync
function renderContentWithCodeSync(content) {
  if (content == null) return '';
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let m;
  let out = '';
  while ((m = regex.exec(content)) !== null) {
    const index = m.index;
    if (index > lastIndex) {
      const txt = content.slice(lastIndex, index);
      out += escapeHtml(stripHtmlInline(txt));
    }
    out += formatCodeBlock(m[2], m[1] || 'js');
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    out += escapeHtml(stripHtmlInline(content.slice(lastIndex)));
  }
  return out;
}

// asyncFormatText
export function asyncFormatText(text, options = {}) {
  return new Promise((resolve) => {
    if (!text || String(text).length < (options.threshold || 2000)) {
      const raw = renderContentWithCodeSync(text);
      const sanitized = createSanitizer()(raw);
      resolve(sanitized);
      return;
    }
    const chunkSize = options.chunkSize || 2000;
    const str = String(text);
    let i = 0;
    let acc = '';
    function step() {
      const part = str.slice(i, i + chunkSize);
      acc += renderContentWithCodeSync(part);
      i += chunkSize;
      if (i < str.length) {
        setTimeout(step, 0);
      } else {
        const sanitized = createSanitizer()(acc);
        resolve(sanitized);
      }
    }
    setTimeout(step, 0);
  });
}

let currentCodeTheme = '';
export function setCodeTheme(themeClass) {
  currentCodeTheme = String(themeClass || '');
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('code-theme-light','code-theme-dark');
    if (currentCodeTheme) document.body.classList.add(currentCodeTheme);
  }
}