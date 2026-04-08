
import { escapeHtml, truncate, highlightKeywords, formatCodeBlock, createSanitizer, setCodeTheme, asyncFormatText } from './text-formatter.js';

function getDates() {
  return [
    new Date(2026, 2, 22),
    new Date(2025, 10, 20),
    new Date(2025, 5, 15),
    new Date(2026, 10, 5)
  ];
}

function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}

const dates = getDates();

const posts = [
  {
    id: 1,
    title: "Первый пост",
    content: "Это содержание первого поста.",
    tags: ["новости", "обзор"],
    date: dates[0],
    datePublished: formatDate(dates[0]),
    views: 150
  },
  {
    id: 2,
    title: "Второй пост",
    content: "Содержимое второго поста просто так.",
    tags: ["просто так", "новости"],
    date: dates[1],
    datePublished: formatDate(dates[1]),
    views: 200
  },
  {
    id: 3,
    title: "Обзор новой одежды",
    content: "Обзор последней одежды сезона:\n```js\nconst price = 17000;\nconsole.log('cdg футболка');\n```\n<p>1) cdg футболка с синими сердечками за 17 тыс.руб. 2) Кеды Crenshaw Skate Club SB Dunk Light Blue за 68 тыс.руб.</p>",
    tags: ["новая одежда", "обзор"],
    date: dates[2],
    datePublished: formatDate(dates[2]),
    views: 300
  },
  {
    id: 4,
    title: "Новости мира",
    content: "Свежие новости: Новая коллекция одежды потрясла модный мир этой весной. Сегодня в крупнейших магазинах и онлайн-бутиках появилась новая коллекция одежды...",
    tags: ["новости"],
    date: dates[3],
    datePublished: formatDate(dates[3]),
    views: 120
  }
];


const searchInput = document.getElementById('searchInput');
const postsContainer = document.getElementById('postsContainer');
const noResultsDiv = document.getElementById('noResults');
const categoriesDiv = document.getElementById('categories');
const sortDateBtn = document.getElementById('sortDate');
const sortViewsBtn = document.getElementById('sortViews');
const formatTextBtn = document.getElementById('formatTextBtn');
const formatModal = document.getElementById('formatModal');
const closeModal = document.getElementById('closeModal');
const exampleBefore = document.getElementById('exampleBefore');
const exampleAfter = document.getElementById('exampleAfter');
const themeLight = document.getElementById('themeLight');
const themeDark = document.getElementById('themeDark');

let filteredPosts = [...posts];
let currentCategory = 'all';


function stripHtml(html = '') { return String(html).replace(/<[^>]+>/g, ''); }
function getWordCount(text = '') { const words = stripHtml(text).trim().match(/\S+/g); return words ? words.length : 0; }
function getReadingTime(text = '', wpm = 200) { const words = getWordCount(text); return Math.max(1, Math.round(words / wpm)); }
function getAverageWordLength(text = '') { const words = stripHtml(text).trim().match(/\S+/g) || []; if (!words.length) return 0; return words.reduce((s,w)=>s+w.length,0)/words.length; }
function getSentenceCount(text = '') { const plain = stripHtml(text).trim(); if (!plain) return 0; const sentences = plain.split(/[.!?]+\s+|\n+/).filter(Boolean); return sentences.length; }


function makeCategoryFilter(category) {
  return function(post) {
    if (!category || category === 'all') return true;
    return post.tags.some(tag => tag.toLowerCase() === category.toLowerCase());
  };
}


