#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const url = require('url');

/**
 * Development server for Earth System Model Visualization
 * Serves files from src/ directory with live reload capabilities
 */

class DevServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.srcDir = path.join(__dirname, '..', 'src');
    this.watchedFiles = new Set();
    this.clients = new Set();
  }

  async start() {
    console.log('🚀 Starting development server...');
    
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    
    this.server.listen(this.port, this.host, () => {
      console.log(`🌐 Server running at http://${this.host}:${this.port}`);
      console.log(`📁 Serving files from: ${this.srcDir}`);
      console.log('🔄 Live reload enabled');
      console.log('\n📋 Available commands:');
      console.log('  - Press Ctrl+C to stop');
      console.log('  - Visit the URL above to view the application');
    });

    // Setup file watching for live reload
    this.setupFileWatcher();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      this.server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    let filePath = parsedUrl.pathname;

    // Handle root path
    if (filePath === '/') {
      filePath = '/index.html';
    }

    // Handle live reload endpoint
    if (filePath === '/dev-reload') {
      this.handleLiveReload(req, res);
      return;
    }

    // Determine file path
    const fullPath = path.join(this.srcDir, filePath);
    
    try {
      // Check if file exists
      await fs.access(fullPath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        // Try to serve index.html from directory
        const indexPath = path.join(fullPath, 'index.html');
        if (await fs.pathExists(indexPath)) {
          await this.serveFile(indexPath, res);
        } else {
          await this.serveDirectoryListing(fullPath, res, filePath);
        }
      } else {
        await this.serveFile(fullPath, res);
      }
    } catch (error) {
      this.serve404(res, filePath);
    }
  }

  async serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = this.getContentType(ext);
    
    try {
      let content = await fs.readFile(filePath);
      
      // Inject live reload script into HTML files
      if (ext === '.html') {
        const liveReloadScript = `
<script>
  // Live reload for development
  (function() {
    const source = new EventSource('/dev-reload');
    source.onmessage = function(event) {
      if (event.data === 'reload') {
        location.reload();
      }
    };
  })();
</script>`;
        content = content.toString().replace('</body>', liveReloadScript + '\n</body>');
      }
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      
      res.end(content);
      
      // Log the request
      console.log(`📄 ${new Date().toLocaleTimeString()} - ${path.basename(filePath)}`);
      
    } catch (error) {
      this.serve500(res, error);
    }
  }

  async serveDirectoryListing(dirPath, res, urlPath) {
    try {
      const files = await fs.readdir(dirPath);
      
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Directory: ${urlPath}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .file { display: block; padding: 8px; text-decoration: none; color: #333; }
        .file:hover { background: #f0f0f0; }
        .directory { font-weight: bold; color: #0066cc; }
    </style>
</head>
<body>
    <h1>Directory: ${urlPath}</h1>
    <a href="../" class="file directory">📁 ../</a>
    ${files.map(file => {
      const isDir = fs.statSync(path.join(dirPath, file)).isDirectory();
      const icon = isDir ? '📁' : '📄';
      const className = isDir ? 'file directory' : 'file';
      return `<a href="${file}" class="${className}">${icon} ${file}</a>`;
    }).join('\n    ')}
</body>
</html>`;
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      this.serve500(res, error);
    }
  }

  handleLiveReload(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Add client to the set
    this.clients.add(res);
    
    // Send initial connection message
    res.write('data: connected\n\n');

    // Remove client when connection closes
    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  notifyReload() {
    console.log('🔄 File changed - reloading browsers...');
    this.clients.forEach(client => {
      try {
        client.write('data: reload\n\n');
      } catch (error) {
        this.clients.delete(client);
      }
    });
  }

  setupFileWatcher() {
    const chokidar = require('fs').watch || null;
    
    if (!chokidar) {
      console.log('⚠️  File watching not available, manual refresh required');
      return;
    }

    // Watch source directory recursively
    this.watchDirectory(this.srcDir);
  }

  watchDirectory(dir) {
    fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
      if (err) return;

      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          this.watchDirectory(fullPath);
        } else {
          if (!this.watchedFiles.has(fullPath)) {
            this.watchedFiles.add(fullPath);
            
            fs.watchFile(fullPath, { interval: 100 }, (curr, prev) => {
              if (curr.mtime !== prev.mtime) {
                this.notifyReload();
              }
            });
          }
        }
      });
    });
  }

  serve404(res, filePath) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>404 - Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #cc0000; font-size: 48px; margin-bottom: 20px; }
        .message { font-size: 18px; color: #666; }
        .path { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 20px; }
    </style>
</head>
<body>
    <div class="error">404</div>
    <div class="message">File not found</div>
    <div class="path">${filePath}</div>
    <a href="/">← Back to home</a>
</body>
</html>`;
    
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(html);
    console.log(`❌ 404 - ${filePath}`);
  }

  serve500(res, error) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>500 - Server Error</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #cc0000; font-size: 48px; margin-bottom: 20px; }
        .message { font-size: 18px; color: #666; }
        .details { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px; text-align: left; }
    </style>
</head>
<body>
    <div class="error">500</div>
    <div class="message">Server Error</div>
    <div class="details"><pre>${error.message}</pre></div>
    <a href="/">← Back to home</a>
</body>
</html>`;
    
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(html);
    console.error(`❌ 500 - ${error.message}`);
  }

  getContentType(ext) {
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.xml': 'application/xml',
      '.pdf': 'application/pdf'
    };
    
    return types[ext] || 'text/plain';
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'port') options.port = parseInt(value);
    if (key === 'host') options.host = value;
  }
  
  const server = new DevServer(options);
  server.start().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = DevServer;