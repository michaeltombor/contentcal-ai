#!/usr/bin/env node
/**
 * ContentCal.AI Project Status Generator
 * 
 * This script analyzes your project and generates a comprehensive 
 * markdown file with the current status.
 * 
 * Usage:
 *   npx ts-node project-status.ts
 * 
 * Features:
 *   - Lists recent Git commits
 *   - Summarizes project structure
 *   - Extracts TODOs and FIXMEs from code
 *   - Provides dependency information
 *   - Tracks implementation progress
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as glob from 'glob';

// Configuration
const config = {
    projectName: 'ContentCal.AI',
    outputFile: 'PROJECT_STATUS.md',
    recentCommitsCount: 10,
    todoPatterns: [/TODO:?\s*(.*)/gi, /FIXME:?\s*(.*)/gi],
    excludeDirs: ['node_modules', '.git', 'dist', 'build', '.svelte-kit'],
    keyFiles: [
        'package.json',
        'tsconfig.json',
        'svelte.config.js',
        'src/routes/+layout.svelte',
        'src/lib/firebase.ts'
    ]
};

/**
 * Main function to generate the project status
 */
async function generateProjectStatus() {
    try {
        const date = new Date().toISOString().split('T')[0];
        let content = `# ${config.projectName} Project Status\n\n`;
        content += `**Generated:** ${new Date().toLocaleString()}\n\n`;

        // Project Overview
        content += `## Project Overview\n`;
        content += await getProjectOverview();
        content += '\n\n';

        // Recent Git Activity
        content += `## Recent Git Activity\n`;
        content += getRecentCommits();
        content += '\n\n';

        // Project Structure
        content += `## Project Structure\n`;
        content += getProjectStructure();
        content += '\n\n';

        // Implementation Progress
        content += `## Implementation Progress\n`;
        content += getImplementationProgress();
        content += '\n\n';

        // TODOs and Issues
        content += `## TODOs and Issues\n`;
        content += await findTodosAndIssues();
        content += '\n\n';

        // Dependencies
        content += `## Dependencies\n`;
        content += getDependencies();
        content += '\n\n';

        // Write to file
        fs.writeFileSync(config.outputFile, content);
        console.log(`✅ Project status generated at ${config.outputFile}`);
    } catch (error) {
        console.error('Error generating project status:', error);
    }
}

/**
 * Get basic project overview
 */
async function getProjectOverview(): Promise<string> {
    let overview = '';

    try {
        // Package info
        if (fs.existsSync('package.json')) {
            const pkgData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            overview += `- **Name:** ${pkgData.name}\n`;
            overview += `- **Version:** ${pkgData.version}\n`;
            overview += `- **Description:** ${pkgData.description || 'No description'}\n`;
        }

        // GitHub info
        try {
            const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
            overview += `- **Repository:** ${remoteUrl}\n`;
        } catch (error) {
            overview += `- **Repository:** Not configured\n`;
        }

        // Branch info
        try {
            const branch = execSync('git branch --show-current').toString().trim();
            overview += `- **Current Branch:** ${branch}\n`;
        } catch (error) {
            overview += `- **Current Branch:** Unknown\n`;
        }

        // File counts
        const fileStats = getFileStats();
        overview += `- **Files:** ${fileStats.total} total (${fileStats.svelte} Svelte, ${fileStats.typescript} TypeScript, ${fileStats.javascript} JavaScript)\n`;

    } catch (error) {
        overview += `Error gathering project overview: ${error}\n`;
    }

    return overview;
}

/**
 * Get information about recent commits
 */
function getRecentCommits(): string {
    try {
        const gitLog = execSync(
            `git log -n ${config.recentCommitsCount} --pretty=format:"%h|%an|%ad|%s" --date=short`
        ).toString();

        const commits = gitLog.split('\n').map(line => {
            const [hash, author, date, message] = line.split('|');
            return { hash, author, date, message };
        });

        let result = '';
        result += '### Recent Commits\n\n';
        result += '| Date | Author | Commit | Message |\n';
        result += '|------|--------|--------|--------|\n';

        commits.forEach(commit => {
            result += `| ${commit.date} | ${commit.author} | ${commit.hash} | ${commit.message} |\n`;
        });

        // Add some file change statistics
        try {
            const stats = execSync('git diff --stat HEAD~10 HEAD').toString();
            result += '\n### File Changes (Last 10 Commits)\n\n';
            result += '```\n' + stats + '\n```\n';
        } catch (error) {
            // Repository might be new with fewer than 10 commits
            result += '\n*File change statistics not available*\n';
        }

        return result;
    } catch (error) {
        return `Error retrieving git commits: ${error}\n`;
    }
}

