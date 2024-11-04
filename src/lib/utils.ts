import { clsx, type ClassValue } from "clsx";
import { Metadata } from "next";
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

export function constructMetadata({
  title = "QuestRag - the SaaS for readers",
  description = "QuestRag is a open-source software to make chatting to your PDF files easy.",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
  description,
  openGraph : {
    title,
    description,
    images : [
      {
        url : image
      }      
    ]
  },
  twitter : {
    card : "summary_large_image",
    title,
    description,
    images : [image],
    creator : "@devansh1413@gamil.com"
  },
  icons,
  metadataBase : new URL("https://quest-rag.vercel.app"),
  themeColor : "#FFF",
  ...(noIndex && {
    robots : {
      follow : false,
      index : false
    }
  })
  }
};
