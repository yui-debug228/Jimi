import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Prepend Vite base URL to public asset paths */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

/** Resolve image URL: base64 string or asset path */
export function resolveImage(url: string): string {
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return assetUrl(url);
}
