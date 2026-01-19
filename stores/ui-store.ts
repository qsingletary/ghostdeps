import { create } from "zustand";
import type { DependencyNode } from "@/modules/packages";

interface UIState {
  selectedNode: DependencyNode | null;
  maxDepth: number;
  setSelectedNode: (node: DependencyNode | null) => void;
  setMaxDepth: (depth: number) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNode: null,
  maxDepth: 5,

  setSelectedNode: (node) => set({ selectedNode: node }),

  setMaxDepth: (depth) => set({ maxDepth: Math.min(Math.max(1, depth), 10) }),

  reset: () => set({ selectedNode: null, maxDepth: 5 }),
}));