/**
 * Get project structure information
 */
function getProjectStructure(): string {
    try {
        // Use tree command if available, otherwise use custom solution
        try {
            const excludeParams = config.excludeDirs.map(dir => `-I "${dir}"`).join(' ');
            const tree = execSync(`tree -L 3 ${excludeParams} --dirsfirst`).toString();
            return '```\n' + tree + '\n```\n';
        } catch (error) {
            // Fallback to listing directories
            const basePath = process.cwd();
            let result = 'Key directories:\n\n';

            // Get top-level directories
            const items = fs.readdirSync(basePath, { withFileTypes: true });
            const dirs = items
                .filter(item => item.isDirectory() && !config.excludeDirs.includes(item.name))
                .map(item => item.name);

            dirs.forEach(dir => {
                result += `- **/${dir}/**\n`;
                try {
                    const subItems = fs.readdirSync(path.join(basePath, dir), { withFileTypes: true });
                    const subDirs = subItems
                        .filter(item => item.isDirectory())
                        .map(item => item.name);

                    subDirs.forEach(subDir => {
                        result += `  - **/${dir}/${subDir}/**\n`;
                    });
                } catch (error) {
                    // Skip if can't read subdirectory
                }
            });

            // Key files
            result += '\nKey Files:\n\n';
            config.keyFiles.forEach(file => {
                if (fs.existsSync(path.join(basePath, file))) {
                    result += `- **${file}**\n`;
                }
            });

            return result;
        }
    } catch (error) {
        return `Error retrieving project structure: ${error}\n`;
    }
}

/**
 * Get implementation progress
 */
function getImplementationProgress(): string {
    let result = '';

    // Check for specific implemented features
    const features = [
        { name: 'Authentication', files: ['src/lib/auth', 'src/routes/login', 'src/routes/register'], required: 1 },
        { name: 'Firebase Integration', files: ['src/lib/firebase.ts', 'firebase.json'], required: 1 },
        { name: 'Content Calendar', files: ['src/routes/calendar'], required: 1 },
        { name: 'Social Media Integration', files: ['src/lib/social', 'src/lib/twitter', 'src/lib/instagram'], required: 1 },
        { name: 'User Settings', files: ['src/routes/settings'], required: 1 },
        { name: 'Analytics', files: ['src/routes/analytics', 'src/lib/analytics'], required: 1 },
        { name: 'AI Content Generation', files: ['src/lib/ai', 'functions/src/ai'], required: 1 }
    ];

    result += '| Feature | Status | Implementation |\n';
    result += '|---------|--------|----------------|\n';

    features.forEach(feature => {
        const implemented = feature.files.filter(file => {
            return glob.sync(file).length > 0;
        }).length >= feature.required;

        result += `| ${feature.name} | ${implemented ? '✅ Implemented' : '⏳ In Progress'} | ${feature.files.join(', ')} |\n`;
    });

    return result;
}

/**
 * Find TODOs and issues in the codebase
 */
