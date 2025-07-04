import {useCallback, useEffect, useMemo, useState} from "react";

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
import { useGetContentTriage } from "../api/useGetContentTriage.ts";
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
    const { data: triageData, error: triageError } = useGetContentTriage();
    const { mutate: openContent } = useOpenContent();
    const { mutate: createActivity } = useCreateActivity();
    const { mutate: addToWatchlistMutation } = useAddToWatchlist();
    const { mutate: blockChannelMutation } = useBlockChannel();
    const { mutate: markVideoStatusMutation } = useMarkVideoStatus();
    
    const [currentTriageIndex, setCurrentTriageIndex] = useState(0);
    
    const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(() => {
        try {
            const stored = localStorage.getItem('contentCategoriesCollapsed');
            if (stored) {
                const parsedArray = JSON.parse(stored) as Category[];
                return new Set(parsedArray);
            }
        } catch (error) {
            console.warn('Failed to load collapsed categories from localStorage:', error);
        }
        return new Set();
    });

    const triageContentItems = triageData || [];

    useEffect(() => {
        if (isTriageModalOpen && triageContentItems.length === 0) {
            closeTriageModal();
        }
    }, [isTriageModalOpen, triageContentItems.length, closeTriageModal]);

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

    const handleOpenTriage = useCallback(() => {
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

    const handleSaveForLater = useCallback((item: ContentItem) => {
        const videoId = extractYouTubeVideoId(item.url);
        if (videoId) {
            addToWatchlistMutation(videoId);
        }
    }, [addToWatchlistMutation]);

    const handleNotInterested = useCallback((item: ContentItem) => {
        blockChannelMutation(item.artist.id);
    }, [blockChannelMutation]);

    const toggleCategoryCollapse = useCallback((category: Category) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            
            try {
                localStorage.setItem('contentCategoriesCollapsed', JSON.stringify(Array.from(newSet)));
            } catch (error) {
                console.warn('Failed to save collapsed categories to localStorage:', error);
            }
            
            return newSet;
        });
    }, []);

    const isCategoryCollapsed = useCallback((category: Category) => {
        return collapsedCategories.has(category);
    }, [collapsedCategories]);

    return (
        <>
            <ActionButton onAddToWatchlist={openWatchlistPopup} onSendToTv={openSendToTvPopup} onTriage={handleOpenTriage} />
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
                onSaveForLater={handleSaveForLater}
                onSkip={handleSkip}
            />
            {error ? <p>Error: {error.message}</p> : null}
            {triageError ? <p>Triage Error: {triageError.message}</p> : null}
            <div className={style.container}>
                {sortedEntries.map(([category, content]) => (
                    <div className={style.itemContainer} id={categoryToHash(category)} key={category}>
                        <button 
                            className={style.categoryHeader}
                            onClick={() => toggleCategoryCollapse(category)}
                            type="button"
                        >
                            <Typography className={style.categoryTitle} variant="h2">
                                {category}
                            </Typography>
                            <span className={style.categoryCount}>
                                {data.meta[category]?.total || content.length}
                            </span>
                            <div className={`${style.collapseIcon} ${isCategoryCollapsed(category) ? style.collapsed : ''}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </button>
                        {!isCategoryCollapsed(category) && (
                            <ContentList
                                category={category}
                                content={content}
                                key={category}
                                meta={data.meta[category]}
                                onCheck={createActivity}
                                onOpenUrl={openContent}
                            />
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};
