import { useCallback } from "react";

import type { Activity } from "../../../api/activity.ts";
import { ActivityStatus } from "../../../api/activity.ts";
import type { Artist } from "../../../api/content.ts";
import { Category } from "../../../api/content.ts";
import { IconButton } from "../../../components/IconButton.tsx";
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
    const handleOpenButtonClick = useCallback(() => {
        window.open(url, "_blank");
    }, [url]);

    const handleShareButtonClick = useCallback(async () => {
        await navigator.clipboard.writeText(url);
    }, [url]);

    const handleSendToTvButtonClick = useCallback(() => {
        onOpenUrl(url);
    }, [onOpenUrl, url]);

    const handleCheckButtonClick = useCallback(() => {
        onCheck({ category, status: ActivityStatus.completed, videoId: id });
    }, [category, id, onCheck]);

    const handleBoringButtonClick = useCallback(() => {
        onCheck({ category, channelId: artist.id, status: ActivityStatus.blockChannel });
    }, [artist.id, category, onCheck]);

    const allowCheckAction =
        category === Category.youtubeHistory ||
        category === Category.youTubeSuggestions ||
        category === Category.unsubscribedChannels;

    const allowBoringAction = category === Category.unsubscribedChannels;

    return (
        <div className={styles.card}>
            <div className={styles.actionsRow}>
                {allowBoringAction ? (
                    <IconButton onClick={handleBoringButtonClick}>
                        <BoringIcon />
                    </IconButton>
                ) : null}
                {allowCheckAction ? (
                    <IconButton onClick={handleCheckButtonClick}>
                        <CheckIcon />
                    </IconButton>
                ) : null}
                <IconButton onClick={handleShareButtonClick}>
                    <ShareIcon />
                </IconButton>
                <IconButton onClick={handleSendToTvButtonClick}>
                    <AppleTvIcon />
                </IconButton>
                <IconButton onClick={handleOpenButtonClick}>
                    <EnterIcon />
                </IconButton>
            </div>
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
    );
};
