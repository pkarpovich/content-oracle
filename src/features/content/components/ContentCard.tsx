import { memo, useCallback, useMemo, useState } from "react";

import type { Artist, Category } from "../../../api/content.ts";
import { ProgressBar } from "../../../components/ProgressBar.tsx";
import { ResponsiveThumbnail } from "../../../components/ResponsiveThumbnail.tsx";
import { Typography } from "../../../components/Typography.tsx";
import { useContentCardBottomSheet } from "../../../contexts/ContentCardBottomSheetContext.tsx";
import styles from "./ContentCard.module.css";

type Props = {
    artist: Artist;
    category: Category;
    id: string;
    imageUrl: string;
    isLive: boolean;
    onOpenUrl: (url: string) => void;
    position: number;
    title: string;
    url: string;
};

export const ContentCard = memo(({ artist, category, id, imageUrl, isLive, position, title, url }: Props) => {
    const [imageError, setImageError] = useState(false);
    const { openBottomSheet } = useContentCardBottomSheet();

    const videoData = useMemo(
        () => ({
            artist,
            category,
            id,
            title,
            url,
        }),
        [id, url, title, artist, category],
    );

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleCardClick = useCallback(() => {
        openBottomSheet(videoData);
    }, [openBottomSheet, videoData]);

    return (
        <div className={styles.card} onClick={handleCardClick}>
            <div className={styles.imageContainer}>
                {imageError || !imageUrl ? (
                    <div className={styles.fallbackImage}>
                        <div className={styles.fallbackIcon}>
                            <svg
                                fill="none"
                                height="48"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                                width="48"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                ) : (
                    <ResponsiveThumbnail
                        alt={title}
                        className={styles.image}
                        fallbackSrc={imageUrl}
                        onError={handleImageError}
                        src={url || imageUrl}
                    />
                )}
                <ProgressBar isLive={isLive} progress={position} />
                <div className={styles.overlay}>
                    {isLive ? <span className={styles.liveIndicator}>LIVE</span> : null}
                </div>
                <div className={styles.content}>
                    <Typography className={styles.title} title={title} variant="text">
                        {title}
                    </Typography>
                    <div className={styles.metadata}>
                        <Typography className={styles.artist} title={artist.name} variant="text">
                            {artist.name}
                        </Typography>
                        {position > 0 ? (
                            <Typography className={styles.position} variant="text">
                                {Math.round(position)}%
                            </Typography>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
});
