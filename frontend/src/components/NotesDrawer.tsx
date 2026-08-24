import React, { useState } from 'react';
import { SavedNote } from '../types';
import { getSavedNotes, deleteNote } from '../utils/supabaseClient';
import { X, Trash2, StickyNote, Bookmark, Sparkles, BookOpen } from 'lucide-react';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<SavedNote[]>(getSavedNotes());

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    deleteNote(id);
    setNotes(getSavedNotes());
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-gray-800 p-5 overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white">Saved Notes & Highlights</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-slate-900 border border-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
            <Bookmark className="w-10 h-10 text-gray-600" />
            <p className="text-sm font-semibold text-gray-400">No Saved Notes Yet</p>
            <p className="text-xs text-gray-500 max-w-xs">
              Tap "Save Note" on any ByteReel card to collect high-yield points for quick revision.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="p-4 rounded-2xl bg-slate-900 border border-gray-800 space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded badge-gold">
                    {note.subject}
                  </span>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-gray-500 hover:text-rose-400 p-1"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white">{note.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>

                <div className="text-[10px] text-gray-500 pt-1">
                  Saved: {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
