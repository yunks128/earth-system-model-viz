#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { minify: minifyJS } = require('terser');

/**
 * Build script for Earth System Model Visualization
 * Processes source files and outputs production-ready files to docs/
 */

class Builder {
  constructor() {
    this.srcDir = path.join(__dirname, '..', 'src');
    this.docsDir = path.join(__dirname, '..', 'docs');
    this.buildTime = new Date().toISOString();
  }

  async build() {
    console.log('🚀 Starting build process...');
    
    try {
      await this.clean();
      await this.copyAssets();
      await this.processHTML();
      await this.processCSS();
      await this.processJS();
      await this.processData();
      await this.generateSitemap();
      await this.generateManifest();
      
      console.log('✅ Build completed successfully!');
      console.log(`📁 Output directory: ${this.docsDir}`);
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async clean() {
    console.log('🧹 Cleaning output directory...');
    await fs.emptyDir(this.docsDir);
  }

  async copyAssets() {
    console.log('📂 Copying assets...');
    
    const assetsDir = path.join(this.srcDir, 'assets');
    const outputAssetsDir = path.join(this.docsDir, 'assets');
    
    if (await fs.pathExists(assetsDir)) {
      await fs.copy(assetsDir, outputAssetsDir);
    }

    // Create favicon if it doesn't exist
    const faviconPath = path.join(outputAssetsDir, 'images', 'favicon.ico');
    if (!await fs.pathExists(faviconPath)) {
      await fs.ensureDir(path.dirname(faviconPath));
      // Create a simple favicon placeholder
      await fs.writeFile(faviconPath, ''); // In real project, use actual favicon
    }
  }

  async processHTML() {
    console.log('📄 Processing HTML...');
    
    const htmlPath = path.join(this.srcDir, 'index.html');
    let html = await fs.readFile(htmlPath, 'utf8');
    
    // Inject build metadata
    html = html.replace(
      '{{BUILD_TIME}}', 
      this.buildTime
    );
    
    // Replace individual CSS files with combined file
    html = html.replace(
      /<link rel="stylesheet" href="styles\/[^"]+\.css"[^>]*>/g,
      ''
    );
    
    // Replace individual script files with combined file
    html = html.replace(
      /<script src="scripts\/[^"]+\.js"[^>]*><\/script>/g,
      ''
    );
    
    // Add combined CSS file
    html = html.replace(
      '</head>',
      '    <link rel="stylesheet" href="style.css">\n</head>'
    );
    
    // Add combined JS file before closing body tag
    html = html.replace(
      '</body>',
      '    <script src="script.js"></script>\n</body>'
    );
    
    // Minify HTML
    const minified = await minifyHTML(html, {
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true,
      collapseWhitespace: true
    });
    
    await fs.writeFile(path.join(this.docsDir, 'index.html'), minified);
  }

  async processCSS() {
    console.log('🎨 Processing CSS...');
    
    const stylesDir = path.join(this.srcDir, 'styles');
    const cssFiles = ['main.css', 'components.css', 'responsive.css'];
    
    let combinedCSS = '';
    let foundFiles = [];
    
    // Ensure styles directory exists
    await fs.ensureDir(stylesDir);
    
    for (const file of cssFiles) {
      const filePath = path.join(stylesDir, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        combinedCSS += `\n/* ${file} */\n${content}`;
        foundFiles.push(file);
        console.log(`  ✅ Found ${file}`);
      } else {
        console.log(`  ⚠️  Missing ${file} - skipping`);
      }
    }
    
    // If no CSS files found, create a minimal style
    if (combinedCSS.trim() === '') {
      console.log('  📝 Creating minimal CSS fallback...');
      combinedCSS = `
/* Minimal CSS Fallback */
body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 9999;
}

.header {
  background: linear-gradient(135deg, #2c3e50 0%, #4facfe 100%);
  color: white;
  padding: 30px;
  text-align: center;
  border-radius: 15px;
  margin-bottom: 30px;
}
      `;
    }
    
    // Add build header
    const header = `/*! Earth System Model Visualization v${require('../package.json').version} | Built: ${this.buildTime} */\n`;
    combinedCSS = header + combinedCSS;
    
    // Minify CSS
    try {
      const result = await new CleanCSS({
        level: 2,
        returnPromise: true
      }).minify(combinedCSS);
      
      await fs.writeFile(path.join(this.docsDir, 'style.css'), result.styles);
      console.log(`  ✅ CSS processed: ${result.styles.length} bytes`);
      
    } catch (error) {
      console.warn('  ⚠️  CSS minification failed, using unminified CSS');
      await fs.writeFile(path.join(this.docsDir, 'style.css'), combinedCSS);
    }
    
    // Generate source map if needed
    if (process.env.NODE_ENV !== 'production') {
      await fs.writeFile(
        path.join(this.docsDir, 'style.css.map'), 
        JSON.stringify({ sources: foundFiles, version: 3 })
      );
    }
  }

