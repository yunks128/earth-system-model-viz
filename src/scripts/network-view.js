/**
 * Network View
 * Handles network graph visualization using D3.js
 */

class NetworkView {
  constructor() {
    this.canvas = null;
    this.context = null;
    this.simulation = null;
    this.nodes = [];
    this.links = [];
    this.width = 800;
    this.height = 600;
    this.transform = d3.zoomIdentity;
  }

  /**
   * Initialize network view
   */
  init(canvas, variables, models) {
    if (!canvas || typeof d3 === 'undefined') {
      console.warn('Canvas or D3.js not available for network view');
      return;
    }

    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    
    this.updateDimensions();
    this.processData(variables, models);
    this.setupSimulation();
    this.setupInteractions();
    
    console.log('🕸️ Network view initialized');
  }

  /**
   * Update canvas dimensions with larger default size
   */
  updateDimensions() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    this.width = container.clientWidth || 1400;  // Increased default width
    this.height = Math.max(container.clientHeight || 1000, 1000);  // Increased default height
    
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  /**
   * Process data for network visualization with categories as major nodes
   */
  processData(variables, models) {
    this.nodes = [];
    this.links = [];
    
    const nodeMap = new Map();
    let nodeId = 0;
    
    // Collect all unique data sources (missions/satellites)
    const allSources = new Set();
    variables.forEach(variable => {
      const sources = Array.isArray(variable.sources) 
        ? variable.sources 
        : variable.sources.split(/[,;]\s*/);
      sources.forEach(source => allSources.add(source.trim()));
    });
    
    // 1. Create CATEGORY nodes as major central nodes
    const categories = [...new Set(variables.map(v => v.category))];
    const categoryRadius = Math.min(this.width, this.height) * 0.2;
    
    categories.forEach((category, index) => {
      const angle = (index / categories.length) * 2 * Math.PI;
      const categoryVariables = variables.filter(v => v.category === category);
      
      const node = {
        id: nodeId++,
        name: category,
        type: 'category',
        x: this.width * 0.5 + Math.cos(angle) * categoryRadius,
        y: this.height * 0.5 + Math.sin(angle) * categoryRadius,
        radius: 35 + (categoryVariables.length * 2), // Size based on variable count
        color: this.getCategoryColor(category),
        variables: categoryVariables,
        variableCount: categoryVariables.length
      };
      
      this.nodes.push(node);
      nodeMap.set('category_' + category, node);
    });
    
    // 2. Create VARIABLE nodes positioned around their categories
    variables.forEach((variable, globalIndex) => {
      const categoryNode = nodeMap.get('category_' + variable.category);
      const categoryVariables = variables.filter(v => v.category === variable.category);
      const variableIndex = categoryVariables.findIndex(v => v.id === variable.id);
      
      // Position variables in a circle around their category
      const angle = (variableIndex / categoryVariables.length) * 2 * Math.PI;
      const distance = 120 + (categoryVariables.length * 2); // Distance from category center
      
      const node = {
        id: nodeId++,
        name: variable.variable,
        type: 'variable',
        category: variable.category,
        sources: Array.isArray(variable.sources) ? variable.sources : variable.sources.split(/[,;]\s*/),
        models: Array.isArray(variable.models) ? variable.models : [variable.models],
        units: variable.units,
        description: variable.description,
        variableData: variable,
        x: categoryNode.x + Math.cos(angle) * distance,
        y: categoryNode.y + Math.sin(angle) * distance,
        radius: 12,
        color: this.getCategoryColor(variable.category),
        categoryNode: categoryNode
      };
      
      this.nodes.push(node);
      nodeMap.set('variable_' + variable.id, node);
    });
    
    // 3. Create MODEL nodes positioned strategically
    const modelPositions = [
      { x: 0.15, y: 0.2 },  // Top-left
      { x: 0.85, y: 0.2 },  // Top-right
      { x: 0.15, y: 0.8 },  // Bottom-left
      { x: 0.85, y: 0.8 },  // Bottom-right
      { x: 0.5, y: 0.1 }    // Top-center
    ];
    
    models.forEach((model, index) => {
      const position = modelPositions[index] || { x: 0.5, y: 0.9 };
      const modelVariables = variables.filter(v => {
        const vModels = Array.isArray(v.models) ? v.models : [v.models];
        return vModels.includes(model.name);
      });
      
      const node = {
        id: nodeId++,
        name: model.name,
        type: 'model',
        fullName: model.fullName,
        description: model.description,
        domain: model.domain,
        x: this.width * position.x,
        y: this.height * position.y,
        radius: 30 + (modelVariables.length * 0.5), // Size based on variable count
        color: this.getModelColor(model.name),
        variableCount: modelVariables.length
      };
      
      this.nodes.push(node);
      nodeMap.set('model_' + model.name, node);
    });
    
    // 4. Create DATA SOURCE nodes positioned in outer regions
    const sourceArray = Array.from(allSources);
    const sourceSectors = 8; // Divide sources into sectors around the perimeter
    
    sourceArray.forEach((source, index) => {
      const sector = index % sourceSectors;
      const angle = (sector / sourceSectors) * 2 * Math.PI;
      const radius = Math.min(this.width, this.height) * 0.45;
      
      // Add some variation within each sector
      const angleVariation = (Math.random() - 0.5) * (2 * Math.PI / sourceSectors * 0.8);
      const radiusVariation = (Math.random() - 0.5) * 60;
      
      const sourceVariables = variables.filter(v => {
        const sources = Array.isArray(v.sources) ? v.sources : v.sources.split(/[,;]\s*/);
        return sources.some(s => s.trim() === source);
      });
      
      const node = {
        id: nodeId++,
        name: source,
        type: 'source',
        x: this.width * 0.5 + Math.cos(angle + angleVariation) * (radius + radiusVariation),
        y: this.height * 0.5 + Math.sin(angle + angleVariation) * (radius + radiusVariation),
        radius: 8 + Math.min(sourceVariables.length * 0.5, 6), // Size based on usage
        color: this.getSourceColor(source),
        variables: sourceVariables,
        variableCount: sourceVariables.length
      };
      
      this.nodes.push(node);
      nodeMap.set('source_' + source, node);
    });
    
    // Create links with hierarchy: Category -> Variable -> Model/Source
    
    // Variables to Categories (strong central connections)
    variables.forEach(variable => {
      const variableNode = nodeMap.get('variable_' + variable.id);
      const categoryNode = nodeMap.get('category_' + variable.category);
      
      if (variableNode && categoryNode) {
        this.links.push({
          source: categoryNode.id,
          target: variableNode.id,
          type: 'category-variable',
          strength: 0.8,
          color: '#43e97b',
          distance: 80
        });
      }
    });
    
    // Variables to Models
    variables.forEach(variable => {
      const variableNode = nodeMap.get('variable_' + variable.id);
      const variableModels = Array.isArray(variable.models) 
        ? variable.models 
        : [variable.models];
      
      variableModels.forEach(modelName => {
        const modelNode = nodeMap.get('model_' + modelName);
        if (variableNode && modelNode) {
          this.links.push({
            source: variableNode.id,
            target: modelNode.id,
            type: 'variable-model',
            strength: 0.4,
            color: '#667eea',
            distance: 150
          });
        }
      });
    });
    
    // Variables to Sources (lighter connections)
    variables.forEach(variable => {
      const variableNode = nodeMap.get('variable_' + variable.id);
      const sources = Array.isArray(variable.sources) 
        ? variable.sources 
        : variable.sources.split(/[,;]\s*/);
      
      sources.forEach(sourceName => {
        const sourceNode = nodeMap.get('source_' + sourceName.trim());
        if (variableNode && sourceNode) {
          this.links.push({
            source: variableNode.id,
            target: sourceNode.id,
            type: 'variable-source',
            strength: 0.2,
            color: '#ffa726',
            distance: 120
          });
        }
      });
    });
    
    console.log(`🕸️ Network data processed: ${this.nodes.length} nodes (${categories.length} categories, ${variables.length} variables, ${models.length} models, ${sourceArray.length} sources), ${this.links.length} links`);
  }
  
