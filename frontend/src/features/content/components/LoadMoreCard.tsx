import { memo } from "react";
import styles from "./LoadMoreCard.module.css";

type Props = {
    onClick?: () => void;
    isLoading?: boolean;
};

export const LoadMoreCard = memo(({ onClick, isLoading }: Props) => (
    <div className={styles.card} onClick={onClick}>
        <div className={styles.content}>
            <div className={styles.icon}>
                {isLoading ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                            <animate attributeName="stroke-dashoffset" values="32;0;32" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
            </div>
            <span className={styles.text}>{isLoading ? "Loading..." : "Load More"}</span>
        </div>
    </div>
));