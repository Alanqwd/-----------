import { escapeHtml, truncate, highlightKeywords, formatCodeBlock, createSanitizer, setCodeTheme, asyncFormatText } from './text-formatter.js';

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

let posts = [
  {
    id: 1,
    title: "Первый пост",
    content: "Это содержание первого поста.",
    tags: ["новости", "обзор"],
    date: baseDates[0],
    datePublished: formatDate(baseDates[0]),
    views: 150,
    image: "https://via.placeholder.com/600x300/3498db/ffffff?text=Post+1"
  },
  {
    id: 2,
    title: "Второй пост",
    content: "Содержимое второго поста просто так.",
    tags: ["просто так", "новости"],
    date: baseDates[1],
    datePublished: formatDate(baseDates[1]),
    views: 200,
    image: "https://via.placeholder.com/600x300/e74c3c/ffffff?text=Post+2"
  },
  {
    id: 3,
    title: "Обзор новой одежды",
    content: "Обзор последней одежды сезона:\n```js\nconst price = 17000;\nconsole.log('cdg футболка');\n```\n<p>1) cdg футболка с синими сердечками за 17 тыс.руб.</p>",
    tags: ["новая одежда", "обзор"],
    date: baseDates[2],
    datePublished: formatDate(baseDates[2]),
    views: 300,
    image: "https://via.placeholder.com/600x300/2ecc71/ffffff?text=Fashion"
  },
  {
    id: 4,
    title: "Новости мира",
    content: "Свежие новости: Новая коллекция одежды потрясла модный мир этой весной.",
    tags: ["новости"],
    date: baseDates[3],
    datePublished: formatDate(baseDates[3]),
    views: 120,
    image: "https://via.placeholder.com/600x300/f1c40f/000000?text=News"
  }
];

// Генерация 30+ постов
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
        image: `https://via.placeholder.com/600x300/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=Image+${i+5}`
    });
}

posts.sort((a, b) => b.date - a.date);

// --- УТИЛИТЫ ---

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

let filteredPosts = [...posts];
let currentCategory = 'all';
let activePostId = null;

// Pagination State
let visibleCount = ITEMS_PER_PAGE; // ИСПРАВЛЕНО: Инициализируем сразу первым блоком
const ITEMS_PER_PAGE = 5;
let isFetching = false;

// Virtual Scroll Config
const ITEM_HEIGHT = 280; 
const BUFFER_ITEMS = 5; 

posts.forEach(p => { p.likes = p.likes || 0; p.deleted = false; });

// --- FORMAT PANEL LOGIC ---

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
panelEdit && panelEdit.addEventListener('input', () => { panelAfter.textContent = panelEdit.value; });
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

// --- VIRTUAL SCROLL RENDER LOGIC ---

