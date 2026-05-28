# Storybook ガイド

このドキュメントでは、プロジェクトに導入されたStorybookの使い方を説明します。

## 概要

Storybook v10.1.11を導入し、UIコンポーネントを独立した環境で開発・テスト・文書化できるようになりました。

## フォント変更

### 採用したフォント
**Noto Sans JP**（Google Fonts）

- モダンで読みやすい日本語フォント
- Googleが開発した高品質なフォントファミリー
- 軽量（300）から太字（700）までの複数のウェイトをサポート
- 思い出記録アプリにふさわしい、柔らかく親しみやすい雰囲気

### 変更内容
- `app/layout.tsx`: Noto Sans JPフォントをインポート・適用
- `app/globals.css`: CSS変数を更新してNoto Sans JPを使用

## Storybook の起動方法

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Storybook の起動

```bash
npm run storybook
```

起動後、ブラウザで `http://localhost:6006` を開くと、Storybookが表示されます。

### 3. Storybook のビルド（本番環境用）

```bash
npm run build-storybook
```

ビルドされたファイルは `storybook-static` ディレクトリに出力されます。

## サンプルコンポーネント: MemoryCard

思い出記録アプリにふさわしいカードコンポーネントを作成しました。

### 場所
- コンポーネント: `components/MemoryCard.tsx`
- ストーリー: `components/MemoryCard.stories.tsx`

### 特徴

1. **日本語フォントの適用**
   - Noto Sans JPフォントが適用され、日本語が美しく表示されます

2. **3つのバリエーション**
   - `default`: 標準スタイル
   - `compact`: コンパクトスタイル
   - `detailed`: 詳細スタイル（グラデーション背景付き）

3. **レスポンシブ対応**
   - ホバー時のシャドウエフェクト
   - ダークモード対応

4. **アクセシビリティ対応**
   - キーボード操作対応（Enter/Space）
   - セマンティックHTML使用

### ストーリー例

Storybookでは以下のストーリーが確認できます：

- **Default**: 標準的な使い方
- **Compact**: 省スペース表示
- **Detailed**: 重要な思い出用
- **JapaneseFont**: 日本語フォント表示確認
- **LongDescription**: 長文対応
- **Clickable**: クリックイベント付き

## Storybook の使い方

### コンポーネントの確認
1. Storybookを起動 (`npm run storybook`)
2. 左サイドバーから `Components > MemoryCard` を選択
3. 各ストーリーをクリックして表示を確認

### インタラクティブなテスト
- **Controls**: 右パネルでプロパティを動的に変更
- **Actions**: クリックイベントなどの動作を確認
- **Docs**: 自動生成されたドキュメントを閲覧

### 新しいストーリーの追加

```tsx
// components/YourComponent.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { YourComponent } from "./YourComponent";

const meta = {
  title: "Components/YourComponent",
  component: YourComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // プロパティを設定
  },
};
```

## ディレクトリ構造

```
.
├── .storybook/          # Storybook設定
│   ├── main.ts          # メイン設定ファイル
│   └── preview.ts       # プレビュー設定（グローバルスタイル適用）
├── components/          # コンポーネント
│   ├── MemoryCard.tsx
│   └── MemoryCard.stories.tsx
├── stories/             # 追加のストーリー（任意）
└── app/
    ├── layout.tsx       # Noto Sans JPフォント適用
    └── globals.css      # グローバルスタイル
```

## 設定ファイルの説明

### `.storybook/main.ts`
- ストーリーファイルの場所を指定
- Next.jsフレームワーク設定
- アドオンの設定

### `.storybook/preview.ts`
- グローバルスタイル（`globals.css`）のインポート
- Storybook全体のデフォルト設定

## 開発ワークフロー

### コンポーネント開発の推奨フロー

1. **コンポーネント作成**
   ```bash
   # components/NewComponent.tsx を作成
   ```

2. **ストーリー作成**
   ```bash
   # components/NewComponent.stories.tsx を作成
   ```

3. **Storybookで確認**
   ```bash
   npm run storybook
   ```

4. **ブラウザでインタラクティブに調整**
   - Controlsパネルでプロパティを変更
   - 各種バリエーションをストーリーとして保存

5. **実際のアプリに統合**
   ```tsx
   import { NewComponent } from "@/components/NewComponent";
   ```

## ベストプラクティス

### 1. ストーリーの命名
- わかりやすい名前を使用（例: `Default`, `Compact`, `WithLongText`）
- 日本語コメントで説明を追加

### 2. Props の型定義
- TypeScriptの型を活用
- JSDocコメントでプロパティを説明

### 3. アクセシビリティ
- キーボード操作に対応
- 適切なARIA属性を使用

### 4. レスポンシブデザイン
- 異なる画面サイズでの表示を確認
- Storybookの viewport アドオンを活用

## トラブルシューティング

### Storybookが起動しない
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

### フォントが表示されない
- ブラウザのキャッシュをクリア
- `globals.css`が正しくインポートされているか確認

### ビルドエラー
```bash
# Next.jsとStorybookの両方をクリーンビルド
npm run build
npm run build-storybook
```

## 参考リンク

- [Storybook公式ドキュメント](https://storybook.js.org/docs)
- [Storybook for Next.js](https://storybook.js.org/docs/get-started/nextjs)
- [Google Fonts - Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)

## まとめ

これで、Storybookを使ってUIコンポーネントを効率的に開発できる環境が整いました。
新しいコンポーネントを作成する際は、ストーリーも合わせて作成することで、チーム全体でUIの共通理解が深まります。
