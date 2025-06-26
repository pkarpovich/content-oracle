import { useCallback, useMemo, useState } from "react";

import { Category, categoryToHash } from "../../../api/content.ts";
import { ContentTriageModal } from "../../../components/ContentTriageModal.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { usePopup } from "../../../hooks/usePopup.ts";
import { ContentItem } from "../../../types/content.ts";
import { useBlockChannel } from "../api/useBlockChannel.ts";
import { useCreateActivity } from "../api/useCreateActivity.ts";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { ActionButton } from "./ActionButton.tsx";
import { AddToWatchlistPopup } from "./AddToWatchlistPopup.tsx";
import style from "./ContentCategoryList.module.css";
import { ContentList } from "./ContentList.tsx";
import { SendToTvPopupPopup } from "./SendToTvPopup.tsx";

const CustomCategoryOrder = [
    Category.liveStreams,
    Category.youtubeHistory,
    Category.youTubeWatchlist,
    Category.youTubeSuggestions,
    Category.unsubscribedChannels,
];

export const ContentCategoryList = () => {
    const { close: closeWatchlistPopup, isOpen: isWatchlistPopupOpen, open: openWatchlistPopup } = usePopup();
    const { close: closeSendToTvPopup, isOpen: isSendToTvPopupOpen, open: openSendToTvPopup } = usePopup();
    const { close: closeTriageModal, isOpen: isTriageModalOpen, open: openTriageModal } = usePopup();
    const { data, error } = useGetAllContent();
    const { mutate: openContent } = useOpenContent();
    const { mutate: createActivity } = useCreateActivity();
    const { mutate: blockChannelMutation } = useBlockChannel();
    
    const [triageContentItems, setTriageContentItems] = useState<ContentItem[]>([]);
    const [currentTriageIndex, setCurrentTriageIndex] = useState(0);

    const sortedEntries = useMemo(
        () =>
            Array.from(data.groupedContent.entries()).sort(([categoryA], [categoryB]) => {
                const indexA = CustomCategoryOrder.indexOf(categoryA);
                const indexB = CustomCategoryOrder.indexOf(categoryB);

                if (indexA === -1) {
                    return 1;
                }
                if (indexB === -1) {
                    return -1;
                }

                return indexA - indexB;
            }),
        [data.groupedContent],
    );

    const handleOpenTriage = useCallback((content: ContentItem[]) => {
        setTriageContentItems(content);
        setCurrentTriageIndex(0);
        openTriageModal();
    }, [openTriageModal]);

    const handleTriageNext = useCallback(() => {
        setCurrentTriageIndex(prev => Math.min(prev + 1, triageContentItems.length - 1));
    }, [triageContentItems.length]);

    const handleTriagePrevious = useCallback(() => {
        setCurrentTriageIndex(prev => Math.max(prev - 1, 0));
    }, []);

    const handleSkip = useCallback((item: ContentItem) => {
        console.log("Skipped:", item.title);
    }, []);

    const handleMarkWatched = useCallback((item: ContentItem) => {
        console.log("Marked as watched:", item.title);
        createActivity({ contentId: item.id, type: "watched" });
    }, [createActivity]);

    const handleRemove = useCallback((item: ContentItem) => {
        console.log("Removed:", item.title);
    }, []);

    const handleSaveForLater = useCallback((item: ContentItem) => {
        console.log("Saved for later:", item.title);
    }, []);

    const handleNotInterested = useCallback((item: ContentItem) => {
        console.log("Not interested:", item.title);
        blockChannelMutation(item.artist.id);
    }, [blockChannelMutation]);

    return (
        <>
            <ActionButton onAddToWatchlist={openWatchlistPopup} onSendToTv={openSendToTvPopup} onTriage={() => handleOpenTriage(data.allContent)} />
            <AddToWatchlistPopup isOpen={isWatchlistPopupOpen} onClose={closeWatchlistPopup} />
            <SendToTvPopupPopup isOpen={isSendToTvPopupOpen} onClose={closeSendToTvPopup} />
            <ContentTriageModal
                contentItems={triageContentItems}
                currentIndex={currentTriageIndex}
                isOpen={isTriageModalOpen}
                onClose={closeTriageModal}
                onMarkWatched={handleMarkWatched}
                onNext={handleTriageNext}
                onNotInterested={handleNotInterested}
                onPrevious={handleTriagePrevious}
                onRemove={handleRemove}
                onSaveForLater={handleSaveForLater}
                onSkip={handleSkip}
            />
            {error ? <p>Error: {error.message}</p> : null}
            <div className={style.container}>
                {sortedEntries.map(([category, content]) => (
                    <div className={style.itemContainer} id={categoryToHash(category)} key={category}>
                        <Typography className={style.categoryTitle} variant="h2">
                            {category}
                        </Typography>
                        <ContentList
                            category={category}
                            content={content}
                            key={category}
                            onCheck={createActivity}
                            onOpenUrl={openContent}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};
