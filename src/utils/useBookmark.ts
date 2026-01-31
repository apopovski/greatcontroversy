import { useState } from "react";

const KEY = "book-bookmark";

export type Bookmark = {
  chapter: number;
  anchor?: string; // element id within chapter
  scrollFrac?: number; // 0..1 fraction within chapter
  snippet?: string; // small text snippet for fuzzy matching
  created?: number;
};

export function useBookmark() {
  const [bookmark, setBookmark] = useState<Bookmark | null>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? JSON.parse(saved) as Bookmark : null;
    } catch {
      return null;
    }
  });

  function saveBookmark(chapter: number, opts?: { anchor?: string; scrollFrac?: number; snippet?: string }) {
    try {
      const bm: Bookmark = { chapter, anchor: opts?.anchor, scrollFrac: opts?.scrollFrac, snippet: opts?.snippet, created: Date.now() };
      setBookmark(bm);
      localStorage.setItem(KEY, JSON.stringify(bm));
    } catch {
      // ignore
    }
  }

  function clearBookmark() {
    try {
      setBookmark(null);
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }

  return { bookmark, saveBookmark, clearBookmark };
}
