#!/bin/bash
# prepare-ai-context.sh - Standalone script to prepare context files for AI assistant chat

echo "🔍 Preparing context files for AI assistant chat..."

# Create output directory if it doesn't exist
mkdir -p chat-context

# Generate AI assistant guide
echo "⚙️ Generating AI assistant guide..."
npx ts-node generate-assistant-guide.ts

# Create a simple project status summary if project-status.ts doesn't exist
echo "⚙️ Creating project status summary..."
cat > chat-context/PROJECT_STATUS.md << EOL
# ContentCal.AI Project Status

## Project Overview
ContentCal.AI is a SvelteKit/TypeScript application with Firebase backend for social media management.

## Current Project State
- **GitHub Repository**: https://github.com/michaeltombor/contentcal-ai
- **Last Updated**: $(date "+%Y-%m-%d")

## Git Information
\`\`\`
$(git log -n 5 --pretty=format:"%h - %s (%an, %ar)" --no-merges)
\`\`\`

## File Statistics
\`\`\`
$(find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/.svelte-kit/*" | grep -E '\.(ts|js|svelte)$' | wc -l) TypeScript/JavaScript/Svelte files
$(find . -name "*.svelte" -not -path "*/node_modules/*" -not -path "*/.svelte-kit/*" | wc -l) Svelte components
$(find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.svelte-kit/*" | wc -l) TypeScript files
\`\`\`

## Project Structure
\`\`\`
$(find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/.svelte-kit/*" -maxdepth 3 | sort)
\`\`\`

## Dependencies
\`\`\`
$(grep -A 20 '"dependencies"' package.json)
\`\`\`
EOL

# Copy AI assistant guide to the chat-context directory
cp docs/AI_ASSISTANT_GUIDE.md chat-context/ 2>/dev/null || echo "Warning: AI Assistant Guide not found"

# Create a combined file
echo "⚙️ Creating combined context file..."
cat > chat-context/COMBINED_CONTEXT.md << EOL
# ContentCal.AI Context for AI Assistant

## Table of Contents
- [Recent Changes](#recent-changes)
- [Project Status](#project-status)
- [AI Assistant Guide](#ai-assistant-guide)

## Recent Changes

$(git log -n 5 --pretty=format:"- %s (%ar)" --no-merges)

---

## Project Status
$(cat chat-context/PROJECT_STATUS.md)

---

## AI Assistant Guide
$(cat docs/AI_ASSISTANT_GUIDE.md 2>/dev/null || echo "AI Assistant Guide not available")
EOL

echo "✅ Context files prepared! You can find them in the chat-context directory:"
echo "   - chat-context/PROJECT_STATUS.md"
echo "   - chat-context/AI_ASSISTANT_GUIDE.md (if generated)"
echo "   - chat-context/COMBINED_CONTEXT.md (all-in-one file)"
echo ""
echo "🤖 Upload chat-context/COMBINED_CONTEXT.md when starting a new chat with an AI assistant."