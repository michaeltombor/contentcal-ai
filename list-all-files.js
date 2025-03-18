#!/usr/bin/env node
// Ultra-simple file lister - guaranteed to list all files

import * as fs from 'fs';
import { execSync } from 'child_process';

console.log("Starting file listing process...");

try {
  // Run the find command and output directly to file
  console.log("Running find command...");
  execSync('find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" > all-files.txt');
  console.log("Find command completed");

  // Read the output
  const fileList = fs.readFileSync('all-files.txt', 'utf8');

  // Create output directory
  if (!fs.existsSync('chat-context')) {
    fs.mkdirSync('chat-context', { recursive: true });
  }

  // Create a minimal context file with JUST the file listing
  fs.writeFileSync('chat-context/FILES_LIST.md',
    `# ContentCal.AI Complete File Listing\n\n\`\`\`\n${fileList}\n\`\`\``);

  console.log("✅ Complete file list created at: chat-context/FILES_LIST.md");
  console.log(`Found ${fileList.split('\n').length} files`);
} catch (error) {
  console.error("Error:", error.message);

  // Fallback to pure JavaScript
  console.log("Trying JavaScript fallback...");

  // Recursive function to list all files
  const getAllFiles = function (dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        // Skip node_modules and .git
        if (file !== 'node_modules' && file !== '.git' && file !== '.svelte-kit') {
          arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        }
      } else {
        arrayOfFiles.push(dirPath + "/" + file);
      }
    });

    return arrayOfFiles;
  };

  try {
    const allFiles = getAllFiles('.');

    if (!fs.existsSync('chat-context')) {
      fs.mkdirSync('chat-context', { recursive: true });
    }

    fs.writeFileSync('chat-context/FILES_LIST.md',
      `# ContentCal.AI Complete File Listing\n\n\`\`\`\n${allFiles.join('\n')}\n\`\`\``);

    console.log("✅ Complete file list created using JavaScript fallback");
    console.log(`Found ${allFiles.length} files`);
  } catch (jsError) {
    console.error("JavaScript fallback also failed:", jsError.message);
  }
}