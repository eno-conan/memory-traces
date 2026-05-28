---
paths:
  - "app/**/page.tsx"
  - "app/**/layout.tsx"
  - "components/**/*.tsx"
---

# パフォーマンス最適化規約（必須）

## 対象範囲
本ルールは、以下すべてのフロントエンド実装に適用される。

- Next.js ページコンポーネント（`app/**/page.tsx`）
- Next.js レイアウトコンポーネント（`app/**/layout.tsx`）
- React コンポーネント（`components/**/*.tsx`）

**目標基準：Lighthouse Performance Score ≥ 90**

---

## 絶対ルール（違反禁止）

### 1. 画像最適化を必ず使用すること

**Next.js の画像最適化機能を無効化してはならない。**

❌ 禁止例：
```tsx
// app/gallery/page.tsx:232 の実例（修正が必要）
<Image
  src={img.url}
  alt={altText}
  fill
  className="object-cover"
  unoptimized  // ❌ 最適化を無効化 - 禁止！
/>
```

**影響：**
- LCP（Largest Contentful Paint）の悪化
- 不要な帯域幅の消費
- モバイルでの読み込み遅延
- Core Web Vitals スコア低下

✅ 必須：
```tsx
// 適切な画像最適化の使用
<Image
  src={img.url}
  alt="ギャラリー画像 1: 製品写真"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
  className="object-cover"
/>

// fill を使用する場合も sizes を指定
<div className="relative w-full h-64">
  <Image
    src={img.url}
    alt="ギャラリー画像"
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
  />
</div>

// 優先度の高い画像（Above the Fold）
<Image
  src="/hero.jpg"
  alt="メインビジュアル"
  width={1920}
  height={1080}
  priority  // LCP 対象画像には priority を指定
  sizes="100vw"
/>
```

**sizes 属性の重要性：**
- ビューポートサイズに応じて適切な画像サイズを読み込む
- 不要な大きい画像のダウンロードを防ぐ
- モバイルデータ通信の節約

---

### 2. コード分割とバンドルサイズを最適化すること

**初回ロードの JavaScript バンドルサイズは 200KB 以下であること。**

❌ 禁止例：
```tsx
// app/components/MFASetup.tsx:6 の実例（修正が必要）
import QRCode from 'qrcode';  // ❌ トップレベル import (~50KB)

export default function MFASetup({ onComplete }: MFASetupProps) {
  // QRコードは条件付きでしか使われないが、常にバンドルに含まれる
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  // ...
}
```

**影響：**
- First Load JS サイズの肥大化
- FCP（First Contentful Paint）の悪化
- TTI（Time to Interactive）の遅延
- モバイルでの初期表示遅延

✅ 必須：
```tsx
// 動的インポートによる遅延ロード
import dynamic from 'next/dynamic';

// QRCode を使用する部分のみ動的ロード
export default function MFASetup({ onComplete }: MFASetupProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const startMFASetup = async () => {
    setLoading(true);
    setError('');

    try {
      const totpSetupDetails = await setUpTOTP();
      const appName = 'LearnAuthApp';
      const setupUri = totpSetupDetails.getSetupUri(appName);

      // QRCode を使用する時点で動的にロード
      const QRCode = (await import('qrcode')).default;
      const qrCodeDataUrl = await QRCode.toDataURL(setupUri.href);

      setQrCodeUrl(qrCodeDataUrl);
      // ...
    } catch (err) {
      console.error('MFA setup error:', err);
    } finally {
      setLoading(false);
    }
  };
  // ...
}

// コンポーネント全体を動的ロードする場合
const DynamicMFASetup = dynamic(() => import('./MFASetup'), {
  loading: () => <div>読み込み中...</div>,
  ssr: false  // クライアントサイドでのみ必要な場合
});

// 使用側
<DynamicMFASetup onComplete={handleComplete} />
```

**バンドルサイズ確認方法：**
```bash
npm run build

# 出力例：
# Route (app)                              Size     First Load JS
# ┌ ○ /                                    5.02 kB        92.3 kB
# ├ ○ /dashboard                           1.23 kB        180 kB  ⚠️
# └ ○ /gallery                             2.45 kB        190 kB  ⚠️
```