const sanitizer = createSanitizer();
function renderContentWithCode(content, keywordHighlighter) {
  if (content == null) return '';
  const parts = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const index = m.index;
    if (index > lastIndex) parts.push({ type: 'text', value: content.slice(lastIndex, index) });
    parts.push({ type: 'code', lang: m[1] || 'js', value: m[2] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) parts.push({ type: 'text', value: content.slice(lastIndex) });

  const raw = parts.map(part => {
    if (part.type === 'text') {
      const plain = stripHtml(part.value);
      const escaped = escapeHtml(plain);
      return keywordHighlighter ? keywordHighlighter(escaped) : escaped;
    } else {
      return formatCodeBlock(part.value, part.lang);
    }
  }).join('');

  return sanitizer(raw);
}


function renderPosts(postsToRender, query) {
  if (!postsContainer) return;
  postsContainer.innerHTML = '';

  if (!postsToRender || postsToRender.length === 0) {
    if (noResultsDiv) noResultsDiv.style.display = 'block';
    return;
  } else {
    if (noResultsDiv) noResultsDiv.style.display = 'none';
  }

  const q = (query || '').trim();
  const keywords = q === '' ? [] : q.split(/\s+/).filter(Boolean);
  const keywordHighlighter = highlightKeywords(keywords, 'highlight');

  postsToRender.forEach(post => {
    const li = document.createElement('li');

    const highlightedTitle = keywordHighlighter(escapeHtml(post.title));
    const plainForPreview = stripHtml(post.content);
    const safePreview = truncate(200)(plainForPreview);
    const fullContentHtml = post.formattedContent || renderContentWithCode(post.content, keywordHighlighter);
    const highlightedTags = post.tags.map(tag => keywordHighlighter(escapeHtml(tag))).join(', ');

    const wordCount = getWordCount(plainForPreview);
    const readingTimeMinute = getReadingTime(plainForPreview);
    const averageWordLength = getAverageWordLength(plainForPreview);
    const sentenceCount = getSentenceCount(plainForPreview);

    li.className = 'post';
    li.innerHTML = `
      <h3>${highlightedTitle}</h3>
      <div class="preview">${safePreview}</div>
      <div class="full-content">${fullContentHtml}</div>
      <p><strong>Теги:</strong> ${highlightedTags}</p>
      <p>
        <em>Дата:</em> ${post.datePublished} |
        Просмотры: ${post.views}
      </p>
      <p>
        Примерное время чтения: ${readingTimeMinute} мин |
        Количество слов: ${wordCount} |
        Средняя длина слова: ${averageWordLength.toFixed(2)} символов |
        Предложений: ${sentenceCount}
      </p>
    `;
    postsContainer.appendChild(li);
  });
}


function applyFilters() {
  const query = (searchInput && searchInput.value || '').trim().toLowerCase();
  const categoryFilter = makeCategoryFilter(currentCategory);

  if (query === '') {
    filteredPosts = posts.filter(categoryFilter);
  } else {
    filteredPosts = posts.filter(post => {
      const inTitle = post.title.toLowerCase().includes(query);
      const inContent = stripHtml(post.content).toLowerCase().includes(query);
      const inTags = post.tags.some(tag => tag.toLowerCase().includes(query));
      return (inTitle || inContent || inTags) && categoryFilter(post);
    });
  }
  renderPosts(filteredPosts, searchInput ? searchInput.value : '');
}


function debounce(fn, wait = 250) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}


if (categoriesDiv) {
  categoriesDiv.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    currentCategory = btn.getAttribute('data-cat') || 'all';
    categoriesDiv.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
}

if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));

if (sortDateBtn) {
  sortDateBtn.addEventListener('click', () => {
    filteredPosts.sort((a, b) => b.date - a.date);
    renderPosts(filteredPosts, searchInput ? searchInput.value : '');
  });
}

if (sortViewsBtn) {
  sortViewsBtn.addEventListener('click', () => {
    filteredPosts.sort((a, b) => b.views - a.views);
    renderPosts(filteredPosts, searchInput ? searchInput.value : '');
  });
}

if (formatTextBtn) {
  formatTextBtn.addEventListener('click', async () => {
    formatTextBtn.disabled = true;
    formatTextBtn.textContent = 'Форматируется...';
    const sample = posts[0] ? posts[0].content : '';
    exampleBefore.textContent = sample;
    try {
      const formatted = await asyncFormatText(sample);
      exampleAfter.innerHTML = formatted;
   
      posts.forEach((p) => {
        asyncFormatText(p.content).then(html => {
          p.formattedContent = html;
          renderPosts(filteredPosts, searchInput ? searchInput.value : '');
        });
      });
    } catch (err) {
      exampleAfter.textContent = 'Ошибка форматирования';
      console.error(err);
    } finally {
      formatTextBtn.disabled = false;
      formatTextBtn.textContent = 'Форматировать текст';
      if (formatModal) { formatModal.style.display = 'block'; formatModal.setAttribute('aria-hidden','false'); }
    }
  });
}

closeModal && closeModal.addEventListener('click', () => { if (formatModal) { formatModal.style.display='none'; formatModal.setAttribute('aria-hidden','true'); } });

themeLight && themeLight.addEventListener('click', ()=> setCodeTheme('code-theme-light'));
themeDark && themeDark.addEventListener('click', ()=> setCodeTheme('code-theme-dark'));


renderPosts(filteredPosts, '');
