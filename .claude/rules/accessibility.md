---
paths:
  - "app/**/page.tsx"
  - "app/**/layout.tsx"
  - "components/**/*.tsx"
---

# アクセシビリティ（a11y）規約（必須）

## 対象範囲
本ルールは、以下すべてのフロントエンド実装に適用される。

- Next.js ページコンポーネント（`app/**/page.tsx`）
- Next.js レイアウトコンポーネント（`app/**/layout.tsx`）
- React コンポーネント（`components/**/*.tsx`）

**準拠基準：WCAG 2.1 Level AA**

---

## 絶対ルール（違反禁止）

### 1. セマンティック HTML を使用すること

**`<div>` や `<span>` で代用せず、適切な HTML 要素を使用する。**

❌ 禁止例：
```tsx
// div でボタンを実装
<div onClick={handleClick}>クリック</div>

// span でリンクを実装
<span onClick={() => router.push('/page')}>ページへ</span>

// div でナビゲーション
<div>
  <div><a href="/home">ホーム</a></div>
  <div><a href="/about">概要</a></div>
</div>
```

✅ 必須：
```tsx
// 適切なボタン要素
<button onClick={handleClick}>クリック</button>

// 適切なリンク要素
<Link href="/page">ページへ</Link>

// セマンティックナビゲーション
<nav>
  <ul>
    <li><a href="/home">ホーム</a></li>
    <li><a href="/about">概要</a></li>
  </ul>
</nav>

// ランドマーク要素の使用
<header>...</header>
<main>...</main>
<aside>...</aside>
<footer>...</footer>
```

---

### 2. キーボードアクセスを完全にサポートすること

**すべてのインタラクティブ要素はキーボードで操作可能であること。**

❌ 禁止例：
```tsx
// マウスイベントのみ対応
<div onClick={handleClick}>クリック</div>

// Tab キーでフォーカス不可
<div tabIndex={-1} onClick={handleClick}>クリック</div>

// Enter キーが効かない
<div tabIndex={0} onClick={handleClick}>送信</div>
```

✅ 必須：
```tsx
// ネイティブボタンはキーボード対応済み
<button onClick={handleClick}>クリック</button>

// カスタム要素にはキーボードイベント実装
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  クリック
</div>

// モーダルのフォーカストラップ実装
import { FocusTrap } from '@/components/FocusTrap';

<FocusTrap>
  <dialog open>
    <h2>モーダルタイトル</h2>
    <button onClick={handleClose}>閉じる</button>
  </dialog>
</FocusTrap>
```

---

### 3. フォーム要素には適切なラベルを設定すること

**すべての入力フィールドに関連付けられたラベルが必要。**

❌ 禁止例：
```tsx
// ラベルなし
<input type="text" placeholder="メールアドレス" />

// 関連付けなし
<label>メールアドレス</label>
<input type="text" />

// placeholder をラベル代わりに使用
<input type="email" placeholder="example@email.com" />
```

✅ 必須：
```tsx
// htmlFor と id で明示的に関連付け
<label htmlFor="email">メールアドレス</label>
<input
  type="email"
  id="email"
  name="email"
  aria-required="true"
/>

// 視覚的に隠すが、スクリーンリーダーには読まれるラベル
<label htmlFor="search" className="sr-only">
  検索
</label>
<input
  type="search"
  id="search"
  placeholder="キーワードを入力"
/>

// aria-label でラベルを提供
<button aria-label="メニューを閉じる">
  <XIcon />
</button>
```

**`sr-only` ユーティリティクラス（Tailwind）：**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### 4. 色のみに依存した情報伝達を禁止する

**色以外の手段（アイコン、テキスト、パターン）も併用すること。**

❌ 禁止例：
```tsx
// 色だけでエラーを表示
<input
  type="text"
  className="border-red-500"
/>

// 色だけでステータスを示す
<span className="text-green-500">●</span>
<span className="text-red-500">●</span>
```

