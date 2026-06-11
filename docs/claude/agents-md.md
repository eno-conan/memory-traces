# AGENTS.md とは / Next.js AI エージェント設定ガイド

参照元:
- [Next.js AI Agents Guide](https://nextjs.org/docs/app/guides/ai-agents)
- [Next.js 16.2 AI Improvements](https://nextjs.org/blog/next-16-2-ai)

---

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
4. **常時利用可能なコンテキスト**: オンデマンド取得より常時埋め込みの方が効果的

---

## 3. セットアップ方法（Next.js 16.2+）

Next.js `v16.2.0-canary.37` 以降、ドキュメントは `next` パッケージに直接バンドルされる。`node_modules/next/dist/docs/` に配置されており、外部ネットワークアクセスなしで参照可能。

### 新規プロジェクト

`create-next-app` が自動的に `AGENTS.md` と `CLAUDE.md` を生成する:

```bash
npx create-next-app@canary
# または
pnpm create next-app@canary
```

エージェントファイルが不要な場合:

```bash
npx create-next-app@canary --no-agents-md
```

### 既存プロジェクト（v16.2 以降）

プロジェクトルートに以下の2ファイルを追加するだけでよい（コードモッド不要）。

`AGENTS.md` — エージェントへの指示:

```md
<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
```

`CLAUDE.md` — `@` インポート構文で AGENTS.md を参照（内容を重複させない）:

```md
@AGENTS.md
```

> `<!-- BEGIN:nextjs-agent-rules -->` と `<!-- END:nextjs-agent-rules -->` マーカーで囲まれた範囲が Next.js 管理セクション。マーカー外に独自のプロジェクト指示を追記してもアップデートで上書きされない。

### 旧バージョン（v16.1 以前）向け

コードモッドで自動生成する:

```bash
npx @next/codemod@latest agents-md
```

このコマンドはドキュメントを `.next-docs/` に展開し、エージェントファイルをその場所に向けて生成する。

---

## 4. バンドルドキュメントの構造（v16.2+）

`node_modules/next/dist/docs/` に以下の構造でバンドルされる:

```
node_modules/next/dist/docs/
├── 01-app/
│   ├── 01-getting-started/
│   ├── 02-guides/
│   └── 03-api-reference/
├── 02-pages/
├── 03-architecture/
└── index.mdx
```

インストール済みの Next.js バージョンに対応したドキュメントが常に参照可能。ネットワークアクセス不要で CI 環境でも動作する。

<details>
<summary>旧方式（v16.1 以前）の .next-docs/ 構造</summary>

```
.next-docs/
├── 01-app/
│   ├── 01-getting-started/    # 入門ガイド（18 ファイル）
│   ├── 02-guides/             # 認証、テスト、移行など
│   ├── 03-api-reference/      # API リファレンス
│   └── 04-glossary.mdx
├── 02-pages/
├── 03-architecture/
└── 04-community/
```

`.next-docs/` は `.gitignore` で除外する（再生成可能なため git 管理不要）。

</details>

---

## 5. このプロジェクトでの活用方針

### バンドルドキュメントの参照フロー（v16.2+）

1. `CLAUDE.md` が `@AGENTS.md` をインポートし、エージェントにドキュメントの場所を伝える
2. エージェントは `node_modules/next/dist/docs/` から該当ファイルを直接読み取る
3. バージョンに一致したドキュメントに基づいてコードを生成する

**実践例**: Server Actions の実装時 → `node_modules/next/dist/docs/01-app/01-getting-started/08-updating-data.mdx` を参照

### ベンチマーク結果の確認

実際の Next.js タスクでの評価結果は [nextjs.org/evals](https://nextjs.org/evals) で確認できる。

---

## 6. Next.js 16.2 の AI 開発支援機能

参照元: [Next.js 16.2: AI Improvements](https://nextjs.org/blog/next-16-2-ai)

### ブラウザログのターミナル転送

開発中のブラウザエラーがデフォルトでターミナルに転送される。AIエージェントはブラウザコンソールを開かずにクライアントサイドエラーを把握できる。

```ts
// next.config.ts
const nextConfig = {
  logging: {
    browserToTerminal: true,
    // 'error' — エラーのみ（デフォルト）
    // 'warn'  — 警告とエラー
    // true    — すべてのコンソール出力
    // false   — 無効化
  },
};
```

### 開発サーバーロックファイル

`next dev` 起動時に `.next/dev/lock` ファイルにPID・ポート・URLが記録される。2番目の `next dev` が同ディレクトリで起動しようとすると、アクション可能なエラーメッセージが表示される:

```bash
Error: Another next dev server is already running.

- Local:        http://localhost:3000
- PID:          12345
- Dir:          /path/to/project
- Log:          .next/dev/logs/next-development.log

Run kill 12345 to stop it.
```

AIエージェントが重複起動した場合でも、PIDを使って停止できる。

### Experimental Agent DevTools: `@vercel/next-browser`

AIエージェントがターミナルから実行中のNext.jsアプリを検査できるCLI。

```bash
# インストール（skill として）
npx skills add vercel-labs/next-browser

# Claude Code / Cursor 等で使用
/next-browser
```

**主な機能:**

| コマンド | 機能 |
|---------|------|
| `next-browser tree` | React コンポーネントツリー（props/hooks/ソースマップ付き） |
| `next-browser ppr lock` | PPR静的シェルのみ表示（動的部分をブロック） |
| `next-browser ppr unlock` | PPRブロック要因の診断レポート |
| `next-browser goto <url>` | 指定URLへナビゲート |
| スクリーンショット | ページの視覚的キャプチャ |
| ネットワーク監視 | Server Actions含むリクエスト追跡 |

**PPR（Partial Prerendering）最適化の例:**

```bash
next-browser ppr lock
next-browser goto /blog/hello
# → 静的シェルの範囲を確認

next-browser ppr unlock
# → ブロック要因を特定（どのコンポーネント・fetchが動的化させているか）
```

---

## 関連ドキュメント

- [`docs/claude/building-skill.md`](./building-skill.md) — Skills の設計・実装ガイド（AGENTS.md との比較対象）
- [`docs/claude/modern-web-guidance.md`](./modern-web-guidance.md) — Google Chrome モダンウェブ機能ガイド
- [Vercel ブログ記事](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) — 評価研究の詳細
- [Next.js AI Agents 公式ガイド](https://nextjs.org/docs/app/guides/ai-agents)
- [Next.js 16.2 AI ブログ記事](https://nextjs.org/blog/next-16-2-ai)
- [Next.js MCP Server ガイド](https://nextjs.org/docs/app/guides/mcp)
