function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
}


function generateToken(username) {
    return btoa(`${username}:${Date.now()}:${Math.random().toString(36).substr(2, 10)}`);
}

function verifyToken(token) {
    if (!token) return null;
    try {
        const decoded = atob(token);
        const parts = decoded.split(':');
        if (parts.length < 3) return null;
        return { username: parts[0] };
    } catch {
        return null;
    }
}

function checkAuth() {
    const token = getCookie('authToken');
    const user = verifyToken(token);
    if (!user) {
        window.location.href = 'http://127.0.0.1:5500/Registration.html';
        return null;
    }
    return user;
}

const currentUser = checkAuth();

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

const defaultPosts = [
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
        image: "https://www.shutterstock.com/image-vector/emoticon-emoji-smile-pixel-art-600w-1806013249.jpg"
    },
    {
        id: 3,
        title: "Обзор новой одежды",
        content: "Обзор последней одежды сезона:\n```js\nconst price = 17000;\nconsole.log('cdg футболка');\n```\n<p>1) cdg футболка с синими сердечками за 17 тыс.руб.</p>",
        tags: ["новая одежда", "обзор"],
        date: baseDates[2],
        datePublished: formatDate(baseDates[2]),
        views: 300,
        image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067583.jpg"
    },
    {
        id: 4,
        title: "Новости мира",
        content: "Свежие новости: Новая коллекция одежды потрясла модный мир этой весной.",
        tags: ["новости"],
        date: baseDates[3],
        datePublished: formatDate(baseDates[3]),
        views: 120,
        image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg"
    }
];

