import { createPersistedStore } from './persisted';

export type Note = { id: string; text: string; createdAt: number; done: boolean };

/** Brain dump: park a distracting thought in two taps and get back to what you were doing. */
export const notesStore = createPersistedStore<Note[]>('braindump.v1', []);

export function addNote(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  notesStore.set((prev) => [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      createdAt: Date.now(),
      done: false,
    },
    ...prev,
  ]);
}

export function toggleNote(id: string) {
  notesStore.set((prev) => prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
}

export function deleteNote(id: string) {
  notesStore.set((prev) => prev.filter((n) => n.id !== id));
}

export function clearDoneNotes() {
  notesStore.set((prev) => prev.filter((n) => !n.done));
}