  /**
   * Get color for model nodes
   */
  getModelColor(modelName) {
    const colors = {
      'ECCO': '#2196f3',
      'ISSM': '#ff9800',
      'CARDAMOM': '#9c27b0',
      'CMS-FLUX': '#4caf50',
      'MOMO-CHEM': '#e91e63'
    };
    return colors[modelName] || '#607d8b';
  }
  
  /**
   * Get color for category nodes
   */
  getCategoryColor(category) {
    const colors = {
      'Ocean and Sea Ice Variables': '#4facfe',
      'Land and Terrestrial Variables': '#43e97b',
      'Atmospheric Composition': '#fa709a',
      'Carbon Cycle Components': '#fee140',
      'Climate and Reanalysis': '#a8edea'
    };
    return colors[category] || '#95a5a6';
  }
  
  /**
   * Get color for data source nodes
   */
  getSourceColor(source) {
    // Color code by mission/instrument type
    if (source.includes('GRACE') || source.includes('GOCE')) return '#8bc34a'; // Gravity missions
    if (source.includes('ICESat') || source.includes('GLAS')) return '#00bcd4'; // Ice/elevation
    if (source.includes('MODIS') || source.includes('VIIRS')) return '#ff5722'; // Optical sensors
    if (source.includes('AVHRR') || source.includes('METOP')) return '#3f51b5'; // Weather satellites
    if (source.includes('OCO') || source.includes('GOSAT')) return '#795548'; // Carbon monitoring
    if (source.includes('OMI') || source.includes('TROPOMI')) return '#9e9e9e'; // Atmospheric chemistry
    if (source.includes('Landsat') || source.includes('Sentinel')) return '#ff9800'; // Land monitoring
    if (source.includes('JASON') || source.includes('TOPEX')) return '#2196f3'; // Altimetry
    if (source.includes('SMAP') || source.includes('SMOS')) return '#4caf50'; // Soil moisture/salinity
    if (source.includes('ARGO') || source.includes('CTD')) return '#00acc1'; // In-situ ocean
    return '#607d8b'; // Default gray
  }

