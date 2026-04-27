import { escapeHtml, truncate, highlightKeywords, formatCodeBlock, createSanitizer, setCodeTheme } from './text-formatter.js';

// --- ДАННЫЕ ---

function getDates() {
  const dates = [];
  dates.push(new Date(2026, 2, 22));
  dates.push(new Date(2025, 10, 20));
  dates.push(new Date(2025, 5, 15));
  dates.push(new Date(2026, 10, 5));
  return dates;
}

function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}

const baseDates = getDates();

// Первые 4 поста с добавленными изображениями
let posts = [
  {
    id: 1,
    title: "Первый пост",
    content: "Это содержание первого поста.",
    tags: ["новости", "обзор"],
    date: baseDates[0],
    datePublished: formatDate(baseDates[0]),
    views: 150,
      
  },
  {
    id: 2,
    title: "Второй пост",
    content: "Содержимое второго поста просто так.",
    tags: ["просто так", "новости"],
    date: baseDates[1],
    datePublished: formatDate(baseDates[1]),
    views: 200,
    image: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=600&h=300&fit=crop" // Абстракция/Лампочка
  },
  {
    id: 3,
    title: "Обзор новой одежды",
    content: "Обзор последней одежды сезона:\n```js\nconst price = 17000;\nconsole.log('cdg футболка');\n```\n<p>1) cdg футболка с синими сердечками за 17 тыс.руб.</p>",
    tags: ["новая одежда", "обзор"],
    date: baseDates[2],
    datePublished: formatDate(baseDates[2]),
    views: 300,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=300&fit=crop" // Одежда
  },
  {
    id: 4,
    title: "Новости мира",
    content: "Свежие новости: Новая коллекция одежды потрясла модный мир этой весной.",
    tags: ["новости"],
    date: baseDates[3],
    datePublished: formatDate(baseDates[3]),
    views: 120,
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=300&fit=crop" // Новости/Газеты
  }
];

// Генерация дополнительных постов
const extraTitles = ["Анализ трендов", "Код ревью", "Прогулка по парку", "Новый JS фреймворк", "Рецепт пиццы", "CSS Grid vs Flexbox", "История одного бага", "Утро программиста", "Выбор монитора", "Тест производительности"];
const extraContents = [
    "Здесь мы обсуждаем важные аспекты разработки.\n```python\nprint('Hello World')\n```",
    "Просто мысли вслух о жизни и коде.",
    "Сегодня отличный день для прогулки. Погода шепчет.",
    "Вышел новый релиз библиотеки X. Давайте посмотрим, что изменилось.",
    "Ингредиенты: тесто, сыр, томатный соус. Готовить 15 минут."
];
const categories = ["новости", "обзор", "новая одежда", "просто так"];

for (let i = 0; i < 30; i++) {
    const randCat = categories[Math.floor(Math.random() * categories.length)];
    const randTitle = extraTitles[Math.floor(Math.random() * extraTitles.length)] + ` #${i + 5}`;
    const randContent = extraContents[Math.floor(Math.random() * extraContents.length)];
    const d = new Date(2025, Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1);
    
    posts.push({
        id: 100 + i,
        title: randTitle,
        content: randContent,
        tags: [randCat],
        date: d,
        datePublished: formatDate(d),
        views: Math.floor(Math.random() * 1000),
        likes: 0,
        deleted: false,
        // АВТОМАТИЧЕСКАЯ КАРТИНКА ДЛЯ СГЕНЕРИРОВАННЫХ ПОСТОВ
        image: `https://picsum.photos/seed/${100 + i}/600/300`
    });
}

posts.sort((a, b) => b.date - a.date);

// --- УТИЛИТЫ ---

function stripHtml(html = '') { return String(html).replace(/<[^>]+>/g, ''); }