const additionalPosts = [
    { id: 5, title: "Тренды весны 2026", content: "Обзор модных тенденций нового сезона.", tags: ["новая одежда", "обзор"], date: new Date(2026, 2, 10), datePublished: formatDate(new Date(2026, 2, 10)), views: 245, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 6, title: "JavaScript советы", content: "Полезные приёмы для повседневной разработки:\n```js\nconst sum = (a, b) => a + b;\n```", tags: ["обзор"], date: new Date(2025, 8, 5), datePublished: formatDate(new Date(2025, 8, 5)), views: 189, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 7, title: "Прогулка в парке", content: "Сегодня отличный день для отдыха на свежем воздухе.", tags: ["просто так"], date: new Date(2025, 6, 20), datePublished: formatDate(new Date(2025, 6, 20)), views: 98, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 8, title: "Новый фреймворк", content: "Вышел релиз версии 3.0. Разбираем нововведения.", tags: ["новости", "обзор"], date: new Date(2026, 1, 14), datePublished: formatDate(new Date(2026, 1, 14)), views: 312, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 9, title: "Рецепт идеальной пиццы", content: "Ингредиенты: мука, вода, дрожжи, томаты, моцарелла.", tags: ["просто так"], date: new Date(2025, 10, 3), datePublished: formatDate(new Date(2025, 10, 3)), views: 421, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 10, title: "CSS Grid против Flexbox", content: "Сравниваем два подхода к вёрстке:\n```css\ndisplay: grid;\n```", tags: ["обзор"], date: new Date(2025, 4, 18), datePublished: formatDate(new Date(2025, 4, 18)), views: 276, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 11, title: "История одного бага", content: "Как я искал ошибку три дня и нашёл её в одной строке.", tags: ["новости"], date: new Date(2026, 0, 22), datePublished: formatDate(new Date(2026, 0, 22)), views: 154, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 12, title: "Утро программиста", content: "Кофе, план на день, коммиты. Стандартный ритуал.", tags: ["просто так"], date: new Date(2025, 7, 9), datePublished: formatDate(new Date(2025, 7, 9)), views: 203, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 13, title: "Выбор монитора для кода", content: "На что смотреть: разрешение, матрица, частота обновления.", tags: ["обзор"], date: new Date(2025, 11, 1), datePublished: formatDate(new Date(2025, 11, 1)), views: 387, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 14, title: "Тест производительности", content: "Замеряем скорость загрузки и отрисовки:\n```js\nconsole.time('load');\n```", tags: ["новости", "обзор"], date: new Date(2026, 3, 5), datePublished: formatDate(new Date(2026, 3, 5)), views: 167, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 15, title: "Минимализм в одежде", content: "Почему меньше — значит лучше. Подборка базовых вещей.", tags: ["новая одежда", "обзор"], date: new Date(2025, 2, 28), datePublished: formatDate(new Date(2025, 2, 28)), views: 291, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 16, title: "Async/await на практике", content: "Читаемый асинхронный код без Promise-адда:\n```js\nconst data = await fetch(url);\n```", tags: ["обзор"], date: new Date(2025, 9, 12), datePublished: formatDate(new Date(2025, 9, 12)), views: 445, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 17, title: "Осенняя коллекция", content: "Тёплые тона, натуральные ткани, уютные силуэты.", tags: ["новая одежда"], date: new Date(2025, 8, 21), datePublished: formatDate(new Date(2025, 8, 21)), views: 198, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 18, title: "Git: полезные команды", content: "Список команд, которые экономят время:\n```bash\ngit rebase -i HEAD~3\n```", tags: ["обзор"], date: new Date(2026, 2, 3), datePublished: formatDate(new Date(2026, 2, 3)), views: 334, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 19, title: "Кофе и код", content: "Какой сорт бодрит лучше всего? Личный топ-3.", tags: ["просто так"], date: new Date(2025, 5, 7), datePublished: formatDate(new Date(2025, 5, 7)), views: 127, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 20, title: "Адаптивная вёрстка", content: "Как сделать сайт удобным на любом устройстве.", tags: ["обзор"], date: new Date(2025, 1, 14), datePublished: formatDate(new Date(2025, 1, 14)), views: 412, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 21, title: "Зимние тренды", content: "Объёмные пальто, вязаные аксессуары, тёплая палитра.", tags: ["новая одежда", "новости"], date: new Date(2025, 11, 10), datePublished: formatDate(new Date(2025, 11, 10)), views: 267, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 22, title: "TypeScript для начинающих", content: "Зачем нужны типы и как начать их использовать:\n```ts\nlet name: string = 'Alex';\n```", tags: ["обзор"], date: new Date(2026, 1, 25), datePublished: formatDate(new Date(2026, 1, 25)), views: 389, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 23, title: "Прогулка по городу", content: "Фото-отчёт с вечерней прогулки. Архитектура, свет, атмосфера.", tags: ["просто так"], date: new Date(2025, 6, 30), datePublished: formatDate(new Date(2025, 6, 30)), views: 143, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 24, title: "Оптимизация изображений", content: "Как ускорить загрузку сайта без потери качества.", tags: ["обзор"], date: new Date(2025, 3, 19), datePublished: formatDate(new Date(2025, 3, 19)), views: 301, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 25, title: "Весенний гардероб", content: "Лёгкие ткани, пастельные оттенки, многослойность.", tags: ["новая одежда"], date: new Date(2026, 2, 1), datePublished: formatDate(new Date(2026, 2, 1)), views: 228, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 26, title: "Работа с API", content: "REST, GraphQL, fetch — что выбрать:\n```js\nfetch('/api/data').then(r => r.json());\n```", tags: ["новости", "обзор"], date: new Date(2025, 10, 8), datePublished: formatDate(new Date(2025, 10, 8)), views: 356, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 27, title: "Домашний офис", content: "Как организовать рабочее место для максимальной продуктивности.", tags: ["просто так"], date: new Date(2025, 7, 22), datePublished: formatDate(new Date(2025, 7, 22)), views: 174, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 28, title: "Анимации в CSS", content: "Плавные переходы без JavaScript:\n```css\ntransition: all 0.3s ease;\n```", tags: ["обзор"], date: new Date(2026, 0, 11), datePublished: formatDate(new Date(2026, 0, 11)), views: 283, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 29, title: "Стиль кэжуал", content: "Удобно, стильно, универсально. Подборка образов.", tags: ["новая одежда", "обзор"], date: new Date(2025, 4, 5), datePublished: formatDate(new Date(2025, 4, 5)), views: 215, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 30, title: "Отладка в браузере", content: "Инструменты DevTools, которые должен знать каждый.", tags: ["обзор"], date: new Date(2025, 9, 27), datePublished: formatDate(new Date(2025, 9, 27)), views: 398, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 31, title: "Летние аксессуары", content: "Солнцезащитные очки, сумки, шляпы — детали, которые создают образ.", tags: ["новая одежда"], date: new Date(2026, 4, 15), datePublished: formatDate(new Date(2026, 4, 15)), views: 192, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 32, title: "Webpack vs Vite", content: "Сравниваем сборщики проектов:\n```json\n// vite.config.js\nexport default { ... }\n```", tags: ["новости", "обзор"], date: new Date(2025, 12, 2), datePublished: formatDate(new Date(2025, 12, 2)), views: 427, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 33, title: "Вечерний ритуал", content: "Чай, книга, планирование завтрашнего дня.", tags: ["просто так"], date: new Date(2025, 8, 14), datePublished: formatDate(new Date(2025, 8, 14)), views: 136, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 34, title: "Доступность в вебе", content: "Почему a11y важна и как сделать сайт удобнее для всех.", tags: ["обзор"], date: new Date(2026, 3, 20), datePublished: formatDate(new Date(2026, 3, 20)), views: 259, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" },
    { id: 35, title: "Базовый гардероб 2026", content: "10 вещей, которые подойдут к любому образу.", tags: ["новая одежда", "обзор"], date: new Date(2025, 1, 28), datePublished: formatDate(new Date(2025, 1, 28)), views: 341, image: "https://www.shutterstock.com/image-illustration/emoji-pixel-illustration-size-100x100-600w-2518067923.jpg" }
];

let posts = [];
const storedPosts = localStorage.getItem('postsData');

if (storedPosts) {
    const parsed = JSON.parse(storedPosts);
    posts = parsed.map(p => ({
        ...p,
        date: new Date(p.date)
    }));
} else {
    posts = [...defaultPosts, ...additionalPosts];
    localStorage.setItem('postsData', JSON.stringify(posts));
}

posts.sort((a, b) => b.date - a.date);

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function stripHtml(html = '') { return String(html).replace(/<[^>]+>/g, ''); }

function makeCategoryFilter(category) {
    return function (post) {
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

// --- DOM ЭЛЕМЕНТЫ ---
const searchInput = document.getElementById('searchInput');
const noResultsDiv = document.getElementById('noResults');
const categoriesDiv = document.getElementById('categories');
const sortDateBtn = document.getElementById('sortDate');
const sortViewsBtn = document.getElementById('sortViews');
const themeLight = document.getElementById('themeLight');
const themeDark = document.getElementById('themeDark');
const addPostForm = document.getElementById('addPostForm');
const postTitle = document.getElementById('postTitle');
const postTags = document.getElementById('postTags');
const postContent = document.getElementById('postContent');
const postTitleError = document.getElementById('postTitleError');
const postContentError = document.getElementById('postContentError');
const cancelAddPost = document.getElementById('cancelAddPost');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loader = document.getElementById('loader');
const endMessage = document.getElementById('endMessage');
const logoutBtn = document.getElementById('logoutBtn');
const manualLoadToggle = document.getElementById('manualLoadToggle');
const virtualScrollerContainer = document.getElementById('virtual-scroller');
const postsCountInfo = document.getElementById('postsCountInfo');

// --- СОСТОЯНИЕ ---
const ITEMS_PER_PAGE = 5;
let loadedCount = ITEMS_PER_PAGE;
let isFetching = false;
let lastPostObserver = null;
let filteredPosts = [...posts];
let currentCategory = 'all';

posts.forEach(p => { p.likes = p.likes || 0; p.deleted = false; });

// --- ТЕМА ОФОРМЛЕНИЯ ---
function applyTheme(theme) {
    setCodeTheme(theme === 'dark' ? 'code-theme-dark' : 'code-theme-light');
    document.body.style.background = theme === 'dark' ? '#1a1a2e' : '#f4f4f4';
    document.body.style.color = theme === 'dark' ? '#fff' : '#000';
    
    // Сохраняем тему в cookie на 365 дней
    setCookie('theme', theme, 365);
}

// Инициализация темы при загрузке
const savedTheme = getCookie('theme') || 'light';
applyTheme(savedTheme);

// --- ВЫХОД ИЗ СИСТЕМЫ ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        deleteCookie('authToken');
        // Не удаляем тему, чтобы она сохранилась для следующего входа
        localStorage.removeItem('isRegistered');
        localStorage.removeItem('regFormData');
        localStorage.removeItem('regDynamicFields');
        localStorage.removeItem('currentUser');
        window.location.href = 'http://127.0.0.1:5500/Registration.html';
    });
}

