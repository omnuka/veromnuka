const cardsGrid = document.querySelector('#cardsGrid');
const searchInput = document.querySelector('#searchInput');
const filterButtons = document.querySelectorAll('.filter-button[data-category]');
const resetButton = document.querySelector('#resetFilters');
const emptyState = document.querySelector('#emptyState');

let activeCategory = '';

function normalizeText(value) {
  return String(value ?? '').toLowerCase().trim();
}

function createCard(opportunity) {
  const card = document.createElement('article');
  card.className = 'card';

  card.innerHTML = `
    <div class="card-top">
      <span class="category">${opportunity.category}</span>
    </div>
    <h3>${opportunity.title}</h3>
    <p>${opportunity.shortDescription}</p>
    <div class="tags">
      ${opportunity.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
    </div>
    <p><strong>Для кого</strong>${opportunity.forWhom}</p>
    <p><strong>Что могу сделать</strong>${opportunity.whatICanDo}</p>
    <p><strong>Результат</strong>${opportunity.result}</p>
    <a class="card-cta" href="https://t.me/omnuka" target="_blank" rel="noreferrer">${opportunity.ctaText} →</a>
  `;

  return card;
}

function getSearchableText(opportunity) {
  return [
    opportunity.title,
    opportunity.category,
    opportunity.tags,
    opportunity.shortDescription,
    opportunity.forWhom,
    opportunity.whatICanDo,
    opportunity.result
  ].flat().join(' ');
}

function matchesSearch(opportunity, query) {
  return !query || normalizeText(getSearchableText(opportunity)).includes(query);
}

function matchesCategory(opportunity) {
  return !activeCategory || normalizeText(opportunity.category) === normalizeText(activeCategory);
}

function renderCards() {
  const query = normalizeText(searchInput.value);
  const filteredOpportunities = opportunities.filter((opportunity) => (
    matchesCategory(opportunity) && matchesSearch(opportunity, query)
  ));

  cardsGrid.innerHTML = '';
  filteredOpportunities.forEach((opportunity) => {
    cardsGrid.appendChild(createCard(opportunity));
  });

  emptyState.hidden = filteredOpportunities.length > 0;
}

function setActiveFilter(category) {
  activeCategory = activeCategory === category ? '' : category;

  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.category === activeCategory);
  });

  renderCards();
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveFilter(button.dataset.category));
});

resetButton.addEventListener('click', () => {
  activeCategory = '';
  searchInput.value = '';
  filterButtons.forEach((button) => button.classList.remove('active'));
  renderCards();
});

searchInput.addEventListener('input', renderCards);

renderCards();
