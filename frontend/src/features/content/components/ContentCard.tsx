import { useCallback } from "react";

import { IconButton } from "../../../components/IconButton.tsx";
import { ProgressBar } from "../../../components/ProgressBar.tsx";
import { Typography } from "../../../components/Typography.tsx";
import AppleTvIcon from "../../../icons/apple-tv.svg";
import EnterIcon from "../../../icons/enter.svg";
import ShareIcon from "../../../icons/share.svg";
import styles from "./ContentCard.module.css";

type Props = {
    imageUrl: string;
    isLive: boolean;
    onOpenUrl: (url: string) => void;
    position: number;
    title: string;
    url: string;
};

export const ContentCard = ({ imageUrl, isLive, onOpenUrl, position, title, url }: Props) => {
    const handleOpenButtonClick = useCallback(() => {
        window.open(url, "_blank");
    }, [url]);

    const handleShareButtonClick = useCallback(async () => {
        await navigator.clipboard.writeText(url);
    }, [url]);

    const handleSendToTvButtonClick = useCallback(() => {
        onOpenUrl(url);
    }, [onOpenUrl, url]);

    return (
        <div className={styles.card}>
            <div className={styles.actionsRow}>
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
                <Typography className={styles.title} variant="text">
                    {title}
                </Typography>
            </div>
        </div>
    );
};
