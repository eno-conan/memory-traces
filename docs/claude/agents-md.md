# AGENTS.md とは / `npx @next/codemod@canary agents-md` について

## 1. AGENTS.md の概念

**AGENTS.md** は、AI エージェントが自律的にコードを生成・編集する際に参照する、プロジェクトルートに配置するマークダウンファイルである。

### 仕組みと特徴

| 特性 | AGENTS.md | Skills |
|------|-----------|--------|
| ロードタイミング | **常時**（全ターンのシステムプロンプトに含まれる） | オンデマンド（エージェントが呼び出す） |
| 参照の安定性 | 高い（エージェントの判断に依存しない） | 低い（呼び出し判断が失敗することがある） |
| コンテキスト | 継続的 | 都度取得 |
| セットアップ | ファイル配置のみ | フォルダ構造・YAML フロントマターが必要 |

AGENTS.md の核心的な設計思想は「**受動的コンテキスト**」である。エージェントが「このドキュメントを参照すべきか」を能動的に判断する必要がなく、常にシステムプロンプトの一部として提供されるため、参照漏れが発生しない。

---

## 2. Vercel の評価研究

参照元: [AGENTS.md Outperforms Skills in Our Agent Evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)

### パス率の比較（Next.js ドキュメント参照タスク）

| 構成 | パス率 | ベースラインからの改善 |
|------|--------|----------------------|
| ベースライン（ドキュメントなし） | 53% | — |
| Skill（デフォルト動作） | 53% | +0% |
| Skill（明示的な「スキル優先」指示あり） | 79% | +26% |
| **AGENTS.md ドキュメントインデックス** | **100%** | **+47%** |

AGENTS.md の内訳: ビルド 100% / リント 100% / テスト 100%

### Skills の問題点

- **トリガー率の低さ**: 56% のケースでエージェントがスキルを呼び出さず、ベースラインと同等の結果に終わった
- **文言への過敏な依存性**: 「スキル優先」と「プロジェクト調査優先」という微妙な指示の違いが、53% と 79% という大きな差をもたらす
- **信頼性の欠如**: 「些細な文言の変更が大きな行動変化をもたらす」ため、本番環境での安定した利用が困難

### AGENTS.md が優れている理由（技術的分析）

1. **決定不要**: エージェントが「参照すべきか」を判断する必要がない
2. **継続的利用可能性**: 全ターンにわたってシステムプロンプトに含まれる
3. **順序付け問題の回避**: スキル呼び出しのシーケンス決定（どのスキルをいつ使うか）が不要

### 技術的詳細

- **圧縮**: 元のドキュメント（約 40KB）を **8KB**（80% 削減）に圧縮したインデックスとして CLAUDE.md / AGENTS.md に埋め込む
- **フォーマット**: パイプ区切りの構造化インデックス（`ディレクトリ:{ファイル1,ファイル2,...}` 形式）
- **動作**: エージェントは「ドキュメントの場所を知る」状態になり、必要に応じて `.next-docs/` ディレクトリから該当ファイルを読み取る

---

## 3. `npx @next/codemod@canary agents-md` コマンドについて

### このコマンドが行うこと

1. **`.next-docs/` フォルダを生成**: Next.js の公式ドキュメントを MDX 形式でローカルに展開する
2. **CLAUDE.md / AGENTS.md を更新**: `<!-- NEXT-AGENTS-MD-START -->` 〜 `<!-- NEXT-AGENTS-MD-END -->` ブロックに圧縮インデックスを挿入する

### 実行コマンド

```bash
npx @next/codemod@canary agents-md --output CLAUDE.md
```

### 生成物

| 項目 | 内容 |
|------|------|
| 生成先 | `.next-docs/`（プロジェクトルート直下） |
| ファイル数 | 約 379 ファイル |
| ディレクトリサイズ | 約 3.2MB |
| フォーマット | `.mdx`（MDX 形式） |

### `.gitignore` による除外理由

`.next-docs/` は `.gitignore` で除外されている（git 管理対象外）。理由：

- **再現性**: コマンド 1 回で誰でも同じファイルを再生成できる
- **リポジトリの肥大化防止**: 3.2MB を git 管理すると履歴が膨れる
- **最新性の維持**: Next.js のバージョンアップ時にコマンド再実行で最新化できる