  async processJS() {
    console.log('⚡ Processing JavaScript...');
    
    const scriptsDir = path.join(this.srcDir, 'scripts');
    const jsFiles = [
      'data-manager.js',
      'ui-components.js', 
      'network-view.js',
      'modal-manager.js',
      'main.js'
    ];
    
    let combinedJS = '';
    let foundFiles = [];
    
    // Ensure scripts directory exists
    await fs.ensureDir(scriptsDir);
    
    for (const file of jsFiles) {
      const filePath = path.join(scriptsDir, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        combinedJS += `\n// ${file}\n${content}`;
        foundFiles.push(file);
        console.log(`  ✅ Found ${file}`);
      } else {
        console.log(`  ⚠️  Missing ${file} - skipping`);
      }
    }
    
    // If no JS files found, create a minimal script
    if (combinedJS.trim() === '') {
      console.log('  📝 Creating minimal JavaScript fallback...');
      combinedJS = `
// Minimal JavaScript Fallback
console.log('Earth System Model Visualization - Minimal Mode');

document.addEventListener('DOMContentLoaded', function() {
  // Hide loading screen
  const loadingScreen = document.getElementById('loadingScreen');
  const mainContainer = document.getElementById('mainContainer');
  
  if (loadingScreen && mainContainer) {
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      mainContainer.style.display = 'block';
    }, 1000);
  }
  
  // Basic error message
  const errorMsg = document.createElement('div');
  errorMsg.innerHTML = '<h3>⚠️ Development Mode</h3><p>JavaScript modules are not yet built. Please run the development server or build the project.</p>';
  errorMsg.style.cssText = 'background: #fff3cd; color: #856404; padding: 20px; margin: 20px; border-radius: 10px; border: 1px solid #ffeaa7;';
  
  const content = document.querySelector('.content');
  if (content) {
    content.insertBefore(errorMsg, content.firstChild);
  }
});
      `;
    }
    
    // Add build metadata
    const header = `/*! Earth System Model Visualization v${require('../package.json').version} | Built: ${this.buildTime} */\n`;
    combinedJS = header + combinedJS;
    
    // Minify JavaScript
    try {
      const result = await minifyJS(combinedJS, {
        sourceMap: process.env.NODE_ENV !== 'production',
        compress: {
          drop_console: process.env.NODE_ENV === 'production'
        }
      });
      
      await fs.writeFile(path.join(this.docsDir, 'script.js'), result.code);
      console.log(`  ✅ JavaScript processed: ${result.code.length} bytes`);
      
      if (result.map) {
        await fs.writeFile(path.join(this.docsDir, 'script.js.map'), result.map);
      }
      
    } catch (error) {
      console.warn('  ⚠️  JavaScript minification failed, using unminified JS');
      await fs.writeFile(path.join(this.docsDir, 'script.js'), combinedJS);
    }
  }

  async processData() {
    console.log('📊 Processing data files...');
    
    const dataDir = path.join(this.srcDir, 'data');
    const outputDataDir = path.join(this.docsDir, 'data');
    
    await fs.ensureDir(outputDataDir);
    
    const dataFile = path.join(dataDir, 'earth-system-data.json');
    if (await fs.pathExists(dataFile)) {
      const data = await fs.readJson(dataFile);
      
      // Add metadata
      data.metadata = {
        version: require('../package.json').version,
        buildTime: this.buildTime,
        totalVariables: data.variables ? data.variables.length : 0
      };
      
      await fs.writeJson(
        path.join(outputDataDir, 'earth-system-data.json'), 
        data, 
        { spaces: process.env.NODE_ENV === 'production' ? 0 : 2 }
      );
    }
  }

  async generateSitemap() {
    console.log('🗺️ Generating sitemap...');
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yunks128.github.io/earth-system-model-viz/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    await fs.writeFile(path.join(this.docsDir, 'sitemap.xml'), sitemap);
  }

  async generateManifest() {
    console.log('📱 Generating web manifest...');
    
    const manifest = {
      name: "Earth System Model Data Assimilation Visualization",
      short_name: "ESM Viz",
      description: "Interactive visualization of Earth system model data assimilation",
      start_url: "./",
      display: "standalone",
      background_color: "#667eea",
      theme_color: "#667eea",
      icons: [
        {
          src: "assets/images/favicon.ico",
          sizes: "32x32",
          type: "image/x-icon"
        }
      ]
    };
    
    await fs.writeJson(path.join(this.docsDir, 'manifest.json'), manifest, { spaces: 2 });
  }
}

// Run the build
if (require.main === module) {
  new Builder().build();
}

module.exports = Builder;