import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
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
  const [chapters] = useState<Chapter[]>(CHAPTERS);
  const [cards, setCards] = useState<ByteCard[]>(BYTE_REEL_CARDS);
  const [masteredBrickIds, setMasteredBrickIds] = useState<string[]>(getMasteredBricks());
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState<boolean>(false);

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
    <div className="min-h-screen w-full bg-slate-950 text-gray-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Mobile Top Header Overlay */}
      <Header
        openChapterDrawer={() => setIsChapterDrawerOpen(true)}
        selectedChapterCount={selectedChapterIds.length}
        selectedSubject={selectedSubject}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'reels' && (
          <ReelFeed
            cards={cards}
            onBrickEarned={handleBrickEarned}
            selectedChapterCount={selectedChapterIds.length}
          />
        )}

        {activeTab === 'test' && (
          <div className="pt-14 pb-20">
            <TestingArena
              selectedChapterIds={selectedChapterIds}
              selectedSubject={selectedSubject}
              onBrickUnlocked={handleBrickEarned}
            />
          </div>
        )}

        {activeTab === 'castle' && (
          <div className="pt-16 pb-24">
            <CastleBuilder
              brickCount={masteredBrickIds.length}
              totalAvailableBricks={cards.length}
              masteredIds={masteredBrickIds}
            />
          </div>
        )}
      </main>

      {/* Mobile Chapter Selector Bottom Sheet Drawer */}
      <ChapterSelector
        chapters={chapters}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        selectedChapterIds={selectedChapterIds}
        setSelectedChapterIds={setSelectedChapterIds}
        isOpen={isChapterDrawerOpen}
        onClose={() => setIsChapterDrawerOpen(false)}
      />

      {/* Pinned Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNotes={() => setIsNotesOpen(true)}
        brickCount={masteredBrickIds.length}
      />

      {/* Saved Notes Drawer Modal */}
      <NotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />
    </div>
  );
};

export default App;
