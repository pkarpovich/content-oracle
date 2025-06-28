import { useCallback, useMemo, useState } from "react";

import { Category, categoryToHash } from "../../../api/content.ts";
import { ContentTriageModal } from "../../../components/ContentTriageModal.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { usePopup } from "../../../hooks/usePopup.ts";
import { ContentItem } from "../../../types/content.ts";
import { extractYouTubeVideoId } from "../../../utils/youtube.ts";
import { useAddToWatchlist } from "../api/useAddToWatchlist.ts";
import { useBlockChannel } from "../api/useBlockChannel.ts";
import { useCreateActivity } from "../api/useCreateActivity.ts";
import { useGetAllContent } from "../api/useGetAllContent.ts";
import { useMarkVideoStatus } from "../api/useMarkVideoStatus.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { ActionButton } from "./ActionButton.tsx";
import { AddToWatchlistPopup } from "./AddToWatchlistPopup.tsx";
import style from "./ContentCategoryList.module.css";
import { ContentList } from "./ContentList.tsx";
import { SendToTvPopupPopup } from "./SendToTvPopup.tsx";

const CustomCategoryOrder = [
    Category.liveStreams,
    Category.continueWatching,
    Category.watchLater,
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
    const { mutate: addToWatchlistMutation } = useAddToWatchlist();
    const { mutate: blockChannelMutation } = useBlockChannel();
    const { mutate: markVideoStatusMutation } = useMarkVideoStatus();
    
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
        const shuffledContent = [...content].sort(() => Math.random() - 0.5);
        setTriageContentItems(shuffledContent);
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
        markVideoStatusMutation({ videoId: item.id, status: "skipped" });
    }, [markVideoStatusMutation]);

    const handleMarkWatched = useCallback((item: ContentItem) => {
        markVideoStatusMutation({ videoId: item.id, status: "watched" });
    }, [markVideoStatusMutation]);

    const handleRemove = useCallback((item: ContentItem) => {
        markVideoStatusMutation({ videoId: item.id, status: "skipped" });
    }, [markVideoStatusMutation]);

    const handleSaveForLater = useCallback((item: ContentItem) => {
        const videoId = extractYouTubeVideoId(item.url);
        if (videoId) {
            addToWatchlistMutation(videoId);
        }
    }, [addToWatchlistMutation]);

    const handleNotInterested = useCallback((item: ContentItem) => {
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
