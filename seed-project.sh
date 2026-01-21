#!/usr/bin/env bash

# GitHub Project Seeder
# Creates issues from kanban-items.json and adds them to the GitHub Project

set -e

OWNER="Araon"
REPO="steno"
PROJECT_NUMBER=3

# Check dependencies
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed."
  exit 1
fi

if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is required but not installed."
  exit 1
fi

# Check if kanban-items.json exists
if [ ! -f "kanban-items.json" ]; then
  echo "Error: kanban-items.json not found in current directory."
  exit 1
fi

echo "Creating issues and adding to project..."
echo "Owner: $OWNER"
echo "Repo: $REPO"
echo "Project Number: $PROJECT_NUMBER"
echo "---"

jq -c '.[]' kanban-items.json | while read -r item; do
  TITLE=$(echo "$item" | jq -r '.title')
  BODY=$(echo "$item" | jq -r '.body')
  LABELS=$(echo "$item" | jq -r '.labels | join(",")')

  echo "Creating issue: $TITLE"

  ISSUE_URL=$(gh issue create \
    --repo "$OWNER/$REPO" \
    --title "$TITLE" \
    --body "$BODY" \
    --label "$LABELS")

  echo "  Issue created: $ISSUE_URL"

  gh project item-add "$PROJECT_NUMBER" \
    --owner "$OWNER" \
    --url "$ISSUE_URL"

  echo "  Added to project"
  echo "---"
done

echo "Done! All issues created and added to project."
