const cardsGrid = document.querySelector('#cardsGrid');
const searchInput = document.querySelector('#searchInput');
const searchResults = document.querySelector('#searchResults');
const searchResultsGrid = document.querySelector('#searchResultsGrid');
const searchEmptyState = document.querySelector('#searchEmptyState');

const typographShortWords = [
  'в', 'во', 'к', 'ко', 'с', 'со', 'у', 'о', 'об', 'от', 'до', 'за', 'из', 'на', 'по',
  'и', 'а', 'но', 'я', 'мы', 'вы', 'он', 'их', 'не'
];
const typographShortWordsPattern = new RegExp(
  String.raw`(^|[^\p{L}\p{N}_])(${typographShortWords.join('|')})([ \t]+)(?=\S)`,
  'giu'
);
const typographIgnoredTags = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA']);

function typographText(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;

        if (!parent || parent.closest(Array.from(typographIgnoredTags).join(','))) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    node.nodeValue = node.nodeValue.replace(
      typographShortWordsPattern,
      (_match, before, word) => `${before}${word}\u00a0`
    );
  });
}

function normalizeText(value) {
  return String(value ?? '').replace(/\u00a0/g, ' ').toLowerCase().trim();
}

function createDetails(opportunity) {
  const details = [
    ['Для кого', opportunity.forWhom],
    ['Что могу сделать', opportunity.whatICanDo],
    ['Результат', opportunity.result]
  ].filter(([, text]) => Boolean(text));

  if (!details.length) {
    return '';
  }

  return `
    <div class="card-details">
      ${details.map(([label, text]) => `<p><strong>${label}</strong>${text}</p>`).join('')}
    </div>`;
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
    ${createDetails(opportunity)}
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
  return normalizeText(getSearchableText(opportunity)).includes(query);
}

function renderCatalogCards() {
  cardsGrid.innerHTML = '';
  opportunities.forEach((opportunity) => {
    cardsGrid.appendChild(createCard(opportunity));
  });
}

function renderSearchResults() {
  const query = normalizeText(searchInput.value);

  if (!query) {
    searchResults.hidden = true;
    searchResultsGrid.innerHTML = '';
    searchEmptyState.hidden = true;
    return;
  }

  const filteredOpportunities = opportunities.filter((opportunity) => matchesSearch(opportunity, query));

  searchResults.hidden = false;
  searchResultsGrid.innerHTML = '';
  filteredOpportunities.forEach((opportunity) => {
    searchResultsGrid.appendChild(createCard(opportunity));
  });
  searchEmptyState.hidden = filteredOpportunities.length > 0;
  typographText(searchResults);
}

searchInput.addEventListener('input', renderSearchResults);

renderCatalogCards();
typographText();
