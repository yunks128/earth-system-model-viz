/**
 * Unit Tests for DataManager
 */

const DataManager = require('../../src/scripts/data-manager.js');

describe('DataManager', () => {
  let dataManager;
  
  beforeEach(() => {
    dataManager = new DataManager();
  });
  
  afterEach(() => {
    dataManager.clearCache();
  });
  
  describe('constructor', () => {
    test('should initialize with empty cache', () => {
      expect(dataManager.cache.size).toBe(0);
      expect(dataManager.dataUrl).toBe('data/earth-system-data.json');
    });
  });
  
  describe('loadData', () => {
    test('should load and process data successfully', async () => {
      const data = await dataManager.loadData();
      
      expect(data).toBeDefined();
      expect(data.variables).toBeInstanceOf(Array);
      expect(data.models).toBeInstanceOf(Array);
      expect(data.categories).toBeInstanceOf(Array);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.processedAt).toBeDefined();
    });
    
    test('should cache loaded data', async () => {
      await dataManager.loadData();
      expect(dataManager.cache.has('mainData')).toBe(true);
    });
    
    test('should return cached data on subsequent calls', async () => {
      const firstLoad = await dataManager.loadData();
      const secondLoad = await dataManager.loadData();
      
      expect(firstLoad).toBe(secondLoad);
    });
    
    test('should handle fetch errors gracefully', async () => {
      fetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );
      
      const data = await dataManager.loadData();
      expect(data).toBeDefined();
      expect(data.metadata.version).toContain('fallback');
    });
  });
  
  describe('validateData', () => {
    test('should validate correct data structure', () => {
      expect(() => {
        dataManager.validateData(global.mockEarthSystemData);
      }).not.toThrow();
    });
    
    test('should throw error for missing variables', () => {
      const invalidData = { models: [], categories: [] };
      
      expect(() => {
        dataManager.validateData(invalidData);
      }).toThrow('Missing or invalid variables array');
    });
    
    test('should throw error for empty variables array', () => {
      const invalidData = { 
        variables: [], 
        models: [{}], 
        categories: [{}] 
      };
      
      expect(() => {
        dataManager.validateData(invalidData);
      }).toThrow('No variables found');
    });
  });
  
  describe('processData', () => {
    test('should process data correctly', () => {
      const processed = dataManager.processData(global.mockEarthSystemData);
      
      expect(processed.modelsMap).toBeInstanceOf(Map);
      expect(processed.categoriesMap).toBeInstanceOf(Map);
      expect(processed.variables[0].searchText).toBeDefined();
      expect(processed.variables[0].models).toBeInstanceOf(Array);
    });
    
    test('should create search text for variables', () => {
      const variable = {
        variable: 'Test Variable',
        category: 'Test Category',
        sources: 'TEST-SAT1, TEST-SAT2',
        models: 'ECCO',
        description: 'Test description'
      };
      
      const searchText = dataManager.createSearchText(variable);
      expect(searchText).toContain('test variable');
      expect(searchText).toContain('test category');
      expect(searchText).toContain('test-sat1');
    });
  });
  
  describe('filterData', () => {
    let testVariables;
    
    beforeEach(() => {
      testVariables = [
        {
          variable: 'Sea Surface Height',
          models: ['ECCO'],
          searchText: 'sea surface height ecco ocean'
        },
        {
          variable: 'Ice Velocity',
          models: ['ISSM'],
          searchText: 'ice velocity issm land'
        }
      ];
    });
    
    test('should return all variables when no filters applied', () => {
      const filtered = dataManager.filterData(testVariables);
      expect(filtered).toHaveLength(2);
    });
    
    test('should filter by model correctly', () => {
      const filtered = dataManager.filterData(testVariables, 'ECCO');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].variable).toBe('Sea Surface Height');
    });
    
    test('should filter by search query correctly', () => {
      const filtered = dataManager.filterData(testVariables, 'all', 'ice');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].variable).toBe('Ice Velocity');
    });
    
    test('should combine model and search filters', () => {
      const filtered = dataManager.filterData(testVariables, 'ECCO', 'ocean');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].variable).toBe('Sea Surface Height');
    });
    
    test('should return empty array when no matches', () => {
      const filtered = dataManager.filterData(testVariables, 'NONEXISTENT');
      expect(filtered).toHaveLength(0);
    });
  });
  
  describe('groupByCategory', () => {
    test('should group variables by category', () => {
      const variables = [
        { category: 'Ocean', variable: 'SSH' },
        { category: 'Ocean', variable: 'SST' },
        { category: 'Ice', variable: 'Velocity' }
      ];
      
      const grouped = dataManager.groupByCategory(variables);
      
      expect(grouped.Ocean).toHaveLength(2);
      expect(grouped.Ice).toHaveLength(1);
    });
  });
  
  describe('sortData', () => {
    let testVariables;
    
    beforeEach(() => {
      testVariables = [
        { variable: 'Zebra', category: 'B', models: ['MODEL2'] },
        { variable: 'Alpha', category: 'A', models: ['MODEL1'] }
      ];
    });
    
    test('should sort by variable name', () => {
      const sorted = dataManager.sortData(testVariables, 'variable');
      expect(sorted[0].variable).toBe('Alpha');
      expect(sorted[1].variable).toBe('Zebra');
    });
    
    test('should sort by category', () => {
      const sorted = dataManager.sortData(testVariables, 'category');
      expect(sorted[0].category).toBe('A');
      expect(sorted[1].category).toBe('B');
    });
    
    test('should not modify original array', () => {
      const original = [...testVariables];
      dataManager.sortData(testVariables, 'variable');
      expect(testVariables).toEqual(original);
    });
  });
  
  describe('calculateStatistics', () => {
    test('should calculate correct statistics', () => {
      const variables = [
        { 
          category: 'Ocean', 
          sources: ['SAT1', 'SAT2'] 
        },
        { 
          category: 'Ocean', 
          sources: ['SAT2', 'SAT3'] 
        },
        { 
          category: 'Ice', 
          sources: ['SAT4'] 
        }
      ];
      
      const allData = {
        variables: Array(10).fill({}),
        models: Array(5).fill({})
      };
      
      const stats = dataManager.calculateStatistics(variables, allData);
      
      expect(stats.visibleVariables).toBe(3);
      expect(stats.activeCategories).toBe(2);
      expect(stats.totalMissions).toBe(4); // SAT1, SAT2, SAT3, SAT4
      expect(stats.totalVariables).toBe(10);
      expect(stats.totalModels).toBe(5);
    });
  });
  
  describe('getModelCounts', () => {
    test('should count variables by model', () => {
      const variables = [
        { models: ['ECCO'] },
        { models: ['ECCO', 'ISSM'] },
        { models: ['ISSM'] },
        { models: ['CARDAMOM'] }
      ];
      
      const counts = dataManager.getModelCounts(variables);
      
      expect(counts.ECCO).toBe(2);
      expect(counts.ISSM).toBe(2);
      expect(counts.CARDAMOM).toBe(1);
      expect(counts['CMS-FLUX']).toBe(0);
    });
  });
  
  describe('exportToCSV', () => {
    test('should export variables to CSV format', () => {
      const variables = [
        {
          variable: 'Test Variable',
          category: 'Test Category',
          sources: ['SAT1', 'SAT2'],
          models: ['ECCO'],
          units: 'm',
          description: 'Test description'
        }
      ];
      
      const csv = dataManager.exportToCSV(variables);
      
      expect(csv).toContain('Variable,Category,Sources,Models,Units,Description');
      expect(csv).toContain('Test Variable,Test Category');
      expect(csv).toContain('SAT1; SAT2');
    });
    
    test('should escape CSV fields with commas', () => {
      const variables = [
        {
          variable: 'Test, Variable',
          category: 'Category',
          sources: ['SAT1'],
          models: ['ECCO'],
          units: '',
          description: 'Description with, commas'
        }
      ];
      
      const csv = dataManager.exportToCSV(variables);
      
      expect(csv).toContain('"Test, Variable"');
      expect(csv).toContain('"Description with, commas"');
    });
  });
  
  describe('exportToJSON', () => {
    test('should export variables to JSON format', () => {
      const variables = [
        {
          id: 'test1',
          variable: 'Test Variable',
          category: 'Test Category',
          sources: ['SAT1'],
          models: ['ECCO'],
          units: 'm'
        }
      ];
      
      const jsonString = dataManager.exportToJSON(variables);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.metadata).toBeDefined();
      expect(parsed.variables).toHaveLength(1);
      expect(parsed.variables[0].id).toBe('test1');
    });
  });
  
  describe('getUniqueSources', () => {
    test('should return unique sources', () => {
      const variables = [
        { sources: ['SAT1', 'SAT2'] },
        { sources: ['SAT2', 'SAT3'] },
        { sources: 'SAT4, SAT1' }
      ];
      
      const sources = dataManager.getUniqueSources(variables);
      
      expect(sources).toContain('SAT1');
      expect(sources).toContain('SAT2');
      expect(sources).toContain('SAT3');
      expect(sources).toContain('SAT4');
      expect(sources).toHaveLength(4);
    });
  });
  
  describe('getSearchSuggestions', () => {
    test('should return search suggestions', () => {
      const variables = [
        {
          variable: 'Sea Surface Height',
          sources: ['JASON-3'],
          models: ['ECCO']
        },
        {
          variable: 'Sea Surface Temperature',
          sources: ['MODIS'],
          models: ['ECCO']
        }
      ];
      
      const suggestions = dataManager.getSearchSuggestions(variables, 'sea', 5);
      
      expect(suggestions).toContain('Sea Surface Height');
      expect(suggestions).toContain('Sea Surface Temperature');
    });
    
    test('should limit suggestions', () => {
      const variables = Array(10).fill({
        variable: 'Test Variable',
        sources: ['SAT'],
        models: ['MODEL']
      });
      
      const suggestions = dataManager.getSearchSuggestions(variables, 'test', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
    
    test('should return empty array for short queries', () => {
      const suggestions = dataManager.getSearchSuggestions([], 'a');
      expect(suggestions).toHaveLength(0);
    });
  });
  
  describe('cache management', () => {
    test('should clear cache', () => {
      dataManager.cache.set('test', 'value');
      expect(dataManager.cache.size).toBe(1);
      
      dataManager.clearCache();
      expect(dataManager.cache.size).toBe(0);
    });
    
    test('should get cache statistics', () => {
      dataManager.cache.set('test1', 'value1');
      dataManager.cache.set('test2', 'value2');
      
      const stats = dataManager.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('test1');
      expect(stats.keys).toContain('test2');
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });
});