---

### 3. レンダリング戦略を適切に選択すること

**Server Component を優先し、`'use client'` は必要最小限に留めること。**

❌ 禁止例：
```tsx
// app/dashboard/page.tsx:1 の実例（修正が必要）
'use client';  // ❌ ページ全体を Client Component 化

import { useState, useEffect } from 'react';
// ... 多数のインポート

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ... 多数の状態管理

  return (
    <div className="min-h-screen">
      {/* 大量の JSX */}
    </div>
  );
}
```

**影響：**
- 初期 JavaScript バンドルの肥大化
- ハイドレーションコストの増加
- FCP、TTI の悪化
- SEO への悪影響

✅ 必須：
```tsx
// Server Component としてページを実装
import { getCurrentUser } from '@/lib/auth';  // サーバーサイドで実行
import DashboardContent from './DashboardContent';  // Client Component

export default async function Dashboard() {
  // サーバーサイドで認証チェック
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Server Component では静的コンテンツをレンダリング
  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-bold">ダッシュボード</h1>
      <p>ユーザー: {user.email}</p>

      {/* インタラクティブな部分のみ Client Component */}
      <DashboardContent userId={user.id} />
    </div>
  );
}
```

```tsx
// components/DashboardContent.tsx
'use client';  // ✅ 必要な部分のみ Client Component

export default function DashboardContent({ userId }: { userId: string }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // クライアントサイドでのデータ取得
  }, [userId]);

  return (
    <div>
      {/* インタラクティブな UI */}
    </div>
  );
}
```

**Server/Client Component の判断基準：**
- **Server Component（デフォルト）：**
  - データフェッチング
  - バックエンド API 呼び出し
  - 機密情報の処理
  - 静的コンテンツ

- **Client Component（`'use client'` 必要）：**
  - `useState`, `useEffect` などの React Hooks
  - イベントハンドラー（onClick など）
  - ブラウザ API の使用
  - インタラクティブな UI

---

### 4. キャッシング戦略を適切に実装すること

**`fetch` には適切な `cache` または `revalidate` オプションを設定すること。**

❌ 禁止例（APIのパスはあくまでもサンプル）：
```tsx
// app/gallery/page.tsx:88, 99 の実例（修正が必要）
const response = await fetch('/api/r2-images', {
  cache: 'no-store'  // ❌ すべてのリクエストでキャッシュ無効
});

const response = await fetch('/api/r2-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* ... */ }),
  cache: 'no-store',  // ❌ API 負荷増加、リピート訪問の遅延
});
```

**影響：**
- API サーバーへの負荷増加
- リピート訪問時の遅延
- 不要なネットワークリクエスト
- データ転送量の増加

✅ 必須：
```tsx
// 静的データ（頻繁に更新されない）
const response = await fetch('/api/products', {
  cache: 'force-cache'  // ✅ ビルド時にキャッシュ、再デプロイまで保持
});

// 定期的に更新されるデータ
const response = await fetch('/api/r2-images', {
  next: { revalidate: 60 }  // ✅ 60秒ごとに再検証
});

// リアルタイム性が重要なデータ
const response = await fetch('/api/user-session', {
  cache: 'no-store'  // ✅ 常に最新データを取得（必要な場合のみ）
});

// POST リクエスト（デフォルトで cache: 'no-store'）
const response = await fetch('/api/r2-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'getGalleryImages' }),
  // POST は自動的に no-store なので明示不要
});

// クライアントサイドでの SWR パターン
import useSWR from 'swr';

function GalleryContent() {
  const { data, error, mutate } = useSWR(
    '/api/r2-images',
    fetcher,
    {
      revalidateOnFocus: false,  // フォーカス時の再検証を無効化
      revalidateOnReconnect: true,  // 再接続時は再検証
      dedupingInterval: 60000,  // 60秒間は重複リクエストを防ぐ
    }
  );

  return <div>{/* ... */}</div>;
}
```

