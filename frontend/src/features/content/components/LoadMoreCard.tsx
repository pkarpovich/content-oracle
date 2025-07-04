import { memo } from "react";
import styles from "./LoadMoreCard.module.css";

export const LoadMoreCard = memo(() => (
    <div className={styles.card}>
        <div className={styles.content}>
            <div className={styles.icon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <span className={styles.text}>Load More</span>
        </div>
    </div>
));