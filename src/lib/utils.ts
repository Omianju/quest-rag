import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path; // We are on client side
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`; // We are on server side and application is deployed on vercel.
  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
}
