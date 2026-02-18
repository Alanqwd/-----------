const posts = [
    { id: 1,
       title: "Первый пост",
        content: "Это содержание первого поста",
         tags: ["новости", "обзор"],
          date: "2024-04-20",
           views: 150 },
    { id: 2,
       title: "Второй пост",
        content: "Содержимое второго поста просто так",
         tags: ["просто так", "новости"],
          date: "2024-04-18",
           views: 200 },
    { id: 3,
       title: "Обзор новой одежды",
        content: "Обзор последней одежды сезона", 
        tags: ["новая одежда", "обзор"],
         date: "2024-04-19", views: 300 },
    { id: 4, 
      title: "Новости мира",
       content: "Свежие новости и аналитика", 
       tags: ["новости", "аналитика"], 
       date: "2024-04-17", 
       views: 120 }
];

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

    li.innerHTML = `
      <h3>${highlightedTitle}</h3>
      <p>${highlightedContent}</p>
      <p><strong>Теги:</strong> ${highlightedTags}</p>
      <p><em>Дата: ${post.date}</em> | Просмотры: ${post.views}</p>
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