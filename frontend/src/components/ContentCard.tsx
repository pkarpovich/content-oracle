import { useCallback } from "react";

import AppleTvIcon from "../icons/apple-tv.svg";
import EnterIcon from "../icons/enter.svg";
import ShareIcon from "../icons/share.svg";
import styles from "./ContentCard.module.css";
import { IconButton } from "./IconButton.tsx";

type Props = {
    imageUrl: string;
    onOpenUrl: (url: string) => void;
    title: string;
    url: string;
};

export const ContentCard = ({ imageUrl, onOpenUrl, title, url }: Props) => {
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
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
            </div>
        </div>
    );
};
