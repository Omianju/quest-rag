import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  // Detecting if running on the server
  const isServer = typeof window === "undefined";

  // Check if we're on Vercel (server) in production
  if (isServer && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${path}`;
  }

  // Fallback to localhost if we're on the server and VERCEL_URL is not defined
  const localUrl = `http://localhost:${process.env.PORT || 3000}${path}`;

  // Return the local URL for server-side local development and client-side calls
  return isServer ? localUrl : `${window.location.origin}${path}`;
}

