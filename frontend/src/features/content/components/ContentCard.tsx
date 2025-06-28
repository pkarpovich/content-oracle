import { useCallback, useState } from "react";

import type { Activity } from "../../../api/activity.ts";
import { ActivityStatus } from "../../../api/activity.ts";
import type { Artist } from "../../../api/content.ts";
import { Category } from "../../../api/content.ts";
import { ActionButton } from "../../../components/ActionButton.tsx";
import { BottomSheet } from "../../../components/BottomSheet.tsx";
import { ProgressBar } from "../../../components/ProgressBar.tsx";
import { Typography } from "../../../components/Typography.tsx";
import AppleTvIcon from "../../../icons/apple-tv.svg";
import BoringIcon from "../../../icons/boring.svg";
import CheckIcon from "../../../icons/check.svg";
import EnterIcon from "../../../icons/enter.svg";
import ShareIcon from "../../../icons/share.svg";
import SkipIcon from "../../../icons/previous.svg";
import { useBlockChannel } from "../api/useBlockChannel.ts";
import { useMarkVideoStatus } from "../api/useMarkVideoStatus.ts";
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

    const allowCheckAction =
        category === Category.youtubeHistory ||
        category === Category.youTubeSuggestions ||
        category === Category.unsubscribedChannels;

    const allowBoringAction = category === Category.unsubscribedChannels;

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

            <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseBottomSheet}>
                <div className={styles.bottomSheetHeader}>
                    <Typography className={styles.bottomSheetTitle} variant="text">
                        {title}
                    </Typography>
                    <Typography className={styles.bottomSheetArtist} variant="text">
                        by {artist.name}
                    </Typography>
                </div>

                <div className={styles.actions}>
                    <ActionButton
                        icon={<EnterIcon />}
                        title="Open Content"
                        description="Watch this video in a new tab"
                        onClick={handleOpenButtonClick}
                    />

                    <ActionButton
                        icon={<ShareIcon />}
                        title="Copy Link"
                        description="Copy the video URL to clipboard"
                        onClick={handleShareButtonClick}
                    />

                    <ActionButton
                        icon={<AppleTvIcon />}
                        title="Send to TV"
                        description="Play this content on your TV"
                        onClick={handleSendToTvButtonClick}
                    />

                    <ActionButton
                        icon={<CheckIcon />}
                        title="Mark as Watched"
                        description="Mark as watched and remove from suggestions"
                        onClick={handleCheckButtonClick}
                    />

                    <ActionButton
                        icon={<SkipIcon />}
                        title="Skip Video"
                        description="Skip this video and remove from suggestions"
                        onClick={handleSkipButtonClick}
                    />

                    {allowBoringAction && (
                        <ActionButton
                            icon={<BoringIcon />}
                            title="Block Channel"
                            description="Hide all content from this channel"
                            onClick={handleBoringButtonClick}
                        />
                    )}
                </div>
            </BottomSheet>
        </>
    );
};
