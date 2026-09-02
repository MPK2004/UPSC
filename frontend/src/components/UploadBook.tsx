import React, { useState } from 'react';
import { uploadBook } from '../utils/bookData';
import { ArrowLeft, UploadCloud, AlertTriangle, Loader2, FileText } from 'lucide-react';

interface UploadBookProps {
  onBack: () => void;
  onUploaded: (bookId: string) => void;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB — matches the Supabase bucket's file_size_limit
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const LAST_UPLOAD_KEY = 'upsc_reelcastle_last_upload';

const SUBJECTS = [
  'Geography', 'Environment', 'Polity', 'Economy', 'History',
  'Science', 'Society', 'International Relations', 'Agriculture', 'Security',
];

function cooldownRemainingMs(): number {
  try {
    const last = Number(localStorage.getItem(LAST_UPLOAD_KEY) || '0');
    return Math.max(0, COOLDOWN_MS - (Date.now() - last));
  } catch (e) {
    return 0;
  }
}

export const UploadBook: React.FC<UploadBookProps> = ({ onBack, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Geography');
  const [customSubject, setCustomSubject] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(cooldownRemainingMs());

  const effectiveSubject = subject === 'Other' ? customSubject : subject;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] || null;
    setError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (picked.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      setFile(null);
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setError('File is too large (50MB limit).');
      setFile(null);
      return;
    }
    setFile(picked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const remaining = cooldownRemainingMs();
    if (remaining > 0) {
      setCooldownMs(remaining);
      return;
    }
    if (!file) {
      setError('Choose a PDF file first.');
      return;
    }
    if (!title.trim()) {
      setError('Give the book a title.');
      return;
    }

    setUploading(true);
    const res = await uploadBook({ file, title: title.trim(), subject: effectiveSubject.trim() });
    setUploading(false);

    if (res.error || !res.book) {
      setError(res.error || 'Upload failed.');
      return;
    }

    try {
      localStorage.setItem(LAST_UPLOAD_KEY, String(Date.now()));
    } catch (e) {}
    onUploaded(res.book.id);
  };

  const cooldownActive = cooldownMs > 0;
  const cooldownMinutes = Math.ceil(cooldownMs / 60000);

  return (
    <div className="max-w-2xl mx-auto p-4 pt-16 pb-24 space-y-4">
      <button
        onClick={onBack}
        aria-label="Back to library"
        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> Library
      </button>

      <h1 className="text-xl font-extrabold text-white font-heading">Upload a Book</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="upload-file" className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
            PDF File
          </label>
          <label
            htmlFor="upload-file"
            className="flex items-center gap-2 p-4 rounded-2xl border border-dashed border-gray-700 bg-slate-900/60 text-sm text-gray-300 cursor-pointer hover:border-gray-600"
          >
            {file ? <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" /> : <UploadCloud className="w-4 h-4 text-gray-500 flex-shrink-0" />}
            <span className="truncate">{file ? file.name : 'Choose a PDF file…'}</span>
          </label>
          <input
            id="upload-file"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="upload-title" className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
            Title
          </label>
          <input
            id="upload-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. NCERT Class 11 Geography Part 2"
            className="w-full p-3 rounded-xl bg-slate-900/60 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="upload-subject" className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
            Subject
          </label>
          <select
            id="upload-subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-900/60 border border-gray-800 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Other">Other…</option>
          </select>
          {subject === 'Other' && (
            <input
              type="text"
              value={customSubject}
              onChange={e => setCustomSubject(e.target.value)}
              placeholder="Specify subject"
              className="w-full p-3 rounded-xl bg-slate-900/60 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {cooldownActive && (
          <p className="text-xs text-gray-500 text-center">
            You just uploaded a book — please wait {cooldownMinutes} more minute{cooldownMinutes === 1 ? '' : 's'} before uploading another.
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || cooldownActive}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:shadow-none active:scale-98 transition-all"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload & Queue for Processing'}
        </button>
      </form>
    </div>
  );
};
