import { lazy, Suspense } from 'react';
import { useContentCardBottomSheet } from '../contexts/ContentCardBottomSheetContext.tsx';
import { useOpenContent } from '../features/content/api/useOpenContent.ts';

const ContentCardBottomSheet = lazy(() => 
  import('../features/content/components/ContentCardBottomSheet.tsx').then(module => ({ 
    default: module.ContentCardBottomSheet 
  }))
);

export const GlobalContentCardBottomSheet = () => {
  const { videoData, closeBottomSheet } = useContentCardBottomSheet();
  const { mutate: openContent } = useOpenContent();

  if (!videoData) return null;

  return (
    <Suspense fallback={null}>
      <ContentCardBottomSheet
        id={videoData.id}
        url={videoData.url}
        title={videoData.title}
        artist={videoData.artist}
        category={videoData.category}
        onClose={closeBottomSheet}
        onOpenUrl={openContent}
      />
    </Suspense>
  );
};