function makeCategoryFilter(category) {
  return function(post) {
    if (!category || category === 'all') return true;
    return (post.tags || []).some(tag => tag.toLowerCase() === category.toLowerCase());
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

// --- DOM ELEMENTS ---

const searchInput = document.getElementById('searchInput');
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
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loader = document.getElementById('loader');
const endMessage = document.getElementById('endMessage');
const manualLoadToggle = document.getElementById('manualLoadToggle');
const virtualScrollerContainer = document.getElementById('virtual-scroller');
const postsCountInfo = document.getElementById('postsCountInfo');

// --- STATE ---

const ITEMS_PER_PAGE = 5;
let loadedCount = ITEMS_PER_PAGE; 
let isFetching = false;

let filteredPosts = [...posts];
let currentCategory = 'all';
let activePostId = null;

posts.forEach(p => { p.likes = p.likes || 0; p.deleted = false; });

// --- FORMAT PANEL LOGIC ---

function openFormatPanelForPost(post) {
  activePostId = post.id;
  const plain = stripHtml(post.content);
  if (panelBefore) panelBefore.textContent = plain;
  if (panelEdit) panelEdit.value = plain;
  if (panelAfter) panelAfter.textContent = plain;
  if (formatPanel) {
    formatPanel.style.display = 'block';
    formatPanel.setAttribute('aria-hidden','false');
  }
  panelEdit && panelEdit.focus();
}

function closeFormatPanel() {
  activePostId = null;
  if (formatPanel) {
    formatPanel.style.display = 'none';
    formatPanel.setAttribute('aria-hidden','true');
  }
}

panelClose && panelClose.addEventListener('click', () => closeFormatPanel());
panelEdit && panelEdit.addEventListener('input', () => { if (panelAfter) panelAfter.textContent = panelEdit.value; });
panelSave && panelSave.addEventListener('click', () => {
  if (activePostId == null) return;
  const p = posts.find(x => x.id === activePostId);
  if (!p) return;
  p.content = panelEdit.value;
  delete p.formattedContent;
  applyFilters();
  closeFormatPanel();
});

// --- ADD POST FORM ---

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

// --- RENDER LOGIC ---

function createPostElement(post, query) {
    if (!post || post.deleted) return null;
    const li = document.createElement('div');
    li.className = 'post-item fade-in';
    li.setAttribute('data-id', String(post.id));
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'article');
    
    li.style.border = '1px solid #eee';
    li.style.padding = '15px';
    li.style.marginBottom = '15px';
    li.style.background = '#fff';
    li.style.borderRadius = '8px';
    li.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';

    const q = (query || '').trim();
    const keywords = q === '' ? [] : q.split(/\s+/).filter(Boolean);
    const keywordHighlighter = highlightKeywords(keywords, 'highlight');

    const highlightedTitle = keywordHighlighter(escapeHtml(post.title));
    const plainForPreview = stripHtml(post.content);
    const safePreview = truncate(150)(plainForPreview);
    const fullContentHtml = post.formattedContent || renderContentWithCode(post.content, keywordHighlighter);
    const highlightedTags = (post.tags || []).map(tag => keywordHighlighter(escapeHtml(tag))).join(', ');

    // БЛОК ИЗОБРАЖЕНИЯ
    const imgHtml = post.image 
      ? `<img src="${post.image}" alt="Картинка поста" style="width:100%; height:200px; object-fit:cover; border-radius:6px; margin-bottom:12px; display:block;" loading="lazy">` 
      : '';

    li.innerHTML = `
      ${imgHtml}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h3 style="margin:0; font-size: 1.2em;">${highlightedTitle}</h3>
        <div style="display:flex; gap:8px;">
          <button class="format-post-btn" data-id="${post.id}" style="font-size:0.9em; padding: 4px 8px; cursor:pointer;">Формат</button>
          <button class="like-btn" data-id="${post.id}" aria-pressed="${post.likes>0 ? 'true' : 'false'}" title="Лайк" style="cursor:pointer; background:none; border:1px solid #ddd; padding: 4px 8px; border-radius:4px;">❤ <span class="like-count">${post.likes}</span></button>
        </div>
      </div>
      
      <div class="preview" style="font-size: 1em; color: #333; line-height: 1.5;">${safePreview}</div>
      <div class="full-content" style="display:none; margin-top:10px; font-size:1em; line-height: 1.6;">${fullContentHtml}</div>
      <button class="toggle-content-btn" style="margin-top:10px; font-size:0.9em; cursor:pointer; background:none; border:none; color:#007bff; text-decoration:underline; padding:0;">Показать полностью</button>
      
      <div style="margin-top:15px; padding-top:10px; border-top:1px solid #f0f0f0; font-size: 0.85em; color: #777; display:flex; justify-content:space-between; flex-wrap:wrap; gap:5px;">
         <span>Теги: ${highlightedTags}</span>
         <span>Дата: ${post.datePublished} | 👁 ${post.views}</span>
      </div>
    `;

    const toggleBtn = li.querySelector('.toggle-content-btn');
    const fullContent = li.querySelector('.full-content');
    const previewDiv = li.querySelector('.preview');

    toggleBtn && toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = fullContent.style.display === 'none';
        fullContent.style.display = isHidden ? 'block' : 'none';
        previewDiv.style.display = isHidden ? 'none' : 'block';
        toggleBtn.textContent = isHidden ? 'Скрыть' : 'Показать полностью';
    });

    return li;
}

