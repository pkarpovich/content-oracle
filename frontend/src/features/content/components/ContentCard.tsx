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
        onCheck({ category, status: ActivityStatus.completed, videoId: id });
        setIsBottomSheetOpen(false);
    }, [category, id, onCheck]);

    const handleBoringButtonClick = useCallback(() => {
        onCheck({ category, channelId: artist.id, status: ActivityStatus.blockChannel });
        setIsBottomSheetOpen(false);
    }, [artist.id, category, onCheck]);

    const allowCheckAction =
        category === Category.youtubeHistory ||
        category === Category.youTubeSuggestions ||
        category === Category.unsubscribedChannels;

    const allowBoringAction = category === Category.unsubscribedChannels;

    return (
        <>
            <div className={styles.card} onClick={handleCardClick}>
                <img alt={title} className={styles.image} src={imageUrl} />
                <ProgressBar isLive={isLive} progress={position} />
                <div className={styles.content}>
                    <Typography className={styles.title} title={title} variant="text">
                        {title}
                    </Typography>
                    <Typography className={styles.artist} title={artist.name} variant="text">
                        {artist.name}
                    </Typography>
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

                    {allowCheckAction && (
                        <ActionButton
                            icon={<CheckIcon />}
                            title="Mark as Watched"
                            description="Remove from suggestions"
                            onClick={handleCheckButtonClick}
                        />
                    )}

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
