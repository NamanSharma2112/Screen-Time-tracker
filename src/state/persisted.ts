import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  use: () => T;
  /** Resolves once the saved value has been read from disk. */
  ready: Promise<void>;
  reset: () => void;
};

const registry = new Set<Store<unknown>>();

/** A tiny global store persisted to AsyncStorage, shared by every component that reads it. */
export function createPersistedStore<T>(key: string, initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  const ready = AsyncStorage.getItem(key)
    .then((raw) => {
      if (raw) {
        state = JSON.parse(raw);
        emit();
      }
    })
    .catch(() => {});

  const store: Store<T> = {
    get: () => state,
    set: (next) => {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
      emit();
    },
    use: () => useSyncExternalStore(subscribe, () => state),
    ready,
    reset: () => {
      state = initial;
      emit();
    },
  };
  registry.add(store as Store<unknown>);
  return store;
}

/** Puts every store back to its initial value (after AsyncStorage has been cleared). */
export function resetAllStores() {
  registry.forEach((s) => s.reset());
}
