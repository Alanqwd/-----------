
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


const searchInput = document.getElementById('searchInput');
const postsContainer = document.getElementById('postsContainer');
const noResultsDiv = document.getElementById('noResults');
const categoriesDiv = document.getElementById('categories');
const sortDateBtn = document.getElementById('sortDate');
const sortViewsBtn = document.getElementById('sortViews');
const themeLight = document.getElementById('themeLight');
const themeDark = document.getElementById('themeDark');
const formatPanel = document.getElementById('formatPanel');
const panelBefore = document.getElementById('panelBefore');
const panelAfter = document.getElementById('panelAfter');
const panelEdit = document.getElementById('panelEdit');
const panelSave = document.getElementById('panelSave');
const panelClose = document.getElementById('panelClose');


const addPostForm = document.getElementById('addPostForm');
const postTitle = document.getElementById('postTitle');
const postTags = document.getElementById('postTags');
const postContent = document.getElementById('postContent');
const cancelAddPost = document.getElementById('cancelAddPost');

let filteredPosts = [...posts];
let currentCategory = 'all';
let activePostId = null;


posts.forEach(p => { p.likes = p.likes || 0; p.deleted = false; });

function openFormatPanelForPost(post) {
  activePostId = post.id;
  const plain = stripHtml(post.content);
  panelBefore.textContent = plain;
  panelEdit.value = plain;
  panelAfter.textContent = plain;
  formatPanel.style.display = 'block';
  formatPanel.setAttribute('aria-hidden','false');
  panelEdit.focus();
}

function closeFormatPanel() {
  activePostId = null;
  formatPanel.style.display = 'none';
  formatPanel.setAttribute('aria-hidden','true');
}


panelClose && panelClose.addEventListener('click', () => closeFormatPanel());

panelEdit && panelEdit.addEventListener('input', () => {
  const edited = panelEdit.value;
  panelAfter.textContent = edited;
});

panelSave && panelSave.addEventListener('click', () => {
  if (activePostId == null) return;
  const p = posts.find(x => x.id === activePostId);
  if (!p) return;
  p.content = panelEdit.value;
  delete p.formattedContent;
  renderPosts(filteredPosts, searchInput ? searchInput.value : '');
  closeFormatPanel();
});


function openAddPostForm(focusField = postTitle) {
  if (!addPostForm) return;
  addPostForm.style.display = '';
  addPostForm.setAttribute('aria-hidden','false');
  focusField && focusField.focus();
  document.body.classList.add('modal-open');
}
function closeAddPostForm() {
  if (!addPostForm) return;
  addPostForm.style.display = 'none';
  addPostForm.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  addPostForm.reset();
}
cancelAddPost && cancelAddPost.addEventListener('click', closeAddPostForm);


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
    if (post.deleted) return;
    const li = document.createElement('li');
    li.className = 'post';
    li.setAttribute('data-id', String(post.id));
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'article');
    li.setAttribute('aria-labelledby', `post-title-${post.id}`);

    const highlightedTitle = keywordHighlighter(escapeHtml(post.title));
    const plainForPreview = stripHtml(post.content);
    const safePreview = truncate(200)(plainForPreview);
    const fullContentHtml = post.formattedContent || renderContentWithCode(post.content, keywordHighlighter);
    const highlightedTags = post.tags.map(tag => keywordHighlighter(escapeHtml(tag))).join(', ');

    const wordCount = getWordCount(plainForPreview);
    const readingTimeMinute = getReadingTime(plainForPreview);
    const averageWordLength = getAverageWordLength(plainForPreview);
    const sentenceCount = getSentenceCount(plainForPreview);

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <h3 id="post-title-${post.id}" style="margin:0;">${highlightedTitle}</h3>
        <div>
          <button class="format-post-btn" data-id="${post.id}">Форматировать текст</button>
          <button class="like-btn" data-id="${post.id}" aria-pressed="${post.likes>0 ? 'true' : 'false'}" title="Лайк (Space/Enter)">❤ <span class="like-count">${post.likes}</span></button>
        </div>
      </div>
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

themeLight && themeLight.addEventListener('click', ()=> setCodeTheme('code-theme-light'));
themeDark && themeDark.addEventListener('click', ()=> setCodeTheme('code-theme-dark'));


addPostForm && addPostForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = (postTitle && postTitle.value || '').trim();
  const tags = (postTags && postTags.value || '').split(',').map(s => s.trim()).filter(Boolean);
  const content = postContent ? postContent.value : '';
  if (!title) {
    postTitle && postTitle.focus();
    return;
  }
  const newPost = {
    id: Date.now(),
    title,
    content,
    tags,
    date: new Date(),
    datePublished: formatDate(new Date()),
    views: 0,
    likes: 0
  };
  posts.unshift(newPost);
  applyFilters();
  closeAddPostForm();
});


postsContainer && postsContainer.addEventListener('click', (ev) => {
  const likeBtn = ev.target.closest('.like-btn');
  if (likeBtn) {
    const id = Number(likeBtn.getAttribute('data-id'));
    const p = posts.find(x => x.id === id);
    if (!p) return;
    p.likes = (p.likes || 0) + 1;
    likeBtn.setAttribute('aria-pressed','true');
    const countEl = likeBtn.querySelector('.like-count');
    if (countEl) countEl.textContent = p.likes;
    return;
  }
  const formatBtn = ev.target.closest('.format-post-btn');
  if (formatBtn) {
    const id = Number(formatBtn.getAttribute('data-id'));
    const post = posts.find(p => p.id === id);
    if (!post) return;
    openFormatPanelForPost(post);
    return;
  }
});


