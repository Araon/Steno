#!/bin/bash

# GitHub Repository Setup Script
# Sets up branch protection and GitHub repository settings
# 
# Usage: ./setup-github.sh [--dry-run] [--verbose]
#
# Features:
# - Dynamic repository detection from git remote
# - GitHub authentication validation
# - Robust error handling with proper exit codes
# - Branch existence checking
# - Dry-run mode for testing
# - Detailed logging

set -euo pipefail

# Configuration
DEFAULT_BRANCH="main"
RELEASE_BRANCH="release"
DRY_RUN=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                log_info "Dry-run mode enabled"
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help message
show_help() {
    cat << EOF
GitHub Repository Setup Script

Sets up branch protection and GitHub repository settings.

Usage: $0 [OPTIONS]

Options:
    --dry-run    Show what would be done without executing
    --verbose    Enable verbose output
    -h, --help   Show this help message

Requirements:
    - Git CLI
    - GitHub CLI (gh)
    - GitHub authentication

Examples:
    $0                    # Setup current repository
    $0 --dry-run          # Show what would be done
    $0 --verbose          # Enable detailed logging
EOF
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if git is installed
    if ! command_exists git; then
        log_error "Git is not installed. Please install Git CLI."
        exit 1
    fi
    
    # Check if gh is installed
    if ! command_exists gh; then
        log_error "GitHub CLI (gh) is not installed. Please install from https://cli.github.com"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        log_error "Not inside a git repository. Please run this script from a git repository."
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

# Check GitHub authentication
check_gh_auth() {
    log_info "Checking GitHub authentication..."
    
    if ! gh auth status >/dev/null 2>&1; then
        log_error "GitHub authentication required. Please run 'gh auth login' first."
        log_info "You may also need to set up a GitHub token:"
        log_info "  gh auth login --web"
        exit 1
    fi
    
    if $VERBOSE; then
        gh auth status --show-token 2>/dev/null || true
    fi
    
    log_success "GitHub authentication verified"
}

# Get repository information from git remote
get_repo_info() {
    log_info "Detecting repository information..."
    
    # Try to get remote URL from origin
    if ! git remote get-url origin >/dev/null 2>&1; then
        log_error "Could not get remote URL from 'origin'. Please ensure this is a GitHub repository."
        exit 1
    fi
    
    REMOTE_URL=$(git remote get-url origin)
    log_info "Remote URL: $REMOTE_URL"
    
    # Extract owner and repo from URL
    # Handle different URL formats:
    # - https://github.com/owner/repo.git
    # - git@github.com:owner/repo.git
    if [[ $REMOTE_URL =~ ^https://github\.com/([^/]+)/([^/]+)(\.git)?$ ]]; then
        REPO_OWNER="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]%.git}"
    elif [[ $REMOTE_URL =~ ^git@github\.com:([^/]+)/([^/]+)(\.git)?$ ]]; then
        REPO_OWNER="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]%.git}"
    else
        log_error "Could not parse repository URL. Expected format: https://github.com/owner/repo.git or git@github.com:owner/repo.git"
        log_error "Got: $REMOTE_URL"
        exit 1
    fi
    
    REPO_FULL_NAME="$REPO_OWNER/$REPO_NAME"
    log_success "Repository detected: $REPO_FULL_NAME"
}

# Check if branch exists
branch_exists() {
    local branch_name="$1"
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would check if branch '$branch_name' exists"
        return 0
    fi
    
    if git show-ref --verify --quiet refs/heads/"$branch_name"; then
        log_info "Branch '$branch_name' exists locally"
        return 0
    fi
    
    # Check remote
    if git ls-remote --exit-code --heads origin "$branch_name" >/dev/null 2>&1; then
        log_info "Branch '$branch_name' exists on remote"
        return 0
    fi
    
    log_info "Branch '$branch_name' does not exist"
    return 1
}

# Create release branch if it doesn't exist
create_release_branch() {
    log_info "Setting up release branch..."
    
    if branch_exists "$RELEASE_BRANCH"; then
        log_success "Release branch '$RELEASE_BRANCH' already exists"
        return 0
    fi
    
    log_info "Creating release branch '$RELEASE_BRANCH'..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would create release branch:"
        log_info "  git fetch origin $DEFAULT_BRANCH"
        log_info "  git checkout -b $RELEASE_BRANCH origin/$DEFAULT_BRANCH"
        log_info "  git push -u origin $RELEASE_BRANCH"
        return 0
    fi
    
    # Fetch the default branch
    if ! git fetch origin "$DEFAULT_BRANCH"; then
        log_error "Failed to fetch branch 'origin/$DEFAULT_BRANCH'"
        exit 1
    fi
    
    # Create and push release branch
    if ! git checkout -b "$RELEASE_BRANCH" "origin/$DEFAULT_BRANCH"; then
        log_error "Failed to create release branch"
        exit 1
    fi
    
    if ! git push -u origin "$RELEASE_BRANCH"; then
        log_error "Failed to push release branch to remote"
        exit 1
    fi
    
    log_success "Release branch '$RELEASE_BRANCH' created successfully"
}

# Set default branch
set_default_branch() {
    log_info "Setting default branch to '$DEFAULT_BRANCH'..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would set default branch to '$DEFAULT_BRANCH'"
        return 0
    fi
    
    if ! gh repo edit --default-branch "$DEFAULT_BRANCH"; then
        log_error "Failed to set default branch to '$DEFAULT_BRANCH'"
        exit 1
    fi
    
    log_success "Default branch set to '$DEFAULT_BRANCH'"
}

# Configure branch protection
configure_branch_protection() {
    local branch_name="$1"
    local protection_config="$2"
    local is_main_branch="$3"
    
    log_info "Configuring protection for branch '$branch_name'..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would configure protection for branch '$branch_name'"
        return 0
    fi
    
    # Check if branch exists on remote
    if ! git ls-remote --exit-code --heads origin "$branch_name" >/dev/null 2>&1; then
        log_warning "Branch '$branch_name' does not exist on remote. Skipping protection setup."
        return 1
    fi
    
    # Configure branch protection
    if ! echo "$protection_config" | gh api "repos/$REPO_FULL_NAME/branches/$branch_name/protection" --input /dev/stdin; then
        log_error "Failed to configure protection for branch '$branch_name'"
        exit 1
    fi
    
    log_success "Protection configured for branch '$branch_name'"
}

# Configure repository settings
configure_repo_settings() {
    log_info "Configuring repository settings..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would configure repository settings:"
        log_info "  --allow-auto-merge"
        log_info "  --allow-squash-merge"
        log_info "  --allow-merge-commit"
        log_info "  --allow-rebase-merge"
        log_info "  --delete-branch-on-merge"
        return 0
    fi
    
    if ! gh repo edit \
        --allow-auto-merge \
        --allow-squash-merge \
        --allow-merge-commit \
        --allow-rebase-merge \
        --delete-branch-on-merge; then
        log_error "Failed to configure repository settings"
        exit 1
    fi
    
    log_success "Repository settings configured"
}

# Main branch protection configuration
MAIN_PROTECTION_CONFIG='{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint TypeScript",
      "Lint Python",
      "Test TypeScript",
      "Test Python"
    ]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "enforce_admins": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}'

# Release branch protection configuration
RELEASE_PROTECTION_CONFIG='{
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "enforce_admins": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}'

# Main execution
main() {
    log_info "Starting GitHub repository setup..."
    
    # Parse arguments
    parse_args "$@"
    
    # Validate prerequisites
    validate_prerequisites
    
    # Check authentication
    check_gh_auth
    
    # Get repository info
    get_repo_info
    
    # Setup steps
    set_default_branch
    create_release_branch
    configure_branch_protection "$DEFAULT_BRANCH" "$MAIN_PROTECTION_CONFIG" true
    configure_branch_protection "$RELEASE_BRANCH" "$RELEASE_PROTECTION_CONFIG" false
    configure_repo_settings
    
    log_success "GitHub repository setup completed successfully!"
    log_info "Repository: $REPO_FULL_NAME"
    log_info "Default branch: $DEFAULT_BRANCH"
    log_info "Release branch: $RELEASE_BRANCH"
}

# Run main function with all arguments
main "$@"