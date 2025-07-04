import { useCallback, useEffect } from "react";

import { ContentItem } from "../types/content.ts";
import { ActionButton } from "./ActionButton.tsx";
import { BottomSheet } from "./BottomSheet.tsx";
import { Typography } from "./Typography.tsx";
import styles from "./ContentTriageModal.module.css";

import BookmarkIcon from "../icons/add-bookmark.svg";
import CheckIcon from "../icons/check.svg";
import EnterIcon from "../icons/enter.svg";
import SkipIcon from "../icons/previous.svg";
import XIcon from "../icons/close.svg";

type ContentTriageModalProps = {
    isOpen: boolean;
    onClose: () => void;
    contentItems: ContentItem[];
    currentIndex: number;
    onNext: () => void;
    onPrevious: () => void;
    onSkip: (item: ContentItem) => void;
    onMarkWatched: (item: ContentItem) => void;
    onSaveForLater: (item: ContentItem) => void;
    onNotInterested: (item: ContentItem) => void;
};

export const ContentTriageModal = ({
    isOpen,
    onClose,
    contentItems,
    currentIndex,
    onNext,
    onPrevious,
    onSkip,
    onMarkWatched,
    onSaveForLater,
    onNotInterested,
}: ContentTriageModalProps) => {
    const currentItem = contentItems[currentIndex];

    const handleAction = useCallback(
        (action: () => void) => {
            action();
            if (currentIndex < contentItems.length - 1) {
                return onNext();
            }

            onClose();
        },
        [currentIndex, contentItems.length, onNext, onClose]
    );

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (!isOpen) return;

            switch (event.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowLeft":
                    if (currentIndex > 0) onPrevious();
                    break;
                case "ArrowRight":
                    if (currentIndex < contentItems.length - 1) onNext();
                    break;
                case " ":
                    event.preventDefault();
                    handleAction(() => onSkip(currentItem));
                    break;
                case "Enter":
                    handleAction(() => onMarkWatched(currentItem));
                    break;
            }
        },
        [isOpen, currentIndex, contentItems.length, currentItem, onClose, onNext, onPrevious, onSkip, onMarkWatched, handleAction]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyPress);
        return () => document.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    const handleOpenContent = useCallback(() => {
        window.open(currentItem.url, "_blank");
    }, [currentItem]);

    if (!currentItem) return null;

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} wide>
                <div className={styles.container}>
                    <div className={styles.leftColumn}>
                        <div className={styles.preview}>
                            <img 
                                alt={currentItem.title}
                                className={styles.previewImage}
                                src={currentItem.thumbnail}
                            />
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
                                onClick={() => handleAction(() => onSaveForLater(currentItem))}
                                title="Save for Later"
                            />
                            <ActionButton
                                description="Mark as watched and remove from suggestions"
                                icon={<CheckIcon />}
                                onClick={() => handleAction(() => onMarkWatched(currentItem))}
                                title="Mark as Watched"
                            />
                            <ActionButton
                                description="Skip this item and move to next"
                                icon={<SkipIcon />}
                                onClick={() => handleAction(() => onSkip(currentItem))}
                                title="Skip"
                            />
                            <ActionButton
                                description="Hide similar content from this channel"
                                icon={<XIcon />}
                                onClick={() => handleAction(() => onNotInterested(currentItem))}
                                title="Not Interested"
                            />
                        </div>
                    </div>
                </div>
                
                <div className={styles.navigationBar}>
                    <button 
                        className={styles.navButton}
                        disabled={currentIndex === 0}
                        onClick={onPrevious}
                        type="button"
                    >
                        <svg fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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
                    
                    <button 
                        className={styles.navButton}
                        disabled={currentIndex === contentItems.length - 1}
                        onClick={onNext}
                        type="button"
                    >
                        Next
                        <svg fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </BottomSheet>
    );
};