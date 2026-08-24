import { createClient } from '@supabase/supabase-js';
import { SavedNote } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[UPSC ReelCastle] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

const STORAGE_NOTES_KEY = 'upsc_reelcastle_notes';
const STORAGE_BRICKS_KEY = 'upsc_reelcastle_bricks';
const STORAGE_BOOKMARKS_KEY = 'upsc_reelcastle_bookmarks';

export const getSavedNotes = (): SavedNote[] => {
  try {
    const data = localStorage.getItem(STORAGE_NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveNote = (note: Omit<SavedNote, 'id' | 'created_at'>): SavedNote => {
  const notes = getSavedNotes();
  const newNote: SavedNote = {
    ...note,
    id: `note-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  notes.unshift(newNote);
  localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));

  try {
    supabase.from('upsc_notes').insert([newNote]).then();
  } catch (e) {}

  return newNote;
};

export const deleteNote = (id: string) => {
  const notes = getSavedNotes().filter(n => n.id !== id);
  localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
};

export const getMasteredBricks = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_BRICKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addMasteredBrick = (cardId: string): string[] => {
  const bricks = getMasteredBricks();
  if (!bricks.includes(cardId)) {
    bricks.push(cardId);
    localStorage.setItem(STORAGE_BRICKS_KEY, JSON.stringify(bricks));
  }
  return bricks;
};

export const getBookmarks = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const toggleBookmark = (cardId: string): string[] => {
  let bookmarks = getBookmarks();
  if (bookmarks.includes(cardId)) {
    bookmarks = bookmarks.filter(id => id !== cardId);
  } else {
    bookmarks.push(cardId);
  }
  localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return bookmarks;
};
