#!/usr/bin/env node
// Enhanced file lister that also analyzes component relationships

import * as fs from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';

console.log("Starting file listing and component analysis process...");

// Store component relationships
const componentRelationships = {
  imports: {},
  usage: {}
};

// Function to analyze a Svelte component file
function analyzeSvelteComponent(filePath, fileContent) {
  // Initialize component in our tracking
  const componentName = path.basename(filePath);
  if (!componentRelationships.imports[componentName]) {
    componentRelationships.imports[componentName] = [];
  }

  // Track components this component imports
  const importMatches = fileContent.match(/import\s+(\w+)\s+from\s+['"](.+?)['"];?/g) || [];

  importMatches.forEach(match => {
    const importMatch = match.match(/import\s+(\w+)\s+from\s+['"](.+?)['"];?/);
    if (importMatch) {
      const importedComponent = importMatch[1];
      const importPath = importMatch[2];

      // Only track Svelte component imports
      if (importPath.includes('.svelte') ||
        importedComponent.endsWith('Modal') ||
        importedComponent.endsWith('View') ||
        importedComponent.endsWith('Card')) {

        componentRelationships.imports[componentName].push({
          component: importedComponent,
          path: importPath
        });

        // Track which components use this imported component
        if (!componentRelationships.usage[importedComponent]) {
          componentRelationships.usage[importedComponent] = [];
        }
        componentRelationships.usage[importedComponent].push(componentName);
      }
    }
  });

  // Look for script imports
  const scriptTagContent = fileContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (scriptTagContent && scriptTagContent[1]) {
    const scriptImports = scriptTagContent[1].match(/import\s+(\w+|\{[^}]+\})\s+from\s+['"](.+?)['"];?/g) || [];

    scriptImports.forEach(match => {
      const importMatch = match.match(/import\s+(\w+|\{[^}]+\})\s+from\s+['"](.+?)['"];?/);
      if (importMatch) {
        let importedComponent = importMatch[1];
        const importPath = importMatch[2];

        // Handle destructured imports
        if (importedComponent.startsWith('{') && importedComponent.endsWith('}')) {
          importedComponent = importedComponent.slice(1, -1).trim();

          // Split multiple imports
          const components = importedComponent.split(',').map(c => c.trim());

          components.forEach(comp => {
            if (comp.endsWith('Modal') || comp.endsWith('View') || comp.endsWith('Card')) {
              componentRelationships.imports[componentName].push({
                component: comp,
                path: importPath
              });

              if (!componentRelationships.usage[comp]) {
                componentRelationships.usage[comp] = [];
              }
              componentRelationships.usage[comp].push(componentName);
            }
          });
        }
      }
    });
  }

  // Look for component usage in the template
  const templateMatches = fileContent.match(/<([\w]+)[\s>]/g) || [];
  templateMatches.forEach(match => {
    const tagMatch = match.match(/<([\w]+)[\s>]/);
    if (tagMatch) {
      const usedComponent = tagMatch[1];

      // Only consider PascalCase component names as custom components
      if (/^[A-Z]/.test(usedComponent)) {
        if (!componentRelationships.usage[usedComponent]) {
          componentRelationships.usage[usedComponent] = [];
        }
        if (!componentRelationships.usage[usedComponent].includes(componentName)) {
          componentRelationships.usage[usedComponent].push(componentName);
        }
      }
    }
  });
}

// Store all files
const allFiles = [];

// Function to walk directories and analyze components
function walkDirAndAnalyze(dir) {
  if (dir.includes('node_modules') ||
    dir.includes('.git') ||
    dir.includes('.svelte-kit') ||
    dir.includes('build')) {
    return;
  }

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDirAndAnalyze(filePath); // Recursively walk directories
      } else {
        allFiles.push(filePath); // Add file to list

        // Analyze Svelte components
        if (filePath.endsWith('.svelte')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            analyzeSvelteComponent(filePath, content);
          } catch (readErr) {
            console.error(`Error reading Svelte file ${filePath}:`, readErr.message);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
}

// Start scanning from current directory
console.log("Starting file scan and component analysis...");
walkDirAndAnalyze('.');
console.log(`Found ${allFiles.length} files`);

// Generate a component relationship section
function generateComponentRelationshipSection() {
  let result = `## Component Relationships

### Calendar Component and Related UI Components

\`\`\`
`;

  // Check for calendar relationships
  const calendarComponents = allFiles.filter(file =>
    file.includes('calendar') && file.endsWith('.svelte')
  );

  // Generate calendar component relationships
  calendarComponents.forEach(component => {
    const componentName = path.basename(component);
    result += `${componentName}\n`;

    // Find imports
    const imports = componentRelationships.imports[componentName] || [];
    if (imports.length > 0) {
      result += `  ├── Imports:\n`;
      imports.forEach(imp => {
        result += `  │   └── ${imp.component} (from ${imp.path})\n`;
      });
    }

    // Find usage
    const usage = Object.entries(componentRelationships.usage)
      .filter(([_, users]) => users.includes(componentName))
      .map(([comp, _]) => comp);

    if (usage.length > 0) {
      result += `  └── Used by:\n`;
      usage.forEach(comp => {
        result += `      └── ${comp}\n`;
      });
    }

    result += `\n`;
  });

  // Add specific information about PostCreateModal if available
  if (allFiles.some(file => file.includes('PostCreateModal.svelte'))) {
    result += `### PostCreateModal.svelte Relationships

This modal is used for creating and editing posts in the calendar view. It:
- Is opened from the Calendar.svelte component or related calendar views
- Contains form fields for post content, platform selection, and scheduling
- Uses platform-specific components for previews
- May use rich text editors or markdown components for post content
- Communicates with the post service to save/update post data
- Calls Firebase functions for AI suggestions when needed

\`\`\`
`;

    const postModalPath = allFiles.find(file => file.includes('PostCreateModal.svelte'));
    if (postModalPath) {
      const componentName = path.basename(postModalPath);

      // Find imports
      const imports = componentRelationships.imports[componentName] || [];
      if (imports.length > 0) {
        result += `${componentName} imports:\n`;
        imports.forEach(imp => {
          result += `  └── ${imp.component} (from ${imp.path})\n`;
        });
      }

      // Find usage
      const usage = Object.entries(componentRelationships.usage)
        .filter(([_, users]) => users.includes(componentName))
        .map(([comp, _]) => comp);

      if (usage.length > 0) {
        result += `\n${componentName} is used by:\n`;
        usage.forEach(comp => {
          result += `  └── ${comp}\n`;
        });
      }
    }

    result += `\`\`\`

### Page Components and Flow

SvelteKit uses a file-based routing system where:
- \`+page.svelte\` defines the page content
- \`+layout.svelte\` defines the layout wrapper
- \`+page.server.js\` handles server-side logic
- \`+layout.server.js\` handles layout server logic

Calendar flow:
1. User navigates to /calendar route
2. Calendar layout loads with navigation
3. Calendar view shows scheduled posts
4. Clicking "Create Post" opens PostCreateModal
5. Submitting form saves post to Firebase
6. Calendar refreshes with the new post
`;
  }

  return result;
}

// Make sure output directory exists
if (!fs.existsSync('chat-context')) {
  fs.mkdirSync('chat-context', { recursive: true });
}

// Create component relationship section
const componentSection = generateComponentRelationshipSection();

// Save the raw file list with component relationships
fs.writeFileSync('chat-context/RAW_FILES.md',
  `# ContentCal.AI Complete File List

## All Project Files
\`\`\`
${allFiles.join('\n')}
\`\`\`

${componentSection}

## Git Information
\`\`\`
${execSync('git status 2>/dev/null || echo "Git status not available"').toString()}
\`\`\`
`);

console.log("✅ Enhanced file list with component relationships created at: chat-context/RAW_FILES.md");