// --- ФОРМА ДОБАВЛЕНИЯ ПОСТА ---
function openAddPostForm(focusField = postTitle) {
    if (!addPostForm) return;
    addPostForm.style.display = '';
    addPostForm.setAttribute('aria-hidden', 'false');
    focusField && focusField.focus();
    document.body.classList.add('modal-open');
}

function closeAddPostForm() {
    if (!addPostForm) return;
    addPostForm.style.display = 'none';
    addPostForm.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    addPostForm.reset();
    if (postTitleError) postTitleError.style.display = 'none';
    if (postContentError) postContentError.style.display = 'none';
}

if (cancelAddPost) {
    cancelAddPost.addEventListener('click', closeAddPostForm);
}

// Валидация ввода в реальном времени
if (postTitle) {
    postTitle.addEventListener('input', () => {
        if (postTitle.value.length >= 3 || postTitle.value === '') {
            postTitleError.style.display = 'none';
        }
    });
}

if (postContent) {
    postContent.addEventListener('input', () => {
        if (postContent.value.length >= 10 || postContent.value === '') {
            postContentError.style.display = 'none';
        }
    });
}

// Обработка отправки формы
if (addPostForm) {
    addPostForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let valid = true;
        const title = (postTitle && postTitle.value || '').trim();
        const content = postContent ? postContent.value : '';

        // Валидация заголовка (минимум 3 символа)
        if (title.length < 3) {
            postTitleError.style.display = 'block';
            valid = false;
        } else {
            postTitleError.style.display = 'none';
        }

        // Валидация содержимого (минимум 10 символов)
        if (content.length < 10) {
            postContentError.style.display = 'block';
            valid = false;
        } else {
            postContentError.style.display = 'none';
        }

        if (!valid) return;

        const tags = (postTags && postTags.value || '').split(',').map(s => s.trim()).filter(Boolean);

        const newPost = {
            id: Date.now(),
            title,
            content,
            tags,
            date: new Date(),
            datePublished: formatDate(new Date()),
            views: 0,
            likes: 0,
            image: "",
            author: currentUser?.username
        };
        
        posts.unshift(newPost);
        localStorage.setItem('postsData', JSON.stringify(posts));
        applyFilters();
        closeAddPostForm();
    });
}

