import { escapeHtml, truncate, highlightKeywords, formatCodeBlock, createSanitizer, setCodeTheme } from './text-formatter.js';



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
    image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-260nw-2518068461.jpg"
  },
  {
    id: 2,
    title: "Второй пост",
    content: "Содержимое второго поста просто так.",
    tags: ["просто так", "новости"],
    date: baseDates[1],
    datePublished: formatDate(baseDates[1]),
    views: 200,
    image: "https://www.shutterstock.com/image-vector/emoticon-emoji-smile-pixel-art-600w-1806013249.jpg" // Абстракция/Лампочка
  },
  {
    id: 3,
    title: "Обзор новой одежды",
    content: "Обзор последней одежды сезона:\n```js\nconst price = 17000;\nconsole.log('cdg футболка');\n```\n<p>1) cdg футболка с синими сердечками за 17 тыс.руб.</p>",
    tags: ["новая одежда", "обзор"],
    date: baseDates[2],
    datePublished: formatDate(baseDates[2]),
    views: 300,
    image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067583.jpg" // Одежда
  },
  {
    id: 4,
    title: "Новости мира",
    content: "Свежие новости: Новая коллекция одежды потрясла модный мир этой весной.",
    tags: ["новости"],
    date: baseDates[3],
    datePublished: formatDate(baseDates[3]),
    views: 120,
    image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" // Новости/Газеты
  }
];
// === 31 ДОПОЛНИТЕЛЬНЫЙ ПОСТ ===
// === 31 ДОПОЛНИТЕЛЬНЫЙ ПОСТ ===
const additionalPosts = [
  { id: 5, title: "Тренды весны 2026", content: "Обзор модных тенденций нового сезона.", tags: ["новая одежда", "обзор"], date: new Date(2026, 2, 10), datePublished: formatDate(new Date(2026, 2, 10)), views: 245, image: "https://placehold.co/50x50/AA96DA/white?text=5" },
  { id: 6, title: "JavaScript советы", content: "Полезные приёмы для повседневной разработки:\n```js\nconst sum = (a, b) => a + b;\n```", tags: ["обзор"], date: new Date(2025, 8, 5), datePublished: formatDate(new Date(2025, 8, 5)), views: 189, image: "https://placehold.co/50x50/FCBAD3/white?text=6" },
  { id: 7, title: "Прогулка в парке", content: "Сегодня отличный день для отдыха на свежем воздухе.", tags: ["просто так"], date: new Date(2025, 6, 20), datePublished: formatDate(new Date(2025, 6, 20)), views: 98, image: "https://placehold.co/50x50/FFFFD2/333?text=7" },
  { id: 8, title: "Новый фреймворк", content: "Вышел релиз версии 3.0. Разбираем нововведения.", tags: ["новости", "обзор"], date: new Date(2026, 1, 14), datePublished: formatDate(new Date(2026, 1, 14)), views: 312, image: "https://placehold.co/50x50/A8E6CF/333?text=8" },
  { id: 9, title: "Рецепт идеальной пиццы", content: "Ингредиенты: мука, вода, дрожжи, томаты, моцарелла.", tags: ["просто так"], date: new Date(2025, 10, 3), datePublished: formatDate(new Date(2025, 10, 3)), views: 421, image: "https://placehold.co/50x50/FFD3B6/333?text=9" },
  { id: 10, title: "CSS Grid против Flexbox", content: "Сравниваем два подхода к вёрстке:\n```css\ndisplay: grid;\n```", tags: ["обзор"], date: new Date(2025, 4, 18), datePublished: formatDate(new Date(2025, 4, 18)), views: 276, image: "https://placehold.co/50x50/D4A5A5/white?text=10" },
  { id: 11, title: "История одного бага", content: "Как я искал ошибку три дня и нашёл её в одной строке.", tags: ["новости"], date: new Date(2026, 0, 22), datePublished: formatDate(new Date(2026, 0, 22)), views: 154, image: "https://placehold.co/50x50/C7CEEA/333?text=11" },
  { id: 12, title: "Утро программиста", content: "Кофе, план на день, коммиты. Стандартный ритуал.", tags: ["просто так"], date: new Date(2025, 7, 9), datePublished: formatDate(new Date(2025, 7, 9)), views: 203, image: "https://placehold.co/50x50/FFAAA5/333?text=12" },
  { id: 13, title: "Выбор монитора для кода", content: "На что смотреть: разрешение, матрица, частота обновления.", tags: ["обзор"], date: new Date(2025, 11, 1), datePublished: formatDate(new Date(2025, 11, 1)), views: 387, image: "https://placehold.co/50x50/FFB7B2/333?text=13" },
  { id: 14, title: "Тест производительности", content: "Замеряем скорость загрузки и отрисовки:\n```js\nconsole.time('load');\n```", tags: ["новости", "обзор"], date: new Date(2026, 3, 5), datePublished: formatDate(new Date(2026, 3, 5)), views: 167, image: "https://placehold.co/50x50/FFDAC1/333?text=14" },
  { id: 15, title: "Минимализм в одежде", content: "Почему меньше — значит лучше. Подборка базовых вещей.", tags: ["новая одежда", "обзор"], date: new Date(2025, 2, 28), datePublished: formatDate(new Date(2025, 2, 28)), views: 291, image: "https://placehold.co/50x50/B5EAD7/333?text=15" },
  { id: 16, title: "Async/await на практике", content: "Читаемый асинхронный код без Promise-адда:\n```js\nconst data = await fetch(url);\n```", tags: ["обзор"], date: new Date(2025, 9, 12), datePublished: formatDate(new Date(2025, 9, 12)), views: 445, image: "https://placehold.co/50x50/E2F0CB/333?text=16" },
  { id: 17, title: "Осенняя коллекция", content: "Тёплые тона, натуральные ткани, уютные силуэты.", tags: ["новая одежда"], date: new Date(2025, 8, 21), datePublished: formatDate(new Date(2025, 8, 21)), views: 198, image: "https://placehold.co/50x50/FF6B6B/white?text=17" },
  { id: 18, title: "Git: полезные команды", content: "Список команд, которые экономят время:\n```bash\ngit rebase -i HEAD~3\n```", tags: ["обзор"], date: new Date(2026, 2, 3), datePublished: formatDate(new Date(2026, 2, 3)), views: 334, image: "https://placehold.co/50x50/4ECDC4/white?text=18" },
  { id: 19, title: "Кофе и код", content: "Какой сорт бодрит лучше всего? Личный топ-3.", tags: ["просто так"], date: new Date(2025, 5, 7), datePublished: formatDate(new Date(2025, 5, 7)), views: 127, image: "https://placehold.co/50x50/95E1D3/white?text=19" },
  { id: 20, title: "Адаптивная вёрстка", content: "Как сделать сайт удобным на любом устройстве.", tags: ["обзор"], date: new Date(2025, 1, 14), datePublished: formatDate(new Date(2025, 1, 14)), views: 412, image: "https://placehold.co/50x50/F38181/white?text=20" },
  { id: 21, title: "Зимние тренды", content: "Объёмные пальто, вязаные аксессуары, тёплая палитра.", tags: ["новая одежда", "новости"], date: new Date(2025, 11, 10), datePublished: formatDate(new Date(2025, 11, 10)), views: 267, image: "https://placehold.co/50x50/AA96DA/white?text=21" },
  { id: 22, title: "TypeScript для начинающих", content: "Зачем нужны типы и как начать их использовать:\n```ts\nlet name: string = 'Alex';\n```", tags: ["обзор"], date: new Date(2026, 1, 25), datePublished: formatDate(new Date(2026, 1, 25)), views: 389, image: "https://placehold.co/50x50/FCBAD3/white?text=22" },
  { id: 23, title: "Прогулка по городу", content: "Фото-отчёт с вечерней прогулки. Архитектура, свет, атмосфера.", tags: ["просто так"], date: new Date(2025, 6, 30), datePublished: formatDate(new Date(2025, 6, 30)), views: 143, image: "https://placehold.co/50x50/FFFFD2/333?text=23" },
  { id: 24, title: "Оптимизация изображений", content: "Как ускорить загрузку сайта без потери качества.", tags: ["обзор"], date: new Date(2025, 3, 19), datePublished: formatDate(new Date(2025, 3, 19)), views: 301, image: "https://placehold.co/50x50/A8E6CF/333?text=24" },
  { id: 25, title: "Весенний гардероб", content: "Лёгкие ткани, пастельные оттенки, многослойность.", tags: ["новая одежда"], date: new Date(2026, 2, 1), datePublished: formatDate(new Date(2026, 2, 1)), views: 228, image: "https://placehold.co/50x50/FFD3B6/333?text=25" },
  { id: 26, title: "Работа с API", content: "REST, GraphQL, fetch — что выбрать:\n```js\nfetch('/api/data').then(r => r.json());\n```", tags: ["новости", "обзор"], date: new Date(2025, 10, 8), datePublished: formatDate(new Date(2025, 10, 8)), views: 356, image: "https://placehold.co/50x50/D4A5A5/white?text=26" },
  { id: 27, title: "Домашний офис", content: "Как организовать рабочее место для максимальной продуктивности.", tags: ["просто так"], date: new Date(2025, 7, 22), datePublished: formatDate(new Date(2025, 7, 22)), views: 174, image: "https://placehold.co/50x50/C7CEEA/333?text=27" },
  { id: 28, title: "Анимации в CSS", content: "Плавные переходы без JavaScript:\n```css\ntransition: all 0.3s ease;\n```", tags: ["обзор"], date: new Date(2026, 0, 11), datePublished: formatDate(new Date(2026, 0, 11)), views: 283, image: "https://placehold.co/50x50/FFAAA5/333?text=28" },
  { id: 29, title: "Стиль кэжуал", content: "Удобно, стильно, универсально. Подборка образов.", tags: ["новая одежда", "обзор"], date: new Date(2025, 4, 5), datePublished: formatDate(new Date(2025, 4, 5)), views: 215, image: "https://placehold.co/50x50/FFB7B2/333?text=29" },
  { id: 30, title: "Отладка в браузере", content: "Инструменты DevTools, которые должен знать каждый.", tags: ["обзор"], date: new Date(2025, 9, 27), datePublished: formatDate(new Date(2025, 9, 27)), views: 398, image: "https://placehold.co/50x50/FFDAC1/333?text=30" },
  { id: 31, title: "Летние аксессуары", content: "Солнцезащитные очки, сумки, шляпы — детали, которые создают образ.", tags: ["новая одежда"], date: new Date(2026, 4, 15), datePublished: formatDate(new Date(2026, 4, 15)), views: 192, image: "https://placehold.co/50x50/B5EAD7/333?text=31" },
  { id: 32, title: "Webpack vs Vite", content: "Сравниваем сборщики проектов:\n```json\n// vite.config.js\nexport default { ... }\n```", tags: ["новости", "обзор"], date: new Date(2025, 12, 2), datePublished: formatDate(new Date(2025, 12, 2)), views: 427, image: "https://placehold.co/50x50/E2F0CB/333?text=32" },
  { id: 33, title: "Вечерний ритуал", content: "Чай, книга, планирование завтрашнего дня.", tags: ["просто так"], date: new Date(2025, 8, 14), datePublished: formatDate(new Date(2025, 8, 14)), views: 136, image: "https://placehold.co/50x50/FF6B6B/white?text=33" },
  { id: 34, title: "Доступность в вебе", content: "Почему a11y важна и как сделать сайт удобнее для всех.", tags: ["обзор"], date: new Date(2026, 3, 20), datePublished: formatDate(new Date(2026, 3, 20)), views: 259, image: "https://placehold.co/50x50/4ECDC4/white?text=34" },
  { id: 35, title: "Базовый гардероб 2026", content: "10 вещей, которые подойдут к любому образу.", tags: ["новая одежда", "обзор"], date: new Date(2025, 1, 28), datePublished: formatDate(new Date(2025, 1, 28)), views: 341, image: "https://placehold.co/50x50/95E1D3/white?text=35" }
];

