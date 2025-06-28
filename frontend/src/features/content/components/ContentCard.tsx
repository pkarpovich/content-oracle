import { useCallback, useState } from "react";

import type { Activity } from "../../../api/activity.ts";
import type { Artist } from "../../../api/content.ts";
import { Category } from "../../../api/content.ts";
import { ProgressBar } from "../../../components/ProgressBar.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { extractYouTubeVideoId } from "../../../utils/youtube.ts";
import { useAddToWatchlist } from "../api/useAddToWatchlist.ts";
import { useBlockChannel } from "../api/useBlockChannel.ts";
import { useMarkVideoStatus } from "../api/useMarkVideoStatus.ts";
import { ContentCardBottomSheet } from "./ContentCardBottomSheet.tsx";
import styles from "./ContentCard.module.css";

type Props = {
    artist: Artist;
    category: Category;
    id: string;
    imageUrl: string;
    isLive: boolean;
    onCheck: (activity: Activity) => void;
    onOpenUrl: (url: string) => void;
    position: number;
    title: string;
    url: string;
};

export const ContentCard = ({
    artist,
    category,
    id,
    imageUrl,
    isLive,
    onCheck,
    onOpenUrl,
    position,
    title,
    url,
}: Props) => {
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { mutate: addToWatchlistMutation } = useAddToWatchlist();
    const { mutate: blockChannelMutation } = useBlockChannel();
    const { mutate: markVideoStatusMutation } = useMarkVideoStatus();

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleCardClick = useCallback(() => {
        setIsBottomSheetOpen(true);
    }, []);

    const handleCloseBottomSheet = useCallback(() => {
        setIsBottomSheetOpen(false);
    }, []);

    const handleOpenButtonClick = useCallback(() => {
        window.open(url, "_blank");
        setIsBottomSheetOpen(false);
    }, [url]);

    const handleShareButtonClick = useCallback(async () => {
        await navigator.clipboard.writeText(url);
        setIsBottomSheetOpen(false);
    }, [url]);

    const handleSendToTvButtonClick = useCallback(() => {
        onOpenUrl(url);
        setIsBottomSheetOpen(false);
    }, [onOpenUrl, url]);

    const handleCheckButtonClick = useCallback(() => {
        markVideoStatusMutation({ videoId: id, status: "watched" });
        setIsBottomSheetOpen(false);
    }, [id, markVideoStatusMutation]);

    const handleBoringButtonClick = useCallback(() => {
        blockChannelMutation(artist.id);
        setIsBottomSheetOpen(false);
    }, [artist.id, blockChannelMutation]);

    const handleSkipButtonClick = useCallback(() => {
        markVideoStatusMutation({ videoId: id, status: "skipped" });
        setIsBottomSheetOpen(false);
    }, [id, markVideoStatusMutation]);

    const handleSaveForLaterButtonClick = useCallback(() => {
        if (category === Category.watchLater) {
            markVideoStatusMutation({ videoId: id, status: "" });
        } else {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
                addToWatchlistMutation(videoId);
            }
        }
        setIsBottomSheetOpen(false);
    }, [category, id, url, addToWatchlistMutation, markVideoStatusMutation]);


    return (
        <>
            <div className={styles.card} onClick={handleCardClick}>
                <div className={styles.imageContainer}>
                    {imageError || !imageUrl ? (
                        <div className={styles.fallbackImage}>
                            <div className={styles.fallbackIcon}>
                                <svg fill="none" height="48" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <img 
                            alt={title} 
                            className={styles.image} 
                            onError={handleImageError}
                            src={imageUrl} 
                        />
                    )}
                    <ProgressBar isLive={isLive} progress={position} />
                    <div className={styles.overlay}>
                        {isLive && <span className={styles.liveIndicator}>LIVE</span>}
                    </div>
                    <div className={styles.content}>
                        <Typography className={styles.title} title={title} variant="text">
                            {title}
                        </Typography>
                        <div className={styles.metadata}>
                            <Typography className={styles.artist} title={artist.name} variant="text">
                                {artist.name}
                            </Typography>
                            {position > 0 && (
                                <Typography className={styles.position} variant="text">
                                    {Math.round(position)}%
                                </Typography>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isBottomSheetOpen && (<ContentCardBottomSheet
                    artist={artist}
                    category={category}
                    isOpen={isBottomSheetOpen}
                    onBoringButtonClick={handleBoringButtonClick}
                    onCheckButtonClick={handleCheckButtonClick}
                    onClose={handleCloseBottomSheet}
                    onOpenButtonClick={handleOpenButtonClick}
                    onSaveForLaterButtonClick={handleSaveForLaterButtonClick}
                    onSendToTvButtonClick={handleSendToTvButtonClick}
                    onShareButtonClick={handleShareButtonClick}
                    onSkipButtonClick={handleSkipButtonClick}
                    title={title}
            />)}
        </>
    );
};
