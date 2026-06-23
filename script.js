const cardsGrid = document.querySelector('#cardsGrid');
const searchInput = document.querySelector('#searchInput');
const searchResults = document.querySelector('#searchResults');
const searchResultsGrid = document.querySelector('#searchResultsGrid');
const searchEmptyState = document.querySelector('#searchEmptyState');
const customSearchCard = document.querySelector('#customSearchCard');

const typographShortWords = [
  'в', 'во', 'к', 'ко', 'с', 'со', 'у', 'о', 'об', 'от', 'до', 'за', 'из', 'на', 'по',
  'и', 'а', 'но', 'я', 'мы', 'вы', 'он', 'их', 'не'
];
const typographShortWordsPattern = new RegExp(
  String.raw`(^|[^\p{L}\p{N}_])(${typographShortWords.join('|')})([ \t]+)(?=\S)`,
  'giu'
);
const typographIgnoredTags = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA']);

const relatedSearchPhrases = [
  'бренд', 'брендинг', 'брендирование', 'бренд-стратегия', 'маркетинг', 'продвижение',
  'продажи', 'продукт', 'запуск', 'запуск продукта', 'торговая марка', 'товарный знак',
  'упаковка', 'визуал', 'дизайн', 'реклама', 'коммуникация', 'позиционирование',
  'аудитория', 'полка', 'закупщик', 'дистрибьютор', 'каталог', 'презентация', 'сайт',
  'линейка', 'ребрендинг', 'спрос', 'ценность продукта'
];

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

  prepareAnimatedCard(card);

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

function isRelatedSearchQuery(query) {
  return relatedSearchPhrases.some((phrase) => {
    const normalizedPhrase = normalizeText(phrase);

    return query.includes(normalizedPhrase) || normalizedPhrase.includes(query);
  });
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
    customSearchCard.hidden = true;
    return;
  }

  const filteredOpportunities = opportunities.filter((opportunity) => matchesSearch(opportunity, query));

  searchResults.hidden = false;
  searchResultsGrid.innerHTML = '';
  filteredOpportunities.forEach((opportunity) => {
    searchResultsGrid.appendChild(createCard(opportunity));
  });
  const hasResults = filteredOpportunities.length > 0;
  const shouldShowCustomCard = !hasResults && isRelatedSearchQuery(query);

  customSearchCard.hidden = !shouldShowCustomCard;
  searchEmptyState.hidden = hasResults || shouldShowCustomCard;
  typographText(searchResults);
}

searchInput.addEventListener('input', renderSearchResults);

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const canUseDesktopTilt = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
const animatedCardSelector = '.card, .route-card, .project-card';
let revealObserver;

function setupCardReveal(card) {
  if (motionQuery.matches) {
    card.classList.add('is-visible');
    return;
  }

  card.classList.add('reveal-on-scroll');

  if (revealObserver) {
    revealObserver.observe(card);
  }
}

function setupCardTilt(card) {
  if (!canUseDesktopTilt.matches || motionQuery.matches) {
    return;
  }

  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
    card.style.setProperty('--glow-x', `${((x + 0.5) * 100).toFixed(1)}%`);
    card.style.setProperty('--glow-y', `${((y + 0.5) * 100).toFixed(1)}%`);
  });

  card.addEventListener('pointerleave', () => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    card.style.removeProperty('--glow-x');
    card.style.removeProperty('--glow-y');
  });
}

function prepareAnimatedCard(card) {
  setupCardReveal(card);
  setupCardTilt(card);
}

function initCardMotion() {
  if (!motionQuery.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  }

  document.querySelectorAll(animatedCardSelector).forEach(prepareAnimatedCard);
}

renderCatalogCards();
typographText();
initCardMotion();
