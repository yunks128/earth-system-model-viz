/**
 * Earth System Model Data Assimilation Visualization
 * Main Application Logic
 * 
 * This file initializes the application and coordinates all components
 */

class EarthSystemViz {
  constructor() {
    this.data = null;
    this.filteredData = null;
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.currentView = 'cards';
    this.isLoading = true;
    
    // Component instances
    this.dataManager = null;
    this.uiComponents = null;
    this.networkView = null;
    this.modalManager = null;
    
    // DOM elements
    this.elements = {};
    
    // Bind methods
    this.handleSearch = this.handleSearch.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleViewToggle = this.handleViewToggle.bind(this);
    this.handleModelClick = this.handleModelClick.bind(this);
    this.handleVariableClick = this.handleVariableClick.bind(this);
    this.handleKeyboard = this.handleKeyboard.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing Earth System Model Visualization...');
      
      // Cache DOM elements
      this.cacheElements();
      
      // Initialize components
      this.initializeComponents();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial render
      this.render();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      console.log('✅ Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showError('Failed to initialize application', error.message);
    }
  }
  
  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      // Containers
      loadingScreen: document.getElementById('loadingScreen'),
      mainContainer: document.getElementById('mainContainer'),
      errorMessage: document.getElementById('errorMessage'),
      
      // Search and filters
      searchBox: document.getElementById('searchBox'),
      searchClear: document.getElementById('searchClear'),
      filterButtons: document.querySelectorAll('.filter-btn'),
      viewButtons: document.querySelectorAll('.view-btn'),
      
      // Model cards
      modelCards: document.querySelectorAll('.model-card'),
      
      // Views
      cardView: document.getElementById('cardView'),
      networkView: document.getElementById('networkView'),
      tableView: document.getElementById('tableView'),
      categoryGrid: document.getElementById('categoryGrid'),
      
      // Statistics
      totalVariables: document.getElementById('total-variables'),
      visibleVariables: document.getElementById('visible-variables'),
      activeCategories: document.getElementById('active-categories'),
      missionCount: document.getElementById('mission-count'),
      
      // Model counts
      eccoCount: document.getElementById('ecco-count'),
      issmCount: document.getElementById('issm-count'),
      cardamomCount: document.getElementById('cardamom-count'),
      cmsCount: document.getElementById('cms-count'),
      momoCount: document.getElementById('momo-count'),
      
      // Modal
      modal: document.getElementById('detailModal'),
      modalTitle: document.getElementById('modalTitle'),
      modalBody: document.getElementById('modalBody'),
      
      // Network
      networkCanvas: document.getElementById('networkCanvas'),
      networkReset: document.getElementById('networkReset'),
      networkExport: document.getElementById('networkExport'),
      
