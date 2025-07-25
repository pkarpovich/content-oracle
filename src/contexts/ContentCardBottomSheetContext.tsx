import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Artist } from '../api/content.ts';
import { Category } from '../api/content.ts';

type VideoData = {
  id: string;
  url: string;
  title: string;
  artist: Artist;
  category: Category;
};

type ContentCardBottomSheetContextType = {
  videoData: VideoData | null;
  openBottomSheet: (video: VideoData) => void;
  closeBottomSheet: () => void;
};

const ContentCardBottomSheetContext = createContext<ContentCardBottomSheetContextType | null>(null);

export const useContentCardBottomSheet = () => {
  const context = useContext(ContentCardBottomSheetContext);
  if (!context) {
    throw new Error('useContentCardBottomSheet must be used within a ContentCardBottomSheetProvider');
  }
  return context;
};

type Props = {
  children: ReactNode;
};

export const ContentCardBottomSheetProvider = ({ children }: Props) => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  const openBottomSheet = useCallback((video: VideoData) => {
    setVideoData(video);
  }, []);

  const closeBottomSheet = useCallback(() => {
    setVideoData(null);
  }, []);

  return (
    <ContentCardBottomSheetContext.Provider
      value={{
        videoData,
        openBottomSheet,
        closeBottomSheet,
      }}
    >
      {children}
    </ContentCardBottomSheetContext.Provider>
  );
};