async function findTodosAndIssues(): Promise<string> {
    try {
        let result = '';
        const todos: { file: string, line: number, text: string }[] = [];

        // Use grep if available, otherwise fall back to custom search
        try {
            const grepCmd = 'grep -r "TODO\\|FIXME" --include="*.ts" --include="*.js" --include="*.svelte" . | grep -v "node_modules"';
            const grepResult = execSync(grepCmd).toString();

            grepResult.split('\n').filter(Boolean).forEach(line => {
                const match = line.match(/(.*):(\d+):(.*TODO|FIXME):(.*)/);
                if (match) {
                    todos.push({
                        file: match[1],
                        line: parseInt(match[2]),
                        text: match[4].trim()
                    });
                }
            });
        } catch (error) {
            // Grep may not be available or no TODOs found
            // Fall back to manual search for key files
            const fileTypes = ['.ts', '.js', '.svelte', '.json'];
            const filesToSearch: string[] = [];

            const basePath = process.cwd();
            function searchDir(dir: string) {
                try {
                    const entries = fs.readdirSync(path.join(basePath, dir), { withFileTypes: true });

                    for (const entry of entries) {
                        const entryPath = path.join(dir, entry.name);

                        if (entry.isDirectory() && !config.excludeDirs.includes(entry.name)) {
                            searchDir(entryPath);
                        } else if (entry.isFile() && fileTypes.some(ext => entry.name.endsWith(ext))) {
                            filesToSearch.push(entryPath);
                        }
                    }
                } catch (error) {
                    // Skip directories we can't read
                }
            }

            // Start the search from current directory
            searchDir('.');

            // Search files for TODOs and FIXMEs
            for (const file of filesToSearch) {
                try {
                    const content = fs.readFileSync(path.join(basePath, file), 'utf8');
                    const lines = content.split('\n');

                    lines.forEach((line, index) => {
                        for (const pattern of config.todoPatterns) {
                            const match = pattern.exec(line);
                            if (match) {
                                todos.push({
                                    file,
                                    line: index + 1,
                                    text: match[1] || 'No description'
                                });
                            }
                            // Reset regex for next iteration
                            pattern.lastIndex = 0;
                        }
                    });
                } catch (error) {
                    // Skip files we can't read
                }
            }
        }

        // Format TODOs
        result += `### TODOs (${todos.length})\n\n`;

        if (todos.length === 0) {
            result += '*No TODOs found in the codebase*\n';
        } else {
            result += '| File | Line | Description |\n';
            result += '|------|------|-------------|\n';

            todos.forEach(todo => {
                result += `| ${todo.file} | ${todo.line} | ${todo.text} |\n`;
            });
        }

        return result;
    } catch (error) {
        return `Error finding TODOs: ${error}\n`;
    }
}

/**
 * Get dependency information
 */
function getDependencies(): string {
    try {
        if (!fs.existsSync('package.json')) {
            return '*No package.json found*\n';
        }

        const pkgData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const deps = { ...pkgData.dependencies } || {};
        const devDeps = { ...pkgData.devDependencies } || {};

        let result = '';

        // Core dependencies
        result += '### Core Dependencies\n\n';

        const keyDeps = [
            'svelte', '@sveltejs/kit', 'firebase', 'firebase-admin',
            'tailwindcss', 'typescript', 'firebase-functions'
        ];

        result += '| Package | Version |\n';
        result += '|---------|--------|\n';

        keyDeps.forEach(dep => {
            if (deps[dep]) {
                result += `| ${dep} | ${deps[dep]} |\n`;
            } else if (devDeps[dep]) {
                result += `| ${dep} (dev) | ${devDeps[dep]} |\n`;
            }
        });

        // Count remaining dependencies
        const remainingDeps = Object.keys(deps).filter(dep => !keyDeps.includes(dep));
        const remainingDevDeps = Object.keys(devDeps).filter(dep => !keyDeps.includes(dep));

        result += `\n*Plus ${remainingDeps.length} additional dependencies and ${remainingDevDeps.length} dev dependencies*\n`;

        return result;
    } catch (error) {
        return `Error retrieving dependencies: ${error}\n`;
    }
}

/**
 * Get file statistics
 */
function getFileStats() {
    const stats = {
        total: 0,
        svelte: 0,
        typescript: 0,
        javascript: 0
    };

    function countFiles(dir: string) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory() && !config.excludeDirs.includes(entry.name)) {
                    countFiles(fullPath);
                } else if (entry.isFile()) {
                    stats.total++;

                    if (entry.name.endsWith('.svelte')) {
                        stats.svelte++;
                    } else if (entry.name.endsWith('.ts')) {
                        stats.typescript++;
                    } else if (entry.name.endsWith('.js')) {
                        stats.javascript++;
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    countFiles('.');
    return stats;
}

// Run the generator
generateProjectStatus();

// Export functions for testing
export {
    generateProjectStatus,
    getProjectOverview,
    getRecentCommits,
    getProjectStructure,
    getImplementationProgress,
    findTodosAndIssues,
    getDependencies
};