#!/usr/bin/env tsx

/**
 * Claude Code CHANGELOG Monitor
 *
 * This script monitors the official Claude Code CHANGELOG for updates and creates
 * GitHub Issues with Japanese translations when changes are detected.
 *
 * Behavior (v2.0):
 * - Always creates Issues when new versions are detected
 * - Structured analysis: Informational (always) + Improvements (conditional) + New Features (conditional)
 * - Provides complete audit trail for all updates
 *
 * Security compliance:
 * - Follows .claude/rules/api-error-handling.md
 * - Follows .claude/rules/api-input-validation.md
 * - Follows .claude/rules/lambda-type-safety.md
 */

import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';
import { createTwoFilesPatch } from 'diff';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  ChangelogDiff,
  IssueContent,
  MonitorConfig,
  CategorizationResponse,
  CategorizationStructured,
  WebSearchResult,
  WebArticle,
  GitHubIssueResponse,
  ValidationResult,
} from '../../types/changelog-monitor';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG: MonitorConfig = {
  repoOwner: process.env.GITHUB_REPOSITORY?.split('/')[0] || 'eno-conan',
  repoName: process.env.GITHUB_REPOSITORY?.split('/')[1] || 'learn-auth-nextjs-aws',
  statePath: '.github/data/claude-code-changelog.md',
  changelogUrl: 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md',
  dryRun: process.env.DRY_RUN === 'true',
};

// Validate required environment variables
const REQUIRED_ENV_VARS = ['ANTHROPIC_API_KEY', 'GITHUB_TOKEN'];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: ${envVar} is not set`);
    process.exit(1);
  }
}

// Initialize API clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Get current JST timestamp
 */
function getJSTTimestamp(): string {
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);

  return jstTime.toISOString().replace('T', ' ').split('.')[0] + ' JST';
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Fetch the current CHANGELOG from Claude Code repository
 */
async function fetchChangelog(): Promise<string> {
  console.log('📥 Fetching CHANGELOG from Claude Code repository...');

  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(CONFIG.changelogUrl);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res;
    });

    const content = await response.text();

    if (!content || content.trim().length === 0) {
      throw new Error('CHANGELOG content is empty');
    }

    console.log(`✅ Successfully fetched CHANGELOG (${content.length} bytes)`);
    return content;
  } catch (error) {
    console.error('❌ Failed to fetch CHANGELOG:', error);
    throw new Error('Failed to fetch CHANGELOG from remote repository');
  }
}

/**
 * Load previous CHANGELOG state from file
 */
async function loadPreviousState(): Promise<string> {
  console.log('📂 Loading previous CHANGELOG state...');

  try {
    const fullPath = path.resolve(process.cwd(), CONFIG.statePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    console.log(`✅ Loaded previous state (${content.length} bytes)`);
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('ℹ️  No previous state found (first run)');
      return '';
    }
    console.error('❌ Failed to load previous state:', error);
    throw new Error('Failed to load previous state file');
  }
}

/**
 * Extract version numbers from CHANGELOG content
 */
function extractVersions(content: string): string[] {
  // 角括弧をオプションにして、より多くの形式に対応
  const versionRegex = /^##\s+\[?v?(\d+\.\d+\.\d+(?:-[\w.]+)?)\]?/gm;
  const versions: string[] = [];
  let match;

  while ((match = versionRegex.exec(content)) !== null) {
    versions.push(match[1]);
  }

  // デバッグ用ログ追加
  console.log(`📊 Extracted ${versions.length} versions`);
  if (versions.length > 0) {
    console.log(`   Latest: ${versions[0]}`);
  }

  return versions;
}

/**
 * Detect changes between old and new CHANGELOG content
 */
function detectChanges(oldContent: string, newContent: string): ChangelogDiff {
  console.log('🔍 Detecting changes...');

  // If this is the first run, no changes to report
  if (oldContent === '') {
    console.log('ℹ️  First run detected - no changes to report');
    return {
      hasChanges: false,
      newVersions: [],
      diffText: '',
      newContent,
      oldContent,
    };
  }

  // If content is identical, no changes
  if (oldContent === newContent) {
    console.log('ℹ️  No changes detected');
    return {
      hasChanges: false,
      newVersions: [],
      diffText: '',
      newContent,
      oldContent,
    };
  }

  // Extract versions from both
  const oldVersions = extractVersions(oldContent);
  const newVersions = extractVersions(newContent);

  // Find new versions (present in new but not in old)
  const newVersionsDetected = newVersions.filter(v => !oldVersions.includes(v));

  if (newVersionsDetected.length === 0) {
    console.log('ℹ️  Content changed but no new versions detected');
    return {
      hasChanges: false,
      newVersions: [],
      diffText: '',
      newContent,
      oldContent,
    };
  }

  // Generate diff
  const diffText = createTwoFilesPatch(
    'CHANGELOG.md (previous)',
    'CHANGELOG.md (current)',
    oldContent,
    newContent,
    '',
    '',
    { context: 5 }
  );

  console.log(`✅ Detected ${newVersionsDetected.length} new version(s): ${newVersionsDetected.join(', ')}`);

  return {
    hasChanges: true,
    newVersions: newVersionsDetected,
    diffText,
    newContent,
    oldContent,
  };
}

/**
 * Extract only the added lines from a unified diff text.
 * Removes context lines, deleted lines, and file headers.
 */
function extractAddedLines(diffText: string): string {
  return diffText
    .split('\n')
    .filter(line => line.startsWith('+') && !line.startsWith('+++'))
    .map(line => line.slice(1))
    .join('\n');
}

/**
 * Extract JSON string from Claude API response.
 * Prefers ```json code blocks, falls back to {} brace matching.
 */
