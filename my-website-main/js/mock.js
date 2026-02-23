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
    datePublished: formatDate(dates[0]),
    views: 150
  },
  {
    id: 2,
    title: "Второй пост",
    content: "Содержимое второго поста просто так.",
    tags: ["просто так", "новости"],
    datePublished: formatDate(dates[1]),
    views: 200
  },
  {
    id: 3,
    title: "Обзор новой одежды",
    content: "Обзор последней одежды сезона:<p>1) cdg футболка с синими сердечками за 17 тыс.руб. 2) Кеды Crenshaw Skate Club SB Dunk Light Blue за 68 тыс.руб. 3) Кроссовки Dunk High Ambush Deep Royal за 25 тыс.руб. 4) Хлопковые брюки Nike x Off-White за 34 тыс.руб.",
    tags: ["новая одежда", "обзор"],
    datePublished: formatDate(dates[2]),
    views: 300
  },
  {
    id: 4,
    title: "Новости мира",
    content: "Свежие новости: Новая коллекция одежды потрясла модный мир этой весной. Сегодня в крупнейших магазинах и онлайн-бутиках появилась новая коллекция одежды, которая быстро стала хитом среди модников. Дизайнеры представили свежие модели, сочетающие стиль и комфорт, что особенно важно для современного образа жизни. Основные тренды новой коллекции — это яркие цвета, минимализм и экологичные материалы. В этом сезоне популярно использование органического хлопка, льна и переработанных тканей, что делает одежду не только красивой, но и экологичной. Среди новинок — легкие платья, свободные брюки и уютные худи, идеально подходящие для повседневной носки. Особое внимание уделено деталям: крупные пуговицы, необычные рукава и яркие принты создают уникальные образы. Модельеры подчеркнули, что комфорт и стиль могут идти рука об руку, и поэтому каждый элемент новой коллекции предназначен для тех, кто ценит качество и индивидуальность. Розничные сети и интернет-магазины уже вовсю принимают заказы. А модные эксперты утверждают, что эта коллекция станет одной из самых популярных этого сезона и вдохновит многих на создание своих стильных образов.",
    tags: ["новости"],
    datePublished: formatDate(dates[3]),
    views: 120
  }
];

function getReadingTime(text) {
  const wordsPerMinute = 100; 
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const minutes = Math.ceil(words.length / wordsPerMinute);
  return minutes;
}

function getWordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

function getAverageWordLength(text) {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return 0; 
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return totalLength / words.length;
}


function getSentenceCount(text) {
  if (!text || typeof text !== 'string') return 0;

  const regex = /[.!?](\s|\r?\n|$)/g;

  let count = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const index = match.index;

    
    const prevText = text.slice(0, index).toLowerCase();

 
    const abbreviations = ['т.д', 'и т.д', 'г.', 'ул.', 'др.', 'ч.', 'г.'];

    let isAbbreviationEnd = false;
    for (const abbr of abbreviations) {
      const pattern = new RegExp(`${abbr}\\.$`, 'i');
      if (pattern.test(prevText)) {
        isAbbreviationEnd = true;
        break;
      }
    }

    if (!isAbbreviationEnd) {
      count++;
    }
  }

  return count;
}

let filteredPosts = [...posts];

const searchInput = document.getElementById('searchInput');
const postsContainer = document.getElementById('postsContainer');
const noResultsDiv = document.getElementById('noResults');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatches(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function renderPosts(postsToRender, query) {
  postsContainer.innerHTML = '';

  if (postsToRender.length === 0) {
    noResultsDiv.style.display = 'block';
    return;
  } else {
    noResultsDiv.style.display = 'none';
  }

  postsToRender.forEach(post => {
    const li = document.createElement('li');

    const q = query.trim();

    const highlightedTitle = highlightMatches(post.title, q);
    const highlightedContent = highlightMatches(post.content, q);
    const highlightedTags = post.tags.map(tag => highlightMatches(tag, q)).join(', ');

  
    const wordCount = getWordCount(post.content);
    const readingTimeMinute = getReadingTime(post.content);
    const averageWordLength = getAverageWordLength(post.content);
    const sentenceCount = getSentenceCount(post.content);


li.innerHTML = `
<h3>${highlightedTitle}</h3>
<p>${highlightedContent}</p>
<p><strong>Теги:</strong> ${highlightedTags}</p>
<p>
  <em>Дата:</em> ${post.datePublished} | 
  Просмотры: ${post.views} <p></p>
  Примерное время чтения: ${readingTimeMinute} мин | 
  Количество слов: ${wordCount} <p></p>
  Средняя длина слова: ${averageWordLength.toFixed(2)} символов | 
  Предложений: ${sentenceCount}
  

</p>
`;
 postsContainer.appendChild(li);
  });
}


searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (query === '') {
    filteredPosts = [...posts];
  } else {
    const lowerQuery = query.toLowerCase();
    filteredPosts = posts.filter(post => {
      const inTitle = post.title.toLowerCase().includes(lowerQuery);
      const inContent = post.content.toLowerCase().includes(lowerQuery);
      const inTags = post.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      return inTitle || inContent || inTags;
    });
  }
  renderPosts(filteredPosts, query);
});


document.getElementById('sortDate').addEventListener('click', () => {
  filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderPosts(filteredPosts, searchInput.value);
});

document.getElementById('sortViews').addEventListener('click', () => {
  filteredPosts.sort((a, b) => b.views - a.views);
  renderPosts(filteredPosts, searchInput.value);
});

renderPosts(filteredPosts, '');