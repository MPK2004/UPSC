import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { BookList } from './components/BookList';
import { BookDetail } from './components/BookDetail';
import { ChapterDetail } from './components/ChapterDetail';
import { ChapterCardsView } from './components/ChapterCardsView';
import { ChapterQuizView } from './components/ChapterQuizView';
import { CastleBuilder } from './components/CastleBuilder';
import { NotesDrawer } from './components/NotesDrawer';
import { getMasteredBricks } from './utils/supabaseClient';

type Screen =
  | { kind: 'library' }
  | { kind: 'bookDetail'; bookId: string }
  | { kind: 'chapterDetail'; bookId: string; chapterId: string; chapterTitle: string }
  | { kind: 'studyCards'; bookId: string; chapterId: string; chapterTitle: string }
  | { kind: 'takeQuiz'; bookId: string; chapterId: string; chapterTitle: string }
  | { kind: 'castle' };

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>({ kind: 'library' });
  const [masteredBrickIds, setMasteredBrickIds] = useState<string[]>(getMasteredBricks());
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);

  const handleBrickEarned = () => {
    setMasteredBrickIds(getMasteredBricks());
  };

  const bottomNavTab: 'library' | 'castle' = screen.kind === 'castle' ? 'castle' : 'library';

  return (
    <div className="min-h-screen w-full bg-slate-950 text-gray-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Mobile Top Header Overlay */}
      <Header />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {screen.kind === 'library' && (
          <BookList onSelectBook={bookId => setScreen({ kind: 'bookDetail', bookId })} />
        )}

        {screen.kind === 'bookDetail' && (
          <BookDetail
            bookId={screen.bookId}
            onBack={() => setScreen({ kind: 'library' })}
            onSelectChapter={(chapterId, chapterTitle) =>
              setScreen({ kind: 'chapterDetail', bookId: screen.bookId, chapterId, chapterTitle })}
          />
        )}

        {screen.kind === 'chapterDetail' && (
          <ChapterDetail
            chapterId={screen.chapterId}
            onBack={() => setScreen({ kind: 'bookDetail', bookId: screen.bookId })}
            onStudyCards={() =>
              setScreen({ kind: 'studyCards', bookId: screen.bookId, chapterId: screen.chapterId, chapterTitle: screen.chapterTitle })}
            onTakeQuiz={() =>
              setScreen({ kind: 'takeQuiz', bookId: screen.bookId, chapterId: screen.chapterId, chapterTitle: screen.chapterTitle })}
          />
        )}

        {screen.kind === 'studyCards' && (
          <ChapterCardsView
            chapterId={screen.chapterId}
            onBack={() =>
              setScreen({ kind: 'chapterDetail', bookId: screen.bookId, chapterId: screen.chapterId, chapterTitle: screen.chapterTitle })}
            onBrickEarned={handleBrickEarned}
          />
        )}

        {screen.kind === 'takeQuiz' && (
          <ChapterQuizView
            chapterId={screen.chapterId}
            chapterTitle={screen.chapterTitle}
            onBack={() =>
              setScreen({ kind: 'chapterDetail', bookId: screen.bookId, chapterId: screen.chapterId, chapterTitle: screen.chapterTitle })}
            onBrickUnlocked={handleBrickEarned}
          />
        )}

        {screen.kind === 'castle' && (
          <div className="pt-16 pb-24">
            <CastleBuilder
              brickCount={masteredBrickIds.length}
              masteredIds={masteredBrickIds}
            />
          </div>
        )}
      </main>

      {/* Pinned Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={bottomNavTab}
        setActiveTab={tab => setScreen({ kind: tab })}
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
