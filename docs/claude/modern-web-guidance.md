# Modern Web Guidance — AIエージェント向けモダンウェブ技術ガイド

参照元: [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)

---

## 概要

**Modern Web Guidance** は、Google ChromeチームとMicrosoft Edgeチームが支援するAIエージェント向けスキルセットである。

LLMのトレーニングデータにはレガシーコードが大量に含まれているため、AIエージェントは往々にして古いパターンを使いがちである。このスキルはそのギャップを埋め、AIが最新のブラウザAPIやネイティブソリューションを優先して使用するよう誘導する。

> "Coding agents often default to older patterns because LLM training data contains vast amounts of legacy code"

---

## 提供するガイドの範囲

**102個のモダンウェブ機能** と **128個の実用的なユースケース** をカバー。

### CSS & レイアウト（51機能）

| 機能 | 概要 |
|------|------|
| Container Queries | 親コンテナのサイズに応じたスタイリング |
| View Transitions | ページ/要素間のアニメーション遷移 |
| Scroll Snap | スクロール位置のスナッピング |
| Anchor Positioning | 要素を別要素に相対的に配置 |
| `@layer` | CSSカスケードレイヤーの制御 |

### HTML & DOM（20機能）

| 機能 | 概要 |
|------|------|
| `<dialog>` | ネイティブモーダルダイアログ |
| Popover API | ポップオーバーのネイティブ実装 |
| `<details>` / `<summary>` | ネイティブアコーディオン |
| Fetch Priority | リソース読み込み優先度の制御 |

### JavaScript & API（31機能）

| 機能 | 概要 |
|------|------|
| Navigation API | モダンなクライアントサイドナビゲーション |
| Scheduler API | タスクスケジューリングとINP最適化 |
| Temporal | 日付・時刻処理の新標準API |
| Web Authentication | パスキー・WebAuthn実装 |
| Scroll-driven Animations | スクロール連動アニメーション |

---

## 主なユースケース

- ユーザー体験: アニメーション、ページ遷移、ドラッグ&ドロップ
- フォーム・UI: カスタムセレクト、オートフィル、バリデーション
- 認証: パスキー、WebAuthn
- パフォーマンス: INP診断、タスク分割、長タスク回避
- アクセシビリティ: ARIAパターン、キーボードナビゲーション

---

## Next.js 開発での活用

Next.js はブラウザAPIを直接利用するケースが多い（Client Components, useEffect等）。Modern Web Guidance を活用することで、AIが以下のような場面でモダンなアプローチを提案できる:

- `<dialog>` を使ったモーダル（カスタムCSSのみのモーダルの代替）
- View Transitions API を使ったページ遷移（Next.js の `<Link>` との組み合わせ）
- Scheduler API を使った INP の改善（重いクライアント処理の分割）
- Container Queries を使ったレスポンシブコンポーネント（`@media` の代替）

---

## スキルのインストール方法

```bash
# skills.sh 経由でインストール
npx skills add GoogleChrome/modern-web-guidance
```

インストール後、Claude Code / Cursor 等の対応エージェントで `/modern-web` または `/web-platform` のようなコマンドで呼び出せる（スキル設定に依存）。

---

## 他リポジトリへのコピー

このドキュメントはフレームワーク非依存の汎用リファレンスのため、Next.js以外のプロジェクトでも利用可能:

```bash
cp docs/claude/modern-web-guidance.md <other-repo>/docs/claude/
```

---

## 関連ドキュメント

- [`docs/claude/agents-md.md`](./agents-md.md) — AGENTS.md と Next.js AI エージェント設定ガイド
- [`docs/claude/building-skill.md`](./building-skill.md) — Claude スキル構築ガイド
- [GitHub リポジトリ](https://github.com/GoogleChrome/modern-web-guidance) — 公式リポジトリ（詳細なガイド一覧）