**キャッシュ戦略の選び方：**
| データの性質 | キャッシュ設定 | 例 |
|-------------|--------------|-----|
| 完全に静的 | `cache: 'force-cache'` | 商品マスター、固定コンテンツ |
| 数分〜数時間で更新 | `next: { revalidate: 300 }` | ブログ記事、ギャラリー画像 |
| リアルタイム | `cache: 'no-store'` | ユーザーセッション、在庫状況 |

---

### 5. メモ化とパフォーマンス最適化を実装すること

**高頻度で再レンダリングされるコンポーネントには適切なメモ化を使用すること。**

❌ 禁止例：
```tsx
// 高コストな計算が毎回実行される
function ProductList({ products }: { products: Product[] }) {
  // ❌ 毎レンダリング時に再計算
  const expensiveData = products.map(p => ({
    ...p,
    formattedPrice: formatCurrency(p.price),
    discount: calculateDiscount(p.price, p.category),
    rating: aggregateReviews(p.reviews)
  }));

  return (
    <div>
      {expensiveData.map(item => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}

// 親コンポーネントの再レンダリングで子も再レンダリング
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <ExpensiveComponent data={someData} />  {/* ❌ 毎回再レンダリング */}
    </div>
  );
}
```

✅ 必須：
```tsx
// useMemo で高コストな計算をメモ化
function ProductList({ products }: { products: Product[] }) {
  const expensiveData = useMemo(() => {
    return products.map(p => ({
      ...p,
      formattedPrice: formatCurrency(p.price),
      discount: calculateDiscount(p.price, p.category),
      rating: aggregateReviews(p.reviews)
    }));
  }, [products]);  // products が変更された時のみ再計算

  return (
    <div>
      {expensiveData.map(item => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}

// React.memo で不要な再レンダリングを防ぐ
const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data
}: {
  data: Data
}) {
  return (
    <div>
      {/* 重い処理 */}
    </div>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数（オプション）
  return prevProps.data.id === nextProps.data.id;
});

// useCallback でコールバックをメモ化
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);  // 依存配列が空なので、関数は一度だけ作成される

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <ExpensiveComponent data={someData} onClick={handleClick} />
    </div>
  );
}
```

**メモ化の判断基準：**
- **useMemo：** 高コストな計算（配列処理、複雑な数値計算、フィルタリング）
- **React.memo：** 重いコンポーネント、頻繁に再レンダリングされる親を持つコンポーネント
- **useCallback：** 子コンポーネントに渡すコールバック（子が React.memo の場合）

**注意：** 過剰なメモ化は逆効果。以下の場合は不要：
- 軽量な計算
- プリミティブ値の比較
- 再レンダリング頻度が低いコンポーネント

---

### 6. フォント最適化を実装すること（良好な例）

**`next/font` を使用してフォントを最適化すること。**

✅ 良好な実装例（app/layout.tsx:2-11）：
```tsx
// app/layout.tsx
import { Zen_Kurenaido } from "next/font/google";

const zenKurenaido = Zen_Kurenaido({
  variable: "--font-zen-kurenaido",
  subsets: ["latin"],
  weight: "400",
  display: "swap",  // ✅ FOUT を防ぐ
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${zenKurenaido.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**フォント最適化のベストプラクティス：**
- `next/font/google` または `next/font/local` を使用
- `display: "swap"` で FOUT（Flash of Unstyled Text）を防ぐ
- `subsets` を指定して不要な文字セットを除外
- `preload: true` でクリティカルなフォントを事前読み込み

❌ 禁止例：
```tsx
// CDN からのフォント読み込み
<link
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

---

## 実装前セルフチェック（必須）

### 画像最適化
- [ ] `next/image` を使用している
- [ ] `unoptimized={true}` を使用していない
- [ ] `width` と `height` を指定している（または `fill` + `sizes`）
- [ ] レスポンシブな `sizes` 属性を指定している
- [ ] Above the Fold の画像には `priority` を指定している
- [ ] Below the Fold の画像には `loading="lazy"` を指定している

### コード分割
- [ ] `npm run build` 後の First Load JS < 200KB
- [ ] 条件付きで使用するライブラリは動的 import している
- [ ] 大きなコンポーネントは `next/dynamic` で遅延ロードしている

