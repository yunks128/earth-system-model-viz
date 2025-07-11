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
    this.width = container.clientWidth || 1200;
    this.height = Math.max(container.clientHeight || 800, 800);
    
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  /**
   * Process data for comprehensive network visualization using all JSON data
   */
  processData(variables, models, isSimpleView = false) {
    if (isSimpleView) {
      return this.processSimpleData();
    }
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
    
    // 1. Create CATEGORY nodes using original categories from JSON
    const categories = [...new Set(variables.map(v => v.category))];
    const categoryRadius = Math.min(this.width, this.height) * 0.12;
    
    categories.forEach((category, index) => {
      const angle = (index / categories.length) * 2 * Math.PI;
      const categoryVariables = variables.filter(v => v.category === category);
      
      const node = {
        id: nodeId++,
        name: category,
        type: 'category',
        x: this.width * 0.5 + Math.cos(angle) * categoryRadius,
        y: this.height * 0.5 + Math.sin(angle) * categoryRadius,
        radius: 40 + (categoryVariables.length * 1.2),
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
      const distance = 100 + (categoryVariables.length * 1.5);
      
      const node = {
        id: nodeId++,
        name: variable.variable,
        type: 'variable',
        category: variable.category,
        sources: Array.isArray(variable.sources) ? variable.sources : variable.sources.split(/[,;]\s*/),
        models: Array.isArray(variable.models) ? variable.models : [variable.models],
        units: variable.units,
        description: variable.description,
        applications: variable.applications,
        variableData: variable,
        x: categoryNode.x + Math.cos(angle) * distance,
        y: categoryNode.y + Math.sin(angle) * distance,
        radius: 8,
        color: this.getVariableColor(variable.category),
        categoryNode: categoryNode
      };
      
      this.nodes.push(node);
      nodeMap.set('variable_' + variable.id, node);
    });
    
    // 3. Create ALL MODEL nodes positioned strategically around the perimeter
    const modelPositions = [
      { x: 0.12, y: 0.15 },  // Top-left
      { x: 0.88, y: 0.15 },  // Top-right
      { x: 0.12, y: 0.85 },  // Bottom-left
      { x: 0.88, y: 0.85 },  // Bottom-right
      { x: 0.5, y: 0.05 }    // Top-center
    ];
    
    models.forEach((model, index) => {
      const position = modelPositions[index] || { x: 0.5, y: 0.95 };
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
        institution: model.institution,
        website: model.website,
        x: this.width * position.x,
        y: this.height * position.y,
        radius: 25 + (modelVariables.length * 0.8),
        color: this.getModelColor(model.name),
        variableCount: modelVariables.length,
        variables: modelVariables
      };
      
      this.nodes.push(node);
      nodeMap.set('model_' + model.name, node);
    });
    
    // 4. Create DATA SOURCE/MISSION nodes positioned in outer regions
    const sourceArray = Array.from(allSources).filter(source => source && source !== 'Various sources');
    const sourceSectors = 12; // Divide sources into sectors around the perimeter
    
    sourceArray.forEach((source, index) => {
      const sector = index % sourceSectors;
      const angle = (sector / sourceSectors) * 2 * Math.PI;
      const radius = Math.min(this.width, this.height) * 0.42;
      
      // Add some variation within each sector
      const angleVariation = (Math.random() - 0.5) * (2 * Math.PI / sourceSectors * 0.6);
      const radiusVariation = (Math.random() - 0.5) * 40;
      
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
        radius: 6 + Math.min(sourceVariables.length * 0.8, 8),
        color: this.getSourceColor(source),
        variables: sourceVariables,
        variableCount: sourceVariables.length
      };
      
      this.nodes.push(node);
      nodeMap.set('source_' + source, node);
    });
    
    // Create comprehensive links showing all relationships from JSON data
    
    // 1. Categories to Variables (strong connections)
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
    
    // 2. Variables to Models
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
    
    // 3. Variables to Data Sources
    variables.forEach(variable => {
      const variableNode = nodeMap.get('variable_' + variable.id);
      const sources = Array.isArray(variable.sources) 
        ? variable.sources 
        : variable.sources.split(/[,;]\s*/);
      
      sources.forEach(sourceName => {
        const sourceNode = nodeMap.get('source_' + sourceName.trim());
        if (variableNode && sourceNode && sourceName.trim() !== 'Various sources') {
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
    
    console.log(`🕸️ Comprehensive network data processed: ${this.nodes.length} nodes (${categories.length} categories, ${variables.length} variables, ${models.length} models, ${sourceArray.length} sources), ${this.links.length} links`);
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
   * Get color for variable nodes (lighter versions of category colors)
   */
  getVariableColor(category) {
    const colors = {
      'Ocean and Sea Ice Variables': '#7cc4ff',
      'Land and Terrestrial Variables': '#6bf28a',
      'Atmospheric Composition': '#fb8ba8',
      'Carbon Cycle Components': '#ffea6b',
      'Climate and Reanalysis': '#bff2ee'
    };
    return colors[category] || '#b4c5d1';
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
   * Setup D3 force simulation with enhanced hierarchical positioning and animations
   */
  setupSimulation() {
    if (typeof d3 === 'undefined') return;
    
    // Check if this is simple view to use different forces
    const isSimpleView = this.nodes.length < 50;  // Simple heuristic
    
    // Start animation loop for smooth visual effects
    this.startAnimationLoop();
    
    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links)
        .id(d => d.id)
        .distance(d => {
          // Hierarchical distances for better structure
          switch(d.type) {
            case 'category-variable': return 70;    // Short distance from category to variables
            case 'category-mission': return 90;     // Short distance from category to missions
            case 'variable-model': return 140;      // Medium distance to models
            case 'mission-model': return 130;       // Medium distance from missions to models
            case 'variable-source': return 110;     // Medium distance to sources
            default: return 100;
          }
        })
        .strength(d => {
          // Stronger connections for hierarchy
          switch(d.type) {
            case 'category-variable': return 0.8;
            case 'category-mission': return 0.7;
            case 'variable-model': return 0.5;
            case 'mission-model': return 0.6;
            case 'variable-source': return 0.3;
            default: return 0.3;
          }
        })
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Enhanced repulsion for better spacing
          switch(d.type) {
            case 'category': return -2500;  // Very strong repulsion for major category nodes
            case 'model': return -1500;     // Strong repulsion for models
            case 'variable': return -400;   // Medium repulsion for variables
            case 'mission': return -600;    // Medium repulsion for missions
            case 'source': return -200;     // Light repulsion for sources
            default: return -300;
          }
        })
      )
      .force('center', isSimpleView ? null : d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => {
          // Much larger collision radius for categories
          if (d.type === 'category') return d.radius + 25;
          return d.radius + 12;
        })
        .strength(0.8)  // Collision avoidance
      )
      .force('x', d3.forceX()
        .x(d => {
          if (isSimpleView) {
            // Simple view: maintain circular positions (weaker force)
            return this.width / 2;
          } else {
            // Comprehensive view: position models at strategic locations
            if (d.type === 'model') {
              const modelPositions = [
                { x: 0.12, y: 0.15 },  // Top-left
                { x: 0.88, y: 0.15 },  // Top-right
                { x: 0.12, y: 0.85 },  // Bottom-left
                { x: 0.88, y: 0.85 },  // Bottom-right
                { x: 0.5, y: 0.05 }    // Top-center
              ];
              const modelNames = ['ECCO', 'ISSM', 'CARDAMOM', 'CMS-FLUX', 'MOMO-CHEM'];
              const index = modelNames.indexOf(d.name);
              if (index >= 0 && index < modelPositions.length) {
                return this.width * modelPositions[index].x;
              }
            }
            return this.width / 2;
          }
        })
        .strength(d => isSimpleView ? 0.1 : (d.type === 'model' ? 0.3 : 0.02))
      )
      .force('y', d3.forceY()
        .y(d => {
          if (isSimpleView) {
            // Simple view: maintain circular positions (weaker force)
            return this.height / 2;
          } else {
            // Comprehensive view: position models at strategic locations
            if (d.type === 'model') {
              const modelPositions = [
                { x: 0.12, y: 0.15 },  // Top-left
                { x: 0.88, y: 0.15 },  // Top-right
                { x: 0.12, y: 0.85 },  // Bottom-left
                { x: 0.88, y: 0.85 },  // Bottom-right
                { x: 0.5, y: 0.05 }    // Top-center
              ];
              const modelNames = ['ECCO', 'ISSM', 'CARDAMOM', 'CMS-FLUX', 'MOMO-CHEM'];
              const index = modelNames.indexOf(d.name);
              if (index >= 0 && index < modelPositions.length) {
                return this.height * modelPositions[index].y;
              }
            }
            return this.height / 2;
          }
        })
        .strength(d => isSimpleView ? 0.05 : (d.type === 'model' ? 0.3 : 0.02))
      )
      .force('radial', isSimpleView ? null : d3.forceRadial()
        .radius(d => {
          // Concentric layout with proper spacing (comprehensive view only)
          switch(d.type) {
            case 'category': return Math.min(this.width, this.height) * 0.08;  // Center
            case 'mission': return Math.min(this.width, this.height) * 0.16;   // Around categories
            case 'variable': return Math.min(this.width, this.height) * 0.18;  // Inner ring
            case 'source': return Math.min(this.width, this.height) * 0.38;   // Outer ring
            case 'model': return 0;  // No radial constraint for models
            default: return 0;
          }
        })
        .x(this.width / 2)
        .y(this.height / 2)
        .strength(d => {
          // Different strengths for different positioning needs
          switch(d.type) {
            case 'category': return 0.3;
            case 'mission': return 0.25;
            case 'variable': return 0.2;
            case 'source': return 0.15;
            case 'model': return 0.05;  // Very low strength to allow strategic positioning
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
        if (node.institution) content += `<div><strong>Institution:</strong> ${node.institution}</div>`;
        if (node.variableCount) content += `<div><strong>Variables:</strong> ${node.variableCount}</div>`;
        if (node.description) content += `<div style="margin-top: 6px;">${node.description}</div>`;
        break;
        
      case 'variable':
        content += `<div><strong>Category:</strong> ${node.category}</div>`;
        if (node.units) content += `<div><strong>Units:</strong> ${node.units}</div>`;
        content += `<div><strong>Models:</strong> ${node.models.join(', ')}</div>`;
        content += `<div><strong>Sources:</strong> ${node.sources.slice(0, 3).join(', ')}${node.sources.length > 3 ? '...' : ''}</div>`;
        if (node.applications) content += `<div><strong>Applications:</strong> ${node.applications.slice(0, 2).join(', ')}${node.applications.length > 2 ? '...' : ''}</div>`;
        if (node.description) content += `<div style="margin-top: 6px; font-style: italic;">${node.description}</div>`;
        break;
        
      case 'mission':
        content += `<div><strong>Type:</strong> Mission/Data Source</div>`;
        content += `<div><strong>Category:</strong> ${node.category}</div>`;
        if (node.description) content += `<div style="margin-top: 6px; font-style: italic;">${node.description}</div>`;
        break;
        
      case 'source':
        content += `<div><strong>Type:</strong> Data Source/Mission</div>`;
        content += `<div><strong>Variables:</strong> ${node.variableCount}</div>`;
        if (node.variables && node.variables.length > 0) {
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
    
    // Draw enhanced links with gradients and flowing animations
    const time = Date.now() * 0.002;
    
    this.links.forEach((link, index) => {
      const source = this.nodes.find(n => n.id === link.source.id || n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target.id || n.id === link.target);
      
      if (source && target) {
        // Enhanced connection shadow with multiple layers
        for (let i = 3; i >= 1; i--) {
          this.context.beginPath();
          this.context.moveTo(source.x + i, source.y + i);
          this.context.lineTo(target.x + i, target.y + i);
          this.context.strokeStyle = `rgba(0,0,0,${0.05 * i})`;
          this.context.lineWidth = 4 - i;
          this.context.stroke();
        }
        
        // Animated flowing effect
        const flowOffset = (time + index * 0.5) % 1;
        
        // Draw main connection with enhanced gradient
        this.context.beginPath();
        this.context.moveTo(source.x, source.y);
        this.context.lineTo(target.x, target.y);
        
        // Create enhanced gradient with flow animation
        const gradient = this.context.createLinearGradient(
          source.x, source.y, target.x, target.y
        );
        
        let baseWidth, color1, color2;
        switch(link.type) {
          case 'category-mission':
            color1 = '#667eea';
            color2 = '#764ba2';
            baseWidth = 4;
            break;
          case 'mission-model':
            color1 = '#f093fb';
            color2 = '#f5576c';
            baseWidth = 3.5;
            break;
          default:
            color1 = link.color || '#999';
            color2 = link.color || '#666';
            baseWidth = 2.5;
        }
        
        // Animated flowing gradient
        const flow1 = Math.max(0, Math.min(1, flowOffset - 0.1));
        const flow2 = Math.max(0, Math.min(1, flowOffset + 0.1));
        
        gradient.addColorStop(0, color1 + 'cc');
        gradient.addColorStop(flow1, color1 + 'ff');
        gradient.addColorStop(flow2, color2 + 'ff');
        gradient.addColorStop(1, color2 + 'cc');
        
        // Animated line width
        const pulseWidth = baseWidth + Math.sin(time * 3 + index) * 0.5;
        this.context.lineWidth = pulseWidth;
        this.context.strokeStyle = gradient;
        this.context.globalAlpha = 0.9;
        this.context.stroke();
        this.context.globalAlpha = 1;
      }
    });
    
    // Check if this is simple view to draw layer headers
    const isSimpleView = this.nodes.length < 50;
    
    // Draw layer headers for simple view
    if (isSimpleView) {
      this.drawLayerHeaders();
    }
    
    // Draw nodes with enhanced styling
    this.nodes.forEach(node => {
      const radius = node.radius || 10;
      
      // Draw enhanced glow effect for missions and models
      if (node.glow) {
        // Multiple glow layers for more depth
        for (let i = 3; i >= 1; i--) {
          this.context.beginPath();
          this.context.arc(node.x, node.y, radius + (i * 6), 0, 2 * Math.PI);
          const glowGradient = this.context.createRadialGradient(
            node.x, node.y, radius,
            node.x, node.y, radius + (i * 6)
          );
          const opacity = Math.floor(30 / i).toString(16).padStart(2, '0');
          glowGradient.addColorStop(0, node.glow + opacity);
          glowGradient.addColorStop(1, node.glow + '00');
          this.context.fillStyle = glowGradient;
          this.context.fill();
        }
      }
      
      // Animated effects based on node properties
      const time = Date.now() * 0.001;
      let animatedRadius = radius;
      let animatedAlpha = 1;
      
      // Breathing animation for models
      if (node.breathe) {
        animatedRadius = radius + Math.sin(time * 2 + node.id * 0.5) * 3;
      }
      
      // Pulsing animation for categories
      if (node.pulse) {
        const pulse = 0.8 + Math.sin(time * 1.5 + node.id * 0.3) * 0.2;
        animatedAlpha = pulse;
      }
      
      // Draw node background with enhanced gradient
      this.context.beginPath();
      this.context.arc(node.x, node.y, animatedRadius, 0, 2 * Math.PI);
      
      if (node.gradient) {
        const gradient = this.context.createRadialGradient(
          node.x - animatedRadius * 0.3, node.y - animatedRadius * 0.3, 0,
          node.x, node.y, animatedRadius
        );
        
        // Enhanced gradient with more color stops
        gradient.addColorStop(0, node.gradient[0] + 'ff');
        gradient.addColorStop(0.3, node.gradient[0] + 'dd');
        gradient.addColorStop(0.7, node.gradient[1] + 'cc');
        gradient.addColorStop(1, node.gradient[1] + 'aa');
        
        this.context.fillStyle = gradient;
      } else {
        this.context.fillStyle = node.color || '#666';
      }
      
      this.context.globalAlpha = animatedAlpha;
      this.context.fill();
      this.context.globalAlpha = 1;
      
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
          this.context.setLineDash([4, 4]);
          this.context.lineWidth = 3;
          break;
        case 'mission':
          // Medium solid border for missions
          this.context.lineWidth = 2;
          break;
        case 'variable':
          // Medium border for variables
          this.context.lineWidth = 1.5;
          break;
        case 'source':
          // Thin border for sources
          this.context.lineWidth = 1;
          break;
      }
      
      this.context.stroke();
      this.context.setLineDash([]); // Reset dash
      
      // Enhanced text rendering with better fonts and multiple shadow layers
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      
      let fontSize, text, fontWeight;
      switch(node.type) {
        case 'model':
          fontSize = isSimpleView ? 15 : 13;
          fontWeight = '700';
          text = node.name;
          break;
        case 'category':
          fontSize = isSimpleView ? 24 : 14; // Much larger font
          fontWeight = '900'; // Bolder weight
          text = node.name === 'Carbon Cycle' ? 'Carbon' : node.name;
          break;
        case 'mission':
          fontSize = isSimpleView ? 11 : 9;
          fontWeight = '600';
          text = node.name.length > (isSimpleView ? 15 : 12) ? 
                 node.name.substring(0, isSimpleView ? 15 : 12) + '...' : node.name;
          break;
        default:
          fontSize = 10;
          fontWeight = '500';
          text = node.name;
      }
      
      this.context.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif`;
      
      // Multiple shadow layers for enhanced depth
      this.context.fillStyle = 'rgba(0,0,0,0.6)';
      this.context.fillText(text, node.x + 2, node.y + 2);
      this.context.fillStyle = 'rgba(0,0,0,0.4)';
      this.context.fillText(text, node.x + 1, node.y + 1);
      this.context.fillStyle = 'rgba(0,0,0,0.2)';
      this.context.fillText(text, node.x + 0.5, node.y + 0.5);
      
      // Main text with enhanced contrast
      const textColor = node.type === 'category' ? '#ffffff' : 
                       node.type === 'model' ? '#ffffff' : '#f8f9fa';
      this.context.fillStyle = textColor;
      this.context.fillText(text, node.x, node.y);
    });
    
    this.context.restore();
  }

  /**
   * Draw circular layer guides for simple view
   */
  drawLayerHeaders() {
    const time = Date.now() * 0.001;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Draw concentric circles to show layer structure
    const layers = [
      { radius: Math.min(this.width, this.height) * 0.12, color: '#667eea', alpha: 0.15, label: 'Categories' },
      { radius: Math.min(this.width, this.height) * 0.25, color: '#43e97b', alpha: 0.12, label: 'Missions' },
      { radius: Math.min(this.width, this.height) * 0.38, color: '#f093fb', alpha: 0.1, label: 'Models' }
    ];
    
    layers.forEach((layer, index) => {
      const pulse = 0.8 + Math.sin(time * 1.5 + index * 0.5) * 0.2;
      
      // Draw guide circle
      this.context.beginPath();
      this.context.arc(centerX, centerY, layer.radius, 0, 2 * Math.PI);
      this.context.strokeStyle = layer.color + Math.floor(layer.alpha * pulse * 255).toString(16).padStart(2, '0');
      this.context.lineWidth = 2;
      this.context.setLineDash([8, 4]);
      this.context.stroke();
      this.context.setLineDash([]);
      
      // Draw layer label
      const labelY = centerY - layer.radius - 15;
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.font = '600 12px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      
      // Label background
      const labelWidth = 80;
      const labelHeight = 20;
      this.context.beginPath();
      this.context.roundRect(centerX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight, 10);
      this.context.fillStyle = layer.color + '20';
      this.context.fill();
      
      // Label text
      this.context.fillStyle = layer.color;
      this.context.fillText(layer.label, centerX, labelY);
    });
    
    
    // Draw orbital particles
    this.drawLayerConnections();
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
   * Process simplified network data based on user's dataset
   */
  processSimpleData() {
    this.nodes = [];
    this.links = [];
    
    const nodeMap = new Map();
    let nodeId = 0;
    
    // Enhanced dataset with beautiful gradients and modern color scheme
    const simpleData = {
      categories: [
        { name: 'Ocean', color: '#667eea', gradient: ['#667eea', '#764ba2'], variables: 10, pulse: true },
        { name: 'Land', color: '#f093fb', gradient: ['#f093fb', '#f5576c'], variables: 10, pulse: true },
        { name: 'Atmosphere', color: '#4facfe', gradient: ['#4facfe', '#00f2fe'], variables: 8, pulse: true },
        { name: 'Carbon Cycle', color: '#43e97b', gradient: ['#43e97b', '#38f9d7'], variables: 10, pulse: true },
        { name: 'Climate', color: '#ffecd2', gradient: ['#ffecd2', '#fcb69f'], variables: 6, pulse: true }
      ],
      missions: [
        { name: 'GRACE/GRACE-FO', category: 'Ocean', color: '#5c6bc0', glow: '#3f51b5', shimmer: true },
        { name: 'JASON/TOPEX', category: 'Ocean', color: '#42a5f5', glow: '#1976d2', shimmer: true },
        { name: 'ICESat', category: 'Ocean', color: '#26c6da', glow: '#0097a7', shimmer: true },
        { name: 'GPS', category: 'Land', color: '#ab47bc', glow: '#7b1fa2', shimmer: true },
        { name: 'MODIS', category: 'Land', color: '#ec407a', glow: '#c2185b', shimmer: true },
        { name: 'TROPOMI/OMI', category: 'Atmosphere', color: '#29b6f6', glow: '#0277bd', shimmer: true },
        { name: 'MOPITT', category: 'Atmosphere', color: '#26c6da', glow: '#00acc1', shimmer: true },
        { name: 'OCO-2/GOSAT', category: 'Carbon Cycle', color: '#66bb6a', glow: '#388e3c', shimmer: true },
        { name: 'GFED', category: 'Carbon Cycle', color: '#9ccc65', glow: '#689f38', shimmer: true },
        { name: 'ERA5/GEOS', category: 'Climate', color: '#ffb74d', glow: '#f57c00', shimmer: true }
      ],
      models: [
        { name: 'ECCO', color: '#667eea', gradient: ['#667eea', '#764ba2'], glow: '#5a67d8', breathe: true },
        { name: 'ISSM', color: '#f093fb', gradient: ['#f093fb', '#f5576c'], glow: '#e53e3e', breathe: true },
        { name: 'CARDAMOM', color: '#43e97b', gradient: ['#43e97b', '#38f9d7'], glow: '#38a169', breathe: true },
        { name: 'CMS-FLUX', color: '#4facfe', gradient: ['#4facfe', '#00f2fe'], glow: '#3182ce', breathe: true },
        { name: 'MOMO-CHEM', color: '#ffecd2', gradient: ['#ffecd2', '#fcb69f'], glow: '#dd6b20', breathe: true }
      ]
    };
    
    // 1. Create CATEGORY nodes in center (Layer 1 - Center) - SIGNIFICANTLY LARGER
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const categoryRadius = Math.min(this.width, this.height) * 0.12; // Increased spread
    
    simpleData.categories.forEach((category, index) => {
      const angle = (index / simpleData.categories.length) * 2 * Math.PI;
      
      const node = {
        id: nodeId++,
        name: category.name,
        type: 'category',
        x: centerX + Math.cos(angle) * categoryRadius,
        y: centerY + Math.sin(angle) * categoryRadius,
        radius: 75 + (category.variables * 2), // Much larger base size
        color: category.color,
        gradient: category.gradient,
        variableCount: category.variables,
        pulse: true
      };
      
      this.nodes.push(node);
      nodeMap.set('category_' + category.name, node);
    });
    
    // 2. Create MISSION nodes in middle ring (Layer 2 - Middle Ring)
    const missionRadius = Math.min(this.width, this.height) * 0.25;
    
    simpleData.missions.forEach((mission, index) => {
      const angle = (index / simpleData.missions.length) * 2 * Math.PI;
      
      const node = {
        id: nodeId++,
        name: mission.name,
        type: 'mission',
        category: mission.category,
        x: centerX + Math.cos(angle) * missionRadius,
        y: centerY + Math.sin(angle) * missionRadius,
        radius: 28,
        color: mission.color,
        glow: mission.glow,
        shimmer: true
      };
      
      this.nodes.push(node);
      nodeMap.set('mission_' + mission.name, node);
    });
    
    // 3. Create MODEL nodes in outer ring (Layer 3 - Outer Ring)
    const modelRadius = Math.min(this.width, this.height) * 0.38;
    
    simpleData.models.forEach((model, index) => {
      const angle = (index / simpleData.models.length) * 2 * Math.PI;
      
      const node = {
        id: nodeId++,
        name: model.name,
        type: 'model',
        x: centerX + Math.cos(angle) * modelRadius,
        y: centerY + Math.sin(angle) * modelRadius,
        radius: 40,
        color: model.color,
        gradient: model.gradient,
        glow: model.glow,
        breathe: true
      };
      
      this.nodes.push(node);
      nodeMap.set('model_' + model.name, node);
    });
    
    // 4. Create LINKS based on dataset relationships (Layer 1 → Layer 2 → Layer 3)
    const relationships = [
      // Layer 1 (Categories) → Layer 2 (Missions) based on your dataset
      { from: 'category_Ocean', to: 'mission_GRACE/GRACE-FO', type: 'category-mission' },
      { from: 'category_Ocean', to: 'mission_JASON/TOPEX', type: 'category-mission' },
      { from: 'category_Ocean', to: 'mission_ICESat', type: 'category-mission' },
      
      { from: 'category_Land', to: 'mission_GPS', type: 'category-mission' },
      { from: 'category_Land', to: 'mission_MODIS', type: 'category-mission' },
      { from: 'category_Land', to: 'mission_GRACE/GRACE-FO', type: 'category-mission' },
      
      { from: 'category_Atmosphere', to: 'mission_TROPOMI/OMI', type: 'category-mission' },
      { from: 'category_Atmosphere', to: 'mission_MOPITT', type: 'category-mission' },
      
      { from: 'category_Carbon Cycle', to: 'mission_OCO-2/GOSAT', type: 'category-mission' },
      { from: 'category_Carbon Cycle', to: 'mission_GFED', type: 'category-mission' },
      { from: 'category_Carbon Cycle', to: 'mission_MOPITT', type: 'category-mission' },
      
      { from: 'category_Climate', to: 'mission_ERA5/GEOS', type: 'category-mission' },
      
      // Layer 2 (Missions) → Layer 3 (Models) based on your dataset
      { from: 'mission_GRACE/GRACE-FO', to: 'model_ECCO', type: 'mission-model' },
      { from: 'mission_GRACE/GRACE-FO', to: 'model_ISSM', type: 'mission-model' },
      { from: 'mission_GRACE/GRACE-FO', to: 'model_CARDAMOM', type: 'mission-model' },
      
      { from: 'mission_JASON/TOPEX', to: 'model_ECCO', type: 'mission-model' },
      
      { from: 'mission_ICESat', to: 'model_ECCO', type: 'mission-model' },
      { from: 'mission_ICESat', to: 'model_CARDAMOM', type: 'mission-model' },
      
      { from: 'mission_GPS', to: 'model_ISSM', type: 'mission-model' },
      
      { from: 'mission_MODIS', to: 'model_ISSM', type: 'mission-model' },
      { from: 'mission_MODIS', to: 'model_CARDAMOM', type: 'mission-model' },
      
      { from: 'mission_TROPOMI/OMI', to: 'model_CMS-FLUX', type: 'mission-model' },
      { from: 'mission_TROPOMI/OMI', to: 'model_MOMO-CHEM', type: 'mission-model' },
      
      { from: 'mission_MOPITT', to: 'model_CMS-FLUX', type: 'mission-model' },
      { from: 'mission_MOPITT', to: 'model_MOMO-CHEM', type: 'mission-model' },
      { from: 'mission_MOPITT', to: 'model_CARDAMOM', type: 'mission-model' },
      
      { from: 'mission_OCO-2/GOSAT', to: 'model_CARDAMOM', type: 'mission-model' },
      { from: 'mission_OCO-2/GOSAT', to: 'model_CMS-FLUX', type: 'mission-model' },
      
      { from: 'mission_GFED', to: 'model_CMS-FLUX', type: 'mission-model' },
      
      { from: 'mission_ERA5/GEOS', to: 'model_CMS-FLUX', type: 'mission-model' },
      { from: 'mission_ERA5/GEOS', to: 'model_MOMO-CHEM', type: 'mission-model' },
      { from: 'mission_ERA5/GEOS', to: 'model_ISSM', type: 'mission-model' }
    ];
    
    relationships.forEach(rel => {
      const sourceNode = nodeMap.get(rel.from);
      const targetNode = nodeMap.get(rel.to);
      
      if (sourceNode && targetNode) {
        this.links.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: rel.type,
          strength: rel.type === 'category-mission' ? 0.8 : 0.6,
          color: rel.type === 'category-mission' ? '#43e97b' : '#667eea',
          distance: rel.type === 'category-mission' ? 100 : 150
        });
      }
    });
    
    console.log(`🕸️ Simple network data processed: ${this.nodes.length} nodes (${simpleData.categories.length} categories, ${simpleData.missions.length} missions, ${simpleData.models.length} models), ${this.links.length} links`);
  }

  /**
   * Start animation loop for smooth visual effects
   */
  startAnimationLoop() {
    if (this.animationRunning) return;
    this.animationRunning = true;
    
    const animate = () => {
      if (this.animationRunning) {
        this.render();
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
  
  /**
   * Stop animation loop
   */
  stopAnimationLoop() {
    this.animationRunning = false;
  }
  
  /**
   * Draw animated orbital particles around rings
   */
  drawLayerConnections() {
    const time = Date.now() * 0.002;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Orbital particles for each layer
    const orbits = [
      { radius: Math.min(this.width, this.height) * 0.18, color: '#667eea', particles: 3 },
      { radius: Math.min(this.width, this.height) * 0.32, color: '#43e97b', particles: 5 },
      { radius: Math.min(this.width, this.height) * 0.45, color: '#f093fb', particles: 4 }
    ];
    
    orbits.forEach((orbit, orbitIndex) => {
      for (let i = 0; i < orbit.particles; i++) {
        const angle = (time * (0.5 + orbitIndex * 0.2) + (i / orbit.particles) * 2 * Math.PI) % (2 * Math.PI);
        const x = centerX + Math.cos(angle) * orbit.radius;
        const y = centerY + Math.sin(angle) * orbit.radius;
        
        // Particle size varies with position
        const size = 2 + Math.sin(angle * 2) * 1;
        
        this.context.beginPath();
        this.context.arc(x, y, size, 0, 2 * Math.PI);
        
        // Create glowing particle effect
        const gradient = this.context.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, orbit.color + 'aa');
        gradient.addColorStop(1, orbit.color + '00');
        
        this.context.fillStyle = gradient;
        this.context.fill();
      }
    });
  }
  
  /**
   * Draw animated flow line
   */
  drawFlowLine(x1, y1, x2, y2, color1, color2, timeOffset) {
    const numParticles = 5;
    
    for (let i = 0; i < numParticles; i++) {
      const progress = ((timeOffset + i * 0.2) % 1);
      const x = x1 + (x2 - x1) * progress;
      const y = y1 + (y2 - y1) * progress;
      
      // Particle size based on progress
      const size = 3 + Math.sin(progress * Math.PI) * 2;
      
      this.context.beginPath();
      this.context.arc(x, y, size, 0, 2 * Math.PI);
      
      // Color interpolation
      const color = progress < 0.5 ? color1 : color2;
      const alpha = Math.floor((0.5 + Math.sin(progress * Math.PI) * 0.5) * 255).toString(16).padStart(2, '0');
      
      this.context.fillStyle = color + alpha;
      this.context.fill();
    }
  }

  /**
   * Destroy network view
   */
  destroy() {
    this.stopAnimationLoop();
    
    if (this.simulation) {
      this.simulation.stop();
    }
    
    this.hideTooltip();
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', null);
      this.canvas.removeEventListener('click', null);
      this.canvas.removeEventListener('mouseleave', null);
    }
    
    console.log('🎨 Network view destroyed');
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkView;
}