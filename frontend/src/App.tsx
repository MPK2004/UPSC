import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChapterSelector } from './components/ChapterSelector';
import { ReelFeed } from './components/ReelFeed';
import { CastleBuilder } from './components/CastleBuilder';
import { TestingArena } from './components/TestingArena';
import { NotesDrawer } from './components/NotesDrawer';
import { Chapter, ByteCard } from './types';
import { CHAPTERS, BYTE_REEL_CARDS } from './data/upscData';
import { getMasteredBricks } from './utils/supabaseClient';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reels' | 'test' | 'castle'>('reels');
  const [selectedSubject, setSelectedSubject] = useState<'Geography' | 'Environment' | 'Combined'>('Combined');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>(CHAPTERS);
  const [cards, setCards] = useState<ByteCard[]>(BYTE_REEL_CARDS);
  const [masteredBrickIds, setMasteredBrickIds] = useState<string[]>(getMasteredBricks());
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);

  // Filter byte cards locally for fast instantaneous scrolling & Vercel deployment
  useEffect(() => {
    let filtered = BYTE_REEL_CARDS;

    if (selectedChapterIds.length > 0) {
      const active = selectedChapterIds.slice(0, 2);
      filtered = filtered.filter(c => active.includes(c.chapter_id));
    } else if (selectedSubject && selectedSubject.toLowerCase() !== 'combined') {
      filtered = filtered.filter(c => c.subject.toLowerCase() === selectedSubject.toLowerCase());
    }

    setCards(filtered);
  }, [selectedChapterIds, selectedSubject]);

  const handleBrickEarned = () => {
    setMasteredBrickIds(getMasteredBricks());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        brickCount={masteredBrickIds.length}
        openNotes={() => setIsNotesOpen(true)}
        selectedChapterCount={selectedChapterIds.length}
      />

      {/* Chapter Focus Selector Bar (Visible in Reels & Test Mode) */}
      {activeTab !== 'castle' && (
        <ChapterSelector
          chapters={chapters}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedChapterIds={selectedChapterIds}
          setSelectedChapterIds={setSelectedChapterIds}
        />
      )}

      {/* Main App View Switcher */}
      <main className="flex-1">
        {activeTab === 'reels' && (
          <ReelFeed
            cards={cards}
            onBrickEarned={handleBrickEarned}
            selectedChapterCount={selectedChapterIds.length}
          />
        )}

        {activeTab === 'test' && (
          <TestingArena
            selectedChapterIds={selectedChapterIds}
            selectedSubject={selectedSubject}
            onBrickUnlocked={handleBrickEarned}
          />
        )}

        {activeTab === 'castle' && (
          <CastleBuilder
            brickCount={masteredBrickIds.length}
            totalAvailableBricks={12}
            masteredIds={masteredBrickIds}
          />
        )}
      </main>

      {/* Notes Drawer Modal */}
      <NotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />
    </div>
  );
};

export default App;
