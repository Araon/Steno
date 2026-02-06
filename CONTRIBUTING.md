# Contributing to Steno

Thank you for your interest in contributing to Steno! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Git Workflow](#git-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [GitHub Configuration](#github-configuration)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/Steno.git`
3. Add upstream remote: `git remote add upstream https://github.com/Araon/Steno.git`
4. Create a feature branch from `main`: `git checkout -b feature/your-feature-name`

## Development Setup

See [AGENTS.md](./AGENTS.md) for detailed setup instructions including:
- Installation commands
- Development server startup
- Lint and test commands

### Quick Start

```bash
# Install dependencies
pnpm install
cd apps/api && pipenv install

# Start all services in development mode
pnpm dev
```

## Git Workflow

### Branch Strategy

- **main**: Production-ready code. All PRs go here first.
- **release**: Release branch tracking production releases with version tags.

### Creating a Feature Branch

```bash
git checkout -b feature/descriptive-name
```

Branch naming conventions:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Build process, dependencies, tooling

### Making Changes

1. Make your changes
2. Run linting and tests locally:
   ```bash
   pnpm lint          # TypeScript/JavaScript
   cd apps/api && pipenv run lint  # Python
   ```
3. Commit with conventional commit messages (see [Commit Messages](#commit-messages))
4. Push to your fork: `git push origin feature/your-feature-name`

### Syncing with Main

Keep your branch up to date:

```bash
git fetch upstream
git rebase upstream/main
git push -f origin feature/your-feature-name
```

## Code Style Guidelines

For detailed code style guidelines including naming conventions, imports, and best practices, see [AGENTS.md](./AGENTS.md#code-style-guidelines).

### Quick Reference

**TypeScript/React:**
- 2-space indentation
- Single quotes for strings
- Max line length: 88 characters
- `PascalCase` for components
- `camelCase` for functions/variables

**Python:**
- Line length: 88 characters (Black formatter)
- Double quotes for strings
- `snake_case` for functions/variables
- `PascalCase` for classes

## Commit Messages

Follow conventional commit format:

```
type: description

Optional longer explanation if needed.

Fixes #123 (if applicable)
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **refactor**: A code refactor
- **style**: Code style changes (formatting, linting fixes)
- **docs**: Documentation updates
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling updates
- **perf**: Performance improvements

### Examples

```
feat: add kinetic typography animation
fix: prevent caption overlap on short videos
docs: update installation instructions
style: auto-fix lint issues
```

## Pull Requests

### Before Submitting

- [ ] Create a descriptive title following conventional commits
- [ ] Link related issues using `Fixes #123`
- [ ] Ensure all tests pass locally
- [ ] Run linting and fix any issues
- [ ] Update documentation if needed
- [ ] Add new tests for new features

### PR Guidelines

1. **Description**: Clearly describe what your PR does and why
2. **Type of change**: Specify whether it's a feature, fix, or breaking change
3. **Testing**: Explain how to test your changes
4. **Checklist**: Complete all relevant items in the template

### CI/CD Checks

All PRs must pass:
- ✅ TypeScript/JavaScript linting
- ✅ Python linting and formatting
- ✅ GitHub status checks

Auto-fix commits will be applied for style issues.

## GitHub Configuration

### Initial Setup (Repository Owner)

#### 1. Run GitHub CLI Commands

Use `gh` to configure branch protection and settings. See [gh-setup.md](scripts/gh-setup.md) for the commands, or run them below:

**Option A: Individual commands (one at a time)**

```bash
# Set default branch
gh repo edit --default-branch main

# Create release branch
git fetch origin main && git checkout -b release origin/main && git push -u origin release

# Configure main branch protection
gh api repos/Araon/Steno/branches/main/protection --input /dev/stdin << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint TypeScript", "Lint Python", "Test TypeScript", "Test Python"]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "enforce_admins": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

# Configure release branch protection
gh api repos/Araon/Steno/branches/release/protection --input /dev/stdin << 'EOF'
{
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "enforce_admins": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

# Configure PR settings
gh repo edit --allow-auto-merge --allow-squash-merge --allow-merge-commit --allow-rebase-merge --delete-branch-on-merge
```

**Option B: All at once (copy & paste)**

See the [gh-setup.md](scripts/gh-setup.md) file for the complete combined command.

#### 2. Verify Configuration (Optional)

##### Main Branch Protection Rules
- Branch name pattern: `main`
- Require pull request reviews before merging: **Enabled**
  - Dismiss stale pull request approvals when new commits are pushed: **Enabled**
  - Require review from Code Owners: **Disabled** (optional)
- Require status checks to pass before merging: **Enabled**
  - Required status checks:
    - `Lint TypeScript`
    - `Lint Python`
- Require branches to be up to date before merging: **Enabled**
- Include administrators: **Enabled** (enforce rules for admins too)
- Allow force pushes: **Disabled**
- Allow deletions: **Disabled**

##### Release Branch Protection Rules
- Branch name pattern: `release`
- Require pull request reviews before merging: **Enabled**
- Require status checks to pass before merging: **Enabled**
- Require branches to be up to date before merging: **Enabled**
- Allow deletions: **Disabled**

#### 3. Configure Auto-merge

- Go to **Settings → General**
- Under "Pull Requests":
  - Allow auto-merge: **Enabled**
  - Allow squash merging: **Enabled**
  - Allow rebase merging: **Enabled**
  - Allow auto-delete head branches: **Enabled**

#### 4. Configure Code Owners (Optional)

Create `.github/CODEOWNERS`:

```
# Global owners
* @Araon

# Frontend
apps/web/ @Araon
apps/renderer/ @Araon

# Backend
apps/api/ @Araon

# Shared contracts
packages/contracts/ @Araon
```

### GitHub Actions Secrets

Go to **Settings → Secrets and variables → Actions** to add any needed secrets:

Currently, all workflows use `secrets.GITHUB_TOKEN` which is automatically provided.

## Release Process

### Fully Automated Release & Branch Promotion

Each push to `main` automatically:
1. ✅ Runs all tests
2. ✅ If tests pass, detects version bump needed (based on commit messages)
3. ✅ Bumps version in `package.json` and Python files
4. ✅ Commits the version update back to main
5. ✅ Merges main into release branch
6. ✅ Creates a GitHub release with the new tag

### How It Works

#### Commit Message Convention

Use conventional commit format to trigger version bumps:

```
feat: add new feature         # → MINOR bump (0.1.0 → 0.2.0)
fix: fix a bug                # → PATCH bump (0.1.0 → 0.1.1)
BREAKING CHANGE: redesign API # → MAJOR bump (0.1.0 → 1.0.0)
```

See [Commit Messages](#commit-messages) section for examples.

#### Automatic Release Workflow

1. **Commit and push to main**:
   ```bash
   git commit -m "feat: add new feature"
   git push origin feature-branch
   # Create PR and merge to main
   ```

2. **Tests run automatically**:
   - TypeScript tests
   - Python tests
   - Lint checks

3. **Version bumped automatically** (if tests pass):
   - Version calculated based on commit messages
   - Updated in `package.json`, `pyproject.toml`, `Pipfile`
   - Committed and pushed back to main
   - Shown in Actions tab

4. **Release promotion automatic**:
   - Release branch is merged with main
   - GitHub release is created with the tag
   - No manual steps needed!

### What Gets Updated

The release workflow automatically updates:
- `package.json` - version field
- `apps/api/pyproject.toml` - version field
- `apps/api/Pipfile` - version field

### Monitoring a Release

1. Push to main
2. Go to **Actions** tab in GitHub
3. Watch the **Release** workflow:
   - **test** job runs first
   - **promote-to-release** job runs after tests pass
4. Release is created when workflow completes

### Manual Release (Emergency Only)

If you need to manually trigger a release:

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Get current version
CURRENT=$(jq -r '.version' package.json)

# Calculate new version manually and update
jq '.version = "0.2.0"' package.json > package.json.tmp
mv package.json.tmp package.json
sed -i '' 's/version = "[^"]*"/version = "0.2.0"/' apps/api/pyproject.toml
sed -i '' 's/version = "[^"]*"/version = "0.2.0"/' apps/api/Pipfile

# Commit and push
git add package.json apps/api/pyproject.toml apps/api/Pipfile
git commit -m "chore: bump version to 0.2.0"
git push origin main

# Wait for workflow to complete, or trigger manually in Actions tab
```

## Questions or Need Help?

- Check [AGENTS.md](./AGENTS.md) for comprehensive guidelines
- Review existing issues and PRs
- Create a new issue for bugs or features
- Reach out to the maintainers

Happy contributing! 🎉