function renderList(query) {
    if (!virtualScrollerContainer) return;

    const totalAvailable = filteredPosts.length;
    const effectiveLoaded = Math.min(loadedCount, totalAvailable);

    virtualScrollerContainer.innerHTML = '';

    for (let i = 0; i < effectiveLoaded; i++) {
        const post = filteredPosts[i];
        const el = createPostElement(post, query);
        if (el) virtualScrollerContainer.appendChild(el);
    }

    if (postsCountInfo) postsCountInfo.textContent = `Постов всего: ${totalAvailable} | Показано: ${effectiveLoaded}`;
    updateControlsState(effectiveLoaded, totalAvailable);

    if (noResultsDiv) noResultsDiv.style.display = totalAvailable === 0 ? 'block' : 'none';
}

function updateControlsState(currentShown, total) {
    if (!loader || !loadMoreBtn || !endMessage) return;
    loader.style.display = 'none';
    isFetching = false;

    if (currentShown >= total) {
        loadMoreBtn.style.display = 'none';
        endMessage.style.display = total > 0 ? 'block' : 'none';
    } else {
        endMessage.style.display = 'none';
        if (manualLoadToggle && manualLoadToggle.checked) {
            loadMoreBtn.style.display = 'inline-block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function loadMorePosts() {
    if (isFetching) return;
    if (loadedCount >= filteredPosts.length) return;

    isFetching = true;
    if (loader) loader.style.display = 'block';
    if (loadMoreBtn) loadMoreBtn.disabled = true;

    setTimeout(() => {
        loadedCount += ITEMS_PER_PAGE;
        renderList(searchInput ? searchInput.value : '');
        isFetching = false;
        if (loader) loader.style.display = 'none';
        if (loadMoreBtn) loadMoreBtn.disabled = false;
    }, 300);
}

function applyFilters() {
  const query = (searchInput && searchInput.value || '').trim().toLowerCase();
  const categoryFilter = makeCategoryFilter(currentCategory);

  if (query === '') {
    filteredPosts = posts.filter(categoryFilter);
  } else {
    filteredPosts = posts.filter(post => {
      const inTitle = post.title && post.title.toLowerCase().includes(query);
      const inContent = stripHtml(post.content || '').toLowerCase().includes(query);
      const inTags = (post.tags || []).some(tag => tag.toLowerCase().includes(query));
      return (inTitle || inContent || inTags) && categoryFilter(post);
    });
  }

  loadedCount = ITEMS_PER_PAGE;
  renderList(query);
}

// --- EVENT LISTENERS ---

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
    posts.sort((a, b) => b.date - a.date);
    applyFilters();
  });
}
if (sortViewsBtn) {
  sortViewsBtn.addEventListener('click', () => {
    posts.sort((a, b) => b.views - a.views);
    applyFilters();
  });
}

themeLight && themeLight.addEventListener('click', ()=> setCodeTheme('code-theme-light'));
themeDark && themeDark.addEventListener('click', ()=> setCodeTheme('code-theme-dark'));

addPostForm && addPostForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = (postTitle && postTitle.value || '').trim();
  const tags = (postTags && postTags.value || '').split(',').map(s => s.trim()).filter(Boolean);
  const content = postContent ? postContent.value : '';
  if (!title) return;

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

if (virtualScrollerContainer) {
  virtualScrollerContainer.addEventListener('click', (ev) => {
    const likeBtn = ev.target.closest('.like-btn');
    if (likeBtn) {
      const id = Number(likeBtn.getAttribute('data-id'));
      const p = posts.find(x => x.id === id);
      if (!p) return;
      p.likes++;
      const countSpan = likeBtn.querySelector('.like-count');
      if (countSpan) countSpan.textContent = p.likes;
      likeBtn.setAttribute('aria-pressed','true');
      return;
    }
    const formatBtn = ev.target.closest('.format-post-btn');
    if (formatBtn) {
      const id = Number(formatBtn.getAttribute('data-id'));
      const post = posts.find(p => p.id === id);
      if (post) openFormatPanelForPost(post);
    }
  });
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMorePosts);
}

if (manualLoadToggle) {
    manualLoadToggle.addEventListener('change', () => {
        renderList(searchInput ? searchInput.value : '');
    });
}

document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === '/') {
        e.preventDefault();
        searchInput && searchInput.focus();
    }
    if (ctrl && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        openAddPostForm();
    }
    if (e.key === 'Escape') {
        if (formatPanel && formatPanel.style.display !== 'none') closeFormatPanel();
        if (addPostForm && addPostForm.style.display !== 'none') closeAddPostForm();
    }
});

function debounce(fn, wait = 250) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

window.addEventListener('load', () => {
    applyFilters();
});