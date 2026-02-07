# Contributing to Arena Companion

Thank you for your interest in contributing to Arena Companion! This document provides guidelines and best practices for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Security](#security)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Prioritize the project's best interests
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Any conduct that could be considered unprofessional

## Getting Started

### Prerequisites

- Google Chrome 114+ or any Chromium-based browser
- Basic knowledge of JavaScript (ES6+), HTML5, and CSS3
- Understanding of Chrome Extension APIs
- Git for version control

### First-Time Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a branch** for your changes
4. **Make your changes** following our coding standards
5. **Test thoroughly** in Chrome
6. **Submit a pull request**

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Mohammad-Faiz-Cloud-Engineer/arena-companion.git
cd arena-companion
```

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the extension directory

### 3. Make Changes

- Edit files in your preferred code editor
- Reload the extension in Chrome after changes
- Test functionality thoroughly

## Coding Standards

### JavaScript

#### Style Guide

- **ES6+ Syntax**: Use modern JavaScript (const/let, arrow functions, async/await)
- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings (except JSON)
- **Naming Conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes
  - `UPPER_SNAKE_CASE` for constants
  - Descriptive names (avoid single letters except in loops)

#### Code Quality

```javascript
// ✅ GOOD
const getUserDetails = async () => {
  try {
    const result = await storage.get(CONFIG.STORAGE_KEYS.USER_DETAILS);
    return result;
  } catch (error) {
    logger.error('Failed to get user details', error);
    throw error;
  }
};

// ❌ BAD
function gUD() {
  var r = storage.get('user');
  return r;
}
```

#### JSDoc Documentation

All functions must have JSDoc comments:

```javascript
/**
 * Retrieves user details from storage
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Object>} User details object
 * @throws {Error} If storage read fails
 */
const getUserDetails = async (userId) => {
  // Implementation
};
```

### HTML

- **Semantic HTML**: Use appropriate HTML5 elements
- **Accessibility**: Include ARIA labels and roles
- **Indentation**: 2 spaces
- **Attributes**: Use double quotes

```html
<!-- ✅ GOOD -->
<button 
  id="refreshBtn" 
  aria-label="Refresh Arena Companion" 
  type="button">
  Refresh
</button>

<!-- ❌ BAD -->
<div onclick="refresh()">Refresh</div>
```

### CSS

- **Modern CSS**: Use CSS variables, flexbox, grid
- **BEM Naming**: Use Block-Element-Modifier methodology
- **Indentation**: 2 spaces
- **Organization**: Group related properties

```css
/* ✅ GOOD */
:root {
  --color-primary: #1a73e8;
  --spacing-md: 16px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-primary);
}

/* ❌ BAD */
button {
  display: flex;
  background: blue;
  padding: 16px;
}
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **security**: Security improvements

### Examples

```bash
# Good commit messages
feat(context-menu): add summarize text action
fix(storage): prevent XSS in data sanitization
docs(readme): update installation instructions
security(logger): add token redaction

# Bad commit messages
update stuff
fix bug
changes
```

### Commit Best Practices

- Write clear, descriptive commit messages
- Keep commits atomic (one logical change per commit)
- Reference issue numbers when applicable
- Use present tense ("add feature" not "added feature")

## Pull Request Process

### Before Submitting

1. **Test thoroughly** in Chrome
2. **Update documentation** if needed
3. **Follow coding standards**
4. **Check for console errors**
5. **Verify no security issues**
6. **Update CHANGELOG.md** if applicable

### PR Title Format

```
[Type] Brief description of changes
```

Examples:
- `[Feature] Add text summarization context menu`
- `[Fix] Resolve storage quota exceeded error`
- `[Security] Enhance XSS prevention in sanitization`

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Security improvement

## Testing
- [ ] Tested in Chrome 114+
- [ ] No console errors
- [ ] All features working as expected

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] CHANGELOG.md updated (if applicable)

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**: Ensure all checks pass
2. **Code Review**: Wait for maintainer review
3. **Address Feedback**: Make requested changes
4. **Approval**: Get approval from maintainer
5. **Merge**: Maintainer will merge your PR

## Testing

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Side panel opens correctly
- [ ] Refresh button works
- [ ] Context menu appears on text selection
- [ ] Text actions (summarize, explain, rewrite) work
- [ ] No console errors or warnings
- [ ] Storage operations work correctly
- [ ] Dark mode displays correctly
- [ ] Keyboard navigation works

### Browser Testing

Test in:
- Chrome 114+
- Microsoft Edge 114+
- Other Chromium-based browsers (optional)

### Performance Testing

- Check memory usage (should be < 5MB)
- Verify no memory leaks
- Test with multiple tabs open
- Monitor CPU usage

## Security

### Security Guidelines

1. **Never commit sensitive data**:
   - API keys
   - Private keys (.pem files)
   - Passwords or tokens
   - User data

2. **Sanitize all inputs**:
   - Use provided sanitization functions
   - Validate data before storage
   - Prevent XSS attacks

3. **Follow security best practices**:
   - Use HTTPS only
   - Minimize permissions
   - Validate all external data
   - Use Content Security Policy

### Security Review

All PRs with security implications will undergo additional review. Please:
- Highlight security-related changes
- Explain security considerations
- Provide testing evidence
- Reference SECURITY.md

## Questions?

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the maintainer directly for sensitive matters

## Recognition

Contributors will be recognized in:
- CHANGELOG.md (for significant contributions)
- README.md (for major features)
- GitHub contributors page

---

**Thank you for contributing to Arena Companion!**

*Last Updated: February 7, 2026*
