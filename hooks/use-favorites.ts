"use client";

import { useSyncExternalStore } from "react";
import { favoritesStore, recentStore } from "@/lib/client/id-store";

export function useFavoriteIds(): readonly string[] {
  return useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  );
}

export function useRecentIds(): readonly string[] {
  return useSyncExternalStore(
    recentStore.subscribe,
    recentStore.getSnapshot,
    recentStore.getServerSnapshot,
  );
}

export { favoritesStore, recentStore };
