/* js/pages/LandingPage.js */
import { DOM } from '../utils/DOM.js';
import { WorldService } from '../services/WorldService.js';
import { BotService } from '../services/BotService.js';
import { SearchService } from '../services/SearchService.js';
import { stateManager } from '../core/StateManager.js';
import { globalEventBus } from '../core/EventBus.js';
import { Search } from '../ui/Search.js';
import { Filter } from '../ui/Filter.js';
import { GridManager } from '../ui/GridManager.js';

export class LandingPage {
  /**
   * Controller for index page views.
   * @param {HTMLElement} appRoot - App insertion parent node
   */
  constructor(appRoot) {
    this.appRoot = appRoot;
    this.worlds = [];
    this.gridManager = null;
    this.searchController = null;
    this.filterController = null;
    this.subscriptions = [];
  }

  /**
   * Loads configurations, sets statistics, constructs grids, and binds state managers.
   */
  async load() {
    // 1. Asynchronously load datasets
    const config = await WorldService.getConfig();
    this.worlds = await WorldService.getWorlds();
    const allBots = await BotService.getAllBots();

    // 2. Resolve unique genres list across all worlds
    const allGenres = Array.from(new Set(this.worlds.flatMap(w => w.genres || [])));

    // 3. Set global header and mobile statistics
    const updateStats = (id, val) => {
      const node = document.getElementById(id);
      if (node) node.textContent = val;
    };
    updateStats('stat-worlds-count', this.worlds.length);
    updateStats('stat-bots-count', allBots.length);
    updateStats('mobile-stat-worlds', this.worlds.length);
    updateStats('mobile-stat-bots', allBots.length);

    // 4. Construct DOM frames
    const filterContainer = DOM.el('div', { class: 'tags-list' });
    const gridContainer = DOM.el('div', { class: 'world-grid gpu-accelerated' });
    
    // Sort Select
    const sortDropdown = DOM.el('select', {
      class: 'sort-select',
      onchange: (e) => stateManager.setState('sortBy', e.target.value)
    },
      DOM.el('option', { value: 'featured' }, 'Featured Order'),
      DOM.el('option', { value: 'alphabetical' }, 'Alphabetical'),
      DOM.el('option', { value: 'popular' }, 'World Popularity')
    );
    sortDropdown.value = stateManager.getState('sortBy') || 'featured';

    const pageContainer = DOM.el('div', { class: 'page-container landing-page-view' },
      // Glowing space curves + Compass logo
      DOM.el('section', { class: 'landing-hero' },
        DOM.el('svg', {
          class: 'hero-compass-logo',
          viewBox: '0 0 100 100',
          width: '56',
          height: '56',
          fill: 'none',
          stroke: 'var(--accent-gold)',
          strokeWidth: '1.5',
          style: { margin: '0 auto 16px', display: 'block', filter: 'drop-shadow(0 0 6px rgba(197,160,89,0.4))' }
        },
          DOM.el('circle', { cx: '50', cy: '50', r: '42', stroke: 'var(--accent-gold)', strokeOpacity: '0.4' }),
          DOM.el('circle', { cx: '50', cy: '50', r: '28', stroke: 'var(--accent-gold)', strokeOpacity: '0.3', stroke-dasharray: '4,3' }),
          DOM.el('line', { x1: '50', y1: '8', x2: '50', y2: '92', stroke: 'var(--accent-gold)', strokeOpacity: '0.5' }),
          DOM.el('line', { x1: '8', y1: '50', x2: '92', y2: '50', stroke: 'var(--accent-gold)', strokeOpacity: '0.5' }),
          DOM.el('polygon', { points: '50,15 54,46 85,50 54,54 50,85 46,54 15,50 46,46', fill: 'var(--accent-gold)' })
        ),
        DOM.el('h1', { style: { fontSize: '3rem', fontWeight: '500', fontFamily: 'var(--font-serif)', letterSpacing: '0.08em', marginBottom: '8px', lineHeight: '1.2', textTransform: 'uppercase' } }, config.siteName),
        DOM.el('div', { class: 'gold-divider' }, 
          DOM.el('div', { class: 'gold-divider-diamond' })
        ),
        DOM.el('p', { style: { color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '12px' } }, config.tagline)
      ),
      
      DOM.el('div', { class: 'filter-bar' },
        DOM.el('div', { class: 'filter-group' },
          DOM.el('span', { class: 'filter-label' }, 'Genres'),
          filterContainer
        ),
        DOM.el('div', { class: 'filter-group', style: { alignItems: 'flex-start' } },
          DOM.el('span', { class: 'filter-label', style: { marginBottom: '8px' } }, 'Sort By'),
          DOM.el('div', { class: 'sort-select-wrapper' }, sortDropdown)
        )
      ),
      gridContainer
    );

    DOM.clear(this.appRoot);
    this.appRoot.appendChild(pageContainer);

    // 5. Connect UI Controllers
    this.gridManager = new GridManager(gridContainer, 'world');
    this.filterController = new Filter(filterContainer, allGenres);

    // Bind header search input
    const searchInput = document.getElementById('global-search-input');
    const searchWrapper = document.getElementById('header-search-wrapper');
    if (searchInput && searchWrapper) {
      searchWrapper.style.display = 'block';
      this.searchController = new Search(searchInput);
    }

    // 6. Register state change subscriptions to redraw grid
    this.subscriptions.push(
      globalEventBus.on('state:change', () => this.updateGrid())
    );

    // Initial render
    this.updateGrid();
  }

  /**
   * Filters worlds according to active state properties and displays them.
   */
  updateGrid() {
    if (!this.gridManager) return;

    const query = stateManager.getState('searchQuery') || '';
    const genres = stateManager.getState('selectedGenres') || [];
    const sortBy = stateManager.getState('sortBy') || 'featured';

    const filtered = SearchService.filterWorlds(this.worlds, { query, genres, sortBy });
    this.gridManager.render(filtered);
  }

  /**
   * Resets active search widgets and removes listeners.
   */
  unload() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    
    if (this.searchController) this.searchController.destroy();
    if (this.filterController) this.filterController.destroy();

    const searchWrapper = document.getElementById('header-search-wrapper');
    if (searchWrapper) {
      searchWrapper.style.display = 'none';
    }
  }
}
export default LandingPage;