### レンダリング戦略
- [ ] Server Component を優先している
- [ ] `'use client'` は必要最小限のスコープで使用している
- [ ] インタラクティブな部分のみ Client Component にしている

### キャッシング
- [ ] `fetch` に適切な `cache` または `next.revalidate` を設定している
- [ ] 静的データには `cache: 'force-cache'` または `revalidate` を使用している
- [ ] `cache: 'no-store'` は本当に必要な場合のみ使用している

### メモ化
- [ ] 高コストな計算には `useMemo` を使用している
- [ ] 頻繁に再レンダリングされる重いコンポーネントには `React.memo` を使用している
- [ ] 子コンポーネントに渡すコールバックには `useCallback` を使用している

### フォント
- [ ] `next/font` を使用してフォントを最適化している
- [ ] `display: "swap"` を設定している

---

## このルールの背景

> **「すべてのユーザーに高速で快適な体験を提供する」ことが目的**

パフォーマンスの欠如は以下を引き起こす：

* ユーザー離脱率の増加（1秒遅延 = 7% コンバージョン低下）
* Core Web Vitals スコアの低下
* SEO ランキングの低下（Google はページ速度を評価指標に使用）
* モバイルユーザーの体験悪化
* サーバーコストの増加

**統計データ：**
- ページ読み込み時間が 1秒から3秒に増えると、直帰率が 32% 増加
- ページ読み込み時間が 1秒から5秒に増えると、直帰率が 90% 増加
- モバイルサイトの 53% は、読み込みに 3秒以上かかると放棄される

**Core Web Vitals 目標値：**
- **LCP（Largest Contentful Paint）：** < 2.5秒
- **FID（First Input Delay）：** < 100ms
- **CLS（Cumulative Layout Shift）：** < 0.1

---

## 運用上の扱い

本ルール違反は以下として扱う：

* パフォーマンス劣化を引き起こす重大な欠陥
* Lighthouse Performance Score < 90 はマージブロッカー
* 即時修正対象

**例外条項：**
- 既存コードは段階的移行対象（新規作成・変更時に適用）
- 技術的制約がある場合は代替手段を提供（例：外部 CDN 画像の場合の loader 設定）
- サードパーティライブラリの制約は Issue 起票

---

## テスト方法

### 自動テスト

**Lighthouse（Chrome DevTools）：**
```bash
npm run build
npm run start

# ブラウザで http://localhost:3000 を開く
# DevTools（F12）> Lighthouse タブ
# Performance カテゴリのみ実行
# スコア 90 以上を目標
```

**Lighthouse CI（コマンドライン）：**
```bash
npm run build

# デスクトップ
npx lighthouse http://localhost:3000 \
  --preset=desktop \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-report.json

# モバイル
npx lighthouse http://localhost:3000 \
  --preset=mobile \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-mobile-report.json
```

**Next.js バンドル分析：**
```bash
npm run build

# 出力を確認
# Route (app)                              Size     First Load JS
# ✅ First Load JS が 200KB 以下であることを確認
```

### 手動テスト

**Chrome DevTools Performance タブ：**
1. DevTools を開く（F12）
2. Performance タブを選択
3. CPU を 4x または 6x slowdown に設定
4. 記録開始 → ページをリロード → 記録停止
5. FCP、LCP、TTI を確認

**Network タブでの確認：**
1. DevTools > Network タブ
2. Fast 3G または Slow 3G に設定
3. ページをリロード
4. 画像サイズ、総転送量を確認

**Core Web Vitals 確認：**
```bash
# Chrome 拡張機能 "Web Vitals" をインストール
# https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma

# または PageSpeed Insights
# https://pagespeed.web.dev/
```

### CI/CD 統合

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "analyze": "ANALYZE=true next build",
    "lighthouse": "lighthouse http://localhost:3000 --preset=desktop --only-categories=performance --output=json --output-path=./lighthouse-report.json"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^15.0.0"
  }
}
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js config
});
```

---

## 参考リンク

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [React useMemo](https://react.dev/reference/react/useMemo)
- [React.memo](https://react.dev/reference/react/memo)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/overview/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