      // Table
      dataTable: document.getElementById('dataTable'),
      tableBody: document.getElementById('tableBody'),
      sortBy: document.getElementById('sortBy'),
      exportCSV: document.getElementById('exportCSV'),
      exportJSON: document.getElementById('exportJSON')
    };
  }
  
  /**
   * Initialize component instances
   */
  initializeComponents() {
    this.dataManager = new DataManager();
    this.uiComponents = new UIComponents();
    this.networkView = new NetworkView();
    this.modalManager = new ModalManager();
  }
  
  /**
   * Load and process data
   */
  async loadData() {
    try {
      console.log('📊 Loading data...');
      
      // Load data using DataManager
      this.data = await this.dataManager.loadData();
      this.filteredData = [...this.data.variables];
      
      console.log(`✅ Loaded ${this.data.variables.length} variables from ${this.data.models.length} models`);
      
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      throw new Error(`Data loading failed: ${error.message}`);
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search functionality
    this.elements.searchBox?.addEventListener('input', this.handleSearch);
    this.elements.searchClear?.addEventListener('click', this.clearSearch.bind(this));
    
    // Filter buttons
    this.elements.filterButtons.forEach(btn => {
      btn.addEventListener('click', this.handleFilter);
    });
    
    // View toggle buttons
    this.elements.viewButtons.forEach(btn => {
      btn.addEventListener('click', this.handleViewToggle);
    });
    
    // Model cards
    this.elements.modelCards.forEach(card => {
      card.addEventListener('click', this.handleModelClick);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleModelClick(e);
        }
      });
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard);
    
    // Window resize
    window.addEventListener('resize', this.debounce(this.handleResize, 250));
    
    // Modal close
    this.elements.modal?.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.modalManager.close();
      }
    });
    
    // Network controls
    this.elements.networkReset?.addEventListener('click', () => {
      this.networkView.reset();
    });
    
    this.elements.networkExport?.addEventListener('click', () => {
      this.networkView.exportImage();
    });
    
    // Table controls
    this.elements.sortBy?.addEventListener('change', this.handleTableSort.bind(this));
    this.elements.exportCSV?.addEventListener('click', this.exportCSV.bind(this));
    this.elements.exportJSON?.addEventListener('click', this.exportJSON.bind(this));
    
    // Statistics hover effects
    this.setupStatisticsInteractions();
  }
  
  /**
   * Setup statistics hover interactions
   */
  setupStatisticsInteractions() {
    const statItems = document.querySelectorAll('.stat-item');
    
    statItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        this.uiComponents.showTooltip(item, this.getStatTooltip(item.id));
      });
      
      item.addEventListener('mouseleave', () => {
        this.uiComponents.hideTooltip();
      });
    });
  }
  
  /**
   * Get tooltip text for statistics
   */
  getStatTooltip(statId) {
    const tooltips = {
      'total-variables': 'Total number of variables across all Earth system models',
      'visible-variables': 'Number of variables currently shown based on filters',
      'active-categories': 'Number of variable categories currently displayed',
      'mission-count': 'Approximate number of satellite missions and data sources'
    };
    
    return tooltips[statId] || '';
  }
  
  /**
   * Handle search input
   */
  handleSearch(event) {
    this.currentSearch = event.target.value.toLowerCase();
    
    // Show/hide clear button
    if (this.elements.searchClear) {
      this.elements.searchClear.classList.toggle('visible', this.currentSearch.length > 0);
    }
    
    this.filterAndRender();
    
    // Analytics tracking
    this.trackEvent('search', { query: this.currentSearch });
  }
  
  /**
   * Clear search
   */
  clearSearch() {
    this.elements.searchBox.value = '';
    this.currentSearch = '';
    this.elements.searchClear?.classList.remove('visible');
    this.filterAndRender();
  }
  
  /**
   * Handle filter button clicks
   */
  handleFilter(event) {
    // Update button states
    this.elements.filterButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    
    event.target.classList.add('active');
    event.target.setAttribute('aria-pressed', 'true');
    
    this.currentFilter = event.target.dataset.model;
    this.filterAndRender();
    
    // Update model card selection
    this.updateModelCardSelection();
    
    // Analytics tracking
    this.trackEvent('filter', { model: this.currentFilter });
  }
  
  /**
   * Handle view toggle
   */
  handleViewToggle(event) {
    // Update button states
    this.elements.viewButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    
    event.target.classList.add('active');
    event.target.setAttribute('aria-pressed', 'true');
    
    this.currentView = event.target.dataset.view;
    this.switchView();
    
    // Analytics tracking
    this.trackEvent('view_change', { view: this.currentView });
  }
  
  /**
   * Switch between different views
   */
  switchView() {
    // Hide all views
    this.elements.cardView?.classList.remove('active');
    this.elements.networkView?.classList.remove('active');
    this.elements.tableView?.classList.remove('active');
    
    // Show selected view
    switch (this.currentView) {
      case 'cards':
        this.elements.cardView?.classList.add('active');
        if (this.elements.cardView) this.elements.cardView.style.display = 'block';
        if (this.elements.networkView) this.elements.networkView.style.display = 'none';
        if (this.elements.tableView) this.elements.tableView.style.display = 'none';
        break;
        
      case 'network':
        this.elements.networkView?.classList.add('active');
        if (this.elements.cardView) this.elements.cardView.style.display = 'none';
        if (this.elements.networkView) this.elements.networkView.style.display = 'block';
        if (this.elements.tableView) this.elements.tableView.style.display = 'none';
        
        // Initialize network view if not already done
        setTimeout(() => {
          this.networkView.init(this.elements.networkCanvas, this.filteredData, this.data.models);
        }, 100);
        break;
        
      case 'table':
        this.elements.tableView?.classList.add('active');
        if (this.elements.cardView) this.elements.cardView.style.display = 'none';
        if (this.elements.networkView) this.elements.networkView.style.display = 'none';
        if (this.elements.tableView) this.elements.tableView.style.display = 'block';
        
        this.renderTable();
        break;
    }
  }
  
  /**
   * Handle model card clicks
   */
  handleModelClick(event) {
    const modelName = event.currentTarget.dataset.model;
    
    // Update filter
    this.currentFilter = modelName;
    
    // Update UI states
    this.updateFilterButtons();
    this.updateModelCardSelection();
    
    // Filter and render
    this.filterAndRender();
    
    // Show model details
    this.showModelDetails(modelName);
    
    // Analytics tracking
    this.trackEvent('model_click', { model: modelName });
  }
  
  /**
   * Update filter button states
   */
  updateFilterButtons() {
    this.elements.filterButtons.forEach(btn => {
      const isActive = btn.dataset.model === this.currentFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive.toString());
    });
  }
  
  /**
   * Update model card selection states
   */
  updateModelCardSelection() {
    this.elements.modelCards.forEach(card => {
      const isSelected = this.currentFilter === 'all' || card.dataset.model === this.currentFilter;
      card.classList.toggle('selected', isSelected);
    });
  }
  
  /**
   * Handle variable item clicks
   */
  handleVariableClick(variable) {
    this.showVariableDetails(variable);
    
    // Analytics tracking
    this.trackEvent('variable_click', { variable: variable.variable });
  }
  
  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(event) {
    // Don't trigger shortcuts if user is typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      if (event.key === 'Escape') {
        event.target.blur();
      }
      return;
    }
    
    switch (event.key) {
      case '/':
        event.preventDefault();
        this.elements.searchBox?.focus();
        break;
        
      case 'Escape':
        this.modalManager.close();
        this.elements.searchBox?.blur();
        break;
        
      case '1':
      case '2':
      case '3':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const viewIndex = parseInt(event.key) - 1;
          const viewButtons = Array.from(this.elements.viewButtons);
          if (viewButtons[viewIndex]) {
            viewButtons[viewIndex].click();
          }
        }
        break;
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Redraw network view if active
    if (this.currentView === 'network') {
      this.networkView.resize();
    }
    
    // Update responsive layouts
    this.uiComponents.updateResponsiveLayout();
  }
  
  /**
   * Filter data and render
   */
  filterAndRender() {
    this.filteredData = this.dataManager.filterData(
      this.data.variables,
      this.currentFilter,
      this.currentSearch
    );
    
    this.render();
  }
  
  /**
   * Main render function
   */
  render() {
    this.renderCategories();
    this.updateStatistics();
    this.updateModelCounts();
    this.highlightSearchResults();
    
    // Update current view
    if (this.currentView === 'table') {
      this.renderTable();
    } else if (this.currentView === 'network') {
      this.networkView.update(this.filteredData);
    }
  }
  
  /**
   * Render category cards
   */
  renderCategories() {
    if (!this.elements.categoryGrid) return;
    
    const categories = this.dataManager.groupByCategory(this.filteredData);
    this.uiComponents.renderCategories(this.elements.categoryGrid, categories, {
      onVariableClick: this.handleVariableClick.bind(this),
      onModelTagClick: this.handleModelTagClick.bind(this)
    });
  }
  
  /**
   * Handle model tag clicks
   */
  handleModelTagClick(modelName, event) {
    event.stopPropagation();
    
    // Update filter
    this.currentFilter = modelName;
    this.updateFilterButtons();
    this.updateModelCardSelection();
    this.filterAndRender();
    
    // Analytics tracking
    this.trackEvent('model_tag_click', { model: modelName });
  }
  
  /**
   * Update statistics display
   */
  updateStatistics() {
    const stats = this.dataManager.calculateStatistics(this.filteredData, this.data);
    
    if (this.elements.visibleVariables) {
      this.elements.visibleVariables.querySelector('h3').textContent = stats.visibleVariables;
    }
    
    if (this.elements.activeCategories) {
      this.elements.activeCategories.querySelector('h3').textContent = stats.activeCategories;
    }
    
    if (this.elements.missionCount) {
      this.elements.missionCount.querySelector('h3').textContent = stats.totalMissions + '+';
    }
  }
  
  /**
   * Update model counts
   */
  updateModelCounts() {
    const counts = this.dataManager.getModelCounts(this.filteredData);
    
    const countElements = {
      'ECCO': this.elements.eccoCount,
      'ISSM': this.elements.issmCount,
      'CARDAMOM': this.elements.cardamomCount,
      'CMS-FLUX': this.elements.cmsCount,
      'MOMO-CHEM': this.elements.momoCount
    };
    
    Object.entries(counts).forEach(([model, count]) => {
      const element = countElements[model];
      if (element) {
        element.textContent = count;
      }
    });
  }
  
  /**
   * Highlight search results
   */
  highlightSearchResults() {
    if (!this.currentSearch) {
      // Remove all highlights
      document.querySelectorAll('.highlighted').forEach(el => {
        el.classList.remove('highlighted');
      });
      return;
    }
    
    this.uiComponents.highlightSearchResults(this.currentSearch);
  }
  
  /**
   * Render table view
   */
  renderTable() {
    if (!this.elements.tableBody) return;
    
    this.uiComponents.renderTable(this.elements.tableBody, this.filteredData, {
      onVariableClick: this.handleVariableClick.bind(this)
    });
  }
  
  /**
   * Handle table sorting
   */
  handleTableSort(event) {
    const sortBy = event.target.value;
    this.filteredData = this.dataManager.sortData(this.filteredData, sortBy);
    this.renderTable();
    
    // Analytics tracking
    this.trackEvent('table_sort', { sortBy });
  }
  
  /**
   * Show variable details in modal
   */
  showVariableDetails(variable) {
    this.modalManager.showVariableDetails(variable, this.data);
  }
  
  /**
   * Show model details in modal
   */
  showModelDetails(modelName) {
    const modelData = this.data.models.find(m => m.name === modelName);
    const variableData = this.filteredData.filter(v => 
      v.models.some(m => m === modelName)
    );
    
    this.modalManager.showModelDetails(modelData, variableData);
  }
  
  /**
   * Export data as CSV
   */
  exportCSV() {
    const csv = this.dataManager.exportToCSV(this.filteredData);
    this.downloadFile(csv, 'earth-system-variables.csv', 'text/csv');
    
    // Analytics tracking
    this.trackEvent('export', { format: 'csv', count: this.filteredData.length });
  }
  
  /**
   * Export data as JSON
   */
  exportJSON() {
    const json = this.dataManager.exportToJSON(this.filteredData);
    this.downloadFile(json, 'earth-system-variables.json', 'application/json');
    
    // Analytics tracking
    this.trackEvent('export', { format: 'json', count: this.filteredData.length });
  }
  
  /**
   * Download file helper
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Hide loading screen with animation
   */
  hideLoadingScreen() {
    const loadingScreen = this.elements.loadingScreen;
    const mainContainer = this.elements.mainContainer;
    
    if (loadingScreen && mainContainer) {
      loadingScreen.classList.add('fade-out');
      mainContainer.style.display = 'block';
      mainContainer.classList.add('fade-in');
      
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        this.isLoading = false;
      }, 500);
    }
  }
  
  /**
   * Show error message
   */
  showError(title, message) {
    const errorElement = this.elements.errorMessage;
    if (errorElement) {
      const titleElement = errorElement.querySelector('h3');
      const messageElement = errorElement.querySelector('#errorText');
      
      if (titleElement) titleElement.textContent = title;
      if (messageElement) messageElement.textContent = message;
      
      errorElement.classList.add('show');
      
      // Hide loading screen if shown
      if (this.elements.loadingScreen) {
        this.elements.loadingScreen.style.display = 'none';
      }
    }
    
    console.error(`${title}: ${message}`);
  }
  
  /**
   * Track analytics events
   */
  trackEvent(eventName, parameters = {}) {
    // Google Analytics 4 tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        ...parameters,
        app_name: 'Earth System Model Viz',
        app_version: '1.0.0'
      });
    }
    
    // Console logging for development
    console.log(`📊 Event: ${eventName}`, parameters);
  }
  
  /**
   * Debounce utility function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Show about modal
   */
  showAbout() {
    const aboutContent = `
      <div class="modal-section">
        <h4>About This Visualization</h4>
        <p>This interactive visualization explores the relationships between Earth system model variables, satellite missions, and data assimilation systems used in climate and Earth science research.</p>
      </div>
      
      <div class="modal-section">
        <h4>Earth System Models</h4>
        <ul>
          <li><strong>ECCO</strong> - Ocean circulation and sea ice modeling</li>
          <li><strong>ISSM</strong> - Ice sheet dynamics and sea level projection</li>
          <li><strong>CARDAMOM</strong> - Terrestrial carbon cycle processes</li>
          <li><strong>CMS-FLUX</strong> - Atmospheric carbon monitoring</li>
          <li><strong>MOMO-CHEM</strong> - Atmospheric chemistry and air quality</li>
        </ul>
      </div>
      
      <div class="modal-section">
        <h4>Data Sources</h4>
        <p>Data includes information from 100+ satellite missions, ground-based networks, and reanalysis products spanning ocean, land, atmosphere, and carbon cycle observations.</p>
      </div>
      
      <div class="modal-section">
        <h4>How to Use</h4>
        <ul>
          <li>Use the search bar to find specific variables or missions</li>
          <li>Click model buttons to filter by Earth system model</li>
          <li>Switch between card, network, and table views</li>
          <li>Click on variables for detailed information</li>
          <li>Export filtered data as CSV or JSON</li>
        </ul>
      </div>
      
      <div class="modal-section">
        <h4>Keyboard Shortcuts</h4>
        <ul>
          <li><kbd>/</kbd> - Focus search box</li>
          <li><kbd>Esc</kbd> - Close modals</li>
          <li><kbd>Ctrl+1/2/3</kbd> - Switch views</li>
        </ul>
      </div>
    `;
    
    this.modalManager.show('About Earth System Model Visualization', aboutContent);
  }
  
  /**
   * Cleanup and destroy
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyboard);
    window.removeEventListener('resize', this.handleResize);
    
    // Cleanup components
    if (this.networkView) {
      this.networkView.destroy();
    }
    
    if (this.modalManager) {
      this.modalManager.destroy();
    }
    
    // Clear data
    this.data = null;
    this.filteredData = null;
    
    console.log('🧹 Application cleaned up');
  }
}

/**
 * Global functions for inline event handlers
 */
