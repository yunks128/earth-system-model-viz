/**
 * UI Components
 * Handles rendering of UI elements and interactions
 */

class UIComponents {
  constructor() {
    this.tooltip = null;
    this.createTooltip();
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      pointer-events: none;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s;
      max-width: 300px;
      word-wrap: break-word;
    `;
    document.body.appendChild(this.tooltip);
  }

  /**
   * Show tooltip
   */
  showTooltip(element, text) {
    if (!text) return;
    
    this.tooltip.textContent = text;
    this.tooltip.style.opacity = '1';
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    
    let top = rect.bottom + 10;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Adjust if tooltip goes off screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = rect.top - tooltipRect.height - 10;
    }
    
    this.tooltip.style.top = top + 'px';
    this.tooltip.style.left = left + 'px';
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    this.tooltip.style.opacity = '0';
  }

  /**
   * Render category cards
   */
  renderCategories(container, categories, callbacks = {}) {
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(categories).forEach(([categoryName, variables]) => {
      const categoryCard = this.createCategoryCard(categoryName, variables, callbacks);
      container.appendChild(categoryCard);
    });
  }

  /**
   * Create category card element
   */
  createCategoryCard(categoryName, variables, callbacks) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('data-category', categoryName);
    
    const header = document.createElement('div');
    header.className = 'category-header';
    
    const title = document.createElement('h3');
    title.textContent = categoryName;
    title.className = 'category-title';
    
    const count = document.createElement('span');
    count.textContent = `${variables.length} variables`;
    count.className = 'category-count';
    
    header.appendChild(title);
    header.appendChild(count);
    
    const variablesList = document.createElement('div');
    variablesList.className = 'variables-list';
    
    variables.forEach(variable => {
      const variableItem = this.createVariableItem(variable, callbacks);
      variablesList.appendChild(variableItem);
    });
    
    card.appendChild(header);
    card.appendChild(variablesList);
    
    return card;
  }

  /**
   * Create variable item element
   */
  createVariableItem(variable, callbacks) {
    const item = document.createElement('div');
    item.className = 'variable-item';
    item.setAttribute('data-variable', variable.variable);
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    
    const name = document.createElement('div');
    name.className = 'variable-name';
    name.textContent = variable.variable;
    
    const meta = document.createElement('div');
    meta.className = 'variable-meta';
    
    const sources = document.createElement('div');
    sources.className = 'variable-sources';
    const sourceList = Array.isArray(variable.sources) 
      ? variable.sources.slice(0, 3).join(', ')
      : variable.sources;
    sources.textContent = `Sources: ${sourceList}${Array.isArray(variable.sources) && variable.sources.length > 3 ? '...' : ''}`;
    
    const models = document.createElement('div');
    models.className = 'variable-models';
    
    const modelList = Array.isArray(variable.models) ? variable.models : [variable.models];
    modelList.forEach(modelName => {
      const modelTag = document.createElement('span');
      modelTag.className = 'model-tag';
      modelTag.textContent = modelName;
      modelTag.setAttribute('data-model', modelName);
      
      if (callbacks.onModelTagClick) {
        modelTag.addEventListener('click', (e) => {
          callbacks.onModelTagClick(modelName, e);
        });
      }
      
      models.appendChild(modelTag);
    });
    
    meta.appendChild(sources);
    meta.appendChild(models);
    
    item.appendChild(name);
    item.appendChild(meta);
    
    // Add click handler
    if (callbacks.onVariableClick) {
      item.addEventListener('click', () => {
        callbacks.onVariableClick(variable);
      });
      
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          callbacks.onVariableClick(variable);
        }
      });
    }
    
    return item;
  }

  /**
   * Render table view
   */
  renderTable(tableBody, variables, callbacks = {}) {
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    variables.forEach(variable => {
      const row = this.createTableRow(variable, callbacks);
      tableBody.appendChild(row);
    });
  }

  /**
   * Create table row element
   */
  createTableRow(variable, callbacks) {
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.setAttribute('data-variable', variable.variable);
    
    // Variable name cell
    const nameCell = document.createElement('td');
    nameCell.className = 'variable-cell';
    nameCell.textContent = variable.variable;
    
    if (callbacks.onVariableClick) {
      nameCell.style.cursor = 'pointer';
      nameCell.addEventListener('click', () => {
        callbacks.onVariableClick(variable);
      });
    }
    
    // Category cell
    const categoryCell = document.createElement('td');
    categoryCell.className = 'category-cell';
    categoryCell.textContent = variable.category;
    
    // Sources cell
    const sourcesCell = document.createElement('td');
    sourcesCell.className = 'sources-cell';
    const sources = Array.isArray(variable.sources) 
      ? variable.sources.join(', ')
      : variable.sources;
    sourcesCell.textContent = sources;
    
    // Models cell
    const modelsCell = document.createElement('td');
    modelsCell.className = 'models-cell';
    const models = Array.isArray(variable.models)
      ? variable.models.join(', ')
      : variable.models;
    modelsCell.textContent = models;
    
    row.appendChild(nameCell);
    row.appendChild(categoryCell);
    row.appendChild(sourcesCell);
    row.appendChild(modelsCell);
    
    return row;
  }

  /**
   * Highlight search results
   */
  highlightSearchResults(query) {
    if (!query) return;
    
    const elements = document.querySelectorAll('.variable-name, .variable-sources, .model-tag');
    
    elements.forEach(element => {
      const text = element.textContent;
      if (text.toLowerCase().includes(query.toLowerCase())) {
        element.classList.add('highlighted');
      } else {
        element.classList.remove('highlighted');
      }
    });
  }

  /**
   * Update responsive layout
   */
  updateResponsiveLayout() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    document.body.classList.toggle('mobile', isMobile);
    document.body.classList.toggle('tablet', isTablet);
    document.body.classList.toggle('desktop', !isMobile && !isTablet);
    
    // Update grid layouts
    const categoryGrid = document.getElementById('categoryGrid');
    if (categoryGrid) {
      const columns = isMobile ? 1 : isTablet ? 2 : 3;
      categoryGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }
  }

  /**
   * Show loading state
   */
  showLoading(element, message = 'Loading...') {
    if (!element) return;
    
    element.classList.add('loading');
    element.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    `;
  }

  /**
   * Hide loading state
   */
  hideLoading(element) {
    if (!element) return;
    
    element.classList.remove('loading');
  }

  /**
   * Create empty state message
   */
  createEmptyState(container, message, icon = '🔍') {
    if (!container) return;
    
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-message">${message}</div>
      </div>
    `;
  }

  /**
   * Animate element entrance
   */
  animateIn(element, delay = 0) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  }

  /**
   * Create notification
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIComponents;
}