`.next-docs/` が手元にない場合は、上記コマンドを再実行すること。

---

## 4. `.next-docs/` の構造

```
.next-docs/
├── 01-app/                          # App Router ドキュメント
│   ├── 01-getting-started/          # 入門ガイド（18 ファイル + index.mdx）
│   │   ├── 01-installation.mdx
│   │   ├── 02-project-structure.mdx
│   │   ├── 03-layouts-and-pages.mdx
│   │   ├── 04-linking-and-navigating.mdx
│   │   ├── 05-server-and-client-components.mdx
│   │   ├── 06-cache-components.mdx
│   │   ├── 07-fetching-data.mdx
│   │   ├── 08-updating-data.mdx
│   │   ├── 09-caching-and-revalidating.mdx
│   │   ├── 10-error-handling.mdx
│   │   ├── 11-css.mdx
│   │   ├── 12-images.mdx
│   │   ├── 13-fonts.mdx
│   │   ├── 14-metadata-and-og-images.mdx
│   │   ├── 15-route-handlers.mdx
│   │   ├── 16-proxy.mdx
│   │   ├── 17-deploying.mdx
│   │   └── 18-upgrading.mdx
│   ├── 02-guides/                   # 各種ガイド（認証、テスト、移行など）
│   │   ├── authentication.mdx       # 認証実装ガイド
│   │   ├── testing/                 # Jest / Vitest / Playwright / Cypress
│   │   ├── migrating/               # App Router 移行、CRA / Vite からの移行
│   │   └── upgrading/               # v14 / v15 / v16 アップグレードガイド
│   ├── 03-api-reference/            # API リファレンス
│   │   ├── 01-directives/           # use-cache, use-client, use-server
│   │   ├── 02-components/           # Image, Link, Font, Form, Script
│   │   ├── 03-file-conventions/     # layout, page, error, loading など
│   │   ├── 04-functions/            # cookies, headers, redirect など
│   │   ├── 05-config/               # next.config.js オプション
│   │   └── 06-cli/                  # next CLI コマンド
│   └── 04-glossary.mdx              # 用語集
├── 02-pages/                        # Pages Router ドキュメント
│   ├── 01-getting-started/
│   ├── 02-guides/
│   ├── 03-building-your-application/
│   └── 04-api-reference/
├── 03-architecture/                 # アーキテクチャ解説
│   ├── accessibility.mdx
│   ├── fast-refresh.mdx
│   ├── nextjs-compiler.mdx
│   └── supported-browsers.mdx
└── 04-community/                    # コミュニティ
    ├── 01-contribution-guide.mdx
    └── 02-rspack.mdx
```

---

## 5. このプロジェクトでの活用方針

### AI エージェントによるコード生成精度向上

本プロジェクトの `CLAUDE.md` には、コマンド実行で生成された Next.js ドキュメントインデックスが組み込まれている（`<!-- NEXT-AGENTS-MD-START -->` ブロック）。これにより、Claude Code は Next.js の正しい API・パターンを常に把握した状態でコード生成を行う。

### Skills より AGENTS.md を優先する理由

Vercel の評価研究が示すとおり、Skills はトリガー率 44%（56% が呼び出されない）という信頼性の問題がある。AGENTS.md はシステムプロンプトへの常時埋め込みにより、この問題を根本的に解消する。

### `.next-docs/` を参照インデックスとして使う方法

CLAUDE.md のインデックスは「ドキュメントの場所」を示す地図として機能する。Claude Code は以下の流れで参照する：

1. CLAUDE.md のインデックスから該当ファイルのパスを特定する
2. `.next-docs/` 内の該当 `.mdx` ファイルを読み取る
3. 最新のドキュメントに基づいてコードを生成する

**実践例**: Server Actions の実装時 → `01-app/01-getting-started/08-updating-data.mdx` を参照

### 環境再現手順

`.next-docs/` が存在しない環境（CI、別マシン等）での再生成：

```bash
npx @next/codemod@canary agents-md --output CLAUDE.md
```

このコマンドで `.next-docs/` が再生成され、CLAUDE.md のインデックスも最新化される。

---

## 関連ドキュメント

- [`docs/claude/building-skill.md`](./building-skill.md) — Skills の設計・実装ガイド（AGENTS.md との比較対象）
- [Vercel ブログ記事](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) — 評価研究の詳細
