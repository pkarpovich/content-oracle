import { useCallback, useEffect, useState } from "react";

import { VideoStatus } from "../api/content.ts";
import { useBlockChannel } from "../features/content/api/useBlockChannel.ts";
import { useGetContentTriage } from "../features/content/api/useGetContentTriage.ts";
import { useMarkVideoStatus } from "../features/content/api/useMarkVideoStatus.ts";
import { useTriageQueue, SortOption } from "../hooks/useTriageQueue.ts";
import { formatDate, formatRelativeTime } from "../utils/date.ts";
import { ExpiryIndicator } from "./ExpiryIndicator.tsx";
import BookmarkIcon from "../icons/add-bookmark.svg";
import CheckIcon from "../icons/check.svg";
import XIcon from "../icons/close.svg";
import EnterIcon from "../icons/enter.svg";
import SkipIcon from "../icons/previous.svg";
import ArrowLeftIcon from "../icons/arrow-left.svg";
import ArrowRightIcon from "../icons/arrow-right.svg";
import { ActionButton } from "./ActionButton.tsx";
import { BottomSheet } from "./BottomSheet.tsx";
import styles from "./ContentTriageModal.module.css";
import { Typography } from "./Typography.tsx";

type ContentTriageModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const ContentTriageModal = ({ isOpen, onClose }: ContentTriageModalProps) => {
    const { data: contentItems = [], error, isLoading } = useGetContentTriage();
    const { mutate: markVideoStatus } = useMarkVideoStatus();
    const { mutate: blockChannelApi } = useBlockChannel();
    const [sortBy, setSortBy] = useState<SortOption>(SortOption.DEFAULT);

    const {
        currentItem,
        currentIndex,
        activeQueue,
        progress,
        processItem,
        skipChannel,
        blockChannel,
        goToNext,
        goToPrevious,
        canGoNext,
        canGoPrevious,
        getChannelStats,
    } = useTriageQueue({
        items: contentItems,
        sortBy,
        onProcessItem: (item, status) => {
            markVideoStatus({ videoId: item.id, status });
        },
        onSkipChannel: (_, videoIds) => {
            videoIds.forEach((videoId) => {
                markVideoStatus({ videoId, status: VideoStatus.Skipped });
            });
        },
        onBlockChannel: (channelId) => {
            blockChannelApi({ channelId, isContentTriage: true });
        },
    });

    const handleAction = useCallback(
        (action: () => void) => {
            action();

            if (progress.isComplete) {
                onClose();
            }
        },
        [progress.isComplete, onClose],
    );

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (!currentItem) return;

            const keyActions: Record<string, () => void> = {
                ArrowLeft: goToPrevious,
                ArrowRight: goToNext,
                Enter: () => handleAction(() => processItem(VideoStatus.Watched)),
                Escape: onClose,
                Space: () => {
                    event.preventDefault();
                    handleAction(() => processItem(VideoStatus.Skipped));
                },
            };

            keyActions[event.code]?.();
        },
        [currentItem, goToPrevious, goToNext, handleAction, processItem, onClose],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyPress);
        return () => document.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    const handleOpenContent = useCallback(() => {
        if (currentItem) {
            window.open(currentItem.url, "_blank");
        }
    }, [currentItem]);

    if (isLoading) {
        return (
            <BottomSheet isOpen={isOpen} onClose={onClose} wide>
                <div className={styles.container}>
                    <div className={styles.leftColumn}>
                        <Typography variant="h3">Loading triage content...</Typography>
                        <Typography variant="text">Please wait while we fetch items for your review.</Typography>
                    </div>
                </div>
            </BottomSheet>
        );
    }

    if (error) {
        return (
            <BottomSheet isOpen={isOpen} onClose={onClose} wide>
                <div className={styles.container}>
                    <div className={styles.leftColumn}>
                        <Typography variant="h3">Error loading triage content</Typography>
                        <Typography variant="text">{error.message}</Typography>
                    </div>
                </div>
            </BottomSheet>
        );
    }

    if (!currentItem) {
        return (
            <BottomSheet isOpen={isOpen} onClose={onClose} wide>
                <div className={styles.container}>
                    <div className={styles.leftColumn}>
                        <Typography variant="h3">No items to triage</Typography>
                        <Typography variant="text">
                            All caught up! There are no items that need your attention right now.
                        </Typography>
                    </div>
                </div>
            </BottomSheet>
        );
    }

    const sortOptions = [
        { value: SortOption.DEFAULT, label: "Default" },
        { value: SortOption.NEWEST_FIRST, label: "Newest First" },
        { value: SortOption.OLDEST_FIRST, label: "Oldest First" },
        { value: SortOption.CHANNEL_NAME, label: "By Channel" },
    ];

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} wide>
            <div className={styles.sortingTabs}>
                {sortOptions.map((option) => (
                    <button
                        key={option.value}
                        className={`${styles.sortTab} ${sortBy === option.value ? styles.sortTabActive : ""}`}
                        onClick={() => setSortBy(option.value)}
                        type="button"
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className={styles.container}>
                <div className={styles.leftColumn}>
                    <div className={styles.preview}>
                        <img alt={currentItem.title} className={styles.previewImage} src={currentItem.thumbnail} />
                    </div>

                    <div className={styles.header}>
                        <Typography variant="h3">{currentItem.title}</Typography>
                        <Typography className={styles.artist} variant="text">
                            by {currentItem.artist.name}
                        </Typography>
                        {currentItem.publishedAt && (
                            <>
                                <Typography className={styles.publishedDate} variant="text">
                                    Published {formatRelativeTime(currentItem.publishedAt)} •{" "}
                                    {formatDate(currentItem.publishedAt, "MMM d, yyyy")}
                                </Typography>
                                <ExpiryIndicator publishedAt={currentItem.publishedAt} />
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.actions}>
                        <ActionButton
                            description="Watch this video in a new tab"
                            icon={<EnterIcon />}
                            onClick={() => handleAction(handleOpenContent)}
                            title="Open Content"
                        />
                        <ActionButton
                            description="Save the video for later viewing"
                            icon={<BookmarkIcon />}
                            onClick={() => handleAction(() => processItem(VideoStatus.WatchLater))}
                            title="Save for Later"
                        />
                        <ActionButton
                            description="Mark as watched and remove from suggestions"
                            icon={<CheckIcon />}
                            onClick={() => handleAction(() => processItem(VideoStatus.Watched))}
                            title="Mark as Watched"
                        />
                        <ActionButton
                            description="Skip this item and move to next"
                            icon={<SkipIcon />}
                            onClick={() => handleAction(() => processItem(VideoStatus.Skipped))}
                            title="Skip"
                        />
                        <ActionButton
                            description={`Skip all ${getChannelStats(currentItem.artist.id).remaining} videos from this channel`}
                            icon={<SkipIcon />}
                            onClick={() => handleAction(() => skipChannel())}
                            title="Skip Channel"
                        />
                        <ActionButton
                            description="Hide all content from this channel"
                            icon={<XIcon />}
                            onClick={() => handleAction(() => blockChannel())}
                            title="Block Channel"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.navigationBar}>
                <button className={styles.navButton} onClick={goToPrevious} disabled={!canGoPrevious} type="button">
                    <ArrowLeftIcon />
                    Previous
                </button>

                <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${activeQueue.length > 0 ? (currentIndex / activeQueue.length) * 100 : 0}%`,
                            }}
                        />
                    </div>
                    <Typography className={styles.progressText} variant="text">
                        Item {currentIndex} of {activeQueue.length}
                        {progress.processed > 0 && ` (${progress.processed} already processed)`}
                    </Typography>
                    <Typography className={styles.keyboardHints} variant="text">
                        ← → arrows • Space to skip • Enter to mark watched
                    </Typography>
                </div>

                <button className={styles.navButton} onClick={goToNext} disabled={!canGoNext} type="button">
                    Next
                    <ArrowRightIcon />
                </button>
            </div>
        </BottomSheet>
    );
};
