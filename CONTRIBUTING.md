# Contributing to Earth System Model Visualization

Thank you for your interest in contributing to the Earth System Model Data Assimilation Visualization! This project aims to make Earth system science more accessible through interactive visualizations.

## 🌍 How You Can Contribute

### 🐛 Reporting Bugs
- Use the [GitHub Issues](https://github.com/yunks128/earth-system-model-viz/issues) page
- Search existing issues first to avoid duplicates
- Provide detailed reproduction steps
- Include browser/OS information
- Add screenshots or screen recordings if helpful

### 💡 Suggesting Features
- Open a [Feature Request](https://github.com/yunks128/earth-system-model-viz/issues/new)
- Describe the scientific use case
- Explain how it would benefit the community
- Provide mockups or examples if possible

### 🔬 Contributing Data
- New Earth system models
- Additional satellite missions
- Updated variable descriptions
- Mission launch dates and status updates

### 💻 Code Contributions
- Bug fixes
- New interactive features
- Performance improvements
- Accessibility enhancements
- Documentation updates

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm 8+
- Git
- Modern web browser
- Basic knowledge of HTML, CSS, JavaScript

### Local Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yunks128/earth-system-model-viz.git
   cd earth-system-model-viz
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   Open http://localhost:3000 in your browser

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## 📝 Development Guidelines

### Code Style
- We use ESLint and Prettier for consistent formatting
- Run `npm run lint` before committing
- Use meaningful variable and function names
- Add comments for complex logic
- Follow semantic HTML practices

### File Organization
```
src/
├── index.html          # Main HTML structure
├── styles/             # CSS stylesheets
│   ├── main.css       # Core styles
│   ├── components.css # Component-specific styles
│   └── responsive.css # Mobile responsiveness
├── scripts/           # JavaScript modules
│   ├── main.js       # Application entry point
│   ├── data-manager.js    # Data handling
│   ├── ui-components.js   # UI interactions
│   ├── network-view.js    # Network visualization
│   └── modal-manager.js   # Modal functionality
└── data/
    └── earth-system-data.json  # Core dataset
```

### Commit Message Format
Use conventional commits for clear history:
```
type(scope): description

feat(network): add interactive node selection
fix(search): resolve case sensitivity issue
docs(readme): update installation instructions
style(css): improve mobile responsiveness
test(data): add validation tests
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use the PR template
   - Provide clear description
   - Link related issues
   - Add screenshots for UI changes

## 🧪 Testing

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Writing Tests
- Use Jest for unit tests
- Test user interactions and edge cases
- Aim for >80% code coverage
- Mock external dependencies

### Manual Testing
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Verify mobile responsiveness
- Check accessibility with screen readers
- Test with different data sizes

## 🎨 Design Guidelines

### Visual Design
- Follow existing color palette and spacing
- Maintain consistency with scientific visualization standards
- Ensure accessibility (WCAG 2.1 AA compliance)
- Use smooth animations and transitions

### User Experience
- Prioritize scientific workflow efficiency
- Provide clear feedback for user actions
- Support keyboard navigation
- Include helpful tooltips and labels

### Data Visualization
- Use appropriate chart types for data
- Ensure color accessibility (colorblind-friendly)
- Provide multiple ways to explore data
- Support data export capabilities

## 📊 Adding New Data

### Earth System Models
To add a new model, update `src/data/earth-system-data.json`:

```json
{
  "models": [
    {
      "name": "NEW-MODEL",
      "fullName": "Full Model Name",
      "description": "Model description",
      "domain": "Scientific domain",
      "institution": "Institution name",
      "website": "https://model-website.org",
      "variables": 0
    }
  ]
}
```

### Variables
Add new variables to the variables array:

```json
{
  "variables": [
    {
      "id": "unique_id",
      "variable": "Variable Name",
      "category": "Category Name",
      "sources": ["Mission1", "Mission2"],
      "models": ["MODEL1", "MODEL2"],
      "units": "units",
      "description": "Variable description",
      "applications": ["Use case 1", "Use case 2"]
    }
  ]
}
```

### Data Validation
- Ensure all required fields are present
- Validate data types and formats
- Check for duplicates
- Test with the validation script: `npm run validate-data`

## 🔧 Build and Deployment

### Build Process
The build system:
1. Combines and minifies CSS/JS files
2. Optimizes images and assets
3. Generates production HTML
4. Creates source maps for debugging
5. Outputs to `docs/` directory for GitHub Pages

### Continuous Integration
- GitHub Actions automatically runs tests
- Builds are deployed to GitHub Pages on merge to main
- Coverage reports are generated and tracked

### Performance Considerations
- Keep bundle sizes small
- Optimize images and assets
- Use efficient algorithms for data processing
- Test with large datasets

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Celebrate diverse perspectives

### Communication
- Use GitHub Issues for bug reports and feature requests
- Start discussions for major changes
- Be clear and specific in communications
- Respond promptly to review requests

### Recognition
Contributors are recognized in:
- CHANGELOG.md for their contributions
- README.md contributors section
- Annual community highlights

## 🆘 Getting Help

### Documentation
- Check the [README.md](README.md) for basic setup
- Review existing [GitHub Issues](https://github.com/yunks128/earth-system-model-viz/issues)
- Look at the [Wiki](https://github.com/yunks128/earth-system-model-viz/wiki) for detailed guides

### Contact
- 📧 Email: your.email@example.com
- 💬 GitHub Discussions for questions
- 🐛 GitHub Issues for bugs and features

### Resources
- [Earth System Science Community](https://www.earthsystemscience.org/)
- [Data Visualization Best Practices](https://datavizproject.com/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

Thank you for contributing to making Earth system science more accessible! 🌍✨