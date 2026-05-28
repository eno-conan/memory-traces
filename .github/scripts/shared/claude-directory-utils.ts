/**
 * Shared utilities for reading and analyzing .claude directory
 * Used by both GitHub Actions workflow and Interactive Skills
 */

import { promises as fs } from 'fs';
import path from 'path';
import type {
  ClaudeDirectoryContent,
  RepositoryContext,
} from '../../../types/changelog-monitor';

/**
 * Read all markdown files in a directory with optional truncation
 */
export async function readFilesInDirectory(
  dirPath: string,
  options: { maxLines: number }
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = path.join(dirPath, entry.name);
        const content = await fs.readFile(filePath, 'utf-8');

        // Apply truncation if needed
        const lines = content.split('\n');
        const truncated = options.maxLines < Infinity
          ? lines.slice(0, options.maxLines).join('\n')
          : content;

        files[entry.name] = truncated;
      }
    }
  } catch (error) {
    console.warn(`⚠️  Failed to read directory ${dirPath}:`, error);
    // Return empty object, don't fail the entire operation
  }

  return files;
}

/**
 * Read and organize .claude directory contents for analysis
 */
export async function readClaudeDirectory(): Promise<ClaudeDirectoryContent> {
  const emptyContent: ClaudeDirectoryContent = {
    settings: '{}',
    agents: {},
    rules: {},
    commands: {},
    skills: {},
  };

  try {
    const baseDir = path.join(process.cwd(), '.claude');

    // Check if .claude directory exists
    try {
      await fs.access(baseDir);
    } catch {
      console.warn('⚠️  .claude directory not found, using empty content');
      return emptyContent;
    }

    console.log('📂 Reading .claude directory contents...');

    // Read each section with individual error handling
    const [settings, agents, rules, commands, skills] = await Promise.allSettled([
      fs.readFile(path.join(baseDir, 'settings.json'), 'utf-8').catch(() => '{}'),
      readFilesInDirectory(path.join(baseDir, 'agents'), { maxLines: Infinity }),
      readFilesInDirectory(path.join(baseDir, 'rules'), { maxLines: Infinity }),
      readFilesInDirectory(path.join(baseDir, 'commands/kiro'), { maxLines: 200 }),
      readFilesInDirectory(path.join(baseDir, 'skills'), { maxLines: 100 }),
    ]);

    const result = {
      settings: settings.status === 'fulfilled' ? settings.value : '{}',
      agents: agents.status === 'fulfilled' ? agents.value : {},
      rules: rules.status === 'fulfilled' ? rules.value : {},
      commands: commands.status === 'fulfilled' ? commands.value : {},
      skills: skills.status === 'fulfilled' ? skills.value : {},
    };

    // Log summary
    console.log(`  ├─ Settings: ${result.settings.length} bytes`);
    console.log(`  ├─ Agents: ${Object.keys(result.agents).length} files`);
    console.log(`  ├─ Rules: ${Object.keys(result.rules).length} files`);
    console.log(`  ├─ Commands: ${Object.keys(result.commands).length} files`);
    console.log(`  └─ Skills: ${Object.keys(result.skills).length} files`);

    return result;
  } catch (error) {
    console.error('❌ Failed to read .claude directory:', error);
    return emptyContent;
  }
}

/**
 * Build repository context from package.json and .claude directory
 */
