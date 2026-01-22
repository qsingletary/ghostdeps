import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HealthLevel } from "@/modules/packages";

export interface BookmarkedPackage {
  name: string;
  version: string;
  healthScore: number;
  healthLevel: HealthLevel;
  bookmarkedAt: string;
}

interface BookmarkState {
  bookmarks: BookmarkedPackage[];
  addBookmark: (pkg: Omit<BookmarkedPackage, "bookmarkedAt">) => void;
  removeBookmark: (name: string) => void;
  isBookmarked: (name: string) => boolean;
  clearAll: () => void;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (pkg) =>
        set((state) => {
          if (state.bookmarks.some((b) => b.name === pkg.name)) {
            return state;
          }
          return {
            bookmarks: [
              ...state.bookmarks,
              { ...pkg, bookmarkedAt: new Date().toISOString() },
            ],
          };
        }),

      removeBookmark: (name) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.name !== name),
        })),

      isBookmarked: (name) => get().bookmarks.some((b) => b.name === name),

      clearAll: () => set({ bookmarks: [] }),
    }),
    {
      name: "ghostdeps-bookmarks",
    },
  ),
);
