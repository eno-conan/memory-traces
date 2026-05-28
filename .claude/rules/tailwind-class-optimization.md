---
paths:
  - "app/**/*.tsx"
  - "components/**/*.tsx"
---

# Tailwind CSS クラス最適化規約（必須）

## 対象範囲
本ルールは、以下すべてのフロントエンド実装に適用される。

- Next.js ページコンポーネント（`app/**/page.tsx`）
- Next.js レイアウトコンポーネント（`app/**/layout.tsx`）
- React コンポーネント（`components/**/*.tsx`）

---

## 絶対ルール（違反禁止）

### 1. 標準クラスが存在する場合、任意値を使用してはならない

**Tailwind CSS v4 のスペーシングスケール（4px単位）を優先すること。**

Tailwind CSS v4 では、スペーシングスケールが 4px 単位で定義されています。
任意値 `[Npx]` の代わりに、標準クラスを使用してください。

#### スペーシングスケール対応表

| 任意値 | 標準クラス | ピクセル値 |
|--------|-----------|----------|
| `w-[120px]` | `w-30` | 120px |
| `w-[200px]` | `w-50` | 200px |
| `w-[300px]` | `w-75` | 300px |
| `w-[384px]` | `w-96` | 384px |
| `min-h-[200px]` | `min-h-50` | 200px |
| `md:min-w-[300px]` | `md:min-w-75` | 300px |

❌ 禁止例：
```tsx
// 標準クラスが存在するのに任意値を使用
<div className="w-[120px] min-h-[200px]">...</div>
<div className="md:min-w-[300px]">...</div>
```

✅ 必須：
```tsx
// 標準クラスを使用
<div className="w-30 min-h-50">...</div>
<div className="md:min-w-75">...</div>
```

---

### 2. 標準クラスの確認方法

**VSCode の Tailwind IntelliSense を活用すること。**

1. クラス名を入力中に IntelliSense の候補を確認
2. 任意値を入力すると、標準クラスへの変換提案が表示される
3. 警告が表示された場合、必ず標準クラスに修正する

例: `w-[120px]` と入力すると、VSCode が以下の警告を表示:
```
The class `w-[120px]` can be written as `w-30`
```

この場合、必ず `w-30` に修正してください。

---

### 3. 任意値が許可されるケース

**標準クラスが存在しない場合のみ、任意値を使用可能。**

以下のケースでは任意値の使用を許可します:

✅ 許可例：
```tsx
// パーセンテージ値（標準クラスで表現できない）
<div className="w-[40%]">...</div>

// 非4px単位の特殊なサイズ（デザイン要件）
<div className="h-[73px]">...</div>

// calc() を使用した計算値
<div className="w-[calc(100%-2rem)]">...</div>
```

ただし、これらのケースでも、可能な限り標準クラスで代替できないか検討してください。

---

### 4. よく使用するスペーシングクラス一覧

**頻出パターンを覚えておくこと。**

| 用途 | 標準クラス | ピクセル値 |
|------|-----------|----------|
| アイコンサイズ | `w-5 h-5` | 20px × 20px |
| 小さいボタン | `w-20 h-10` | 80px × 40px |
| フォーム入力 | `min-w-75` | 300px |
| カード幅 | `w-96` | 384px |
| モーダル幅 | `max-w-2xl` | 672px |
| 最小タップ領域 | `min-w-11 min-h-11` | 44px × 44px |

---

## 実装前セルフチェック（必須）

- [ ] 任意値クラス（`[Npx]`）を使用していない、または使用理由が明確
- [ ] VSCode で Tailwind 警告が表示されていない
- [ ] スペーシングスケール対応表を確認した
- [ ] レスポンシブ修飾子でも標準クラスを使用している

---

## このルールの背景

> **「一貫性のあるデザインシステムを維持する」ことが目的**

任意値の過度な使用は以下を引き起こす:

* デザインの一貫性の欠如
* メンテナンスの困難
* ビルドサイズの増加
* Tailwind IntelliSense の警告増加
* コードレビュー時の混乱

**Tailwind CSS v4 の設計思想:**
- 4px 単位のスペーシングスケールで統一
- 標準クラスによるデザインシステムの一貫性
- ユーティリティファーストの最適化

---

## 運用上の扱い

本ルール違反は以下として扱う:

* コードレビュー時の指摘対象
* VSCode 警告として検出されるため、マージ前に修正

**例外条項:**
- 既存コードは段階的移行対象（新規作成・変更時に適用）
- パーセンテージ値など標準クラスで表現できない場合は任意値を許可
- デザイン要件で非4px単位が必要な場合、理由をコメントに記載

---

## 検証方法

### VSCode IntelliSense

1. Tailwind CSS IntelliSense 拡張機能をインストール
2. クラス名入力時に警告を確認
3. 警告が表示された場合、提案された標準クラスに修正

### Lint チェック（将来的に導入予定）

```bash
# Tailwind クラスの検証（検討中）
npm run lint:tailwind
```

---

## 参考リンク

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Spacing Scale](https://tailwindcss.com/docs/customizing-spacing)
- [Tailwind IntelliSense for VSCode](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