  /**
   * Setup D3 force simulation with enhanced hierarchical positioning
   */
  setupSimulation() {
    if (typeof d3 === 'undefined') return;
    
    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links)
        .id(d => d.id)
        .distance(d => {
          // Hierarchical distances for better structure
          switch(d.type) {
            case 'category-variable': return 80;  // Short distance from category to variables
            case 'variable-model': return 150;   // Medium distance to models
            case 'variable-source': return 120;  // Medium distance to sources
            default: return 100;
          }
        })
        .strength(d => {
          // Stronger connections for hierarchy
          switch(d.type) {
            case 'category-variable': return 0.8;
            case 'variable-model': return 0.6;
            case 'variable-source': return 0.4;
            default: return 0.3;
          }
        })
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Enhanced repulsion for better spacing
          switch(d.type) {
            case 'category': return -2000;  // Strong repulsion for major nodes
            case 'model': return -1500;     // Strong repulsion for models
            case 'variable': return -600;   // Medium repulsion for variables
            case 'source': return -400;     // Lighter repulsion for sources
            default: return -500;
          }
        })
      )
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => d.radius + 8)  // Increased collision radius
        .strength(0.9)  // Stronger collision avoidance
      )
      .force('x', d3.forceX()
        .x(d => {
          // Position models at strategic locations
          if (d.type === 'model') {
            const modelPositions = [
              { x: 0.15, y: 0.2 },  // Top-left
              { x: 0.85, y: 0.2 },  // Top-right
              { x: 0.15, y: 0.8 },  // Bottom-left
              { x: 0.85, y: 0.8 },  // Bottom-right
              { x: 0.5, y: 0.1 }    // Top-center
            ];
            const modelNames = ['ECCO', 'ISSM', 'CARDAMOM', 'CMS-FLUX', 'MOMO-CHEM'];
            const index = modelNames.indexOf(d.name);
            if (index >= 0 && index < modelPositions.length) {
              return this.width * modelPositions[index].x;
            }
          }
          return this.width / 2;
        })
        .strength(d => d.type === 'model' ? 0.3 : 0.05)
      )
      .force('y', d3.forceY()
        .y(d => {
          // Position models at strategic locations
          if (d.type === 'model') {
            const modelPositions = [
              { x: 0.15, y: 0.2 },  // Top-left
              { x: 0.85, y: 0.2 },  // Top-right
              { x: 0.15, y: 0.8 },  // Bottom-left
              { x: 0.85, y: 0.8 },  // Bottom-right
              { x: 0.5, y: 0.1 }    // Top-center
            ];
            const modelNames = ['ECCO', 'ISSM', 'CARDAMOM', 'CMS-FLUX', 'MOMO-CHEM'];
            const index = modelNames.indexOf(d.name);
            if (index >= 0 && index < modelPositions.length) {
              return this.height * modelPositions[index].y;
            }
          }
          return this.height / 2;
        })
        .strength(d => d.type === 'model' ? 0.3 : 0.05)
      )
      .force('radial', d3.forceRadial()
        .radius(d => {
          // Concentric layout with proper spacing
          switch(d.type) {
            case 'category': return Math.min(this.width, this.height) * 0.12;  // Inner ring
            case 'variable': return Math.min(this.width, this.height) * 0.22;  // Middle ring
            case 'source': return Math.min(this.width, this.height) * 0.42;   // Outer ring
            case 'model': return Math.min(this.width, this.height) * 0.35;    // Strategic positions
            default: return 0;
          }
        })
        .x(this.width / 2)
        .y(this.height / 2)
        .strength(d => {
          // Different strengths for different positioning needs
          switch(d.type) {
            case 'category': return 0.3;
            case 'variable': return 0.2;
            case 'source': return 0.15;
            case 'model': return 0.1;  // Lower strength to allow strategic positioning
            default: return 0.1;
          }
        })
      )
      .on('tick', () => this.render());
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.transform = event.transform;
        this.render();
      });
    
    d3.select(this.canvas).call(zoom);
  }

  /**
   * Setup mouse interactions
   */
  setupInteractions() {
    if (!this.canvas) return;
    
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - this.transform.x) / this.transform.k;
      const y = (event.clientY - rect.top - this.transform.y) / this.transform.k;
      
      const hoveredNode = this.getNodeAt(x, y);
      
      if (hoveredNode) {
        this.canvas.style.cursor = 'pointer';
        this.showNodeTooltip(hoveredNode, event.clientX, event.clientY);
      } else {
        this.canvas.style.cursor = 'default';
        this.hideTooltip();
      }
    });
    
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - this.transform.x) / this.transform.k;
      const y = (event.clientY - rect.top - this.transform.y) / this.transform.k;
      
      const clickedNode = this.getNodeAt(x, y);
      
      if (clickedNode) {
        this.handleNodeClick(clickedNode);
      }
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
  }

  /**
   * Get node at coordinates
   */
  getNodeAt(x, y) {
    const radius = 20;
    
    return this.nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
  }

  /**
   * Handle node click
   */
  handleNodeClick(node) {
    if (window.app) {
      if (node.type === 'model') {
        window.app.currentFilter = node.name;
        window.app.updateFilterButtons();
        window.app.filterAndRender();
      }
    }
  }

  /**
   * Show node tooltip
   */
  showNodeTooltip(node, x, y) {
    let tooltip = document.getElementById('network-tooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'network-tooltip';
      tooltip.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-size: 13px;
        pointer-events: none;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(tooltip);
    }
    
    let content = `<div style="color: ${node.color}; font-weight: bold; margin-bottom: 8px;">${node.name}</div>`;
    
    switch(node.type) {
      case 'model':
        content += `<div style="font-style: italic; margin-bottom: 6px;">${node.fullName || ''}</div>`;
        if (node.domain) content += `<div><strong>Domain:</strong> ${node.domain}</div>`;
        if (node.description) content += `<div style="margin-top: 6px;">${node.description}</div>`;
        break;
        
      case 'variable':
        content += `<div><strong>Category:</strong> ${node.category}</div>`;
        if (node.units) content += `<div><strong>Units:</strong> ${node.units}</div>`;
        content += `<div><strong>Models:</strong> ${node.models.join(', ')}</div>`;
        content += `<div><strong>Sources:</strong> ${node.sources.slice(0, 3).join(', ')}${node.sources.length > 3 ? '...' : ''}</div>`;
        if (node.description) content += `<div style="margin-top: 6px; font-style: italic;">${node.description}</div>`;
        break;
        
      case 'source':
        content += `<div><strong>Type:</strong> Data Source/Mission</div>`;
        content += `<div><strong>Variables:</strong> ${node.variables.length}</div>`;
        if (node.variables.length > 0) {
          const varNames = node.variables.slice(0, 3).map(v => v.variable);
          content += `<div style="margin-top: 6px;"><strong>Used by:</strong><br>${varNames.join('<br>')}${node.variables.length > 3 ? '<br>...' : ''}</div>`;
        }
        break;
        
      case 'category':
        content += `<div><strong>Variables:</strong> ${node.variables.length}</div>`;
        if (node.variables.length > 0) {
          const models = [...new Set(node.variables.flatMap(v => v.models))];
          content += `<div><strong>Models:</strong> ${models.join(', ')}</div>`;
          const sources = [...new Set(node.variables.flatMap(v => 
            Array.isArray(v.sources) ? v.sources : v.sources.split(/[,;]\s*/)
          ))];
          content += `<div><strong>Data Sources:</strong> ${sources.length}</div>`;
        }
        break;
    }
    
    tooltip.innerHTML = content;
    
    // Position tooltip
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = x + 15;
    let top = y - 10;
    
    // Keep tooltip on screen
    if (left + tooltipRect.width > window.innerWidth) {
      left = x - tooltipRect.width - 15;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = y - tooltipRect.height - 15;
    }
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.display = 'block';
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('network-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  /**
   * Render the network
   */
  render() {
    if (!this.context) return;
    
    this.context.save();
    this.context.clearRect(0, 0, this.width, this.height);
    
    // Apply transform
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);
    
    // Draw links with different styles
    this.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.source.id || n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target.id || n.id === link.target);
      
      if (source && target) {
        this.context.beginPath();
        this.context.moveTo(source.x, source.y);
        this.context.lineTo(target.x, target.y);
        
        // Style based on link type
        this.context.strokeStyle = link.color || '#999';
        this.context.globalAlpha = 0.6;
        
        switch(link.type) {
          case 'variable-model':
            this.context.lineWidth = 2;
            break;
          case 'variable-category':
            this.context.lineWidth = 3;
            break;
          case 'variable-source':
            this.context.lineWidth = 1;
            this.context.setLineDash([5, 5]);
            break;
          default:
            this.context.lineWidth = 1;
        }
        
        this.context.stroke();
        this.context.setLineDash([]); // Reset dash
        this.context.globalAlpha = 1;
      }
    });
    
    // Draw nodes with different styles for each type
    this.nodes.forEach(node => {
      const radius = node.radius || 10;
      
      // Draw node background
      this.context.beginPath();
      this.context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      this.context.fillStyle = node.color || '#666';
      this.context.fill();
      
      // Draw border with different styles
      this.context.strokeStyle = '#fff';
      this.context.lineWidth = 2;
      
      switch(node.type) {
        case 'model':
          // Solid thick border for models
          this.context.lineWidth = 3;
          break;
        case 'category':
          // Dashed border for categories
          this.context.setLineDash([3, 3]);
          break;
        case 'source':
          // Thin border for sources
          this.context.lineWidth = 1;
          break;
        case 'variable':
          // Double border for variables
          this.context.stroke();
          this.context.beginPath();
          this.context.arc(node.x, node.y, radius - 2, 0, 2 * Math.PI);
          this.context.lineWidth = 1;
          break;
      }
      
      this.context.stroke();
      this.context.setLineDash([]); // Reset dash
      
      // Draw text with appropriate sizing
      this.context.fillStyle = '#fff';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      
      let fontSize, text;
      switch(node.type) {
        case 'model':
          fontSize = 11;
          text = node.name;
          break;
        case 'category':
          fontSize = 10;
          text = node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name;
          break;
        case 'variable':
          fontSize = 8;
          text = node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name;
          break;
        case 'source':
          fontSize = 7;
          text = node.name.length > 8 ? node.name.substring(0, 8) + '...' : node.name;
          break;
        default:
          fontSize = 10;
          text = node.name;
      }
      
      this.context.font = `${fontSize}px Arial`;
      
      // Add text shadow for better readability
      this.context.fillStyle = 'rgba(0,0,0,0.7)';
      this.context.fillText(text, node.x + 1, node.y + 1);
      this.context.fillStyle = '#fff';
      this.context.fillText(text, node.x, node.y);
    });
    
    this.context.restore();
  }

  /**
   * Update network with new data
   */
  update(variables) {
    if (!this.simulation) return;
    
    // Update node data based on filtered variables
    this.nodes.forEach(node => {
      if (node.type === 'category') {
        node.variables = variables.filter(v => v.category === node.name);
      }
    });
    
    // Restart simulation
    this.simulation.alpha(0.3).restart();
  }

  /**
   * Reset view
   */
  reset() {
    if (typeof d3 !== 'undefined' && this.canvas) {
      this.transform = d3.zoomIdentity;
      d3.select(this.canvas).transition().duration(750).call(
        d3.zoom().transform,
        d3.zoomIdentity
      );
    }
  }

  /**
   * Export network as image
   */
  exportImage() {
    if (!this.canvas) return;
    
    const link = document.createElement('a');
    link.download = 'earth-system-network.png';
    link.href = this.canvas.toDataURL();
    link.click();
  }

  /**
   * Resize network view
   */
  resize() {
    this.updateDimensions();
    
    if (this.simulation) {
      this.simulation
        .force('center', d3.forceCenter(this.width / 2, this.height / 2))
        .alpha(0.3)
        .restart();
    }
  }

  /**
   * Destroy network view
   */
  destroy() {
    if (this.simulation) {
      this.simulation.stop();
    }
    
    this.hideTooltip();
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', null);
      this.canvas.removeEventListener('click', null);
      this.canvas.removeEventListener('mouseleave', null);
    }
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkView;
}