✅ 必須：
```tsx
// アイコンとテキストを併用
<div className="flex items-center gap-2 text-red-600">
  <XCircleIcon className="w-5 h-5" />
  <span>エラー：メールアドレスの形式が正しくありません</span>
</div>

// ステータスを明示的に表示
<div className="flex items-center gap-2">
  <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
  <span>オンライン</span>
</div>

// チャートにパターンを使用
<rect fill="url(#pattern-stripes)" />
```

---

### 5. 画像には代替テキストを必須とする

**すべての `<img>` と `<Image>` に `alt` 属性が必要。装飾画像は空文字。**

❌ 禁止例：
```tsx
// alt 属性なし
<Image src="/photo.jpg" width={800} height={600} />

// 無意味な alt
<img src="/user.jpg" alt="画像" />

// ファイル名をそのまま使用
<img src="/photo-2024-01-01.jpg" alt="photo-2024-01-01" />
```

✅ 必須：
```tsx
// 適切な代替テキスト
<Image
  src="/photo.jpg"
  alt="東京タワーの夜景、ライトアップされた塔と周辺の街並み"
  width={800}
  height={600}
/>

// 装飾画像は空文字
<Image
  src="/decoration.svg"
  alt=""
  width={100}
  height={100}
  aria-hidden="true"
/>

// アイコンボタン
<button aria-label="設定を開く">
  <Image src="/settings.svg" alt="" width={24} height={24} />
</button>
```

**alt テキストのガイドライン：**
- **情報を伝える画像：** 内容を簡潔に説明
- **装飾画像：** `alt=""` + `aria-hidden="true"`
- **リンク内の画像：** リンク先を説明
- **複雑な図表：** 詳細説明を別途提供（`aria-describedby`）

---

### 6. コントラスト比を確保すること

**テキストと背景のコントラスト比を満たす。**

| 要素 | 最小コントラスト比（WCAG AA） |
|------|------------------------------|
| 通常テキスト（18pt 未満） | **4.5:1** |
| 大きいテキスト（18pt 以上 or 14pt 太字以上） | **3:1** |
| UI コンポーネント・グラフィック | **3:1** |

❌ 禁止例：
```tsx
// 薄いグレーテキスト on 白背景（コントラスト不足）
<p className="text-gray-400">説明文</p>

// 黄色テキスト on 白背景
<span className="text-yellow-300">警告</span>
```

✅ 必須：
```tsx
// 十分なコントラストを持つテキスト
<p className="text-gray-700">説明文</p>

// 警告は背景色とセットで使用
<div className="bg-yellow-100 text-yellow-900 border border-yellow-300 p-4">
  <strong>警告：</strong>この操作は元に戻せません。
</div>

// Tailwind で適切な組み合わせ
<button className="bg-blue-600 text-white hover:bg-blue-700">
  送信
</button>
```

