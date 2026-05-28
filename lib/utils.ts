import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// tailwind + clsx でクラス名を結合するユーティリティ
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
