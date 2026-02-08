# Contributing to EchoMind WebUI

Thank you for your interest in contributing to EchoMind WebUI! 🎉

This is a customized fork of [Open WebUI](https://github.com/open-webui/open-webui) tailored for the EchoMind platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Getting Help](#getting-help)

---

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **npm**
- **Git**

### Environment Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/echo-mind-webui.git
   cd echo-mind-webui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## 🔄 Development Workflow

We use a **simplified GitHub Flow with staging**:

```
main (production)
 ↑
develop (staging - demo.echomind.ch)
 ↑
feature/your-feature-name (your work)
```

### Branch Naming Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/add-dark-mode` |
| `fix/` | Bug fixes | `fix/chat-scroll-issue` |
| `docs/` | Documentation only | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/component-structure` |
| `style/` | UI/CSS changes | `style/improve-mobile-layout` |
| `test/` | Test improvements | `test/add-component-tests` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |

### Creating a Feature Branch

1. **Ensure you're on `develop` and it's up-to-date:**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create your feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and commit regularly:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows our [coding standards](#coding-standards)
- [ ] All tests pass locally (`npm test`)
- [ ] New code has tests
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Code formatted with Prettier (`npm run format`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow [conventional commits](#commit-message-guidelines)
- [ ] No merge conflicts with `develop`

### Submitting a PR

1. **Push your branch to your fork**

2. **Open a PR on GitHub:**
   - **Base:** `develop` (NOT `main`)
   - **Compare:** `your-fork:feature/your-feature-name`
   - **Title:** Clear, descriptive summary (50 chars max)
   - **Description:** Use the PR template (auto-populated)

3. **Wait for review:**
   - **Automated checks** will run (tests, linting, build)
   - **Maintainer review** required (1 approval minimum)
   - **Response time:** Typically 1-3 days

4. **Address feedback:**
   - Make requested changes
   - Push new commits
   - Reply to comments

5. **Merge:**
   - Once approved and CI passes, maintainer will merge
   - Your branch will be automatically deleted

---

## 💻 Coding Standards

### TypeScript/Svelte

- **Style:** Follow project's ESLint + Prettier config
- **Components:** Use Svelte components with TypeScript
- **Naming:**
  - Components: `PascalCase.svelte`
  - Variables/functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Types:** Define explicit types/interfaces
- **Props:** Use proper TypeScript types

**Example:**
```typescript
<script lang="ts">
  export let title: string;
  export let onClose: () => void;

  const handleClick = (): void => {
    onClose();
  };
</script>

<div class="modal">
  <h2>{title}</h2>
  <button on:click={handleClick}>Close</button>
</div>
```

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Component-specific styles in `<style>` blocks
- Follow existing color scheme and spacing
- Ensure **responsive design** (mobile-first)

---

## 🧪 Testing Requirements

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test Button.test.ts
```

**Requirements:**
- ✅ Test user interactions
- ✅ Test component rendering
- ✅ Mock API calls
- ✅ Cover edge cases

### Example Test

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const { getByRole } = render(Button, {
      props: { onClick: handleClick, label: 'Click me' }
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📝 Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(chat): add message threading` |
| `fix` | Bug fix | `fix(auth): resolve login redirect issue` |
| `docs` | Documentation | `docs: update API examples` |
| `style` | UI/CSS changes | `style(chat): improve message spacing` |
| `refactor` | Code refactoring | `refactor(components): simplify modal logic` |
| `perf` | Performance | `perf(chat): optimize message rendering` |
| `test` | Tests | `test(chat): add unit tests for ChatInput` |
| `chore` | Maintenance | `chore: update dependencies` |

### Examples

**Good:**
```
feat(chat): add support for markdown formatting

Adds markdown rendering to chat messages with syntax highlighting.
Includes support for code blocks, links, and images.

Closes #123
```

**Bad:**
```
fixed stuff
update
WIP
```

---

## 🆘 Getting Help

- **Questions:** Open a [Discussion](https://github.com/gen-mind/echo-mind-webui/discussions)
- **Bugs:** Open an [Issue](https://github.com/gen-mind/echo-mind-webui/issues)
- **Security:** Email security@echomind.ch

---

## 🎯 Good First Issues

Look for issues labeled [`good first issue`](https://github.com/gen-mind/echo-mind-webui/labels/good%20first%20issue)!

---

## 📚 Additional Resources

- [Open WebUI Documentation](https://docs.openwebui.com/)
- [Svelte Documentation](https://svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [EchoMind Main Repo](https://github.com/gen-mind/echo-mind)

---

## 🙏 Recognition

Contributors are recognized in:
- **README.md** Contributors section
- **CHANGELOG.md** for each release
- **GitHub Insights** contributor graph

Thank you for making EchoMind WebUI better! 💙
