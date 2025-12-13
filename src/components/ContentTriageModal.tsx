import { useCallback, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import { VideoStatus } from "../api/content.ts";
import { useBlockChannel } from "../features/content/api/useBlockChannel.ts";
import { useGetContentTriage } from "../features/content/api/useGetContentTriage.ts";
import { useMarkVideoStatus } from "../features/content/api/useMarkVideoStatus.ts";
import { useMarkVideoStatusBatch } from "../features/content/api/useMarkVideoStatusBatch.ts";
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

type ExitDirection = "left" | "right" | "up" | null;

type ContentTriageModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const ANIMATION_DURATION = 250;
const ENTRY_DELAY = 50;

export const ContentTriageModal = ({ isOpen, onClose }: ContentTriageModalProps) => {
    const { data: contentItems = [], error, isLoading } = useGetContentTriage();
    const { mutate: markVideoStatus } = useMarkVideoStatus();
    const { mutate: markVideoStatusBatch } = useMarkVideoStatusBatch();
    const { mutate: blockChannelApi } = useBlockChannel();
    const [sortBy, setSortBy] = useState<SortOption>(SortOption.DEFAULT);
    const [exitDirection, setExitDirection] = useState<ExitDirection>(null);
    const [isEntering, setIsEntering] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);

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
            markVideoStatusBatch({
                items: videoIds.map((videoId) => ({ videoId, status: VideoStatus.Skipped })),
            });
        },
        onBlockChannel: (channelId) => {
            blockChannelApi({ channelId, isContentTriage: true });
        },
    });

    const animateAndExecute = useCallback(
        (direction: ExitDirection, action: () => void) => {
            if (isAnimating) return;

            setIsAnimating(true);
            setExitDirection(direction);
            pendingActionRef.current = action;

            setTimeout(() => {
                action();
                setExitDirection(null);

                if (progress.isComplete) {
                    setIsAnimating(false);
                    pendingActionRef.current = null;
                    onClose();
                    return;
                }

                setTimeout(() => {
                    setIsEntering(true);
                    setTimeout(() => {
                        setIsEntering(false);
                        setIsAnimating(false);
                        pendingActionRef.current = null;
                    }, ANIMATION_DURATION);
                }, ENTRY_DELAY);
            }, ANIMATION_DURATION);
        },
        [isAnimating, progress.isComplete, onClose],
    );

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
            if (!currentItem || isAnimating) return;

            const keyActions: Record<string, () => void> = {
                ArrowLeft: goToPrevious,
                ArrowRight: goToNext,
                Enter: () => animateAndExecute("right", () => processItem(VideoStatus.Watched)),
                Escape: onClose,
                Space: () => {
                    event.preventDefault();
                    animateAndExecute("left", () => processItem(VideoStatus.Skipped));
                },
            };

            keyActions[event.code]?.();
        },
        [currentItem, isAnimating, goToPrevious, goToNext, animateAndExecute, processItem, onClose],
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
                        className={clsx(styles.sortTab, sortBy === option.value && styles.sortTabActive)}
                        onClick={() => setSortBy(option.value)}
                        type="button"
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className={styles.container}>
                <div className={clsx(styles.leftColumn, {
                    [styles.exitLeft]: exitDirection === "left",
                    [styles.exitRight]: exitDirection === "right",
                    [styles.exitUp]: exitDirection === "up",
                    [styles.entering]: isEntering,
                })}>
                    <div className={styles.preview}>
                        <img alt={currentItem.title} className={styles.previewImage} src={currentItem.thumbnail} />
                    </div>

                    <div className={styles.header}>
                        <Typography variant="h3">{currentItem.title}</Typography>
                        <div className={styles.channelBadge}>
                            <Typography className={styles.artist} variant="text">
                                {currentItem.artist.name}
                            </Typography>
                            {getChannelStats(currentItem.artist.id).remaining > 1 && (
                                <span className={styles.channelVideoBadge}>
                                    {getChannelStats(currentItem.artist.id).remaining} videos
                                </span>
                            )}
                        </div>
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
                    <div className={styles.actionGroups}>
                        <div className={styles.actionGroup}>
                            <Typography className={styles.actionGroupTitle} variant="text">
                                Item Actions
                            </Typography>
                            <div className={styles.actions}>
                                <ActionButton
                                    description="Open video in new tab"
                                    icon={<EnterIcon />}
                                    onClick={() => handleAction(handleOpenContent)}
                                    title="Open"
                                />
                                <ActionButton
                                    description="Add to watch later list"
                                    icon={<BookmarkIcon />}
                                    onClick={() => animateAndExecute("right", () => processItem(VideoStatus.WatchLater))}
                                    title="Save for Later"
                                    variant="primary"
                                />
                                <div className={clsx(styles.actions, styles.twoColumns)}>
                                    <ActionButton
                                        description="Mark as watched"
                                        icon={<CheckIcon />}
                                        onClick={() => animateAndExecute("right", () => processItem(VideoStatus.Watched))}
                                        title="Mark as Watched"
                                    />
                                    <ActionButton
                                        description="Skip this video"
                                        icon={<SkipIcon />}
                                        onClick={() => animateAndExecute("left", () => processItem(VideoStatus.Skipped))}
                                        title="Skip Item"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.actionGroup}>
                            <Typography className={styles.actionGroupTitle} variant="text">
                                Channel Actions
                            </Typography>
                            <div className={clsx(styles.actions, getChannelStats(currentItem.artist.id).remaining > 1 && styles.twoColumns)}>
                                {getChannelStats(currentItem.artist.id).remaining > 1 && (
                                    <ActionButton
                                        description="Hide channel this session"
                                        icon={
                                            <div className={styles.channelCountIcon}>
                                                <SkipIcon />
                                                <span className={styles.channelCount}>
                                                    {getChannelStats(currentItem.artist.id).remaining}
                                                </span>
                                            </div>
                                        }
                                        onClick={() => animateAndExecute("up", () => skipChannel())}
                                        title="Mute Channel"
                                    />
                                )}
                                <ActionButton
                                    description="Block channel permanently"
                                    icon={<XIcon />}
                                    onClick={() => animateAndExecute("up", () => blockChannel())}
                                    title="Block Channel"
                                    variant="danger"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.navigationBar}>
                <button className={styles.navButton} onClick={goToPrevious} disabled={!canGoPrevious} type="button">
                    <ArrowLeftIcon />
                    Previous
                </button>

                <div className={styles.progressSection}>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: `${activeQueue.length > 0 ? (currentIndex / activeQueue.length) * 100 : 0}%`,
                                }}
                            />
                        </div>
                        <span className={styles.progressCount}>
                            {currentIndex}/{activeQueue.length}
                        </span>
                    </div>
                    {progress.processed > 0 && (
                        <Typography className={styles.processedCount} variant="text">
                            {progress.processed} processed this session
                        </Typography>
                    )}
                    <Typography className={styles.keyboardHints} variant="text">
                        ← → • Space skip • Enter watched
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
