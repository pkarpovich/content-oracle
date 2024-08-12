import { useCallback } from "react";

import styles from "./ContentCard.module.css";

type Props = {
    imageUrl: string;
    title: string;
    url: string;
};

export const ContentCard = ({ imageUrl, title, url }: Props) => {
    const handleClick = useCallback(() => {
        window.open(url, "_blank");
    }, []);

    return (
        <div className={styles.card} onClick={handleClick}>
            <img alt={title} className={styles.image} src={imageUrl} />
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
            </div>
        </div>
    );
};
