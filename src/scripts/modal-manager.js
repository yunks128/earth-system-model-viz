/**
 * Modal Manager
 * Handles modal dialogs and detailed views
 */

class ModalManager {
  constructor() {
    this.modal = null;
    this.modalTitle = null;
    this.modalBody = null;
    this.isOpen = false;
    
    this.init();
  }

  /**
   * Initialize modal elements
   */
  init() {
    this.modal = document.getElementById('detailModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalBody = document.getElementById('modalBody');
    
    if (this.modal) {
      this.setupEventListeners();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Close button
    const closeBtn = this.modal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  /**
   * Show modal with content
   */
  show(title, content) {
    if (!this.modal) return;

    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = content;
    
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    
    // Focus management
    this.modal.focus();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Animation
    setTimeout(() => {
      this.modal.classList.add('modal-open');
    }, 10);
  }

  /**
   * Show variable details
   */
  showVariableDetails(variable, allData) {
    const title = variable.variable;
    
    const sources = Array.isArray(variable.sources) 
      ? variable.sources 
      : variable.sources.split(/[,;]\s*/);
    
    const models = Array.isArray(variable.models)
      ? variable.models
      : variable.models.split(/[,;]\s*/);

    const content = `
      <div class="modal-section">
        <h4>Variable Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Name:</label>
            <span>${variable.variable}</span>
          </div>
          <div class="detail-item">
            <label>Category:</label>
            <span>${variable.category}</span>
          </div>
          ${variable.units ? `
          <div class="detail-item">
            <label>Units:</label>
            <span>${variable.units}</span>
          </div>
          ` : ''}
          ${variable.description ? `
          <div class="detail-item">
            <label>Description:</label>
            <span>${variable.description}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="modal-section">
        <h4>Data Sources</h4>
        <div class="sources-list">
          ${sources.map(source => `
            <div class="source-item">
              <span class="source-name">${source.trim()}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="modal-section">
        <h4>Earth System Models</h4>
        <div class="models-list">
          ${models.map(modelName => {
            const model = allData.models.find(m => m.name === modelName.trim());
            return `
              <div class="model-item">
                <div class="model-header">
                  <span class="model-name">${modelName.trim()}</span>
                  ${model ? `<span class="model-domain">${model.domain || ''}</span>` : ''}
                </div>
                ${model ? `
                <div class="model-details">
                  <div class="model-full-name">${model.fullName || ''}</div>
                  ${model.description ? `<div class="model-description">${model.description}</div>` : ''}
                </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      ${variable.applications ? `
      <div class="modal-section">
        <h4>Applications</h4>
        <div class="applications-list">
          ${Array.isArray(variable.applications) 
            ? variable.applications.map(app => `<div class="application-item">${app}</div>`).join('')
            : `<div class="application-item">${variable.applications}</div>`
          }
        </div>
      </div>
      ` : ''}
      
      <div class="modal-actions">
        <button class="modal-btn" onclick="window.app?.filterAndRender(); window.app?.modalManager?.close();">
          Filter by this variable
        </button>
        <button class="modal-btn secondary" onclick="navigator.share ? navigator.share({title: '${variable.variable}', text: '${variable.description || variable.variable}', url: window.location.href}) : console.log('Share not supported')">
          Share
        </button>
      </div>
    `;

    this.show(title, content);
  }

  /**
   * Show model details
   */
  showModelDetails(model, variables) {
    if (!model) return;

    const title = model.name;
    const variableCount = variables.length;
    
    // Group variables by category
    const categoriesMap = {};
    variables.forEach(variable => {
      if (!categoriesMap[variable.category]) {
        categoriesMap[variable.category] = [];
      }
      categoriesMap[variable.category].push(variable);
    });

    const content = `
      <div class="modal-section">
        <h4>Model Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Name:</label>
            <span>${model.name}</span>
          </div>
          ${model.fullName ? `
          <div class="detail-item">
            <label>Full Name:</label>
            <span>${model.fullName}</span>
          </div>
          ` : ''}
          ${model.domain ? `
          <div class="detail-item">
            <label>Domain:</label>
            <span>${model.domain}</span>
          </div>
          ` : ''}
          ${model.description ? `
          <div class="detail-item">
            <label>Description:</label>
            <span>${model.description}</span>
          </div>
          ` : ''}
          <div class="detail-item">
            <label>Variables:</label>
            <span>${variableCount} variables</span>
          </div>
        </div>
      </div>
      
      ${Object.keys(categoriesMap).length > 0 ? `
      <div class="modal-section">
        <h4>Variables by Category</h4>
        <div class="categories-list">
          ${Object.entries(categoriesMap).map(([category, categoryVariables]) => `
            <div class="category-group">
              <h5 class="category-name">${category}</h5>
              <div class="category-variables">
                ${categoryVariables.map(variable => `
                  <div class="variable-summary" onclick="window.app?.handleVariableClick?.(${JSON.stringify(variable).replace(/"/g, '&quot;')})">
                    <span class="variable-name">${variable.variable}</span>
                    ${variable.units ? `<span class="variable-units">(${variable.units})</span>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${model.url ? `
      <div class="modal-section">
        <h4>External Links</h4>
        <div class="links-list">
          <a href="${model.url}" target="_blank" rel="noopener noreferrer" class="external-link">
            Model Website
          </a>
        </div>
      </div>
      ` : ''}
      
      <div class="modal-actions">
        <button class="modal-btn" onclick="window.app?.handleModelClick?.({currentTarget: {dataset: {model: '${model.name}'}}})">
          Filter by ${model.name}
        </button>
        <button class="modal-btn secondary" onclick="window.app?.modalManager?.close()">
          Close
        </button>
      </div>
    `;

    this.show(title, content);
  }

  /**
   * Show about information
   */
  showAbout() {
    const title = 'About Earth System Model Visualization';
    
    const content = `
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
      
      <div class="modal-actions">
        <button class="modal-btn" onclick="window.app?.modalManager?.close()">
          Close
        </button>
      </div>
    `;

    this.show(title, content);
  }

  /**
   * Show error message
   */
  showError(title, message, details = '') {
    const content = `
      <div class="modal-section error-section">
        <div class="error-icon">⚠️</div>
        <h4>${title}</h4>
        <p>${message}</p>
        ${details ? `
        <div class="error-details">
          <details>
            <summary>Technical Details</summary>
            <pre>${details}</pre>
          </details>
        </div>
        ` : ''}
      </div>
      
      <div class="modal-actions">
        <button class="modal-btn" onclick="location.reload()">
          Reload Page
        </button>
        <button class="modal-btn secondary" onclick="window.app?.modalManager?.close()">
          Close
        </button>
      </div>
    `;

    this.show('Error', content);
  }

  /**
   * Close modal
   */
  close() {
    if (!this.modal || !this.isOpen) return;

    this.modal.classList.remove('modal-open');
    
    setTimeout(() => {
      this.modal.style.display = 'none';
      this.modal.setAttribute('aria-hidden', 'true');
      this.isOpen = false;
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Return focus to trigger element if available
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== document.body) {
        activeElement.blur();
      }
    }, 300);
  }

  /**
   * Check if modal is open
   */
  isModalOpen() {
    return this.isOpen;
  }

  /**
   * Destroy modal manager
   */
  destroy() {
    this.close();
    
    if (this.modal) {
      this.modal.removeEventListener('click', null);
    }
    
    document.removeEventListener('keydown', null);
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
}