document.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.key === '/') {
    e.preventDefault();
    searchInput && searchInput.focus();
    return;
  }
  

  if (ctrl && (e.key === 'n' || e.key === 'N')) {
    console.log('Esc pressed');
    e.preventDefault();
    openAddPostForm();
    
    return;
  }

  if (e.key === 'Escape') {
    if (formatPanel && formatPanel.style.display !== 'none') {
      closeFormatPanel();
      return;
    }
    if (addPostForm && addPostForm.style.display !== 'none') {
      closeAddPostForm();
      return;
    }
  }
});


addPostForm && addPostForm.addEventListener('keydown', (e) => {
  const isTextArea = e.target === postContent;
  if (e.key === 'Enter') {
    if (isTextArea && !(e.ctrlKey || e.metaKey)) {
      return;
    }
    if (!isTextArea) {
      e.preventDefault();
      addPostForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  }
  if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey)) && isTextArea) {
    e.preventDefault();
    addPostForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
});


let focusedPostIndex = -1;
function focusPostByIndex(idx) {
  const items = Array.from(postsContainer.querySelectorAll('.post'));
  if (!items.length) return;
  if (idx < 0) idx = 0;
  if (idx >= items.length) idx = items.length -1;
  focusedPostIndex = idx;
  items.forEach((it, i) => {
    it.classList.toggle('focused', i === idx);
    if (i === idx) {
      it.focus();
      it.setAttribute('aria-selected','true');
    } else {
      it.removeAttribute('aria-selected');
    }
  });
}

function openEditForFocusedPost() {
  const items = Array.from(postsContainer.querySelectorAll('.post'));
  if (!items.length) return;

  
  const activeEl = document.activeElement;
  let targetPostEl = null;

  if (activeEl && activeEl.classList.contains('post')) {
    targetPostEl = activeEl;
  } else if (activeEl && activeEl.closest('.post')) {

    targetPostEl = activeEl.closest('.post');
  }


  if (!targetPostEl) {
    if (focusedPostIndex >= 0 && focusedPostIndex < items.length) {
      targetPostEl = items[focusedPostIndex];
    } else {
  
      if (items.length > 0) {
        targetPostEl = items[0];
        focusedPostIndex = 0; 
      }
    }
  }

  if (!targetPostEl) return;


  const newIndex = items.indexOf(targetPostEl);
  if (newIndex !== -1) {
      focusedPostIndex = newIndex;
      items.forEach((it, i) => {
        it.classList.toggle('focused', i === newIndex);
        if (i === newIndex) {
            it.focus(); 
            it.setAttribute('aria-selected','true');
        } else {
            it.removeAttribute('aria-selected');
        }
      });
  }

  const id = Number(targetPostEl.getAttribute('data-id'));
  const post = posts.find(x => x.id === id);
  if (post) openFormatPanelForPost(post);
}

postsContainer && postsContainer.addEventListener('keydown', (ev) => {
  const key = ev.key;
  const items = Array.from(postsContainer.querySelectorAll('.post'));
  if (!items.length) return;
  const currentIndex = items.indexOf(document.activeElement);
  if (key === 'ArrowDown') {
    ev.preventDefault();
    focusPostByIndex(currentIndex < 0 ? 0 : Math.min(items.length-1, currentIndex+1));
  } else if (key === 'ArrowUp') {
    ev.preventDefault();
    focusPostByIndex(currentIndex <= 0 ? 0 : currentIndex-1);
  } else if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
    if (currentIndex >=0) {
      ev.preventDefault();
      const el = items[currentIndex];
      const id = Number(el.getAttribute('data-id'));
      const p = posts.find(x=>x.id===id);
      if (!p) return;
      p.likes = (p.likes||0) + 1;
      const likeBtn = el.querySelector('.like-btn');
      if (likeBtn) {
        likeBtn.setAttribute('aria-pressed','true');
        const c = likeBtn.querySelector('.like-count');
        if (c) c.textContent = p.likes;
      }
    }
  } else if (key === 'Delete') {
    if (currentIndex >=0) {
      ev.preventDefault();
      const el = items[currentIndex];
      const id = Number(el.getAttribute('data-id'));
      const pIndex = posts.findIndex(x=>x.id===id);
      if (pIndex === -1) return;
      const confirmed = confirm('Удалить пост?');
      if (!confirmed) return;
      posts.splice(pIndex,1);
      applyFilters();
      setTimeout(()=> focusPostByIndex(Math.min(currentIndex, postsContainer.querySelectorAll('.post').length-1)), 0);
    }
  } else if (key === 'e' || key === 'E') {
    ev.preventDefault();
    openEditForFocusedPost();
  }
});


document.addEventListener('keydown', (e) => {

  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement && document.activeElement.isContentEditable) return;

  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    openEditForFocusedPost();
  }
});


document.addEventListener('focusin', (e) => {
  const t = e.target;
  if (t && t.closest && t.closest('.post')) {
    const parent = t.closest('.post');
    if (parent) parent.classList.add('keyboard-focused');
  }
});
document.addEventListener('focusout', (e) => {
  const t = e.target;
  if (t && t.closest && t.closest('.post')) {
    const parent = t.closest('.post');
    if (parent) parent.classList.remove('keyboard-focused');
  }
});


renderPosts(filteredPosts, '');