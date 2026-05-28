'use client';

const MODAL_COUNT_ATTR = 'data-modal-count';

/**
 * モーダル表示時にbodyのスクロールをロックする。
 * カウンター方式で複数モーダルが同時に開いていても正しく管理する。
 */
export function lockBodyScroll(): void {
  const current = parseInt(document.body.getAttribute(MODAL_COUNT_ATTR) ?? '0', 10);
  document.body.setAttribute(MODAL_COUNT_ATTR, String(current + 1));
  document.body.classList.add('overflow-hidden');
}

/**
 * モーダルを閉じる際にbodyのスクロールロックを解除する。
 * すべてのモーダルが閉じた場合のみスクロールを復元する。
 */
export function unlockBodyScroll(): void {
  const current = parseInt(document.body.getAttribute(MODAL_COUNT_ATTR) ?? '0', 10);
  const next = Math.max(0, current - 1);
  if (next === 0) {
    document.body.classList.remove('overflow-hidden');
    document.body.removeAttribute(MODAL_COUNT_ATTR);
  } else {
    document.body.setAttribute(MODAL_COUNT_ATTR, String(next));
  }
}