export async function buildRepositoryContext(): Promise<RepositoryContext> {
  console.log('🔍 Building repository context...');

  const emptyContext: RepositoryContext = {
    projectType: 'Unknown',
    framework: 'Unknown',
    techStack: {
      frontend: [],
      backend: [],
      testing: [],
      infrastructure: [],
    },
    claudeCodeFeatures: {
      enabledPlugins: [],
      configuredAgents: [],
      definedRules: [],
      availableSkills: [],
    },
  };

  try {
    // Read package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // Determine project type and framework
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    let framework = 'Unknown';
    let projectType = 'Unknown';

    if (deps.next) {
      framework = 'next';
      projectType = 'Next.js Application';
    } else if (deps.react && !deps.next) {
      framework = 'react';
      projectType = 'React Application';
    }

    // Categorize dependencies into tech stack
    const frontendLibs = ['react', 'react-dom', 'next', '@aws-amplify/ui-react', 'aws-amplify'];
    const backendLibs = ['@aws-sdk/client-lambda', '@aws-sdk/client-s3', '@aws-amplify/adapter-nextjs'];
    const testingLibs = ['vitest', 'playwright', '@storybook/react', '@vitest/browser-playwright'];
    const infraLibs = ['aws-cdk-lib', 'wrangler', 'terraform'];

    const techStack = {
      frontend: Object.keys(deps).filter(dep => frontendLibs.some(lib => dep.includes(lib))),
      backend: Object.keys(deps).filter(dep => backendLibs.some(lib => dep.includes(lib))),
      testing: Object.keys(deps).filter(dep => testingLibs.some(lib => dep.includes(lib))),
      infrastructure: Object.keys(deps).filter(dep => infraLibs.some(lib => dep.includes(lib))),
    };

    // Read .claude/settings.json for enabled plugins
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
    let enabledPlugins: string[] = [];

    try {
      const settingsContent = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsContent);
      if (settings.enabledPlugins) {
        enabledPlugins = Object.entries(settings.enabledPlugins)
          .filter(([, enabled]) => enabled === true)
          .map(([plugin]) => plugin);
      }
    } catch (error) {
      console.warn('⚠️  Failed to read .claude/settings.json:', error);
    }

    // Read .claude directory structure
    const claudeBaseDir = path.join(process.cwd(), '.claude');
    const configuredAgents: string[] = [];
    const definedRules: string[] = [];
    const availableSkills: string[] = [];

    try {
      const agentsDir = path.join(claudeBaseDir, 'agents');
      const agentFiles = await fs.readdir(agentsDir);
      configuredAgents.push(...agentFiles.filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
    } catch {
      // Directory doesn't exist or is empty
    }

    try {
      const rulesDir = path.join(claudeBaseDir, 'rules');
      const ruleFiles = await fs.readdir(rulesDir);
      definedRules.push(...ruleFiles.filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
    } catch {
      // Directory doesn't exist or is empty
    }

    try {
      const skillsDir = path.join(claudeBaseDir, 'skills');
      const skillFiles = await fs.readdir(skillsDir);
      availableSkills.push(...skillFiles.filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
    } catch {
      // Directory doesn't exist or is empty
    }

    const context: RepositoryContext = {
      projectType,
      framework,
      techStack,
      claudeCodeFeatures: {
        enabledPlugins,
        configuredAgents,
        definedRules,
        availableSkills,
      },
    };

    console.log('  ├─ Project Type:', context.projectType);
    console.log('  ├─ Framework:', context.framework);
    console.log('  ├─ Frontend:', context.techStack.frontend.length, 'libraries');
    console.log('  ├─ Backend:', context.techStack.backend.length, 'libraries');
    console.log('  ├─ Testing:', context.techStack.testing.length, 'libraries');
    console.log('  ├─ Infrastructure:', context.techStack.infrastructure.length, 'libraries');
    console.log('  ├─ Enabled Plugins:', context.claudeCodeFeatures.enabledPlugins.length);
    console.log('  ├─ Configured Agents:', context.claudeCodeFeatures.configuredAgents.length);
    console.log('  ├─ Defined Rules:', context.claudeCodeFeatures.definedRules.length);
    console.log('  └─ Available Skills:', context.claudeCodeFeatures.availableSkills.length);

    return context;
  } catch (error) {
    console.error('❌ Failed to build repository context:', error);
    return emptyContext;
  }
}

/**
 * Format .claude directory contents into structured prompt sections
 * Used for Claude API prompts
 */
export function formatClaudeDirectoryContent(
  content: ClaudeDirectoryContent
): string {
  let formatted = '';

  // Settings
  formatted += '### 🔐 Permissions (settings.json)\n';
  formatted += '```json\n' + content.settings + '\n```\n\n';

  // Agents
  if (Object.keys(content.agents).length > 0) {
    formatted += '### 🤖 Agents\n';
    for (const [filename, fileContent] of Object.entries(content.agents)) {
      formatted += `#### ${filename}\n`;
      formatted += '```markdown\n' + fileContent + '\n```\n\n';
    }
  }

  // Rules (most important - full content)
  if (Object.keys(content.rules).length > 0) {
    formatted += '### 📏 Rules (Critical Security Policies)\n';
    for (const [filename, fileContent] of Object.entries(content.rules)) {
      formatted += `#### ${filename}\n`;
      formatted += '```markdown\n' + fileContent + '\n```\n\n';
    }
  }

  // Commands (truncated summaries)
  if (Object.keys(content.commands).length > 0) {
    formatted += '### ⚙️ Commands (Kiro Spec System)\n';
    for (const [filename, fileContent] of Object.entries(content.commands)) {
      formatted += `#### ${filename} (first 200 lines)\n`;
      formatted += '```markdown\n' + fileContent + '\n```\n\n';
    }
  }

  // Skills (truncated summaries)
  if (Object.keys(content.skills).length > 0) {
    formatted += '### 🔧 Skills (Automation Workflows)\n';
    for (const [filename, fileContent] of Object.entries(content.skills)) {
      formatted += `#### ${filename} (first 100 lines)\n`;
      formatted += '```markdown\n' + fileContent + '\n```\n\n';
    }
  }

  return formatted;
}

/**
 * Format .claude directory snapshot for GitHub Issue body
 */
export function formatDirectorySnapshot(
  content: ClaudeDirectoryContent,
  context: RepositoryContext
): string {
  let formatted = `**プロジェクト構成:**\n`;
  formatted += `- プロジェクトタイプ: ${context.projectType}\n`;
  formatted += `- フレームワーク: ${context.framework}\n`;
  formatted += `- 有効プラグイン: ${context.claudeCodeFeatures.enabledPlugins.join(', ') || 'なし'}\n\n`;

  formatted += `**現在の.claude構成:**\n`;
  formatted += `- Agents: ${Object.keys(content.agents).length}ファイル\n`;
  formatted += `- Rules: ${Object.keys(content.rules).length}ファイル\n`;
  formatted += `- Commands: ${Object.keys(content.commands).length}ファイル\n`;
  formatted += `- Skills: ${Object.keys(content.skills).length}ファイル\n\n`;

  // ファイル一覧（各カテゴリ）
  const categories = [
    { name: 'Agents', files: content.agents },
    { name: 'Rules', files: content.rules },
    { name: 'Skills', files: content.skills },
    { name: 'Commands', files: content.commands },
  ];

  formatted += `**Files:**\n`;
  for (const category of categories) {
    const fileNames = Object.keys(category.files);
    if (fileNames.length > 0) {
      formatted += `\n${category.name}:\n`;
      fileNames.forEach(name => {
        formatted += `- ${name}\n`;
      });
    }
  }

  return formatted;
}
