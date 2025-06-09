# 🌍 Earth System Model Data Assimilation Visualization

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://yunks128.github.io/earth-system-model-viz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/yunks128/earth-system-model-viz/deploy.yml?style=for-the-badge)](https://github.com/yunks128/earth-system-model-viz/actions)

An interactive visualization platform for exploring relationships between Earth system model variables, satellite missions, and data assimilation systems. This tool provides scientists and researchers with an intuitive way to understand the complex interconnections in Earth system modeling.

## ✨ Features

### 🎯 **Interactive Exploration**
- **Real-time Search** - Instantly filter variables, missions, or models
- **Dynamic Filtering** - Click models to see their associated variables
- **Network Visualization** - Explore model-variable relationships in graph form
- **Detailed Modals** - Deep-dive into variable and model information

### 🌐 **Earth System Models Supported**
- **ECCO** - Ocean & Sea Ice Modeling (10 variables)
- **ISSM** - Ice Sheet & Land Motion (12 variables)  
- **CARDAMOM** - Carbon Cycle Modeling (11 variables)
- **CMS-FLUX** - Atmospheric Carbon & Meteorology (3 variables)
- **MOMO-CHEM** - Atmospheric Chemistry (8 variables)

### 📊 **Variable Categories**
- Ocean and Sea Ice Variables
- Land and Terrestrial Variables  
- Atmospheric Composition
- Carbon Cycle Components
- Climate and Reanalysis

### 🎨 **User Experience**
- Responsive design for all devices
- Smooth animations and transitions
- Keyboard shortcuts (`/` for search, `Esc` to close modals)
- Accessibility compliant
- Professional scientific styling

## 🚀 Quick Start

### View Live Demo
Visit the [live demonstration](https://yunks128.github.io/earth-system-model-viz) to explore the visualization immediately.

### Local Development

```bash
# Clone the repository
git clone https://github.com/yunks128/earth-system-model-viz.git
cd earth-system-model-viz

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 📖 Usage

### Basic Navigation
1. **Search**: Use the search bar to find specific variables, missions, or models
2. **Filter**: Click model buttons or cards to filter by specific Earth system models
3. **Explore**: Click on variables for detailed information about data sources
4. **Visualize**: Switch to network view to see model relationships

### Keyboard Shortcuts
- `/` - Focus search box
- `Esc` - Close modals
- `Enter` - Confirm selections

### Advanced Features
- **Category Expansion**: Click category headers to collapse/expand sections
- **Model Details**: Click model cards for comprehensive information
- **Variable Details**: Click any variable for mission and model details
- **Network Graph**: Interactive network showing model-category relationships

## 🛠 Development

### Project Structure
```
src/
├── index.html              # Main HTML file
├── styles/                 # CSS stylesheets
│   ├── main.css           # Core styles
│   ├── components.css     # Component styles
│   └── responsive.css     # Mobile responsiveness
├── scripts/               # JavaScript modules
│   ├── main.js           # Main application logic
│   ├── data-manager.js   # Data handling
│   ├── ui-components.js  # UI interactions
│   ├── network-view.js   # Network visualization
│   └── modal-manager.js  # Modal functionality
└── data/
    └── earth-system-data.json  # Core dataset
```

### Build Process
The build system:
- Minifies HTML, CSS, and JavaScript
- Optimizes images and assets
- Generates source maps for debugging
- Copies files to `docs/` for GitHub Pages

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

## 📊 Data Sources

The visualization includes data from:
- **Satellite Missions**: GRACE, ICESat, MODIS, OMI, OCO-2, and 50+ others
- **Ground Networks**: ARGO, GPS, tide gauges, eddy covariance towers
- **Reanalysis Products**: ERA5, MERRA-2, JRA-55
- **Model Outputs**: ECCO, WOA, RACMO, MAR

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Reporting Issues
Please use the [GitHub Issues](https://github.com/yunks128/earth-system-model-viz/issues) page to report bugs or request features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Citation

If you use this visualization in your research, please cite:

```bibtex
@software{earth_system_model_viz,
  title={Earth System Model Data Assimilation Visualization},
  author={Your Name},
  url={https://github.com/yunks128/earth-system-model-viz},
  year={2024},
  version={1.0.0}
}
```

## 🙏 Acknowledgments

- Earth system modeling community for data and insights
- NASA, NOAA, ESA, and other space agencies for satellite missions
- Open source visualization libraries and tools
- Scientific community for feedback and contributions

## 📞 Contact

- **GitHub**: [@yunks128](https://github.com/yunks128)
- **Email**: yunks128@example.com
- **Issues**: [GitHub Issues](https://github.com/yunks128/earth-system-model-viz/issues)

---

<div align="center">

**[🌍 Live Demo](https://yunks128.github.io/earth-system-model-viz)** | **[📖 Documentation](https://github.com/yunks128/earth-system-model-viz/wiki)** | **[🐛 Report Bug](https://github.com/yunks128/earth-system-model-viz/issues)**

Made with ❤️ for the Earth system science community

</div>