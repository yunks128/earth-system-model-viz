# 🚀 Deployment Guide

This guide explains how to deploy the Earth System Model Visualization to GitHub Pages at `yunks128.github.io/earth-system-model-viz`.

## 📋 Prerequisites

1. **GitHub Account**: Make sure you have access to the `yunks128` GitHub account
2. **Git Configuration**: Ensure git is configured with the correct credentials
3. **Node.js**: Version 16 or higher is required

## 🔧 Setup Instructions

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in as `yunks128`
2. Create a new repository named `earth-system-model-viz`
3. Make it public (required for GitHub Pages)
4. Don't initialize with README (we already have one)

### 2. Configure Local Git

```bash
# Initialize git repository (if not already done)
git init

# Add GitHub remote
git remote add origin https://github.com/yunks128/earth-system-model-viz.git

# Set your git identity
git config user.name "yunks128"
git config user.email "yunks128@example.com"
```

### 3. Initial Deployment

```bash
# Add all files to git
git add .

# Make initial commit
git commit -m "Initial commit: Earth System Model Visualization

✨ Features:
- Interactive visualization of 44 Earth system variables
- 5 Earth system models (ECCO, ISSM, CARDAMOM, CMS-FLUX, MOMO-CHEM)
- Multiple view modes (Cards, Network, Table)
- Search and filtering capabilities
- Responsive design for all devices
- Data export functionality

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push -u origin main
```

### 4. Enable GitHub Pages

1. Go to your repository: `https://github.com/yunks128/earth-system-model-viz`
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **"GitHub Actions"**
5. The GitHub Actions workflow will automatically build and deploy

## 🔄 Automatic Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:

1. **Builds** the project when you push to `main` branch
2. **Tests** the code to ensure quality
3. **Deploys** to GitHub Pages at `https://yunks128.github.io/earth-system-model-viz`

### Triggering Deployment

Simply push changes to the `main` branch:

```bash
# Make your changes
git add .
git commit -m "Update: describe your changes"
git push origin main
```

The site will be updated automatically in a few minutes.

## 🛠️ Manual Deployment

If you prefer manual deployment:

```bash
# Build the project
npm run build

# Deploy using the deploy script
npm run deploy
```

## 🌐 Access Your Site

After deployment, your site will be available at:

**https://yunks128.github.io/earth-system-model-viz**

## 📊 Monitoring Deployment

### Check Build Status

1. Go to the **Actions** tab in your GitHub repository
2. You'll see the deployment workflow runs
3. Green checkmark = successful deployment
4. Red X = deployment failed (check logs)

### Deployment Logs

Click on any workflow run to see detailed logs of:
- Testing results
- Build output
- Deployment status

## 🔧 Troubleshooting

### Common Issues

**1. Build Fails**
```bash
# Check for errors locally
npm run build
npm test
```

**2. GitHub Pages Not Working**
- Ensure repository is public
- Check that GitHub Actions is enabled
- Verify Pages source is set to "GitHub Actions"

**3. Site Not Updating**
- Wait 5-10 minutes for propagation
- Clear browser cache
- Check if deployment workflow completed successfully

### Getting Help

- **Check Workflow Logs**: GitHub repo → Actions tab
- **Issues**: [Create an issue](https://github.com/yunks128/earth-system-model-viz/issues)
- **Status**: Check if GitHub Pages service is running

## 🎯 Next Steps

1. **Custom Domain** (optional): Add a custom domain in repository settings
2. **Analytics**: Add Google Analytics to track usage
3. **CDN**: Consider using a CDN for better global performance
4. **SEO**: Optimize meta tags and descriptions

## 📝 Deployment Checklist

- [ ] Repository created on GitHub
- [ ] Git remote configured
- [ ] Initial commit pushed
- [ ] GitHub Pages enabled with GitHub Actions
- [ ] Workflow completed successfully
- [ ] Site accessible at URL
- [ ] All features working correctly
- [ ] Mobile responsiveness verified

---

🎉 **Congratulations!** Your Earth System Model Visualization is now live at `https://yunks128.github.io/earth-system-model-viz`