posts.push(...additionalPosts);
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
  let lastIndex = 0, m;
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
const manualLoadToggle = document.getElementById('manualLoadToggle'); // Чекбокс "Ручная загрузка"
const virtualScrollerContainer = document.getElementById('virtual-scroller');
const postsCountInfo = document.getElementById('postsCountInfo');

// --- STATE ---
const ITEMS_PER_PAGE = 5;
let loadedCount = ITEMS_PER_PAGE;
let isFetching = false;
let lastPostObserver = null;

let filteredPosts = [...posts];
let currentCategory = 'all';
let activePostId = null;

posts.forEach(p => { p.likes = p.likes || 0; p.deleted = false; });

// --- FORMAT PANEL ---
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

// --- RENDER + INFINITE SCROLL ---
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

    const imgHtml = post.image 
      ? `<div style="margin-bottom: 10px;">
           <img src="${post.image}" alt="Картинка поста" 
                style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; display: block;" 
                loading="lazy" onerror="this.style.display='none'"> 
         </div>` 
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
    
    // Настраиваем наблюдатель только если НЕ ручной режим
    const isManual = manualLoadToggle && manualLoadToggle.checked;
    if (!isManual) {
        setupLastPostObserver();
    } else {
        // Если ручной режим — отключаем авто-наблюдатель
        if (lastPostObserver) {
            lastPostObserver.disconnect();
            lastPostObserver = null;
        }
    }
}

