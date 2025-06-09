/**
 * Data Manager
 * Handles data loading, filtering, processing, and export functionality
 */

class DataManager {
  constructor() {
    this.cache = new Map();
    this.dataUrl = 'data/earth-system-data.json';
  }
  
  /**
   * Load data from JSON file
   */
  async loadData() {
    try {
      // Check cache first
      if (this.cache.has('mainData')) {
        console.log('📦 Loading data from cache');
        return this.cache.get('mainData');
      }
      
      console.log('🌐 Fetching data from:', this.dataUrl);
      
      const response = await fetch(this.dataUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate data structure
      this.validateData(data);
      
      // Process and enhance data
      const processedData = this.processData(data);
      
      // Cache the processed data
      this.cache.set('mainData', processedData);
      
      console.log('✅ Data loaded and processed successfully');
      return processedData;
      
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      
      // Try to load fallback data
      return this.loadFallbackData();
    }
  }
  
  /**
   * Validate data structure
   */
  validateData(data) {
    const required = ['variables', 'models', 'categories'];
    
    for (const field of required) {
      if (!data[field] || !Array.isArray(data[field])) {
        throw new Error(`Missing or invalid ${field} array in data`);
      }
    }
    
    if (data.variables.length === 0) {
      throw new Error('No variables found in data');
    }
    
    if (data.models.length === 0) {
      throw new Error('No models found in data');
    }
    
    console.log(`✅ Data validation passed: ${data.variables.length} variables, ${data.models.length} models`);
  }
  
  /**
   * Process and enhance the loaded data
   */
  processData(data) {
    // Convert models array to lookup map
    const modelsMap = new Map();
    data.models.forEach(model => {
      modelsMap.set(model.name, model);
    });
    
    // Convert categories array to lookup map
    const categoriesMap = new Map();
    data.categories.forEach(category => {
      categoriesMap.set(category.name, category);
    });
    
    // Process variables
    const processedVariables = data.variables.map(variable => ({
      ...variable,
      // Ensure models is always an array
      models: Array.isArray(variable.models) 
        ? variable.models 
        : variable.models.split(/[,;]\s*/),
      
      // Ensure sources is always an array
      sources: Array.isArray(variable.sources)
        ? variable.sources
        : variable.sources.split(/[,;]\s*/),
      
      // Add processed fields
      searchText: this.createSearchText(variable),
      modelObjects: this.getModelObjects(variable.models, modelsMap),
      categoryObject: categoriesMap.get(variable.category)
    }));
    
    return {
      ...data,
      variables: processedVariables,
      modelsMap,
      categoriesMap,
      metadata: {
        ...data.metadata,
        processedAt: new Date().toISOString(),
        totalVariables: processedVariables.length,
        totalModels: data.models.length,
        totalCategories: data.categories.length
      }
    };
  }
  
  /**
   * Create search text for a variable
   */
  createSearchText(variable) {
    const sources = Array.isArray(variable.sources) 
      ? variable.sources.join(' ')
      : variable.sources;
    
    const models = Array.isArray(variable.models)
      ? variable.models.join(' ')
      : variable.models;
    
    return [
      variable.variable,
      variable.category,
      sources,
      models,
      variable.description || '',
      variable.units || ''
    ].join(' ').toLowerCase();
  }
  
  /**
   * Get model objects from model names
   */
  getModelObjects(modelNames, modelsMap) {
    const models = Array.isArray(modelNames) ? modelNames : [modelNames];
    return models.map(name => modelsMap.get(name)).filter(Boolean);
  }
  
  /**
   * Load fallback data if main data fails
   */
  loadFallbackData() {
    console.warn('⚠️ Loading fallback data...');
    
    // Minimal fallback dataset
    const fallbackData = {
      metadata: {
        title: "Earth System Model Data (Fallback)",
        version: "1.0.0-fallback",
        totalVariables: 5,
        totalModels: 2
      },
      models: [
        {
          name: "ECCO",
          fullName: "Estimating the Circulation and Climate of the Ocean",
          description: "Ocean state estimation system",
          domain: "Ocean & Sea Ice"
        },
        {
          name: "ISSM",
          fullName: "Ice Sheet System Model",
          description: "Ice sheet dynamics modeling",
          domain: "Ice Sheet & Land Motion"
        }
      ],
      categories: [
        {
          name: "Ocean and Sea Ice Variables",
          description: "Ocean circulation and sea ice properties",
          color: "#4facfe"
        },
        {
          name: "Land and Terrestrial Variables",
          description: "Ice sheets and land motion",
          color: "#43e97b"
        }
      ],
      variables: [
        {
          id: "ssh",
          variable: "Sea Surface Height",
          category: "Ocean and Sea Ice Variables",
          sources: ["JASON-3", "Sentinel-6"],
          models: ["ECCO"],
          units: "meters",
          description: "Height of sea surface"
        },
        {
          id: "sst",
          variable: "Sea Surface Temperature",
          category: "Ocean and Sea Ice Variables",
          sources: ["MODIS", "VIIRS"],
          models: ["ECCO"],
          units: "°C",
          description: "Temperature of sea surface"
        },
        {
          id: "iv",
          variable: "Ice Velocity",
          category: "Land and Terrestrial Variables",
          sources: ["Landsat", "Sentinel-1"],
          models: ["ISSM"],
          units: "m/year",
          description: "Velocity of ice motion"
        },
        {
          id: "ise",
          variable: "Ice Sheet Elevation",
          category: "Land and Terrestrial Variables",
          sources: ["ICESat-2"],
          models: ["ISSM"],
          units: "meters",
          description: "Elevation of ice surface"
        },
        {
          id: "rsl",
          variable: "Relative Sea Level",
          category: "Land and Terrestrial Variables",
          sources: ["Tide Gauge"],
          models: ["ISSM"],
          units: "meters",
          description: "Sea level relative to land"
        }
      ]
    };
    
    return this.processData(fallbackData);
  }
  
  /**
   * Filter data based on model and search criteria
   */
  filterData(variables, modelFilter = 'all', searchQuery = '') {
    let filtered = [...variables];
    
    // Apply model filter
    if (modelFilter && modelFilter !== 'all') {
      filtered = filtered.filter(variable => {
        const models = Array.isArray(variable.models) 
          ? variable.models 
          : [variable.models];
        return models.includes(modelFilter);
      });
    }
    
    // Apply search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(variable => {
        return variable.searchText && variable.searchText.includes(query);
      });
    }
    
    return filtered;
  }
  
  /**
   * Group variables by category
   */
  groupByCategory(variables) {
    const groups = {};
    
    variables.forEach(variable => {
      const category = variable.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(variable);
    });
    
    return groups;
  }
  
  /**
   * Sort data by specified field
   */
  sortData(variables, sortBy) {
    const sorted = [...variables];
    
    switch (sortBy) {
      case 'variable':
        return sorted.sort((a, b) => a.variable.localeCompare(b.variable));
      
      case 'category':
        return sorted.sort((a, b) => {
          const categoryCompare = a.category.localeCompare(b.category);
          return categoryCompare !== 0 ? categoryCompare : a.variable.localeCompare(b.variable);
        });
      
      case 'model':
        return sorted.sort((a, b) => {
          const aModels = Array.isArray(a.models) ? a.models.join(', ') : a.models;
          const bModels = Array.isArray(b.models) ? b.models.join(', ') : b.models;
          return aModels.localeCompare(bModels);
        });
      
      default:
        return sorted;
    }
  }
  
  /**
   * Calculate statistics for current data
   */
  calculateStatistics(filteredVariables, allData) {
    const visibleVariables = filteredVariables.length;
    const activeCategories = new Set(filteredVariables.map(v => v.category)).size;
    
    // Count unique missions/sources
    const allSources = new Set();
    filteredVariables.forEach(variable => {
      const sources = Array.isArray(variable.sources) 
        ? variable.sources 
        : variable.sources.split(/[,;]\s*/);
      sources.forEach(source => allSources.add(source.trim()));
    });
    
    const totalMissions = allSources.size;
    
    return {
      visibleVariables,
      activeCategories,
      totalMissions,
      totalVariables: allData.variables.length,
      totalModels: allData.models.length
    };
  }
  
  /**
   * Get variable counts by model
   */
  getModelCounts(variables) {
    const counts = {
      'ECCO': 0,
      'ISSM': 0,
      'CARDAMOM': 0,
      'CMS-FLUX': 0,
      'MOMO-CHEM': 0
    };
    
    variables.forEach(variable => {
      const models = Array.isArray(variable.models) 
        ? variable.models 
        : variable.models.split(/[,;]\s*/);
      
      models.forEach(model => {
        const trimmedModel = model.trim();
        if (counts.hasOwnProperty(trimmedModel)) {
          counts[trimmedModel]++;
        }
      });
    });
    
    return counts;
  }
  
  /**
   * Export data to CSV format
   */
  exportToCSV(variables) {
    const headers = ['Variable', 'Category', 'Sources', 'Models', 'Units', 'Description'];
    
    const rows = variables.map(variable => {
      const sources = Array.isArray(variable.sources) 
        ? variable.sources.join('; ') 
        : variable.sources;
      
      const models = Array.isArray(variable.models)
        ? variable.models.join('; ')
        : variable.models;
      
      return [
        this.escapeCsvField(variable.variable),
        this.escapeCsvField(variable.category),
        this.escapeCsvField(sources),
        this.escapeCsvField(models),
        this.escapeCsvField(variable.units || ''),
        this.escapeCsvField(variable.description || '')
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }
  
  /**
   * Escape CSV field
   */
  escapeCsvField(field) {
    if (field == null) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return '"' + stringField.replace(/"/g, '""') + '"';
    }
    return stringField;
  }
  
  /**
   * Export data to JSON format
   */
  exportToJSON(variables) {
    const exportData = {
      metadata: {
        title: 'Earth System Model Variables Export',
        exportDate: new Date().toISOString(),
        totalVariables: variables.length,
        version: '1.0.0'
      },
      variables: variables.map(variable => ({
        id: variable.id,
        variable: variable.variable,
        category: variable.category,
        sources: Array.isArray(variable.sources) ? variable.sources : [variable.sources],
        models: Array.isArray(variable.models) ? variable.models : [variable.models],
        units: variable.units,
        description: variable.description,
        applications: variable.applications
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Get variable by ID
   */
  getVariableById(variables, id) {
    return variables.find(variable => variable.id === id);
  }
  
  /**
   * Get variables by model
   */
  getVariablesByModel(variables, modelName) {
    return variables.filter(variable => {
      const models = Array.isArray(variable.models) 
        ? variable.models 
        : [variable.models];
      return models.includes(modelName);
    });
  }
  
  /**
   * Get variables by category
   */
  getVariablesByCategory(variables, categoryName) {
    return variables.filter(variable => variable.category === categoryName);
  }
  
  /**
   * Get unique sources from variables
   */
  getUniqueSources(variables) {
    const sources = new Set();
    
    variables.forEach(variable => {
      const variableSources = Array.isArray(variable.sources) 
        ? variable.sources 
        : variable.sources.split(/[,;]\s*/);
      
      variableSources.forEach(source => {
        sources.add(source.trim());
      });
    });
    
    return Array.from(sources).sort();
  }
  
  /**
   * Get search suggestions based on current query
   */
  getSearchSuggestions(variables, query, limit = 5) {
    if (!query || query.length < 2) return [];
    
    const suggestions = new Set();
    const lowerQuery = query.toLowerCase();
    
    variables.forEach(variable => {
      // Check variable name
      if (variable.variable.toLowerCase().includes(lowerQuery)) {
        suggestions.add(variable.variable);
      }
      
      // Check sources
      const sources = Array.isArray(variable.sources) 
        ? variable.sources 
        : variable.sources.split(/[,;]\s*/);
      
      sources.forEach(source => {
        if (source.toLowerCase().includes(lowerQuery)) {
          suggestions.add(source.trim());
        }
      });
      
      // Check models
      const models = Array.isArray(variable.models)
        ? variable.models
        : variable.models.split(/[,;]\s*/);
        
      models.forEach(model => {
        if (model.toLowerCase().includes(lowerQuery)) {
          suggestions.add(model.trim());
        }
      });
    });
    
    return Array.from(suggestions).slice(0, limit);
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Data cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage()
    };
  }
  
  /**
   * Estimate memory usage (rough calculation)
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    this.cache.forEach((value, key) => {
      totalSize += key.length * 2; // Rough estimate for string
      totalSize += JSON.stringify(value).length * 2; // Rough estimate for object
    });
    
    return totalSize;
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
}