import { useCallback, useEffect, useState } from "react";

import { VideoStatus } from "../api/content.ts";
import { useBlockChannel } from "../features/content/api/useBlockChannel.ts";
import { useGetContentTriage } from "../features/content/api/useGetContentTriage.ts";
import { useMarkVideoStatus } from "../features/content/api/useMarkVideoStatus.ts";
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
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data: contentItems = [], error, isLoading } = useGetContentTriage();
    const { mutate: markVideoStatus } = useMarkVideoStatus();
    const { mutate: blockChannel } = useBlockChannel();

    const currentItem = contentItems[currentIndex];

    const handleNavigate = useCallback(
        (direction: number) => {
            setCurrentIndex((prev) => {
                let newIndex = prev + direction;

                // Find the next/previous item that hasn't been skipped
                while (newIndex >= 0 && newIndex < contentItems.length) {
                    const item = contentItems[newIndex];
                    if (!item.status || item.status !== VideoStatus.Skipped) {
                        break;
                    }
                    newIndex += direction;
                }

                // If we reached the end and all items are skipped, stay at current position
                if (newIndex < 0 || newIndex >= contentItems.length) {
                    return prev;
                }

                return newIndex;
            });
        },
        [contentItems],
    );

    const handleNext = useCallback(() => handleNavigate(1), [handleNavigate]);
    const handlePrevious = useCallback(() => handleNavigate(-1), [handleNavigate]);

    const handleAction = useCallback(
        (action: () => void) => {
            action();
            if (currentIndex < contentItems.length - 1) {
                return handleNext();
            }

            onClose();
        },
        [currentIndex, contentItems.length, handleNext, onClose],
    );

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            const keyActions: Record<string, () => void> = {
                ArrowLeft: () => handleNavigate(-1),
                ArrowRight: () => handleNavigate(1),
                Enter: () =>
                    handleAction(() => markVideoStatus({ status: VideoStatus.Watched, videoId: currentItem.id })),
                Escape: () => onClose(),
                Space: () => {
                    event.preventDefault();
                    handleAction(() => markVideoStatus({ status: VideoStatus.Skipped, videoId: currentItem.id }));
                },
            };

            keyActions[event.code]?.();
        },
        [currentItem, handleNavigate, handleAction, markVideoStatus, onClose],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyPress);
        return () => document.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    const handleOpenContent = useCallback(() => {
        window.open(currentItem.url, "_blank");
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

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} wide>
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
                            onClick={() =>
                                handleAction(() =>
                                    markVideoStatus({ status: VideoStatus.WatchLater, videoId: currentItem.id }),
                                )
                            }
                            title="Save for Later"
                        />
                        <ActionButton
                            description="Mark as watched and remove from suggestions"
                            icon={<CheckIcon />}
                            onClick={() =>
                                handleAction(() =>
                                    markVideoStatus({ status: VideoStatus.Watched, videoId: currentItem.id }),
                                )
                            }
                            title="Mark as Watched"
                        />
                        <ActionButton
                            description="Skip this item and move to next"
                            icon={<SkipIcon />}
                            onClick={() =>
                                handleAction(() =>
                                    markVideoStatus({ status: VideoStatus.Skipped, videoId: currentItem.id }),
                                )
                            }
                            title="Skip"
                        />
                        <ActionButton
                            description="Hide similar content from this channel"
                            icon={<XIcon />}
                            onClick={() =>
                                handleAction(() =>
                                    blockChannel({
                                        channelId: currentItem.artist.id,
                                        isContentTriage: true,
                                    }),
                                )
                            }
                            title="Not Interested"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.navigationBar}>
                <button className={styles.navButton} onClick={handlePrevious} type="button">
                    <ArrowLeftIcon />
                    Previous
                </button>

                <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${((currentIndex + 1) / contentItems.length) * 100}%` }}
                        />
                    </div>
                    <Typography className={styles.progressText} variant="text">
                        {currentIndex + 1} of {contentItems.length}
                    </Typography>
                    <Typography className={styles.keyboardHints} variant="text">
                        ← → arrows • Space to skip • Enter to mark watched
                    </Typography>
                </div>

                <button className={styles.navButton} onClick={handleNext} type="button">
                    Next
                    <ArrowRightIcon />
                </button>
            </div>
        </BottomSheet>
    );
};
