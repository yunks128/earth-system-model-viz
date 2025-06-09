#!/usr/bin/env node

/**
 * Deploy script for Earth System Model Visualization
 * Builds and deploys to GitHub Pages
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class Deployer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.docsDir = path.join(this.projectRoot, 'docs');
    this.packagePath = path.join(this.projectRoot, 'package.json');
  }

  async deploy() {
    console.log('🚀 Starting deployment process...');
    
    try {
      await this.validateEnvironment();
      await this.runBuild();
      await this.validateBuild();
      await this.commitAndPush();
      
      console.log('✅ Deployment completed successfully!');
      console.log('🌐 Your site will be available at: https://yunks128.github.io/earth-system-model-viz');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Not in a git repository. Please initialize git first.');
    }
    
    // Check if package.json exists
    if (!await fs.pathExists(this.packagePath)) {
      throw new Error('package.json not found');
    }
    
    console.log('✅ Environment validated');
  }

  async runBuild() {
    console.log('🔨 Running build process...');
    
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      console.log('✅ Build completed');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async validateBuild() {
    console.log('🔍 Validating build output...');
    
    if (!await fs.pathExists(this.docsDir)) {
      throw new Error('docs directory not found. Build may have failed.');
    }
    
    const indexPath = path.join(this.docsDir, 'index.html');
    if (!await fs.pathExists(indexPath)) {
      throw new Error('index.html not found in docs directory.');
    }
    
    const files = await fs.readdir(this.docsDir);
    console.log(`✅ Found ${files.length} files in docs directory`);
  }

  async commitAndPush() {
    console.log('📤 Committing and pushing to GitHub...');
    
    try {
      // Check if there are changes to commit
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (!status.trim()) {
        console.log('📄 No changes to commit');
        return;
      }
      
      // Add all files
      execSync('git add .', { stdio: 'inherit' });
      
      // Create commit message
      const timestamp = new Date().toISOString();
      const commitMessage = `Deploy: Update Earth System Model Visualization

✨ Enhanced network view with hierarchical structure
- Categories as major central nodes
- Variables positioned around categories  
- Models and data sources strategically placed
- Improved force simulation and spacing
- Larger canvas size for better visualization

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
Deployed: ${timestamp}`;
      
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      // Push to origin
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log('✅ Successfully pushed to GitHub');
      
    } catch (error) {
      throw new Error(`Git operations failed: ${error.message}`);
    }
  }

  async getRemoteUrl() {
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
      return remoteUrl;
    } catch (error) {
      throw new Error('Could not get remote URL. Make sure git remote is configured.');
    }
  }

  async checkGitHubPages() {
    console.log('🔍 Checking GitHub Pages configuration...');
    
    try {
      const remoteUrl = await this.getRemoteUrl();
      console.log(`📍 Repository: ${remoteUrl}`);
      
      // Extract owner and repo from URL
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        const [, owner, repo] = match;
        const pagesUrl = `https://${owner}.github.io/${repo}`;
        console.log(`🌐 GitHub Pages URL: ${pagesUrl}`);
        console.log('💡 Note: It may take a few minutes for changes to appear on GitHub Pages');
      }
      
    } catch (error) {
      console.warn('⚠️  Could not determine GitHub Pages URL:', error.message);
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new Deployer();
  deployer.deploy()
    .then(() => deployer.checkGitHubPages())
    .catch(error => {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = Deployer;