**確認ツール：**
- Chrome DevTools: Lighthouse の Accessibility スコア
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Figma プラグイン: Stark](https://www.figma.com/community/plugin/732603254453395948/Stark)

---

### 7. ARIA 属性を適切に使用すること

**ARIA は適切な場所でのみ使用。ネイティブ HTML を優先する。**

❌ 禁止例：
```tsx
// 不要な ARIA（ネイティブで十分）
<button role="button" aria-label="送信">送信</button>

// 矛盾する ARIA
<button role="link" onClick={handleClick}>クリック</button>

// 無効な組み合わせ
<div role="button" href="/page">リンク</div>
```

✅ 必須：
```tsx
// ネイティブ要素を優先
<button>送信</button>

// 必要な場合のみ ARIA を追加
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  3件の新着通知があります
</div>

// カスタムコンポーネントへの適切な ARIA
<div
  role="tablist"
  aria-label="設定タブ"
>
  <button
    role="tab"
    aria-selected={activeTab === 'general'}
    aria-controls="panel-general"
  >
    一般
  </button>
</div>

// 動的コンテンツの読み上げ
<div
  role="alert"
  aria-live="assertive"
>
  {errorMessage}
</div>
```

**ARIA のベストプラクティス：**
1. **No ARIA is better than bad ARIA** - 不要なら使わない
2. ネイティブ HTML を優先
3. `role` と実際の振る舞いを一致させる
4. `aria-label` と表示テキストを一致させる（可能な限り）

---

### 8. フォーカス表示を削除してはならない

**`:focus` スタイルの `outline: none` は禁止。独自スタイルは代替必須。**

❌ 禁止例：
```tsx
// フォーカス表示を完全に削除
<button className="focus:outline-none">クリック</button>

// グローバルでフォーカス削除
<style global jsx>{`
  *:focus {
    outline: none;
  }
`}</style>
```

✅ 必須：
```tsx
// Tailwind のフォーカスリング使用
<button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  クリック
</button>

// カスタムフォーカススタイル
<button className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
  送信
</button>

// ネイティブフォーカスをそのまま使用
<a href="/page" className="text-blue-600 hover:underline">
  リンク
</a>
```

---

## 実装前セルフチェック（必須）

- [ ] セマンティック HTML を使用している
- [ ] すべてのインタラクティブ要素がキーボードで操作可能
- [ ] フォーム要素に適切なラベルがある（`htmlFor` + `id`）
- [ ] 色だけに依存せず、アイコンやテキストも使用している
- [ ] 画像に適切な `alt` テキストがある
- [ ] コントラスト比が基準を満たしている（4.5:1 or 3:1）
- [ ] ARIA 属性を適切に使用している（過剰使用していない）
- [ ] フォーカス表示が明確である
- [ ] スクリーンリーダーでテストした（または計画している）

---

## このルールの背景

> **「すべての人が平等にウェブにアクセスできる」ことが目的**

アクセシビリティの欠如は以下を引き起こす：

* 視覚障害者のアクセス不可
* キーボードユーザーの操作困難
* 認知障害者の理解困難
* 法的リスク（ADA、障害者差別解消法）
* SEO ランキングの低下
* ユーザーベースの制限

**統計データ：**
- 世界人口の 15%（約 10 億人）が何らかの障害を持つ
- WCAG 2.1 AA は多くの国で法的要件
- アクセシブルなサイトは SEO でも有利

**法的要件：**
- 🇺🇸 ADA (Americans with Disabilities Act)
- 🇪🇺 European Accessibility Act
- 🇯🇵 障害者差別解消法（改正 2024年4月施行）

---

## 運用上の扱い

本ルール違反は以下として扱う：

* 法的リスクを伴う重大な欠陥
* マージブロッカー
* 即時修正対象

**例外条項：**
- 既存コードは段階的移行対象（新規作成・変更時に適用）
- 技術的制約がある場合は代替手段を提供（WAI-ARIA）
- サードパーティライブラリの制約は Issue 起票

---

## テスト方法

### 自動テスト

**Storybook with a11y Addon：**
```bash
npm run storybook
```
- Accessibility パネルで自動チェック
- WCAG レベル、ルール違反を表示

**Lighthouse（Chrome DevTools）：**
1. DevTools を開く（F12）
2. Lighthouse タブを選択
3. Accessibility カテゴリのみ実行
4. スコア 90 以上を目標

**axe DevTools（ブラウザ拡張）：**
- [Chrome](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

### 手動テスト

**キーボードナビゲーション：**
- `Tab` キーですべての要素に到達できるか
- `Enter` / `Space` でボタンが動作するか
- `Esc` でモーダルが閉じるか
- `Arrow` キーでリストやタブを移動できるか

**スクリーンリーダーテスト：**
- **Windows:** NVDA（無料）
- **macOS:** VoiceOver（内蔵、`Cmd+F5` で起動）
- **iOS:** VoiceOver（設定 > アクセシビリティ）
- **Android:** TalkBack

**コントラストチェック：**
```bash
# Chrome DevTools
1. 要素を選択
2. Styles パネルでカラーピッカーをクリック
3. Contrast ratio を確認
```

### CI/CD 統合

```json
// package.json
{
  "scripts": {
    "test:a11y": "jest --testMatch '**/*.a11y.test.ts'"
  }
}
```

```tsx
// example.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 参考リンク

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Storybook A11y Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