// --- РЕНДЕРИНГ ПОСТОВ ---
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
          <button class="format-post-btn" data-id="${post.id}" style="font-size:0.9em; padding: 4px 8px; cursor:pointer;">Форматировать</button>
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
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = fullContent.style.display === 'none';
            fullContent.style.display = isHidden ? 'block' : 'none';
            previewDiv.style.display = isHidden ? 'none' : 'block';
            toggleBtn.textContent = isHidden ? 'Скрыть' : 'Показать полностью';
        });
    }
    
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

    const isManual = manualLoadToggle && manualLoadToggle.checked;
    if (!isManual) {
        setupLastPostObserver();
    } else {
        if (lastPostObserver) {
            lastPostObserver.disconnect();
            lastPostObserver = null;
        }
    }
}

function setupLastPostObserver() {
    if (lastPostObserver) {
        lastPostObserver.disconnect();
        lastPostObserver = null;
    }

    if (loadedCount >= filteredPosts.length) {
        if (loader) loader.style.display = 'none';
        if (endMessage) endMessage.style.display = 'block';
        return;
    }

    const lastPostEl = virtualScrollerContainer.lastElementChild;
    if (!lastPostEl) return;

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

    if (loadMoreBtn) {
        if (currentShown >= total) {
            loadMoreBtn.style.display = 'none';
        } else if (isManual) {
            loadMoreBtn.style.display = 'inline-block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }

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

// --- ФИЛЬТРАЦИЯ И СОРТИРОВКА ---
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

if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 300));
}

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

if (themeLight) {
    themeLight.addEventListener('click', () => { applyTheme('light'); });
}

if (themeDark) {
    themeDark.addEventListener('click', () => { applyTheme('dark'); });
}

// Обработка кликов по постам (лайки, форматирование)
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
            likeBtn.setAttribute('aria-pressed', 'true');
            localStorage.setItem('postsData', JSON.stringify(posts));
            return;
        }

        const formatBtn = ev.target.closest('.format-post-btn');
        if (formatBtn) {
            const id = Number(formatBtn.getAttribute('data-id'));
            // Используем относительный путь или полный, в зависимости от структуры
            window.open(`edit-post.html?id=${id}`, '_blank');
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

// Горячие клавиши
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
        if (addPostForm && addPostForm.style.display !== 'none') closeAddPostForm();
    }
});

function debounce(fn, wait = 250) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

window.addEventListener('load', () => {
    applyFilters();
});

window.addEventListener('storage', (e) => {
    if (e.key === 'postsData') {
        const parsed = JSON.parse(e.newValue);
        posts = parsed.map(p => ({ ...p, date: new Date(p.date) }));
        filteredPosts = [...posts];
        applyFilters();
    }
});