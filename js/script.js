document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  //  1. MOBILE NAVIGATION TOGGLE
  // ============================================================
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('header nav');

  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', () => {
      nav.classList.toggle('active');
      const isExpanded = nav.classList.contains('active');
      mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
      mobileMenuToggle.textContent = isExpanded ? '✕' : '☰';
    });

    // Close menu when a nav link is clicked
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.textContent = '☰';
      });
    });
  }

  // ============================================================
  //  2. SIDEBAR FILTER TOGGLE (mobile collapsible)
  // ============================================================
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    // Wrap all existing sidebar children in a collapsible container
    const children = Array.from(sidebar.children);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle-btn';
    toggleBtn.textContent = 'Filter & Search';
    toggleBtn.setAttribute('aria-expanded', 'false');

    const filtersWrapper = document.createElement('div');
    filtersWrapper.className = 'sidebar-filters';

    children.forEach(child => filtersWrapper.appendChild(child));

    sidebar.appendChild(toggleBtn);
    sidebar.appendChild(filtersWrapper);

    // Always open on desktop, collapsed by default on mobile
    const syncSidebarVisibility = () => {
      if (window.innerWidth > 768) {
        filtersWrapper.classList.add('open');
        toggleBtn.classList.add('open');
      }
    };

    syncSidebarVisibility();

    toggleBtn.addEventListener('click', () => {
      filtersWrapper.classList.toggle('open');
      toggleBtn.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', filtersWrapper.classList.contains('open'));
    });

    window.addEventListener('resize', syncSidebarVisibility);
  }

  // ============================================================
  //  3. BOOKS PAGE — FILTER, SEARCH & SORT
  // ============================================================
  const booksGrid = document.getElementById('books-grid');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const searchInput = document.getElementById('search-input');
  const genreCheckboxes = document.querySelectorAll('.genre-checkbox');
  const ratingRadios = document.querySelectorAll('input[name="rating-filter"]');
  const sortSelect = document.getElementById('sort-select');
  const clearBtn = document.getElementById('clear-filters-btn');

  // Only run on the books page
  if (!booksGrid) return;

  // Parse book data from the existing DOM cards
  const bookCards = Array.from(booksGrid.querySelectorAll('.book-card'));
  const booksData = bookCards.map((card, index) => {
    const title  = card.querySelector('.book-card-title')?.textContent?.trim() || '';
    const author = card.querySelector('.book-card-author')?.textContent?.trim() || '';
    const genre  = card.querySelector('.book-card-content span')?.textContent?.trim() || '';

    // Rating parsing — expects text like "★★★★★ 4.8/5 (124)"
    const ratingText  = card.querySelector('.rating')?.textContent || '';
    const ratingMatch = ratingText.match(/([\d.]+)\/5/);
    const rating      = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    const reviewsMatch = ratingText.match(/\((\d+)\)/);
    const reviews      = reviewsMatch ? parseInt(reviewsMatch[1], 10) : 0;

    return { element: card, index, title, author, genre, rating, reviews };
  });

  function filterAndSort() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const selectedGenres = Array.from(genreCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());

    const activeRatingRadio = Array.from(ratingRadios).find(r => r.checked);
    const minRating = activeRatingRadio ? parseFloat(activeRatingRadio.value) : 0;

    // Filter
    const filtered = booksData.filter(book => {
      const matchesSearch = !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre.toLowerCase().includes(query);

      const matchesGenre = selectedGenres.length === 0 ||
        selectedGenres.includes(book.genre.toLowerCase());

      const matchesRating = book.rating >= minRating;

      return matchesSearch && matchesGenre && matchesRating;
    });

    // Sort
    const sortVal = sortSelect ? sortSelect.value : 'popularity';
    filtered.sort((a, b) => {
      if (sortVal === 'popularity') return b.reviews - a.reviews;
      if (sortVal === 'rating')     return b.rating  - a.rating;
      if (sortVal === 'az')         return a.title.localeCompare(b.title);
      if (sortVal === 'za')         return b.title.localeCompare(a.title);
      return a.index - b.index;
    });

    // Update DOM
    // Clear existing books
    booksGrid.innerHTML = '';
    if (filtered.length === 0) {
      // Show empty state when no books match
      booksGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (resultsCount) resultsCount.textContent = 'No books found';
    } else {
      // Show grid and hide empty state
      booksGrid.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      if (resultsCount) resultsCount.textContent = `Showing ${filtered.length} book${filtered.length === 1 ? '' : 's'}`;
      // Append filtered books to the grid
      const fragment = document.createDocumentFragment();
      filtered.forEach(book => fragment.appendChild(book.element));
      booksGrid.appendChild(fragment);
    }
  }

  // Attach filter/sort event listeners
  if (searchInput) searchInput.addEventListener('input', filterAndSort);
  genreCheckboxes.forEach(cb => cb.addEventListener('change', filterAndSort));
  ratingRadios.forEach(r => r.addEventListener('change', filterAndSort));
  if (sortSelect) sortSelect.addEventListener('change', filterAndSort);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      genreCheckboxes.forEach(cb => (cb.checked = false));
      const ratingAll = document.getElementById('rating-all');
      if (ratingAll)  ratingAll.checked = true;
      if (sortSelect) sortSelect.value  = 'popularity';
      filterAndSort();
    });
  }

  // Run once on load
  filterAndSort();
});