function extractJsonFromText(text: string): string | null {
  const codeBlockMatch = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1];
  }
  const braceMatch = text.match(/\{[\s\S]*\}/);
  return braceMatch?.[0] ?? null;
}

/**
 * Empty categorization structure used as fallback on parse failure
 */
const EMPTY_STRUCTURED: CategorizationStructured = {
  bugFixes: { count: 0, items: [] },
  newFeatures: { count: 0, items: [] },
  improvements: { count: 0, items: [] },
};

/**
 * Categorize changelog changes into bug fixes, new features, and improvements
 */
async function categorizeChanges(diffText: string): Promise<CategorizationResponse> {
  console.log('📊 Categorizing changes...');

  try {
    const addedContent = extractAddedLines(diffText);

    const response = await retryWithBackoff(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: `以下のClaude CodeのCHANGELOGの追加内容を分析し、各変更項目を分類してください。

必ず以下のJSON形式のみで回答してください（説明文や追加テキストは不要）:
{
  "bugFixes": { "count": N, "items": ["日本語テキスト..."] },
  "newFeatures": { "count": N, "items": ["日本語テキスト..."] },
  "improvements": { "count": N, "items": ["日本語テキスト..."] }
}

カテゴリの定義:
- bugFixes: バグ修正（不具合の修正）
- newFeatures: 機能追加（新しい機能・コマンド・オプションの追加）
- improvements: 改善・その他（パフォーマンス改善、UI改善、ドキュメント更新など）

各itemsは日本語の箇条書きテキスト（例: "ターミナル出力のカラー表示を修正"）

CHANGELOG追加内容:
${addedContent}`,
          },
        ],
      });
    });

    if (response.content[0].type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const rawText = response.content[0].text;
    console.log(`✅ Categorization completed (${rawText.length} bytes)`);

    // JSON部分を抽出（```json...```ブロックを優先、フォールバックで{}マッチ）
    const jsonText = extractJsonFromText(rawText);
    if (!jsonText) {
      console.warn('⚠️ Could not extract JSON from categorization response, using empty structure');
      return {
        categorizedText: rawText,
        structured: EMPTY_STRUCTURED,
        hasActionableChanges: false,
        success: true,
      };
    }

    let structured: CategorizationStructured;
    try {
      structured = JSON.parse(jsonText) as CategorizationStructured;
    } catch {
      console.warn('⚠️ Failed to parse categorization JSON, using empty structure');
      structured = EMPTY_STRUCTURED;
    }

    const hasActionableChanges =
      structured.newFeatures.count > 0 || structured.improvements.count > 0;

    return {
      categorizedText: rawText,
      structured,
      hasActionableChanges,
      success: true,
    };
  } catch (error) {
    console.error('❌ Categorization failed:', error);
    return {
      categorizedText: '',
      structured: EMPTY_STRUCTURED,
      hasActionableChanges: false,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate syntax correctness of the analysis result
 */
function validateSyntax(analysisText: string): ValidationResult {
  const warnings: string[] = [];

  // 1. Validate JSON code blocks
  const jsonBlocks = analysisText.match(/```json\n([\s\S]*?)\n```/g);
  if (jsonBlocks) {
    jsonBlocks.forEach((block, index) => {
      const json = block.replace(/```json\n/, '').replace(/\n```/, '');
      try {
        JSON.parse(json);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        warnings.push(`JSON code block ${index + 1}が不正: ${errorMessage}`);
      }
    });
  }

  // 2. Validate Markdown heading structure
  const headingMatches = analysisText.match(/^#{1,6} .+$/gm);
  if (headingMatches && headingMatches.length > 1) {
    // Extract heading levels (number of # characters)
    const levels = headingMatches.map(h => h.match(/^#{1,6}/)?.[0].length || 0);

    // Check for invalid level jumps (e.g., ### -> #####)
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        warnings.push(`見出し階層が不正: レベル${levels[i - 1]}からレベル${levels[i]}への飛びがあります`);
        break; // Only report first occurrence
      }
    }
  }

  // 3. Validate code block closures
  const codeBlockOpeners = (analysisText.match(/```[a-z]*\n/g) || []).length;
  const codeBlockClosers = (analysisText.match(/\n```/g) || []).length;
  if (codeBlockOpeners !== codeBlockClosers) {
    warnings.push(`コードブロックが閉じられていません（開始: ${codeBlockOpeners}, 終了: ${codeBlockClosers}）`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

/**
 * Search the web for articles and videos related to new features/improvements
 */
async function searchWebForFeatures(
  versions: string[],
  structured: CategorizationStructured
): Promise<WebSearchResult> {
  console.log('🌐 Searching web for related information...');

  const versionLabel = versions[0] ?? 'latest';
  const featureSummary = [
    ...structured.newFeatures.items.slice(0, 3),
    ...structured.improvements.items.slice(0, 2),
  ].join(', ');

  const EXCLUDED_URL_PATTERNS = [
    'code.claude.com/docs/en/changelog',
    'github.com/anthropics/claude-code/releases',
  ];

  const articles: WebArticle[] = [];

  const runSearch = async (lang: 'ja' | 'en'): Promise<void> => {
    const query =
      lang === 'ja'
        ? `Claude Code ${versionLabel} 新機能 使い方 ${featureSummary.slice(0, 50)}`
        : `Claude Code ${versionLabel} new features tutorial ${featureSummary.slice(0, 50)}`;

    const prompt =
      lang === 'ja'
        ? `Claude Code ${versionLabel}の新機能・改善点（${featureSummary.slice(0, 100)}）について、日本語の情報を検索してください。記事を2件、YouTubeの解説動画を1件見つけてください。`
        : `Search for information about Claude Code ${versionLabel} new features and improvements (${featureSummary.slice(0, 100)}). Find 2 articles and 1 YouTube video in English.`;

    console.log(`   Searching ${lang === 'ja' ? 'Japanese' : 'English'} content for: ${query.slice(0, 60)}...`);

    const response = await anthropic.beta.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      betas: ['web-search-2025-03-05' as any],
      tools: [
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: 'web_search_20250305' as any,
          name: 'web_search',
          max_uses: 3,
        },
      ],
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n見つけた情報を以下のJSON配列形式で返してください（説明不要）:\n[{"title": "タイトル", "url": "URL", "snippet": "短い説明", "isVideo": true/false}]`,
        },
      ],
    });

    // レスポンスからテキストブロックを抽出
    for (const block of response.content) {
      if (block.type !== 'text') continue;

      const jsonMatch = block.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      let parsed: Array<{ title: string; url: string; snippet?: string; isVideo?: boolean }>;
      try {
        parsed = JSON.parse(jsonMatch[0]) as Array<{
          title: string;
          url: string;
          snippet?: string;
          isVideo?: boolean;
        }>;
      } catch {
        continue;
      }

      for (const item of parsed) {
        if (!item.title || !item.url) continue;
        if (EXCLUDED_URL_PATTERNS.some(pattern => item.url.includes(pattern))) continue;
        const isYouTube = item.url.includes('youtube.com/watch') || item.url.includes('youtu.be/');
        articles.push({
          type: isYouTube || item.isVideo ? 'video' : 'article',
          title: item.title,
          url: item.url,
          language: lang,
          snippet: item.snippet,
        });
      }
    }
  };

  try {
    // 日本語・英語を順次実行（rate limit対策）
    await runSearch('ja');
    await runSearch('en');

    console.log(`✅ Web search completed: ${articles.length} items found`);
    return { articles, success: true };
  } catch (error) {
    console.warn('⚠️ Web search failed:', error);
    return {
      articles: [],
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Build Markdown section for web search results
 */
function buildWebInfoSection(
  webSearch: WebSearchResult,
  versions: string[]
): string {
  let section = `### 🌐 関連Web情報\n\n`;

  if (!webSearch.success) {
    section += `> ⚠️ Web情報収集に失敗しました。\n`;
    section += `> 手動で検索してください: "Claude Code ${versions[0] ?? ''} 新機能"\n\n`;
    return section;
  }

  const jaArticles = webSearch.articles.filter((a: WebArticle) => a.language === 'ja');
  const enArticles = webSearch.articles.filter((a: WebArticle) => a.language === 'en');

  if (jaArticles.length === 0 && enArticles.length === 0) {
    section += `> ℹ️ 関連情報が見つかりませんでした。\n\n`;
    return section;
  }

  if (jaArticles.length > 0) {
    section += `#### 🇯🇵 日本語情報\n`;
    for (const article of jaArticles) {
      const icon = article.type === 'video' ? '🎬' : '📄';
      section += `- ${icon} [${article.title}](${article.url})`;
      if (article.snippet) section += ` — ${article.snippet}`;
      section += '\n';
    }
    section += '\n';
  }

  if (enArticles.length > 0) {
    section += `#### 🌍 英語情報\n`;
    for (const article of enArticles) {
      const icon = article.type === 'video' ? '🎬' : '📄';
      section += `- ${icon} [${article.title}](${article.url})`;
      if (article.snippet) section += ` — ${article.snippet}`;
      section += '\n';
    }
    section += '\n';
  }

  return section;
}

/**
 * Generate GitHub Issue content
 */
async function generateIssue(diff: ChangelogDiff): Promise<IssueContent> {
  console.log('📝 Generating GitHub Issue content...');

  const title = `🚀 Claude Code CHANGELOG 更新検知 - ${diff.newVersions.join(', ')}`;

  // 変更分類を実行
  const categorization = await categorizeChanges(diff.diffText);

  // 機能追加・改善がある場合のみWeb検索を実行
  const webSearch: WebSearchResult = categorization.hasActionableChanges
    ? await searchWebForFeatures(diff.newVersions, categorization.structured)
    : { articles: [], success: true };

  // Build issue body
  let body = `## 🚀 Claude Code CHANGELOG 更新検知\n\n`;
  body += `**検出日時:** ${getJSTTimestamp()}\n`;
  body += `**検出バージョン:** ${diff.newVersions.join(', ')}\n\n`;
  body += `---\n\n`;

  // Commit history reference note
  body += `> 📋 変更の詳細（原文）はコミット履歴を参照してください。\n\n`;
  body += `---\n\n`;

  // Change categorization (bug fixes excluded from detail)
  body += `### 📊 変更分類\n\n`;
  if (categorization.success) {
    const { bugFixes, newFeatures, improvements } = categorization.structured;

    body += `| カテゴリ | 件数 |\n`;
    body += `|---------|------|\n`;
    body += `| ✨ 機能追加 | ${newFeatures.count}件 |\n`;
    body += `| 🔧 改善・その他 | ${improvements.count}件 |\n`;
    body += `| 🐛 バグ修正 | ${bugFixes.count}件（詳細省略） |\n\n`;

    if (newFeatures.count > 0) {
      body += `#### ✨ 機能追加 (${newFeatures.count}件)\n`;
      for (const item of newFeatures.items) {
        body += `- ${item}\n`;
      }
      body += '\n';
    }

    if (improvements.count > 0) {
      body += `#### 🔧 改善・その他 (${improvements.count}件)\n`;
      for (const item of improvements.items) {
        body += `- ${item}\n`;
      }
      body += '\n';
    }
  } else {
    body += `⚠️ 分類に失敗しました: ${categorization.error ?? 'Unknown error'}\n\n`;
  }
  body += `---\n\n`;

  // Web information section
  if (categorization.hasActionableChanges) {
    body += buildWebInfoSection(webSearch, diff.newVersions);
    body += `---\n\n`;
  }

  // Analysis guidance
  body += `### 🔍 詳細分析\n\n`;
  body += `この更新を.claude設定に反映するか検討する場合は、以下のコマンドを実行してください：\n\n`;
  body += `\`\`\`bash\n/analyze-changelog <issue-number>\n\`\`\`\n\n`;
  body += `このコマンドは、インタラクティブに改善提案を生成します。\n\n`;
  body += `---\n\n`;

  // Footer
  body += `**自動生成**: GitHub Actions\n`;
  body += `**ソース**: [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)\n`;

  console.log('✅ Issue content generated');

  return { title, body };
}

/**
 * Create GitHub Issue
 */
async function createGitHubIssue(issue: IssueContent): Promise<GitHubIssueResponse> {
  console.log('🎫 Creating GitHub Issue...');

  if (CONFIG.dryRun) {
    console.log('🔒 DRY RUN MODE - Issue not created');
    console.log('Title:', issue.title);
    console.log('Body preview:', issue.body.substring(0, 500) + '...');

    // Return mock response for dry run
    return {
      number: 0,
      html_url: 'https://github.com/dry-run/issues/0',
      title: issue.title,
      state: 'open',
    };
  }

  try {
    const response = await retryWithBackoff(async () => {
      return await octokit.issues.create({
        owner: CONFIG.repoOwner,
        repo: CONFIG.repoName,
        title: issue.title,
        body: issue.body,
        labels: ['changelog', 'claude-code', 'auto-generated'],
      });
    });

    console.log(`✅ Issue created: #${response.data.number}`);
    console.log(`   URL: ${response.data.html_url}`);

    return {
      number: response.data.number,
      html_url: response.data.html_url,
      title: response.data.title,
      state: response.data.state as 'open' | 'closed',
    };
  } catch (error) {
    console.error('❌ Failed to create GitHub Issue:', error);
    throw new Error('Failed to create GitHub Issue');
  }
}

/**
 * Update state file with new CHANGELOG content
 */
async function updateState(newContent: string): Promise<void> {
  console.log('💾 Updating state file...');

  try {
    const fullPath = path.resolve(process.cwd(), CONFIG.statePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write new state
    await fs.writeFile(fullPath, newContent, 'utf-8');

    console.log(`✅ State file updated: ${CONFIG.statePath}`);
  } catch (error) {
    console.error('❌ Failed to update state file:', error);
    throw new Error('Failed to update state file');
  }
}

// ============================================================================
// Workflow Orchestration Functions (High-level)
// ============================================================================

/**
 * Fetch CHANGELOG, detect changes (state update moved to processChangelogUpdate)
 */
async function fetchAndCompareChangelog(): Promise<ChangelogDiff> {
  const newContent = await fetchChangelog();
  const oldContent = await loadPreviousState();
  const diff = detectChanges(oldContent, newContent);

  return diff;
}

/**
 * Process changelog update by generating and creating Issue
 */
async function processChangelogUpdate(
  diff: ChangelogDiff
): Promise<{ issue?: GitHubIssueResponse; skipped: boolean; reason?: string }> {
  const issue = await generateIssue(diff);

  // Basic syntax check only
  const syntaxValidation = validateSyntax(issue.body);

  // Dry run mode: print detailed information
  if (CONFIG.dryRun) {
    console.log('\n=== DRY RUN モード ===');
    console.log('構文チェック:', syntaxValidation.isValid ? '✓' : '✗');
    if (syntaxValidation.warnings.length > 0) {
      console.log('警告:', syntaxValidation.warnings);
    }
    console.log('Issue作成判定: YES');
    console.log('=====================\n');
    return { issue: null as any, skipped: false };
  }

  // Create Issue
  let createdIssue: GitHubIssueResponse;
  try {
    createdIssue = await createGitHubIssue(issue);
  } catch (error) {
    console.error('❌ Issue creation failed');
    throw error;
  }

  // Update state after successful Issue creation
  try {
    await updateState(diff.newContent);
  } catch (error) {
    console.warn('⚠️ State update failed (Issue was created)');
  }

  return { issue: createdIssue, skipped: false };
}

/**
 * Print success message with results
 */
function printSuccessMessage(
  diff: ChangelogDiff,
  result: { issue?: GitHubIssueResponse; skipped: boolean; reason?: string }
): void {
  console.log('');
  console.log('✅ CHANGELOG monitoring completed successfully!');
  console.log(`   New versions: ${diff.newVersions.join(', ')}`);

  if (result.skipped) {
    // skippedはもはや発生しないはずだが、後方互換性のため残す
    console.log(`   Issue作成: スキップ（予期しない動作）`);
    if (result.reason) {
      console.log(`   理由: ${result.reason}`);
    }
  } else if (result.issue) {
    if (CONFIG.dryRun) {
      console.log(`   Issue作成: DRY RUN モード（実際には作成されません）`);
    } else {
      console.log(`   Issue作成: 完了`);
      console.log(`   Issue URL: ${result.issue.html_url}`);
    }
  }
}

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
  console.log('🚀 Starting Claude Code CHANGELOG Monitor...');
  console.log(`📋 Configuration:`);
  console.log(`   Repository: ${CONFIG.repoOwner}/${CONFIG.repoName}`);
  console.log(`   State Path: ${CONFIG.statePath}`);
  console.log(`   Dry Run: ${CONFIG.dryRun}`);
  console.log('');

  try {
    // Step 1: Fetch CHANGELOG and detect changes
    const diff = await fetchAndCompareChangelog();

    // Step 2: Early exit if no changes detected
    if (!diff.hasChanges) {
      console.log('✅ No changes detected - exiting');

      // For first run (empty oldContent), create initial state file
      if (diff.oldContent === '') {
        console.log('ℹ️  First run detected - creating initial state file');
        await updateState(diff.newContent);
      }

      process.exit(0);
    }

    // Step 3: Process changes and create Issue (if applicable)
    // Note: updateState() is now called inside processChangelogUpdate()
    const result = await processChangelogUpdate(diff);

    // Step 4: Report success
    printSuccessMessage(diff, result);
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ CHANGELOG monitoring failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run main function
main();
