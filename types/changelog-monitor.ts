/**
 * Type definitions for Claude Code CHANGELOG Monitor
 * Following project's type safety guidelines (.claude/rules/lambda-type-safety.md)
 */

/**
 * Represents a detected change in the CHANGELOG
 */
export interface ChangelogDiff {
  /** Whether any changes were detected */
  hasChanges: boolean;
  /** List of new version numbers detected */
  newVersions: string[];
  /** Unified diff text showing changes */
  diffText: string;
  /** Complete new CHANGELOG content */
  newContent: string;
  /** Previous CHANGELOG content */
  oldContent: string;
}

/**
 * Content for creating a GitHub Issue
 */
export interface IssueContent {
  /** Issue title */
  title: string;
  /** Issue body in Markdown format */
  body: string;
}

/**
 * Parsed version information from CHANGELOG
 */
export interface VersionInfo {
  /** Semantic version number (e.g., "2.19.0") */
  version: string;
  /** Release date in ISO format */
  date: string;
  /** Categorized changes */
  sections: {
    /** New features */
    added?: string[];
    /** Changes to existing functionality */
    changed?: string[];
    /** Bug fixes */
    fixed?: string[];
    /** Removed features */
    removed?: string[];
  };
}

/**
 * Response from .claude directory analysis
 */
export interface ClaudeDirectoryAnalysisResponse {
  /** Directory snapshot at analysis time */
  directorySnapshot: ClaudeDirectoryContent;
  /** Repository context used for analysis */
  repoContext: RepositoryContext;
  /** Whether analysis was successful */
  success: boolean;
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Contents of .claude directory for analysis
 */
export interface ClaudeDirectoryContent {
  /** settings.json content */
  settings: string;
  /** Agent configuration files */
  agents: Record<string, string>;
  /** Security and coding rule files */
  rules: Record<string, string>;
  /** Kiro spec-driven development commands */
  commands: Record<string, string>;
  /** Automation skill definitions */
  skills: Record<string, string>;
}

/**
 * Claude API translation request
 */
export interface TranslationRequest {
  /** Text to translate */
  text: string;
  /** Source language code */
  sourceLanguage: 'en';
  /** Target language code */
  targetLanguage: 'ja';
}

/**
 * Items for a single change category
 */
export interface CategoryItems {
  /** Number of items in this category */
  count: number;
  /** List of items in Japanese */
  items: string[];
}

/**
 * Structured categorization result parsed from Claude API JSON response
 */
export interface CategorizationStructured {
  bugFixes: CategoryItems;
  newFeatures: CategoryItems;
  improvements: CategoryItems;
}

/**
 * Claude API categorization response
 */
export interface CategorizationResponse {
  /** 分類結果のMarkdownテキスト（後方互換） */
  categorizedText: string;
  /** Structured categorization data for programmatic access */
  structured: CategorizationStructured;
  /** Whether there are actionable changes (new features or improvements) */
  hasActionableChanges: boolean;
  /** Whether categorization was successful */
  success: boolean;
  /** Error message if categorization failed */
  error?: string;
}

/**
 * A single web article or video result
 */
export interface WebArticle {
  /** Article or YouTube video */
  type: 'article' | 'video';
  /** Title of the article or video */
  title: string;
  /** URL to the article or video */
  url: string;
  /** Language of the content */
  language: 'ja' | 'en';
  /** Short description or snippet */
  snippet?: string;
}

/**
 * Result from web search for feature-related information
 */
export interface WebSearchResult {
  /** List of articles and videos found */
  articles: WebArticle[];
  /** Whether the search was successful */
  success: boolean;
  /** Error message if search failed */
  error?: string;
}

/**
 * Claude API translation response
 */
export interface TranslationResponse {
  /** Translated text */
  translatedText: string;
  /** Whether translation was successful */
  success: boolean;
  /** Error message if translation failed */
  error?: string;
}

/**
 * GitHub API Issue creation response
 */
export interface GitHubIssueResponse {
  /** Issue number */
  number: number;
  /** Issue URL */
  html_url: string;
  /** Issue title */
  title: string;
  /** Issue state */
  state: 'open' | 'closed';
}

/**
 * Configuration for the monitor script
 */
export interface MonitorConfig {
  /** GitHub repository owner */
  repoOwner: string;
  /** GitHub repository name */
  repoName: string;
  /** Path to state file */
  statePath: string;
  /** Claude Code repository URL */
  changelogUrl: string;
  /** Whether to run in dry-run mode (no Issue creation) */
  dryRun: boolean;
}

/**
 * Repository context for relevance filtering
 */
export interface RepositoryContext {
  /** Project type (e.g., "Next.js Application") */
  projectType: string;
  /** Framework name (e.g., "next") */
  framework: string;
  /** Technology stack organized by category */
  techStack: {
    /** Frontend libraries/frameworks */
    frontend: string[];
    /** Backend libraries/frameworks */
    backend: string[];
    /** Testing frameworks/tools */
    testing: string[];
    /** Infrastructure tools */
    infrastructure: string[];
  };
  /** Claude Code specific features */
  claudeCodeFeatures: {
    /** Enabled plugins from settings.json */
    enabledPlugins: string[];
    /** Configured agents */
    configuredAgents: string[];
    /** Defined rules */
    definedRules: string[];
    /** Available skills */
    availableSkills: string[];
  };
}

/**
 * Result of suggestion quality validation
 */
export interface ValidationResult {
  /** Whether the suggestion meets quality standards */
  isValid: boolean;
  /** List of validation warnings */
  warnings: string[];
}
