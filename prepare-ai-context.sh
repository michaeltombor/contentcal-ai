#!/bin/bash
# prepare-chat.sh - Prepare context files for AI assistant chat

echo "🔍 Preparing context files for AI assistant chat..."

# Create output directory if it doesn't exist
mkdir -p chat-context

# Generate project status file
echo "⚙️ Generating project status..."
npx ts-node project-status.ts

# Generate AI assistant guide
echo "⚙️ Generating AI assistant guide..."
npx ts-node generate-assistant-guide.ts

# Copy files to the chat-context directory
cp PROJECT_STATUS.md chat-context/
cp docs/AI_ASSISTANT_GUIDE.md chat-context/

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
$(cat PROJECT_STATUS.md)

---

## AI Assistant Guide
$(cat docs/AI_ASSISTANT_GUIDE.md)
EOL

echo "✅ Context files prepared! You can find them in the chat-context directory:"
echo "   - chat-context/PROJECT_STATUS.md"
echo "   - chat-context/AI_ASSISTANT_GUIDE.md"
echo "   - chat-context/COMBINED_CONTEXT.md (all-in-one file)"
echo ""
echo "🤖 Upload these files when starting a new chat with an AI assistant."