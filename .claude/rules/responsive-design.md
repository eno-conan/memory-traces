---
paths:
  - "app/**/page.tsx"
  - "app/**/layout.tsx"
  - "components/**/*.tsx"
---

# レスポンシブデザイン規約（必須）

## 対象範囲
本ルールは、以下すべてのフロントエンド実装に適用される。

- Next.js ページコンポーネント（`app/**/page.tsx`）
- Next.js レイアウトコンポーネント（`app/**/layout.tsx`）
- React コンポーネント（`components/**/*.tsx`）

---

## 絶対ルール（違反禁止）

### 1. 固定幅・固定サイズを使用してはならない

**ピクセル固定値の直接指定は禁止。相対単位または Tailwind クラスを使用すること。**

❌ 禁止例：
```tsx
// 固定幅の直接指定
<div style={{ width: '400px' }}>...</div>

// インラインスタイルでの固定サイズ
<img src="..." style={{ width: '200px', height: '150px' }} />

// 固定フォントサイズ
<p style={{ fontSize: '16px' }}>...</p>
```

✅ 必須：
```tsx
// Tailwind クラスでレスポンシブ対応
<div className="w-full md:w-1/2 lg:w-1/3">...</div>

// Next.js Image コンポーネントでレスポンシブ画像
<Image
  src="..."
  alt="説明"
  width={800}
  height={600}
  className="w-full h-auto"
/>

// Tailwind でレスポンシブフォントサイズ
<p className="text-base md:text-lg lg:text-xl">...</p>
```

---

### 2. プロジェクト標準ブレークポイントを使用すること

**Tailwind CSS デフォルトブレークポイントを使用する。**

| プレフィックス | 最小幅 | 用途 |
|--------------|--------|------|
| `sm:` | 640px | 小型タブレット |
| `md:` | 768px | タブレット |
| `lg:` | 1024px | ラップトップ |
| `xl:` | 1280px | デスクトップ |
| `2xl:` | 1536px | 大型デスクトップ |

❌ 禁止例：
```tsx
// カスタムメディアクエリの直接使用
<style jsx>{`
  @media (min-width: 700px) {
    .container { width: 90%; }
  }
`}</style>

// 非標準ブレークポイント
<div className="hidden [@media(min-width:850px)]:block">...</div>
```

✅ 必須：
```tsx
// 標準ブレークポイントの使用
<div className="hidden md:block lg:flex">...</div>

// モバイルファースト設計
<div className="text-sm md:text-base lg:text-lg">...</div>
```

---

### 3. モバイルファースト設計を徹底すること

**基本スタイルはモバイル向けとし、ブレークポイントで拡張する。**

❌ 禁止例：
```tsx
// デスクトップファースト（大きい画面から設計）
<div className="w-1/3 md:w-1/2 sm:w-full">...</div>

// max-width ベースの設計
<div className="max-md:hidden">...</div>
```

✅ 必須：
```tsx
// モバイルファースト（小さい画面から設計）
<div className="w-full md:w-1/2 lg:w-1/3">...</div>

// 段階的な機能追加
<nav className="flex flex-col md:flex-row gap-2 md:gap-4">
  <a href="#">リンク1</a>
  <a href="#">リンク2</a>
</nav>
```

---

### 4. タッチターゲットは 44×44px 以上を確保すること

**タップ可能な要素（ボタン、リンク等）は最小サイズを守る。**

❌ 禁止例：
```tsx
// タッチターゲットが小さすぎる
<button className="w-6 h-6 text-xs">×</button>

// パディングなしの小さいリンク
<a href="#" className="text-sm">リンク</a>
```

✅ 必須：
```tsx
// 十分なタッチターゲット
<button className="min-w-11 min-h-11 flex items-center justify-center">
  ×
</button>

// 適切なパディングでタップ領域を確保
<a href="#" className="inline-block px-4 py-3 text-sm">リンク</a>
```

---

### 5. レスポンシブ画像には Next.js Image コンポーネントを使用すること

**`<img>` タグの直接使用は禁止。Next.js Image を優先する。**

❌ 禁止例：
```tsx
// img タグの直接使用
<img src="/photo.jpg" alt="写真" />

// 固定サイズ画像
<img src="/photo.jpg" width="400" height="300" alt="写真" />
```

✅ 必須：
```tsx
// Next.js Image でレスポンシブ対応
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="写真の説明"
  width={800}
  height={600}
  className="w-full h-auto"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// fill レイアウトでコンテナに合わせる
<div className="relative w-full h-64">
  <Image
    src="/photo.jpg"
    alt="写真の説明"
    fill
    className="object-cover"
  />
</div>
```

---

## 実装前セルフチェック（必須）

- [ ] 固定幅・固定ピクセルを使用していない
- [ ] 標準ブレークポイント（sm/md/lg/xl/2xl）を使用している
- [ ] モバイルファーストで設計している（基本スタイル = モバイル）
- [ ] タッチターゲットが 44×44px 以上ある
- [ ] 画像に Next.js Image コンポーネントを使用している
- [ ] 320px（最小モバイル）〜1920px（大型デスクトップ）で表示確認した

---

## このルールの背景

> **「すべてのユーザーに最適な体験を提供する」ことが目的**

レスポンシブデザインの欠如は以下を引き起こす：

* モバイルユーザーの離脱
* タブレット・小型デバイスでの表示崩れ
* 横スクロールの発生
* タッチ操作の困難
* アクセシビリティの低下
* SEO ランキングの低下（モバイルファースト インデックス）

**統計データ：**
- モバイルトラフィックは全体の 60% 以上
- 表示崩れによる離脱率は 53%
- Google のモバイルフレンドリーテストが SEO に影響

---

## 運用上の扱い

本ルール違反は以下として扱う：

* ユーザー体験を著しく損なう欠陥
* マージブロッカー
* 即時修正対象

**例外条項：**
- 既存コードは段階的移行対象（新規作成・変更時に適用）
- 管理画面等デスクトップ専用画面は事前承認により一部除外可
- 印刷用スタイルは別途定義可

---

## テスト方法

### ブラウザ開発者ツール
1. Chrome DevTools を開く（F12）
2. デバイスツールバーを表示（Ctrl+Shift+M）
3. 以下のプリセットで確認：
   - iPhone SE (375px)
   - iPhone 14 Pro (393px)
   - iPad (768px)
   - Desktop (1280px, 1920px)

### Storybook
```bash
npm run storybook
```
- Viewport アドオンで各デバイスサイズを確認
- レスポンシブブレークポイントで表示確認

### 手動テスト
- ブラウザウィンドウをリサイズして連続的に確認
- 実機（スマートフォン、タブレット）でテスト

---

## 参考リンク

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Web Content Accessibility Guidelines - Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