window.showAbout = function() {
  if (window.app) {
    window.app.showAbout();
  }
};

window.closeModal = function() {
  if (window.app && window.app.modalManager) {
    window.app.modalManager.close();
  }
};

window.filterByModel = function(modelName, event) {
  if (window.app) {
    window.app.handleModelTagClick(modelName, event);
  }
};

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🌍 Starting Earth System Model Visualization...');
    
    // Create global app instance
    window.app = new EarthSystemViz();
    
    // Initialize the application
    await window.app.init();
    
    // Service Worker registration (if available)
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    
    // Show error message
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.classList.add('show');
    }
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }
});

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', () => {
  if (window.app) {
    if (document.hidden) {
      // Page is hidden - pause animations, etc.
      window.app.trackEvent('page_hidden');
    } else {
      // Page is visible - resume animations, etc.
      window.app.trackEvent('page_visible');
    }
  }
});

/**
 * Handle beforeunload for cleanup
 */
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.trackEvent('page_unload');
    window.app.destroy();
  }
});

/**
 * Handle online/offline status
 */
window.addEventListener('online', () => {
  console.log('🌐 Connection restored');
  if (window.app) {
    window.app.trackEvent('online');
  }
});

window.addEventListener('offline', () => {
  console.log('📡 Connection lost');
  if (window.app) {
    window.app.trackEvent('offline');
  }
});

/**
 * Export for testing
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EarthSystemViz;
}