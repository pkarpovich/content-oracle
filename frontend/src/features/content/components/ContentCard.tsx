import { useCallback } from "react";

import type { Activity } from "../../../api/activity.ts";
import { ActivityStatus } from "../../../api/activity.ts";
import { Category } from "../../../api/content.ts";
import { IconButton } from "../../../components/IconButton.tsx";
import { ProgressBar } from "../../../components/ProgressBar.tsx";
import { Typography } from "../../../components/Typography.tsx";
import AppleTvIcon from "../../../icons/apple-tv.svg";
import CheckIcon from "../../../icons/check.svg";
import EnterIcon from "../../../icons/enter.svg";
import ShareIcon from "../../../icons/share.svg";
import styles from "./ContentCard.module.css";

type Props = {
    artist: string;
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
        onCheck({ category, contentId: id, status: ActivityStatus.completed });
    }, [category, id, onCheck]);

    const allowCheckAction =
        category === Category.youtubeHistory ||
        category === Category.youTubeSuggestions ||
        category === Category.unsubscribedChannels;

    return (
        <div className={styles.card}>
            <div className={styles.actionsRow}>
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
                <Typography className={styles.artist} title={artist} variant="text">
                    {artist}
                </Typography>
            </div>
        </div>
    );
};