// 🔥 НАБЛЮДЕНИЕ ЗА ПОСЛЕДНИМ ПОСТОМ
function setupLastPostObserver() {
    if (lastPostObserver) {
        lastPostObserver.disconnect();
        lastPostObserver = null;
    }
    
    // Если всё загружено
    if (loadedCount >= filteredPosts.length) {
        if (loader) loader.style.display = 'none';
        if (endMessage) endMessage.style.display = 'block';
        return;
    }
    
    const lastPostEl = virtualScrollerContainer.lastElementChild;
    if (!lastPostEl) return;
    
    // Скрываем лоадер пока не доскроллили
    if (loader) loader.style.display = 'none';
    if (endMessage) endMessage.style.display = 'none';
    
    lastPostObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isFetching && loadedCount < filteredPosts.length) {
            if (loader) loader.style.display = 'block';
            loadMorePosts();
        }
    }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    });
    
    lastPostObserver.observe(lastPostEl);
}

function updateControlsState(currentShown, total) {
    const isManual = manualLoadToggle && manualLoadToggle.checked;

    // Управление кнопкой "Загрузить еще"
    if (loadMoreBtn) {
        if (currentShown >= total) {
            loadMoreBtn.style.display = 'none';
        } else if (isManual) {
            loadMoreBtn.style.display = 'inline-block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }

    // Управление сообщением "Конец"
    if (endMessage) {
        if (currentShown >= total) {
            endMessage.style.display = total > 0 ? 'block' : 'none';
        } else {
            endMessage.style.display = 'none';
        }
    }
}

function loadMorePosts() {
    if (isFetching) return;
    if (loadedCount >= filteredPosts.length) return;
    
    isFetching = true;
    if (loader) loader.style.display = 'block';
    
    setTimeout(() => {
        loadedCount += ITEMS_PER_PAGE;
        renderList(searchInput ? searchInput.value : '');
        isFetching = false;
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

// ✅ ВОЗВРАЩАЕМ КНОПКУ "ЗАГРУЗИТЬ ЕЩЕ"
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMorePosts);
}

// ✅ ОБРАБОТКА ЧЕКБОКСА "РУЧНАЯ ЗАГРУЗКА"
if (manualLoadToggle) {
    manualLoadToggle.addEventListener('change', () => {
        // Перерисовываем список, чтобы обновить состояние кнопки и отключить/включить авто-лоад
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