interface SubjectPalette {
  bg: string;
  text: string;
  border: string;
}

const PALETTE: SubjectPalette[] = [
  { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/40' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/40' },
];

export function subjectColor(subject: string | null | undefined): SubjectPalette {
  const key = subject || 'General';
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
