import { useState, useCallback, useSyncExternalStore } from 'react';

const FAVORITES_KEY = 'favorite_modules';

export interface FavoriteModule {
  taskId: string;
  taskTitle: string;
  courseId: string;
  courseTitle: string;
  phaseId: string;
  phaseTitle: string;
  savedAt: string;
}

let listeners: Array<() => void> = [];
function emitChange() { listeners.forEach(l => l()); }

function getSnapshot(): FavoriteModule[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

export function useFavoriteModules() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isFavorited = useCallback((taskId: string) => {
    return favorites.some(f => f.taskId === taskId);
  }, [favorites]);

  const toggleFavorite = useCallback((module: Omit<FavoriteModule, 'savedAt'>) => {
    const current = getSnapshot();
    const exists = current.findIndex(f => f.taskId === module.taskId);
    if (exists >= 0) {
      current.splice(exists, 1);
    } else {
      current.unshift({ ...module, savedAt: new Date().toISOString() });
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(current));
    emitChange();
  }, []);

  const removeFavorite = useCallback((taskId: string) => {
    const current = getSnapshot().filter(f => f.taskId !== taskId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(current));
    emitChange();
  }, []);

  return { favorites, isFavorited, toggleFavorite, removeFavorite };
}
