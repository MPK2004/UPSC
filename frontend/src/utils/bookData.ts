import { supabase } from './supabaseClient';
import { Book, Chapter, ByteCard, PYQQuestion } from '../types';

const NO_CLIENT_ERROR = 'Supabase is not configured (missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).';

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function listBooks(): Promise<{ data: Book[]; error: string | null }> {
  if (!supabase) return { data: [], error: NO_CLIENT_ERROR };
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Book[], error: null };
}

export async function getBookWithChapters(bookId: string): Promise<{
  book: Book | null;
  chapters: Chapter[];
  error: string | null;
}> {
  if (!supabase) return { book: null, chapters: [], error: NO_CLIENT_ERROR };

  const [bookRes, chaptersRes] = await Promise.all([
    supabase.from('books').select('*').eq('id', bookId).single(),
    supabase.from('chapters').select('*').eq('book_id', bookId).order('chapter_number'),
  ]);

  if (bookRes.error) return { book: null, chapters: [], error: bookRes.error.message };
  if (chaptersRes.error) return { book: bookRes.data as Book, chapters: [], error: chaptersRes.error.message };

  return {
    book: bookRes.data as Book,
    chapters: (chaptersRes.data ?? []) as Chapter[],
    error: null,
  };
}

export async function getChapter(chapterId: string): Promise<{ chapter: Chapter | null; error: string | null }> {
  if (!supabase) return { chapter: null, error: NO_CLIENT_ERROR };
  const { data, error } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
  if (error) return { chapter: null, error: error.message };
  return { chapter: data as Chapter, error: null };
}

export async function getCardsForChapter(chapterId: string): Promise<{ data: ByteCard[]; error: string | null }> {
  if (!supabase) return { data: [], error: NO_CLIENT_ERROR };
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('sort_order');
  if (error) return { data: [], error: error.message };
  const cards = (data ?? []).map((c: any) => ({
    ...c,
    bullet_points: normalizeArray<string>(c.bullet_points),
  })) as ByteCard[];
  return { data: cards, error: null };
}

export async function getPyqsForChapter(chapterId: string): Promise<{ data: PYQQuestion[]; error: string | null }> {
  if (!supabase) return { data: [], error: NO_CLIENT_ERROR };
  const { data, error } = await supabase.from('pyqs').select('*').eq('chapter_id', chapterId);
  if (error) return { data: [], error: error.message };
  const pyqs = (data ?? []).map((q: any) => ({
    ...q,
    options: normalizeArray<string>(q.options),
  })) as PYQQuestion[];
  return { data: pyqs, error: null };
}

export async function getTotalCardCount(): Promise<{ count: number; error: string | null }> {
  if (!supabase) return { count: 0, error: NO_CLIENT_ERROR };
  const { count, error } = await supabase.from('cards').select('id', { count: 'exact', head: true });
  if (error) return { count: 0, error: error.message };
  return { count: count ?? 0, error: null };
}
