import type { Meta, StoryObj } from "@storybook/react";
import { MemoryCard } from "./MemoryCard";

const meta = {
  title: "Components/MemoryCard",
  component: MemoryCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "compact", "detailed"],
    },
  },
} satisfies Meta<typeof MemoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトスタイルの思い出カード
 * 標準的な使い方で、バランスの取れたデザインです。
 */
export const Default: Story = {
  args: {
    title: "初めての富士山登山",
    description:
      "2024年夏、念願の富士山に登りました。ご来光を見たときの感動は一生忘れません。",
    date: "2024-08-15",
    variant: "default",
  },
};

/**
 * コンパクトスタイルの思い出カード
 * 省スペースで表示したい場合に適しています。
 */
export const Compact: Story = {
  args: {
    title: "家族での温泉旅行",
    description: "久しぶりに家族全員で箱根温泉に行きました。",
    date: "2024-07-20",
    variant: "compact",
  },
};

/**
 * 詳細スタイルの思い出カード
 * より目立たせたい重要な思い出に使用します。
 */
export const Detailed: Story = {
  args: {
    title: "結婚記念日のディナー",
    description:
      "10周年の結婚記念日に、思い出の場所でディナーをしました。二人で過ごした10年を振り返り、これからの10年に思いを馳せる素敵な時間でした。",
    date: "2024-06-10",
    variant: "detailed",
  },
};

/**
 * 日本語フォントの表示確認
 * Noto Sans JPフォントがきれいに表示されることを確認できます。
 */
export const JapaneseFont: Story = {
  args: {
    title: "日本語フォントのテスト - ひらがな・カタカナ・漢字",
    description:
      "このカードはNoto Sans JPフォントを使用しています。ひらがな、カタカナ、漢字がすべて美しく表示されます。モダンで読みやすいフォントです。",
    date: "2025-01-16",
    variant: "detailed",
  },
};

/**
 * 長文の思い出カード
 * テキストが長い場合のレイアウトを確認できます。
 */
export const LongDescription: Story = {
  args: {
    title: "海外旅行の思い出",
    description:
      "初めてのヨーロッパ旅行。パリの美しい街並み、ロンドンの歴史的建造物、ローマの古代遺跡。それぞれの都市で新しい発見があり、異文化に触れることの素晴らしさを実感しました。現地の人々との交流も忘れられない思い出です。",
    date: "2024-09-01",
    variant: "default",
  },
};

/**
 * クリック可能なカード
 * onClick イベントを設定した例です。
 */
export const Clickable: Story = {
  args: {
    title: "クリックしてみてください",
    description: "このカードはクリック可能です。実際にクリックするとアラートが表示されます。",
    date: "2025-01-16",
    variant: "default",
    onClick: () => alert("カードがクリックされました！"),
  },
};