function createPostElement(post, query) {
    if (post.deleted) return null;
    const li = document.createElement('div');
    li.className = 'virtual-item fade-in';
    li.setAttribute('data-id', String(post.id));
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'article');
    li.style.height = `${ITEM_HEIGHT}px`; 
    li.style.overflow = 'hidden';

    const q = (query || '').trim();
    const keywords = q === '' ? [] : q.split(/\s+/).filter(Boolean);
    const keywordHighlighter = highlightKeywords(keywords, 'highlight');

    const highlightedTitle = keywordHighlighter(escapeHtml(post.title));
    const plainForPreview = stripHtml(post.content);
    const safePreview = truncate(150)(plainForPreview);
    const fullContentHtml = post.formattedContent || renderContentWithCode(post.content, keywordHighlighter);
    const highlightedTags = post.tags.map(tag => keywordHighlighter(escapeHtml(tag))).join(', ');

    const imgHtml = post.image 
        ? `<img data-src="${post.image}" class="post-img lazy-img" alt="Img" loading="lazy" style="max-height: 100px;">` 
        : '';

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <h3 style="margin:0; font-size: 1.1em;">${highlightedTitle}</h3>
        <div style="display:flex; gap:5px;">
          <button class="format-post-btn" data-id="${post.id}" style="font-size:0.8em;">Формат</button>
          <button class="like-btn" data-id="${post.id}" aria-pressed="${post.likes>0 ? 'true' : 'false'}" title="Лайк">❤ <span class="like-count">${post.likes}</span></button>
        </div>
      </div>
      ${imgHtml}
      <div class="preview" style="font-size: 0.9em; color: #444;">${safePreview}</div>
      <div class="full-content" style="display:none; margin-top:5px; font-size:0.9em;">${fullContentHtml}</div>
      <button class="toggle-content-btn" style="margin-top:5px; font-size:0.8em; cursor:pointer; background:none; border:none; color:blue; text-decoration:underline;">Показать полностью</button>
      <div style="margin-top:5px; font-size: 0.8em; color: #666;">
         Теги: ${highlightedTags} | Дата: ${post.datePublished} | 👁 ${post.views}
      </div>
    `;
    
    const toggleBtn = li.querySelector('.toggle-content-btn');
    const fullContent = li.querySelector('.full-content');
    const previewDiv = li.querySelector('.preview');
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = fullContent.style.display === 'none';
        fullContent.style.display = isHidden ? 'block' : 'none';
        previewDiv.style.display = isHidden ? 'none' : 'block';
        toggleBtn.textContent = isHidden ? 'Скрыть' : 'Показать полностью';
    });

    return li;
}

function renderVirtualScroll(query) {
    if (!virtualScrollerContainer) return;

    const containerHeight = virtualScrollerContainer.clientHeight || 600;
    const scrollTop = virtualScrollerContainer.scrollTop;
    
    const totalAvailable = filteredPosts.length;
    
    // Расчет индексов
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS;
    let endIndex = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_ITEMS;

    startIndex = Math.max(0, startIndex);
    
    // upperLimit - это "логический" конец списка (куда доскроллил пользователь или сколько загрузило кнопкой)
    const upperLimit = visibleCount; 
    
    // endIndex не может быть больше upperLimit и больше общего количества
    endIndex = Math.min(upperLimit, totalAvailable, endIndex);

    virtualScrollerContainer.innerHTML = '';
    
    // Верхняя распорка
    const topSpacer = document.createElement('div');
    topSpacer.className = 'virtual-spacer';
    topSpacer.style.height = `${startIndex * ITEM_HEIGHT}px`;
    virtualScrollerContainer.appendChild(topSpacer);

    // Рендер видимых элементов
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
        const post = filteredPosts[i];
        const el = createPostElement(post, query);
        if (el) {
            fragment.appendChild(el);
        }
    }
    virtualScrollerContainer.appendChild(fragment);

    // Нижняя распорка
    // Она должна компенсировать все, что ниже endIndex, включая те элементы, которые еще не "загружены" (не входят в visibleCount)
    // Чтобы скроллбар имел правильную длину относительно visibleCount
    const itemsBelow = upperLimit - endIndex;
    
    const bottomSpacer = document.createElement('div');
    bottomSpacer.className = 'virtual-spacer';
    bottomSpacer.style.height = `${Math.max(0, itemsBelow * ITEM_HEIGHT)}px`;
    virtualScrollerContainer.appendChild(bottomSpacer);
    
    postsCountInfo.textContent = `Постов всего: ${filteredPosts.length} | Загружено: ${visibleCount}`;
    
    observeImages();
    updateControlsState(upperLimit, totalAvailable);
}

function updateControlsState(currentShown, total) {
    loader.style.display = 'none';
    isFetching = false;

    if (currentShown >= total) {
        loadMoreBtn.style.display = 'none';
        endMessage.style.display = 'block';
    } else {
        endMessage.style.display = 'none';
        if (manualLoadToggle.checked) {
            loadMoreBtn.style.display = 'inline-block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function loadMorePosts() {
    if (isFetching) return;
    isFetching = true;
    loader.style.display = 'block';
    if(loadMoreBtn) loadMoreBtn.disabled = true;

    setTimeout(() => {
        try {
            visibleCount += ITEMS_PER_PAGE;
            renderVirtualScroll(searchInput ? searchInput.value : '');
        } catch (e) {
            console.error(e);
        } finally {
            loader.style.display = 'none';
            if(loadMoreBtn) loadMoreBtn.disabled = false;
        }
    }, 400);
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
  
  // Сброс пагинации при фильтрации
  visibleCount = ITEMS_PER_PAGE;
  
  virtualScrollerContainer.scrollTop = 0;
  renderVirtualScroll(query);
}

function observeImages() {
    const images = document.querySelectorAll('.lazy-img');
    if (!images.length) return;
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy-img');
                observer.unobserve(img);
            }
        });
    });
    images.forEach(img => imageObserver.observe(img));
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
    filteredPosts.sort((a, b) => b.date - a.date);
    applyFilters();
  });
}
if (sortViewsBtn) {
  sortViewsBtn.addEventListener('click', () => {
    filteredPosts.sort((a, b) => b.views - a.views);
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
    likes: 0,
    image: "https://via.placeholder.com/600x300/9b59b6/ffffff?text=New"
  };
  posts.unshift(newPost);
  applyFilters();
  closeAddPostForm();
});

virtualScrollerContainer.addEventListener('click', (ev) => {
  const likeBtn = ev.target.closest('.like-btn');
  if (likeBtn) {
    const id = Number(likeBtn.getAttribute('data-id'));
    const p = posts.find(x => x.id === id);
    if (!p) return;
    p.likes++;
    likeBtn.querySelector('.like-count').textContent = p.likes;
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

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMorePosts);
}

if (manualLoadToggle) {
    manualLoadToggle.addEventListener('change', () => {
        // При переключении режима просто перерисовываем контролы, данные не сбрасываем
        renderVirtualScroll(searchInput ? searchInput.value : '');
    });
}

// Infinite Scroll Logic
if (virtualScrollerContainer) {
    virtualScrollerContainer.addEventListener('scroll', () => {
        localStorage.setItem('virtualScrollPos', virtualScrollerContainer.scrollTop);

        // Если ручной режим - автоскролл отключен
        if (manualLoadToggle.checked) return;

        const { scrollTop, scrollHeight, clientHeight } = virtualScrollerContainer;
        // Триггер загрузки за 200px до конца
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            if (visibleCount < filteredPosts.length) {
                loadMorePosts();
            }
        }
    });
}

// Keyboard Navigation W/S
document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        virtualScrollerContainer.scrollBy({ top: -ITEM_HEIGHT, behavior: 'smooth' });
    } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        virtualScrollerContainer.scrollBy({ top: ITEM_HEIGHT, behavior: 'smooth' });
    }
    
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
        if (formatPanel.style.display !== 'none') closeFormatPanel();
        if (addPostForm.style.display !== 'none') closeAddPostForm();
    }
});

function debounce(fn, wait = 250) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Init
window.addEventListener('load', () => {
    const savedPos = localStorage.getItem('virtualScrollPos');
    
    // Первый рендер
    applyFilters();

    if (savedPos) {
        setTimeout(() => {
            virtualScrollerContainer.scrollTop = parseInt(savedPos);
        }, 50);
    }
});